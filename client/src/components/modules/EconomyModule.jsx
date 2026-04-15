import SpmTimeline from '../charts/SpmTimeline';
import { formatNumber, formatTime } from '../../utils/formatters';
import { TrendingUp, Coins, Target } from 'lucide-react';

export default function EconomyModule({ data }) {
  return (
    <div className="space-y-6">
      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox
          icon={<Coins className="w-4 h-4 text-deadlock-accent" />}
          label="Total Souls"
          value={formatNumber(data.totalSouls)}
        />
        <StatBox
          icon={<TrendingUp className="w-4 h-4 text-deadlock-green" />}
          label="Average SPM"
          value={data.averageSpm}
        />
        <StatBox
          icon={<Target className="w-4 h-4 text-deadlock-purple" />}
          label="Deny Rate"
          value={`${data.laningDenyRate}%`}
        />
        <StatBox
          label="Module Score"
          value={`${data.score}/100`}
          highlight
        />
      </div>

      {/* SPM Timeline Chart */}
      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">Souls Per Minute Timeline</h3>
        <SpmTimeline data={data.spmTimeline} />
      </div>

      {/* Neutral Camp Efficiency */}
      {data.neutralEfficiency && (
        <div>
          <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">Neutral Camp Efficiency</h3>
          <div className="grid grid-cols-3 gap-3">
            {['tier1', 'tier2', 'tier3'].map((tier) => {
              const d = data.neutralEfficiency[tier];
              if (!d) return null;
              const pct = Math.round((d.ratio || 0) * 100);
              return (
                <div key={tier} className="bg-deadlock-bg rounded-lg p-3 text-center">
                  <p className="text-xs text-deadlock-muted uppercase mb-1">{tier.replace('tier', 'Tier ')}</p>
                  <p className="font-mono font-semibold text-lg">{d.actual}/{d.expected}</p>
                  <div className="w-full h-1.5 bg-deadlock-border rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-deadlock-accent rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-deadlock-muted mt-1">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stagnation Windows */}
      {data.stagnationWindows && data.stagnationWindows.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">Farming Stagnation Periods</h3>
          <div className="space-y-2">
            {data.stagnationWindows.map((w, i) => (
              <div key={i} className="flex items-center gap-3 text-sm bg-deadlock-bg rounded-lg px-3 py-2">
                <span className="font-mono text-deadlock-red">{w.startFormatted}</span>
                <span className="text-deadlock-muted">&rarr;</span>
                <span className="font-mono text-deadlock-red">{w.endFormatted}</span>
                <span className="text-deadlock-muted ml-auto">
                  {Math.round(w.durationSeconds / 60)}m stalled
                </span>
              </div>
            ))}
          </div>
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
