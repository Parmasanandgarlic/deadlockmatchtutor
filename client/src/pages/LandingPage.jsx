import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crosshair, Search, ArrowRight } from 'lucide-react';
import { resolvePlayer } from '../api/client';

export default function LandingPage() {
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
      const { steam32 } = await resolvePlayer(input.trim());
      navigate(`/matches/${steam32}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not resolve Steam ID.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Crosshair className="w-10 h-10 text-deadlock-accent" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="text-deadlock-accent">DEADLOCK</span>{' '}
            <span className="text-deadlock-text">Analyzer</span>
          </h1>
        </div>
        <p className="text-deadlock-text-dim text-base sm:text-lg max-w-xl mx-auto leading-relaxed px-2">
          Comprehensive post-match analytics. Uncover macro mistakes, grade your
          economy, itemization, combat, and objectives — then fix what matters.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="w-full max-w-lg mb-8">
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

      {/* Feature Pills */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-2xl">
        {['Economy Grading', 'Power Spike Tracking', 'Teamfight Analysis', 'Objective Control', 'Insight Cards'].map(
          (feature) => (
            <span
              key={feature}
              className="px-3 sm:px-4 py-1.5 rounded-full bg-deadlock-surface border border-deadlock-border text-xs sm:text-sm text-deadlock-text-dim whitespace-nowrap"
            >
              {feature}
            </span>
          )
        )}
      </div>
    </div>
  );
}
