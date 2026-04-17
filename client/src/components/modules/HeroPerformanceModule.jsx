import { TrendingUp, Trophy, Target, Sword, Coins, Flame } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

export default function HeroPerformanceModule({ data }) {
  const hasMatchStats = data.matchKda != null;

  return (
    <div className="space-y-6">
      {hasMatchStats && (
        <div>
          <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">This Match</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox
              icon={<Sword className="w-4 h-4 text-deadlock-accent" />}
              label="Match KDA"
              value={data.matchKda}
            />
            <StatBox
              icon={<Coins className="w-4 h-4 text-deadlock-accent" />}
              label="Souls / min"
              value={formatNumber(data.soulsPerMin)}
            />
            <StatBox
              icon={<Flame className="w-4 h-4 text-deadlock-red" />}
              label="Damage / min"
              value={formatNumber(data.damagePerMin)}
            />
            <StatBox
              label="Module Score"
              value={`${data.score}/100`}
              highlight
            />
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">
          Career on This Hero
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox
            icon={<Trophy className="w-4 h-4 text-deadlock-green" />}
            label="Win Rate"
            value={`${data.winrate}%`}
          />
          <StatBox
            icon={<Sword className="w-4 h-4 text-deadlock-accent" />}
            label="Avg KDA"
            value={data.avgKda}
          />
          <StatBox
            icon={<TrendingUp className="w-4 h-4 text-deadlock-purple" />}
            label="Matches Played"
            value={data.matchesPlayed}
          />
          <StatBox
            icon={<Target className="w-4 h-4 text-deadlock-blue" />}
            label="Avg Souls"
            value={formatNumber(data.avgSouls)}
          />
        </div>
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
