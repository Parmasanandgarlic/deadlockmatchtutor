const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { serviceKeyGuard } = require('./middleware/security.middleware');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Global error handling for unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // Give the logger time to write before exiting
  setTimeout(() => process.exit(1), 100);
});

const app = express();

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

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://assets-bucket.deadlock-api.com', 'https://deadlock-api.com'],
      connectSrc: ["'self'", 'https://api.deadlock-api.com', 'https://steamcommunity.com'],
    },
  },
}));
app.use(serviceKeyGuard);
app.use(compression());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.isDev) {
  app.use(morgan('dev', { stream: { write: (msg) => logger.http(msg.trim()) } }));
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
  apis: ['./routes/*.js'], // Scan route files for JSDoc annotations
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// --------------- Routes ---------------

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Mount routes on BOTH /api and / for compatibility with local vs Vercel rewrites
app.use('/api', routes);
app.use('/', (req, res, next) => {
  // Only handle if it looks like an API call and hasn't been handled yet
  if (req.path.startsWith('/health') || req.path === '/health') return next();
  // If we reach here and it's not starting with /api, we try the routes anyway
  // This helps when Vercel strips the /api prefix or when local testing
  routes(req, res, next);
});

// --------------- Error Handling ---------------

app.use(notFoundHandler);
app.use(errorHandler);

// Start server if this script is executed directly (not required as a module) and not on Vercel
if (require.main === module && (!process.env.VERCEL)) {
  app.listen(config.port, () => {
    logger.info(`Deadlock Analyzer API running on port ${config.port} [${config.nodeEnv}]`);
  });
}

// Export for Vercel serverless
module.exports = app;
