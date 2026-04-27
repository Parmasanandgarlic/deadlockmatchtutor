import { X, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import { useAssets } from '../../contexts/AssetContext';

/**
 * Side-by-side match comparison modal.
 * Shows two matches with delta arrows for every key metric.
 */
export default function MatchCompareModal({ matchA, matchB, onClose }) {
  const { heroesMap } = useAssets();

  if (!matchA || !matchB) return null;

  const metrics = buildMetrics(matchA, matchB, heroesMap);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-deadlock-surface border border-deadlock-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-deadlock-border">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-deadlock-text">
            Match Comparison
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-deadlock-muted hover:text-white transition-colors"
            aria-label="Close comparison"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 p-4 pb-2 text-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-deadlock-accent truncate">
              {heroName(matchA, heroesMap)}
            </p>
            <p className="text-[10px] text-deadlock-muted mt-1">
              Match #{matchA.match_id}
            </p>
          </div>
          <div className="text-xs text-deadlock-muted self-center">vs</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-deadlock-accent truncate">
              {heroName(matchB, heroesMap)}
            </p>
            <p className="text-[10px] text-deadlock-muted mt-1">
              Match #{matchB.match_id}
            </p>
          </div>
        </div>

        {/* Metrics rows */}
        <div className="p-4 pt-2 space-y-1">
          {metrics.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center py-2 border-b border-deadlock-border/50 last:border-0"
            >
              {/* Match A value */}
              <div className="text-right">
                <span className={`font-mono text-sm ${row.aWins ? 'text-deadlock-green' : row.bWins ? 'text-deadlock-red' : 'text-deadlock-text'}`}>
                  {row.aDisplay}
                </span>
              </div>

              {/* Label + delta */}
              <div className="text-center px-3 min-w-[120px]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-deadlock-muted">{row.label}</p>
                {row.delta !== null && (
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    {row.deltaDirection === 'up' && <ArrowUp className="w-3 h-3 text-deadlock-green" />}
                    {row.deltaDirection === 'down' && <ArrowDown className="w-3 h-3 text-deadlock-red" />}
                    {row.deltaDirection === 'same' && <Minus className="w-3 h-3 text-deadlock-muted" />}
                    <span className={`text-[10px] font-mono ${
                      row.deltaDirection === 'up' ? 'text-deadlock-green' :
                      row.deltaDirection === 'down' ? 'text-deadlock-red' :
                      'text-deadlock-muted'
                    }`}>
                      {row.deltaDisplay}
                    </span>
                  </div>
                )}
              </div>

              {/* Match B value */}
              <div className="text-left">
                <span className={`font-mono text-sm ${row.bWins ? 'text-deadlock-green' : row.aWins ? 'text-deadlock-red' : 'text-deadlock-text'}`}>
                  {row.bDisplay}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function heroName(match, heroesMap) {
  return match.hero_name || heroesMap?.[match.hero_id]?.name || 'Unknown Hero';
}

function kda(m) {
  const k = m.player_kills ?? m.kills ?? 0;
  const d = m.player_deaths ?? m.deaths ?? 0;
  const a = m.player_assists ?? m.assists ?? 0;
  return d > 0 ? (k + a) / d : k + a;
}

function duration(m) {
  return m.match_duration_s ?? m.duration_s ?? m.duration ?? 0;
}

function buildMetrics(a, b, heroesMap) {
  const rows = [];

  // Result
  const aWon = resolveWin(a);
  const bWon = resolveWin(b);
  rows.push({
    label: 'Result',
    aDisplay: aWon === true ? 'Victory' : aWon === false ? 'Defeat' : '—',
    bDisplay: bWon === true ? 'Victory' : bWon === false ? 'Defeat' : '—',
    aWins: aWon === true && bWon !== true,
    bWins: bWon === true && aWon !== true,
    delta: null,
    deltaDirection: null,
    deltaDisplay: null,
  });

  // KDA
  const aKda = kda(a);
  const bKda = kda(b);
  addMetricRow(rows, 'KDA', aKda, bKda, (v) => v.toFixed(2), true);

  // Kills
  addMetricRow(rows, 'Kills', a.player_kills ?? a.kills ?? 0, b.player_kills ?? b.kills ?? 0, formatNumber, true);

  // Deaths
  addMetricRow(rows, 'Deaths', a.player_deaths ?? a.deaths ?? 0, b.player_deaths ?? b.deaths ?? 0, formatNumber, false);

  // Assists
  addMetricRow(rows, 'Assists', a.player_assists ?? a.assists ?? 0, b.player_assists ?? b.assists ?? 0, formatNumber, true);

  // Net Worth
  addMetricRow(rows, 'Net Worth', a.net_worth ?? 0, b.net_worth ?? 0, formatNumber, true);

  // Duration
  const aDur = duration(a);
  const bDur = duration(b);
  rows.push({
    label: 'Duration',
    aDisplay: formatDuration(aDur),
    bDisplay: formatDuration(bDur),
    aWins: false,
    bWins: false,
    delta: null,
    deltaDirection: null,
    deltaDisplay: null,
  });

  return rows;
}

function addMetricRow(rows, label, aVal, bVal, formatter, higherIsBetter) {
  const delta = aVal - bVal;
  const direction = delta > 0 ? (higherIsBetter ? 'up' : 'down') :
                    delta < 0 ? (higherIsBetter ? 'down' : 'up') : 'same';
  rows.push({
    label,
    aDisplay: formatter(aVal),
    bDisplay: formatter(bVal),
    aWins: higherIsBetter ? aVal > bVal : aVal < bVal,
    bWins: higherIsBetter ? bVal > aVal : bVal < aVal,
    delta: Math.abs(delta),
    deltaDirection: direction,
    deltaDisplay: delta === 0 ? 'Same' : `${delta > 0 ? '+' : ''}${formatter(delta)}`,
  });
}

function resolveWin(m) {
  if (typeof m.player_team_won === 'boolean') return m.player_team_won;
  if (typeof m.won === 'boolean') return m.won;
  if (m.match_result != null && m.player_team != null) {
    return Number(m.match_result) === Number(m.player_team);
  }
  return null;
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
