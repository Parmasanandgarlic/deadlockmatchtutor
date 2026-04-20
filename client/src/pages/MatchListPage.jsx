import { useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { usePlayerMatches, useSyncPlayerMatches } from '../hooks/usePlayer';
import SEOHead from '../components/seo/SEOHead';
import DeadlockSceneBackground from '../components/layout/DeadlockSceneBackground';
import MatchCard from '../components/matches/MatchCard';
import MatchListToolbar from '../components/matches/MatchListToolbar';
import MatchSummaryPanel from '../components/matches/MatchSummaryPanel';
import { getHeroName } from '../utils/heroes';
import { toErrorMessage } from '../utils/errorMessage';

const DEFAULT_FILTERS = {
  search: '',
  result: 'all', // 'all' | 'win' | 'loss'
  hero: 'all',
  sort: 'recent',
};

export default function MatchListPage() {
  const { accountId } = useParams();
  const { data: matches = [], isLoading: loading, error, refetch } = usePlayerMatches(accountId);
  const syncMutation = useSyncPlayerMatches();
  const isSyncing = syncMutation.isPending;
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const heroOptions = useMemo(
    () => deriveHeroOptions(matches),
    [matches]
  );

  const filteredMatches = useMemo(
    () => applyFiltersAndSort(matches, filters),
    [matches, filters]
  );

  const matchListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      identifier: accountId,
      name: `Player ${accountId}`,
    },
  };

  if (!accountId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-deadlock-red mb-4">No account ID provided.</p>
        <Link to="/" className="text-deadlock-accent underline">Return to search</Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-[90vh]">
      {/* Deadlock-themed subway/shop scene (composed SVG, no external asset) */}
      <DeadlockSceneBackground intensity={0.28} />
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        <SEOHead title={`Matches · ${accountId}`} schema={matchListSchema} />

        <Link
        to="/"
        className="inline-flex items-center gap-2 text-deadlock-text-dim hover:text-deadlock-accent mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to search
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="deadlock-divider max-w-[320px] mb-3">
            <span className="deadlock-divider__pip" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Recent Matches</h2>
          <p className="text-deadlock-text-dim">
            Account ID: <span className="font-mono text-deadlock-accent">{accountId}</span>
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link
            to={`/player/${accountId}`}
            className="btn-primary flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 h-fit"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            View Trends
          </Link>
          <button
            onClick={() => syncMutation.mutate(accountId)}
            disabled={loading || isSyncing}
            className={`btn-secondary flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 h-fit ${isSyncing ? 'opacity-70' : ''}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync with API'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-deadlock-accent animate-spin" />
          <span className="ml-3 text-deadlock-text-dim">Loading matches...</span>
        </div>
      )}

      {error && !loading && (
        <div className="card text-center py-12">
          <p className="text-deadlock-red mb-4">{toErrorMessage(error)}</p>
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

      {!loading && !error && matches.length > 0 && (
        <>
          <MatchSummaryPanel matches={matches} />

          <MatchListToolbar
            filters={filters}
            onFiltersChange={setFilters}
            heroOptions={heroOptions}
            matchCount={filteredMatches.length}
            totalCount={matches.length}
          />

          {filteredMatches.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-deadlock-text-dim mb-3">No matches match your filters.</p>
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-sm text-deadlock-accent underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMatches.map((match) => (
                <MatchCard key={match.match_id} match={match} accountId={accountId} />
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

/**
 * Build a sorted list of unique hero names seen in the match list.
 */
function deriveHeroOptions(matches) {
  if (!Array.isArray(matches)) return [];
  const set = new Set();
  for (const m of matches) {
    const name = m.hero_name || getHeroName(m.hero_id);
    if (name && name !== 'Unknown Hero') set.add(name);
  }
  return [...set].sort();
}

/**
 * Pure filtering + sorting transform — keeps MatchListPage render fast & memoisable.
 */
function applyFiltersAndSort(matches, filters) {
  if (!Array.isArray(matches)) return [];
  const { search, result, hero, sort } = filters;

  const searchLower = search.trim().toLowerCase();

  const filtered = matches.filter((m) => {
    // Match ID search
    if (searchLower && !String(m.match_id ?? '').toLowerCase().includes(searchLower)) {
      return false;
    }
    // Result filter
    if (result !== 'all') {
      const won = resolveResult(m);
      if (won === null) return false;
      if (result === 'win' && !won) return false;
      if (result === 'loss' && won) return false;
    }
    // Hero filter
    if (hero !== 'all') {
      const name = m.hero_name || getHeroName(m.hero_id);
      if (name !== hero) return false;
    }
    return true;
  });

  return filtered.sort(sortComparator(sort));
}

function sortComparator(sort) {
  switch (sort) {
    case 'kda':
      return (a, b) => computeKda(b) - computeKda(a);
    case 'duration':
      return (a, b) => durationOf(b) - durationOf(a);
    case 'networth':
      return (a, b) => (b.net_worth ?? 0) - (a.net_worth ?? 0);
    case 'recent':
    default:
      return (a, b) => startTimeOf(b) - startTimeOf(a);
  }
}

function computeKda(m) {
  const k = m.player_kills ?? m.kills ?? 0;
  const d = m.player_deaths ?? m.deaths ?? 0;
  const a = m.player_assists ?? m.assists ?? 0;
  return d > 0 ? (k + a) / d : k + a;
}

function durationOf(m) {
  return m.match_duration_s ?? m.duration_s ?? m.duration ?? 0;
}

function startTimeOf(m) {
  const t = m.start_time ?? m.match_start_time ?? 0;
  if (!t) return 0;
  return typeof t === 'number' ? (t < 1e12 ? t * 1000 : t) : new Date(t).getTime() || 0;
}

function resolveResult(m) {
  if (m.match_result != null && m.player_team != null) {
    return m.match_result === m.player_team;
  }
  if (m.player_team_won != null) return m.player_team_won;
  if (m.won != null) return m.won;
  return null;
}
