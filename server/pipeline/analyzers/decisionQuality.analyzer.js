const { clamp } = require('../../utils/helpers');

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

const WEIGHTS = {
  engagement: 0.22,
  farm: 0.18,
  deathSeverity: 0.18,
  objective: 0.14,
  build: 0.14,
  adaptation: 0.14,
};

function scoreEngagement({ combat, playerStats }) {
  const positioning = playerStats?.positioningScore ?? null;
  if (positioning != null) return clamp(positioning, 0, 100);
  // Fallback: damage dealt per death ratio
  const kda = combat?.kda ?? 0;
  return clamp(40 + kda * 10, 0, 100);
}

function scoreFarm({ rankBenchmarks, itemization }) {
  const spmScore = rankBenchmarks?.comparisons?.find((c) => c.metric === 'Souls / Min')?.score;
  if (typeof spmScore === 'number') return spmScore;
  // Fallback: absolute SPM
  const spm = itemization?.soulsPerMin || 0;
  return clamp(Math.round(((spm - 300) / 400) * 60 + 40), 0, 100);
}

function scoreDeathSeverity({ combat, matchupDifficulty }) {
  const dpm = combat?.deathsPerMin ?? 0;
  // Expected deaths per minute scales with difficulty (harder = more acceptable)
  const difficultyAdj = matchupDifficulty?.difficulty === 'extreme' ? 1.3
    : matchupDifficulty?.difficulty === 'hard' ? 1.15
    : matchupDifficulty?.difficulty === 'easy' ? 0.85
    : 1.0;
  const expected = 0.28 * difficultyAdj; // ~1 death every 3.5 min is average
  // Lower DPM than expected = higher score
  const ratio = expected > 0 ? expected / Math.max(dpm, 0.05) : 1;
  return clamp(Math.round(40 + Math.log2(clamp(ratio, 0.25, 4)) * 25), 0, 100);
}

function scoreObjective({ playerStats, rankBenchmarks }) {
  const objDmg = playerStats?.objectiveDamage;
  const objScore = rankBenchmarks?.comparisons?.find((c) => c.metric === 'Objective Damage')?.score;
  if (typeof objScore === 'number') return objScore;
  if (objDmg == null) return 50;
  return clamp(Math.round(((objDmg - 3000) / 8000) * 60 + 40), 0, 100);
}

function scoreBuild({ buildPath }) {
  return typeof buildPath?.score === 'number' ? buildPath.score : 50;
}

function scoreAdaptation({ matchupDifficulty, combat, heroPerformance }) {
  const hp = heroPerformance?.score ?? combat?.score ?? 50;
  const d = matchupDifficulty?.difficulty;
  // Reward strong performance in hard matchups, penalize weak performance in easy ones.
  if (d === 'extreme') return clamp(hp + 12, 0, 100);
  if (d === 'hard') return clamp(hp + 6, 0, 100);
  if (d === 'easy') return clamp(hp - 4, 0, 100);
  return hp;
}

function classifyGrade(score) {
  if (score >= 90) return { grade: 'S', label: 'Exceptional decisions' };
  if (score >= 80) return { grade: 'A', label: 'Strong decisions' };
  if (score >= 70) return { grade: 'B', label: 'Solid decisions' };
  if (score >= 60) return { grade: 'C', label: 'Mixed decisions' };
  if (score >= 45) return { grade: 'D', label: 'Below-average decisions' };
  return { grade: 'F', label: 'Poor decisions' };
}

function keyFindings(parts) {
  const findings = [];
  for (const [key, value] of Object.entries(parts)) {
    if (value >= 80) findings.push({ type: 'strength', area: key, score: value });
    else if (value <= 40) findings.push({ type: 'weakness', area: key, score: value });
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
