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

const app = express();

// Ensure temp directory exists for .dem file storage
if (!fs.existsSync(config.tempDir)) {
  fs.mkdirSync(config.tempDir, { recursive: true });
  logger.info(`Created temp directory: ${config.tempDir}`);
}

// --------------- Middleware ---------------

app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.isDev) {
  app.use(morgan('dev', { stream: { write: (msg) => logger.http(msg.trim()) } }));
}

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

app.use('/api', routes);

// --------------- Error Handling ---------------

app.use(notFoundHandler);
app.use(errorHandler);

// Start server if not running in Vercel Serverless mode
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(config.port, () => {
    logger.info(`Deadlock Analyzer API running on port ${config.port} [${config.nodeEnv}]`);
  });
}

// Export for Vercel serverless
module.exports = app;
