import { formatNumber, getItemImage } from '../../utils/formatters';
import { ShoppingBag, Coins, Box } from 'lucide-react';

export default function ItemizationModule({ data }) {
  const { items, netWorth, souls } = data;

  return (
    <div className="space-y-6">
      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatBox
          icon={<Coins className="w-4 h-4 text-deadlock-accent" />}
          label="Net Worth"
          value={formatNumber(netWorth)}
        />
        <StatBox
          icon={<ShoppingBag className="w-4 h-4 text-deadlock-purple" />}
          label="Souls"
          value={formatNumber(souls)}
        />
        <StatBox
          label="Module Score"
          value={`${data.score}/100`}
          highlight
        />
      </div>

      {/* Items List */}
      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">Item Build</h3>
        {items && items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((item, i) => {
              const itemImg = getItemImage(item.name);
              return (
                <div key={i} className="bg-deadlock-bg rounded-lg p-3 text-center">
                  {itemImg ? (
                    <img
                      src={itemImg}
                      alt={item.name}
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
                  <p className="text-xs text-deadlock-muted truncate">{item.name}</p>
                  <p className="font-mono text-sm">{formatNumber(item.cost)}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-deadlock-muted text-sm bg-deadlock-bg rounded-lg px-3 py-4 text-center">
            No item data available for this match.
          </p>
        )}
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
