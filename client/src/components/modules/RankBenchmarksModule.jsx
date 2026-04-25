import { ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';

export default function RankBenchmarksModule({ data }) {
  if (!data) return null;
  const { score, tierName, tierImageUrl, comparisons = [], summary, observed, expected } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {tierImageUrl ? (
            <img
              src={tierImageUrl}
              alt={`${tierName} rank benchmark badge`}
              width="48"
              height="48"
              loading="lazy"
              decoding="async"
              className="w-12 h-12 object-contain"
            />
          ) : (
            <ShieldCheck className="w-10 h-10 text-deadlock-accent" />
          )}
          <div>
            <p className="text-xs uppercase tracking-widest text-deadlock-muted">Rank-Calibrated Benchmark</p>
            <p className="font-semibold">{tierName || 'Unranked'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-deadlock-muted">Module Score</p>
          <p className="font-mono text-2xl font-bold text-deadlock-accent">{score}/100</p>
        </div>
      </div>

      {summary && (
        <p className="text-sm text-deadlock-text-dim bg-deadlock-bg p-3 rounded-lg">{summary}</p>
      )}

      {/* Comparisons table */}
      <div className="overflow-x-auto bg-deadlock-bg border border-deadlock-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-deadlock-muted uppercase text-[10px] tracking-[0.24em]">
              <th className="py-2 pr-4">Metric</th>
              <th className="py-2 pr-4">You</th>
              <th className="py-2 pr-4">{tierName || 'Peers'}</th>
              <th className="py-2 pr-4">Delta</th>
              <th className="py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((c) => {
              const up = c.delta >= 0;
              const pct = c.score != null ? Math.max(0, Math.min(100, c.score)) : 0;
              return (
                <tr key={c.metric} className="border-t border-deadlock-border/40">
                  <td className="py-2 pr-4 text-deadlock-text-dim">{c.metric}</td>
                  <td className="py-2 pr-4 font-mono">{c.observed}</td>
                  <td className="py-2 pr-4 font-mono text-deadlock-muted">{c.expected}</td>
                  <td className={`py-2 pr-4 font-mono flex items-center gap-1 ${up ? 'text-deadlock-green' : 'text-deadlock-red'}`}>
                    {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {up ? '+' : ''}{c.delta}
                  </td>
                  <td className="py-2 font-mono">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <span className="w-12 text-right">{c.score != null ? `${c.score}/100` : '—'}</span>
                      {c.score != null && (
                        <div className="flex-1 h-2 bg-deadlock-border/70 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 65 ? 'bg-deadlock-green' : pct >= 45 ? 'bg-deadlock-amber' : 'bg-deadlock-red'}`} style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
