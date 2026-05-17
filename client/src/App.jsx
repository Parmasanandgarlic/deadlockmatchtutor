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
          <filter id="distress-filter" x="-10%" y="-10%" width="120%" height="120%">
            {/* 1. Edge roughness — gentle wobble */}
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="roughNoise" />
            <feDisplacementMap in="SourceGraphic" in2="roughNoise" scale="2" xChannelSelector="R" yChannelSelector="G" result="roughGraphic" />
            
            {/* 2. Large irregular dots (varying circle sizes) */}
            <feTurbulence type="turbulence" baseFrequency="0.15" numOctaves="2" seed="3" result="largeDots" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 8 -5.5" in="largeDots" result="largeDotMask" />
            
            {/* 3. Medium dots — different seed for offset pattern */}
            <feTurbulence type="turbulence" baseFrequency="0.35" numOctaves="2" seed="7" result="medDots" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 7 -5" in="medDots" result="medDotMask" />
            
            {/* 4. Fine grain dots */}
            <feTurbulence type="turbulence" baseFrequency="0.7" numOctaves="1" seed="13" result="fineDots" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 6 -4.5" in="fineDots" result="fineDotMask" />
            
            {/* 5. Layer all dot sizes together */}
            <feComposite in="largeDotMask" in2="medDotMask" operator="over" result="dotLayer1" />
            <feComposite in="dotLayer1" in2="fineDotMask" operator="over" result="allDots" />
            
            {/* 6. Punch dots out of the roughened text */}
            <feComposite in="roughGraphic" in2="allDots" operator="out" />
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
