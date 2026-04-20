import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid } from 'recharts';

const TREND_STYLES = {
  improving: { color: 'text-deadlock-green', Icon: TrendingUp, label: 'Improving' },
  declining: { color: 'text-deadlock-red',   Icon: TrendingDown, label: 'Declining' },
  stable:    { color: 'text-deadlock-muted', Icon: Minus, label: 'Stable' },
};

export default function TemporalTrendCard({ temporal }) {
  if (!temporal || temporal.sampleSize === 0) return null;
  const { recentForm, trendLabel, streak, heatmap = [], comparisonVsAvg, summary } = temporal;
  const style = TREND_STYLES[trendLabel] || TREND_STYLES.stable;
  const { Icon } = style;

  const chartData = heatmap.map((h, i) => ({
    idx: i + 1,
    kda: h.kda,
    soulsPerMin: h.soulsPerMin,
    won: h.won,
  }));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-deadlock-accent" />
          <h2 className="text-lg font-semibold">Temporal Form</h2>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-semibold ${style.color}`}>
          <Icon className="w-4 h-4" />
          {style.label}
        </div>
      </div>

      <p className="text-sm text-deadlock-text-dim mb-4">{summary}</p>

      {recentForm && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <Metric label="Avg KDA" value={recentForm.avgKda} />
          <Metric label="Avg Souls/min" value={recentForm.avgSoulsPerMin} />
          <Metric label="Win Rate" value={recentForm.winRate != null ? `${recentForm.winRate}%` : '—'} />
          <Metric
            label="Current Streak"
            value={streak === 0 ? '—' : `${streak > 0 ? streak + 'W' : Math.abs(streak) + 'L'}`}
            valueClass={streak > 0 ? 'text-deadlock-green' : streak < 0 ? 'text-deadlock-red' : ''}
          />
        </div>
      )}

      {chartData.length >= 2 && (
        <div className="h-36 mb-3">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#2a2a35" strokeDasharray="3 3" />
              <XAxis dataKey="idx" tick={{ fill: '#8c8c9c', fontSize: 10 }} />
              <YAxis tick={{ fill: '#8c8c9c', fontSize: 10 }} />
              <ReTooltip contentStyle={{ background: '#14141c', border: '1px solid #2a2a35' }} />
              <Line type="monotone" dataKey="kda" stroke="#ff6b35" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {comparisonVsAvg && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <DeltaPill label="KDA vs avg" delta={comparisonVsAvg.kdaDelta} />
          <DeltaPill label="SPM vs avg" delta={comparisonVsAvg.spmDelta} />
          <DeltaPill label="Kills vs avg" delta={comparisonVsAvg.killsDelta} />
          <DeltaPill label="Deaths vs avg" delta={comparisonVsAvg.deathsDelta} invert />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, valueClass = '' }) {
  return (
    <div className="bg-deadlock-bg rounded-lg p-2 text-center">
      <p className="text-[10px] uppercase tracking-widest text-deadlock-muted">{label}</p>
      <p className={`font-mono text-lg font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function DeltaPill({ label, delta, invert = false }) {
  if (delta == null) return null;
  const positive = invert ? delta < 0 : delta > 0;
  const neutral = delta === 0;
  const color = neutral ? 'text-deadlock-muted' : positive ? 'text-deadlock-green' : 'text-deadlock-red';
  return (
    <div className="bg-deadlock-bg rounded-lg p-2 text-center">
      <p className="text-[10px] uppercase tracking-widest text-deadlock-muted">{label}</p>
      <p className={`font-mono text-sm ${color}`}>{delta > 0 ? '+' : ''}{delta}</p>
    </div>
  );
}
