/**
 * Lightweight request validation middleware.
 */

/**
 * Validate that a required parameter exists.
 * @param {string} paramName   Name of the route or query param
 * @param {'params'|'query'|'body'} source  Where to look
 */
function requireParam(paramName, source = 'params') {
  return (req, res, next) => {
    const value = req[source]?.[paramName];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Missing required parameter: ${paramName}`,
      });
    }
    next();
  };
}

/**
 * Validate that a value looks like a numeric ID.
 */
function requireNumericParam(paramName, source = 'params') {
  return (req, res, next) => {
    const value = req[source]?.[paramName];
    if (!value || isNaN(Number(value))) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Parameter "${paramName}" must be a numeric value.`,
      });
    }
    next();
  };
}

/**
 * Validate Steam ID input — must be a vanity name, profile URL, or 17-digit number.
 */
function validateSteamInput(req, res, next) {
  const input = req.params.steamInput || req.query.steamInput || req.body.steamInput;
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'A Steam ID, vanity name, or profile URL is required.',
    });
  }
  next();
}

module.exports = { requireParam, requireNumericParam, validateSteamInput };
