import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Crosshair, Search, ArrowRight, Github, Shield, BarChart3, Swords, Target, Zap } from 'lucide-react';
import { resolvePlayer } from '../api/client';
import usePageTitle from '../hooks/usePageTitle';

const features = [
  { icon: BarChart3, label: 'Economy Grading', desc: 'Net worth efficiency & farm scores' },
  { icon: Zap, label: 'Power Spike Tracking', desc: 'Timing analysis for item & level spikes' },
  { icon: Swords, label: 'Combat & KDA', desc: 'Fight-by-fight performance grading' },
  { icon: Target, label: 'Objective Control', desc: 'Lane & objective impact scoring' },
];

export default function LandingPage() {
  usePageTitle(null);
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const result = await resolvePlayer(input.trim());
      const steam32 = result?.steam32;
      if (!steam32) {
        throw new Error('Could not resolve Steam ID. The server may not be configured correctly.');
      }
      navigate(`/matches/${steam32}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not resolve Steam ID.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {/* Ambient glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-deadlock-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-deadlock-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center justify-center min-h-[82vh] px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-5">
            <Crosshair className="w-12 h-12 text-deadlock-accent drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              <span className="text-deadlock-accent">DEADLOCK</span>{' '}
              <span className="text-deadlock-text">AfterMatch</span>
            </h1>
          </div>
          <p className="text-deadlock-text-dim text-base sm:text-lg max-w-xl mx-auto leading-relaxed px-2 mb-4">
            Comprehensive post-match analytics. Uncover macro mistakes, grade your
            economy, itemization, combat, and objectives — then fix what matters.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://github.com/Parmasanandgarlic/deadlockmatchtutor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-deadlock-surface border border-deadlock-border text-xs text-deadlock-text-dim hover:text-deadlock-accent hover:border-deadlock-accent/50 transition-colors"
            >
              <Github className="w-3.5 h-3.5" /> Open Source
            </a>
            <Link
              to="/privacy"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-deadlock-surface border border-deadlock-border text-xs text-deadlock-text-dim hover:text-deadlock-accent hover:border-deadlock-accent/50 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" /> Privacy
            </Link>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="w-full max-w-lg mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deadlock-muted z-10" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter Steam ID, vanity name, or profile URL..."
              className="input-field pl-12 pr-32 w-full"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary flex items-center gap-2 text-sm py-2 px-3 z-10"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
              ) : (
                <>
                  Analyze <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-deadlock-red text-center">{error}</p>
          )}
        </form>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl w-full">
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="card text-center group hover:border-deadlock-accent/40 transition-colors"
            >
              <Icon className="w-6 h-6 text-deadlock-accent mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-semibold text-deadlock-text mb-1">{label}</h3>
              <p className="text-xs text-deadlock-muted leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
