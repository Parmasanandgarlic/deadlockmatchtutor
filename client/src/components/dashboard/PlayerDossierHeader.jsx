import { Shield, Trophy, TrendingUp, Swords } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

/**
 * Top-of-page dossier header for the Player Profile route.
 * Shows the predicted ranked rank badge (current + peak), career totals,
 * recent form, and the player's top 5 heroes by matches played.
 */
export default function PlayerDossierHeader({ profile }) {
  if (!profile) return null;

  const { rank, stats, topHeroes } = profile;
  const current = rank?.current;
  const peak = rank?.peak;

  return (
    <div className="mb-8 space-y-6">
      {/* Rank + Career Stats Banner */}
      <div className="card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-deadlock-amber/60 to-transparent" />

        <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6 items-center">
          {/* Rank Badge */}
          <RankBadge current={current} peak={peak} />

          {/* Career stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile
              icon={<Trophy className="w-4 h-4 text-deadlock-amber" />}
              label="Career Matches"
              value={formatNumber(stats?.matchesPlayed ?? 0)}
            />
            <StatTile
              icon={<Shield className="w-4 h-4 text-deadlock-green" />}
              label="Career Win Rate"
              value={stats?.matchesPlayed > 0 ? `${stats.winrate}%` : '—'}
              tone={stats?.winrate >= 55 ? 'good' : stats?.winrate >= 48 ? 'neutral' : 'bad'}
            />
            <StatTile
              icon={<TrendingUp className="w-4 h-4 text-deadlock-blue" />}
              label={`Last ${stats?.recentMatches ?? 0} Form`}
              value={stats?.recentWinrate != null ? `${stats.recentWinrate}%` : '—'}
              tone={stats?.recentWinrate >= 55 ? 'good' : stats?.recentWinrate >= 48 ? 'neutral' : 'bad'}
            />
            <StatTile
              icon={<Swords className="w-4 h-4 text-deadlock-accent" />}
              label="Career Wins"
              value={formatNumber(stats?.wins ?? 0)}
            />
          </div>
        </div>
      </div>

      {/* Top Heroes */}
      {Array.isArray(topHeroes) && topHeroes.length > 0 && (
        <div className="card">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-deadlock-text">
              Top Heroes
            </h3>
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-deadlock-muted">
              By Matches Played
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {topHeroes.map((hero) => (
              <HeroCard key={hero.heroId} hero={hero} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RankBadge({ current, peak }) {
  const currentName = current?.name || 'Unranked';
  const currentImg = current?.imageUrl;
  const peakName = peak?.name;
  const peakImg = peak?.imageUrl;

  return (
    <div className="flex items-center gap-4 min-w-[220px]">
      <div className="relative flex items-center justify-center w-24 h-24 bg-black/40 border border-deadlock-amber/40 rounded-none">
        <div className="absolute inset-0 bg-deadlock-amber/[0.06]" />
        {currentImg ? (
          <img
            src={currentImg}
            alt={currentName}
            className="relative w-20 h-20 object-contain drop-shadow-[0_0_8px_rgba(255,173,28,0.35)]"
          />
        ) : (
          <Shield className="relative w-14 h-14 text-deadlock-amber/70" />
        )}
        <span className="absolute -top-2 left-2 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-[0.25em] text-deadlock-amber bg-deadlock-bg border border-deadlock-amber/50">
          Rank
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-deadlock-muted">
          Predicted Rank
        </span>
        <span className="font-serif text-2xl text-deadlock-amber uppercase tracking-wider leading-tight">
          {currentName}
        </span>
        {peakName && peakName !== currentName && (
          <span className="flex items-center gap-1.5 mt-1 text-[11px] text-deadlock-text-dim">
            {peakImg && <img src={peakImg} alt="" className="w-4 h-4 opacity-80" />}
            <span className="uppercase tracking-[0.2em] text-deadlock-muted">Peak:</span>
            <span className="font-semibold text-deadlock-text">{peakName}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, tone }) {
  const toneClass =
    tone === 'good'
      ? 'text-deadlock-green'
      : tone === 'bad'
      ? 'text-deadlock-red'
      : 'text-deadlock-text';
  return (
    <div className="bg-deadlock-bg/60 border border-deadlock-border px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-deadlock-muted">
          {label}
        </span>
      </div>
      <p className={`font-mono font-bold text-lg leading-none ${toneClass}`}>{value}</p>
    </div>
  );
}

function HeroCard({ hero }) {
  const wrTone =
    hero.winrate >= 55
      ? 'text-deadlock-green'
      : hero.winrate >= 48
      ? 'text-deadlock-accent'
      : 'text-deadlock-red';
  return (
    <div className="relative bg-deadlock-bg/60 border border-deadlock-border hover:border-deadlock-amber/50 transition-colors p-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 shrink-0 bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden">
          {hero.heroImage ? (
            <img src={hero.heroImage} alt={hero.heroName} className="w-full h-full object-cover" />
          ) : (
            <Swords className="w-6 h-6 text-deadlock-muted" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-deadlock-text truncate">
            {hero.heroName}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-deadlock-muted">
            {hero.matchesPlayed} {hero.matchesPlayed === 1 ? 'match' : 'matches'}
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-mono">
        <span className={`font-bold ${wrTone}`}>{hero.winrate}% WR</span>
        <span className="text-deadlock-text-dim">{hero.avgKda} KDA</span>
      </div>
    </div>
  );
}
