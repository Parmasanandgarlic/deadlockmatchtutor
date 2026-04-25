import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { AssetProvider } from './contexts/AssetContext';
import LoadingState from './components/ui/LoadingState';

// Code-split: each page loads as a separate chunk.
// This cuts initial bundle size by 40-60% — the landing page no longer ships
// DashboardPage's Recharts dependency (or any other page's code) until needed.
const LandingPage = lazy(() => import('./pages/LandingPage'));
const MatchListPage = lazy(() => import('./pages/MatchListPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SharedReportPage = lazy(() => import('./pages/SharedReportPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const UpdatesPage = lazy(() => import('./pages/UpdatesPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));

export default function App() {
  return (
    <AssetProvider>
      <div className="min-h-screen flex flex-col relative">
        <svg className="fixed top-0 left-0 w-0 h-0 pointer-events-none opacity-0">
          <filter id="distress-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
          </filter>
        </svg>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          <Suspense fallback={<LoadingState progressText="Loading page..." />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/matches/:accountId" element={<MatchListPage />} />
              <Route path="/player/:accountId" element={<PlayerProfilePage />} />
              <Route path="/dashboard/:matchId/:accountId" element={<DashboardPage />} />
              <Route path="/report/:matchId/:accountId" element={<SharedReportPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/updates" element={<UpdatesPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <Analytics />
      </div>
    </AssetProvider>
  );
}
