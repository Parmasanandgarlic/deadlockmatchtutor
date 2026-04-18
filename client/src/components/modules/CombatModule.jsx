import { formatNumber } from '../../utils/formatters';
import { Swords, Skull, Target, Zap, Flame, Timer } from 'lucide-react';
import Tooltip from '../ui/Tooltip';

export default function CombatModule({ data }) {
  const { kills, deaths, assists, kda, damage, damagePerMin, deathsPerMin } = data;
  
  return (
    <div className="space-y-6">
      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Tooltip
          content={{
            term: 'Kills',
            definition: 'Enemy heroes eliminated. Kills provide gold, souls, and map pressure but should be balanced with farming.',
            category: 'Combat'
          }}
        >
          <StatBox
            icon={<Swords className="w-4 h-4 text-deadlock-green" />}
            label="Kills"
            value={kills}
          />
        </Tooltip>
        <Tooltip
          content={{
            term: 'Deaths',
            definition: 'Times your hero died. Deaths are especially punishing in Deadlock as they grant souls to enemies and remove you from map control.',
            category: 'Combat'
          }}
        >
          <StatBox
            icon={<Skull className="w-4 h-4 text-deadlock-red" />}
            label="Deaths"
            value={deaths}
          />
        </Tooltip>
        <Tooltip
          content={{
            term: 'Assists',
            definition: 'Contributions to kills where you dealt damage or provided utility within 5 seconds of the kill.',
            category: 'Combat'
          }}
        >
          <StatBox
            icon={<Target className="w-4 h-4 text-deadlock-blue" />}
            label="Assists"
            value={assists}
          />
        </Tooltip>
        <Tooltip
          content={{
            term: 'KDA',
            definition: '(Kills + Assists) / Deaths ratio. A measure of combat effectiveness and survivability.',
            category: 'Combat'
          }}
        >
          <StatBox
            icon={<Zap className="w-4 h-4 text-deadlock-accent" />}
            label="KDA"
            value={kda}
          />
        </Tooltip>
        <StatBox
          label="Module Score"
          value={`${data.score}/100`}
          highlight
        />
      </div>

      {/* Rate Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3 flex items-center gap-2">
          <Tooltip
            content={{
              term: 'Pace Metrics',
              definition: 'Rate-based statistics showing your performance intensity per minute of game time.',
              category: 'General'
            }}
          >
            <span>Pace</span>
          </Tooltip>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Tooltip
            content={{
              term: 'Damage Per Minute',
              definition: 'Average damage dealt to heroes per minute. Higher values indicate consistent fight participation and damage output.',
              category: 'Combat'
            }}
          >
            <div className="bg-deadlock-bg rounded-lg p-4 flex items-center justify-between cursor-help hover:bg-deadlock-bg/80 transition-colors">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-deadlock-accent" />
                <span className="text-deadlock-muted text-sm">Damage / min</span>
              </div>
              <span className="font-mono font-semibold text-lg text-deadlock-accent">
                {formatNumber(damagePerMin ?? 0)}
              </span>
            </div>
          </Tooltip>
          <Tooltip
            content={{
              term: 'Deaths Per Minute',
              definition: 'Average deaths per minute. Lower is better—high values suggest overextension or poor positioning.',
              category: 'Combat'
            }}
          >
            <div className="bg-deadlock-bg rounded-lg p-4 flex items-center justify-between cursor-help hover:bg-deadlock-bg/80 transition-colors">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-deadlock-red" />
                <span className="text-deadlock-muted text-sm">Deaths / min</span>
              </div>
              <span className="font-mono font-semibold text-lg text-deadlock-red">
                {deathsPerMin ?? 0}
              </span>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Damage Output */}
      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">
          <Tooltip
            content={{
              term: 'Total Damage',
              definition: 'Cumulative damage dealt to enemy heroes throughout the match. Reflects fight participation and damage consistency.',
              category: 'Combat'
            }}
          >
            <span>Total Damage</span>
          </Tooltip>
        </h3>
        <div className="bg-deadlock-bg rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-deadlock-muted">Total Damage Dealt</span>
            <span className="font-mono font-semibold text-xl text-deadlock-accent">
              {formatNumber(damage)}
            </span>
          </div>
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
