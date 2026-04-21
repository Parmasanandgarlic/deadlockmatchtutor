// Deadlock item ID → display name mapping.
// Source: Deadlock Assets API https://assets.deadlock-api.com/v2/items
// This is used as a fallback if API data is not available.
export const ITEM_NAMES = {
  // Common items (will be populated by API)
};

// Cache for API-provided item data
let apiItemData = null;

/**
 * Set the API-provided item names map.
 * @param {Array} items - Array of item objects from API
 */
export function setApiItemData(items) {
  if (Array.isArray(items)) {
    const itemMap = {};
    items.forEach(item => {
      const id = item?.id ?? item?.item_id ?? item?.itemId;
      if (id != null) {
        itemMap[id] = item;
        itemMap[String(id)] = item;
      }
    });
    apiItemData = itemMap;
  }
}

/**
 * Get an item's display name from its numeric ID.
 * Prioritizes API-provided names, falls back to static mapping.
 * @param {number} itemId
 * @returns {string} Item name
 */
export function getItemName(itemId) {
  if (itemId == null) return 'Unknown Item';
  
  // First check API-provided names
  if (apiItemData && (apiItemData[itemId] || apiItemData[String(itemId)])) {
    const item = apiItemData[itemId] || apiItemData[String(itemId)];
    return item.name || item.item_name || item;
  }
  
  // Fall back to static mapping
  return ITEM_NAMES[itemId] || `Item #${itemId}`;
}

/**
 * Secondary item lookup (deprecated).
 * @deprecated Use useAssets() from AssetContext instead to get correct dynamic item data.
 */
export function getItemNameSecondary(itemId) {
  if (itemId == null) return 'Unknown Item';
  return `Item #${itemId}`;
}

/**
 * Get full item data from its numeric ID.
 * @param {number} itemId
 * @returns {Object|null} Hero data object or null
 */
export function getItemData(itemId) {
  if (itemId == null || !apiItemData) return null;
  return apiItemData[itemId] || apiItemData[String(itemId)] || null;
}
