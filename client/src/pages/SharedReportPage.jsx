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
        robots="noindex,nofollow"
        schema={reportSchema}
      />

      <div className="mb-4 text-center">
        <span className="badge bg-deadlock-accent/15 text-deadlock-accent text-xs">Shared Report</span>
      </div>
      <HeroHeader meta={analysis.meta} overall={analysis.overall} />
      <InsightDeck insights={analysis.insights} />
      <ModuleTabs modules={analysis.modules} meta={analysis.meta} />
    </div>
  );
}

