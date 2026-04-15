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
    <div className={`card ${config.bg} ${config.border} border`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase ${config.color}`}>
              {config.label}
            </span>
            <span className="text-xs text-deadlock-muted">
              {MODULE_LABELS[insight.module] || insight.module}
            </span>
          </div>
          <h4 className="font-semibold text-deadlock-text mb-1">{insight.title}</h4>
          <p className="text-sm text-deadlock-text-dim leading-relaxed">{insight.detail}</p>
        </div>
      </div>
    </div>
  );
}
