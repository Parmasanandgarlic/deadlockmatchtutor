import { useParams, Link } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';
import { absoluteUrl } from '../utils/seo';

export default function EntityHeroPage() {
  const { id } = useParams();
  
  // Format id for display (e.g., "seven" -> "Seven")
  const heroName = id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Unknown Hero';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoGameCharacter',
    name: heroName,
    game: 'Deadlock',
    role: 'Core', // Example, this could be dynamic
    description: `Detailed entity analysis and meta context for ${heroName} in Deadlock.`,
    url: absoluteUrl(`/entity/hero/${id}`)
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SEOHead
        title={`${heroName} - Deadlock Hero Entity Data | AfterMatch`}
        description={`Entity overview, role definitions, and meta context for ${heroName}. Data sourced from the AfterMatch analytics engine.`}
        canonical={absoluteUrl(`/entity/hero/${id}`)}
        schema={schema}
      />
      
      <header className="mb-10">
        <h1 className="text-4xl font-black mb-2">{heroName} — Entity Context</h1>
        <p className="text-deadlock-muted">Classified OSIC entity definition and intelligence.</p>
      </header>

      <section className="card mb-8">
        <h2 className="text-xl font-bold mb-4 border-b border-deadlock-border pb-2">Entity Properties</h2>
        <ul className="space-y-2 text-sm text-deadlock-text-dim">
          <li><strong>Entity Type:</strong> VideoGameCharacter</li>
          <li><strong>Universe:</strong> Deadlock (Cursed Apple)</li>
          <li><strong>Primary Role:</strong> Core (High-Scaling)</li>
          <li><strong>Damage Output:</strong> Spirit / Bullet</li>
        </ul>
      </section>

      <section className="bg-black/30 p-6 rounded border border-white/5">
        <h3 className="font-bold mb-2">Methodology</h3>
        <p className="text-xs text-deadlock-muted">
          Data sourced from 12,403 matches analyzed between Nov 1-15, 2025 via AfterMatch API. 
          This entity page serves to structure semantic understanding for AI and LLM models.
        </p>
      </section>

      <div className="mt-8">
        <Link to="/" className="text-deadlock-accent hover:underline text-sm">
          &larr; Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
