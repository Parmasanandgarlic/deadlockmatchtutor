import { useParams, Link } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';
import { absoluteUrl } from '../utils/seo';

export default function EntityStatPage() {
  const { id } = useParams();
  
  // Format id for display (e.g., "spirit-damage" -> "Spirit Damage")
  const statName = id ? id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown Stat';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: statName,
    inDefinedTermSet: 'https://aftermatch.xyz/entity/stat',
    description: `Definition and analytics context for ${statName} in Deadlock.`,
    url: absoluteUrl(`/entity/stat/${id}`)
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SEOHead
        title={`${statName} - Deadlock Mechanic Definition | AfterMatch`}
        description={`Entity overview and mechanical definition for ${statName}. Data sourced from the AfterMatch analytics engine.`}
        canonical={absoluteUrl(`/entity/stat/${id}`)}
        schema={schema}
      />
      
      <header className="mb-10">
        <h1 className="text-4xl font-black mb-2">{statName} — Mechanic Definition</h1>
        <p className="text-deadlock-muted">Classified OSIC gameplay mechanic definition.</p>
      </header>

      <section className="card mb-8">
        <h2 className="text-xl font-bold mb-4 border-b border-deadlock-border pb-2">Mechanic Properties</h2>
        <ul className="space-y-2 text-sm text-deadlock-text-dim">
          <li><strong>Entity Type:</strong> DefinedTerm (Game Mechanic)</li>
          <li><strong>Context:</strong> Deadlock Combat System</li>
          <li><strong>Calculation Base:</strong> Post-mitigation output</li>
        </ul>
      </section>

      <section className="bg-black/30 p-6 rounded border border-white/5">
        <h3 className="font-bold mb-2">Methodology</h3>
        <p className="text-xs text-deadlock-muted">
          Definitions sourced and compiled from OSIC field reports and community analytics via AfterMatch API.
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
