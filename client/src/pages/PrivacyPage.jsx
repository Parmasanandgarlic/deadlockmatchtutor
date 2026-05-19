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
    title: 'What intelligence does the Commission collect?',
    items: [
      'The Steam ID, vanity name, or profile URL you provide to identify an operative',
      'Ritual IDs and operative IDs associated with dossier compilations you request',
      'Cached dossier results stored in the Commission\'s secure archives',
    ],
  },
  {
    icon: Database,
    title: 'How is requisitioned data deployed?',
    items: [
      'To resolve your operative identity and intercept Ritual telemetry from the Cursed Apple',
      'To compile post-Ritual dossiers grading soul harvest, combat, and occult arsenal deployment',
      'To cache compiled dossiers so field reports load without recompilation',
    ],
  },
  {
    icon: Lock,
    title: 'How are dossier archives secured?',
    items: [
      'Dossier caches are stored with row-level security in the Commission\'s classified archives',
      'No passwords, payment information, or private Steam credentials are stored',
      'All intelligence traffic is encrypted via HTTPS',
      'We do not sell, share, or transfer operative data to third parties',
    ],
  },
  {
    icon: Trash2,
    title: 'Data retention and purge procedures',
    items: [
      'Cached dossiers are retained for operational efficiency and contain Ritual statistics tied to an operative ID',
      'You may request purging of cached dossiers by contacting the dead drop at contact@aftermatch.xyz or filing a GitHub issue',
      'Steam IDs are used only to resolve and intercept the data needed for dossier compilation',
    ],
  },
  {
    icon: Shield,
    title: 'Third-party intelligence channels',
    items: [
      'Ritual data is sourced from the community-run Deadlock API',
      'Steam vanity resolution uses Steam\'s public profile endpoints',
      'Site telemetry may be provided by Vercel Analytics as part of hosting infrastructure',
      'The OSIC Dossier System is not affiliated with Valve Corporation or the Deadlock API project',
    ],
  },
];

const privacyFaqs = [
  {
    question: 'What intelligence does the OSIC Dossier System collect?',
    answer:
      'The system requisitions the Steam profile identifier you provide, Ritual and operative IDs required for dossier compilation, and cached analysis results for rapid report generation. No passwords or payment information are collected.',
  },
  {
    question: 'How can I request purging of cached dossiers?',
    answer:
      'Contact the dead drop at contact@aftermatch.xyz or open a GitHub issue with your operative ID and the Ritual IDs you want purged from the archives.',
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
        title="OSIC Clearance Protocol | Deadlock AfterMatch Data Policy"
        description="The OSIC's data clearance protocol: operative identification, Ritual telemetry caching, dossier archival, purge procedures, and third-party intelligence channels."
        canonical={absoluteUrl('/privacy')}
        imageUrl="/images/og-share.png"
        schema={privacySchema}
      />

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">
          <span className="text-deadlock-accent">OSIC</span> Clearance Protocol
        </h1>
        <p className="text-deadlock-text-dim">Last updated: April 24, 2026</p>
        <section aria-label="Privacy summary" className="answer-block mt-4 text-sm text-deadlock-muted leading-relaxed space-y-2">
          <p>The OSIC Dossier System requisitions your Steam profile identifier to intercept Ritual data and compile field reports.</p>
          <p>The Commission does not request Steam passwords, payment information, or private credentials.</p>
          <p>Compiled dossiers are cached for operational efficiency and can be purged by request via the dead drop or GitHub.</p>
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
            Read Briefing Notes
          </Link>
          <Link to="/about" className="btn-secondary text-xs">
            Commission Archives
          </Link>
        </div>
      </aside>
    </div>
  );
}
