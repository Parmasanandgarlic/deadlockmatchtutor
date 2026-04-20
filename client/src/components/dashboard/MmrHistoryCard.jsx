import { Crown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid } from 'recharts';

const TREND_STYLES = {
  climbing:  { color: 'text-deadlock-green', Icon: TrendingUp,   label: 'Climbing' },
  declining: { color: 'text-deadlock-red',   Icon: TrendingDown, label: 'Declining' },
  stable:    { color: 'text-deadlock-muted', Icon: Minus,        label: 'Stable' },
  unknown:   { color: 'text-deadlock-muted', Icon: Minus,        label: 'Unknown' },
};

export default function MmrHistoryCard({ mmr }) {
  if (!mmr || !mmr.current) return null;
  const { current, peak, trend = 'stable', delta30, history = [] } = mmr;
  const style = TREND_STYLES[trend] || TREND_STYLES.stable;
  const { Icon } = style;

  const chartData = history.map((h, i) => ({ idx: i + 1, badge: h.badge, name: h.name }));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-deadlock-accent" />
          <h2 className="text-lg font-semibold">MMR / Rank Trajectory</h2>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-semibold ${style.color}`}>
          <Icon className="w-4 h-4" />
          {style.label}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <RankBox label="Current" info={current} />
        <RankBox label="Peak" info={peak} />
        <div className="bg-deadlock-bg rounded-lg p-2 text-center">
          <p className="text-[10px] uppercase tracking-widest text-deadlock-muted">Sample</p>
          <p className="font-mono text-lg font-semibold">{history.length} games</p>
        </div>
        <div className="bg-deadlock-bg rounded-lg p-2 text-center">
          <p className="text-[10px] uppercase tracking-widest text-deadlock-muted">Net Δ</p>
          <p className={`font-mono text-lg font-semibold ${delta30 > 0 ? 'text-deadlock-green' : delta30 < 0 ? 'text-deadlock-red' : ''}`}>
            {delta30 > 0 ? '+' : ''}{delta30 || 0}
          </p>
        </div>
      </div>

      {chartData.length >= 2 && (
        <div className="h-40">
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="mmrFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6b35" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#ff6b35" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2a35" strokeDasharray="3 3" />
              <XAxis dataKey="idx" tick={{ fill: '#8c8c9c', fontSize: 10 }} />
              <YAxis tick={{ fill: '#8c8c9c', fontSize: 10 }} />
              <ReTooltip
                contentStyle={{ background: '#14141c', border: '1px solid #2a2a35' }}
                formatter={(value, _name, props) => [value, props?.payload?.name || 'Badge']}
              />
              <Area type="monotone" dataKey="badge" stroke="#ff6b35" fill="url(#mmrFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function RankBox({ label, info }) {
  if (!info) return (
    <div className="bg-deadlock-bg rounded-lg p-2 text-center">
      <p className="text-[10px] uppercase tracking-widest text-deadlock-muted">{label}</p>
      <p className="text-xs text-deadlock-muted">—</p>
    </div>
  );
  return (
    <div className="bg-deadlock-bg rounded-lg p-2 flex items-center gap-2">
      {info.imageUrl ? (
        <img src={info.imageUrl} alt={info.name} className="w-8 h-8 object-contain" />
      ) : null}
      <div className="text-left">
        <p className="text-[10px] uppercase tracking-widest text-deadlock-muted">{label}</p>
        <p className="text-sm font-semibold">{info.name || `Badge ${info.badge}`}</p>
      </div>
    </div>
  );
}
