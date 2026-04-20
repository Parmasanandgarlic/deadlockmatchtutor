import { formatNumber } from '../../utils/formatters';
import { ShoppingBag, Coins, Box, TrendingUp, AlertCircle } from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import TimelineGraph from '../dashboard/TimelineGraph';
import { useAssets } from '../../contexts/AssetContext';

export default function ItemizationModule({ data, meta }) {
  const { items, netWorth, souls, soulsPerMin } = data;
  const { itemsMap } = useAssets();
  
  return (
    <div className="space-y-6">
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
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3 flex items-center gap-2">
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
        {items && items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((item, i) => {
              const itemAsset = itemsMap?.[item.id];
              const itemName = itemAsset?.name || item.name || 'Unknown Item';
              const itemImg = itemAsset?.images?.icon_image_small_webp || itemAsset?.images?.icon_image_small;
              
              return (
                <Tooltip
                  key={i}
                  content={{
                    term: itemName,
                    definition: `Item cost: ${formatNumber(item.cost)} gold. Item effectiveness depends on timing and enemy composition.`,
                    category: 'Build'
                  }}
                >
                  <div className="bg-deadlock-bg rounded-lg p-3 text-center cursor-help hover:bg-deadlock-bg/80 transition-colors">
                    {itemImg ? (
                      <img
                        src={itemImg}
                        alt={itemName}
                        className="w-12 h-12 mx-auto mb-2 object-contain rounded"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 mx-auto mb-2 overflow-hidden rounded bg-deadlock-surface border border-deadlock-border flex items-center justify-center text-deadlock-muted">
                        <Box className="w-6 h-6" />
                      </div>
                    )}
                    <p className="text-xs text-deadlock-muted truncate">{itemName}</p>
                    <p className="font-mono text-sm">{formatNumber(item.cost)}</p>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        ) : (
          <p className="text-deadlock-muted text-sm bg-deadlock-bg rounded-lg px-3 py-4 text-center">
            No item data available for this match.
          </p>
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
