import { TrendingUp, TrendingDown, BarChart3, Award } from 'lucide-react';

export default function BenchmarksModule({ data }) {
  const { userWinrate, benchmarkWinrate, winrateDiff, userKda, benchmarkKda, kdaDiff, percentile } = data;

  return (
    <div className="space-y-6">
      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox
          icon={<BarChart3 className="w-4 h-4 text-deadlock-purple" />}
          label="Percentile"
          value={`${percentile}%`}
        />
        <StatBox
          label="Module Score"
          value={`${data.score}/100`}
          highlight
        />
      </div>

      {/* Winrate Comparison */}
      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">Win Rate vs Top Players</h3>
        <ComparisonBar
          label="Win Rate"
          userValue={userWinrate}
          benchmarkValue={benchmarkWinrate}
          diff={winrateDiff}
          unit="%"
        />
      </div>

      {/* KDA Comparison */}
      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">KDA vs Top Players</h3>
        <ComparisonBar
          label="KDA"
          userValue={userKda}
          benchmarkValue={benchmarkKda}
          diff={kdaDiff}
          unit=""
        />
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

function ComparisonBar({ label, userValue, benchmarkValue, diff, unit }) {
  const isPositive = diff >= 0;
  const maxVal = Math.max(userValue, benchmarkValue, 1);
  const userPercent = (userValue / maxVal) * 100;
  const benchmarkPercent = (benchmarkValue / maxVal) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-deadlock-muted">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono">{userValue}{unit}</span>
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-deadlock-green" />
          ) : (
            <TrendingDown className="w-4 h-4 text-deadlock-red" />
          )}
          <span className={`font-mono ${isPositive ? 'text-deadlock-green' : 'text-deadlock-red'}`}>
            {diff > 0 ? '+' : ''}{diff}{unit}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        {/* User Bar */}
        <div className="flex items-center gap-2 text-xs">
          <span className="w-16 text-deadlock-muted">You</span>
          <div className="flex-1 h-4 bg-deadlock-border rounded-full overflow-hidden">
            <div
              className="h-full bg-deadlock-accent rounded-full transition-all"
              style={{ width: `${userPercent}%` }}
            />
          </div>
        </div>
        
        {/* Benchmark Bar */}
        <div className="flex items-center gap-2 text-xs">
          <span className="w-16 text-deadlock-muted">Top 10%</span>
          <div className="flex-1 h-4 bg-deadlock-border rounded-full overflow-hidden">
            <div
              className="h-full bg-deadlock-purple rounded-full transition-all"
              style={{ width: `${benchmarkPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
