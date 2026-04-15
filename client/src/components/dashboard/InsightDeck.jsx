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
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-deadlock-accent" />
        <h2 className="text-lg font-bold">Key Insights</h2>
        <span className="text-xs text-deadlock-muted">Top {insights.length} issues</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, idx) => (
          <InsightCard key={idx} insight={insight} />
        ))}
      </div>
    </div>
  );
}
