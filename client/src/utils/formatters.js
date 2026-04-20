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
 * Coerce a timestamp in unix-seconds, unix-ms, or ISO string form to a Date.
 */
function toDate(input) {
  if (!input) return null;
  if (input instanceof Date) return input;
  if (typeof input === 'number') {
    // Heuristic: treat <10^12 as seconds
    return new Date(input < 1e12 ? input * 1000 : input);
  }
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Human relative time (e.g. "3 hours ago", "2 days ago").
 */
export function formatRelativeTime(input) {
  const d = toDate(input);
  if (!d) return '';
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWk = Math.round(diffDay / 7);
  if (diffWk < 5) return `${diffWk}w ago`;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Formatted absolute date/time, e.g. "Apr 17, 2026, 1:47 AM".
 */
export function formatDateTime(input) {
  const d = toDate(input);
  if (!d) return '';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const HERO_SLUGS = {
  'Infernus': 'inferno',
  'Mo & Krill': 'mokrill',
  'Grey Talon': 'greytalon',
  'Lady Geist': 'ladygeist',
  'Bebop': 'bebop',
  'Abrams': 'abrams',
  'Haze': 'haze',
  'Ivy': 'ivy',
  'Kelvin': 'kelvin',
  'Lash': 'lash',
  'McGinnis': 'mcginnis',
  'Paradox': 'paradox',
  'Seven': 'seven',
  'Shiv': 'shiv',
  'Vindicta': 'vindicta',
  'Viscous': 'viscous',
  'Warden': 'warden',
  'Wraith': 'wraith',
  'Yamato': 'yamato',
  'Dynamo': 'dynamo',
  'Pocket': 'pocket',
  'Mirage': 'mirage'
};

/**
 * Get official Deadlock API hero image URL.
 */
export function getHeroImage(hero, type = 'small') {
  // If 'hero' is an object with heroData, use that
  const data = hero?.heroData || (typeof hero === 'object' ? hero : null);
  
  if (data?.images) {
    const imgType = {
      small: data.images.icon_image_small_webp || data.images.icon_image_small,
      card: data.images.icon_hero_card_webp || data.images.icon_hero_card,
      minimap: data.images.icon_minimap_webp || data.images.icon_minimap,
      icon: data.images.top_bar_icon_webp || data.images.top_bar_icon
    };
    if (imgType[type]) return imgType[type];
  }

  const heroName = typeof hero === 'string' ? hero : data?.name || 'Unknown Hero';
  if (!heroName || heroName === 'Unknown Hero') return null;
  
  // Use slug mapping if available, otherwise normalize
  const slug = HERO_SLUGS[heroName] || heroName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const types = {
    small: `images/heroes/${slug}_sm.png`,
    card: `images/heroes/${slug}_card.png`,
    minimap: `images/heroes/${slug}_mm.png`,
    icon: `icons/${slug}.svg`
  };
  
  return `https://assets-bucket.deadlock-api.com/assets-api-res/${types[type] || types.small}`;
}

/**
 * Get official Deadlock API item/mod image URL.
 */
export function getItemImage(item) {
  if (!item) return null;
  
  // Use API image if available
  if (typeof item === 'object') {
    const apiImg = item.image_webp || item.image;
    if (apiImg) return apiImg;
  }

  const itemName = typeof item === 'string' ? item : item.name;
  if (!itemName) return null;
  
  // Basic normalization — exact mapping might require a dictionary if names don't map cleanly
  const safeName = itemName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return `https://assets-bucket.deadlock-api.com/assets-api-res/images/mods/${safeName}.png`;
}
