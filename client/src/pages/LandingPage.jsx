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
  videoGameSchema,
  websiteSchema,
} from '../utils/seo';

const features = [
  { icon: Flame, label: 'Soul Harvest', desc: 'Soul acquisition rates & economy yield from the Ritual' },
  { icon: Hourglass, label: 'Occult Arsenal', desc: 'Spirit weapon deployment timing & loadout assessment' },
  { icon: Skull, label: 'Kill Ledger', desc: 'OSIC-filed combat record & elimination accounting' },
  { icon: Compass, label: 'Ritual Pressure', desc: 'Objective damage toward Guardians, Walkers & the Patron' },
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
      question: 'What is the OSIC Dossier System?',
      answer:
        'The OSIC Dossier System is the Occult Security and Investigation Commission\'s declassified post-Ritual analytics engine. It intercepts match telemetry from the Cursed Apple and compiles classified field reports grading soul harvest, combat effectiveness, occult arsenal deployment, and Ritual pressure.',
    },
    {
      question: 'How does the OSIC grade Ritual performance?',
      answer:
        'The Sandman Division analyzes Ritual telemetry and scores key dimensions — soul acquisition trajectory, kill ledger density, spirit weapon timing, and objective pressure against Guardians and Walkers. Your performance is compared against Cursed Apple field benchmarks to assign a grade from F to A+.',
    },
    {
      question: 'Is the dossier system free to access?',
      answer: 'Yes. The OSIC\'s civilian transparency initiative makes this intelligence fully declassified and open source.',
    },
  ];

  const landingSchema = [
    organizationSchema(),
    websiteSchema(),
    videoGameSchema(),
    {
      '@type': 'WebApplication',
      name: 'Deadlock AfterMatch',
      url: absoluteUrl('/'),
      operatingSystem: 'Web',
      applicationCategory: 'GameApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description:
        'The OSIC Dossier System provides post-Ritual intelligence from the Cursed Apple — soul harvest, occult arsenal, combat ledger, and Ritual pressure assessment for every operative.',
    },
    faqSchema(homeFaqs),
    howToSchema(),
    speakableSchema('/'),
  ];

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center pt-10 pb-20 overflow-hidden">
      <SEOHead 
        title="Deadlock Match Analyzer and Player Reports | AfterMatch"
        description="Free Deadlock match analyzer — OSIC-grade post-Ritual intelligence from the Cursed Apple. Get combat dossiers, soul harvest grades, and classified field reports. No login required."
        canonical={absoluteUrl('/')}
        imageUrl="/images/og-share.webp"
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
              OSIC Sandman Division — Field Dossier Terminal
            </span>
          </div>

          <h1 className="flex flex-col items-center text-5xl sm:text-7xl md:text-8xl font-serif font-black tracking-tighter mb-6 leading-none">
            <span className="text-white textured-text -rotate-1 origin-bottom-right transform hover:rotate-0 transition-transform duration-700">Deadlock</span>
            <div className="sketchy-line w-full max-w-[0.9em] sm:max-w-full" />
            <span className="text-deadlock-amber textured-text rotate-1 origin-top-left transform hover:rotate-0 transition-transform duration-700">
              AfterMatch
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-deadlock-text-dim text-lg leading-relaxed mb-10">
            Classified post-Ritual intelligence from the streets of the Cursed Apple.
            Review your combat record, soul acquisition, and tactical decisions filed after each Ritual engagement.
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
                  placeholder="Enter operative Steam ID or profile link..."
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
                    <span className="text-[11px]">Investigate</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Example inputs hint */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-deadlock-text-dim/40 tracking-widest uppercase">
            <span>Known operatives:</span>
            <button type="button" onClick={() => setInput('76561198072944445')} className="hover:text-deadlock-amber transition-colors cursor-pointer">76561198072944445</button>
            <span className="text-deadlock-border">|</span>
            <button type="button" onClick={() => setInput('steamcommunity.com/id/yourname')} className="hover:text-deadlock-amber transition-colors cursor-pointer">steamcommunity.com/id/yourname</button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-deadlock-red/5 border-l-4 border-deadlock-red flex gap-4 transition-all animate-in fade-in slide-in-from-top-2">
              <div className="shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-deadlock-red" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-bold text-deadlock-red uppercase tracking-widest mb-1">
                  Could Not Find Player
                </h4>
                <p className="text-xs text-deadlock-text-dim leading-normal">
                  {toErrorMessage(error)}
                </p>
                <p className="text-[10px] text-deadlock-text-dim/50 mt-2">
                  Make sure you're entering a valid Steam profile URL, Steam ID, or custom URL name.
                </p>
              </div>
            </div>
          )}
        </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-deadlock-blue">
              <span className="w-8 h-px bg-deadlock-blue" />
              Investigate
            </div>
            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-deadlock-amber">
              Neutralize
              <span className="w-8 h-px bg-deadlock-amber" />
            </div>
          </div>
        </div>

        {/* AEO Quick Answer */}
        <section className="w-full max-w-4xl mt-20">
          <h2 className="text-2xl font-serif tracking-widest text-white mb-4 text-center uppercase">
            What is the OSIC Dossier System?
          </h2>
          <p className="text-sm text-deadlock-text-dim leading-relaxed max-w-3xl mx-auto text-center">
            When the Maelstrom tore open Astral Gates across the Earth, the Occult Security and Investigation Commission
            deployed the Sandman Division to monitor every Ritual engagement in the Cursed Apple. This dossier system
            intercepts post-Ritual telemetry and compiles classified field reports — grading soul harvest, combat effectiveness,
            and occult arsenal deployment so operatives can identify what cost them the fight.
          </p>
          <div className="mt-8 card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-deadlock-text-dim">
                <tr>
                  <th className="py-2 pr-4">Intelligence Module</th>
                  <th className="py-2 pr-4">Field Data</th>
                  <th className="py-2">Tactical Significance</th>
                </tr>
              </thead>
              <tbody className="text-deadlock-text-dim">
                <tr className="border-t border-deadlock-border">
                  <td className="py-2 pr-4 text-deadlock-text">Soul Harvest</td>
                  <td className="py-2 pr-4">Soul acquisition rate, net worth trajectory</td>
                  <td className="py-2">Detect harvest failures that starved your Patron summoning</td>
                </tr>
                <tr className="border-t border-deadlock-border">
                  <td className="py-2 pr-4 text-deadlock-text">Kill Ledger</td>
                  <td className="py-2 pr-4">Elimination density and combat impact in the Ritual</td>
                  <td className="py-2">Expose overextensions and deaths that fed the enemy</td>
                </tr>
                <tr className="border-t border-deadlock-border">
                  <td className="py-2 pr-4 text-deadlock-text">Occult Arsenal</td>
                  <td className="py-2 pr-4">Spirit weapon deployment timeline and loadout analysis</td>
                  <td className="py-2">Flag delayed power spikes and inefficient armament choices</td>
                </tr>
                <tr className="border-t border-deadlock-border">
                  <td className="py-2 pr-4 text-deadlock-text">Ritual Pressure</td>
                  <td className="py-2 pr-4">Damage to Guardians, Walkers, and Patron approach vectors</td>
                  <td className="py-2">Identify Rituals where combat wins weren't converted into map control</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Themed Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
          <div className="card card-blue group hover:bg-deadlock-blue/5 transition-colors">
            <Flame className="w-8 h-8 text-deadlock-blue mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-serif mb-2 tracking-widest">Soul Harvest</h3>
            <p className="text-xs text-deadlock-text-dim leading-relaxed">
              Track soul acquisition across the Ritual. Did you harvest enough to outpace the enemy's Patron summoning?
            </p>
          </div>

          <div className="card card-amber group hover:bg-deadlock-amber/5 transition-colors">
            <Skull className="w-8 h-8 text-deadlock-amber mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-serif mb-2 tracking-widest">Kill Ledger</h3>
            <p className="text-xs text-deadlock-text-dim leading-relaxed">
              Your combat record as filed by OSIC field observers. Every death, every elimination, accounted for.
            </p>
          </div>

          <div className="card card-amber group hover:bg-deadlock-amber/5 transition-colors">
            <Hourglass className="w-8 h-8 text-deadlock-amber mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-serif mb-2 tracking-widest">Occult Arsenal</h3>
            <p className="text-xs text-deadlock-text-dim leading-relaxed">
              Review your spirit weapon loadout and power spike timing against Cursed Apple field benchmarks.
            </p>
          </div>

          <div className="card card-blue group hover:bg-deadlock-blue/5 transition-colors">
            <Compass className="w-8 h-8 text-deadlock-blue mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-serif mb-2 tracking-widest">Ritual Pressure</h3>
            <p className="text-xs text-deadlock-text-dim leading-relaxed">
              Objective damage toward Guardians, Walkers, and the enemy Patron. Did you push the Ritual forward?
            </p>
          </div>
        </div>

        {/* SEO / AEO Generative FAQ Section */}
        <section className="w-full max-w-4xl mt-32 border-t border-deadlock-border pt-16">
          <h2 className="text-2xl font-serif tracking-widest text-white mb-8 text-center uppercase">
            Operative Briefing — Frequently Asked
          </h2>
          <div className="grid grid-cols-1 gap-6">
            <article className="bg-deadlock-bg border border-deadlock-border p-6 hover:border-deadlock-blue/30 transition-colors">
              <h3 className="text-sm font-bold text-deadlock-blue uppercase tracking-widest mb-3">
                What is the OSIC Dossier System?
              </h3>
              <p className="text-sm text-deadlock-text-dim leading-relaxed">
                The OSIC Dossier System is the Occult Security and Investigation Commission's declassified 
                post-Ritual analytics engine. Born from the Maelstrom's aftermath, it intercepts combat telemetry 
                from the Cursed Apple and compiles classified field reports grading soul harvest, combat effectiveness, 
                and spirit weapon deployment.
              </p>
            </article>

            <article className="bg-deadlock-bg border border-deadlock-border p-6 hover:border-deadlock-amber/30 transition-colors">
              <h3 className="text-sm font-bold text-deadlock-amber uppercase tracking-widest mb-3">
                How does the OSIC grade Ritual performance?
              </h3>
              <p className="text-sm text-deadlock-text-dim leading-relaxed">
                The Sandman Division intercepts Ritual telemetry and scores your soul acquisition trajectory, 
                kill ledger density, spirit weapon timing, and objective pressure against Guardians and Walkers. 
                Your results are compared against Cursed Apple field benchmarks to assign a classification 
                grade from F to A+.
              </p>
            </article>
          </div>
        </section>

        {/* Platform Info — relocated from hero section for cleaner visual hierarchy */}
        <section aria-label="Deadlock match analyzer quick answers" className="w-full max-w-4xl mt-24 pt-12 border-t border-deadlock-border/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-deadlock-border/20">
            <div className="bg-deadlock-bg p-6">
              <div className="text-[9px] font-bold text-deadlock-blue uppercase tracking-[0.2em] mb-3">Mission Brief</div>
              <p className="text-xs text-deadlock-text-dim/70 leading-relaxed">
                The OSIC Dossier System intercepts post-Ritual telemetry from the Cursed Apple's Astral resonance. 
                Enter an operative's Steam identifier to access their case files — classified field reports grading 
                soul harvest, combat effectiveness, and spirit weapon deployment.
              </p>
            </div>
            <div className="bg-deadlock-bg p-6">
              <div className="text-[9px] font-bold text-deadlock-amber uppercase tracking-[0.2em] mb-3">Assessment Protocol</div>
              <p className="text-xs text-deadlock-text-dim/70 leading-relaxed">
                The Sandman Division grades each Ritual engagement by comparing operative performance against 
                Cursed Apple field benchmarks. The dossier exposes soul harvest failures, combat overextensions, 
                arsenal timing gaps, and missed objective conversions.
              </p>
            </div>
            <div className="bg-deadlock-bg p-6">
              <div className="text-[9px] font-bold text-deadlock-blue uppercase tracking-[0.2em] mb-3">Operative Access</div>
              <p className="text-xs text-deadlock-text-dim/70 leading-relaxed">
                No OSIC clearance required. Enter a public Steam identifier, select a Ritual engagement from 
                the case file archive, and receive your classified dossier. Shared reports can be forwarded 
                directly from the debrief dashboard.
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
