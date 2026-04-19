// Deadlock item ID → display name mapping.
// Source: Deadlock Assets API https://assets.deadlock-api.com/v2/items
// This is used as a fallback if API data is not available.
const ITEM_NAMES = {
  // Common items (will be populated by API)
};

// Cache for API-provided item names
let apiItemNames = null;

/**
 * Set the API-provided item names map.
 * @param {Array} items - Array of item objects from API
 */
function setApiItemNames(items) {
  if (Array.isArray(items)) {
    const itemMap = {};
    items.forEach(item => {
      const id = item?.id ?? item?.item_id ?? item?.itemId;
      if (id != null) {
        itemMap[id] = item;
        itemMap[String(id)] = item;
      }
    });
    apiItemNames = itemMap;
  }
}

/**
 * Get an item's display name from its numeric ID.
 * Prioritizes API-provided names, falls back to static mapping.
 * @param {number} itemId
 * @returns {string} Item name
 */
function getItemName(itemId) {
  if (itemId == null) return 'Unknown Item';
  
  // First check API-provided names
  if (apiItemNames && (apiItemNames[itemId] || apiItemNames[String(itemId)])) {
    const item = apiItemNames[itemId] || apiItemNames[String(itemId)];
    return item.name || item.item_name || item; // Handle objects or legacy names
  }
  
  // Fall back to static mapping
  return ITEM_NAMES[itemId] || `Item #${itemId}`;
}

/**
 * Get full item data from its numeric ID.
 * @param {number} itemId
 * @returns {Object|null} Item data object or null
 */
function getItemData(itemId) {
  if (itemId == null || !apiItemNames) return null;
  return apiItemNames[itemId] || apiItemNames[String(itemId)] || null;
}

module.exports = { ITEM_NAMES, getItemName, getItemData, setApiItemNames };
