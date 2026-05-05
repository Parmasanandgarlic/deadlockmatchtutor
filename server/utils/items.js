// Deadlock item ID → display name mapping.
// Source: Deadlock Assets API https://assets.deadlock-api.com/v2/items
// This is used as a fallback if API data is not available.
const ITEM_NAMES = {
  // Common items (will be populated by API)
};

// Cache for API-provided item names (keyed by numeric ID and string ID)
let apiItemNames = null;
// Secondary index: class_name → item object (e.g. "citadel_upgrade_rapid_recharge" → {...})
let apiItemsByClassName = null;

/**
 * Set the API-provided item names map.
 * Builds two indexes:
 *   1. By numeric/string ID (for direct ID lookups)
 *   2. By class_name (for name-based fallback lookups)
 * @param {Array} items - Array of item objects from API
 */
function setApiItemNames(items) {
  if (Array.isArray(items)) {
    const idMap = {};
    const classNameMap = {};
    items.forEach(item => {
      if (!item) return;
      const id = item.id ?? item.item_id ?? item.itemId;
      if (id != null) {
        idMap[id] = item;
        idMap[String(id)] = item;
      }
      // Build class_name index for fallback lookups
      if (item.class_name) {
        classNameMap[item.class_name] = item;
        classNameMap[item.class_name.toLowerCase()] = item;
      }
      // Also index by display name for fuzzy matching
      const displayName = item.name || item.item_name || item.display_name;
      if (displayName && displayName !== item.class_name) {
        classNameMap[displayName] = item;
        classNameMap[displayName.toLowerCase()] = item;
      }
    });
    apiItemNames = idMap;
    apiItemsByClassName = classNameMap;
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

/**
 * Get full item data by class_name or display name.
 * Used as a fallback when numeric ID lookup fails.
 * @param {string} className - class_name or display name
 * @returns {Object|null} Item data object or null
 */
function getItemByClassName(className) {
  if (!className || !apiItemsByClassName) return null;
  return apiItemsByClassName[className] || apiItemsByClassName[className.toLowerCase()] || null;
}

/**
 * Get the full apiItemNames map (for iteration/bulk operations).
 * @returns {Object|null}
 */
function getApiItemNamesMap() {
  return apiItemNames;
}

module.exports = { ITEM_NAMES, getItemName, getItemData, getItemByClassName, getApiItemNamesMap, setApiItemNames };
