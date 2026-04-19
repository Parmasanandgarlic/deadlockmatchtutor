import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlayerTrends } from '../hooks/usePlayerTrends';
import LoadingState from '../components/ui/LoadingState';
import { ErrorEmptyState } from '../components/ui/EmptyState';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import SEOHead from '../components/seo/SEOHead';

// Helper component for trend indicators
const TrendBadge = ({ trend }) => {
  if (trend === 'improving') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-sans bg-green-500/20 text-green-400 border border-green-500/30">
        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        IMPROVING
      </span>
    );
  }
  if (trend === 'declining') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-sans bg-red-500/20 text-red-400 border border-red-500/30">
        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
        </svg>
        DECLINING
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-sans bg-gray-500/20 text-gray-400 border border-gray-500/30">
      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
      STABLE
    </span>
  );
};

// Custom Tooltip for the Recharts component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1e232d] border border-[#ffad1c]/30 p-3 rounded-md shadow-xl text-sm font-sans">
        <div className="flex justify-between items-center mb-2 border-b border-[#3b7db2]/20 pb-1">
          <span className="text-gray-300 font-semibold">Match ID:</span>
          <span className="text-[#ffad1c]">{data.matchId}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Result:</span>
            <span className={`font-bold ${data.won ? 'text-green-400' : 'text-red-400'}`}>
              {data.won ? 'Victory' : 'Defeat'}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Impact Score:</span>
            <span className="text-[#ffad1c] font-bold">{data.score}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">KDA:</span>
            <span className="text-white font-bold">{data.kda.toFixed(1)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Souls/Min:</span>
            <span className="text-[#3b7db2] font-bold">{data.spm}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PlayerProfilePage() {
  const { accountId } = useParams();
  const { trendsData, isLoading, error } = usePlayerTrends(accountId);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] py-20 flex flex-col items-center justify-center">
        <LoadingState progressText="AGGREGATING MATCH HISTORY..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <ErrorEmptyState message={error} />
        <div className="mt-6 text-center">
          <Link to="/" className="text-[#3b7db2] hover:text-[#ffad1c] transition-colors font-serif">
            &larr; Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!trendsData) return null;

  if (!trendsData.available || trendsData.insufficientData) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="bg-[#151921] border border-[#ffad1c] rounded-sm p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#151921] via-[#ffad1c] to-[#151921]"></div>
          <h2 className="font-serif text-2xl text-white mb-2">Insufficient Intel</h2>
          <p className="text-gray-400 font-sans mb-6">
            {trendsData.message || 'We need more analyzed matches to generate reliable trend data.'}
            <br />
            Matches analyzed: <span className="text-[#ffad1c] font-bold">{trendsData.matchesAnalyzed || 0}</span>
          </p>
          <Link to={`/player/${accountId}`} className="inline-block bg-[#1a2130] hover:bg-[#20293b] text-[#ffad1c] px-6 py-2 border border-[#3b7db2]/50 font-serif transition-colors">
            Analyze Recent Matches
          </Link>
        </div>
      </div>
    );
  }

  const { averages, trends, timeline } = trendsData;

  // Enhance timeline with index for X-axis
  const chartData = timeline.map((match, i) => ({
    ...match,
    index: i + 1,
    name: `M${i + 1}`
  }));

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <SEOHead 
        title="Player Trend Dashboard | Deadlock AfterMatch" 
        description="Long-term performance trends, winning trajectories, and progression analysis." 
      />

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b-2 border-[#1a2130] pb-4">
        <div>
          <Link to={`/player/${accountId}`} className="text-[#3b7db2] hover:text-[#ffad1c] font-sans text-sm mb-2 inline-flex items-center transition-colors">
            &larr; Back to Match History
          </Link>
          <h1 className="text-4xl font-serif text-white uppercase tracking-wider mt-2">
            Combat <span className="text-[#ffad1c]">Trends</span>
          </h1>
          <p className="text-gray-400 font-sans mt-1">Rolling average over the last {trendsData.matchesAnalyzed} analyzed matches</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Stat Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#151921] p-5 border-l-4 border-[#ffad1c] rounded-r-md shadow-lg">
            <div className="text-sm text-gray-400 font-sans uppercase mb-1">Impact Avg</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-serif text-white">{averages.score}</div>
              <TrendBadge trend={trends.score} />
            </div>
          </div>

          <div className="bg-[#151921] p-5 border-l-4 border-[#3b7db2] rounded-r-md shadow-lg">
            <div className="text-sm text-gray-400 font-sans uppercase mb-1">Win Rate</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-serif text-white">{averages.winrate}%</div>
              {/* Could add trend if calculated */}
            </div>
          </div>

          <div className="bg-[#151921] p-5 border-l-4 border-gray-600 rounded-r-md shadow-lg">
            <div className="text-sm text-gray-400 font-sans uppercase mb-1">KDA Avg</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-serif text-white">{averages.kda.toFixed(1)}</div>
              <TrendBadge trend={trends.kda} />
            </div>
          </div>

          <div className="bg-[#151921] p-5 border-l-4 border-green-700 rounded-r-md shadow-lg">
            <div className="text-sm text-gray-400 font-sans uppercase mb-1">Souls/Min Avg</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-serif text-white">{averages.spm}</div>
              <TrendBadge trend={trends.spm} />
            </div>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="lg:col-span-3 bg-[#151921] border border-[#1a2130] rounded-sm p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffad1c] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
          
          <h3 className="font-serif text-xl text-white mb-6 uppercase tracking-widest border-b border-[#20293b] pb-2 inline-block">
            Impact Progression
          </h3>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3342" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#4b5563" 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'monospace' }}
                  tickMargin={10}
                />
                <YAxis 
                  stroke="#4b5563" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={averages.score} stroke="#3b7db2" strokeDasharray="4 4" opacity={0.6} />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#ffad1c" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#151921', stroke: '#ffad1c', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#ffad1c', stroke: '#fff', strokeWidth: 1 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex justify-between items-center text-xs font-sans text-gray-500">
            <span>&larr; Older Matches</span>
            <div className="flex items-center">
              <div className="w-4 h-0 border-t-2 border-dashed border-[#3b7db2] mr-2"></div>
              <span>Trend Average</span>
            </div>
            <span>Newer Matches &rarr;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
