import { Search, Filter, ArrowUpDown } from 'lucide-react';

/**
 * Filter + sort controls for the recent-match list.
 * All state is lifted to the parent MatchListPage so the toolbar stays stateless.
 */
export default function MatchListToolbar({
  filters,
  onFiltersChange,
  heroOptions = [],
  matchCount = 0,
  totalCount = 0,
}) {
  function update(patch) {
    onFiltersChange({ ...filters, ...patch });
  }

  return (
    <div className="card mb-6 !p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search by Match ID */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-deadlock-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search match ID..."
            className="input-field pl-9 text-xs font-mono !py-2"
            aria-label="Filter matches by ID"
          />
        </div>

        {/* Result filter */}
        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
          <Filter className="w-3.5 h-3.5 text-deadlock-muted mr-1" />
          <FilterPill active={filters.result === 'all'} onClick={() => update({ result: 'all' })}>
            All
          </FilterPill>
          <FilterPill active={filters.result === 'win'} onClick={() => update({ result: 'win' })} accent="green">
            Wins
          </FilterPill>
          <FilterPill active={filters.result === 'loss'} onClick={() => update({ result: 'loss' })} accent="red">
            Losses
          </FilterPill>
        </div>

        {/* Hero filter */}
        {heroOptions.length > 1 && (
          <select
            value={filters.hero}
            onChange={(e) => update({ hero: e.target.value })}
            className="input-field !py-2 text-xs !bg-deadlock-bg min-w-[130px]"
            aria-label="Filter by hero"
          >
            <option value="all">All Heroes</option>
            {heroOptions.map((hero) => (
              <option key={hero} value={hero}>{hero}</option>
            ))}
          </select>
        )}

        {/* Sort */}
        <div className="flex items-center gap-1 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-deadlock-muted" />
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="input-field !py-2 text-xs !bg-deadlock-bg min-w-[110px]"
            aria-label="Sort matches"
          >
            <option value="recent">Most Recent</option>
            <option value="kda">Best KDA</option>
            <option value="duration">Longest</option>
            <option value="networth">Most Souls</option>
          </select>
        </div>
      </div>

      {/* Result count */}
      <div className="mt-3 pt-3 border-t border-deadlock-border/40 text-[10px] font-bold uppercase tracking-[0.2em] text-deadlock-muted">
        Showing {matchCount} of {totalCount} matches
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, accent, children }) {
  const activeClasses = {
    green: 'bg-deadlock-green/15 border-deadlock-green/40 text-deadlock-green',
    red: 'bg-deadlock-red/15 border-deadlock-red/40 text-deadlock-red',
    default: 'bg-deadlock-accent/15 border-deadlock-accent/40 text-deadlock-accent',
  }[accent || 'default'];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 border transition-colors ${
        active
          ? activeClasses
          : 'border-deadlock-border text-deadlock-muted hover:text-deadlock-text hover:border-deadlock-accent/40'
      }`}
    >
      {children}
    </button>
  );
}
