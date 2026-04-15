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

/**
 * Get official Deadlock API hero image URL.
 */
export function getHeroImage(heroName, type = 'small') {
  if (!heroName || heroName === 'Unknown Hero') return null;
  const safeName = heroName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const types = {
    small: `images/heroes/${safeName}_sm.png`,
    card: `images/heroes/${safeName}_card.png`,
    minimap: `images/heroes/${safeName}_mm.png`,
    icon: `icons/${safeName}.svg`
  };
  
  return `https://assets-bucket.deadlock-api.com/assets-api-res/${types[type] || types.small}`;
}

/**
 * Get official Deadlock API item/mod image URL.
 */
export function getItemImage(itemName) {
  if (!itemName) return null;
  // Basic normalization — exact mapping might require a dictionary if names don't map cleanly
  const safeName = itemName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return `https://assets-bucket.deadlock-api.com/assets-api-res/images/mods/${safeName}.png`;
}
