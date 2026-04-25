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

const faqs = [
  {
    question: 'What is Deadlock AfterMatch?',
    answer:
      'Deadlock AfterMatch is a free post-match analytics dashboard for Deadlock players. It turns match data into grades, trends, and concise coaching notes.',
  },
  {
    question: 'Who is Deadlock AfterMatch for?',
    answer:
      'Deadlock AfterMatch is for players who want to understand why a match went well or poorly. It is especially useful for players reviewing farming, combat, item timing, and objective choices.',
  },
  {
    question: 'How do I analyze a Deadlock match?',
    answer:
      'Enter a Steam profile URL, vanity name, Steam64 ID, or Steam32 account ID on the home page. Then open a recent match and generate the AfterMatch report.',
  },
  {
    question: 'What does the match grade measure?',
    answer:
      'The match grade summarizes economy, combat, itemization, objectives, and benchmarks. It is meant to show whether your decisions created useful pressure in that match.',
  },
  {
    question: 'Does Deadlock AfterMatch require a login?',
    answer:
      'No. Deadlock AfterMatch does not require a site account or password. You only provide a public Steam identifier so the tool can find match data.',
  },
  {
    question: 'Is Deadlock AfterMatch free?',
    answer:
      'Yes. Deadlock AfterMatch is free to use and the source code is public on GitHub.',
  },
  {
    question: 'Where does match data come from?',
    answer:
      'Deadlock AfterMatch uses community Deadlock API data and public Steam profile resolution. It is not affiliated with Valve Corporation.',
  },
  {
    question: 'Can I share a report?',
    answer:
      'Yes. Generated reports can be shared from the match dashboard with a report URL. Shared reports show the cached analysis for that match and account.',
  },
  {
    question: 'What data is stored?',
    answer:
      'AfterMatch may cache account IDs, match IDs, and generated analysis results. It does not store passwords, payment data, or private Steam credentials.',
  },
  {
    question: 'How can I request data deletion?',
    answer:
      'Email contact@aftermatch.xyz or open a GitHub issue with the account ID and match IDs you want reviewed for removal.',
  },
];

const queryTargets = [
  {
    title: 'What does Deadlock AfterMatch do?',
    text:
      'Deadlock AfterMatch analyzes Deadlock match data and converts it into a clear post-match report. The report grades economy, combat, itemization, objective pressure, and benchmark performance so players can quickly identify the decisions that most affected a match.',
  },
  {
    title: 'How do you start a Deadlock match review?',
    text:
      'Start a Deadlock match review by entering a Steam profile URL, vanity name, Steam64 ID, or Steam32 account ID. AfterMatch resolves the player, loads recent matches, and opens a report with grades, recommendations, and performance trends.',
  },
  {
    title: 'Is Deadlock AfterMatch safe to use?',
    text:
      'Deadlock AfterMatch does not ask for Steam passwords or payment information. It only uses public Steam identifiers and match data needed to produce analytics, and cached analysis results can be removed by request.',
  },
];

export default function FaqPage() {
  const schema = [
    organizationSchema(),
    websiteSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'FAQ', path: '/faq' },
    ]),
    faqSchema(faqs),
    speakableSchema('/faq'),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SEOHead
        title="Deadlock AfterMatch FAQ and Match Analysis Help Center"
        description="Answers about Deadlock AfterMatch match analysis, Steam ID lookup, data privacy, report sharing, grading, and open-source access."
        canonical={absoluteUrl('/faq')}
        imageUrl="/images/bg-scene.png"
        schema={schema}
      />

      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-deadlock-amber mb-3">
          Player Help
        </p>
        <h1 className="text-3xl font-extrabold mb-4">Deadlock AfterMatch FAQ</h1>
        <p className="answer-block text-deadlock-text-dim text-base leading-relaxed max-w-3xl">
          Deadlock AfterMatch is a free post-match analytics dashboard for Deadlock players. It helps players review
          economy, combat, itemization, objective decisions, and performance trends without requiring a login.
        </p>
      </header>

      <section aria-label="Featured answers" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {queryTargets.map((item) => (
          <article key={item.title} className="card">
            <h2 className="text-sm font-bold text-deadlock-accent mb-3">{item.title}</h2>
            <p className="answer-block text-sm text-deadlock-text-dim leading-relaxed">{item.text}</p>
          </article>
        ))}
      </section>

      <section aria-label="Frequently asked questions" className="space-y-4">
        {faqs.map(({ question, answer }) => (
          <article key={question} className="card">
            <h2 className="text-base font-bold text-deadlock-text mb-3">{question}</h2>
            <p className="text-sm text-deadlock-text-dim leading-relaxed">{answer}</p>
          </article>
        ))}
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/" className="btn-primary">
          Analyze a Match
        </Link>
        <Link to="/privacy" className="btn-secondary">
          Review Privacy
        </Link>
      </div>
    </div>
  );
}
