import { Search, Filter, ArrowUpDown } from 'lucide-react';

/**
 * Filter + sort controls for the recent-match list.
 * All state is lifted to the parent MatchListPage so the toolbar stays stateless.
 *
 * Art-deco treatment: double-border inset card, decorative corner accents,
 * geometric section divider between controls and result count.
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
    <div className="card mb-6 !p-0 relative overflow-visible">
      {/* Corner accents — small art-deco triangles */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-deadlock-amber/30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-deadlock-amber/30 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-deadlock-amber/30 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-deadlock-amber/30 pointer-events-none" />

      {/* Inner inset panel */}
      <div className="m-[1px] border border-deadlock-border/30 p-4">
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

        {/* Geometric section divider */}
        <div className="flex items-center gap-0 mt-3 mb-2">
          <div className="flex-1 h-px bg-gradient-to-r from-deadlock-border/60 to-deadlock-border/20" />
          <div className="w-1 h-1 rotate-45 bg-deadlock-amber/30 mx-2 shrink-0" />
          <div className="flex-1 h-px bg-gradient-to-l from-deadlock-border/60 to-deadlock-border/20" />
        </div>

        {/* Result count */}
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-deadlock-muted">
          Showing {matchCount} of {totalCount} matches
        </div>
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, accent, children }) {
  const activeClasses = {
    green: 'bg-deadlock-green/15 border-deadlock-green/40 text-deadlock-green shadow-[inset_0_1px_0_0_rgba(46,204,113,0.15)]',
    red: 'bg-deadlock-red/15 border-deadlock-red/40 text-deadlock-red shadow-[inset_0_1px_0_0_rgba(255,77,77,0.15)]',
    default: 'bg-deadlock-accent/15 border-deadlock-accent/40 text-deadlock-accent shadow-[inset_0_1px_0_0_rgba(255,173,28,0.15)]',
  }[accent || 'default'];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 border transition-all duration-200 ${
        active
          ? activeClasses
          : 'border-deadlock-border text-deadlock-muted hover:text-deadlock-text hover:border-deadlock-accent/40'
      }`}
    >
      {children}
    </button>
  );
}
