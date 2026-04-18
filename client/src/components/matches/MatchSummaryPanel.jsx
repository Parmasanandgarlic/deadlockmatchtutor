import { useMemo } from 'react';
import { Trophy, Swords, Clock, Flame } from 'lucide-react';
import { getHeroName } from '../../utils/heroes';
import Tooltip from '../ui/Tooltip';

/**
 * Aggregate summary panel computed client-side over the match list.
 * Shows: games, winrate, avg KDA, total souls earned, most-played hero.
 * Read-only — all calculation is memoised so the list can update freely.
 */
export default function MatchSummaryPanel({ matches }) {
  const stats = useMemo(() => computeStats(matches), [matches]);
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <SummaryStat
        icon={<Trophy className="w-4 h-4 text-deadlock-green" />}
        label="Win Rate"
        value={`${stats.winrate}%`}
        subValue={`${stats.wins}W · ${stats.losses}L`}
        tooltip="Win rate across the matches shown below."
      />
      <SummaryStat
        icon={<Swords className="w-4 h-4 text-deadlock-accent" />}
        label="Avg KDA"
        value={stats.avgKda}
        subValue={`${stats.totalKills}/${stats.totalDeaths}/${stats.totalAssists}`}
        tooltip="Average (Kills + Assists) / Deaths across the shown matches."
      />
      <SummaryStat
        icon={<Clock className="w-4 h-4 text-deadlock-blue" />}
        label="Avg Duration"
        value={stats.avgDurationLabel}
        subValue={`${stats.totalGames} games`}
        tooltip="Average match length across the shown matches."
      />
      <SummaryStat
        icon={<Flame className="w-4 h-4 text-deadlock-amber" />}
        label="Top Hero"
        value={stats.topHero.name}
        subValue={`${stats.topHero.count} games · ${stats.topHero.winrate}% WR`}
        tooltip="Hero you've played most in the shown matches, with that hero's win rate."
      />
    </div>
  );
}

function SummaryStat({ icon, label, value, subValue, tooltip }) {
  return (
    <div className="card !p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <Tooltip content={{ term: label, definition: tooltip, category: 'Summary' }}>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-deadlock-muted">
            {label}
          </span>
        </Tooltip>
      </div>
      <div className="text-lg font-mono font-semibold text-deadlock-text truncate" title={value}>
        {value}
      </div>
      {subValue && (
        <div className="text-[10px] text-deadlock-muted font-mono truncate" title={subValue}>
          {subValue}
        </div>
      )}
    </div>
  );
}

function computeStats(matches) {
  if (!Array.isArray(matches) || matches.length === 0) return null;

  let wins = 0;
  let losses = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalDurationSec = 0;
  const heroCounts = new Map(); // heroName → { count, wins }

  for (const m of matches) {
    // Determine result
    let won = null;
    if (m.match_result != null && m.player_team != null) {
      won = m.match_result === m.player_team;
    } else if (m.player_team_won != null) {
      won = m.player_team_won;
    } else if (m.won != null) {
      won = m.won;
    }
    if (won === true) wins++;
    else if (won === false) losses++;

    const kills = m.player_kills ?? m.kills ?? 0;
    const deaths = m.player_deaths ?? m.deaths ?? 0;
    const assists = m.player_assists ?? m.assists ?? 0;
    totalKills += kills;
    totalDeaths += deaths;
    totalAssists += assists;

    const duration = m.match_duration_s ?? m.duration_s ?? m.duration ?? 0;
    if (duration > 0) totalDurationSec += duration;

    const heroName = m.hero_name || getHeroName(m.hero_id);
    if (heroName && heroName !== 'Unknown Hero') {
      const existing = heroCounts.get(heroName) || { count: 0, wins: 0 };
      existing.count += 1;
      if (won === true) existing.wins += 1;
      heroCounts.set(heroName, existing);
    }
  }

  const totalGames = wins + losses || matches.length;
  const winrate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const avgKda =
    totalDeaths > 0
      ? Math.round(((totalKills + totalAssists) / totalDeaths) * 100) / 100
      : totalKills + totalAssists;
  const avgDurationSec = matches.length > 0 ? totalDurationSec / matches.length : 0;
  const avgDurationLabel = avgDurationSec > 0 ? formatMinutes(avgDurationSec) : '--';

  // Top hero = highest count, ties broken by higher winrate
  let topHero = { name: '—', count: 0, winrate: 0 };
  for (const [name, { count, wins: hw }] of heroCounts.entries()) {
    const hwr = count > 0 ? Math.round((hw / count) * 100) : 0;
    if (count > topHero.count || (count === topHero.count && hwr > topHero.winrate)) {
      topHero = { name, count, winrate: hwr };
    }
  }

  return {
    wins,
    losses,
    totalGames,
    winrate,
    totalKills,
    totalDeaths,
    totalAssists,
    avgKda,
    avgDurationLabel,
    topHero,
  };
}

function formatMinutes(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}
