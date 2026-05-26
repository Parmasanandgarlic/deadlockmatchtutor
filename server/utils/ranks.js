// Deadlock rank data utilities.
// Source: Deadlock API https://api.deadlock-api.com/v1/assets/ranks

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

  const images = rankData.images || {};
  return {
    tier,
    subtier,
    name: rankData.name || `Tier ${tier}`,
    imageUrl: images.small_webp || images.small || images.large_webp || images.large || null,
  };
}

/**
 * Convert a badge number to a continuous MMR score.
 * Formula from API spec: (intDiv(badge, 10) - 1) * 6 + (badge % 10)
 * @param {number} badge 
 * @returns {number} continuous MMR score
 */
function badgeToMmr(badge) {
  if (badge == null || typeof badge !== 'number') return 0;
  return (Math.floor(badge / 10) - 1) * 6 + (badge % 10);
}

/**
 * Convert a continuous MMR score back to a badge number.
 * Formula from API spec: 10 * intDiv(mmr_score - 1, 6) + 1 + (mmr_score - 1) % 6
 * (Adjusted for 1-indexed subtiers)
 * @param {number} mmrScore 
 * @returns {number} badge
 */
function mmrToBadge(mmrScore) {
  if (mmrScore == null || typeof mmrScore !== 'number' || mmrScore < 1) return 11;
  const mmrZeroIndexed = mmrScore - 1;
  const tier = Math.floor(mmrZeroIndexed / 6) + 1;
  const subtier = (mmrZeroIndexed % 6) + 1;
  return tier * 10 + subtier;
}

module.exports = { getRankInfo, setApiRanks, badgeToMmr, mmrToBadge };
