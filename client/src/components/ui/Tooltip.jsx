import { useState } from 'react';
import { Info, X } from 'lucide-react';

// Glossary of Deadlock-specific metrics and terms
export const METRIC_GLOSSARY = {
  // Core Metrics
  impactScore: {
    term: 'Impact Score',
    definition: 'A composite score (0-100) measuring your overall influence on the match outcome, weighted by Deadlock-specific factors like soul timing, fight participation, and objective control.',
    category: 'General'
  },
  soulsPerMin: {
    term: 'Souls Per Minute',
    definition: 'Average souls collected per minute. Higher values indicate better farming efficiency and map presence. Critical for power spike timing.',
    category: 'Economy'
  },
  kda: {
    term: 'KDA (Kills/Deaths/Assists)',
    definition: 'Combat effectiveness ratio. In Deadlock, deaths are especially punishing as they give souls to enemies and remove you from map control.',
    category: 'Combat'
  },
  damagePerSoul: {
    term: 'Damage Per Soul',
    definition: 'Efficiency metric showing how much damage you dealt per soul collected. Lower values suggest efficient farming; higher values indicate teamfight-heavy play.',
    category: 'Efficiency'
  },
  
  // Timing Metrics
  powerSpikeTime: {
    term: 'Power Spike Timing',
    definition: 'When you reached your critical item/milestone relative to optimal benchmarks. Early power spikes can dominate lanes; delayed spikes may indicate farming issues.',
    category: 'Timing'
  },
  firstBloodTime: {
    term: 'First Blood Time',
    definition: 'Time of first kill in the match. Early kills can snowball lane advantage but may sacrifice farm if overextended.',
    category: 'Timing'
  },
  fightParticipation: {
    term: 'Fight Participation %',
    definition: 'Percentage of teamfights you were present for. High participation shows good map awareness, but excessive fighting can delay farm.',
    category: 'Teamplay'
  },
  
  // Map Movement
  mapPresence: {
    term: 'Map Presence',
    definition: 'Measure of how effectively you rotated between lanes, jungle, and objectives. Good map presence creates pressure and farming opportunities.',
    category: 'Movement'
  },
  rotationTiming: {
    term: 'Rotation Timing',
    definition: 'How well-timed your lane rotations were. Optimal rotations maximize farm while being present for key fights and objectives.',
    category: 'Movement'
  },
  
  // Decision Quality
  decisionQuality: {
    term: 'Decision Quality Score',
    definition: 'AI-evaluated score based on timing of engages, retreats, item purchases, and objective calls. Considers context like gold lead, cooldowns, and team positioning.',
    category: 'Strategy'
  },
  objectiveControl: {
    term: 'Objective Control',
    definition: 'Contribution to securing bosses, shrines, and towers. Objectives win games in Deadlock, not just kills.',
    category: 'Strategy'
  },
  
  // Benchmarks
  percentile: {
    term: 'Percentile Rank',
    definition: 'How you compare to other players using the same hero. 75th percentile means you performed better than 75% of players.',
    category: 'Comparison'
  },
  benchmarkKda: {
    term: 'Benchmark KDA',
    definition: 'Average KDA for this hero across all matches at your skill level. Use this to gauge if your performance is above or below expected.',
    category: 'Comparison'
  },
  
  // Itemization
  itemEfficiency: {
    term: 'Item Efficiency',
    definition: 'How well your item choices matched the game situation (enemy composition, game state, counter-picks). Includes timing of power items.',
    category: 'Build'
  },
  upgradeTiming: {
    term: 'Upgrade Timing',
    definition: 'Optimality of when you purchased key upgrades. Early core items accelerate power spikes; situational items address enemy threats.',
    category: 'Build'
  },
  
  // Soul Timing
  soulTiming: {
    term: 'Soul Timing',
    definition: 'Evaluation of when you collected souls relative to power spikes and fights. Good soul timing means having resources available for crucial moments.',
    category: 'Economy'
  },
};

export default function Tooltip({ content, children, className = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  
  if (!content) return children;
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <Info className="w-3 h-3 text-deadlock-muted ml-1 inline hover:text-deadlock-accent cursor-help" />
      
      {isVisible && (
        <>
          <div className="fixed inset-0 z-40" />
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 md:w-80 p-4 bg-deadlock-surface border border-deadlock-border shadow-xl rounded-lg pointer-events-none">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-sm font-bold text-deadlock-accent uppercase tracking-wider">
                {content.term}
              </h4>
              <X className="w-4 h-4 text-deadlock-muted flex-shrink-0" />
            </div>
            {content.category && (
              <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-deadlock-muted mb-2 px-2 py-0.5 bg-deadlock-bg rounded">
                {content.category}
              </span>
            )}
            <p className="text-xs text-deadlock-text-dim leading-relaxed">
              {content.definition}
            </p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-deadlock-surface border-r border-b border-deadlock-border" />
          </div>
        </>
      )}
    </div>
  );
}

// Helper to get glossary entry by metric key
export function getMetricGlossary(metricKey) {
  return METRIC_GLOSSARY[metricKey] || null;
}

// Metric label with built-in tooltip
export function MetricLabel({ metricKey, label }) {
  const glossary = getMetricGlossary(metricKey);
  
  return (
    <Tooltip content={glossary}>
      <span>{label || glossary?.term || metricKey}</span>
    </Tooltip>
  );
}
