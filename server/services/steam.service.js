const axios = require('axios');
const logger = require('../utils/logger');
const { normalizeSteamInput, steam64ToSteam32, steam32ToSteam64 } = require('../utils/helpers');

/**
 * Resolve any Steam input (vanity URL, profile link, or raw ID) to a Steam64 ID.
 * Uses Steam's public XML profile endpoint — no API key required.
 */
async function resolveSteamId(rawInput) {
  const parsed = normalizeSteamInput(rawInput);

  if (parsed.type === 'steam32') {
    return {
      steam32: Number(parsed.value),
      steam64: String(BigInt(parsed.value) + BigInt('76561197960265728')),
    };
  }

  // Handle direct Steam64 or IDs found in /profiles/ URLs
  if (parsed.type === 'steam64') {
    const steam64 = parsed.value;
    if (steam64.length === 17 && /^\d{17}$/.test(steam64)) {
      return {
        steam64,
        steam32: steam64ToSteam32(steam64),
      };
    }
    // Handle short IDs (8-10 digits) if passed as type steam64 (unlikely but safe)
    if (steam64.length >= 7 && steam64.length <= 10) {
      // Fallback: If it's 7-10 digits, treat it as a Steam32 ID
      const steam32 = Number(parsed.value);
      return {
        steam32,
        steam64: steam32ToSteam64(steam32),
      };
    }
  }

  // Handle Vanity URLs or ambiguous profile segments
  if (parsed.type === 'vanity' || parsed.type === 'steam64' || parsed.type === 'unknown') {
    try {
      const vanityName = parsed.value;
      const url = `https://steamcommunity.com/id/${vanityName}/?xml=1`;
      
      logger.debug(`Attempting Steam XML resolution for: ${vanityName}`);
      const { data, status } = await axios.get(url, { 
        timeout: 10000,
        validateStatus: false // Allow us to handle 404 manually for better errors
      });

      if (status === 404) {
        throw new Error('The profile could not be found on Steam.');
      }
      
      const match = typeof data === 'string' ? data.match(/<steamID64>(\d{17})<\/steamID64>/) : null;
      
      if (!match) {
        // One final fallback: search the raw input for a 17-digit ID if the URL was complex
        const fallbackMatch = rawInput.match(/\/profiles\/(\d{17})/);
        if (fallbackMatch) {
          const steam64 = fallbackMatch[1];
          return {
            steam64,
            steam32: steam64ToSteam32(steam64),
          };
        }
        
        throw new Error(`Could not resolve Steam identifier "${rawInput}". Please ensure the profile is public and correctly formatted.`);
      }

      const steam64 = match[1];
      return {
        steam64,
        steam32: steam64ToSteam32(steam64),
      };
    } catch (err) {
      logger.error(`Steam resolution error for "${parsed.value}": ${err.message}`);
      // Don't leak raw axios error messages if they aren't helpful
      const msg = err.message.includes('not be found') || err.message.includes('resolve')
        ? err.message
        : `Steam resolution failed: ${err.message}`;
      
      throw new Error(msg);
    }
  }

  // If we reach here, it's 'unknown' or unhandled
  logger.warn(`Unrecognised Steam format attempt: "${rawInput}"`);
  throw new Error(`Unrecognised Steam ID format: "${rawInput}"`);
}

module.exports = { resolveSteamId };
