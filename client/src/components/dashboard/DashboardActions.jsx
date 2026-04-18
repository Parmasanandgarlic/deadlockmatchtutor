import { useState } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

/**
 * "Was this report helpful?" feedback capture, persisted to localStorage so
 * the user sees acknowledgment per match without backend authentication.
 * Copy-match-id lives on the HeroHeader so it is intentionally omitted here.
 */
export default function DashboardActions({ matchId }) {
  const [feedback, setFeedback] = useState(() => loadFeedback(matchId));

  function recordFeedback(helpful) {
    const next = helpful ? 'up' : 'down';
    setFeedback(next);
    try {
      const log = JSON.parse(localStorage.getItem('deadlock_report_feedback') || '{}');
      log[matchId] = { vote: next, at: new Date().toISOString() };
      localStorage.setItem('deadlock_report_feedback', JSON.stringify(log));
    } catch {
      // ignore storage errors (private mode)
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.2em]">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-deadlock-border text-deadlock-muted">
        <MessageSquare className="w-3.5 h-3.5" />
        {feedback ? (
          <span className={feedback === 'up' ? 'text-deadlock-green' : 'text-deadlock-red'}>
            Thanks for the feedback!
          </span>
        ) : (
          <>
            <span>Was this helpful?</span>
            <button
              type="button"
              onClick={() => recordFeedback(true)}
              className="p-1 hover:text-deadlock-green transition-colors"
              aria-label="Report was helpful"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => recordFeedback(false)}
              className="p-1 hover:text-deadlock-red transition-colors"
              aria-label="Report was not helpful"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function loadFeedback(matchId) {
  try {
    const log = JSON.parse(localStorage.getItem('deadlock_report_feedback') || '{}');
    return log[matchId]?.vote || null;
  } catch {
    return null;
  }
}
