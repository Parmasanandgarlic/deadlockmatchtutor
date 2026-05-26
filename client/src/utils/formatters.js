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
  // Verified against https://assets.deadlock-api.com/v2/heroes class_name field (May 2026)
  'Infernus': 'inferno',
  'Seven': 'gigawatt',
  'Vindicta': 'hornet',
  'Lady Geist': 'ghost',
  'Abrams': 'atlas',
  'Wraith': 'wraith',
  'McGinnis': 'forge',
  'Paradox': 'chrono',
  'Dynamo': 'dynamo',
  'Kelvin': 'kelvin',
  'Haze': 'haze',
  'Holliday': 'astro',
  'Bebop': 'bebop',
  'Calico': 'nano',
  'Grey Talon': 'orion',
  'Mo & Krill': 'krill',
  'Mo And Krill': 'krill',
  'Shiv': 'shiv',
  'Ivy': 'tengu',
  'Kali': 'kali',
  'Warden': 'warden',
  'Yamato': 'yamato',
  'Lash': 'lash',
  'Viscous': 'viscous',
  'Gunslinger': 'gunslinger',
  'The Boss': 'yakuza',
  'Tokamak': 'tokamak',
  'Wrecker': 'wrecker',
  'Rutger': 'rutger',
  'Pocket': 'synth',
  'Thumper': 'thumper',
  'Mirage': 'mirage',
  'Fathom': 'slork',
  'Cadence': 'cadence',
  'Bomber': 'bomber',
  'Vyper': 'viper',
  'Vandal': 'vandal',
  'Sinclair': 'magician',
  'Trapper': 'trapper',
  'Raven': 'operative',
  'Mina': 'vampirebat',
  'Drifter': 'drifter',
  'Venator': 'priest',
  'Victor': 'frank',
  'Paige': 'bookworm',
  'Boho': 'boho',
  'The Doorman': 'doorman',
  'Doorman': 'doorman',
  'Skyrunner': 'skyrunner',
  'Swan': 'swan',
  'Billy': 'punkgoat',
  'Druid': 'druid',
  'Graf': 'graf',
  'Fortuna': 'fortuna',
  'Graves': 'necro',
  'Apollo': 'fencer',
  'Airheart': 'airheart',
  'Rem': 'familiar',
  'Silver': 'werewolf',
  'Celeste': 'unicorn',
  'Opera': 'opera',
};

/**
 * Hero ID → internal slug mapping.
 * This is the most reliable fallback when the upstream Assets API is down
 * and we only have a numeric hero ID from the tier list / benchmark data.
 */
const HERO_ID_SLUGS = {
  1: 'inferno', 2: 'gigawatt', 3: 'hornet', 4: 'ghost', 6: 'atlas',
  7: 'wraith', 8: 'forge', 10: 'chrono', 11: 'dynamo', 12: 'kelvin',
  13: 'haze', 14: 'astro', 15: 'bebop', 16: 'nano', 17: 'orion',
  18: 'krill', 19: 'shiv', 20: 'tengu', 21: 'kali', 25: 'warden',
  27: 'yamato', 31: 'lash', 35: 'viscous', 38: 'gunslinger', 39: 'yakuza',
  47: 'tokamak', 48: 'wrecker', 49: 'rutger', 50: 'synth', 51: 'thumper',
  52: 'mirage', 53: 'slork', 54: 'cadence', 56: 'bomber', 58: 'viper',
  59: 'vandal', 60: 'magician', 61: 'trapper', 62: 'operative',
  63: 'vampirebat', 64: 'drifter', 65: 'priest', 66: 'frank', 67: 'bookworm',
  68: 'boho', 69: 'doorman', 70: 'skyrunner', 71: 'swan', 72: 'punkgoat',
  73: 'druid', 74: 'graf', 75: 'fortuna', 76: 'necro', 77: 'fencer',
  78: 'airheart', 79: 'familiar', 80: 'werewolf', 81: 'unicorn', 82: 'opera',
};

/**
 * Get official Deadlock API hero image URL.
 * Resolution priority:
 *   1. API-provided image URLs from hero asset data (images object)
 *   2. Hero ID → slug mapping (most reliable offline fallback)
 *   3. Hero name → slug mapping (with alias support)
 *   4. Normalized name fallback (last resort)
 *
 * @param {string|number|Object} hero — hero name string, hero ID number, or hero data object
 * @param {string} type — image type: 'small', 'card', 'minimap', etc.
 * @param {number} [heroId] — optional hero ID for direct ID-based slug lookup
 */
