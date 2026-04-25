import { TrendingUp, Trophy, Sword, Coins, Flame, Skull } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import Tooltip from '../ui/Tooltip';
import CompassMedallion from '../ui/CompassMedallion';

export default function HeroPerformanceModule({ data }) {
  if (!data) return null;

  const hasMatchStats = data.matchKda != null;
  const winrate = data.winrate ?? 0;
  const avgKda = data.avgKda ?? 0;
  const matchesPlayed = data.matchesPlayed ?? 0;
  const avgSouls = data.avgSouls ?? 0;

  const matchKdaLabel = data.matchKda != null ? Number(data.matchKda).toFixed(2) : '—';
  const soulsPerMinLabel = data.soulsPerMin != null ? formatNumber(data.soulsPerMin) : '—';
  const damagePerMinLabel = data.damagePerMin != null ? formatNumber(data.damagePerMin) : '—';
  const deathsLabel = data.deaths != null ? data.deaths : 0;

  return (
    <div className="space-y-6">
      {hasMatchStats && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-deadlock-text-dim uppercase tracking-[0.24em]">This Match</h3>
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-deadlock-muted">live performance</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Tooltip
              content={{
                term: 'Match KDA',
                definition: 'Your kills/deaths/assists ratio for this specific match. Compare to career average to gauge performance.',
                category: 'Combat'
              }}
            >
              <StatBox
                icon={<Sword className="w-4 h-4 text-deadlock-accent" />}
                label="Match KDA"
                value={matchKdaLabel}
                highlight
              />
            </Tooltip>
            <Tooltip
              content={{
                term: 'Souls Per Minute',
                definition: 'Average souls collected per minute. Critical for power spike timing and item progression in Deadlock.',
                category: 'Economy'
              }}
            >
              <StatBox
                icon={<Coins className="w-4 h-4 text-deadlock-accent" />}
                label="Souls / min"
                value={soulsPerMinLabel}
              />
            </Tooltip>
            <Tooltip
              content={{
                term: 'Damage Per Minute',
                definition: 'Average damage dealt to heroes per minute. Indicates fight participation and damage consistency.',
                category: 'Combat'
              }}
            >
              <StatBox
                icon={<Flame className="w-4 h-4 text-deadlock-red" />}
                label="Damage / min"
                value={damagePerMinLabel}
              />
            </Tooltip>
            <Tooltip
              content={{
                term: 'Deaths',
                definition: 'Total deaths in this match. Each death grants souls to enemies and removes you from map control.',
                category: 'Combat'
              }}
            >
              <StatBox
                icon={<Skull className="w-4 h-4 text-deadlock-purple" />}
                label="Deaths"
                value={deathsLabel}
              />
            </Tooltip>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-deadlock-text-dim uppercase tracking-[0.24em]">
            Career on This Hero
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-deadlock-muted">
            {matchesPlayed} {matchesPlayed === 1 ? 'match' : 'matches'} tracked
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Tooltip
            content={{
              term: 'Win Rate',
              definition: 'Percentage of matches won with this hero across your career. Reflects overall mastery and effectiveness.',
              category: 'General'
            }}
          >
            <StatBox
              icon={<Trophy className="w-4 h-4 text-deadlock-green" />}
              label="Win Rate"
              value={`${winrate}%`}
              highlight={winrate >= 55}
            />
          </Tooltip>
          <Tooltip
            content={{
              term: 'Average KDA',
              definition: 'Your typical KDA ratio when playing this hero. Use this as a baseline to compare individual match performance.',
              category: 'Combat'
            }}
          >
            <StatBox
              icon={<Sword className="w-4 h-4 text-deadlock-accent" />}
              label="Avg KDA"
              value={avgKda}
              highlight={avgKda >= 2.5}
            />
          </Tooltip>
          <Tooltip
            content={{
              term: 'Matches Played',
              definition: 'Total number of matches played with this hero. More matches indicate greater experience and familiarity.',
              category: 'General'
            }}
          >
            <StatBox
              icon={<TrendingUp className="w-4 h-4 text-deadlock-purple" />}
              label="Matches Played"
              value={matchesPlayed}
            />
          </Tooltip>
          <Tooltip
            content={{
              term: 'Average Souls',
              definition: 'Typical soul count at game end when playing this hero. Reflects farming patterns and game impact.',
              category: 'Economy'
            }}
          >
            <StatBox
              icon={<CompassMedallion className="w-4 h-4 text-deadlock-blue" />}
              label="Avg Souls"
              value={formatNumber(avgSouls)}
              highlight={avgSouls >= 12000}
            />
          </Tooltip>
        </div>
      </div>

      {!hasMatchStats && (
        <div className="bg-deadlock-bg/70 border border-deadlock-border px-4 py-3 text-sm text-deadlock-text-dim">
          Match-specific stats were unavailable for this report, so only career values are shown.
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
