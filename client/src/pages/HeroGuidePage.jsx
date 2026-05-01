import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Target, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { getHeroImage } from '../utils/formatters';

export default function HeroGuidePage() {
  const { heroId } = useParams();
  const [guideData, setGuideData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeArchetypeId, setActiveArchetypeId] = useState('primary');

  useEffect(() => {
    async function fetchGuide() {
      try {
        setLoading(true);
        const res = await fetch(`/api/meta/heroes/${heroId}/guide`);
        if (!res.ok) throw new Error('Failed to load hero guide');
        const data = await res.json();
        setGuideData(data);
        if (data.archetypes?.length > 0) {
          setActiveArchetypeId(data.archetypes[0].id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchGuide();
  }, [heroId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-deadlock-amber animate-spin mb-4" />
        <p className="text-deadlock-text-dim">Loading Elite Hero Intelligence...</p>
      </div>
    );
  }

  if (error || !guideData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <AlertCircle className="w-16 h-16 text-deadlock-red mb-4" />
        <h2 className="text-2xl text-white font-serif tracking-widest mb-2">Intelligence Unavailable</h2>
        <p className="text-deadlock-text-dim text-center max-w-md mb-6">{error || 'Could not load guide data.'}</p>
        <Link to="/resources" className="btn-primary">Return to Resources</Link>
      </div>
    );
  }

  const activeArchetype = guideData.archetypes?.find(a => a.id === activeArchetypeId) || guideData.archetypes?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-deadlock-border">
        <div className="flex items-center gap-6">
          <Link to="/resources" className="p-3 bg-deadlock-surface/50 border border-deadlock-border hover:border-deadlock-amber transition-colors group">
            <ArrowLeft className="w-6 h-6 text-deadlock-muted group-hover:text-deadlock-amber transition-colors" />
          </Link>
          <div className="flex items-center gap-6">
            <img 
              src={getHeroImage(guideData.heroName, 'card')} 
              alt={guideData.heroName}
              className="w-24 h-24 object-cover border-2 border-deadlock-amber/50 bg-deadlock-surface shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              onError={(e) => { e.target.src = '/hero-fallback.webp'; }}
            />
            <div>
              <div className="text-sm text-deadlock-amber font-bold tracking-widest uppercase mb-1">Elite Guide</div>
              <h1 className="text-4xl text-white font-serif tracking-widest uppercase">{guideData.heroName}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Archetype Toggles */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif text-white tracking-widest uppercase flex items-center gap-2">
          <Target className="w-5 h-5 text-deadlock-amber" /> Playstyle Archetypes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guideData.archetypes?.map((arch) => (
            <button
              key={arch.id}
              onClick={() => setActiveArchetypeId(arch.id)}
              className={`p-6 text-left border transition-all duration-300 relative overflow-hidden ${
                activeArchetypeId === arch.id 
                  ? 'bg-deadlock-amber/10 border-deadlock-amber shadow-[0_0_30px_rgba(212,175,55,0.15)]' 
                  : 'bg-deadlock-surface/30 border-deadlock-border hover:border-deadlock-muted'
              }`}
            >
              {activeArchetypeId === arch.id && (
                <div className="absolute top-0 left-0 w-1 h-full bg-deadlock-amber shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
              )}
              <h3 className={`text-lg font-bold mb-2 ${activeArchetypeId === arch.id ? 'text-deadlock-amber' : 'text-white'}`}>
                {arch.name}
              </h3>
              <p className="text-sm text-deadlock-text-dim">{arch.description}</p>
            </button>
          ))}
        </div>
      </section>

      {activeArchetype && (
        <div className="space-y-8 animate-reveal">
          
          {/* Algorithmic Timeline */}
          <section className="bg-deadlock-surface/50 border border-deadlock-border p-6 relative">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-deadlock-border">
              <Clock className="w-5 h-5 text-deadlock-blue" />
              <h2 className="text-xl font-serif text-white tracking-widest uppercase">Algorithmic Build Timeline</h2>
            </div>
            
            <div className="relative pt-12 pb-8 px-4">
              {/* The Timeline Line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-deadlock-surface via-deadlock-blue/50 to-deadlock-amber/50 -translate-y-1/2" />
              
              {/* Minute Markers (0 to 30) */}
              <div className="absolute top-0 left-0 w-full flex justify-between text-xs text-deadlock-muted font-mono px-4">
                <span>0:00</span>
                <span>10:00</span>
                <span>20:00</span>
                <span>30:00</span>
              </div>

              {/* Items on Timeline */}
              {activeArchetype.timeline.map((item, idx) => {
                // Map timeSeconds to percentage across 30 minutes (1800s)
                const percent = Math.min(100, Math.max(0, (item.timeSeconds / 1800) * 100));
                return (
                  <div 
                    key={idx} 
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group z-10 cursor-help"
                    style={{ left: `${percent}%` }}
                  >
                    <div className="w-4 h-4 bg-deadlock-bg border-2 border-deadlock-blue rounded-full shadow-[0_0_10px_rgba(0,255,255,0.5)] group-hover:scale-150 group-hover:bg-deadlock-blue transition-all" />
                    
                    {/* Tooltip Content */}
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-1/2 -translate-x-1/2 mb-3 bg-deadlock-surface border border-deadlock-border p-3 w-48 text-center pointer-events-none z-20">
                      <div className="text-xs text-deadlock-blue font-mono mb-1">{Math.floor(item.timeSeconds / 60)}:{(item.timeSeconds % 60).toString().padStart(2, '0')}</div>
                      <div className="text-white font-bold">{item.itemName}</div>
                      <div className="text-[10px] text-deadlock-text-dim mt-1">Top 1% average purchase time</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Matchup Radar */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predators */}
            <div className="bg-deadlock-surface/50 border border-deadlock-red/30 p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-deadlock-red/20">
                <TrendingDown className="w-6 h-6 text-deadlock-red" />
                <h2 className="text-xl font-serif text-white tracking-widest uppercase">Predators</h2>
              </div>
              <div className="space-y-4">
                {activeArchetype.matchups?.predators.map((pred, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-deadlock-red/5 border border-deadlock-red/10">
                    <img 
                      src={getHeroImage(pred.heroName, 'small')} 
                      alt={pred.heroName}
                      className="w-16 h-16 object-cover border border-deadlock-red/30"
                      onError={(e) => { e.target.src = '/hero-fallback.webp'; }}
                    />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-bold">{pred.heroName}</span>
                        <span className="text-deadlock-red font-mono text-sm">{pred.winRateDiff}% WR</span>
                      </div>
                      <p className="text-sm text-deadlock-text-dim">{pred.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prey */}
            <div className="bg-deadlock-surface/50 border border-deadlock-green/30 p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-deadlock-green/20">
                <TrendingUp className="w-6 h-6 text-deadlock-green" />
                <h2 className="text-xl font-serif text-white tracking-widest uppercase">Prey</h2>
              </div>
              <div className="space-y-4">
                {activeArchetype.matchups?.prey.map((prey, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-deadlock-green/5 border border-deadlock-green/10">
                    <img 
                      src={getHeroImage(prey.heroName, 'small')} 
                      alt={prey.heroName}
                      className="w-16 h-16 object-cover border border-deadlock-green/30"
                      onError={(e) => { e.target.src = '/hero-fallback.webp'; }}
                    />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-bold">{prey.heroName}</span>
                        <span className="text-deadlock-green font-mono text-sm">+{prey.winRateDiff}% WR</span>
                      </div>
                      <p className="text-sm text-deadlock-text-dim">{prey.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
