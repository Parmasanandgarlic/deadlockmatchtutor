import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Flame, Skull, Hourglass, Compass, Search, ArrowRight, Github, Shield, History, X } from 'lucide-react';
import CompassMedallion from '../components/ui/CompassMedallion';
import { resolvePlayer } from '../api/client';
import SEOHead from '../components/seo/SEOHead';
import { toErrorMessage } from '../utils/errorMessage';
import {
  absoluteUrl,
  faqSchema,
  howToSchema,
  organizationSchema,
  speakableSchema,
  websiteSchema,
} from '../utils/seo';

const features = [
  { icon: Flame, label: 'Economy Grading', desc: 'Net worth efficiency & farm scores' },
  { icon: Hourglass, label: 'Power Spike Tracking', desc: 'Timing analysis for item & level spikes' },
  { icon: Skull, label: 'Combat & KDA', desc: 'Fight-by-fight performance grading' },
  { icon: Compass, label: 'Objective Control', desc: 'Lane & objective impact scoring' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('deadlock_search_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 3) : []);
      } catch (e) {
        setHistory([]);
      }
    }

    // Click away to close dropdown
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowHistory(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToHistory = (id) => {
    if (!id) return;
    const newHistory = [id, ...history.filter(h => h !== id)].slice(0, 3);
    setHistory(newHistory);
    localStorage.setItem('deadlock_search_history', JSON.stringify(newHistory));
  };

  const removeFromHistory = (id) => {
    const newHistory = history.filter(h => h !== id);
    setHistory(newHistory);
    localStorage.setItem('deadlock_search_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('deadlock_search_history');
    setShowHistory(false);
  };

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
      saveToHistory(input.trim());
      navigate(`/matches/${steam32}`);
    } catch (err) {
      if (err.message) {
        setError(err);
      } else {
        const fallback = new Error(typeof err === 'string' ? err : 'Could not resolve Steam ID.');
        fallback.code = 'UNKNOWN';
        setError(fallback);
      }
    } finally {
      setLoading(false);
    }
  }

  const homeFaqs = [
    {
      question: 'What is Deadlock AfterMatch?',
      answer:
        'Deadlock AfterMatch is a free, open-source post-match analytics engine for the game Deadlock. It analyzes match data to grade economy, combat, itemization, and objective control so players can improve macro decision-making.',
    },
    {
      question: 'How does Deadlock AfterMatch grade my performance?',
      answer:
        'AfterMatch analyzes match data from the Deadlock API and scores key dimensions such as net worth trajectory, KDA density, Souls/Min, and objective impact. It compares your results to personal baselines and community signals to assign a grade from F to A+.',
    },
    {
      question: 'Is Deadlock AfterMatch free to use?',
      answer: 'Yes. Deadlock AfterMatch is free to use and the code is open source on GitHub.',
    },
  ];

  const landingSchema = [
    organizationSchema(),
    websiteSchema(),
    {
      '@type': 'WebApplication',
      name: 'Deadlock AfterMatch',
      url: absoluteUrl('/'),
      operatingSystem: 'Web',
      applicationCategory: 'GameApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'Deadlock AfterMatch is a post-match analytics dashboard for Deadlock players who want economy, itemization, combat, objective, and benchmark review.',
    },
    faqSchema(homeFaqs),
    howToSchema(),
    speakableSchema('/'),
  ];

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center pt-10 pb-20 overflow-hidden">
      <SEOHead 
        title="Deadlock Match Analyzer and Player Reports | AfterMatch"
        description="Analyze Deadlock matches with post-match grades, player dossiers, item timing, combat impact, objective control, and clear mistakes."
        canonical={absoluteUrl('/')}
        imageUrl="/images/bg-scene.png"
        schema={landingSchema} 
      />
      {/* Background context (Minimal) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 bg-deadlock-bg" />

      <div className="max-w-4xl w-full px-6 flex flex-col items-center">
        {/* Themed Hero */}
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-deadlock-blue/30 bg-deadlock-blue/5 mb-8">
            <CompassMedallion className="w-4 h-4 text-deadlock-blue" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-deadlock-blue">
              Post-Match Combat Intelligence
            </span>
          </div>

          <h1 className="flex flex-col items-center text-5xl sm:text-7xl md:text-8xl font-serif font-black tracking-tighter mb-6 leading-none">
            <span className="text-white textured-text">Deadlock</span>
            <div className="sketchy-line w-full max-w-[0.9em] sm:max-w-full" />
            <span className="text-deadlock-amber textured-text">
              AfterMatch
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-deadlock-text-dim text-lg leading-relaxed mb-10">
            The high-precision analytics engine for Deadlock. 
            Identify macro-mistakes, optimize your economy, and dominate every skirmish with data-driven insights.
          </p>

        {/* Search Engine — Primary CTA */}
        <div className="w-full mb-12">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="flex shadow-2xl">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-deadlock-text-dim/50">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => history.length > 0 && setShowHistory(true)}
                  placeholder="PROCEED TO ANALYSIS (STEAM ID/URL)..."
                  className="w-full bg-deadlock-surface border border-deadlock-border text-deadlock-text placeholder-deadlock-muted h-14 pl-12 pr-4 text-sm font-bold tracking-widest focus:outline-none focus:border-deadlock-amber transition-colors"
                  disabled={loading}
                />
              
              {/* Search History Dropdown */}
              {showHistory && history.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute top-[calc(100%+8px)] left-0 right-0 bg-deadlock-bg border border-deadlock-blue/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="p-2 border-b border-deadlock-border bg-deadlock-blue/5 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-deadlock-blue uppercase tracking-widest pl-2">Recent Searches</span>
                    <button 
                      type="button"
                      onClick={clearHistory}
                      className="text-[9px] font-bold text-deadlock-text-dim/50 hover:text-deadlock-red uppercase tracking-widest px-2 py-1 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <ul>
                    {history.map((id, index) => (
                      <li key={index} className="group relative">
                        <button
                          type="button"
                          onClick={() => {
                            setInput(id);
                            setShowHistory(false);
                          }}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-deadlock-blue/10 transition-colors"
                        >
                          <History className="w-3.5 h-3.5 text-deadlock-blue/50" />
                          <span className="text-xs text-deadlock-text-dim group-hover:text-white transition-colors truncate pr-8">
                            {id}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromHistory(id);
                          }}
                          aria-label={`Remove ${id} from recent searches`}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-deadlock-text-dim/30 hover:text-deadlock-red hover:bg-deadlock-red/10 rounded transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="p-2 border-t border-deadlock-border/50 text-center">
                     <p className="text-[8px] text-deadlock-text-dim/30 italic uppercase tracking-widest">Select to analyze</p>
                  </div>
                </div>
              )}
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="relative bg-deadlock-bg border border-deadlock-amber/40 text-deadlock-amber font-bold uppercase tracking-widest px-10 h-14 flex items-center justify-center disabled:opacity-30 transition-all duration-300 hover:bg-deadlock-amber/10 hover:border-deadlock-amber hover:shadow-[0_0_20px_rgba(255,173,28,0.15)] group/btn"
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-deadlock-amber/30 border-t-deadlock-amber rounded-full" />
                ) : (
                  <div className="flex items-center gap-2.5 whitespace-nowrap">
                    <span className="text-[11px]">Analyze</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </div>
                )}
              </button>
            </div>
          </form>
          {error && (
            <div className="mt-6 p-4 bg-deadlock-red/5 border-l-4 border-deadlock-red flex flex-col gap-4 transition-all animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-deadlock-red" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[10px] font-bold text-deadlock-red uppercase tracking-widest mb-1">
                    System Exception
                  </h4>
                  <p className="text-xs text-deadlock-text-dim leading-normal font-medium italic">
                    "{toErrorMessage(error)}"
                  </p>
                </div>
              </div>
              
              <div className="border-t border-deadlock-red/10 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTechnical(!showTechnical)}
                  className="text-[9px] font-bold text-deadlock-text-dim/50 uppercase tracking-widest hover:text-deadlock-red transition-colors flex items-center gap-1"
                >
                  {showTechnical ? 'Hide' : 'View'} System Diagnostics
                </button>
                
                {showTechnical && (
                  <div className="mt-3 p-3 bg-black/40 border border-deadlock-red/20 text-[10px] font-mono leading-relaxed space-y-1 overflow-x-auto">
                    <div className="flex justify-between border-b border-white/5 pb-1 mb-1">
                      <span className="text-deadlock-red/70 uppercase">Error Code</span>
                      <span className="text-white">{String(error.errorCode || error.code || 'UNKNOWN')}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1 mb-1">
                      <span className="text-deadlock-red/70 uppercase">HTTP Status</span>
                      <span className="text-white">{String(error.status || 'N/A')}</span>
                    </div>
                    {error.details && (
                      <div className="pt-1">
                        <span className="text-deadlock-red/70 uppercase block mb-1">Raw Context</span>
                        <span className="text-deadlock-text-dim block break-all whitespace-pre-wrap">
                          {typeof error.details === 'object' ? JSON.stringify(error.details, null, 2) : String(error.details)}
                        </span>
                      </div>
                    )}
                    <div className="pt-1 opacity-50 italic">
                      Check VITE_API_BASE_URL and server CORS configuration if this persists.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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

        {/* AEO Quick Answer */}
        <section className="w-full max-w-4xl mt-20">
          <h2 className="text-2xl font-serif tracking-widest text-white mb-4 text-center uppercase">
            What is Deadlock AfterMatch?
          </h2>
          <p className="text-sm text-deadlock-text-dim leading-relaxed max-w-3xl mx-auto text-center">
            Deadlock AfterMatch is a free, open-source post-match analytics dashboard for Deadlock that turns match data into
            clear grades and actionable mistakes. Paste a Steam profile URL or Steam ID to generate match reports and player
            dossiers instantly.
          </p>
          <div className="mt-8 card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-deadlock-text-dim">
                <tr>
                  <th className="py-2 pr-4">Dimension</th>
                  <th className="py-2 pr-4">What you get</th>
                  <th className="py-2">Why it matters</th>
                </tr>
              </thead>
              <tbody className="text-deadlock-text-dim">
                <tr className="border-t border-deadlock-border">
                  <td className="py-2 pr-4 text-deadlock-text">Economy</td>
                  <td className="py-2 pr-4">Net worth efficiency, Souls/Min signals</td>
                  <td className="py-2">Detect farming vs fighting timing leaks</td>
                </tr>
                <tr className="border-t border-deadlock-border">
                  <td className="py-2 pr-4 text-deadlock-text">Combat</td>
                  <td className="py-2 pr-4">KDA density and fight impact</td>
                  <td className="py-2">Spot overextensions and low-value deaths</td>
                </tr>
                <tr className="border-t border-deadlock-border">
                  <td className="py-2 pr-4 text-deadlock-text">Itemization</td>
                  <td className="py-2 pr-4">Power spike timing</td>
                  <td className="py-2">Convert timings into win probability pressure</td>
                </tr>
                <tr className="border-t border-deadlock-border">
                  <td className="py-2 pr-4 text-deadlock-text">Objectives</td>
                  <td className="py-2 pr-4">Lane and objective impact scoring</td>
                  <td className="py-2">Catch macro rotations that lose games</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Themed Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
          <div className="card card-blue group hover:bg-deadlock-blue/5 transition-colors">
            <Flame className="w-8 h-8 text-deadlock-blue mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-serif mb-2 tracking-widest">Economy Flow</h3>
            <p className="text-xs text-deadlock-text-dim leading-relaxed">
              Track net worth efficiency and soul collection timings across the match duration.
            </p>
          </div>

          <div className="card card-amber group hover:bg-deadlock-amber/5 transition-colors">
            <Skull className="w-8 h-8 text-deadlock-amber mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-serif mb-2 tracking-widest">Combat Reach</h3>
            <p className="text-xs text-deadlock-text-dim leading-relaxed">
              Advanced KDA metrics and fight-by-fight impact scoring for every skirmish.
            </p>
          </div>

          <div className="card card-amber group hover:bg-deadlock-amber/5 transition-colors">
            <Hourglass className="w-8 h-8 text-deadlock-amber mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-serif mb-2 tracking-widest">Power Peaks</h3>
            <p className="text-xs text-deadlock-text-dim leading-relaxed">
              Identify key item and level spikes and evaluate how effectively you utilized them.
            </p>
          </div>

          <div className="card card-blue group hover:bg-deadlock-blue/5 transition-colors">
            <Compass className="w-8 h-8 text-deadlock-blue mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-serif mb-2 tracking-widest">Macro Intent</h3>
            <p className="text-xs text-deadlock-text-dim leading-relaxed">
              Objective control scoring and map impact analysis to uncover rotation mistakes.
            </p>
          </div>
        </div>

        {/* SEO / AEO Generative FAQ Section */}
        <section className="w-full max-w-4xl mt-32 border-t border-deadlock-border pt-16">
          <h2 className="text-2xl font-serif tracking-widest text-white mb-8 text-center uppercase">
            What questions do players ask about Deadlock AfterMatch?
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

        {/* Platform Info — relocated from hero section for cleaner visual hierarchy */}
        <section aria-label="Deadlock match analyzer quick answers" className="w-full max-w-4xl mt-24 pt-12 border-t border-deadlock-border/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-deadlock-border/20">
            <div className="bg-deadlock-bg p-6">
              <div className="text-[9px] font-bold text-deadlock-blue uppercase tracking-[0.2em] mb-3">What It Does</div>
              <p className="text-xs text-deadlock-text-dim/70 leading-relaxed">
                Deadlock AfterMatch is a free match analyzer for Deadlock players. Enter a Steam profile or Steam ID to
                review recent matches, generate performance grades, and see concise coaching notes for economy, combat,
                itemization, objectives, and benchmarks.
              </p>
            </div>
            <div className="bg-deadlock-bg p-6">
              <div className="text-[9px] font-bold text-deadlock-amber uppercase tracking-[0.2em] mb-3">How It Works</div>
              <p className="text-xs text-deadlock-text-dim/70 leading-relaxed">
                AfterMatch grades a Deadlock match by comparing core performance signals against useful baselines. The
                report highlights farming pace, fight impact, item timing, objective pressure, and benchmark gaps so the
                next improvement target is easy to find.
              </p>
            </div>
            <div className="bg-deadlock-bg p-6">
              <div className="text-[9px] font-bold text-deadlock-blue uppercase tracking-[0.2em] mb-3">Getting Started</div>
              <p className="text-xs text-deadlock-text-dim/70 leading-relaxed">
                Players use AfterMatch by searching a public Steam identifier, choosing a recent match, and opening a
                report. The tool does not require a site login, and shared reports can be copied from the dashboard.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-12 flex gap-6 opacity-30">
          <a href="https://github.com/Parmasanandgarlic/deadlockmatchtutor" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity" aria-label="Open Deadlock AfterMatch on GitHub"><Github /></a>
          <Link to="/about" className="text-[10px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity">About</Link>
          <Link to="/faq" className="text-[10px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity">FAQ</Link>
          <Link to="/resources" className="text-[10px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity">Tier List</Link>
          <Link to="/privacy" className="text-[10px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
