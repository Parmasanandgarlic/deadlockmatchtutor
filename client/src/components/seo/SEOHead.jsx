import { useEffect } from 'react';
import { DEFAULT_IMAGE_PATH, SITE_NAME, SITE_URL } from '../../utils/seo';

const DEFAULT_TITLE = 'Deadlock AfterMatch Match Analyzer';
const DEFAULT_DESC =
  'Free Deadlock match analyzer. Get instant post-match grades, hero performance reports, economy breakdowns, item timing analysis, and personalized coaching \u2014 no login required.';
const DEFAULT_KEYWORDS =
  'Deadlock, Deadlock analytics, Deadlock tracker, post-match report, player dossier, ranked profile, KDA, item build, hero stats, benchmark comparison, Valve';

function stripContext(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(stripContext);
  const { ['@context']: _ctx, ...rest } = value;
  return rest;
}

function normalizeSchema(schema) {
  if (!schema) return null;
  if (Array.isArray(schema)) {
    return {
      '@context': 'https://schema.org',
      '@graph': schema.map(stripContext),
    };
  }
  if (typeof schema === 'object') {
    if (schema['@context']) return schema;
    return { '@context': 'https://schema.org', ...schema };
  }
  return null;
}

export default function SEOHead({
  title,
  description = DEFAULT_DESC,
  keywords = DEFAULT_KEYWORDS,
  type = 'website',
  schema,
  imageUrl = DEFAULT_IMAGE_PATH,
  canonical,
  robots,
  lang = 'en',
}) {
  const finalTitle = title || DEFAULT_TITLE;
  const finalDescription = description || DEFAULT_DESC;
  const finalKeywords = keywords || DEFAULT_KEYWORDS;

  useEffect(() => {
    const resolvedCanonical = canonical || new URL(window.location.pathname || '/', SITE_URL).toString();

    const resolvedImageUrl = (() => {
      try {
        return new URL(imageUrl || DEFAULT_IMAGE_PATH, SITE_URL).toString();
      } catch {
        return new URL(DEFAULT_IMAGE_PATH, SITE_URL).toString();
      }
    })();

    if (lang) {
      document.documentElement.setAttribute('lang', lang);
    }

    document.title = finalTitle;

    const setMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let element = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        element.setAttribute('data-seo', 'true');
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const setLinkTag = (rel, href) => {
      if (!href) return;
      let element = document.head.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        element.setAttribute('data-seo', 'true');
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    setMetaTag('name', 'description', finalDescription);
    setMetaTag('name', 'keywords', finalKeywords);
    setMetaTag(
      'name',
      'robots',
      robots || 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
    );

    setLinkTag('canonical', resolvedCanonical);

    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', finalDescription);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', resolvedCanonical);
    setMetaTag('property', 'og:image', resolvedImageUrl);
    setMetaTag('property', 'og:image:width', '1024');
    setMetaTag('property', 'og:image:height', '1024');
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:locale', 'en_US');

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', finalDescription);
    setMetaTag('name', 'twitter:image', resolvedImageUrl);

    const normalizedSchema = normalizeSchema(schema);
    let scriptTag = document.head.querySelector('script[id="json-ld-schema"]');

    if (normalizedSchema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        scriptTag.setAttribute('id', 'json-ld-schema');
        scriptTag.setAttribute('data-seo', 'true');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(normalizedSchema);
    } else if (scriptTag) {
      document.head.removeChild(scriptTag);
    }
  }, [finalTitle, finalDescription, finalKeywords, type, schema, imageUrl, canonical, robots, lang]);

  return null;
}
