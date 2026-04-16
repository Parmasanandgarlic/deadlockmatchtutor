import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import useMatchAnalysis from '../hooks/useMatchAnalysis';
import LoadingState from '../components/ui/LoadingState';
import HeroHeader from '../components/dashboard/HeroHeader';
import InsightDeck from '../components/dashboard/InsightDeck';
import ModuleTabs from '../components/dashboard/ModuleTabs';
import ShareButton from '../components/dashboard/ShareButton';
import { SEVERITY_CONFIG } from '../utils/constants';

export default function DashboardPage() {
  const { matchId, accountId } = useParams();
  const { analysis, loading, error, progressText, startAnalysis } = useMatchAnalysis();

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
          <ArrowLeft className="w-4 h-4" /> Back to matches
        </Link>
        <ShareButton matchId={matchId} accountId={accountId} />
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
              const severity = SEVERITY_CONFIG[rec.priority] || SEVERITY_CONFIG.info;
              return (
                <div
                  key={idx}
                  className={`card ${severity.bg} ${severity.border} border-l-4`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${severity.bg} ${severity.color} ${severity.border}`}>
                      {rec.priority}
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
    </div>
  );
}
