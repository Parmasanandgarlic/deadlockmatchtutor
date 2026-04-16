/**
 * Convert a game tick number to seconds based on tick rate.
 * Deadlock (Source 2) typically runs at 64 or 128 tick.
 */
function tickToSeconds(tick, tickRate = 64) {
  return tick / tickRate;
}

/**
 * Format seconds into MM:SS string.
 */
function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate Euclidean distance between two 3D positions.
 */
function distance3D(a, b) {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    (a.z - b.z) ** 2
  );
}

/**
 * Clamp a value between min and max.
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Safe division — returns 0 when denominator is 0.
 */
function safeDivide(numerator, denominator) {
  if (!denominator || denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Resolve a Steam vanity URL component to a potential SteamID64 format.
 * Returns the input unchanged if it already looks like a Steam64 ID (17-digit number).
 */
function normalizeSteamInput(input) {
  const trimmed = input.trim();

  // Already a Steam64 ID
  if (/^\d{17}$/.test(trimmed)) {
    return { type: 'steam64', value: trimmed };
  }

  // Already a Steam32 ID (Account ID - usually 8-10 digits)
  if (/^\d{8,10}$/.test(trimmed)) {
    return { type: 'steam32', value: trimmed };
  }

  // Full profile URL: https://steamcommunity.com/id/vanityname
  const vanityMatch = trimmed.match(/steamcommunity\.com\/id\/([^/]+)/);
  if (vanityMatch) {
    return { type: 'vanity', value: vanityMatch[1] };
  }

  // Full profile URL: https://steamcommunity.com/profiles/76561198xxxxx
  const profileMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profileMatch) {
    return { type: 'steam64', value: profileMatch[1] };
  }

  // Assume raw vanity name
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { type: 'vanity', value: trimmed };
  }

  return { type: 'unknown', value: trimmed };
}

/**
 * Convert Steam64 ID to Steam32 (account ID) used by many game APIs.
 */
function steam64ToSteam32(steam64) {
  const bigId = BigInt(steam64);
  return Number(bigId - BigInt('76561197960265728'));
}

/**
 * Convert Steam32 (account ID) back to Steam64.
 */
function steam32ToSteam64(steam32) {
  return (BigInt(steam32) + BigInt('76561197960265728')).toString();
}

/**
 * Group an array of events by a time window, returning clusters.
 */
function clusterEvents(events, timeKey, windowSeconds) {
  if (!events.length) return [];

  const sorted = [...events].sort((a, b) => a[timeKey] - b[timeKey]);
  const clusters = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const lastCluster = clusters[clusters.length - 1];
    const lastEvent = lastCluster[lastCluster.length - 1];
    if (sorted[i][timeKey] - lastEvent[timeKey] <= windowSeconds) {
      lastCluster.push(sorted[i]);
    } else {
      clusters.push([sorted[i]]);
    }
  }

  return clusters;
}

module.exports = {
  tickToSeconds,
  formatTime,
  distance3D,
  clamp,
  safeDivide,
  normalizeSteamInput,
  steam64ToSteam32,
  steam32ToSteam64,
  clusterEvents,
};
