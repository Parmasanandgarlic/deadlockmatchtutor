import { TrendingUp, Trophy, Target, Sword, Coins, Flame, Skull } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import Tooltip from '../ui/Tooltip';

export default function HeroPerformanceModule({ data }) {
  const hasMatchStats = data.matchKda != null;
  
  return (
    <div className="space-y-6">
      {hasMatchStats && (
        <div>
          <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">This Match</h3>
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
                value={data.matchKda}
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
                value={formatNumber(data.soulsPerMin)}
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
                value={formatNumber(data.damagePerMin)}
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
                value={data.deaths || 0}
              />
            </Tooltip>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">
          Career on This Hero
        </h3>
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
              value={`${data.winrate}%`}
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
              value={data.avgKda}
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
              value={data.matchesPlayed}
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
              icon={<Target className="w-4 h-4 text-deadlock-blue" />}
              label="Avg Souls"
              value={formatNumber(data.avgSouls)}
            />
          </Tooltip>
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
