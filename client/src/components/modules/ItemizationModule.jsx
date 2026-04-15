import ItemTimingChart from '../charts/ItemTimingChart';
import { formatTime, formatNumber } from '../../utils/formatters';
import { ShoppingBag, Clock, Zap, Box } from 'lucide-react';

export default function ItemizationModule({ data }) {
  const { coreItemTimings, floatingSoulsEvents, activeItemUsage } = data;

  return (
    <div className="space-y-6">
      {/* Core Item Timings */}
      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" /> Core Item Timings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TimingCard
            label="First 3K Item"
            item={coreItemTimings?.first3k}
            benchmark="~8:00"
          />
          <TimingCard
            label="First 6K Item"
            item={coreItemTimings?.first6k}
            benchmark="~16:00"
          />
        </div>
      </div>

      {/* Purchase Timeline Chart */}
      {coreItemTimings?.allPurchases?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">Item Purchase Timeline</h3>
          <ItemTimingChart purchases={coreItemTimings.allPurchases} />
        </div>
      )}

      {/* Floating Souls Events */}
      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Floating Souls ({'>'}3,000 unspent outside base)
        </h3>
        {floatingSoulsEvents && floatingSoulsEvents.length > 0 ? (
          <div className="space-y-2">
            {floatingSoulsEvents.map((e, i) => (
              <div key={i} className="flex items-center justify-between bg-deadlock-bg rounded-lg px-3 py-2 text-sm">
                <span className="font-mono text-deadlock-accent">
                  {formatTime(e.startSeconds)} &rarr; {formatTime(e.endSeconds)}
                </span>
                <span className="text-deadlock-muted">
                  Peak: {formatNumber(e.peakSouls)} souls for {Math.round((e.durationSeconds || 0) / 60)}m
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-deadlock-muted text-sm bg-deadlock-bg rounded-lg px-3 py-4 text-center">
            No floating souls events detected — good spending habits!
          </p>
        )}
      </div>

      {/* Active Item Usage */}
      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Active Item Usage
        </h3>
        {activeItemUsage?.items?.length > 0 ? (
          <div className="space-y-2">
            {activeItemUsage.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-deadlock-bg rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 overflow-hidden rounded bg-deadlock-surface border border-deadlock-border flex items-center justify-center text-deadlock-muted">
                      <Box className="w-3 h-3" />
                   </div>
                   <span className="font-medium">{item.name}</span>
                </div>
                <span className="font-mono">
                  {item.casts}/{item.opportunities} casts
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-deadlock-muted text-sm bg-deadlock-bg rounded-lg px-3 py-4 text-center">
            Active item usage data requires ability log from parser.
          </p>
        )}
      </div>

      {/* Module Score */}
      <div className="flex justify-end">
        <div className="bg-deadlock-bg rounded-lg px-4 py-2 ring-1 ring-deadlock-accent/30">
          <span className="text-xs text-deadlock-muted mr-2">Module Score</span>
          <span className="font-mono font-semibold text-deadlock-accent">{data.score}/100</span>
        </div>
      </div>
    </div>
  );
}

function TimingCard({ label, item, benchmark }) {
  return (
    <div className="bg-deadlock-bg rounded-lg p-4">
      <p className="text-xs text-deadlock-muted mb-3">{label}</p>
      {item ? (
        <div className="flex items-start gap-4">
           <div className="w-12 h-12 overflow-hidden rounded bg-deadlock-surface border border-deadlock-border flex-shrink-0 flex items-center justify-center text-deadlock-muted">
               <Box className="w-6 h-6" />
           </div>
           <div>
              <p className="font-semibold text-lg">{item.item}</p>
              <p className="font-mono text-deadlock-accent">{item.timeFormatted}</p>
              <p className="text-xs text-deadlock-muted mt-1">
                Cost: {formatNumber(item.cost)} · Benchmark: {benchmark}
              </p>
           </div>
        </div>
      ) : (
        <p className="text-deadlock-muted text-sm">Not purchased</p>
      )}
    </div>
  );
}
