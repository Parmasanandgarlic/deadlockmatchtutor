/**
 * Format seconds into MM:SS.
 */
export function formatTime(totalSeconds) {
  if (totalSeconds == null) return '--:--';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format a large number with commas.
 */
export function formatNumber(num) {
  if (num == null) return '0';
  return Number(num).toLocaleString();
}

/**
 * Format a percentage to one decimal place.
 */
export function formatPercent(value) {
  if (value == null) return '0%';
  return `${Math.round(value * 10) / 10}%`;
}

/**
 * Return "Win" or "Loss" string.
 */
export function formatResult(won) {
  return won ? 'Win' : 'Loss';
}

/**
 * Format a duration in seconds to a readable string (e.g. "32m 15s").
 */
export function formatDuration(seconds) {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}
