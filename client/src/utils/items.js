// Deadlock item ID → display name mapping.
// Source: Deadlock Assets API https://assets.deadlock-api.com/v2/items
export const ITEM_NAMES = {
  // Common items (will be populated by API)
};

/**
 * Get an item's display name from its numeric ID.
 * @param {number} itemId
 * @returns {string} Item name
 */
export function getItemName(itemId) {
  if (itemId == null) return 'Unknown Item';
  return ITEM_NAMES[itemId] || `Item #${itemId}`;
}
