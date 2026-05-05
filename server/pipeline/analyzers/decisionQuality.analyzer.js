const { clamp } = require('../../utils/helpers');
const { DECISION_QUALITY } = require('../scoringCalibration');

/**
 * Decision Quality Analyzer.
 *
 * Synthesizes a "decision quality" score (0..100) from the signals the other
 * modules already produced. Rather than grading raw output (KDA, souls/min),
 * this module grades the DECISION LAYER:
 *
 *   1. Engagement selection  – did you fight when you were ahead (positioning
 *      score, damage dealt vs taken)?
 *   2. Farm efficiency       – did you farm efficiently relative to your rank?
 *   3. Death severity        – not how many times you died, but HOW costly each
 *      death was (deaths per minute vs expected).
 *   4. Objective focus       – did you prioritize objectives or drift?
 *   5. Build pacing          – did your build reflect good macro choices?
 *   6. Matchup adaptation    – did you still perform in a hard matchup?
 *
 * Each dimension contributes a sub-score; the aggregate is weighted.
 */

const WEIGHTS = DECISION_QUALITY.weights;

function scoreEngagement({ combat, playerStats }) {
  const positioning = playerStats?.positioningScore ?? null;
  if (positioning != null) return clamp(positioning, 0, 100);
  // Fallback: damage dealt per death ratio
  const kda = combat?.kda ?? 0;
  return clamp(DECISION_QUALITY.engagement.fallbackBase + kda * DECISION_QUALITY.engagement.kdaScale, 0, 100);
}

function scoreFarm({ rankBenchmarks, itemization }) {
  const spmScore = rankBenchmarks?.comparisons?.find((c) => c.metric === 'Souls / Min')?.score;
  if (typeof spmScore === 'number') return spmScore;
  // Fallback: absolute SPM
  const spm = itemization?.soulsPerMin || 0;
  const { weakSoulsPerMin, strongSoulsPerMin, scoreRange, scoreFloor } = DECISION_QUALITY.farm;
  return clamp(Math.round(((spm - weakSoulsPerMin) / (strongSoulsPerMin - weakSoulsPerMin)) * scoreRange + scoreFloor), 0, 100);
}

function scoreDeathSeverity({ combat, matchupDifficulty }) {
  const dpm = combat?.deathsPerMin ?? 0;
  // Expected deaths per minute scales with difficulty (harder = more acceptable)
  const { expectedDeathsPerMin, minimumObservedDeathsPerMin, ratioFloor, ratioCeiling, scoreBase, logScale, difficultyMultiplier } = DECISION_QUALITY.deathSeverity;
  const difficultyAdj = difficultyMultiplier[matchupDifficulty?.difficulty] ?? difficultyMultiplier.balanced;
  const expected = expectedDeathsPerMin * difficultyAdj;
  // Lower DPM than expected = higher score
  const ratio = expected > 0 ? expected / Math.max(dpm, minimumObservedDeathsPerMin) : 1;
  return clamp(Math.round(scoreBase + Math.log2(clamp(ratio, ratioFloor, ratioCeiling)) * logScale), 0, 100);
}

function scoreObjective({ playerStats, rankBenchmarks }) {
  const objDmg = playerStats?.objectiveDamage;
  const objScore = rankBenchmarks?.comparisons?.find((c) => c.metric === 'Objective Damage')?.score;
  if (typeof objScore === 'number') return objScore;
  const { neutralScore, lowDamage, highDamage, scoreRange, scoreFloor } = DECISION_QUALITY.objective;
  if (objDmg == null) return neutralScore;
  return clamp(Math.round(((objDmg - lowDamage) / (highDamage - lowDamage)) * scoreRange + scoreFloor), 0, 100);
}

function scoreBuild({ buildPath }) {
  return typeof buildPath?.score === 'number' ? buildPath.score : DECISION_QUALITY.objective.neutralScore;
}

function scoreAdaptation({ matchupDifficulty, combat, heroPerformance }) {
  const hp = heroPerformance?.score ?? combat?.score ?? DECISION_QUALITY.objective.neutralScore;
  const d = matchupDifficulty?.difficulty;
  // Reward strong performance in hard matchups, penalize weak performance in easy ones.
  if (d === 'extreme') return clamp(hp + DECISION_QUALITY.adaptationAdjustment.extreme, 0, 100);
  if (d === 'hard') return clamp(hp + DECISION_QUALITY.adaptationAdjustment.hard, 0, 100);
  if (d === 'easy') return clamp(hp + DECISION_QUALITY.adaptationAdjustment.easy, 0, 100);
  return hp;
}

function classifyGrade(score) {
  for (const threshold of DECISION_QUALITY.grades) {
    if (score >= threshold.min) return { grade: threshold.grade, label: threshold.label };
  }
  return DECISION_QUALITY.grades[DECISION_QUALITY.grades.length - 1];
}

function keyFindings(parts) {
  const findings = [];
  for (const [key, value] of Object.entries(parts)) {
    if (value >= DECISION_QUALITY.findingBands.strength) findings.push({ type: 'strength', area: key, score: value });
    else if (value <= DECISION_QUALITY.findingBands.weakness) findings.push({ type: 'weakness', area: key, score: value });
  }
  return findings.sort((a, b) =>
    a.type === b.type ? Math.abs(50 - b.score) - Math.abs(50 - a.score) : a.type === 'weakness' ? -1 : 1
  );
}

const AREA_LABELS = {
  engagement: 'Engagement Selection',
  farm: 'Farm Efficiency',
  deathSeverity: 'Death Discipline',
  objective: 'Objective Focus',
  build: 'Build Pacing',
  adaptation: 'Matchup Adaptation',
};

function analyzeDecisionQuality(params) {
  const parts = {
    engagement: Math.round(scoreEngagement(params)),
    farm: Math.round(scoreFarm(params)),
    deathSeverity: Math.round(scoreDeathSeverity(params)),
    objective: Math.round(scoreObjective(params)),
    build: Math.round(scoreBuild(params)),
    adaptation: Math.round(scoreAdaptation(params)),
  };

  let score = 0;
  for (const [k, v] of Object.entries(parts)) score += v * WEIGHTS[k];
  score = Math.round(clamp(score, 0, 100));

  const { grade, label } = classifyGrade(score);
  const findings = keyFindings(parts);

  const radar = Object.entries(parts).map(([key, value]) => ({
    area: AREA_LABELS[key],
    key,
    score: value,
  }));

  return {
    score,
    grade,
    label,
    components: parts,
    radar,
    findings: findings.map((f) => ({
      type: f.type,
      area: AREA_LABELS[f.area] || f.area,
      score: f.score,
    })),
    summary: `${label} (grade ${grade}). ${
      findings[0]?.type === 'strength'
        ? `Biggest strength: ${AREA_LABELS[findings[0].area] || findings[0].area}.`
        : findings[0]?.type === 'weakness'
        ? `Biggest weakness: ${AREA_LABELS[findings[0].area] || findings[0].area}.`
        : 'Performance was balanced across dimensions.'
    }`,
  };
}

module.exports = { analyzeDecisionQuality, WEIGHTS };
