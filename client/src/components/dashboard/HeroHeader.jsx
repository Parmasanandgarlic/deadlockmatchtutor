import GradeIndicator from '../ui/GradeIndicator';
import Tooltip from '../ui/Tooltip';
import { User, Trophy, XCircle, Award, Copy, Check } from 'lucide-react';
import { formatDuration, formatRelativeTime, getHeroImage } from '../../utils/formatters';
import { getScoreColor, getScoreLabel } from '../../utils/grading';
import { MODULE_LABELS } from '../../utils/constants';
import { getHeroRole, ROLE_STYLES } from '../../utils/heroes';
import { useState } from 'react';
import { useAssets } from '../../contexts/AssetContext';

export default function HeroHeader({ meta, overall }) {
  const { heroesMap } = useAssets();
  const [copiedMatchId, setCopiedMatchId] = useState(false);
  const scoreColor = getScoreColor(overall?.impactScore ?? 0);
  
  const heroAsset = heroesMap?.[meta?.heroId || meta?.hero_id];
  const heroBg = heroAsset?.images?.background_image_webp || heroAsset?.images?.background_image || getHeroImage(heroAsset || meta?.heroName, 'card');
  const heroAvatar = heroAsset?.images?.icon_image_small_webp || heroAsset?.images?.icon_image_small || getHeroImage(heroAsset || meta?.heroName, 'small');
  const heroNameDisplay = meta?.heroName || heroAsset?.name || 'Unknown Hero';
  
  const won = meta?.won;
  const rank = meta?.rankPredict;
  const role = getHeroRole(heroNameDisplay);
  const roleStyle = role ? ROLE_STYLES[role] : null;

  function handleCopyMatchId() {
    if (meta?.matchId) {
      navigator.clipboard.writeText(meta.matchId.toString());
      setCopiedMatchId(true);
      setTimeout(() => setCopiedMatchId(false), 2000);
    }
  }

  return (
    <div className="card mb-6 relative overflow-hidden bg-gradient-to-r from-deadlock-surface to-black border-l-4 border-l-deadlock-amber">
      {/* Background decoration */}
      {heroBg ? (
        <div
          className="absolute inset-y-0 right-0 w-2/3 md:w-1/2 z-0 opacity-20 pointer-events-none mix-blend-screen bg-no-repeat bg-right bg-cover"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
      ) : (
        <div className="absolute inset-0 z-0 opacity-5 pointer-events-none bg-gradient-to-r from-transparent to-deadlock-amber/40" />
      )}

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Grade Circle */}
        <GradeIndicator
          grade={overall?.letterGrade || 'F'}
          score={overall?.impactScore}
          size="lg"
        />

        {/* Player & Match Info */}
        <div className="flex-1 text-center md:text-left min-w-0">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2 flex-wrap">
            {heroAvatar ? (
              <img
                src={heroAvatar}
                alt={meta?.heroName}
                className="w-9 h-9 rounded-full border border-deadlock-border object-cover bg-black"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-9 h-9 rounded-full overflow-hidden border border-deadlock-border bg-deadlock-surface flex items-center justify-center text-deadlock-muted">
                <User className="w-5 h-5" />
              </div>
            )}
            <h1 className="text-2xl font-bold drop-shadow-md truncate">
              {heroNameDisplay}
            </h1>
            {won === true && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-deadlock-green/15 border border-deadlock-green/30 text-deadlock-green text-xs font-semibold uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" /> Victory
              </span>
            )}
            {won === false && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-deadlock-red/15 border border-deadlock-red/30 text-deadlock-red text-xs font-semibold uppercase tracking-wider">
                <XCircle className="w-3.5 h-3.5" /> Defeat
              </span>
            )}
            {role && roleStyle && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${roleStyle.bg} border ${roleStyle.border} ${roleStyle.color} text-[10px] font-bold uppercase tracking-[0.2em]`}
                title={`${meta.heroName} is typically played as a ${role}.`}
              >
                {role}
              </span>
            )}
          </div>

          <p className="text-deadlock-text-dim text-sm mb-3 truncate">
            Match{' '}
            <button
              onClick={handleCopyMatchId}
              className="inline-flex items-center gap-1 font-mono text-deadlock-accent hover:text-white transition-colors group"
              title="Copy Match ID"
            >
              #{meta?.matchId}
              {copiedMatchId ? (
                <Check className="w-3.5 h-3.5 text-deadlock-green" />
              ) : (
                <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
            {' · '}{formatDuration(meta?.duration)}
            {meta?.startTime && (
              <>
                {' · '}
                <span className="text-deadlock-muted">{formatRelativeTime(meta.startTime)}</span>
              </>
            )}
            {meta?.patchVersion && (
              <>
                {' · '}
                <Tooltip content={{
                  term: 'Patch Version',
                  definition: 'The Deadlock game patch this match was played on. Balance changes between patches can affect hero performance and item effectiveness.',
                  category: 'General'
                }}>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-deadlock-bg border border-deadlock-border text-[10px] font-mono text-deadlock-muted hover:border-deadlock-accent/50 transition-colors cursor-help">
                    Patch {meta.patchVersion}
                  </span>
                </Tooltip>
              </>
            )}
            {meta?.processedAt && (
              <>
                {' · '}
                <Tooltip content={{
                  term: 'Analysis Processed',
                  definition: 'When this match analysis was generated. Fresh analyses reflect the most recent data and benchmark comparisons.',
                  category: 'General'
                }}>
                  <span className="inline-flex items-center gap-1 text-[10px] text-deadlock-muted hover:text-deadlock-accent transition-colors cursor-help">
                    <span className="w-1.5 h-1.5 rounded-full bg-deadlock-green animate-pulse" />
                    {formatRelativeTime(meta.processedAt)}
                  </span>
                </Tooltip>
              </>
            )}
          </p>

          {/* Score Breakdown Bar */}
          {overall?.breakdown && (
            <div className="flex flex-wrap gap-2 text-sm">
              {Object.entries(overall.breakdown).map(([key, data]) => (
                <Tooltip 
                  key={key}
                  content={{
                    term: MODULE_LABELS[key] || key,
                    definition: `Performance score for ${MODULE_LABELS[key]?.toLowerCase() || key}. This contributes to your overall impact score.`,
                    category: 'Performance'
                  }}
                >
                  <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded cursor-help hover:bg-black/60 transition-colors">
                    <span className="text-deadlock-text-dim text-xs">
                      {MODULE_LABELS[key] || key}
                    </span>
                    <span className={`font-mono font-semibold ${getScoreColor(data.score)}`}>
                      {data.score}
                    </span>
                  </div>
                </Tooltip>
              ))}
            </div>
          )}
        </div>

        {/* Impact + Rank */}
        <div className="text-center md:text-right shrink-0 drop-shadow space-y-2">
          <div>
            <p className="text-xs text-deadlock-muted uppercase tracking-wider mb-1">Impact</p>
            <p className={`text-xl font-bold ${scoreColor}`}>
              {getScoreLabel(overall?.impactScore ?? 0)}
            </p>
          </div>
          {rank?.label && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-deadlock-accent/10 border border-deadlock-accent/30 text-deadlock-accent text-xs font-medium">
              {rank.rankImageUrl && (
                <img src={rank.rankImageUrl} alt={rank.label} className="w-5 h-5 object-contain" />
              )}
              <Award className="w-3.5 h-3.5" />
              {rank.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
