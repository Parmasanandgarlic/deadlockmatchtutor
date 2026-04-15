import { GRADE_COLORS } from './constants';

/**
 * Get the Tailwind color class for a letter grade.
 */
export function getGradeColor(grade) {
  return GRADE_COLORS[grade] || 'text-deadlock-muted';
}

/**
 * Get a qualitative label for a numeric score.
 */
export function getScoreLabel(score) {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Strong';
  if (score >= 70) return 'Above Average';
  if (score >= 60) return 'Average';
  if (score >= 50) return 'Below Average';
  if (score >= 40) return 'Weak';
  return 'Critical';
}

/**
 * Get Tailwind color class for a numeric score (0–100).
 */
export function getScoreColor(score) {
  if (score >= 80) return 'text-deadlock-green';
  if (score >= 60) return 'text-deadlock-blue';
  if (score >= 40) return 'text-deadlock-accent';
  return 'text-deadlock-red';
}
