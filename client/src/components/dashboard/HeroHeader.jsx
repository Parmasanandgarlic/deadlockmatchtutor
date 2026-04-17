import GradeIndicator from '../ui/GradeIndicator';
import { User } from 'lucide-react';
import { formatDuration, getHeroImage } from '../../utils/formatters';
import { getScoreColor, getScoreLabel } from '../../utils/grading';

export default function HeroHeader({ meta, overall }) {
  const scoreColor = getScoreColor(overall?.impactScore ?? 0);
  const heroBg = getHeroImage(meta?.heroName, 'card');
  const heroAvatar = getHeroImage(meta?.heroName, 'small');

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
            <h1 className="font-serif text-3xl tracking-widest uppercase text-white drop-shadow-lg">
              {meta?.heroName || 'Unknown Hero'}
            </h1>
          </div>
          <p className="text-deadlock-text-dim text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
            Match <span className="text-deadlock-amber">#{meta?.matchId}</span>
            {' · '}Account <span>{meta?.accountId}</span>
            {' · '}{formatDuration(meta?.duration)}
          </p>

          {/* Score Breakdown Bar */}
          {overall?.breakdown && (
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
              {Object.entries(overall.breakdown).map(([key, data]) => (
                <div key={key} className="flex items-center gap-2 bg-black/40 border border-white/5 px-3 py-1.5 segment-bevel">
                  <span className="text-deadlock-text-dim">{key}</span>
                  <span className={`${getScoreColor(data.score)}`}>
                    {data.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Impact Label */}
        <div className="text-center md:text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-deadlock-muted mb-1">Impact Level</p>
          <p className={`text-2xl font-serif tracking-widest ${scoreColor} drop-shadow-[0_0_10px_currentColor]`}>
            {getScoreLabel(overall?.impactScore ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
