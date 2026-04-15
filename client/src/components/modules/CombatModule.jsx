import DamageBreakdown from '../charts/DamageBreakdown';
import { formatNumber, formatPercent } from '../../utils/formatters';
import { Swords, Skull, Shield, Zap } from 'lucide-react';

export default function CombatModule({ data }) {
  const { teamfightParticipation, damageTakenBreakdown, deadTimePenalty, teamfights } = data;

  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Swords className="w-4 h-4 text-deadlock-accent" />}
          label="Teamfight Participation"
          value={`${teamfightParticipation?.participationPercent ?? 0}%`}
        />
        <StatCard
          icon={<Skull className="w-4 h-4 text-deadlock-red" />}
          label="Deaths / Dead Time"
          value={`${deadTimePenalty?.deathCount ?? 0} / ${deadTimePenalty?.totalDeadSeconds ?? 0}s`}
        />
        <StatCard
          icon={<Shield className="w-4 h-4 text-deadlock-blue" />}
          label="Poke Damage Taken"
          value={formatNumber(damageTakenBreakdown?.pokeDamage ?? 0)}
        />
        <StatCard
          label="Module Score"
          value={`${data.score}/100`}
          highlight
        />
      </div>

      {/* Kill / Assist Breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">Kill & Assist Breakdown</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-deadlock-bg rounded-lg p-3 text-center">
            <p className="text-xs text-deadlock-muted">Your Kills</p>
            <p className="font-mono font-semibold text-xl text-deadlock-green">
              {teamfightParticipation?.playerKills ?? 0}
            </p>
          </div>
          <div className="bg-deadlock-bg rounded-lg p-3 text-center">
            <p className="text-xs text-deadlock-muted">Your Assists</p>
            <p className="font-mono font-semibold text-xl text-deadlock-blue">
              {teamfightParticipation?.playerAssists ?? 0}
            </p>
          </div>
          <div className="bg-deadlock-bg rounded-lg p-3 text-center">
            <p className="text-xs text-deadlock-muted">Total Team Kills</p>
            <p className="font-mono font-semibold text-xl">
              {teamfightParticipation?.totalTeamKills ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Damage Taken Chart */}
      <div>
        <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">Damage Taken Breakdown</h3>
        <DamageBreakdown data={damageTakenBreakdown} />
      </div>

      {/* Dead-Time Penalty */}
      {deadTimePenalty && deadTimePenalty.totalDeadSeconds > 0 && (
        <div className="bg-deadlock-red/5 border border-deadlock-red/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-deadlock-red mb-1 flex items-center gap-2">
            <Skull className="w-4 h-4" /> Dead-Time Penalty
          </h3>
          <p className="text-sm text-deadlock-text-dim">{deadTimePenalty.lostFarmDescription}</p>
        </div>
      )}

      {/* Teamfight Log */}
      {teamfights && teamfights.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">Detected Teamfights</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {teamfights.map((tf) => (
              <div key={tf.id} className="flex items-center justify-between bg-deadlock-bg rounded-lg px-3 py-2 text-sm">
                <span className="font-mono">{tf.startFormatted} — {tf.endFormatted}</span>
                <span className="text-deadlock-muted">{tf.kills.length} kills · {tf.participantCount} heroes</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, highlight }) {
  return (
    <div className={`bg-deadlock-bg rounded-lg p-3 ${highlight ? 'ring-1 ring-deadlock-accent/30' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-deadlock-muted">{label}</span>
      </div>
      <p className={`font-mono font-semibold text-lg ${highlight ? 'text-deadlock-accent' : ''}`}>{value}</p>
    </div>
  );
}
