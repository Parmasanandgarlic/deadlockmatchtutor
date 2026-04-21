import { useEffect } from 'react';

const DEFAULT_TITLE = 'Deadlock AfterMatch — Post-Match Performance Grading & Player Dossiers';
const DEFAULT_DESC = 'Open-source Deadlock analytics with dossier-style match reports, ranked player profiles, top heroes, item builds, combat grades, and benchmark comparisons.';
const DEFAULT_KEYWORDS = 'Deadlock, Deadlock analytics, Deadlock tracker, post-match report, player dossier, ranked profile, KDA, item build, hero stats, benchmark comparison, Valve';

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
  const finalTitle = title
    ? /deadlock aftermatch/i.test(title)
      ? title
      : `${title} · Deadlock AfterMatch`
    : DEFAULT_TITLE;
  const finalDescription = description || DEFAULT_DESC;
  const finalKeywords = keywords || DEFAULT_KEYWORDS;

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
    setMetaTag('name', 'description', finalDescription);
    setMetaTag('name', 'keywords', finalKeywords);

    // 3. Open Graph
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', finalDescription);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:image', imageUrl);

    // 4. Twitter
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', finalDescription);
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
  }, [finalTitle, finalDescription, finalKeywords, type, schema, imageUrl]);

  return null; // Component does not render any visible UI
}
