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
    answer: 'Deadlock AfterMatch is a free post-match analytics dashboard for Deadlock players. It turns match data into grades, trends, and concise coaching notes.',
  },
  {
    question: 'How is MMR calculated in Deadlock?',
    answer: 'Deadlock uses a hidden MMR (Matchmaking Rating) system. AfterMatch predicts your rank tier by analyzing the average badge of players in your lobbies, providing a longitudinal rank-predict timeline.',
  },
  {
    question: 'What is a good souls per minute (SPM) in Deadlock?',
    answer: 'A strong SPM in Deadlock typically exceeds 1000 by the mid-game, though it varies heavily by hero. AfterMatch compares your SPM against community benchmarks to grade your economy efficiency.',
  },
  {
    question: 'How do I analyze my item build?',
    answer: 'The Itemization Module in AfterMatch breaks down your power spikes. It shows exactly when you purchased Tier 1, 2, 3, and 4 items, and highlights if your build was too delayed compared to the lobby.',
  },
  {
    question: 'What does objective pressure mean?',
    answer: 'Objective pressure measures your impact on towers, walkers, base guardians, and shrines. High objective pressure means you effectively converted combat wins into map control.',
  },
  {
    question: 'Who is Deadlock AfterMatch for?',
    answer: 'It is for players who want to understand why a match went well or poorly, especially those reviewing farming, combat, item timing, and objective choices to improve their macro gameplay.',
  },
  {
    question: 'How do I analyze a Deadlock match?',
    answer: 'Enter a Steam profile URL, vanity name, Steam64 ID, or Steam32 account ID on the home page. Then open a recent match to generate the AfterMatch report.',
  },
  {
    question: 'What does the match grade measure?',
    answer: 'The match grade summarizes economy, combat, itemization, objectives, and benchmarks. It is meant to show whether your decisions created useful pressure in that match.',
  },
  {
    question: 'Does Deadlock AfterMatch require a login?',
    answer: 'No. Deadlock AfterMatch does not require a site account or password. You only provide a public Steam identifier so the tool can find match data.',
  },
  {
    question: 'Is Deadlock AfterMatch free?',
    answer: 'Yes. Deadlock AfterMatch is free to use and the source code is public on GitHub.',
  },
  {
    question: 'Where does match data come from?',
    answer: 'Deadlock AfterMatch uses community Deadlock API data and public Steam profile resolution. It is not affiliated with Valve Corporation.',
  },
  {
    question: 'Can I share a report?',
    answer: 'Yes. Generated reports can be shared from the match dashboard with a report URL. Shared reports show the cached analysis for that match and account.',
  },
  {
    question: 'What data is stored?',
    answer: 'AfterMatch caches account IDs, match IDs, and generated analysis results to speed up future requests. It does not store passwords, payment data, or private Steam credentials.',
  },
  {
    question: 'How can I request data deletion?',
    answer: 'Email contact@aftermatch.xyz or open a GitHub issue with the account ID and match IDs you want reviewed for removal.',
  },
  {
    question: 'Why is my match not showing up?',
    answer: 'Matches may take up to 30 minutes to appear in the API after completion. Additionally, custom games, bot matches, or matches abandoned early may not be recorded.',
  },
  {
    question: 'What is KDA Density?',
    answer: 'KDA Density evaluates how concentrated your kills, deaths, and assists are relative to the match duration. A high density means you were constantly involved in high-impact fights.',
  },
  {
    question: 'How do I find my Steam32 account ID?',
    answer: 'You can find your Steam32 ID by looking at your Steam friend code, or by using a Steam ID lookup tool online. Alternatively, just paste your full Steam Profile URL into AfterMatch.',
  },
  {
    question: 'Does AfterMatch track hero specific stats?',
    answer: 'Yes! The Player Profile page aggregates your performance across different heroes, showing your win rate, average KDA, and average souls per game for your most played characters.',
  },
  {
    question: 'Why did I get a bad grade even though I won?',
    answer: 'AfterMatch grades your individual macro-performance. If you won but had poor farming efficiency, high isolated deaths, and low objective damage, your grade will reflect those improvement areas.',
  },
  {
    question: 'Is there a Deadlock AfterMatch mobile app?',
    answer: 'While there is no dedicated mobile app, the AfterMatch website is fully responsive and functions as a Progressive Web App (PWA), meaning you can install it directly to your phone\'s home screen.',
  },
  {
    question: 'How often are community benchmarks updated?',
    answer: 'Benchmarks for hero performance, SPM, and KDA are dynamically recalculated as new matches are processed, ensuring they accurately reflect the current meta and patch version.',
  },
  {
    question: 'Can I see the build orders of top players?',
    answer: 'By searching for top-ranked players or streamers, you can view their match reports and inspect their precise item progression timelines to learn their build strategies.',
  }
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
        imageUrl="/images/og-share.png"
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
