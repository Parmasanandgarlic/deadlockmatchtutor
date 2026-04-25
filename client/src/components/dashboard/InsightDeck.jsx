import { useState } from 'react';
import InsightCard from '../ui/InsightCard';
import { Lightbulb, AlertTriangle, Target, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const TIER_CONFIG = {
  'must-fix': {
    label: 'Critical Issues',
    desc: 'Fix these first — they cost you games',
    icon: AlertTriangle,
    color: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    pulseClass: 'animate-pulse',
  },
  optimize: {
    label: 'Optimization Targets',
    desc: 'Sharpen these to climb faster',
    icon: Target,
    color: 'text-deadlock-amber',
    border: 'border-deadlock-amber/30',
    bg: 'bg-deadlock-amber/5',
    pulseClass: '',
  },
  context: {
    label: 'Match Context',
    desc: 'What went right & background factors',
    icon: Sparkles,
    color: 'text-deadlock-blue',
    border: 'border-deadlock-blue/30',
    bg: 'bg-deadlock-blue/5',
    pulseClass: '',
  },
};

export default function InsightDeck({ insights }) {
  const [collapsedTiers, setCollapsedTiers] = useState({});

  if (!insights || insights.length === 0) {
    return (
      <div className="card mb-6 text-center py-8 text-deadlock-text-dim">
        <Lightbulb className="w-8 h-8 mx-auto mb-2 text-deadlock-muted" />
        <p>No major issues detected — well played!</p>
      </div>
    );
  }

  // Group by tier, preserving impact-sorted order within each group
  const tiers = ['must-fix', 'optimize', 'context'];
  const grouped = {};
  for (const tier of tiers) {
    grouped[tier] = insights.filter(i => i.tier === tier);
  }
  // Fallback for insights without a tier (legacy data)
  const untiered = insights.filter(i => !i.tier);
  if (untiered.length > 0) {
    grouped.optimize = [...(grouped.optimize || []), ...untiered];
  }

  const toggleTier = (tier) => {
    setCollapsedTiers(prev => ({ ...prev, [tier]: !prev[tier] }));
  };

  return (
    <div className="h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-deadlock-amber/10 border border-deadlock-amber/20">
          <Lightbulb className="w-5 h-5 text-deadlock-amber animate-pulse-slow" />
        </div>
        <div>
          <h2 className="text-xl font-serif tracking-widest text-white uppercase">OSIC Field Report</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-deadlock-muted">
            {insights.length} findings · Priority threats and behavioral patterns
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {tiers.map(tier => {
          const items = grouped[tier];
          if (!items || items.length === 0) return null;
          const config = TIER_CONFIG[tier];
          const TierIcon = config.icon;
          const isCollapsed = collapsedTiers[tier];

          return (
            <div key={tier}>
              {/* Tier Header */}
              <button
                onClick={() => toggleTier(tier)}
                className={`w-full flex items-center justify-between gap-3 mb-3 px-3 py-2 
                  ${config.bg} border ${config.border} transition-colors hover:bg-opacity-20 cursor-pointer`}
              >
                <div className="flex items-center gap-3">
                  <TierIcon className={`w-4 h-4 ${config.color} ${config.pulseClass}`} />
                  <div className="text-left">
                    <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-[9px] text-deadlock-muted ml-2">
                      ({items.length}) · {config.desc}
                    </span>
                  </div>
                </div>
                {isCollapsed
                  ? <ChevronDown className="w-4 h-4 text-deadlock-muted" />
                  : <ChevronUp className="w-4 h-4 text-deadlock-muted" />}
              </button>

              {/* Insight Cards */}
              {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((insight, idx) => (
                    <InsightCard key={`${tier}-${idx}`} insight={insight} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

