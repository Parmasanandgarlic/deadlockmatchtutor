const logger = require('./logger');

function describeError(err) {
  return {
    message: err?.message || String(err),
    code: err?.code,
    status: err?.response?.status,
    stack: err?.stack,
  };
}

function logOptionalFailure(context, err, level = 'warn') {
  const details = describeError(err);
  const message = `${context}: ${details.message}`;
  const log = typeof logger[level] === 'function' ? logger[level].bind(logger) : logger.warn.bind(logger);
  log(message, details);
}

function logAndFallback(context, fallback, level = 'warn') {
  return (err) => {
    logOptionalFailure(context, err, level);
    return fallback;
  };
}

module.exports = {
  describeError,
  logOptionalFailure,
  logAndFallback,
};
