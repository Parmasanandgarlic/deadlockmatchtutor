export const MODULE_LABELS = {
  economy: 'Economy & Farming',
  itemization: 'Itemization & Power Spikes',
  combat: 'Combat & Engagement',
  objectives: 'Map Control & Objectives',
};

export const MODULE_KEYS = ['economy', 'itemization', 'combat', 'objectives'];

export const SEVERITY_CONFIG = {
  critical: { color: 'text-deadlock-red', bg: 'bg-deadlock-red/10', border: 'border-deadlock-red/30', label: 'Critical' },
  warning: { color: 'text-deadlock-accent', bg: 'bg-deadlock-accent/10', border: 'border-deadlock-accent/30', label: 'Warning' },
  info: { color: 'text-deadlock-blue', bg: 'bg-deadlock-blue/10', border: 'border-deadlock-blue/30', label: 'Info' },
};

export const GRADE_COLORS = {
  'A+': 'text-deadlock-green',
  'A': 'text-deadlock-green',
  'A-': 'text-deadlock-green',
  'B+': 'text-deadlock-blue',
  'B': 'text-deadlock-blue',
  'B-': 'text-deadlock-blue',
  'C+': 'text-deadlock-accent',
  'C': 'text-deadlock-accent',
  'C-': 'text-deadlock-accent',
  'D+': 'text-orange-400',
  'D': 'text-orange-400',
  'D-': 'text-orange-400',
  'F': 'text-deadlock-red',
};
