const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  supabase: {
    url: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '', // For bypass RLS
  },

  deadlockApi: {
    baseUrl: process.env.DEADLOCK_API_BASE_URL || 'https://api.deadlock-api.com',
  },

  valveCdn: {
    baseUrl: process.env.VALVE_CDN_BASE_URL || 'https://replay1.valve.net/1422450',
  },

  tempDir: process.env.VERCEL ? '/tmp' : path.resolve(__dirname, '..', process.env.TEMP_DIR || './temp'),

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  redis: {
    url: process.env.REDIS_URL || null,
  },

  sentry: {
    dsn: process.env.SENTRY_DSN || null,
  },

  cors: {
    // Whitelist production domains and local development
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : (process.env.NODE_ENV === 'production' 
          ? ['https://aftermatch.xyz', 'https://www.aftermatch.xyz'] 
          : 'http://localhost:5173'),
    credentials: true,
  },
};

module.exports = config;
