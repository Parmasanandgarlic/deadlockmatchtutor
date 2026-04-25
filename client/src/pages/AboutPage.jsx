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
    title: 'Open Source',
    description: 'Every line of code is public on GitHub. Fork it, audit it, learn from it, and improve it.',
  },
  {
    icon: GitPullRequest,
    title: 'Community Driven',
    description: 'Bug reports, feature requests, and pull requests are welcome. This tool is built by players.',
  },
  {
    icon: Users,
    title: 'Privacy-Minded',
    description: 'No paywalls and no ads. The only input you provide is a Steam profile URL or ID to fetch match data.',
  },
  {
    icon: Heart,
    title: 'Free Forever',
    description: 'Post-match analytics should be accessible to every Deadlock player.',
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
    question: 'What is Deadlock AfterMatch?',
    answer:
      'Deadlock AfterMatch is a free, open-source Deadlock post-match analytics dashboard. It turns match data into clear grades, player dossiers, and actionable mistakes to help players improve.',
  },
  {
    question: 'Where is the source code?',
    answer: 'The source code is hosted publicly on GitHub at Parmasanandgarlic/deadlockmatchtutor.',
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
        'Deadlock AfterMatch is a free post-match analytics dashboard for Deadlock players who want match grades, reports, and performance trends.',
    },
    faqSchema(aboutFaqs),
    howToSchema(),
    speakableSchema('/about'),
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEOHead
        title="About Deadlock AfterMatch Open Source Analytics Tool"
        description="Learn what Deadlock AfterMatch is, who it serves, when it started, what problem it solves, how data works, and how to contribute."
        canonical={absoluteUrl('/about')}
        imageUrl="/images/bg-scene.png"
        schema={aboutSchema}
      />

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">
          About <span className="text-deadlock-accent">Deadlock AfterMatch</span>
        </h1>
        <p className="text-deadlock-text-dim text-lg">
          Deadlock AfterMatch is a community-built, open-source analytics tool for Deadlock players.
        </p>
        <section
          aria-label="Deadlock AfterMatch product definition"
          className="answer-block mt-4 text-sm text-deadlock-muted leading-relaxed space-y-2"
        >
          <p>Deadlock AfterMatch was founded as a public open-source project in 2026.</p>
          <p>Deadlock AfterMatch serves Deadlock players who want clearer post-match review without manual stat digging.</p>
          <p>Deadlock AfterMatch solves the problem of scattered match data by converting it into grades, dossiers, and concise coaching notes.</p>
        </section>
      </header>

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
        <h2 className="font-bold text-deadlock-text mb-4">What is Deadlock AfterMatch built with?</h2>
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
        <h2 className="font-bold text-deadlock-text mb-4">How can you contribute to Deadlock AfterMatch?</h2>
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
            Read FAQ
          </Link>
          <Link to="/updates" className="btn-secondary text-xs">
            View Updates
          </Link>
        </div>
      </section>
    </div>
  );
}
