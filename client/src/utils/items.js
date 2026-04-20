// Deadlock item ID → display name mapping.
// Deprecated: Now dynamically hydrated via AssetContext
export const ITEM_NAMES = {};

/**
 * @deprecated Use useAssets() from AssetContext instead to get correct dynamic item data.
 */
export function getItemName(itemId) {
  if (itemId == null) return 'Unknown Item';
  return `Item #${itemId}`;
}
