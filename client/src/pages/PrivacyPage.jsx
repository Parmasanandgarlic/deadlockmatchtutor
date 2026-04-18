import { Shield, Database, Eye, Lock, Trash2 } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';

const sections = [
  {
    icon: Eye,
    title: 'What We Collect',
    items: [
      'Steam ID, vanity name, or profile URL you enter to look up a player',
      'Match IDs and account IDs associated with analyses you request',
      'Cached analysis results (match performance data) stored in Supabase',
    ],
  },
  {
    icon: Database,
    title: 'How We Use Data',
    items: [
      'To resolve your Steam identity and fetch match history from the Deadlock API',
      'To compute post-match analytics (economy, combat, itemization grades)',
      'To cache analysis results so you and others can view them without re-computing',
    ],
  },
  {
    icon: Lock,
    title: 'Data Storage & Security',
    items: [
      'Analysis caches are stored in Supabase (PostgreSQL) with row-level security',
      'No passwords, payment info, or personal identification beyond Steam IDs are stored',
      'All API traffic is encrypted via HTTPS',
      'We do not sell, share, or transfer your data to third parties',
    ],
  },
  {
    icon: Trash2,
    title: 'Data Retention & Deletion',
    items: [
      'Cached analyses are retained indefinitely for performance but contain no personal data beyond match statistics',
      'You may request deletion of cached analyses associated with your account ID by opening an issue on our GitHub repository',
      'Steam IDs are not stored independently — they are used only in transit for API resolution',
    ],
  },
  {
    icon: Shield,
    title: 'Third-Party Services',
    items: [
      'Match data is sourced from the community-run Deadlock API (deadlock-api.com)',
      'Steam vanity resolution uses Steam\'s public XML profile endpoint — no Steam API key is required',
      'We are not affiliated with Valve Corporation or the Deadlock API project',
    ],
  },
];

export default function PrivacyPage() {
  const privacySchema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Privacy Policy - Deadlock AfterMatch",
      "description": "Privacy policy and data handling practices for the Deadlock AfterMatch analytics tool. Learn how we handle your Steam ID and match data."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEOHead 
        title="Privacy Policy"
        description="Privacy policy and data handling practices for the Deadlock AfterMatch analytics tool. Learn how we handle your Steam ID and match data."
        schema={privacySchema}
      />
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">
          <span className="text-deadlock-accent">Privacy</span> Policy
        </h1>
        <p className="text-deadlock-text-dim">Last updated: April 2026</p>
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
          This project is open source. If you have questions or concerns about data practices,
          please open an issue on{' '}
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
