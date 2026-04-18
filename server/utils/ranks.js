// Deadlock rank data utilities.
// Source: Deadlock Assets API https://assets.deadlock-api.com/v2/ranks

// Cache for API-provided rank data
let apiRanks = null;

/**
 * Set the API-provided ranks array.
 * @param {Array} ranks - Array of rank objects from API
 */
function setApiRanks(ranks) {
  if (Array.isArray(ranks)) {
    apiRanks = ranks;
  }
}

/**
 * Get rank info from a badge number.
 * Badge format: first digits = tier, last digit = subtier
 * Example: badge 12 = tier 1, subtier 2
 * @param {number} badge - The badge number from rank prediction
 * @returns {Object} Rank info with tier, name, imageUrl
 */
function getRankInfo(badge) {
  if (badge == null || typeof badge !== 'number') {
    return { tier: null, name: 'Unknown Rank', imageUrl: null };
  }

  // Derive tier from badge (first digits)
  const tier = Math.floor(badge / 10);
  const subtier = badge % 10;

  // Look up tier in ranks array
  if (!apiRanks || apiRanks.length === 0) {
    return { tier, subtier, name: `Tier ${tier}`, imageUrl: null };
  }

  const rankData = apiRanks.find(r => r.tier === tier);
  
  if (!rankData) {
    return { tier, subtier, name: `Tier ${tier}`, imageUrl: null };
  }

  return {
    tier,
    subtier,
    name: rankData.name || `Tier ${tier}`,
    imageUrl: rankData.images?.small_webp || null,
  };
}

module.exports = { getRankInfo, setApiRanks };
