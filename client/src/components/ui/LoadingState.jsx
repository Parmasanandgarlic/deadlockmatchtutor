import { Loader2 } from 'lucide-react';

export default function LoadingState({ progressText }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-deadlock-border border-t-deadlock-accent animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-deadlock-text font-medium text-lg mb-1">
          {progressText || 'Preparing analysis...'}
        </p>
        <p className="text-deadlock-text-dim text-sm">
          This may take a minute for large replay files.
        </p>
      </div>
      <div className="w-64 h-1.5 bg-deadlock-border rounded-full overflow-hidden">
        <div className="h-full bg-deadlock-accent rounded-full animate-pulse-slow" style={{ width: '60%' }} />
      </div>
    </div>
  );
}
