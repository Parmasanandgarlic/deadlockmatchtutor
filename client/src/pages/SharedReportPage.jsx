import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import useMatchAnalysis from '../hooks/useMatchAnalysis';
import SEOHead from '../components/seo/SEOHead';
import HeroHeader from '../components/dashboard/HeroHeader';
import InsightDeck from '../components/dashboard/InsightDeck';
import ModuleTabs from '../components/dashboard/ModuleTabs';
import { Loader2 } from 'lucide-react';
import { toErrorMessage } from '../utils/errorMessage';
import { absoluteUrl, breadcrumbSchema, organizationSchema, websiteSchema } from '../utils/seo';

export default function SharedReportPage() {
  const { matchId, accountId } = useParams();
  const { analysis, loading, error, loadCached } = useMatchAnalysis();

  const dynamicTitle = analysis?.meta
    ? `Shared Deadlock Report ${analysis.meta.heroName} Grade ${analysis.overall?.letterGrade || ''}`.trim()
    : `Shared Deadlock Report ${matchId}`;

  const dynamicDesc = analysis?.meta
    ? `View the detailed Deadlock post-match report for ${analysis.meta.heroName}. Grade ${analysis.overall?.letterGrade} with ${analysis.modules?.heroPerformance?.matchKda} match KDA.`
    : `View a detailed performance breakdown for Deadlock match ${matchId}.`;

  const reportSchema = analysis
    ? [
        organizationSchema(),
        websiteSchema(),
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Shared Report', path: `/report/${matchId}/${accountId}` },
        ]),
        {
          '@type': 'WebPage',
          name: `Shared Deadlock match report: ${analysis.meta.heroName}`,
          description: dynamicDesc,
          isPartOf: { '@type': 'WebSite', name: 'Deadlock AfterMatch', url: 'https://www.aftermatch.xyz/' },
        },
      ]
    : null;

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
        <p className="text-deadlock-red text-lg mb-2">{toErrorMessage(error)}</p>
        <p className="text-deadlock-text-dim text-sm mb-4">
          This report may not have been generated yet, or the server cache has been cleared.
        </p>
        <Link to="/" className="text-deadlock-accent underline">
          Run a new analysis
        </Link>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SEOHead
        title={dynamicTitle}
        description={dynamicDesc}
        canonical={absoluteUrl(`/report/${matchId}/${accountId}`)}
        schema={reportSchema}
        imageUrl={absoluteUrl(`/api/og/${matchId}/${accountId}`)}
      />

      <div className="mb-4 text-center">
        <span className="badge bg-deadlock-accent/15 text-deadlock-accent text-xs">Shared Report</span>
      </div>
      <HeroHeader meta={analysis.meta} overall={analysis.overall} />
      <InsightDeck insights={analysis.insights} />
      <ModuleTabs modules={analysis.modules} meta={analysis.meta} />

      <section aria-label="Related Resources" className="mt-12 pt-8 border-t border-dark-500 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-dark-600 rounded-lg p-5 border border-dark-500 hover:border-deadlock-accent/50 transition-colors">
          <h3 className="font-bold text-gray-100 mb-2">Player Profile</h3>
          <p className="text-sm text-gray-400 mb-4">View complete match history and overall performance stats.</p>
          <Link to={`/player/${accountId}`} className="text-deadlock-accent text-sm hover:underline font-medium">View Profile &rarr;</Link>
        </div>
        <div className="bg-dark-600 rounded-lg p-5 border border-dark-500 hover:border-deadlock-accent/50 transition-colors">
          <h3 className="font-bold text-gray-100 mb-2">Hero Guide</h3>
          <p className="text-sm text-gray-400 mb-4">Learn advanced strategies and build orders for {analysis.meta.heroName}.</p>
          <Link to={`/guide/${analysis.meta.heroId}`} className="text-deadlock-accent text-sm hover:underline font-medium">Read Guide &rarr;</Link>
        </div>
        <div className="bg-dark-600 rounded-lg p-5 border border-dark-500 hover:border-deadlock-accent/50 transition-colors">
          <h3 className="font-bold text-gray-100 mb-2">Meta Rankings</h3>
          <p className="text-sm text-gray-400 mb-4">See how {analysis.meta.heroName} compares to other heroes in the current patch.</p>
          <Link to="/resources" className="text-deadlock-accent text-sm hover:underline font-medium">View Tier List &rarr;</Link>
        </div>
      </section>
    </div>
  );
}

