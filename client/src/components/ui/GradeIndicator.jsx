import { getGradeColor } from '../../utils/grading';

export default function GradeIndicator({ grade, score, size = 'lg' }) {
  const colorClass = getGradeColor(grade);

  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-none border-2 border-current bg-black/40 flex items-center justify-center font-serif tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.05)] ${colorClass}`}
      >
        {grade}
      </div>
      {score != null && (
        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${colorClass}`}>{score}/100</span>
      )}
    </div>
  );
}
