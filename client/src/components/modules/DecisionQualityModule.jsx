import { Brain, TrendingUp, TrendingDown } from 'lucide-react';
import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
} from 'recharts';

const GRADE_COLORS = {
  S: 'text-deadlock-green',
  A: 'text-deadlock-green',
  B: 'text-deadlock-blue',
  C: 'text-deadlock-amber',
  D: 'text-orange-500',
  F: 'text-deadlock-red',
};

export default function DecisionQualityModule({ data }) {
  if (!data) return null;
  const { score, grade, label, radar = [], findings = [], summary } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-deadlock-accent" />
          <div>
            <p className="text-xs uppercase tracking-widest text-deadlock-muted">Decision Quality</p>
            <p className="font-semibold">{label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-deadlock-muted">Grade</p>
          <p className={`font-mono text-3xl font-bold ${GRADE_COLORS[grade] || 'text-deadlock-accent'}`}>{grade}</p>
          <p className="text-xs text-deadlock-muted">{score}/100</p>
        </div>
      </div>

      {summary && (
        <p className="text-sm text-deadlock-text-dim bg-deadlock-bg p-3 rounded-lg">{summary}</p>
      )}

      {/* Radar chart */}
      {radar.length > 0 && (
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <RadarChart data={radar} outerRadius="75%">
              <PolarGrid stroke="#2a2a35" />
              <PolarAngleAxis dataKey="area" tick={{ fill: '#8c8c9c', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#555', fontSize: 10 }} />
              <Radar name="Decision Quality" dataKey="score" stroke="#ff6b35" fill="#ff6b35" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Findings */}
      {findings.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-deadlock-muted mb-2">Key Findings</p>
          <ul className="space-y-2">
            {findings.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm bg-deadlock-bg p-2 rounded-lg">
                {f.type === 'strength' ? (
                  <TrendingUp className="w-4 h-4 text-deadlock-green" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-deadlock-red" />
                )}
                <span className="flex-1">{f.area}</span>
                <span className="font-mono text-xs">{f.score}/100</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
