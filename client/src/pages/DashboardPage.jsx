import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import useMatchAnalysis from '../hooks/useMatchAnalysis';
import usePageTitle from '../hooks/usePageTitle';
import LoadingState from '../components/ui/LoadingState';
import HeroHeader from '../components/dashboard/HeroHeader';
import InsightDeck from '../components/dashboard/InsightDeck';
import ModuleTabs from '../components/dashboard/ModuleTabs';
import ShareButton from '../components/dashboard/ShareButton';
import GuideModal from '../components/ui/GuideModal';
import { PRIORITY_CONFIG } from '../utils/constants';
import { useState } from 'react';

export default function DashboardPage() {
  const { matchId, accountId } = useParams();
  const { analysis, loading, error, progressText, startAnalysis } = useMatchAnalysis();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('deadlock_guide_seen');
    if (!hasSeenGuide && !loading && analysis) {
      setIsGuideOpen(true);
      localStorage.setItem('deadlock_guide_seen', 'true');
    }
  }, [loading, analysis]);

  usePageTitle(
    analysis?.meta
      ? `${analysis.meta.heroName} · ${analysis.overall?.letterGrade || ''}`.trim()
      : `Match #${matchId}`
  );

  useEffect(() => {
    startAnalysis(matchId, accountId);
  }, [matchId, accountId, startAnalysis]);

  if (loading) {
    return <LoadingState progressText={progressText} />;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-deadlock-red text-lg mb-4">{error}</p>
        <Link to="/" className="text-deadlock-accent underline">Return home</Link>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          to={`/matches/${accountId}`}
          className="inline-flex items-center gap-2 text-deadlock-text-dim hover:text-deadlock-accent transition-colors"
        >
        >
          <ArrowLeft className="w-4 h-4" /> Back to matches
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGuideOpen(true)}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-deadlock-amber hover:text-white transition-colors border border-deadlock-amber/20 px-3 py-1.5 bg-deadlock-amber/5"
          >
            <Info className="w-4 h-4" /> How to Read
          </button>
          <ShareButton matchId={matchId} accountId={accountId} />
        </div>
      </div>

      <HeroHeader meta={analysis.meta} overall={analysis.overall} />

      <InsightDeck insights={analysis.insights} />

      {/* Recommendations Section */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-deadlock-accent" />
            Recommendations
          </h2>
          <div className="space-y-3">
            {analysis.recommendations.map((rec, idx) => {
              const priority = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.low;
              return (
                <div
                  key={idx}
                  className={`card ${priority.bg} ${priority.border} border-l-4`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${priority.bg} ${priority.color} ${priority.border}`}>
                      {priority.label}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{rec.title}</h3>
                      <p className="text-sm text-deadlock-text-dim">{rec.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ModuleTabs modules={analysis.modules} />

      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
