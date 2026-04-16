import { formatNumber } from '../../utils/formatters';
import { Swords, Skull, Target, Zap } from 'lucide-react';

export default function CombatModule({ data }) {
  const { kills, deaths, assists, kda, damage } = data;

  return (
    <div className="space-y-6">
      {/* Key Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatBox
          icon={<Swords className="w-4 h-4 text-deadlock-green" />}
          label="Kills"
          value={kills}
        />
        <StatBox
          icon={<Skull className="w-4 h-4 text-deadlock-red" />}
          label="Deaths"
          value={deaths}
        />
        <StatBox
          icon={<Target className="w-4 h-4 text-deadlock-blue" />}
          label="Assists"
          value={assists}
        />
        <StatBox
          icon={<Zap className="w-4 h-4 text-deadlock-accent" />}
          label="KDA"
          value={kda}
        />
        <StatBox
          label="Module Score"
          value={`${data.score}/100`}
          highlight
        />
      </div>

      {/* Damage Output */}
      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">Damage Output</h3>
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
