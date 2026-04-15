const { analyzeEconomy } = require('./economy.analyzer');
const { analyzeItemization } = require('./itemization.analyzer');
const { analyzeCombat } = require('./combat.analyzer');
const { analyzeObjectives } = require('./objectives.analyzer');
const { generateInsights } = require('./insights.engine');
const { computeOverallScore } = require('./scoring.engine');
const logger = require('../utils/logger');

/**
 * Master ETL Pipeline
 *
 * Orchestrates the full analysis flow:
 *   1. Run all four module analyzers on the parsed demo data
 *   2. Feed module results into the Insights Engine
 *   3. Compute the overall Impact Score
 *   4. Return a single JSON payload ready for the frontend
 *
 * @param {Object} parsedData      Normalised data from parser.service
 * @param {string} playerSteamId   The Steam ID of the player to analyze
 * @param {Object} matchInfo       Match metadata from the Deadlock API
 * @returns {Object}               Complete analysis payload
 */
async function runPipeline(parsedData, playerSteamId, matchInfo = {}) {
  logger.info(`Starting analysis pipeline for player ${playerSteamId}`);
  const startTime = Date.now();

  // Determine hero role from match info (default: flex)
  const playerInfo = findPlayerInMatch(matchInfo, playerSteamId);
  const heroRole = playerInfo?.role || 'flex';

  // ---- Module 1: Economy ----
  const economy = analyzeEconomy(parsedData, playerSteamId, heroRole);

  // ---- Module 2: Itemization ----
  const itemization = analyzeItemization(parsedData, playerSteamId);

  // ---- Module 3: Combat ----
  const combat = analyzeCombat(parsedData, playerSteamId);

  // ---- Module 4: Objectives ----
  const objectives = analyzeObjectives(parsedData, playerSteamId);

  // ---- Insights ----
  const insights = generateInsights(economy, itemization, combat, objectives);

  // ---- Overall Score ----
  const overall = computeOverallScore({
    economy: economy.score,
    itemization: itemization.score,
    combat: combat.score,
    objectives: objectives.score,
  });

  const elapsed = Date.now() - startTime;
  logger.info(`Pipeline complete in ${elapsed}ms`);

  return {
    meta: {
      matchId: matchInfo.match_id || matchInfo.matchId || null,
      playerSteamId,
      heroName: playerInfo?.heroName || 'Unknown',
      heroRole,
      duration: parsedData.matchMeta?.durationSeconds || 0,
      mapName: parsedData.matchMeta?.mapName || 'unknown',
      analyzedAt: new Date().toISOString(),
      pipelineMs: elapsed,
    },
    overall,
    modules: {
      economy,
      itemization,
      combat,
      objectives,
    },
    insights,
  };
}

/**
 * Locate the target player within the match info payload.
 */
function findPlayerInMatch(matchInfo, steamId) {
  if (!matchInfo || !matchInfo.players) return null;

  return matchInfo.players.find(
    (p) =>
      p.account_id?.toString() === steamId?.toString() ||
      p.steam_id?.toString() === steamId?.toString()
  ) || null;
}

module.exports = { runPipeline };
