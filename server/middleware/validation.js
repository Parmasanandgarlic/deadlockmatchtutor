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

const MAX_INPUT_LENGTH = 256;
const STEAM_URL_REGEX = /^https:\/\/steamcommunity\.com\/(id|profiles)\/[a-zA-Z0-9_-]+$/;

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

  const trimmedInput = input.trim();

  // Enforce maximum length to prevent DoS/overflow
  if (trimmedInput.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ 
      error: 'Invalid Steam input', 
      message: `Input exceeds maximum allowed length of ${MAX_INPUT_LENGTH} characters.` 
    });
  }

  // If the input appears to be a URL, validate against the official Steam format
  if (trimmedInput.includes('steamcommunity.com')) {
    if (!STEAM_URL_REGEX.test(trimmedInput)) {
      return res.status(400).json({ 
        error: 'Invalid Steam input format', 
        message: 'Steam URLs must follow the format: https://steamcommunity.com/id/vanityname or https://steamcommunity.com/profiles/76561198...' 
      });
    }
  } else {
    // If not a URL, ensure it only contains allowed characters (vanity names/numeric IDs)
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedInput)) {
      return res.status(400).json({
        error: 'Invalid Steam input format',
        message: 'Vanity names or IDs must only contain alphanumeric characters, underscores, or hyphens.'
      });
    }
  }

  next();
}

module.exports = { requireParam, requireNumericParam, validateSteamInput };
