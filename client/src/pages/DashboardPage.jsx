import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import useMatchAnalysis from '../hooks/useMatchAnalysis';
import LoadingState from '../components/ui/LoadingState';
import HeroHeader from '../components/dashboard/HeroHeader';
import InsightDeck from '../components/dashboard/InsightDeck';
import ModuleTabs from '../components/dashboard/ModuleTabs';
import ShareButton from '../components/dashboard/ShareButton';

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

      <ModuleTabs modules={analysis.modules} />
    </div>
  );
}
