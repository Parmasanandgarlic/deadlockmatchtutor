require('dotenv').config();
const path = require('path');

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  deadlockApi: {
    baseUrl: process.env.DEADLOCK_API_BASE_URL || 'https://deadlock-api.com',
  },

  valveCdn: {
    baseUrl: process.env.VALVE_CDN_BASE_URL || 'https://replay1.valve.net/1422450',
  },

  tempDir: path.resolve(__dirname, '..', process.env.TEMP_DIR || './temp'),

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  redis: {
    url: process.env.REDIS_URL || null,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};

module.exports = config;
