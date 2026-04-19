const Redis = require('ioredis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const config = require('../config');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.cacheKeys = RedisClient.cacheKeys;
  }

  async connect() {
    if (!config.redis.url) {
      logger.warn('Redis URL not configured. Redis caching disabled.');
      return false;
    }

    try {
      this.client = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailures: (retryCount) => Math.min(retryCount * 200, 3000),
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.error('Redis error:', err.message);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

      await this.client.connect();
      return this.isConnected;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  // Cache operations with TTL
  async get(key) {
    if (!this.isConnected) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected) return false;
    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error.message);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error.message);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error.message);
      return false;
    }
  }

  // Hash operations for structured data
  async hget(key, field) {
    if (!this.isConnected) return null;
    try {
      const data = await this.client.hget(key, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis HGET error:`, error.message);
      return null;
    }
  }

  async hset(key, field, value, ttlSeconds = null) {
    if (!this.isConnected) return false;
    try {
      const serialized = JSON.stringify(value);
      await this.client.hset(key, field, serialized);
      if (ttlSeconds) {
        await this.client.expire(key, ttlSeconds);
      }
      return true;
    } catch (error) {
      logger.error(`Redis HSET error:`, error.message);
      return false;
    }
  }

  async hgetall(key) {
    if (!this.isConnected) return null;
    try {
      const data = await this.client.hgetall(key);
      if (!data) return null;
      
      // Parse all fields
      const result = {};
      for (const [field, value] of Object.entries(data)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result;
    } catch (error) {
      logger.error(`Redis HGETALL error:`, error.message);
      return null;
    }
  }

  // List operations for queues
  async lpush(key, ...values) {
    if (!this.isConnected) return 0;
    try {
      const serialized = values.map(v => JSON.stringify(v));
      return await this.client.lpush(key, ...serialized);
    } catch (error) {
      logger.error(`Redis LPUSH error:`, error.message);
      return 0;
    }
  }

  async rpop(key) {
    if (!this.isConnected) return null;
    try {
      const data = await this.client.rpop(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis RPOP error:`, error.message);
      return null;
    }
  }

  async llen(key) {
    if (!this.isConnected) return 0;
    try {
      return await this.client.llen(key);
    } catch (error) {
      logger.error(`Redis LLEN error:`, error.message);
      return 0;
    }
  }

  // Rate limiting operations
  async incrementRateLimit(identifier, endpoint, windowMs) {
    if (!this.isConnected) return { count: 0, resetTime: Date.now() + windowMs };
    
    const key = `ratelimit:${identifier}:${endpoint}`;
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const windowKey = `${key}:${windowStart}`;

    try {
      const multi = this.client.multi();
      multi.incr(windowKey);
      multi.expireat(windowKey, Math.ceil((windowStart + windowMs) / 1000));
      const results = await multi.exec();
      
      const count = results[0][1];
      return {
        count,
        resetTime: windowStart + windowMs,
        remaining: Math.max(0, 100 - count), // Assuming 100 max requests
      };
    } catch (error) {
      logger.error(`Redis rate limit error:`, error.message);
      return { count: 0, resetTime: now + windowMs };
    }
  }

  // Session operations
  async getSession(sessionId) {
    return await this.get(`session:${sessionId}`);
  }

  async setSession(sessionId, sessionData, ttlSeconds = 86400) {
    return await this.set(`session:${sessionId}`, sessionData, ttlSeconds);
  }

  async deleteSession(sessionId) {
    return await this.del(`session:${sessionId}`);
  }

  // Cache keys helpers
  static cacheKeys = {
    steamProfile: (steamId) => `steam:profile:${steamId}`,
    playerMatches: (accountId) => `player:matches:${accountId}`,
    matchDetails: (matchId) => `match:details:${matchId}`,
    heroData: () => 'game:heroes',
    itemData: () => 'game:items',
    rankData: () => 'game:ranks',
    userFavorites: (userId) => `user:favorites:${userId}`,
    userProfile: (accountId) => `player:profile:${accountId}`,
  };
}

// Singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
