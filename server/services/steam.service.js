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
      steam64: steam32ToSteam64(parsed.value),
      steam32: Number(parsed.value),
    };
  }

  if (parsed.type === 'steam64') {
    return {
      steam64: parsed.value,
      steam32: steam64ToSteam32(parsed.value),
    };
  }

  if (parsed.type === 'vanity') {
    try {
      const url = `https://steamcommunity.com/id/${parsed.value}/?xml=1`;
      const { data } = await axios.get(url, { timeout: 10000 });

      const match = data.match(/<steamID64>(\d{17})<\/steamID64>/);
      if (!match) {
        throw new Error(`Could not resolve vanity name "${parsed.value}" to a Steam ID.`);
      }

      const steam64 = match[1];
      return {
        steam64,
        steam32: steam64ToSteam32(steam64),
      };
    } catch (err) {
      logger.error(`Steam vanity resolution failed for "${parsed.value}": ${err.message}`);
      throw new Error(`Failed to resolve Steam ID: ${err.message}`);
    }
  }

  throw new Error(`Unrecognised Steam ID format: "${rawInput}"`);
}

module.exports = { resolveSteamId };
