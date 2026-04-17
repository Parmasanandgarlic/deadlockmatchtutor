import GradeIndicator from '../ui/GradeIndicator';
import { User, Trophy, XCircle, Award } from 'lucide-react';
import { formatDuration, formatRelativeTime, getHeroImage } from '../../utils/formatters';
import { getScoreColor, getScoreLabel } from '../../utils/grading';
import { MODULE_LABELS } from '../../utils/constants';

export default function HeroHeader({ meta, overall }) {
  const scoreColor = getScoreColor(overall?.impactScore ?? 0);
  const heroBg = getHeroImage(meta?.heroName, 'card');
  const heroAvatar = getHeroImage(meta?.heroName, 'small');
  const won = meta?.won;
  const rank = meta?.rankPredict;

  return (
    <div className="card mb-6 relative overflow-hidden bg-gradient-to-r from-deadlock-surface to-black">
      {/* Background decoration */}
      {heroBg ? (
        <div
          className="absolute inset-y-0 right-0 w-2/3 md:w-1/2 z-0 opacity-20 pointer-events-none mix-blend-screen bg-no-repeat bg-right bg-cover"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
      ) : (
        <div className="absolute inset-0 z-0 opacity-5 pointer-events-none bg-gradient-to-r from-transparent to-deadlock-accent/40" />
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
              {meta?.heroName || 'Unknown Hero'}
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
          </div>

          <p className="text-deadlock-text-dim text-sm mb-3 truncate">
            Match <span className="font-mono text-deadlock-accent">#{meta?.matchId}</span>
            {' · '}{formatDuration(meta?.duration)}
            {meta?.startTime && (
              <>
                {' · '}
                <span className="text-deadlock-muted">{formatRelativeTime(meta.startTime)}</span>
              </>
            )}
          </p>

          {/* Score Breakdown Bar */}
          {overall?.breakdown && (
            <div className="flex flex-wrap gap-2 text-sm">
              {Object.entries(overall.breakdown).map(([key, data]) => (
                <div key={key} className="flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded">
                  <span className="text-deadlock-text-dim text-xs">
                    {MODULE_LABELS[key] || key}
                  </span>
                  <span className={`font-mono font-semibold ${getScoreColor(data.score)}`}>
                    {data.score}
                  </span>
                </div>
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
              <Award className="w-3.5 h-3.5" />
              {rank.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