export function getHeroImage(hero, type = 'small', heroId = null) {
  // If 'hero' is an object with heroData, use that
  const data = hero?.heroData || (typeof hero === 'object' && hero !== null && typeof hero !== 'number' ? hero : null);
  
  if (data?.images) {
    // API field names from https://assets.deadlock-api.com/v2/heroes
    const imgType = {
      small: data.images.icon_image_small_webp || data.images.icon_image_small,
      card: data.images.icon_hero_card_webp || data.images.icon_hero_card,
      minimap: data.images.minimap_image_webp || data.images.minimap_image,
      icon: data.images.name_image, // SVG name icon
      vertical: data.images.top_bar_vertical_image_webp || data.images.top_bar_vertical_image,
      gloat: data.images.hero_card_gloat_webp || data.images.hero_card_gloat,
      critical: data.images.hero_card_critical_webp || data.images.hero_card_critical,
      background: data.images.background_image_webp || data.images.background_image,
    };
    if (imgType[type]) return imgType[type];
  }

  // Extract hero ID from the data object if not explicitly provided
  const resolvedId = heroId ?? data?.id ?? data?.hero_id ?? data?.heroId ?? (typeof hero === 'number' ? hero : null);

  // Resolve slug: ID-based (most reliable) → name-based → normalized fallback
  let slug = null;
  if (resolvedId != null && HERO_ID_SLUGS[resolvedId]) {
    slug = HERO_ID_SLUGS[resolvedId];
  }
  if (!slug) {
    const heroName = typeof hero === 'string' ? hero : data?.name || null;
    if (heroName && heroName !== 'Unknown Hero') {
      slug = HERO_SLUGS[heroName] || HERO_SLUGS[heroName.trim()] || heroName.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
  }
  if (!slug) return null;
  
  const types = {
    small: `images/heroes/${slug}_sm.png`,
    card: `images/heroes/${slug}_card.png`,
    minimap: `images/heroes/${slug}_mm.png`,
    icon: `icons/${slug}.svg`,
    vertical: `images/heroes/${slug}_vertical.png`,
    gloat: `images/heroes/${slug}_card_gloat.png`,
    critical: `images/heroes/${slug}_card_critical.png`,
    background: `images/heroes/backgrounds/${slug}_bg.png`,
  };
  
  return `https://assets-bucket.deadlock-api.com/assets-api-res/${types[type] || types.small}`;
}

/**
 * Get hero UI accent color from API data.
 * Returns CSS color string or null.
 */
export function getHeroColor(hero) {
  const data = hero?.heroData || (typeof hero === 'object' ? hero : null);
  if (data?.colors?.ui && Array.isArray(data.colors.ui) && data.colors.ui.length >= 3) {
    const [r, g, b] = data.colors.ui;
    return `rgb(${r}, ${g}, ${b})`;
  }
  return null;
}

const ASSET_API_RES_BASE = 'https://assets-bucket.deadlock-api.com/assets-api-res/';

function normalizeAssetUrl(url) {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^(https?:)?\/\//.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('/')) {
    return trimmed;
  }
  return `${ASSET_API_RES_BASE}${trimmed.replace(/^\/+/, '')}`;
}

function firstString(...values) {
  for (const value of values) {
    const url = normalizeAssetUrl(value);
    if (url) return url;
  }
  return null;
}

function itemFallbackFolder(item) {
  const slot = String(item?.item_slot_type || item?.slot || item?.type || '').toLowerCase();
  if (slot.includes('weapon')) return 'mods_weapon';
  if (slot.includes('spirit') || slot.includes('tech')) return 'mods_tech';
  if (slot.includes('vital') || slot.includes('armor')) return 'mods_armor';
  return 'mods_utility';
}

/**
 * Get official Deadlock API item/mod image URL.
 */
export function getItemImage(item) {
  if (!item) return null;
  
  // Use API image if available
  if (typeof item === 'object') {
    const images = item.images || {};
    const apiImg = firstString(
      item.image_webp,
      item.image,
      item.icon_image_small_webp,
      item.icon_image_small,
      item.icon_webp,
      item.icon,
      item.shop_image_webp,
      item.shop_image,
      item.thumbnail_webp,
      item.thumbnail,
      images.image_webp,
      images.image,
      images.icon_image_small_webp,
      images.icon_image_small,
      images.icon_webp,
      images.icon,
      images.small_webp,
      images.small,
      images.shop_image_webp,
      images.shop_image,
      images.large_webp,
      images.large
    );
    if (apiImg) return apiImg;
  }

  const itemName =
    typeof item === 'string'
      ? item
      : item.name || item.item_name || item.display_name || item.class_name;
  if (!itemName) return null;
  
  // Basic normalization — exact mapping might require a dictionary if names don't map cleanly
  const safeName = itemName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return `${ASSET_API_RES_BASE}images/upgrades/${itemFallbackFolder(item)}/${safeName}.png`;
}
