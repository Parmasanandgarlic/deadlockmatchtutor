import { Link } from 'react-router-dom';

export default function RelatedContentWidget({ heroName, matchId }) {
  // Simple related content suggestions based on context.
  // In a real app, these might come from an API endpoint predicting user journey.
  const heroSlug = heroName ? heroName.toLowerCase().replace(/[^a-z0-9]/g, '') : null;

  return (
    <section aria-label="Related Intelligence" className="card mt-8 bg-black/40 border border-white/5 p-5 rounded-lg">
      <h3 className="font-bold text-lg mb-4 text-white">Related Intelligence</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {heroName && heroSlug && (
          <Link to={`/guide/${heroSlug}`} className="group block bg-deadlock-bg border border-deadlock-border rounded p-4 hover:border-deadlock-accent/50 transition-colors">
            <h4 className="text-sm font-bold text-deadlock-text group-hover:text-deadlock-accent transition-colors">
              {heroName} Advanced Guide
            </h4>
            <p className="text-xs text-deadlock-muted mt-1">
              Learn optimal build paths and power spikes for {heroName}.
            </p>
          </Link>
        )}

        {heroName && heroSlug && (
          <Link to={`/entity/hero/${heroSlug}`} className="group block bg-deadlock-bg border border-deadlock-border rounded p-4 hover:border-deadlock-accent/50 transition-colors">
            <h4 className="text-sm font-bold text-deadlock-text group-hover:text-deadlock-accent transition-colors">
              {heroName} Meta Context
            </h4>
            <p className="text-xs text-deadlock-muted mt-1">
              View {heroName}'s entity definition and current patch performance.
            </p>
          </Link>
        )}

        <Link to="/resources" className="group block bg-deadlock-bg border border-deadlock-border rounded p-4 hover:border-deadlock-accent/50 transition-colors">
          <h4 className="text-sm font-bold text-deadlock-text group-hover:text-deadlock-accent transition-colors">
            Current Patch Tier List
          </h4>
          <p className="text-xs text-deadlock-muted mt-1">
            See how the meta is shifting in the current Deadlock patch.
          </p>
        </Link>
        
        <Link to="/faq" className="group block bg-deadlock-bg border border-deadlock-border rounded p-4 hover:border-deadlock-accent/50 transition-colors">
          <h4 className="text-sm font-bold text-deadlock-text group-hover:text-deadlock-accent transition-colors">
            Understanding SPM Benchmarks
          </h4>
          <p className="text-xs text-deadlock-muted mt-1">
            Learn why Souls Per Minute is the most critical metric.
          </p>
        </Link>

      </div>
    </section>
  );
}
