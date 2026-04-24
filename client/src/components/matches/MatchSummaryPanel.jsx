import { useMemo } from 'react';
import { Trophy, Swords, Clock, Flame } from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import { useAssets } from '../../contexts/AssetContext';
import { resolveMatchResult } from '../../utils/match';

/**
 * Aggregate summary panel computed client-side over the match list.
 * Shows: games, winrate, avg KDA, total souls earned, most-played hero.
 * Read-only — all calculation is memoised so the list can update freely.
 *
 * Art-deco treatment: double-border inset cards, icon accent glow,
 * geometric corner accents, and subtle gradient top highlights.
 */
export default function MatchSummaryPanel({ matches }) {
  const { heroesMap } = useAssets();
  const stats = useMemo(() => computeStats(matches, heroesMap), [matches, heroesMap]);
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <SummaryStat
        icon={<Trophy className="w-4 h-4 text-deadlock-green" />}
        label="Win Rate"
        value={`${stats.winrate}%`}
        subValue={`${stats.wins}W · ${stats.losses}L`}
        tooltip="Win rate across the matches shown below."
        accentColor="green"
      />
      <SummaryStat
        icon={<Swords className="w-4 h-4 text-deadlock-accent" />}
        label="Avg KDA"
        value={stats.avgKda}
        subValue={`${stats.totalKills}/${stats.totalDeaths}/${stats.totalAssists}`}
        tooltip="Average (Kills + Assists) / Deaths across the shown matches."
        accentColor="amber"
      />
      <SummaryStat
        icon={<Clock className="w-4 h-4 text-deadlock-blue" />}
        label="Avg Duration"
        value={stats.avgDurationLabel}
        subValue={`${stats.totalGames} games`}
        tooltip="Average match length across the shown matches."
        accentColor="blue"
      />
      <SummaryStat
        icon={<Flame className="w-4 h-4 text-deadlock-amber" />}
        label="Top Hero"
        value={stats.topHero.name}
        subValue={`${stats.topHero.count} games · ${stats.topHero.winrate}% WR`}
        tooltip="Hero you've played most in the shown matches, with that hero's win rate."
        accentColor="amber"
      />
    </div>
  );
}

const accentGradients = {
  green: 'from-deadlock-green/10 via-transparent',
  amber: 'from-deadlock-amber/10 via-transparent',
  blue: 'from-deadlock-blue/10 via-transparent',
};

const accentBorders = {
  green: 'border-deadlock-green/20',
  amber: 'border-deadlock-amber/20',
  blue: 'border-deadlock-blue/20',
};

function SummaryStat({ icon, label, value, subValue, tooltip, accentColor = 'amber' }) {
  return (
    <div className="card !p-0 relative group overflow-visible">
      {/* Corner accents */}
      <div className={`absolute top-0 left-0 w-2.5 h-2.5 border-t border-l ${accentBorders[accentColor]} pointer-events-none`} />
      <div className={`absolute top-0 right-0 w-2.5 h-2.5 border-t border-r ${accentBorders[accentColor]} pointer-events-none`} />
      <div className={`absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l ${accentBorders[accentColor]} pointer-events-none`} />
      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r ${accentBorders[accentColor]} pointer-events-none`} />

      {/* Inner inset panel */}
      <div className="m-[1px] border border-deadlock-border/20 p-3 relative overflow-hidden">
        {/* Subtle gradient top highlight */}
        <div className={`absolute top-0 left-0 right-0 h-8 bg-gradient-to-b ${accentGradients[accentColor]} to-transparent pointer-events-none`} />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="relative">
              {icon}
              {/* Icon glow */}
              <div className="absolute inset-0 blur-sm opacity-30">{icon}</div>
            </div>
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
      </div>
    </div>
  );
}

function computeStats(matches, heroesMap) {
  if (!Array.isArray(matches) || matches.length === 0) return null;

  let wins = 0;
  let losses = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalDurationSec = 0;
  const heroCounts = new Map(); // heroName → { count, wins }

  for (const m of matches) {
    const won = resolveMatchResult(m);
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

    const heroName = m.hero_name || heroesMap?.[m.hero_id]?.name || 'Unknown Hero';
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
