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

function firstAssetUrl(...values) {
  for (const value of values) {
    const url = normalizeAssetUrl(value);
    if (url) return url;
  }
  return null;
}

function itemImageUrl(source, preferWebp = true) {
  if (!source || typeof source !== 'object') return null;
  const images = source.images || {};
  const webpFirst = [
    source.image_webp,
    source.icon_image_small_webp,
    source.icon_webp,
    source.shop_image_webp,
    source.thumbnail_webp,
    images.image_webp,
    images.icon_image_small_webp,
    images.icon_webp,
    images.small_webp,
    images.shop_image_webp,
    images.large_webp,
    source.image,
    source.icon_image_small,
    source.icon,
    source.shop_image,
    source.thumbnail,
    images.image,
    images.icon_image_small,
    images.icon,
    images.small,
    images.shop_image,
    images.large,
  ];
  const pngFirst = [
    source.image,
    source.icon_image_small,
    source.icon,
    source.shop_image,
    source.thumbnail,
    images.image,
    images.icon_image_small,
    images.icon,
    images.small,
    images.shop_image,
    images.large,
    source.image_webp,
    source.icon_image_small_webp,
    source.icon_webp,
    source.shop_image_webp,
    source.thumbnail_webp,
    images.image_webp,
    images.icon_image_small_webp,
    images.icon_webp,
    images.small_webp,
    images.shop_image_webp,
    images.large_webp,
  ];
  return firstAssetUrl(...(preferWebp ? webpFirst : pngFirst));
}

function firstDefinedFromSources(sources, fields) {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const field of fields) {
      const value = source[field];
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    }
  }
  return null;
}

function itemAssetFields(...sources) {
  return {
    image: sources.map((source) => itemImageUrl(source, false)).find(Boolean) || null,
    image_webp: sources.map((source) => itemImageUrl(source, true)).find(Boolean) || null,
    tier: firstDefinedFromSources(sources, ['tier', 'item_tier']),
    slot: firstDefinedFromSources(sources, ['slot', 'item_slot_type', 'slot_type']),
    type: firstDefinedFromSources(sources, ['type', 'item_type']),
  };
}

module.exports = { itemAssetFields, itemImageUrl, normalizeAssetUrl };
