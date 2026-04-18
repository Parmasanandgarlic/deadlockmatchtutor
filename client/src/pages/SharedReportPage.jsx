import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import useMatchAnalysis from '../hooks/useMatchAnalysis';
import SEOHead from '../components/seo/SEOHead';
import LoadingState from '../components/ui/LoadingState';
import HeroHeader from '../components/dashboard/HeroHeader';
import InsightDeck from '../components/dashboard/InsightDeck';
import ModuleTabs from '../components/dashboard/ModuleTabs';
import { Loader2 } from 'lucide-react';

export default function SharedReportPage() {
  const { matchId, accountId } = useParams();
  const { analysis, loading, error, loadCached } = useMatchAnalysis();
  const dynamicTitle = analysis?.meta
    ? `Shared Report · ${analysis.meta.heroName} Grade ${analysis.overall?.letterGrade || ''}`.trim()
    : `Shared Report · #${matchId}`;

  const dynamicDesc = analysis?.meta
    ? `View the detailed post-match Deadlock report for ${analysis.meta.heroName}. Scored a ${analysis.overall?.letterGrade} with ${analysis.modules?.heroPerformance?.matchKda} KDA.`
    : `View detailed performance breakdown for Deadlock match ${matchId}.`;

  const reportSchema = analysis ? [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "mainEntity": {
        "@type": "Person",
        "name": `Shared Match Profile - ${analysis.meta.heroName}`,
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/ViewAction",
          "userInteractionCount": 1
        }
      }
    }
  ] : null;

  useEffect(() => {
    loadCached(matchId, accountId);
  }, [matchId, accountId, loadCached]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-deadlock-accent animate-spin" />
        <span className="ml-3 text-deadlock-text-dim">Loading report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-deadlock-red text-lg mb-2">{error}</p>
        <p className="text-deadlock-text-dim text-sm mb-4">
          This report may not have been generated yet, or the server cache has been cleared.
        </p>
        <Link to="/" className="text-deadlock-accent underline">Run a new analysis</Link>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SEOHead 
        title={dynamicTitle} 
        description={dynamicDesc}
        schema={reportSchema}
      />
      <div className="mb-4 text-center">
        <span className="badge bg-deadlock-accent/15 text-deadlock-accent text-xs">Shared Report</span>
      </div>
      <HeroHeader meta={analysis.meta} overall={analysis.overall} />
      <InsightDeck insights={analysis.insights} />
      <ModuleTabs modules={analysis.modules} />
    </div>
  );
}
