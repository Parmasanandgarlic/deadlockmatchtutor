import { Github, GitPullRequest, Code2, Users, Heart, ExternalLink } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const values = [
  {
    icon: Code2,
    title: 'Open Source',
    description: 'Every line of code is public on GitHub. Fork it, audit it, learn from it — no black boxes.',
  },
  {
    icon: GitPullRequest,
    title: 'Community Driven',
    description: 'Bug reports, feature requests, and pull requests are welcome. This tool is built by players, for players.',
  },
  {
    icon: Users,
    title: 'Transparent',
    description: 'No hidden data collection, no analytics tracking, no ads. Your Steam ID is used only to fetch your matches.',
  },
  {
    icon: Heart,
    title: 'Free Forever',
    description: 'No paywalls, no premium tiers. Post-match analytics should be accessible to every Deadlock player.',
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

export default function AboutPage() {
  usePageTitle('About · Open Source');
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2">
        <span className="text-deadlock-accent">Open</span> Source
      </h1>
      <p className="text-deadlock-text-dim text-lg mb-8">
        Deadlock AfterMatch is a community-built, open-source project. Anyone can contribute.
      </p>

      {/* GitHub CTA */}
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

      {/* Values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {values.map(({ icon: Icon, title, description }) => (
          <div key={title} className="card">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-5 h-5 text-deadlock-accent" />
              <h3 className="font-bold text-deadlock-text">{title}</h3>
            </div>
            <p className="text-sm text-deadlock-text-dim leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      {/* Tech Stack */}
      <div className="card mb-8">
        <h2 className="font-bold text-deadlock-text mb-4">Tech Stack</h2>
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
      </div>

      {/* How to Contribute */}
      <div className="card">
        <h2 className="font-bold text-deadlock-text mb-4">How to Contribute</h2>
        <ol className="space-y-3 text-sm text-deadlock-text-dim">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-deadlock-accent/15 text-deadlock-accent text-xs font-bold flex items-center justify-center shrink-0">1</span>
            <span>Fork the repository on GitHub</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-deadlock-accent/15 text-deadlock-accent text-xs font-bold flex items-center justify-center shrink-0">2</span>
            <span>Create a feature branch (<code className="font-mono text-deadlock-accent">git checkout -b feature/your-idea</code>)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-deadlock-accent/15 text-deadlock-accent text-xs font-bold flex items-center justify-center shrink-0">3</span>
            <span>Make your changes and commit with clear messages</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-deadlock-accent/15 text-deadlock-accent text-xs font-bold flex items-center justify-center shrink-0">4</span>
            <span>Open a Pull Request describing what you changed and why</span>
          </li>
        </ol>
        <p className="mt-4 text-sm text-deadlock-muted">
          Even small contributions — typo fixes, documentation improvements, or bug reports — are valuable.
        </p>
      </div>
    </div>
  );
}
