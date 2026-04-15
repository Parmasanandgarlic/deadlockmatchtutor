import GradeIndicator from '../ui/GradeIndicator';
import { User } from 'lucide-react';
import { formatDuration, getHeroImage } from '../../utils/formatters';
import { getScoreColor, getScoreLabel } from '../../utils/grading';

export default function HeroHeader({ meta, overall }) {
  const scoreColor = getScoreColor(overall?.impactScore ?? 0);
  const heroBg = getHeroImage(meta?.heroName, 'card');
  const heroAvatar = getHeroImage(meta?.heroName, 'small');

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
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
             {heroAvatar ? (
               <img 
                 src={heroAvatar} 
                 alt={meta?.heroName} 
                 className="w-8 h-8 rounded-full border border-deadlock-border object-cover bg-black"
                 onError={(e) => {
                   e.currentTarget.onerror = null; // prevents looping
                   e.currentTarget.style.display = 'none';
                 }}
               />
             ) : (
               <div className="w-8 h-8 rounded-full overflow-hidden border border-deadlock-border bg-deadlock-surface flex items-center justify-center text-deadlock-muted">
                   <User className="w-5 h-5" />
               </div>
             )}
            <h1 className="text-2xl font-bold drop-shadow-md">
              {meta?.heroName || 'Unknown Hero'}
            </h1>
          </div>
          <p className="text-deadlock-text-dim text-sm mb-3">
            Match <span className="font-mono text-deadlock-accent">#{meta?.matchId}</span>
            {' · '}Player <span className="font-mono">{meta?.playerSteamId}</span>
            {' · '}{formatDuration(meta?.duration)}
          </p>

          {/* Score Breakdown Bar */}
          {overall?.breakdown && (
            <div className="flex flex-wrap gap-4 text-sm">
              {Object.entries(overall.breakdown).map(([key, data]) => (
                <div key={key} className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded">
                  <span className="text-deadlock-text-dim capitalize">{key}</span>
                  <span className={`font-mono font-semibold ${getScoreColor(data.score)}`}>
                    {data.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Impact Label */}
        <div className="text-center md:text-right drop-shadow">
          <p className="text-xs text-deadlock-muted uppercase tracking-wider mb-1">Impact</p>
          <p className={`text-xl font-bold ${scoreColor}`}>
            {getScoreLabel(overall?.impactScore ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
