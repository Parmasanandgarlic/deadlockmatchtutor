import { Swords, AlertTriangle, Shield, Users } from 'lucide-react';

const DIFFICULTY_STYLES = {
  easy:     { color: 'text-deadlock-green', bg: 'bg-deadlock-green/10', border: 'border-deadlock-green/30' },
  balanced: { color: 'text-deadlock-blue',  bg: 'bg-deadlock-blue/10',  border: 'border-deadlock-blue/30' },
  hard:     { color: 'text-deadlock-amber', bg: 'bg-deadlock-amber/10', border: 'border-deadlock-amber/30' },
  extreme:  { color: 'text-deadlock-red',   bg: 'bg-deadlock-red/10',   border: 'border-deadlock-red/30' },
  unknown:  { color: 'text-deadlock-muted', bg: 'bg-deadlock-bg',       border: 'border-deadlock-border' },
};

export default function MatchupDifficultyModule({ data }) {
  if (!data) return null;
  const {
    score,
    difficulty = 'unknown',
    playerTeamAvgRank,
    enemyTeamAvgRank,
    playerRankName,
    enemyRankName,
    rankDelta,
    netWorthDelta,
    enemyComposition = {},
    playerArchetype,
    counters = [],
    summary,
    note,
  } = data;

  const style = DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.unknown;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Swords className="w-8 h-8 text-deadlock-accent" />
          <div>
            <p className="text-xs uppercase tracking-widest text-deadlock-muted">Matchup Difficulty</p>
            <p className={`font-semibold uppercase ${style.color}`}>{difficulty}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-deadlock-muted">Difficulty Score</p>
          <p className={`font-mono text-2xl font-bold ${style.color}`}>{score}/100</p>
        </div>
      </div>

      {(summary || note) && (
        <p className={`text-sm p-3 rounded-lg border ${style.bg} ${style.border}`}>{summary || note}</p>
      )}

      {/* Rank deltas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatBox
          icon={<Shield className="w-4 h-4 text-deadlock-blue" />}
          label="Your Team Avg Rank"
          value={playerRankName || (playerTeamAvgRank != null ? `Badge ${playerTeamAvgRank}` : '—')}
        />
        <StatBox
          icon={<Shield className="w-4 h-4 text-deadlock-red" />}
          label="Enemy Team Avg Rank"
          value={enemyRankName || (enemyTeamAvgRank != null ? `Badge ${enemyTeamAvgRank}` : '—')}
        />
        <StatBox
          icon={<Users className="w-4 h-4 text-deadlock-purple" />}
          label="Rank Delta"
          value={rankDelta != null ? `${rankDelta >= 0 ? '+' : ''}${rankDelta}` : '—'}
          sub={netWorthDelta != null ? `${netWorthDelta >= 0 ? '+' : ''}${netWorthDelta.toLocaleString()} souls diff` : null}
        />
      </div>

      {/* Enemy composition */}
      <div>
        <p className="text-xs uppercase tracking-widest text-deadlock-muted mb-2">Enemy Composition</p>
        <div className="grid grid-cols-4 gap-2">
          {['tank', 'carry', 'support', 'brawler'].map((arch) => (
            <div key={arch} className="bg-deadlock-bg rounded-lg p-2 text-center">
              <p className="text-xs capitalize text-deadlock-muted">{arch}</p>
              <p className="font-mono text-lg">{enemyComposition[arch] || 0}</p>
            </div>
          ))}
        </div>
        {playerArchetype && (
          <p className="text-xs text-deadlock-muted mt-2">
            Your hero archetype: <span className="font-semibold capitalize text-deadlock-text">{playerArchetype}</span>
          </p>
        )}
      </div>

      {/* Counter heroes */}
      {counters.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-deadlock-muted mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Countering Your Hero
          </p>
          <ul className="space-y-2">
            {counters.map((c) => (
              <li key={`${c.heroId}-${c.reason}`} className="flex items-start gap-2 text-sm bg-deadlock-bg p-2 rounded-lg">
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  c.strength === 'hard' ? 'bg-deadlock-red/20 text-deadlock-red' :
                  c.strength === 'moderate' ? 'bg-deadlock-amber/20 text-deadlock-amber' :
                  'bg-deadlock-blue/20 text-deadlock-blue'
                }`}>{c.strength}</span>
                <div>
                  <p className="font-semibold">{c.heroName}</p>
                  <p className="text-xs text-deadlock-muted">{c.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, label, value, sub }) {
  return (
    <div className="bg-deadlock-bg rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-deadlock-muted">{label}</span>
      </div>
      <p className="font-semibold">{value}</p>
      {sub && <p className="text-xs text-deadlock-muted mt-0.5">{sub}</p>}
    </div>
  );
}
