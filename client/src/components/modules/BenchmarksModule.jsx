import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import Tooltip from '../ui/Tooltip';

export default function BenchmarksModule({ data }) {
  if (!data) return null;

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
        <Tooltip
          content={{
            term: 'Match vs Career Score',
            definition: 'How your performance in this match compares to your career average with this hero. Higher percentiles indicate above-average performance.',
            category: 'Comparison'
          }}
        >
          <StatBox
            icon={<BarChart3 className="w-4 h-4 text-deadlock-purple" />}
            label="Match vs Career Score"
            value={`${percentile}%`}
            highlight={percentile >= 65}
          />
        </Tooltip>
        <StatBox
          label="Module Score"
          value={`${data.score}/100`}
          highlight
        />
      </div>

      {/* KDA Comparison */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-deadlock-text-dim uppercase tracking-[0.24em] flex items-center gap-2">
          <Tooltip
            content={{
              term: 'KDA',
              definition: 'Kills/Deaths/Assists ratio. In Deadlock, deaths are especially costly as they grant souls to enemies and remove you from map control.',
              category: 'Combat'
            }}
          >
            <span>KDA — This Match vs Career Average</span>
          </Tooltip>
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-deadlock-muted">
            performance delta
          </span>
        </div>
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
          <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3 uppercase tracking-[0.24em] flex items-center gap-2">
            <Tooltip
              content={{
                term: 'Souls Per Minute',
                definition: 'Average souls collected per minute. Critical for power spike timing and item progression. Higher values indicate better farming efficiency.',
                category: 'Economy'
              }}
            >
              <span>Souls / min — This Match vs Career Average</span>
            </Tooltip>
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
    <div className={`bg-deadlock-bg rounded-lg p-3 border ${highlight ? 'border-deadlock-accent/40 ring-1 ring-deadlock-accent/30' : 'border-deadlock-border'}`}>
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
        <span className="text-deadlock-muted uppercase tracking-[0.18em] text-[10px]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-deadlock-text">{userValue}{unit}</span>
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
          <div className="flex-1 h-4 bg-deadlock-border/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-deadlock-accent rounded-full transition-all"
              style={{ width: `${userPercent}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-24 text-deadlock-muted shrink-0">{benchmarkLabel}</span>
          <div className="flex-1 h-4 bg-deadlock-border/70 rounded-full overflow-hidden">
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
