import { formatNumber } from '../../utils/formatters';
import { ShoppingBag, Coins, Box, TrendingUp, AlertCircle, Shield, ArrowUpRight } from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import TimelineGraph from '../dashboard/TimelineGraph';
import { useAssets } from '../../contexts/AssetContext';

export default function ItemizationModule({ data, meta }) {
  const { items = [], netWorth = 0, souls = 0, soulsPerMin = 0 } = data || {};
  const { itemsMap, isLoading } = useAssets();
  const topItem = items[0];
  const topItemAsset = topItem ? itemsMap?.[topItem.id] : null;
  const topItemName = topItemAsset?.name || topItem?.name || 'No build data';
  const topItemImg = topItemAsset?.images?.icon_image_small_webp || topItemAsset?.images?.icon_image_small || topItemAsset?.images?.icon_image_webp || topItemAsset?.images?.icon_image;
  
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
      <div className="card hero-header-bg overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-4 items-stretch">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-deadlock-muted mb-1">Build Dossier</p>
            <h3 className="text-2xl font-serif uppercase tracking-wider text-deadlock-text">Itemization & Economy</h3>
            <p className="text-xs text-deadlock-text-dim mt-2 max-w-2xl">
              Your economy curve, build value, and item progression summarized into a dossier-style build report.
            </p>
          </div>
          <div className="bg-black/30 border border-deadlock-border px-4 py-3 flex items-center gap-3">
            <div className="w-14 h-14 border border-deadlock-amber/30 bg-deadlock-bg flex items-center justify-center overflow-hidden shrink-0">
              {topItemImg ? (
                <img src={topItemImg} alt={topItemName} className="w-full h-full object-contain" />
              ) : (
                <Shield className="w-7 h-7 text-deadlock-amber/70" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.25em] text-deadlock-muted">Lead Item</p>
              <p className="text-sm font-bold text-deadlock-text truncate">{topItemName}</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-deadlock-text-dim mt-1">{items.length ? `${items.length} items tracked` : 'No tracked items yet'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tooltip
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
              const itemAsset = itemsMap?.[item.id];
              const itemName = itemAsset?.name || item.name || 'Unknown Item';
              const itemImg = itemAsset?.images?.icon_image_small_webp || itemAsset?.images?.icon_image_small;
              const itemCost = item.cost ?? itemAsset?.item_cost ?? 0;
              const rarityHint = itemAsset?.tier || itemAsset?.rarity || itemAsset?.grade || null;
              
              return (
                <Tooltip
                  key={i}
                  content={{
                    term: itemName,
                    definition: `Item cost: ${formatNumber(item.cost)} gold. Item effectiveness depends on timing and enemy composition.`,
                    category: 'Build'
                  }}
                >
                  <div className="relative bg-deadlock-bg rounded-none border border-deadlock-border p-3 cursor-help hover:border-deadlock-amber/40 hover:bg-deadlock-bg/80 transition-all duration-200 overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-deadlock-amber/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start gap-3">
                      {itemImg ? (
                        <div className="w-14 h-14 shrink-0 overflow-hidden border border-white/5 bg-black/40 flex items-center justify-center">
                          <img
                            src={itemImg}
                            alt={itemName}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 shrink-0 overflow-hidden border border-deadlock-border bg-deadlock-surface flex items-center justify-center text-deadlock-muted">
                          <Box className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-deadlock-text truncate">{itemName}</p>
                          <ArrowUpRight className="w-3.5 h-3.5 text-deadlock-muted shrink-0" />
                        </div>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-deadlock-muted">
                          {rarityHint ? `Tier ${rarityHint}` : 'Item artifact'}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="font-mono text-sm text-deadlock-amber">{formatNumber(itemCost)}</span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-deadlock-text-dim">gold</span>
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
