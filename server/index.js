const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const Sentry = require('@sentry/node');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { serviceKeyGuard } = require('./middleware/security.middleware');
const { csrfProtection } = require('./middleware/csrf.middleware');
const { RedisRateLimitStore } = require('./middleware/redisRateLimitStore');
const authService = require('./services/auth.service');
const redisClient = require('./services/redis.service');
const { logOptionalFailure } = require('./utils/logging');
const { createOpenApiSpec } = require('./docs/openapi');

// Initializing Sentry (v8+ structure)
Sentry.init({
  dsn: config.sentry?.dsn || process.env.SENTRY_DSN,
  environment: config.nodeEnv,
  tracesSampleRate: 1.0,
});

// Global error handling for unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // In serverless environments (e.g. Vercel), hard-exiting can cause a cascade of
  // FUNCTION_INVOCATION_FAILED responses. Prefer staying alive and letting the
  // request-level error handling respond whenever possible.
  if (!process.env.VERCEL) {
    // Give the logger time to write before exiting
    setTimeout(() => process.exit(1), 100);
  }
});

const app = express();
app.set('trust proxy', 1);

// Redis is beneficial but not mandatory — the RedisClient class has a full
// in-memory fallback (degraded mode) that keeps the site functional without
// a Redis instance. Only enforce Redis if explicitly required via env var.
const redisRequired = process.env.REDIS_REQUIRED === '1' || process.env.REDIS_REQUIRED === 'true';
const startupState = {
  redisError: null,
};

const redisReadyPromise = (async () => {
  if (redisRequired && !config.redis.url) {
    const err = new Error('REDIS_URL is required (REDIS_REQUIRED=1 is set).');
    err.code = 'REDIS_NOT_CONFIGURED';
    startupState.redisError = err;
    throw err;
  }

  try {
    await redisClient.connect();
    return redisClient.isReady();
  } catch (err) {
    startupState.redisError = err;
    logger.error('Redis initialization error:', err.message);
    if (redisRequired) throw err;
    logger.warn('Redis unavailable — running in degraded mode with in-memory cache');
    return false;
  }
})();
redisReadyPromise.catch((err) => {
  logOptionalFailure('Redis readiness promise failed during startup', err, redisRequired ? 'error' : 'warn');
});

async function redisReadinessGate(req, res, next) {
  if (!redisRequired || req.path === '/health') {
    return next();
  }

  try {
    await redisReadyPromise;
  } catch (err) {
    logOptionalFailure('Redis readiness gate blocked request', err, 'warn');
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      code: 'REDIS_REQUIRED',
      message: 'Redis is required in production and is not ready.',
    });
  }

  if (startupState.redisError) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      code: 'REDIS_REQUIRED',
      message: 'Redis is required in production and is not ready.',
    });
  }

  next();
}

// (Note: In Sentry v8+, Handlers.requestHandler is no longer required for basic tracking)

// Ensure temp directory exists for .dem file storage
try {
  if (!fs.existsSync(config.tempDir)) {
    fs.mkdirSync(config.tempDir, { recursive: true });
    logger.info(`Created temp directory: ${config.tempDir}`);
  }
} catch (err) {
  // On Vercel, the filesystem is read-only. We log but don't crash.
  logger.warn(`Failed to create temp directory ${config.tempDir}: ${err.message}`);
}

// --------------- Middleware ---------------

// CSP Nonce generation — must come before helmet so the nonce is available
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Security headers with hardened CSP
// SECURITY FIX: removed inline-script and eval allowances from scriptSrc.
// Those directives completely negate CSP's XSS protection.
// Scripts that need inline execution must use the per-request nonce.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.cspNonce}'`,
      ],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://assets-bucket.deadlock-api.com', 'https://assets.deadlock-api.com', 'https://deadlock-api.com'],
      connectSrc: ["'self'", 'https://api.deadlock-api.com', 'https://assets.deadlock-api.com', 'https://steamcommunity.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
}));
app.use(serviceKeyGuard);
app.use(compression());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(redisReadinessGate);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (config.isDev) {
  app.use(morgan('dev', { stream: { write: (msg) => logger.http(msg.trim()) } }));
}

