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
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const HeroGuidePage = lazy(() => import('./pages/HeroGuidePage'));

export default function App() {
  return (
    <AssetProvider>
      <div className="min-h-screen flex flex-col relative">
        <svg className="fixed top-0 left-0 w-0 h-0 pointer-events-none opacity-0">
          <filter id="distress-filter" x="-20%" y="-20%" width="140%" height="140%">
            {/* 1. Edge roughness (macro wear) */}
            <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="4" result="roughNoise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 4 -1.2" in="roughNoise" result="roughNoiseHighContrast" />
            <feDisplacementMap in="SourceGraphic" in2="roughNoiseHighContrast" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="roughGraphic" />
            
            {/* 2. Scratches / Directional Wear (horizontal) */}
            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.4" numOctaves="3" result="scratchNoise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 6 -3.5" in="scratchNoise" result="scratchMask" />
            
            {/* 3. Fine speckle wear (like stamped ink) */}
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" result="speckleNoise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 5 -3" in="speckleNoise" result="speckleMask" />
            
            {/* 4. Combine scratches and speckles into one master wear mask */}
            <feComposite in="scratchMask" in2="speckleMask" operator="over" result="masterWear" />
            
            {/* 5. Subtract wear mask from the roughened graphic */}
            <feComposite in="roughGraphic" in2="masterWear" operator="out" />
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
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/guide/:heroId" element={<HeroGuidePage />} />
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
