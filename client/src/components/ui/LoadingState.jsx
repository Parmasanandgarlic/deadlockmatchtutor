import { Loader2 } from 'lucide-react';

export default function LoadingState({ progressText }) {
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
        <div className="h-full bg-deadlock-amber animate-pulse-slow" style={{ width: '60%' }} />
      </div>
    </div>
  );
}
