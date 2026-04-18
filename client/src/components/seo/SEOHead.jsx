import { useEffect } from 'react';

const DEFAULT_TITLE = 'Deadlock AfterMatch — Post-Match Performance Grading';
const DEFAULT_DESC = 'Free, open-source post-match analytics for Deadlock. Grade your economy, itemization, combat, and benchmarks with actionable insights.';
const DEFAULT_KEYWORDS = 'Deadlock, Deadlock game, post-match, analytics, performance, KDA, build, hero guide, Valve';

/**
 * SEOHead - Injects SEO tags, Open Graph meta, and JSON-LD schema into the document head.
 * optimized for SPA runtime execution.
 */
export default function SEOHead({ 
  title, 
  description = DEFAULT_DESC, 
  keywords = DEFAULT_KEYWORDS, 
  type = 'website', 
  schema,
  imageUrl = '/favicon.svg'
}) {
  const finalTitle = title ? `${title} · Deadlock AfterMatch` : DEFAULT_TITLE;

  useEffect(() => {
    const url = window.location.href;

    // 1. Title
    document.title = finalTitle;

    // Helper to safely update or create meta tags
    const setMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let element = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);

    // 3. Open Graph
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:image', imageUrl);

    // 4. Twitter
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', imageUrl);

    // 5. Structured Data (JSON-LD) for AEO/GEO
    let scriptTag = document.head.querySelector('script[id="json-ld-schema"]');
    
    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        scriptTag.setAttribute('id', 'json-ld-schema');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    } else if (scriptTag) {
      // Remove it if no schema provided for this route
      document.head.removeChild(scriptTag);
    }
  }, [finalTitle, description, keywords, type, schema, imageUrl]);

  return null; // Component does not render any visible UI
}
