import { Shield, Database, Eye, Lock, Trash2 } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

const sections = [
  {
    icon: Eye,
    title: 'What data do you collect?',
    items: [
      'Steam ID, vanity name, or profile URL you enter to look up a player',
      'Match IDs and account IDs associated with analyses you request',
      'Cached analysis results (match performance data) stored in Supabase',
    ],
  },
  {
    icon: Database,
    title: 'How do you use the data?',
    items: [
      'To resolve your Steam identity and fetch match history from the Deadlock API',
      'To compute post-match analytics (economy, combat, itemization grades)',
      'To cache analysis results so you and others can view them without re-computing',
    ],
  },
  {
    icon: Lock,
    title: 'How is data stored and protected?',
    items: [
      'Analysis caches are stored in Supabase (PostgreSQL) with row-level security',
      'No passwords, payment info, or personal identification beyond Steam IDs are stored',
      'All API traffic is encrypted via HTTPS',
      'We do not sell, share, or transfer your data to third parties',
    ],
  },
  {
    icon: Trash2,
    title: 'How long is data kept, and how can it be deleted?',
    items: [
      'Cached analyses are retained for performance and contain match statistics tied to an account ID',
      'You may request deletion of cached analyses associated with your account ID by emailing contact@aftermatch.xyz or opening an issue on our GitHub repository',
      'Steam IDs are not stored independently — they are used only in transit for API resolution',
    ],
  },
  {
    icon: Shield,
    title: 'Which third-party services are involved?',
    items: [
      'Match data is sourced from the community-run Deadlock API (deadlock-api.com)',
      "Steam vanity resolution uses Steam's public profile endpoints",
      'Site analytics may be provided by Vercel Analytics as part of hosting/telemetry',
      'We are not affiliated with Valve Corporation or the Deadlock API project',
    ],
  },
];

export default function PrivacyPage() {
  const privacySchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy - Deadlock AfterMatch',
      description:
        'Privacy policy and data handling practices for the Deadlock AfterMatch analytics tool, including Steam ID usage and match analysis caching.',
      url: 'https://www.aftermatch.xyz/privacy',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What data does Deadlock AfterMatch collect?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'AfterMatch collects the Steam profile identifier you enter, match/account IDs required for analysis, and cached analysis results so pages load faster. It does not require passwords or payment information.',
          },
        },
        {
          '@type': 'Question',
          name: 'How can I request deletion of cached analyses?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Email contact@aftermatch.xyz or open a GitHub issue with your account ID and the match IDs you want removed.',
          },
        },
      ],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEOHead
        title="Privacy Policy"
        description="Privacy policy for Deadlock AfterMatch: what data is used to fetch and analyze matches, what is cached, and how to request deletion."
        imageUrl="/images/bg-scene.png"
        schema={privacySchema}
      />

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">
          <span className="text-deadlock-accent">Privacy</span> Policy
        </h1>
        <p className="text-deadlock-text-dim">Last updated: April 20, 2026</p>
        <p className="mt-4 text-sm text-deadlock-muted">
          TLDR: We use your Steam profile identifier to fetch match data and generate analytics. We cache analysis results
          for performance, and you can request deletion via email or GitHub.
        </p>
      </header>

      <div className="space-y-8">
        {sections.map(({ icon: Icon, title, items }) => (
          <section key={title} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-deadlock-accent/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-deadlock-accent" />
              </div>
              <h2 className="text-lg font-bold text-deadlock-text">{title}</h2>
            </div>
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-deadlock-text-dim">
                  <span className="text-deadlock-accent mt-1 shrink-0">&#8226;</span>
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
      </aside>
    </div>
  );
}

