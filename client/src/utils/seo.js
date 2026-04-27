export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://www.aftermatch.xyz';
export const SITE_NAME = 'Deadlock AfterMatch';
export const DEFAULT_IMAGE_PATH = '/images/og-share.png';
export const PUBLISHER_NAME = 'Deadlock AfterMatch contributors';
export const CONTACT_EMAIL = 'contact@aftermatch.xyz';

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}

export function organizationSchema() {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    email: CONTACT_EMAIL,
    sameAs: ['https://github.com/Parmasanandgarlic/deadlockmatchtutor'],
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    description: 'Deadlock AfterMatch is a free post-match analytics dashboard for Deadlock players.',
  };
}

export function breadcrumbSchema(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(faqs) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

export function speakableSchema(path, selectors = ['h1', '.answer-block']) {
  return {
    '@type': 'SpeakableSpecification',
    cssSelector: selectors,
    url: absoluteUrl(path),
  };
}

export function articleSchema({ path, headline, description, datePublished, dateModified = datePublished }) {
  return {
    '@type': 'Article',
    headline,
    description,
    author: {
      '@type': 'Organization',
      name: PUBLISHER_NAME,
    },
    publisher: organizationSchema(),
    datePublished,
    dateModified,
    mainEntityOfPage: absoluteUrl(path),
  };
}

export function howToSchema() {
  return {
    '@type': 'HowTo',
    name: 'How to analyze a Deadlock match with AfterMatch',
    description: 'Use a Steam profile URL or Steam ID to open recent matches and generate a performance report.',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Enter a Steam profile',
        text: 'Paste a Steam profile URL, vanity name, Steam64 ID, or Steam32 account ID into the search field.',
      },
      {
        '@type': 'HowToStep',
        name: 'Open a recent match',
        text: 'Choose a match from the recent match list for the selected Deadlock account.',
      },
      {
        '@type': 'HowToStep',
        name: 'Review the report',
        text: 'Read the grade, module scores, recommendations, itemization notes, combat signals, and objective analysis.',
      },
    ],
  };
}
