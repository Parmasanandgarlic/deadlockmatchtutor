import { TrendingUp, Trophy, Target, Sword, Coins, Flame, Skull, Shield } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import Tooltip from '../ui/Tooltip';
import { useAssets } from '../../contexts/AssetContext';

export default function HeroPerformanceModule({ data, meta }) {
  const { heroesMap } = useAssets();
  const hasMatchStats = data.matchKda != null;
  const winrate = data.winrate ?? 0;
  const avgKda = data.avgKda ?? 0;
  const matchesPlayed = data.matchesPlayed ?? 0;
  const avgSouls = data.avgSouls ?? 0;
  const heroId = meta?.heroId || meta?.hero_id;
  const heroAsset = heroesMap?.[heroId];
  const heroName = meta?.heroName || heroAsset?.name || 'Unknown Hero';
  const heroImage = heroAsset?.images?.icon_image_small_webp || heroAsset?.images?.icon_image_small || heroAsset?.images?.icon_image_webp || heroAsset?.images?.icon_image;

  const matchKdaLabel = data.matchKda != null ? Number(data.matchKda).toFixed(1) : '—';
  const soulsPerMinLabel = data.soulsPerMin != null ? formatNumber(data.soulsPerMin) : '—';
  const damagePerMinLabel = data.damagePerMin != null ? formatNumber(data.damagePerMin) : '—';
  const deathsLabel = data.deaths != null ? data.deaths : 0;

  return (
    <div className="space-y-6">
      <div className="card hero-header-bg overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 border border-deadlock-border bg-black/40 overflow-hidden rounded-none flex items-center justify-center">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={heroName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Shield className="w-8 h-8 text-deadlock-amber/70" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-deadlock-muted">Hero Dossier</p>
              <h3 className="text-2xl font-serif text-deadlock-text uppercase tracking-wider">{heroName}</h3>
              <p className="text-xs text-deadlock-text-dim mt-1">
                {hasMatchStats
                  ? 'This match is compared against your career baseline on this hero.'
                  : 'Career data shown here is derived from the player-hero stats endpoint.'}
              </p>
            </div>
          </div>
          {data.note && (
            <div className="md:ml-auto bg-black/30 border border-deadlock-border px-3 py-2 text-xs text-deadlock-text-dim max-w-xl">
              {data.note}
            </div>
          )}
        </div>
      </div>

      {hasMatchStats && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-deadlock-text-dim uppercase tracking-[0.24em]">This Match</h3>
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-deadlock-muted">live performance</span>
          </div>
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
                value={matchKdaLabel}
                highlight
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
                value={soulsPerMinLabel}
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
                value={damagePerMinLabel}
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
                value={deathsLabel}
              />
            </Tooltip>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-deadlock-text-dim uppercase tracking-[0.24em]">
            Career on This Hero
          </h3>
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-deadlock-muted">
            {matchesPlayed} {matchesPlayed === 1 ? 'match' : 'matches'} tracked
          </span>
        </div>
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
              value={`${winrate}%`}
              highlight={winrate >= 55}
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
              value={avgKda}
              highlight={avgKda >= 2.5}
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
              value={matchesPlayed}
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
              value={formatNumber(avgSouls)}
              highlight={avgSouls >= 12000}
            />
          </Tooltip>
        </div>
      </div>

      {!hasMatchStats && (
        <div className="bg-deadlock-bg/70 border border-deadlock-border px-4 py-3 text-sm text-deadlock-text-dim">
          Match-specific stats were unavailable for this report, so only career values are shown.
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, label, value, highlight }) {
  return (
    <div className={`bg-deadlock-bg rounded-lg p-3 border ${highlight ? 'border-deadlock-accent/40 ring-1 ring-deadlock-accent/30' : 'border-deadlock-border'}`}>
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
