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
const swaggerJsdoc = require('swagger-jsdoc');
const Sentry = require('@sentry/node');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { serviceKeyGuard } = require('./middleware/security.middleware');
const { csrfProtection } = require('./middleware/csrf.middleware');
const authService = require('./services/auth.service');
const redisClient = require('./services/redis.service');

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
// SECURITY FIX: Removed 'unsafe-inline' and 'unsafe-eval' from scriptSrc.
// These directives completely negate CSP's XSS protection.
// Scripts that need inline execution must use the per-request nonce.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.cspNonce}'`,
      ],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://assets-bucket.deadlock-api.com', 'https://assets.deadlock-api.com', 'https://deadlock-api.com'],
      connectSrc: ["'self'", 'https://api.deadlock-api.com', 'https://assets.deadlock-api.com', 'https://steamcommunity.com'],
    },
  },
}));
app.use(serviceKeyGuard);
app.use(compression());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (config.isDev) {
  app.use(morgan('dev', { stream: { write: (msg) => logger.http(msg.trim()) } }));
}

// CSRF Protection — validates state-changing requests have matching tokens.
// Must come after cookieParser so req.cookies is populated.
app.use(csrfProtection);

// Initialize Redis connection (async, with proper error handling)
// The connection guard in redis.service.js prevents duplicate connections
// on serverless cold-starts.
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    // Redis is optional in some deployments (e.g. serverless). Log and continue
    // so API routes can still respond in degraded mode.
    logger.error('Redis initialization error:', err.message);
  }
})();

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

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Deadlock AfterMatch API',
      version: '1.0.0',
      description: 'REST API documentation for the Deadlock match analysis and player tracking tool.',
      contact: {
        name: 'Support',
        email: 'contact@aftermatch.xyz'
      }
    },
    servers: [
      {
        url: config.isDev ? `http://localhost:${config.port}` : 'https://api.aftermatch.xyz',
        description: config.isDev ? 'Local Development Server' : 'Production API Server'
      }
    ]
  },
  apis: [path.join(__dirname, 'routes/*.js')], // Scan route files for JSDoc annotations
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
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
  windowMs: 15 * 60 * 1000,  // 15-minute window
  max: 10,                     // 10 attempts per window
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
  res.json({ 
    status: 'ok', 
    redis: redisClient.isReady() ? 'connected' : redisClient.isDegraded ? 'degraded' : 'disconnected',
    uptime: Math.floor(process.uptime()), 
    version: process.env.DEPLOYMENT_VERSION || '1.0.1-radar-timeline',
    timestamp: new Date().toISOString()
  });
});

// 2. API Mounting
// Vercel rewrites can be inconsistent with prefix stripping. 
// Mounting on both ensures we catch all variations safely.
app.use('/api', routes);
app.use('/', routes); 

// --------------- Error Handling ---------------

// The error handler must be before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// 4. Global Fallbacks
app.use(notFoundHandler);
app.use(errorHandler);


// Start server if this script is executed directly (not required as a module) and not on Vercel
if (require.main === module && (!process.env.VERCEL)) {
  app.listen(config.port, () => {
    logger.info(`Deadlock Analyzer API running on port ${config.port} [${config.nodeEnv}]`);
    logger.info(`CORS Origins Allowed: ${Array.isArray(config.cors.origin) ? config.cors.origin.join(', ') : config.cors.origin}`);
  });
}

// Export for Vercel serverless
module.exports = app;
