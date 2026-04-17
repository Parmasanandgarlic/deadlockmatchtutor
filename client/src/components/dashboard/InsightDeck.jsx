import InsightCard from '../ui/InsightCard';
import { Lightbulb } from 'lucide-react';

export default function InsightDeck({ insights }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="card mb-6 text-center py-8 text-deadlock-text-dim">
        <Lightbulb className="w-8 h-8 mx-auto mb-2 text-deadlock-muted" />
        <p>No major issues detected — well played!</p>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-deadlock-amber/10 border border-deadlock-amber/20">
          <Lightbulb className="w-5 h-5 text-deadlock-amber animate-pulse-slow" />
        </div>
        <div>
          <h2 className="text-xl font-serif tracking-widest text-white uppercase">Neural Insights</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-deadlock-muted">Top {insights.length} critical patterns identified</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, idx) => (
          <InsightCard key={idx} insight={insight} />
        ))}
      </div>
    </div>
  );
}
