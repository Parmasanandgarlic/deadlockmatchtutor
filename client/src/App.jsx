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

export default function App() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <svg className="fixed top-0 left-0 w-0 h-0 pointer-events-none opacity-0">
        <filter id="distress-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
        </filter>
      </svg>
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/matches/:accountId" element={<MatchListPage />} />
          <Route path="/player/:accountId" element={<PlayerProfilePage />} />
          <Route path="/dashboard/:matchId/:accountId" element={<DashboardPage />} />
          <Route path="/report/:matchId/:accountId" element={<SharedReportPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <Footer />
      <Analytics />
    </div>
import { AssetProvider } from './contexts/AssetContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AssetProvider>
        <div className="min-h-screen flex flex-col relative">
        <svg className="fixed top-0 left-0 w-0 h-0 pointer-events-none opacity-0">
          <filter id="distress-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
          </filter>
        </svg>
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/matches/:accountId" element={<MatchListPage />} />
            <Route path="/player/:accountId" element={<PlayerProfilePage />} />
            <Route path="/dashboard/:matchId/:accountId" element={<DashboardPage />} />
            <Route path="/report/:matchId/:accountId" element={<SharedReportPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        <Footer />
        <Analytics />
      </div>
      </AssetProvider>
    </QueryClientProvider>
  );
}
