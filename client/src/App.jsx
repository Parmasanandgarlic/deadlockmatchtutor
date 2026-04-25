import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import MatchListPage from './pages/MatchListPage';
import DashboardPage from './pages/DashboardPage';
import SharedReportPage from './pages/SharedReportPage';
import PrivacyPage from './pages/PrivacyPage';
import AboutPage from './pages/AboutPage';
import PlayerProfilePage from './pages/PlayerProfilePage';
import FaqPage from './pages/FaqPage';
import UpdatesPage from './pages/UpdatesPage';
import NotFoundPage from './pages/NotFoundPage';
import { AssetProvider } from './contexts/AssetContext';

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
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <Analytics />
      </div>
    </AssetProvider>
  );
}
