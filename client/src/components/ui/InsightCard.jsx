import { AlertTriangle, AlertCircle, Info, CheckCircle, Clock, MapPin, Crosshair, Brain } from 'lucide-react';
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
};

const CATEGORY_LABELS = {
  soulTiming: 'Soul Timing',
  powerSpike: 'Power Spike',
  mapMovement: 'Map Movement',
  fightTiming: 'Fight Timing',
  decisionQuality: 'Decision Quality',
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
          {insight.action && (
            <div className="bg-black/30 border border-deadlock-accent/20 rounded-lg p-3">
              <p className="text-xs text-deadlock-accent font-semibold mb-1">ACTION FOR NEXT GAME:</p>
              <p className="text-xs text-deadlock-text-dim leading-relaxed">{insight.action}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
