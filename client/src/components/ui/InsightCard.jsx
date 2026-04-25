import { AlertTriangle, AlertCircle, Info, CheckCircle, Clock, MapPin, Crosshair, Brain, TrendingUp, BarChart3, Swords, Wrench, Trophy } from 'lucide-react';
import { SEVERITY_CONFIG, MODULE_LABELS } from '../../utils/constants';

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
  positive: CheckCircle,
};

// Category icons for Deadlock-specific gameplay dimensions
const CATEGORY_ICONS = {
  soulTiming: Clock,
  powerSpike: Crosshair,
  mapMovement: MapPin,
  fightTiming: Crosshair,
  decisionQuality: Brain,
  matchupAwareness: Swords,
  buildPath: Wrench,
  trend: TrendingUp,
  metaContext: BarChart3,
  winCondition: Trophy,
};

const CATEGORY_LABELS = {
  soulTiming: 'Soul Timing',
  powerSpike: 'Power Spike',
  mapMovement: 'Map Movement',
  fightTiming: 'Fight Timing',
  decisionQuality: 'Decision Quality',
  matchupAwareness: 'Matchup Intel',
  buildPath: 'Build Path',
  trend: 'Performance Trend',
  metaContext: 'Meta Context',
  winCondition: 'Win Condition',
};

