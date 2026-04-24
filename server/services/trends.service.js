const { supabase } = require('../utils/supabase');
const logger = require('../utils/logger');

/**
 * Calculates a linear trendline slope to determine if a stat is improving or declining.
 * Y = values (e.g., KDA), X = time/match index (0 to N)
 * Positive slope = improving over time (since we process oldest to newest)
 */
function calculateTrendSlug(values) {
  if (!values || values.length < 2) return 'stable';
  
  // Convert from latest->oldest to oldest->latest for logical time progression
  const ordered = [...values].reverse();
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const n = ordered.length;
  
  ordered.forEach((y, x) => {
    sumX += x;
    sumY += y;
    sumXY += (x * y);
    sumX2 += (x * x);
  });
  
  const denominator = (n * sumX2) - (sumX * sumX);
  if (denominator === 0) return 'stable';
  
  const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
  
  // Meaningful threshold for 'improving' or 'declining'
  const average = sumY / n;
  if (!Number.isFinite(average) || average === 0) return 'stable';
  const percentageChangePerMatch = (slope / average) * 100;
  
  if (percentageChangePerMatch > 1) return 'improving';
  if (percentageChangePerMatch < -1) return 'declining';
  return 'stable';
}

/**
 * Generates an aggregated trend report for a specific player based on their cached analyses
 * @param {string} accountId 
 * @param {number} limit Number of recent matches to analyze (default 10)
 */
async function getPlayerProfileTrends(accountId, limit = 10) {
  try {
    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('match_id, data, updated_at')
      .eq('account_id', Number(accountId))
      .order('match_id', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error(`[Trends] Failed to fetch analyses for account ${accountId}: ${error.message}`);
      throw error;
    }

    if (!analyses || analyses.length === 0) {
      return { 
        available: false, 
        message: 'Not enough analyzed matches to generate trends.' 
      };
    }

    // Arrays to hold timeline data (ordered newest to oldest)
    const timeline = [];
    const scores = [];
    const kdas = [];
    const spms = [];
    
    let totalWins = 0;
    let decidedMatches = 0;
    let validMatches = 0;

    analyses.forEach((analysis) => {
      const data = analysis.data;
      if (!data || !data.modules) return;

      const score = data.overall?.impactScore ?? data.overall?.score ?? 0;
      const kda = data.modules.combat?.kda || 0;
      const spm = data.modules.itemization?.soulsPerMin || 0;
      const won = typeof data.meta?.won === 'boolean' ? data.meta.won : null;

      if (won === true) totalWins++;
      if (won !== null) decidedMatches++;
      
      timeline.push({
        matchId: String(analysis.match_id),
        date: analysis.updated_at,
        score,
        kda,
        spm,
        heroId: data.meta?.heroId,
        heroName: data.meta?.heroName,
        won
      });

      scores.push(score);
      kdas.push(kda);
      spms.push(spm);
      validMatches++;
    });

    if (validMatches < 3) {
      return {
        available: true,
        insufficientData: true,
        message: 'Analyze more matches to see long-term trends.',
        matchesAnalyzed: validMatches,
        timeline: timeline.reverse() // send oldest to newest for charts
      };
    }

    // Compute averages
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / validMatches);
    const avgKda = Math.round((kdas.reduce((a, b) => a + b, 0) / validMatches) * 10) / 10;
    const avgSpm = Math.round(spms.reduce((a, b) => a + b, 0) / validMatches);
    const winrate = decidedMatches > 0 ? Math.round((totalWins / decidedMatches) * 100) : null;

    // Compute trends
    const scoreTrend = calculateTrendSlug(scores);
    const kdaTrend = calculateTrendSlug(kdas);
    const spmTrend = calculateTrendSlug(spms);

    return {
      available: true,
      insufficientData: false,
      matchesAnalyzed: validMatches,
      averages: {
        score: avgScore,
        kda: avgKda,
        spm: avgSpm,
        winrate
      },
      trends: {
        score: scoreTrend,
        kda: kdaTrend,
        spm: spmTrend
      },
      timeline: timeline.reverse() // ordered oldest (index 0) to newest for charts
    };

  } catch (err) {
    logger.error(`[Trends] Exception aggregating profile for ${accountId}: ${err.message}`);
    throw err;
  }
}

module.exports = {
  calculateTrendSlug,
  getPlayerProfileTrends
};
