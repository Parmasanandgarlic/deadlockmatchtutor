import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Crosshair, Search, ArrowRight, Github, Shield, BarChart3, Swords, Target, Zap } from 'lucide-react';
import { resolvePlayer } from '../api/client';
import SEOHead from '../components/seo/SEOHead';

const features = [
  { icon: BarChart3, label: 'Economy Grading', desc: 'Net worth efficiency & farm scores' },
  { icon: Zap, label: 'Power Spike Tracking', desc: 'Timing analysis for item & level spikes' },
  { icon: Swords, label: 'Combat & KDA', desc: 'Fight-by-fight performance grading' },
  { icon: Target, label: 'Objective Control', desc: 'Lane & objective impact scoring' },
];

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
      const result = await resolvePlayer(input.trim());
      const steam32 = result?.steam32;
      if (!steam32) {
        throw new Error('Could not resolve Steam ID. The server may not be configured correctly.');
      }
      navigate(`/matches/${steam32}`);
    } catch (err) {
      setError(err.message || 'Could not resolve Steam ID.');
    } finally {
      setLoading(false);
    }
  }

  const landingSchema = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Deadlock AfterMatch",
      "url": "https://aftermatch.xyz",
      "description": "Free, open-source post-match analytics for Deadlock."
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Deadlock AfterMatch?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Deadlock AfterMatch is a free, open-source post-match analytics engine for the game Deadlock. It provides high-precision data on your economy, combat performance, itemization efficiency, and objective control to help players improve their macro-decisions."
          }
        },
        {
          "@type": "Question",
          "name": "How does Deadlock AfterMatch grade my performance?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The platform analyzes your match data from the Deadlock API. It compares your Net Worth, KDA, and Souls/Min against your career hero averages and general community baselines, assigning an objective graded score from F to A+."
          }
        },
        {
          "@type": "Question",
          "name": "Is Deadlock AfterMatch free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, Deadlock AfterMatch is entirely free and open-source."
          }
        }
      ]
    }
  ];

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center pt-10 pb-20 overflow-hidden">
      <SEOHead 
        title={null} 
        schema={landingSchema} 
      />
      {/* Dynamic Brand Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-deadlock-blue/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-deadlock-amber/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-deadlock-border to-transparent opacity-50" />
      </div>

      <div className="max-w-4xl w-full px-6 flex flex-col items-center">
        {/* Themed Hero */}
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-deadlock-blue/30 bg-deadlock-blue/5 mb-8 animate-pulse-slow">
            <Target className="w-4 h-4 text-deadlock-blue" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-deadlock-blue">
              Post-Match Combat Intelligence
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-black tracking-tighter mb-6 leading-none">
            <span className="block text-white">Deadlock</span>
            <span className="block text-deadlock-amber drop-shadow-[0_0_15px_rgba(255,173,28,0.3)]">
              AfterMatch
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-deadlock-text-dim text-lg leading-relaxed mb-8">
            The high-precision analytics engine for Deadlock. 
            Identify macro-mistakes, optimize your economy, and dominate every skirmish with data-driven insights.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-deadlock-blue">
              <span className="w-8 h-px bg-deadlock-blue" />
              Analyze
            </div>
            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-deadlock-amber">
              Improve
              <span className="w-8 h-px bg-deadlock-amber" />
            </div>
          </div>
        </div>

        {/* Search Engine */}
        <div className="w-full max-w-xl mb-24">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-deadlock-blue/20 to-deadlock-amber/20 opacity-30 group-focus-within:opacity-100 transition-opacity blur-lg" />
            
            <div className="relative flex">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-deadlock-text-dim/50">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="PROCEED TO ANALYSIS (STEAM ID/URL)..."
                className="input-field pl-12 pr-40 text-sm font-bold tracking-widest"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-1 top-1 bottom-1 btn-primary px-6"
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black" />
                ) : (
                  <div className="flex items-center gap-2">
                    START <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </div>
          </form>
          {error && (
            <div className="mt-6 p-4 bg-deadlock-red/5 border-l-4 border-deadlock-red flex gap-4 transition-all animate-in fade-in slide-in-from-top-2">
              <div className="shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-deadlock-red" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-deadlock-red uppercase tracking-widest mb-1">
                  System Exception
                </h4>
                <p className="text-xs text-deadlock-text-dim leading-normal font-medium italic">
                  "{error}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Themed Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
          <div className="card card-blue group hover:bg-deadlock-blue/5 transition-colors">
            <BarChart3 className="w-8 h-8 text-deadlock-blue mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-serif mb-2 tracking-widest">Economy Flow</h3>
            <p className="text-xs text-deadlock-text-dim leading-relaxed">
              Track net worth efficiency and soul collection timings across the match duration.
            </p>
          </div>

          <div className="card card-amber group hover:bg-deadlock-amber/5 transition-colors">
            <Swords className="w-8 h-8 text-deadlock-amber mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-serif mb-2 tracking-widest">Combat Reach</h3>
            <p className="text-xs text-deadlock-text-dim leading-relaxed">
              Advanced KDA metrics and fight-by-fight impact scoring for every skirmish.
            </p>
          </div>

          <div className="card card-amber group hover:bg-deadlock-amber/5 transition-colors">
            <Zap className="w-8 h-8 text-deadlock-amber mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-serif mb-2 tracking-widest">Power Peaks</h3>
            <p className="text-xs text-deadlock-text-dim leading-relaxed">
              Identify key item and level spikes and evaluate how effectively you utilized them.
            </p>
          </div>

          <div className="card card-blue group hover:bg-deadlock-blue/5 transition-colors">
            <Crosshair className="w-8 h-8 text-deadlock-blue mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-serif mb-2 tracking-widest">Macro Intent</h3>
            <p className="text-xs text-deadlock-text-dim leading-relaxed">
              Objective control scoring and map impact analysis to uncover rotation mistakes.
            </p>
          </div>
        </div>

        {/* SEO / AEO Generative FAQ Section */}
        <section className="w-full max-w-4xl mt-32 border-t border-deadlock-border pt-16">
          <h2 className="text-2xl font-serif tracking-widest text-white mb-8 text-center uppercase">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 gap-6">
            <article className="bg-deadlock-bg border border-deadlock-border p-6 hover:border-deadlock-blue/30 transition-colors">
              <h3 className="text-sm font-bold text-deadlock-blue uppercase tracking-widest mb-3">
                What is Deadlock AfterMatch?
              </h3>
              <p className="text-sm text-deadlock-text-dim leading-relaxed">
                Deadlock AfterMatch is a free, open-source post-match analytics engine for the game Deadlock. 
                It provides high-precision data on your economy, combat performance, itemization efficiency, 
                and objective control to help players improve their macro-decisions.
              </p>
            </article>

            <article className="bg-deadlock-bg border border-deadlock-border p-6 hover:border-deadlock-amber/30 transition-colors">
              <h3 className="text-sm font-bold text-deadlock-amber uppercase tracking-widest mb-3">
                How does the grading system work?
              </h3>
              <p className="text-sm text-deadlock-text-dim leading-relaxed">
                The platform securely analyzes your match performance via the Deadlock API. It calculates 
                your Net Worth trajectory, KDA density, and Souls per Minute, comparing them directly against 
                both your personal career averages and broad community baselines to assign an objective 
                post-match grade ranging from F to A+.
              </p>
            </article>
          </div>
        </section>

        <div className="mt-20 flex gap-6 opacity-30">
          <a href="https://github.com/Parmasanandgarlic/deadlockmatchtutor" target="_blank" className="hover:opacity-100 transition-opacity"><Github /></a>
          <Link to="/about" className="text-[10px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity">Repository</Link>
          <Link to="/privacy" className="text-[10px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
