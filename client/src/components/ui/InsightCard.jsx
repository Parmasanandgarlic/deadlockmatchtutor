import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { SEVERITY_CONFIG, MODULE_LABELS } from '../../utils/constants';

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

export default function InsightCard({ insight }) {
  const config = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;
  const Icon = SEVERITY_ICONS[insight.severity] || Info;

  return (
    <div className={`card ${config.bg} ${config.border} border border-white/5 relative group hover:border-deadlock-amber/30 transition-all duration-300`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 bg-black/40 border border-white/5 ${config.color}`}>
          <Icon className="w-5 h-5 flex-shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${config.color}`}>
              {config.label}
            </span>
            <span className="w-1 h-1 bg-deadlock-border rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-deadlock-muted">
              {MODULE_LABELS[insight.module] || insight.module}
            </span>
          </div>
          <h4 className="font-serif text-sm tracking-widest text-white uppercase mb-2 group-hover:text-deadlock-amber transition-colors">
            {insight.title}
          </h4>
          <p className="text-xs text-deadlock-text-dim leading-relaxed">
            {insight.detail}
          </p>
        </div>
      </div>
    </div>
  );
}
