import { Shield, Database, Eye, Lock, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';
import {
  absoluteUrl,
  breadcrumbSchema,
  faqSchema,
  organizationSchema,
  speakableSchema,
  websiteSchema,
} from '../utils/seo';

const sections = [
  {
    icon: Eye,
    title: 'What data do you collect?',
    items: [
      'Steam ID, vanity name, or profile URL you enter to look up a player',
      'Match IDs and account IDs associated with analyses you request',
      'Cached analysis results stored in Supabase',
    ],
  },
  {
    icon: Database,
    title: 'How do you use the data?',
    items: [
      'To resolve your Steam identity and fetch match history from the Deadlock API',
      'To compute post-match analytics for economy, combat, and itemization',
      'To cache analysis results so reports can load without re-computing',
    ],
  },
  {
    icon: Lock,
    title: 'How is data stored and protected?',
    items: [
      'Analysis caches are stored in Supabase PostgreSQL with row-level security',
      'No passwords, payment information, or private Steam credentials are stored',
      'All API traffic is encrypted via HTTPS',
      'We do not sell, share, or transfer your data to third parties',
    ],
  },
  {
    icon: Trash2,
    title: 'How long is data kept, and how can it be deleted?',
    items: [
      'Cached analyses are retained for performance and contain match statistics tied to an account ID',
      'You may request deletion of cached analyses by emailing contact@aftermatch.xyz or opening a GitHub issue',
      'Steam IDs are used only to resolve and fetch the data needed for analysis',
    ],
  },
  {
    icon: Shield,
    title: 'Which third-party services are involved?',
    items: [
      'Match data is sourced from the community-run Deadlock API',
      "Steam vanity resolution uses Steam's public profile endpoints",
      'Site analytics may be provided by Vercel Analytics as part of hosting telemetry',
      'Deadlock AfterMatch is not affiliated with Valve Corporation or the Deadlock API project',
    ],
  },
];

const privacyFaqs = [
  {
    question: 'What data does Deadlock AfterMatch collect?',
    answer:
      'AfterMatch collects the Steam profile identifier you enter, match/account IDs required for analysis, and cached analysis results so pages load faster. It does not require passwords or payment information.',
  },
  {
    question: 'How can I request deletion of cached analyses?',
    answer:
      'Email contact@aftermatch.xyz or open a GitHub issue with your account ID and the match IDs you want removed.',
  },
];

export default function PrivacyPage() {
  const privacySchema = [
    organizationSchema(),
    websiteSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Privacy', path: '/privacy' },
    ]),
    {
      '@type': 'WebPage',
      name: 'Privacy Policy - Deadlock AfterMatch',
      description:
        'Privacy policy and data handling practices for the Deadlock AfterMatch analytics tool, including Steam ID usage and match analysis caching.',
      url: absoluteUrl('/privacy'),
    },
    faqSchema(privacyFaqs),
    speakableSchema('/privacy'),
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEOHead
        title="Deadlock AfterMatch Privacy Policy and Data Use Guide"
        description="Privacy policy for Deadlock AfterMatch: Steam ID lookup, match analysis caching, third-party services, deletion requests, and data use."
        canonical={absoluteUrl('/privacy')}
        imageUrl="/images/bg-scene.png"
        schema={privacySchema}
      />

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">
          <span className="text-deadlock-accent">Privacy</span> Policy
        </h1>
        <p className="text-deadlock-text-dim">Last updated: April 24, 2026</p>
        <section aria-label="Privacy summary" className="answer-block mt-4 text-sm text-deadlock-muted leading-relaxed space-y-2">
          <p>Deadlock AfterMatch uses your Steam profile identifier to fetch match data and generate analytics.</p>
          <p>Deadlock AfterMatch does not ask for Steam passwords, payment information, or private Steam credentials.</p>
          <p>Deadlock AfterMatch caches analysis results for performance, and you can request deletion via email or GitHub.</p>
        </section>
      </header>

      <div className="space-y-8">
        {sections.map(({ icon: Icon, title, items }) => (
          <section key={title} aria-label={title} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-deadlock-accent/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-deadlock-accent" />
              </div>
              <h2 className="text-lg font-bold text-deadlock-text">{title}</h2>
            </div>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-deadlock-text-dim">
                  <span className="text-deadlock-accent mt-1 shrink-0" aria-hidden="true">
                    *
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className="mt-8 card bg-deadlock-bg border-deadlock-border">
        <p className="text-sm text-deadlock-text-dim leading-relaxed">
          This project is open source. If you have questions or concerns about data practices, please open an issue on{' '}
          <a
            href="https://github.com/Parmasanandgarlic/deadlockmatchtutor"
            target="_blank"
            rel="noopener noreferrer"
            className="text-deadlock-accent hover:underline"
          >
            GitHub
          </a>
          .
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/faq" className="btn-secondary text-xs">
            Read FAQ
          </Link>
          <Link to="/about" className="btn-secondary text-xs">
            About AfterMatch
          </Link>
        </div>
      </aside>
    </div>
  );
}
