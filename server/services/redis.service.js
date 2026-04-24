const Redis = require('ioredis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const config = require('../config');
const logger = require('../utils/logger');

/**
 * RedisClient — Singleton wrapper around ioredis.
 *
 * Architecture decisions:
 *   - Production REQUIRES Redis (rate-limiting, sessions, distributed cache).
 *     If REDIS_URL is missing in production, the process exits immediately.
 *   - Development falls back to a no-op stub so devs can run without Redis.
 *   - A connection guard (`_connectPromise`) prevents duplicate connections
 *     on Vercel cold-starts or rapid restarts.
 *   - SIGTERM / SIGINT handlers ensure clean disconnect.
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.cacheKeys = RedisClient.cacheKeys;
    /** @type {Promise<boolean>|null} guards against duplicate connect() calls */
    this._connectPromise = null;
  }

  /**
   * Establish the Redis connection. Safe to call multiple times — subsequent
   * calls return the same promise until the connection is closed.
   * @returns {Promise<boolean>} true if connected, false if unavailable (dev only)
   */
  async connect() {
    // Return existing connection attempt if one is in-flight
    if (this._connectPromise) return this._connectPromise;

    this._connectPromise = this._doConnect();
    return this._connectPromise;
  }

  /** @private */
  async _doConnect() {
    if (!config.redis.url) {
      if (config.nodeEnv === 'production') {
        logger.error(
          'FATAL: REDIS_URL is not configured. Redis is REQUIRED in production ' +
          'for rate-limiting, session storage, and caching. ' +
          'Set the REDIS_URL environment variable and redeploy.'
        );
        // Give the logger time to flush before crashing
        await new Promise((r) => setTimeout(r, 200));
        process.exit(1);
      }

      logger.warn(
        'Redis URL not configured — running with in-memory stubs. ' +
        'This is acceptable for local development only.'
      );
      return false;
    }

    try {
      this.client = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 5) {
            logger.error(`Redis: giving up after ${times} retries`);
            return null; // stop retrying
          }
          return Math.min(times * 200, 3000);
        },
        lazyConnect: true,
        enableReadyCheck: true,
        connectTimeout: 10000,
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
        this._connectPromise = null; // allow reconnect on next call
        logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', (delay) => {
        logger.info(`Redis reconnecting in ${delay}ms...`);
      });

      await this.client.connect();
      return this.isConnected;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error.message);
      this.isConnected = false;
      this._connectPromise = null; // allow retry

      if (config.nodeEnv === 'production') {
        logger.error('FATAL: Redis connection failed in production. Exiting.');
        await new Promise((r) => setTimeout(r, 200));
        process.exit(1);
      }

      return false;
    }
  }

  /**
   * Check whether the client is ready for commands.
   * @returns {boolean}
   */
  isReady() {
    return this.isConnected && this.client !== null;
  }

  /**
   * Gracefully close the Redis connection.
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (err) {
        logger.warn('Redis disconnect error (forcing):', err.message);
        this.client.disconnect();
      }
      this.isConnected = false;
      this._connectPromise = null;
      logger.info('Redis disconnected');
    }
  }

  // ------------------------------------------------------------------
  // Cache operations with TTL
  // ------------------------------------------------------------------

  async get(key) {
    if (!this.isReady()) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.isReady()) return false;
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
    if (!this.isReady()) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error.message);
      return false;
    }
  }

  async exists(key) {
    if (!this.isReady()) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error.message);
      return false;
    }
  }

  // ------------------------------------------------------------------
  // Hash operations for structured data
  // ------------------------------------------------------------------

  async hget(key, field) {
    if (!this.isReady()) return null;
    try {
      const data = await this.client.hget(key, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis HGET error:`, error.message);
      return null;
    }
  }

  async hset(key, field, value, ttlSeconds = null) {
    if (!this.isReady()) return false;
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
    if (!this.isReady()) return null;
    try {
      const data = await this.client.hgetall(key);
      if (!data || Object.keys(data).length === 0) return null;
      
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

  // ------------------------------------------------------------------
  // List operations for queues
  // ------------------------------------------------------------------

  async lpush(key, ...values) {
    if (!this.isReady()) return 0;
    try {
      const serialized = values.map(v => JSON.stringify(v));
      return await this.client.lpush(key, ...serialized);
    } catch (error) {
      logger.error(`Redis LPUSH error:`, error.message);
      return 0;
    }
  }

  async rpop(key) {
    if (!this.isReady()) return null;
    try {
      const data = await this.client.rpop(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis RPOP error:`, error.message);
      return null;
    }
  }

  async llen(key) {
    if (!this.isReady()) return 0;
    try {
      return await this.client.llen(key);
    } catch (error) {
      logger.error(`Redis LLEN error:`, error.message);
      return 0;
    }
  }

  // ------------------------------------------------------------------
  // Rate limiting operations
  // ------------------------------------------------------------------

  async incrementRateLimit(identifier, endpoint, windowMs) {
    if (!this.isReady()) return { count: 0, resetTime: Date.now() + windowMs };
    
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
        remaining: Math.max(0, 100 - count),
      };
    } catch (error) {
      logger.error(`Redis rate limit error:`, error.message);
      return { count: 0, resetTime: now + windowMs };
    }
  }

  // ------------------------------------------------------------------
  // Session operations
  // ------------------------------------------------------------------

  async getSession(sessionId) {
    return await this.get(`session:${sessionId}`);
  }

  async setSession(sessionId, sessionData, ttlSeconds = 86400) {
    return await this.set(`session:${sessionId}`, sessionData, ttlSeconds);
  }

  async deleteSession(sessionId) {
    return await this.del(`session:${sessionId}`);
  }

  // ------------------------------------------------------------------
  // Cache key helpers
  // ------------------------------------------------------------------

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

// ------------------------------------------------------------------
// Singleton instance + graceful shutdown
// ------------------------------------------------------------------

const redisClient = new RedisClient();

// Clean shutdown on process termination
const shutdownRedis = async () => {
  logger.info('Shutting down Redis connection...');
  await redisClient.disconnect();
};

process.on('SIGTERM', shutdownRedis);
process.on('SIGINT', shutdownRedis);

module.exports = redisClient;
