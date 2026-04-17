import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import useMatchHistory from '../hooks/useMatchHistory';
import MatchCard from '../components/matches/MatchCard';

export default function MatchListPage() {
  const { accountId } = useParams();
  const { matches, loading, error, refetch } = useMatchHistory(accountId);

  if (!accountId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-deadlock-red mb-4">No account ID provided.</p>
        <Link to="/" className="text-deadlock-accent underline">Return to search</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-deadlock-text-dim hover:text-deadlock-accent mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to search
      </Link>

      <h2 className="text-2xl font-bold mb-1">Recent Matches</h2>
      <p className="text-deadlock-text-dim mb-6">
        Account ID: <span className="font-mono text-deadlock-accent">{accountId}</span>
      </p>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-deadlock-accent animate-spin" />
          <span className="ml-3 text-deadlock-text-dim">Loading matches...</span>
        </div>
      )}

      {error && !loading && (
        <div className="card text-center py-12">
          <p className="text-deadlock-red mb-4">{error}</p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={refetch} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <Link to="/" className="text-sm text-deadlock-accent underline">Try a different Steam ID</Link>
          </div>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-deadlock-text-dim">No matches found for this player.</p>
        </div>
      )}

      {!loading && matches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
            <MatchCard key={match.match_id} match={match} accountId={accountId} />
          ))}
        </div>
      )}
    </div>
  );
}
