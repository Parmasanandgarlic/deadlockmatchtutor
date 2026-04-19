const config = require('../config');
const logger = require('../utils/logger');

/**
 * Middleware to prevent sensitive Supabase keys from being leaked to the client.
 * This intercepts responses and checks for 'serviceRoleKey' presence.
 */
function serviceKeyGuard(req, res, next) {
  const serviceKey = config.supabase.serviceRoleKey;

  // 1. Strip sensitive headers from outgoing response
  const sensitiveHeaders = [
    'authorization',
    'x-supabase-api-key',
    'apikey'
  ];

  const originalSetHeader = res.setHeader;
  res.setHeader = function(name, value) {
    if (sensitiveHeaders.includes(name.toLowerCase())) {
      logger.warn(`Security check: Blocking sensitive header '${name}' from being sent to client.`);
      return res;
    }
    return originalSetHeader.apply(this, arguments);
  };

  // 2. Intercept response body (only if serviceKey is configured)
  if (serviceKey && serviceKey !== 'placeholder') {
    const originalSend = res.send;
    res.send = function(body) {
      if (typeof body === 'string' && body.includes(serviceKey)) {
        logger.error('CRITICAL SECURITY ALERT: Service Role Key detected in response body! Truncating response.');
        return originalSend.call(this, JSON.stringify({ error: 'Internal Server Error', message: 'A security violation occurred.' }));
      }
      
      // If it's a buffer, we might want to check it too, but let's stick to strings for now
      // as most API responses are strings/JSON.
      
      return originalSend.apply(this, arguments);
    };
  }

  next();
}

module.exports = { serviceKeyGuard };
