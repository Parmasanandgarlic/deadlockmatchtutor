const { MemoryStore } = require('express-rate-limit');
const config = require('../config');
const redisClient = require('../services/redis.service');

/**
 * express-rate-limit store backed by Redis in production.
 *
 * The memory fallback is intentionally development-only. Auth throttles need to
 * be shared across serverless instances and app restarts, so production treats a
 * missing Redis connection as a limiter-store failure.
 */
class RedisRateLimitStore {
  constructor(prefix = 'ratelimit') {
    this.prefix = prefix;
    this.localKeys = false;
    this.windowMs = 60 * 1000;
    this.memoryStore = new MemoryStore();
  }

  init(options) {
    this.windowMs = options.windowMs;
    if (typeof this.memoryStore.init === 'function') {
      this.memoryStore.init(options);
    }
  }

  async get(key) {
    if (!redisClient.isReady()) {
      return this._fallback().get(key);
    }

    const redisKey = this._key(key);
    const [hits, ttl] = await Promise.all([
      redisClient.client.get(redisKey),
      redisClient.client.pttl(redisKey),
    ]);

    if (!hits) return undefined;

    return {
      totalHits: Number(hits),
      resetTime: ttl > 0 ? new Date(Date.now() + ttl) : new Date(Date.now() + this.windowMs),
    };
  }

  async increment(key) {
    if (!redisClient.isReady()) {
      return this._fallback().increment(key);
    }

    const redisKey = this._key(key);
    const totalHits = await redisClient.client.incr(redisKey);

    if (totalHits === 1) {
      await redisClient.client.pexpire(redisKey, this.windowMs);
    }

    let ttl = await redisClient.client.pttl(redisKey);
    if (ttl < 0) {
      await redisClient.client.pexpire(redisKey, this.windowMs);
      ttl = this.windowMs;
    }

    return {
      totalHits,
      resetTime: new Date(Date.now() + ttl),
    };
  }

  async decrement(key) {
    if (!redisClient.isReady()) {
      return this._fallback().decrement(key);
    }

    const redisKey = this._key(key);
    const totalHits = await redisClient.client.decr(redisKey);
    if (totalHits <= 0) {
      await redisClient.client.del(redisKey);
    }
  }

  async resetKey(key) {
    if (!redisClient.isReady()) {
      return this._fallback().resetKey(key);
    }

    await redisClient.client.del(this._key(key));
  }

  shutdown() {
    if (typeof this.memoryStore.shutdown === 'function') {
      this.memoryStore.shutdown();
    }
  }

  _key(key) {
    return `${this.prefix}:${key}`;
  }

  _fallback() {
    if (!config.isDev) {
      throw new Error('Redis is required for production rate limiting.');
    }
    return this.memoryStore;
  }
}

module.exports = { RedisRateLimitStore };
