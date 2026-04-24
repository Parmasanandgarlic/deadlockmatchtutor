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
function isValidNumericId(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return false;
  const parsed = Number(text);
  return Number.isSafeInteger(parsed) && parsed >= 0;
}

function requireNumericParam(paramName, source = 'params') {
  return (req, res, next) => {
    const value = req[source]?.[paramName];
    if (!isValidNumericId(value)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Parameter "${paramName}" must be a non-negative integer ID.`,
      });
    }
    next();
  };
}

const MAX_INPUT_LENGTH = 256;
const STEAM_URL_REGEX = /^https?:\/\/(?:www\.)?steamcommunity\.com\/(?:id|profiles)\/[a-zA-Z0-9_-]+(?:\/.*)?$/;

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

  // 1. Check if it's a pure numeric ID (SteamID64) — this should always pass
  if (/^\d{17}$/.test(trimmedInput)) {
    return next();
  }

  // 2. If it appears to be a URL, validate against a permissive Steam format
  if (trimmedInput.toLowerCase().includes('steamcommunity.com')) {
    if (!STEAM_URL_REGEX.test(trimmedInput)) {
      return res.status(400).json({ 
        error: 'Invalid Steam input format', 
        message: 'Steam URLs must follow the format: https://steamcommunity.com/id/vanityname or https://steamcommunity.com/profiles/76561198...' 
      });
    }
  } else {
    // 3. Otherwise, ensure it only contains allowed characters for vanity names / account IDs
    if (!/^[a-zA-Z0-9._-]+$/.test(trimmedInput)) {
      return res.status(400).json({
        error: 'Invalid Steam input format',
        message: 'Vanity names or IDs must only contain alphanumeric characters, dots, underscores, or hyphens.'
      });
    }
  }

  next();
}

module.exports = { requireParam, requireNumericParam, validateSteamInput, isValidNumericId };
