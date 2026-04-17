import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

export default function BenchmarksModule({ data }) {
  const {
    userKda,
    benchmarkKda,
    kdaDiff,
    userSoulsPerMin,
    benchmarkSoulsPerMin,
    percentile,
  } = data;

  const soulsDiff = (userSoulsPerMin ?? 0) - (benchmarkSoulsPerMin ?? 0);

  return (
    <div className="space-y-6">
      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <StatBox
          icon={<BarChart3 className="w-4 h-4 text-deadlock-purple" />}
          label="Match vs Career Score"
          value={`${percentile}%`}
        />
        <StatBox
          label="Module Score"
          value={`${data.score}/100`}
          highlight
        />
      </div>

      {/* KDA Comparison */}
      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">
          KDA — This Match vs Career Average
        </h3>
        <ComparisonBar
          label="KDA"
          userValue={userKda}
          benchmarkValue={benchmarkKda}
          diff={kdaDiff}
          unit=""
          userLabel="This Match"
          benchmarkLabel="Career Avg"
        />
      </div>

      {/* Souls/min Comparison */}
      {benchmarkSoulsPerMin > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">
            Souls / min — This Match vs Career Average
          </h3>
          <ComparisonBar
            label="Souls/min"
            userValue={userSoulsPerMin}
            benchmarkValue={benchmarkSoulsPerMin}
            diff={soulsDiff}
            unit=""
            userLabel="This Match"
            benchmarkLabel="Career Avg"
          />
        </div>
      )}

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

function ComparisonBar({
  label,
  userValue,
  benchmarkValue,
  diff,
  unit,
  userLabel = 'You',
  benchmarkLabel = 'Benchmark',
}) {
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
        <div className="flex items-center gap-2 text-xs">
          <span className="w-24 text-deadlock-muted shrink-0">{userLabel}</span>
          <div className="flex-1 h-4 bg-deadlock-border rounded-full overflow-hidden">
            <div
              className="h-full bg-deadlock-accent rounded-full transition-all"
              style={{ width: `${userPercent}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-24 text-deadlock-muted shrink-0">{benchmarkLabel}</span>
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
