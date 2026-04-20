import { Loader2 } from 'lucide-react';

export default function LoadingState({ progressText, progressStage = 0, totalStages = 10 }) {
  // Calculate percentage, preventing 0% visually initially, maxing at 100%
  const percent = Math.min(100, Math.max(10, ((progressStage + 1) / totalStages) * 100));

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="relative">
        <div className="w-20 h-20 border-[3px] border-deadlock-blue/10 border-t-deadlock-amber animate-spin" />
        <div className="absolute inset-0 bg-deadlock-amber/5 blur-xl animate-pulse-slow" />
      </div>
      <div className="text-center">
        <p className="text-white font-serif text-xl tracking-[0.2em] uppercase mb-2">
          {progressText || 'Preparing analysis...'}
        </p>
        <p className="text-deadlock-text-dim text-[10px] font-bold uppercase tracking-widest">
          Consulting the occult replay stream...
        </p>
      </div>
      <div className="w-64 h-1 bg-deadlock-border/50 overflow-hidden">
        <div 
          className="h-full bg-deadlock-amber transition-all duration-500 ease-in-out relative" 
          style={{ width: `${percent}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />
        </div>
      </div>
    </div>
  );
}
