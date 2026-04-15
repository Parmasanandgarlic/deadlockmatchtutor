import { formatPercent, formatTime } from '../../utils/formatters';
import { Castle, MapPin, CheckCircle, XCircle } from 'lucide-react';

export default function ObjectivesModule({ data }) {
  const { objectiveDamageShare, midBossPresence, objectiveTimeline } = data;

  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Castle className="w-4 h-4 text-deadlock-accent" />}
          label="Objective Dmg Share"
          value={`${objectiveDamageShare?.sharePercent ?? 0}%`}
        />
        <StatCard
          icon={<MapPin className="w-4 h-4 text-deadlock-purple" />}
          label="Mid Boss Presence"
          value={
            midBossPresence?.events?.length > 0
              ? midBossPresence.wasPresent
                ? 'Present'
                : 'Absent'
              : 'N/A'
          }
        />
        <StatCard label="Module Score" value={`${data.score}/100`} highlight />
      </div>

      {/* Per-Objective Breakdown */}
      {objectiveDamageShare?.byObjective && Object.keys(objectiveDamageShare.byObjective).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">Damage by Objective Type</h3>
          <div className="space-y-2">
            {Object.entries(objectiveDamageShare.byObjective).map(([type, d]) => (
              <div key={type} className="flex items-center justify-between bg-deadlock-bg rounded-lg px-3 py-2 text-sm">
                <span className="capitalize">{type.replace('npc_', '')}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{d.player} / {d.team}</span>
                  <span className="text-deadlock-accent font-mono">{d.sharePercent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mid Boss Events */}
      {midBossPresence?.events?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">Mid Boss Events</h3>
          <div className="space-y-2">
            {midBossPresence.events.map((evt, i) => (
              <div key={i} className="flex items-center justify-between bg-deadlock-bg rounded-lg px-3 py-2 text-sm">
                <span className="font-mono">{evt.timeFormatted}</span>
                <div className="flex items-center gap-2">
                  <span className="text-deadlock-muted">Team: {evt.securedByTeam}</span>
                  {evt.wasPresent ? (
                    <CheckCircle className="w-4 h-4 text-deadlock-green" />
                  ) : (
                    <XCircle className="w-4 h-4 text-deadlock-red" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Objective Timeline */}
      {objectiveTimeline && objectiveTimeline.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-deadlock-text-dim mb-3">Objective Timeline</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {objectiveTimeline.map((evt, i) => (
              <div key={i} className="flex items-center gap-3 bg-deadlock-bg rounded-lg px-3 py-2 text-sm">
                <span className="font-mono text-deadlock-accent w-12">{evt.timeFormatted}</span>
                <span className="capitalize">{(evt.objectiveType || '').replace('npc_', '')}</span>
                {evt.destroyed && <span className="badge-loss text-xs">Destroyed</span>}
                <span className="ml-auto text-deadlock-muted text-xs">{evt.team}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!objectiveTimeline || objectiveTimeline.length === 0) &&
        (!midBossPresence?.events || midBossPresence.events.length === 0) && (
          <p className="text-deadlock-muted text-sm text-center py-4">
            No objective event data available from the replay parser.
          </p>
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
