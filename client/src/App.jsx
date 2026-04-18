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

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/matches/:accountId" element={<MatchListPage />} />
          <Route path="/dashboard/:matchId/:accountId" element={<DashboardPage />} />
          <Route path="/report/:matchId/:accountId" element={<SharedReportPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <Footer />
      <Analytics />
    </div>
  );
}