export default function InsightCard({ insight }) {
  const config = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;
  const Icon = SEVERITY_ICONS[insight.severity] || Info;
  const CategoryIcon = CATEGORY_ICONS[insight.category] || Info;
  const categoryLabel = CATEGORY_LABELS[insight.category] || insight.category;

  return (
    <div className={`card ${config.bg} ${config.border} border border-white/5 relative group hover:border-deadlock-amber/30 transition-all duration-300`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 bg-black/40 border border-white/5 ${config.color}`}>
          <Icon className="w-5 h-5 flex-shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${config.color}`}>
              {config.label}
            </span>
            <span className="w-1 h-1 bg-deadlock-border rounded-full" />
            <div className="flex items-center gap-1.5">
              <CategoryIcon className="w-3 h-3 text-deadlock-muted" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-deadlock-muted">
                {categoryLabel}
              </span>
            </div>
            {insight.timestamp && (
              <>
                <span className="w-1 h-1 bg-deadlock-border rounded-full" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-deadlock-muted">
                  {insight.timestamp}
                </span>
              </>
            )}
          </div>
          <h4 className="font-serif text-sm tracking-widest text-white uppercase mb-2 group-hover:text-deadlock-amber transition-colors">
            {insight.title}
          </h4>
          <p className="text-xs text-deadlock-text-dim leading-relaxed mb-3">
            {insight.detail}
          </p>

          {/* Evidence badge — shows the data backing this insight */}
          {insight.evidence && (
            <EvidenceBadge evidence={insight.evidence} />
          )}

          {insight.action && (
            <div className="bg-black/30 border border-deadlock-accent/20 rounded-lg p-3 mt-2">
              <p className="text-xs text-deadlock-accent font-semibold mb-1">ACTION FOR NEXT GAME:</p>
              <p className="text-xs text-deadlock-text-dim leading-relaxed">{insight.action}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Evidence Badge — compact data visualization showing the specific
 * numbers or events backing an insight. Makes the difference between
 * "fortune cookie wisdom" and data-driven coaching.
 */
function EvidenceBadge({ evidence }) {
  if (!evidence?.data) return null;

  const renderContent = () => {
    switch (evidence.type) {
      case 'stat':
        return (
          <div className="flex items-center gap-3 flex-wrap">
            {evidence.data.soulsPerMin != null && (
              <Stat label="Souls/min" value={evidence.data.soulsPerMin} />
            )}
            {evidence.data.threshold != null && (
              <Stat label="Benchmark" value={evidence.data.threshold} />
            )}
            {evidence.data.deficit != null && (
              <Stat label="Deficit" value={`-${evidence.data.deficit}`} negative />
            )}
          </div>
        );
      case 'economy':
        return (
          <div className="flex items-center gap-3 flex-wrap">
            <Stat label="Net Worth" value={evidence.data.netWorth?.toLocaleString()} />
            <Stat label="Expected" value={evidence.data.expected?.toLocaleString()} />
            {evidence.data.behindBy && (
              <Stat label="Behind" value={`-${evidence.data.behindBy?.toLocaleString()}`} negative />
            )}
          </div>
        );
      case 'deaths':
        return (
          <div className="flex items-center gap-3 flex-wrap">
            <Stat label="Deaths" value={evidence.data.totalDeaths || evidence.data.deaths} negative />
            {evidence.data.deathInterval && (
              <Stat label="Every" value={`${evidence.data.deathInterval}s`} />
            )}
            {evidence.data.estimatedLostSouls && (
              <Stat label="Lost Souls" value={`-${evidence.data.estimatedLostSouls}`} negative />
            )}
          </div>
        );
      case 'matchup':
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {evidence.data.counters?.map((c, i) => (
              <span key={i} className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">
                ⚔️ {c.heroName}
              </span>
            ))}
          </div>
        );
      case 'meta':
        return (
          <div className="flex items-center gap-3 flex-wrap">
            <Stat label="Win Rate" value={`${evidence.data.winRate?.toFixed(1)}%`}
              negative={evidence.data.winRate < 49} />
            <span className={`text-[10px] px-2 py-0.5 rounded border ${
              evidence.data.tier === 'S' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              evidence.data.tier === 'D' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }`}>
              {evidence.data.tier}-Tier
            </span>
          </div>
        );
      case 'trend':
        return (
          <div className="flex items-center gap-3 flex-wrap">
            {evidence.data.trendSlug && (
              <span className={`text-[10px] px-2 py-0.5 rounded border ${
                evidence.data.trendSlug === 'declining' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                evidence.data.trendSlug === 'improving' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {evidence.data.trendSlug === 'declining' ? '📉' : '📈'} {evidence.data.recentMatches} games
              </span>
            )}
            {evidence.data.lossStreak > 0 && (
              <Stat label="Loss Streak" value={evidence.data.lossStreak} negative />
            )}
          </div>
        );
      case 'compound':
        return (
          <div className="flex items-center gap-3 flex-wrap">
            <Stat label="Deaths" value={evidence.data.deaths} negative />
            <Stat label="SPM" value={evidence.data.soulsPerMin} />
            <Stat label="Est. Deficit" value={`-${evidence.data.estimatedDeficit}`} negative />
          </div>
        );
      case 'win_condition':
        return (
          <div className="flex items-center gap-3 flex-wrap">
            {evidence.data.soulsPerMin != null && (
              <Stat label="Souls/min" value={evidence.data.soulsPerMin} />
            )}
            {evidence.data.kda != null && (
              <Stat label="KDA" value={evidence.data.kda?.toFixed?.(1) || evidence.data.kda} />
            )}
            {evidence.data.damagePerMin != null && (
              <Stat label="DPM" value={evidence.data.damagePerMin} />
            )}
            <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded">
              🏆 {evidence.data.factor}
            </span>
          </div>
        );
      case 'loss_condition':
        return (
          <div className="flex items-center gap-3 flex-wrap">
            {evidence.data.deaths != null && (
              <Stat label="Deaths" value={evidence.data.deaths} negative />
            )}
            {evidence.data.soulsPerMin != null && (
              <Stat label="Souls/min" value={evidence.data.soulsPerMin} negative={evidence.data.soulsPerMin < 400} />
            )}
            {evidence.data.kda != null && (
              <Stat label="KDA" value={evidence.data.kda?.toFixed?.(1) || evidence.data.kda} negative />
            )}
            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">
              💀 {evidence.data.factor?.replace(/_/g, ' ')}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  const content = renderContent();
  if (!content) return null;

  return (
    <div className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 mb-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-deadlock-muted mb-1.5">Evidence</p>
      {content}
    </div>
  );
}

function Stat({ label, value, negative = false }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] uppercase tracking-wider text-deadlock-muted">{label}</span>
      <span className={`text-xs font-mono font-bold ${negative ? 'text-red-400' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}
