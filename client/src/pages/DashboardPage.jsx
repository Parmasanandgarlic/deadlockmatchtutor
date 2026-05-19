import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Lightbulb, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import useMatchAnalysis from '../hooks/useMatchAnalysis';
import SEOHead from '../components/seo/SEOHead';
import LoadingState from '../components/ui/LoadingState';
import { lazy, Suspense } from 'react';
import HeroHeader from '../components/dashboard/HeroHeader';
import InsightDeck from '../components/dashboard/InsightDeck';
import ModuleTabs from '../components/dashboard/ModuleTabs';
import ShareButton from '../components/dashboard/ShareButton';
import DashboardActions from '../components/dashboard/DashboardActions';
import GuideModal from '../components/ui/GuideModal';
import RelatedContentWidget from '../components/widgets/RelatedContentWidget';
import { PRIORITY_CONFIG } from '../utils/constants';

const PerformanceRadar = lazy(() => import('../components/dashboard/PerformanceRadar'));
const TemporalTrendCard = lazy(() => import('../components/dashboard/TemporalTrendCard'));
const MmrHistoryCard = lazy(() => import('../components/dashboard/MmrHistoryCard'));
import { toErrorMessage } from '../utils/errorMessage';
import { absoluteUrl, breadcrumbSchema, organizationSchema, websiteSchema } from '../utils/seo';

export default function DashboardPage() {
  const { matchId, accountId } = useParams();
  const { analysis, loading, error, progressText, progressStage, startAnalysis } = useMatchAnalysis();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const startedAnalysisKeyRef = useRef(null);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('deadlock_guide_seen');
    if (!hasSeenGuide && !loading && analysis) {
      setIsGuideOpen(true);
      localStorage.setItem('deadlock_guide_seen', 'true');
    }
  }, [loading, analysis]);

  const dynamicTitle = analysis?.meta
    ? `Deadlock Match Report ${analysis.meta.heroName} Grade ${analysis.overall?.letterGrade || ''}`.trim()
    : `Deadlock Match Report ${matchId}`;

  const dynamicDesc = analysis?.meta
    ? `Deadlock match dossier for ${analysis.meta.heroName}: grade ${analysis.overall?.letterGrade}, ${analysis.modules?.heroPerformance?.matchKda} match KDA, ${analysis.modules?.itemization?.soulsPerMin} souls/min, ranked benchmarks, item build, and combat breakdown.`
    : `Detailed Deadlock match dossier for match ${matchId}, including combat, itemization, benchmarks, and performance grades.`;

  const dashboardSchema = analysis
    ? [
        organizationSchema(),
        websiteSchema(),
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Match History', path: `/matches/${accountId}` },
          { name: 'Match Report', path: `/dashboard/${matchId}/${accountId}` },
        ]),
        {
          '@type': 'WebPage',
          name: `Deadlock match report: ${analysis.meta.heroName}`,
          description: dynamicDesc,
          isPartOf: { '@type': 'WebSite', name: 'Deadlock AfterMatch', url: 'https://www.aftermatch.xyz/' },
        },
      ]
    : null;

  useEffect(() => {
    const routeKey = `${matchId}:${accountId}`;
    if (startedAnalysisKeyRef.current === routeKey) {
      return;
    }

    startedAnalysisKeyRef.current = routeKey;
    startAnalysis(matchId, accountId);
  }, [matchId, accountId, startAnalysis]);

  if (loading) {
    return <LoadingState progressText={progressText} progressStage={progressStage} />;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-deadlock-red text-lg mb-4">{toErrorMessage(error)}</p>
        <Link to="/" className="text-deadlock-accent underline">
          Return home
        </Link>
      </div>
    );
  }

  if (!analysis) return null;

  const temporal = analysis.meta?.temporal;
  const mmrHistory = analysis.meta?.mmrHistory;
  const hasTemporal = Boolean(temporal && temporal.sampleSize !== 0);
  const hasMmrHistory = Boolean(mmrHistory?.current);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SEOHead
        title={dynamicTitle}
        description={dynamicDesc}
        canonical={absoluteUrl(`/dashboard/${matchId}/${accountId}`)}
        robots="index,follow"
        schema={dashboardSchema}
        imageUrl={absoluteUrl(`/api/og/${matchId}/${accountId}`)}
      />

      <div className="osic-dossier-bg p-6 lg:p-10 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <Link
            to={`/matches/${accountId}`}
            className="inline-flex items-center gap-2 text-deadlock-text-dim hover:text-deadlock-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to case files
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-deadlock-amber hover:text-white transition-colors border border-deadlock-amber/20 px-3 py-1.5 bg-deadlock-amber/5"
            >
              <Info className="w-4 h-4" /> Dossier Legend
            </button>
            <ShareButton matchId={matchId} accountId={accountId} />
          </div>
        </div>

        <HeroHeader meta={analysis.meta} overall={analysis.overall} />

        <DashboardActions matchId={matchId} heroName={analysis?.meta?.heroName} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1 h-full">
            <Suspense fallback={<div className="h-full flex items-center justify-center text-deadlock-muted bg-black/20 rounded">Loading radar...</div>}>
              <PerformanceRadar modules={analysis.modules} />
            </Suspense>
          </div>
          <div className="lg:col-span-2 h-full">
            <InsightDeck insights={analysis.insights} />
          </div>
        </div>

        {/* Recommendations Section */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-deadlock-accent" />
              OSIC Tactical Directives
            </h2>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, idx) => {
                const priority = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.low;
                return (
                  <div key={idx} className={`card ${priority.bg} ${priority.border} border-l-4`}>
                    <div className="flex items-start gap-3">
                      <span
                        className={`text-xs font-semibold uppercase px-2 py-1 rounded ${priority.bg} ${priority.color} ${priority.border}`}
                      >
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

        {/* Temporal + MMR history (from meta) */}
        {(hasTemporal || hasMmrHistory) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {hasTemporal && (
              <Suspense fallback={<div className="h-48 flex items-center justify-center text-deadlock-muted bg-black/20 rounded">Loading trends...</div>}>
                <TemporalTrendCard
                  temporal={temporal}
                  expanded={!hasMmrHistory}
                  className={!hasMmrHistory ? 'lg:col-span-2' : ''}
                />
              </Suspense>
            )}
            {hasMmrHistory && (
              <Suspense fallback={<div className="h-48 flex items-center justify-center text-deadlock-muted bg-black/20 rounded">Loading MMR history...</div>}>
                <MmrHistoryCard mmr={mmrHistory} />
              </Suspense>
            )}
          </div>
        )}

        <ModuleTabs modules={analysis.modules} meta={analysis.meta} />

        <RelatedContentWidget heroName={analysis.meta?.heroName} matchId={matchId} />

        <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      </div>
    </div>
  );
}
