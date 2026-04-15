import { getGradeColor } from '../../utils/grading';

export default function GradeIndicator({ grade, score, size = 'lg' }) {
  const colorClass = getGradeColor(grade);

  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeClasses[size]} rounded-full border-2 border-current flex items-center justify-center font-extrabold ${colorClass}`}
      >
        {grade}
      </div>
      {score != null && (
        <span className={`text-sm font-mono ${colorClass}`}>{score}/100</span>
      )}
    </div>
  );
}
