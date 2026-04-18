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
 * @param {Object} itemMap - Map of item_id to item_name from API
 */
function setApiItemNames(itemMap) {
  if (itemMap && typeof itemMap === 'object') {
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
  if (apiItemNames && apiItemNames[itemId]) {
    return apiItemNames[itemId];
  }
  
  // Fall back to static mapping
  return ITEM_NAMES[itemId] || `Item #${itemId}`;
}

module.exports = { ITEM_NAMES, getItemName, setApiItemNames };
