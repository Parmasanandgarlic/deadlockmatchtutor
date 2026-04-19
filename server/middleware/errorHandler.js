const logger = require('../utils/logger');

/**
 * 404 handler — catches any unmatched routes.
 */
function notFoundHandler(req, res, _next) {
  res.status(404).json({
    error: 'Not Found',
    message: `No route matches ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Global error handler.
 * Express requires the (err, req, res, next) signature to recognise this as error middleware.
 */
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'API_ERROR');

  logger.error(`[${status}] ${req.method} ${req.originalUrl} — ${code}: ${message}`);
  if (status === 500) {
    logger.error(err.stack);
  }

  res.status(status).json({
    error: message, // Stop masking with generic "Internal Server Error"
    code,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { notFoundHandler, errorHandler };
