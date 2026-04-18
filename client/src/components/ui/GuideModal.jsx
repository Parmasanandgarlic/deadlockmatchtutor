import { X, Trophy, Search, Zap, Info } from 'lucide-react';
import { useEffect } from 'react';

export default function GuideModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8 animate-overlay">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-deadlock-bg border border-deadlock-border shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-reveal">
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-deadlock-amber/40" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-deadlock-amber/40" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-deadlock-amber/40" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-deadlock-amber/40" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-deadlock-border bg-deadlock-surface/30">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-deadlock-amber" />
            <h2 className="text-xl font-serif tracking-[0.2em] text-white">How to Read Your Report</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-deadlock-muted hover:text-deadlock-amber transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Section 1: The Grade */}
          <section className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-full bg-deadlock-amber/10 border border-deadlock-amber/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-deadlock-amber" />
              </div>
              <h3 className="text-lg font-serif tracking-widest text-white">Macro Efficiency (The Grade)</h3>
            </div>
            <p className="text-deadlock-text-dim text-sm leading-relaxed ml-14">
              Your letter grade (S through F) measures your overall contribution compared to the ideal performance for your hero. It weighs farming efficiency, combat impact, and objective pressure.
            </p>
          </section>

          {/* Section 2: Insight Engine */}
          <section className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-full bg-deadlock-blue/10 border border-deadlock-blue/30 flex items-center justify-center">
                <Search className="w-5 h-5 text-deadlock-blue" />
              </div>
              <h3 className="text-lg font-serif tracking-widest text-white">The Insight Engine</h3>
            </div>
            <div className="ml-14 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 border border-deadlock-red/20 bg-deadlock-red/5">
                  <span className="text-[10px] font-bold text-deadlock-red uppercase tracking-wider block mb-1">Critical</span>
                  <p className="text-[11px] text-deadlock-text-dim">Immediate leaks in your playstyle that cost you matches.</p>
                </div>
                <div className="p-3 border border-deadlock-amber/20 bg-deadlock-amber/5">
                  <span className="text-[10px] font-bold text-deadlock-amber uppercase tracking-wider block mb-1">Warning</span>
                  <p className="text-[11px] text-deadlock-text-dim">Optimization points where you can gain a major edge.</p>
                </div>
                <div className="p-3 border border-deadlock-blue/20 bg-deadlock-blue/5">
                  <span className="text-[10px] font-bold text-deadlock-blue uppercase tracking-wider block mb-1">Info</span>
                  <p className="text-[11px] text-deadlock-text-dim">Contextual data and positive reinforcement of good habits.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Action Plan */}
          <section className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-full bg-deadlock-green/10 border border-deadlock-green/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-deadlock-green" />
              </div>
              <h3 className="text-lg font-serif tracking-widest text-white">Prioritized Action Plan</h3>
            </div>
            <p className="text-deadlock-text-dim text-sm leading-relaxed ml-14">
              Recommendations are sorted by priority. Focus on the Top 3 items in your Action Plan to see the most significant jump in your win rate and grade.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-deadlock-border bg-deadlock-surface/50 flex justify-center">
          <button 
            onClick={onClose}
            className="btn-primary w-full max-w-xs"
          >
            I Command My Data
          </button>
        </div>
      </div>
    </div>
  );
}
