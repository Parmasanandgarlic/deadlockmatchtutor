const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const config = require('../config');
const logger = require('../utils/logger');
const redisClient = require('./redis.service');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for user storage (lazy initialization)
let supabase = null;
const getSupabaseClient = () => {
  if (!supabase) {
    const isConfigured =
      config.supabase.url &&
      config.supabase.url !== 'https://placeholder.supabase.co' &&
      config.supabase.serviceRoleKey;

    if (!isConfigured) {
      logger.warn('Supabase not configured - some auth features will be disabled');
      return null;
    }
    supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabase;
};

function getAuthBaseUrl() {
  return process.env.AUTH_CALLBACK_BASE_URL || (config.isDev
    ? `http://localhost:${config.port}`
    : 'https://www.aftermatch.xyz');
}

class AuthService {
  constructor() {
    this.passport = passport;
    this.sessionMiddleware = null;
    this.isConfigured = false;
  }

  initialize() {
    if (!process.env.STEAM_API_KEY) {
      logger.warn('STEAM_API_KEY not configured. Steam authentication disabled.');
      return false;
    }

    if (!config.isDev && !process.env.SESSION_SECRET) {
      logger.error('SESSION_SECRET is required when Steam authentication is enabled in production.');
      return false;
    }

    if (!getSupabaseClient()) {
      logger.warn('Supabase service role key missing. Steam authentication disabled.');
      return false;
    }

    const authBaseUrl = getAuthBaseUrl();

    // Configure Passport with Steam strategy
    this.passport.use(
      new SteamStrategy(
        {
          returnURL: `${authBaseUrl}/api/auth/steam/return`,
          realm: authBaseUrl,
          apiKey: process.env.STEAM_API_KEY,
        },
        async (identifier, profile, done) => {
          try {
            const steamId = profile.id;
            
            // Extract profile data
            const userData = {
              steam_id: steamId,
              steam_username: profile.displayName,
              avatar_url: profile.photos?.[2]?.value || profile.photos?.[0]?.value,
              profile_url: profile._json.profileurl,
              persona_state: profile._json.personastate,
            };

            // Get or create user in database
            const db = getSupabaseClient();
            if (!db) {
              return done(new Error('Authentication database is not configured.'));
            }

            const { data, error } = await db.rpc('get_or_create_user', {
              p_steam_id: userData.steam_id,
              p_username: userData.steam_username,
              p_avatar_url: userData.avatar_url,
              p_profile_url: userData.profile_url,
            });

            if (error) {
              logger.error('Error creating/fetching user:', error.message);
              return done(error);
            }

            const user = {
              id: data[0].id,
              steamId: data[0].steam_id,
              username: userData.steam_username,
              avatar: userData.avatar_url,
              profileUrl: userData.profile_url,
              isPremium: false,
            };

            return done(null, user);
          } catch (error) {
            logger.error('Steam auth error:', error.message);
            return done(error);
          }
        }
      )
    );

    // Serialize user for session
    this.passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    // Deserialize user from session
    this.passport.deserializeUser(async (id, done) => {
      try {
        const db = getSupabaseClient();
        if (!db) return done(null, false);

        const { data, error } = await db
          .from('users')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          return done(null, false);
        }

        const user = {
          id: data.id,
          steamId: data.steam_id,
          username: data.steam_username,
          avatar: data.avatar_url,
          profileUrl: data.profile_url,
          isPremium: data.is_premium,
        };

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    });

    // Create session middleware
    const sessionOptions = {
      secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
      resave: false,
      saveUninitialized: false,
      store: redisClient.isConnected ? this.createRedisStore() : undefined,
      cookie: {
        secure: !config.isDev,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax',
        domain: config.isDev ? undefined : '.aftermatch.xyz',
      },
      name: 'aftermatch.sid',
    };

    this.sessionMiddleware = session(sessionOptions);
    this.isConfigured = true;

    logger.info('Steam authentication initialized successfully');
    return true;
  }

  createRedisStore() {
    // Simple Redis store implementation
    const Store = require('express-session').Store;

    class RedisStore extends Store {
      constructor(options) {
        super(options);
      }

      get(sid, callback) {
        redisClient.getSession(sid)
          .then(session => callback(null, session))
          .catch(err => callback(err));
      }

      set(sid, sess, callback) {
        redisClient.setSession(sid, sess, 7 * 24 * 60 * 60)
          .then(() => callback(null))
          .catch(err => callback(err));
      }

      destroy(sid, callback) {
        redisClient.deleteSession(sid)
          .then(() => callback(null))
          .catch(err => callback(err));
      }

      touch(sid, sess, callback) {
        redisClient.setSession(sid, sess, 7 * 24 * 60 * 60)
          .then(() => callback(null))
          .catch(err => callback(err));
      }
    }

    return new RedisStore();
  }

  getMiddlewares() {
    if (!this.isConfigured) {
      return {
        sessionMiddleware: (req, res, next) => next(),
        passportInitialize: (req, res, next) => next(),
        passportSession: (req, res, next) => next(),
      };
    }

    return {
      sessionMiddleware: this.sessionMiddleware,
      passportInitialize: this.passport.initialize(),
      passportSession: this.passport.session(),
    };
  }

  isAuthenticated() {
    return (req, res, next) => {
      if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
        return next();
      }
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      return res.redirect('/login');
    };
  }

  async getCurrentUser(req) {
    if (!req.user) return null;
    
    try {
      const db = getSupabaseClient();
      if (!db) return null;

      const { data, error } = await db
        .from('users')
        .select('id, steam_id, steam_username, avatar_url, profile_url, is_premium, settings')
        .eq('id', req.user.id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        steamId: data.steam_id,
        username: data.steam_username,
        avatar: data.avatar_url,
        profileUrl: data.profile_url,
        isPremium: data.is_premium,
        settings: data.settings,
      };
    } catch (error) {
      logger.error('Error fetching current user:', error.message);
      return null;
    }
  }

  async getUserProfile(accountId) {
    try {
      const db = getSupabaseClient();
      if (!db) return null;

      const { data, error } = await db
        .from('player_profiles')
        .select('*')
        .eq('account_id', accountId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching player profile:', error.message);
      return null;
    }
  }

  async updateUserSettings(userId, settings) {
    try {
      const db = getSupabaseClient();
      if (!db) return null;

      const { data, error } = await db
        .from('users')
        .update({ settings, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating user settings:', error.message);
      return null;
    }
  }

  async addToFavorites(userId, favoriteType, targetId, notes = null) {
    try {
      const db = getSupabaseClient();
      if (!db) return null;

      const { data, error } = await db
        .from('favorites')
        .insert({
          user_id: userId,
          favorite_type: favoriteType,
          target_id: targetId,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error adding to favorites:', error.message);
      return null;
    }
  }

  async removeFromFavorites(userId, favoriteType, targetId) {
    try {
      const db = getSupabaseClient();
      if (!db) return false;

      const { error } = await db
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('favorite_type', favoriteType)
        .eq('target_id', targetId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error removing from favorites:', error.message);
      return false;
    }
  }

  async getUserFavorites(userId, favoriteType = null) {
    try {
      const db = getSupabaseClient();
      if (!db) return [];

      let query = db
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (favoriteType) {
        query = query.eq('favorite_type', favoriteType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching user favorites:', error.message);
      return [];
    }
  }

  async trackEvent(userId, eventType, eventData, ipAddress, userAgent) {
    try {
      const db = getSupabaseClient();
      if (!db) return;

      await db
        .from('usage_analytics')
        .insert({
          user_id: userId,
          event_type: eventType,
          event_data: eventData,
          ip_address: ipAddress,
          user_agent: userAgent,
        });
    } catch (error) {
      logger.error('Error tracking event:', error.message);
    }
  }
}

// Singleton instance
const authService = new AuthService();

module.exports = authService;