// CSRF Protection — validates state-changing requests have matching tokens.
// Must come after cookieParser so req.cookies is populated.
app.use(csrfProtection);

// Initialize authentication service
const authConfigured = authService.initialize();
if (authConfigured) {
  const { sessionMiddleware, passportInitialize, passportSession } = authService.getMiddlewares();
  app.use(sessionMiddleware);
  app.use(passportInitialize);
  app.use(passportSession);
  logger.info('Authentication middleware initialized');
} else {
  logger.warn('Authentication not configured - Steam API key missing');
}

const swaggerSpec = createOpenApiSpec({ isDev: config.isDev, port: config.port });
app.get('/openapi.json', (_req, res) => res.json(swaggerSpec));
app.get('/api/openapi.json', (_req, res) => res.json(swaggerSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// General API rate limiter
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// SECURITY FIX: Stricter rate limiter for authentication endpoints.
// Without this, brute force attacks on session tokens are trivial.
const authLimiter = rateLimit({
  windowMs: config.authRateLimit.windowMs,
  max: config.authRateLimit.max,
  store: new RedisRateLimitStore('ratelimit:auth'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});
app.use('/api/auth', authLimiter);
app.use('/auth', authLimiter);

// Request logging for production debugging
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    logger.debug(`[API Path Trace] ${req.method} ${req.path}`);
  }
  next();
});

// --------------- Routes ---------------

// 1. Critical Health Check (Must be at the very top)
app.get('/health', (_req, res) => {
  const hasFatalRedisError = redisRequired && startupState.redisError;

  res.status(hasFatalRedisError ? 503 : 200).json({
    status: hasFatalRedisError ? 'error' : 'ok',
    redis: redisClient.isReady() ? 'connected' : redisClient.isDegraded ? 'degraded' : 'disconnected',
    redisRequired,
    error: hasFatalRedisError ? startupState.redisError.message : undefined,
    uptime: Math.floor(process.uptime()), 
    version: process.env.DEPLOYMENT_VERSION || '1.0.1-radar-timeline',
    timestamp: new Date().toISOString()
  });
});

// 2. API Mounting
// Vercel rewrites can be inconsistent with prefix stripping. 
app.use('/api', routes);

// 3. SSR Proxy and Static Frontend
// Vercel routes non-API traffic here. We intercept bots for SSR, and serve the static SPA for users.
const ssrProxy = require('./middleware/ssrProxy');
app.use(ssrProxy);

// Serve SEO dynamic routes before static files so they override public/sitemap.xml
const seoRoutes = require('./routes/seo');
app.use('/', seoRoutes);

// Serve static frontend assets (if running locally or as a Vercel fallback)
const distPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { index: false }));
}

// Catch-all route to serve the React SPA for real users
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|webp)$/)) {
    return next();
  }
  const indexPath = path.join(__dirname, '../client/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

// --------------- Error Handling ---------------

// The error handler must be before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// 4. Global Fallbacks
app.use(notFoundHandler);
app.use(errorHandler);


// Start server if this script is executed directly (not required as a module) and not on Vercel
if (require.main === module && (!process.env.VERCEL)) {
  (async () => {
    try {
      if (redisRequired) {
        await redisReadyPromise;
      }

      app.listen(config.port, () => {
        logger.info(`Deadlock Analyzer API running on port ${config.port} [${config.nodeEnv}]`);
        logger.info(`CORS Origins Allowed: ${Array.isArray(config.cors.origin) ? config.cors.origin.join(', ') : config.cors.origin}`);
      });
    } catch (err) {
      logger.error('Startup failed:', err.message);
      process.exit(1);
    }
  })();
}

// Export for Vercel serverless
module.exports = app;
