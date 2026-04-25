import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';
import { absoluteUrl } from '../utils/seo';

export default function NotFoundPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <SEOHead
        title="Page Not Found - Deadlock AfterMatch"
        description="This Deadlock AfterMatch page could not be found. Return home, read the FAQ, or use the sitemap to find public routes."
        canonical={absoluteUrl('/404')}
        robots="noindex,nofollow"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Deadlock AfterMatch 404 page',
          description: 'Navigation page for unknown Deadlock AfterMatch routes.',
        }}
      />
      <SearchX className="w-12 h-12 text-deadlock-accent mx-auto mb-4" aria-hidden="true" />
      <h1 className="text-3xl font-extrabold mb-4">Page Not Found</h1>
      <p className="text-deadlock-text-dim mb-8">
        This AfterMatch route does not exist or the report link is incomplete.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          Analyze a Match
        </Link>
        <Link to="/faq" className="btn-secondary">
          Read FAQ
        </Link>
        <a href="/sitemap.xml" className="btn-secondary">
          View Sitemap
        </a>
      </div>
    </div>
  );
}
