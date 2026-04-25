import { Link } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';
import {
  absoluteUrl,
  articleSchema,
  breadcrumbSchema,
  organizationSchema,
  speakableSchema,
  websiteSchema,
} from '../utils/seo';

const updates = [
  {
    date: '2026-04-24',
    title: 'SEO, AEO, GEO, and accessibility pass',
    summary:
      'AfterMatch added dedicated FAQ and updates pages, richer structured data, clearer entity descriptions, improved route metadata, and stronger crawl controls.',
  },
  {
    date: '2026-04-20',
    title: 'Public post-match analyzer baseline',
    summary:
      'AfterMatch shipped the public Deadlock match analyzer with match lists, player profiles, report sharing, and module-based performance grading.',
  },
];

export default function UpdatesPage() {
  const schema = [
    organizationSchema(),
    websiteSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Updates', path: '/updates' },
    ]),
    {
      '@type': 'CollectionPage',
      name: 'Deadlock AfterMatch updates',
      url: absoluteUrl('/updates'),
      description: 'Product updates and changelog notes for Deadlock AfterMatch.',
      mainEntity: updates.map((update) =>
        articleSchema({
          path: '/updates',
          headline: update.title,
          description: update.summary,
          datePublished: update.date,
        })
      ),
    },
    speakableSchema('/updates'),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SEOHead
        title="Deadlock AfterMatch Product Updates and Changelog Notes"
        description="Recent Deadlock AfterMatch product updates, changelog notes, SEO improvements, match report changes, and analytics release history."
        canonical={absoluteUrl('/updates')}
        imageUrl="/images/bg-scene.png"
        schema={schema}
      />

      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-deadlock-amber mb-3">
          Product Recency
        </p>
        <h1 className="text-3xl font-extrabold mb-4">Deadlock AfterMatch Updates</h1>
        <p className="answer-block text-deadlock-text-dim text-base leading-relaxed max-w-3xl">
          Deadlock AfterMatch publishes update notes so players and search engines can see what changed, when it changed,
          and which analytics or accessibility improvements are current.
        </p>
      </header>

      <section aria-label="Recent product updates" className="space-y-4">
        {updates.map((update) => (
          <article key={`${update.date}-${update.title}`} className="card">
            <time dateTime={update.date} className="text-xs font-mono text-deadlock-accent">
              {update.date}
            </time>
            <h2 className="text-lg font-bold text-deadlock-text mt-2 mb-3">{update.title}</h2>
            <p className="text-sm text-deadlock-text-dim leading-relaxed">{update.summary}</p>
          </article>
        ))}
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/" className="btn-primary">
          Analyze a Match
        </Link>
        <Link to="/faq" className="btn-secondary">
          Read FAQ
        </Link>
      </div>
    </div>
  );
}
