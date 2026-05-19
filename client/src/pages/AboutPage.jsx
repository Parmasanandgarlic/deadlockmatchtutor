import { Github, GitPullRequest, Code2, Users, Heart, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';
import {
  absoluteUrl,
  breadcrumbSchema,
  faqSchema,
  howToSchema,
  organizationSchema,
  speakableSchema,
  websiteSchema,
} from '../utils/seo';

const values = [
  {
    icon: Code2,
    title: 'Declassified',
    description: 'Every line of code is public on GitHub. The OSIC\'s civilian transparency initiative — fork it, audit it, improve it.',
  },
  {
    icon: GitPullRequest,
    title: 'Multi-Division',
    description: 'Sandmen care about people. Curators care about things. This system cares about both. Contributions welcome.',
  },
  {
    icon: Users,
    title: 'Clearance-Minimal',
    description: 'No credentials harvested. Your Steam profile is the only artifact we requisition to compile a dossier.',
  },
  {
    icon: Heart,
    title: 'Commission-Funded',
    description: 'Ritual intelligence should be accessible to every operative in the Cursed Apple. Free forever.',
  },
];

const techStack = [
  { name: 'React 18', category: 'Frontend' },
  { name: 'Vite', category: 'Build' },
  { name: 'Tailwind CSS', category: 'Styling' },
  { name: 'Express', category: 'Backend' },
  { name: 'Supabase', category: 'Database' },
  { name: 'Deadlock API', category: 'Data Source' },
];

const aboutFaqs = [
  {
    question: 'What is the OSIC Dossier System?',
    answer:
      'The OSIC Dossier System is the Occult Security and Investigation Commission\'s declassified post-Ritual analytics engine. It intercepts Ritual telemetry from the Cursed Apple and compiles classified field reports to help operatives improve.',
  },
  {
    question: 'Where are the Commission Archives?',
    answer: 'The full source code is declassified and hosted publicly on GitHub at Parmasanandgarlic/deadlockmatchtutor.',
  },
];

export default function AboutPage() {
  const aboutSchema = [
    organizationSchema(),
    websiteSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'About', path: '/about' },
    ]),
    {
      '@type': 'SoftwareApplication',
      name: 'Deadlock AfterMatch',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      url: absoluteUrl('/'),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'The OSIC Dossier System is a declassified post-Ritual analytics engine for Deadlock operatives — field reports, combat dossiers, and performance intelligence from the Cursed Apple.',
    },
    faqSchema(aboutFaqs),
    howToSchema(),
    speakableSchema('/about'),
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEOHead
        title="About the OSIC Dossier System | Deadlock AfterMatch"
        description="Learn about the Occult Security and Investigation Commission's declassified post-Ritual analytics engine — who built it, how it works, and how to contribute to the Commission Archives."
        canonical={absoluteUrl('/about')}
        imageUrl="/images/og-share.png"
        schema={aboutSchema}
      />

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">
          About the <span className="text-deadlock-accent">OSIC Dossier System</span>
        </h1>
        <p className="text-deadlock-text-dim text-lg">
          The Occult Security and Investigation Commission's declassified post-Ritual analytics division.
        </p>
        <div className="mt-2 text-sm text-deadlock-accent font-medium">
          Compiled by: Sandman Division, Curator Division, & civilian analysts
        </div>
        <section
          aria-label="Deadlock AfterMatch product definition"
          className="answer-block mt-4 text-sm text-deadlock-muted leading-relaxed space-y-2"
        >
          <p>Established in the wake of the first Maelstrom, when Astral Gates tore open across the Earth and the supernatural could no longer be denied.</p>
          <p>The OSIC Dossier System serves operatives fighting in the Ritual — the supernatural battle in the streets of the Cursed Apple where two Patrons vie for summoning.</p>
          <p>It solves the problem of scattered Ritual telemetry by converting raw combat data into classified grades, operative dossiers, and tactical directives.</p>
        </section>
      </header>

      <section aria-label="Methodology Documentation" className="card mb-8">
        <h2 className="font-bold text-deadlock-text mb-4 text-xl">Assessment Methodology — OSIC Standard Protocol</h2>
        <p className="text-sm text-deadlock-text-dim leading-relaxed mb-4">
          The Sandman Division employs a four-axis assessment protocol, dynamically calibrated for Ritual conditions and operative specialization:
        </p>
        <ul className="space-y-3 text-sm text-deadlock-text-dim list-disc pl-5">
          <li>
            <strong className="text-deadlock-text">Soul Harvest (Economy):</strong> We measure Souls Per Minute at the 10, 15, and 20-minute marks of each Ritual engagement, flagging operatives whose harvest rate collapsed during mid-Ritual combat phases.
          </li>
          <li>
            <strong className="text-deadlock-text">Kill Ledger (Combat):</strong> Beyond raw KDA, we measure elimination density — fight participation relative to Ritual duration — and isolate deaths that fed the enemy's Patron summoning progress.
          </li>
          <li>
            <strong className="text-deadlock-text">Occult Arsenal (Itemization):</strong> We analyze spirit weapon acquisition timestamps. If your Tier 3 armament is delayed by more than 4 minutes compared to the Ritual average, your classification is impacted.
          </li>
          <li>
            <strong className="text-deadlock-text">Ritual Pressure (Objectives):</strong> Damage to Guardians, Walkers, and Patron approach vectors is weighted heavily. Winning fights without converting them into objective pressure is treated as a missed opportunity.
          </li>
        </ul>
      </section>

      <a
        href="https://github.com/Parmasanandgarlic/deadlockmatchtutor"
        target="_blank"
        rel="noopener noreferrer"
        className="card flex items-center gap-4 mb-8 group hover:border-deadlock-accent/50 transition-colors"
      >
        <div className="w-12 h-12 rounded-xl bg-deadlock-accent/10 flex items-center justify-center shrink-0">
          <Github className="w-6 h-6 text-deadlock-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-deadlock-text group-hover:text-deadlock-accent transition-colors">
            Parmasanandgarlic/deadlockmatchtutor
          </h2>
          <p className="text-sm text-deadlock-text-dim">View source, report bugs, or submit pull requests</p>
        </div>
        <ExternalLink className="w-5 h-5 text-deadlock-muted group-hover:text-deadlock-accent transition-colors shrink-0" />
      </a>

      <section aria-label="Project values" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {values.map(({ icon: Icon, title, description }) => (
          <article key={title} className="card">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-5 h-5 text-deadlock-accent" />
              <h2 className="font-bold text-deadlock-text text-base">{title}</h2>
            </div>
            <p className="text-sm text-deadlock-text-dim leading-relaxed">{description}</p>
          </article>
        ))}
      </section>

      <section aria-label="Technology stack" className="card mb-8">
        <h2 className="font-bold text-deadlock-text mb-4">What occult technologies power the Dossier System?</h2>
        <div className="flex flex-wrap gap-2">
          {techStack.map(({ name, category }) => (
            <span
              key={name}
              className="px-3 py-1.5 rounded-lg bg-deadlock-bg border border-deadlock-border text-sm"
            >
              <span className="text-deadlock-text-dim text-xs mr-1">{category}</span>
              <span className="text-deadlock-text font-medium">{name}</span>
            </span>
          ))}
        </div>
      </section>

      <section aria-label="How to contribute" className="card">
        <h2 className="font-bold text-deadlock-text mb-4">How can you contribute to the Commission Archives?</h2>
        <ol className="space-y-3 text-sm text-deadlock-text-dim">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-deadlock-accent/15 text-deadlock-accent text-xs font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <span>Fork the repository on GitHub</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-deadlock-accent/15 text-deadlock-accent text-xs font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <span>
              Create a feature branch (
              <code className="font-mono text-deadlock-accent">git checkout -b feature/your-idea</code>)
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-deadlock-accent/15 text-deadlock-accent text-xs font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <span>Make your changes and commit with clear messages</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-deadlock-accent/15 text-deadlock-accent text-xs font-bold flex items-center justify-center shrink-0">
              4
            </span>
            <span>Open a Pull Request describing what you changed and why</span>
          </li>
        </ol>
        <p className="mt-4 text-sm text-deadlock-muted">
          Even small contributions, such as typo fixes, documentation improvements, or bug reports, are valuable.
        </p>
        <p className="mt-4 text-sm text-deadlock-muted">
          For questions or concerns, email us at{' '}
          <a href="mailto:contact@aftermatch.xyz" className="text-deadlock-accent hover:underline">
            contact@aftermatch.xyz
          </a>
          .
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/faq" className="btn-secondary text-xs">
            Read Briefing Notes
          </Link>

        </div>
      </section>
    </div>
  );
}
