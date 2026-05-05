import { formatNumber, getItemImage } from '../../utils/formatters';
import { ShoppingBag, Coins, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import TimelineGraph from '../dashboard/TimelineGraph';
import { useAssets } from '../../contexts/AssetContext';
import ItemIcon, { TIER_COLORS, getSlotKey } from '../ui/ItemIcon';

function normalizeItem(item) {
  if (item == null) return {};
  if (typeof item === 'number') return { id: item };
  if (typeof item === 'string') {
    const trimmed = item.trim();
    return /^\d+$/.test(trimmed) ? { id: Number(trimmed) } : { name: item };
  }
  return item;
}

function mergeDefined(base, next) {
  const merged = { ...(base || {}) };
  for (const [key, value] of Object.entries(next || {})) {
    if (value !== null && value !== undefined && value !== '') {
      merged[key] = value;
    }
  }
  return merged;
}

/**
 * Slot type label mapping — converts API enum values to human-readable labels.
 */
const SLOT_LABELS = {
  'EItemSlotType_Weapon': 'Weapon',
  'EItemSlotType_Armor': 'Vitality',
  'EItemSlotType_Tech': 'Spirit',
  'weapon': 'Weapon',
  'armor': 'Vitality',
  'vitality': 'Vitality',
  'tech': 'Spirit',
  'spirit': 'Spirit',
};

function formatSlotLabel(slot) {
  if (!slot) return null;
  return SLOT_LABELS[slot] || SLOT_LABELS[String(slot).toLowerCase()] || String(slot).replace(/^EItemSlotType_/i, '');
}

function resolveItem(item, itemsMap) {
  const normalized = normalizeItem(item);
  const itemId = normalized.id ?? normalized.item_id ?? normalized.itemId ?? normalized.item ?? null;
  // Try direct ID lookup, then class_name lookup in assets map
  let itemAsset = itemId != null ? itemsMap?.[itemId] || itemsMap?.[String(itemId)] : null;
  if (!itemAsset && normalized.class_name) {
    itemAsset = itemsMap?.[normalized.class_name] || null;
  }
  const hydrated = mergeDefined(itemAsset, normalized);
  const rawName = normalized.name || normalized.item_name || normalized.display_name;
  const assetName = itemAsset?.name || itemAsset?.item_name || itemAsset?.display_name;
  const generatedName = itemId != null ? `Item #${itemId}` : null;
  const itemName = assetName || (rawName && rawName !== generatedName ? rawName : null) || rawName || generatedName || 'Unknown Item';
  const itemCost = normalized.cost ?? normalized.item_cost ?? normalized.price ?? itemAsset?.cost ?? itemAsset?.item_cost ?? 0;
  // Prefer pipeline-provided item_tier/item_slot_type over generic tier/slot
  const tier = normalized.item_tier ?? normalized.tier ?? itemAsset?.item_tier ?? itemAsset?.tier ?? null;
  const slot = normalized.item_slot_type ?? normalized.slot ?? itemAsset?.item_slot_type ?? itemAsset?.slot ?? null;
  // Use pipeline-provided image_webp/image first, then fall back to asset resolution
  const itemImg = normalized.image_webp || normalized.image || getItemImage(hydrated) || getItemImage(itemAsset) || getItemImage(normalized);

  return { hydrated, itemName, itemCost, tier, slot, itemImg };
}

export default function ItemizationModule({ data, meta }) {
  const { items = [], netWorth = 0, souls = 0, soulsPerMin = 0 } = data || {};
  const { itemsMap, isLoading } = useAssets();

  if (isLoading && items.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-8 h-8 border-2 border-deadlock-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-deadlock-muted animate-pulse">Hydrating item artifacts...</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tooltip
          className="group relative w-full"
          content={{
            term: 'Net Worth',
            definition: 'Total gold value of your items plus unspent gold. Higher net worth enables stronger item spikes.',
            category: 'Economy'
          }}
        >
          <StatBox
            icon={<Coins className="w-4 h-4 text-deadlock-accent" />}
            label="Net Worth"
            value={formatNumber(netWorth)}
          />
        </Tooltip>
        <Tooltip
          className="group relative w-full"
          content={{
            term: 'Souls Per Minute',
            definition: 'Average souls collected per minute. Critical for power spike timing and item progression in Deadlock.',
            category: 'Economy'
          }}
        >
          <StatBox
            icon={<TrendingUp className="w-4 h-4 text-deadlock-green" />}
            label="Souls / min"
            value={formatNumber(soulsPerMin ?? 0)}
          />
        </Tooltip>
        <Tooltip
          className="group relative w-full"
          content={{
            term: 'Last Hits',
            definition: 'Total souls collected from last-hitting creeps. Foundation of reliable farm and item timing.',
            category: 'Economy'
          }}
        >
          <StatBox
            icon={<ShoppingBag className="w-4 h-4 text-deadlock-purple" />}
            label="Last Hits"
            value={formatNumber(souls)}
          />
        </Tooltip>
        <StatBox
          label="Module Score"
          value={`${data.score}/100`}
          highlight
        />
      </div>

      {/* Soul Progression Timeline */}
      <TimelineGraph netWorth={netWorth} durationSeconds={meta?.duration} />

      {/* Items List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-deadlock-text-dim uppercase tracking-[0.24em] flex items-center gap-2">
          <Tooltip
            content={{
              term: 'Item Build',
              definition: 'Items purchased during this match. Item choices should adapt to enemy composition and game state.',
              category: 'Build'
            }}
          >
            <span>Item Build</span>
          </Tooltip>
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-deadlock-muted">
            {items.length ? `${items.length} purchased` : 'No items'}
          </span>
        </div>
        {items && items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.map((item, i) => {
              const { itemName, itemImg, itemCost, tier, slot } = resolveItem(item, itemsMap);
              const slotLabel = formatSlotLabel(slot);
              const tierNum = tier != null ? Number(tier) : null;
              const tierColor = tierNum ? TIER_COLORS[tierNum] : null;
              const itemMeta = [tierNum ? `T${tierNum}` : null, slotLabel].filter(Boolean).join(' · ');
              
              return (
                <Tooltip
                  key={i}
                  content={{
                    term: itemName,
                    definition: `Item cost: ${formatNumber(itemCost)} souls. ${slotLabel ? `Category: ${slotLabel}.` : ''} ${tierNum ? `Tier ${tierNum} item.` : ''} Item effectiveness depends on timing and enemy composition.`,
                    category: 'Build'
                  }}
                >
                  <div className={`relative bg-deadlock-bg rounded-none border p-3 cursor-help hover:bg-deadlock-bg/80 transition-all duration-200 overflow-hidden group ${
                    tierColor ? `${tierColor.border} hover:${tierColor.border}` : 'border-deadlock-border hover:border-deadlock-amber/40'
                  }`}>
                    {/* Tier-colored top accent bar */}
                    <div className={`absolute inset-x-0 top-0 h-[2px] transition-opacity ${
                      tierColor
                        ? `${tierColor.bg.replace('/10', '/60')} opacity-80`
                        : 'bg-gradient-to-r from-transparent via-deadlock-amber/40 to-transparent opacity-0 group-hover:opacity-100'
                    }`} />
                    <div className="flex items-start gap-3">
                      <ItemIcon src={itemImg} alt={itemName} className="w-14 h-14" imageClassName="p-1" tier={tierNum} slot={slot} />
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-deadlock-text truncate">{itemName}</p>
                          <ArrowUpRight className="w-3.5 h-3.5 text-deadlock-muted shrink-0" />
                        </div>
                        <p className={`mt-1 text-[10px] uppercase tracking-[0.22em] ${
                          tierColor ? tierColor.text : 'text-deadlock-muted'
                        }`}>
                          {itemMeta || 'Item'}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="font-mono text-sm text-deadlock-amber">{formatNumber(itemCost)}</span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-deadlock-text-dim">souls</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        ) : (
          <div className="bg-deadlock-bg border border-deadlock-border px-4 py-4 text-center">
            <p className="text-deadlock-text-dim text-sm">No item build could be reconstructed for this match.</p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-deadlock-muted mt-2">
              The replay metadata may be incomplete, but the rest of the dossier will still render.
            </p>
          </div>
        )}
      </div>

      {/* Build Recommendations */}
      {data.buildRecommendation && (
        <div>
          <h3 className="text-sm font-semibold text-deadlock-text-dim uppercase tracking-[0.24em] mb-3 flex items-center gap-2">
            <Tooltip
              content={{
                term: 'Recommended Build',
                definition: 'Items that winning players on this hero typically build. Coverage shows how many you matched.',
                category: 'Build'
              }}
            >
              <span>Recommended Build</span>
            </Tooltip>
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-deadlock-muted ml-auto">
              {data.buildRecommendation.coverage}% coverage
            </span>
          </h3>

          {/* Coverage bar */}
          <div className="w-full h-1.5 bg-deadlock-border rounded-full mb-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${data.buildRecommendation.coverage}%`,
                background: data.buildRecommendation.coverage >= 75
                  ? 'var(--color-deadlock-green, #22c55e)'
                  : data.buildRecommendation.coverage >= 50
                  ? 'var(--color-deadlock-amber, #d4a853)'
                  : 'var(--color-deadlock-red, #ef4444)',
              }}
            />
          </div>

          {/* Matched items */}
          {data.buildRecommendation.matched.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-deadlock-green mb-2">✓ Items you built</p>
              <div className="flex flex-wrap gap-2">
                {data.buildRecommendation.matched.map((rec, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-deadlock-green/10 border border-deadlock-green/30 text-deadlock-green text-xs font-medium rounded-sm">
                    {rec.name}
                    <span className="text-[10px] text-deadlock-green/60">{rec.winRate}% WR</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing items */}
          {data.buildRecommendation.missing.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-deadlock-amber mb-2">◇ Consider building</p>
              <div className="flex flex-wrap gap-2">
                {data.buildRecommendation.missing.map((rec, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-deadlock-amber/10 border border-deadlock-amber/30 text-deadlock-amber text-xs font-medium rounded-sm">
                    {rec.name}
                    <span className="text-[10px] text-deadlock-amber/60">{rec.timing} · {rec.winRate}% WR</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Playstyle advice */}
          {data.buildRecommendation.playstyle && (
            <div className="bg-deadlock-surface/50 border border-deadlock-border rounded-sm p-3 mt-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-deadlock-muted mb-1">Playstyle Advice</p>
              <p className="text-xs text-deadlock-text-dim">{data.buildRecommendation.playstyle}</p>
            </div>
          )}
        </div>
      )}

      {/* Build Data Disclaimer */}
      <div className="bg-deadlock-amber/5 border border-deadlock-amber/20 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-deadlock-amber mt-0.5 flex-shrink-0" />
        <p className="text-xs text-deadlock-muted">
          Build data reflects the first build selected at game start and may not reflect build changes during the match.
        </p>
      </div>

      {data.note && (
        <div className="bg-deadlock-bg rounded-lg p-4 text-sm text-deadlock-muted">
          {data.note}
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, label, value, highlight }) {
  return (
    <div className={`bg-deadlock-bg rounded-lg p-3 ${highlight ? 'ring-1 ring-deadlock-accent/30' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-deadlock-muted">{label}</span>
      </div>
      <p className={`font-mono font-semibold text-lg ${highlight ? 'text-deadlock-accent' : ''}`}>
        {value}
      </p>
    </div>
  );
}
