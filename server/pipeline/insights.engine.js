const { FLOATING_SOULS_THRESHOLD, PHASES } = require('../utils/constants');
const { formatTime } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Actionable Insights Engine (Module 2.5)
 *
 * Analyzes the outputs of all four modules and generates 3–5 plain-language
 * "Insight Cards" prioritised by the magnitude of the mathematical leak.
 *
 * Each insight has:
 *   - severity  : 'critical' | 'warning' | 'info'
 *   - module    : which module it relates to
 *   - title     : short headline
 *   - detail    : plain-English explanation with numbers
 *   - impact    : estimated score-point impact
 */

function generateInsights(economyResult, itemizationResult, combatResult, objectivesResult) {
  logger.debug('Generating insight cards');

  const insights = [];

  // ---- Economy Insights ----
  insightsFromEconomy(economyResult, insights);

  // ---- Itemization Insights ----
  insightsFromItemization(itemizationResult, insights);

  // ---- Combat Insights ----
  insightsFromCombat(combatResult, insights);

  // ---- Objectives Insights ----
  insightsFromObjectives(objectivesResult, insights);

  // Sort by impact descending, take top 5
  insights.sort((a, b) => b.impact - a.impact);
  const topInsights = insights.slice(0, 5);

  logger.info(`Generated ${topInsights.length} insight cards`);
  return topInsights;
}

// ----------------------------------------------------------------
// Module-specific insight generators
// ----------------------------------------------------------------

function insightsFromEconomy(eco, insights) {
  if (!eco) return;

  // Stagnation windows
  if (eco.stagnationWindows && eco.stagnationWindows.length > 0) {
    const worst = eco.stagnationWindows.reduce((a, b) =>
      b.durationSeconds > a.durationSeconds ? b : a
    );
    insights.push({
      severity: worst.durationSeconds > 180 ? 'critical' : 'warning',
      module: 'economy',
      title: 'Farming Stagnation Detected',
      detail: `Your soul income dropped significantly between ${worst.startFormatted} and ${worst.endFormatted} (${Math.round(worst.durationSeconds / 60)} minutes). Focus on keeping lane pressure or rotating to neutral camps during downtime.`,
      impact: Math.min(worst.durationSeconds / 10, 20),
    });
  }

  // Low average SPM
  if (eco.averageSpm > 0 && eco.averageSpm < 60) {
    insights.push({
      severity: 'warning',
      module: 'economy',
      title: 'Below-Average Farm Rate',
      detail: `Your average SPM was ${eco.averageSpm}. Aim for 80+ by farming neutral camps between fights and minimising idle time.`,
      impact: 15,
    });
  }

  // Low deny rate
  if (eco.laningDenyRate < 15 && eco.laningDenyRate > 0) {
    insights.push({
      severity: 'info',
      module: 'economy',
      title: 'Low Soul Deny Rate',
      detail: `You denied only ${eco.laningDenyRate}% of contested souls in lane. Practice last-hitting denies to starve your opponent.`,
      impact: 8,
    });
  }
}

function insightsFromItemization(item, insights) {
  if (!item) return;

  // Floating souls
  if (item.floatingSoulsEvents && item.floatingSoulsEvents.length > 0) {
    const totalFloat = item.floatingSoulsEvents.reduce(
      (sum, e) => sum + (e.durationSeconds || 0),
      0
    );
    const peakSouls = Math.max(...item.floatingSoulsEvents.map((e) => e.peakSouls || 0), 0);

    if (totalFloat > 60) {
      insights.push({
        severity: totalFloat > 180 ? 'critical' : 'warning',
        module: 'itemization',
        title: 'Floating Souls — Unspent Gold',
        detail: `You held over ${FLOATING_SOULS_THRESHOLD.toLocaleString()} unspent souls for ${Math.round(totalFloat / 60)} minutes outside of base. You likely took teamfights without your next power spike. Return to base or plan item purchases proactively.`,
        impact: Math.min(totalFloat / 15, 25),
      });
    }
  }

  // Late core items
  if (item.coreItemTimings) {
    if (item.coreItemTimings.first3k && item.coreItemTimings.first3k.timeSeconds > 600) {
      insights.push({
        severity: 'warning',
        module: 'itemization',
        title: 'Delayed 3K Item Timing',
        detail: `Your first 3,000-soul item came at ${item.coreItemTimings.first3k.timeFormatted}. Top players average this by 8:00. Optimise your early-game farming route.`,
        impact: 12,
      });
    }
  }
}

function insightsFromCombat(combat, insights) {
  if (!combat) return;

  // Dead-time penalty
  if (combat.deadTimePenalty && combat.deadTimePenalty.totalDeadSeconds > 90) {
    insights.push({
      severity: combat.deadTimePenalty.totalDeadSeconds > 180 ? 'critical' : 'warning',
      module: 'combat',
      title: 'Excessive Death Time',
      detail: combat.deadTimePenalty.lostFarmDescription,
      impact: Math.min(combat.deadTimePenalty.totalDeadSeconds / 10, 20),
    });
  }

  // Low teamfight participation
  if (
    combat.teamfightParticipation &&
    combat.teamfightParticipation.participationPercent < 40 &&
    combat.teamfightParticipation.totalTeamKills > 5
  ) {
    insights.push({
      severity: 'warning',
      module: 'combat',
      title: 'Low Teamfight Participation',
      detail: `You participated in only ${combat.teamfightParticipation.participationPercent}% of team kills. If your team is fighting, be there — or ensure your split-push generates equivalent value.`,
      impact: 15,
    });
  }

  // High poke damage ratio
  if (
    combat.damageTakenBreakdown &&
    combat.damageTakenBreakdown.pokeRatio > 0.4 &&
    combat.damageTakenBreakdown.totalDamageTaken > 2000
  ) {
    insights.push({
      severity: 'warning',
      module: 'combat',
      title: 'Poor Pre-Fight Positioning',
      detail: `${Math.round(combat.damageTakenBreakdown.pokeRatio * 100)}% of the damage you received was outside teamfights. Avoid unnecessary poke trades and position more carefully before engagements.`,
      impact: 10,
    });
  }
}

function insightsFromObjectives(obj, insights) {
  if (!obj) return;

  // Low objective damage
  if (obj.objectiveDamageShare && obj.objectiveDamageShare.sharePercent < 10) {
    insights.push({
      severity: 'info',
      module: 'objectives',
      title: 'Low Objective Contribution',
      detail: `You contributed only ${obj.objectiveDamageShare.sharePercent}% of your team's total objective damage. Prioritise hitting structures when your team secures map control.`,
      impact: 10,
    });
  }

  // Missing Mid Boss
  if (
    obj.midBossPresence &&
    obj.midBossPresence.events &&
    obj.midBossPresence.events.length > 0 &&
    !obj.midBossPresence.wasPresent
  ) {
    insights.push({
      severity: 'critical',
      module: 'objectives',
      title: 'Absent From Mid Boss',
      detail: `Mid Boss was contested ${obj.midBossPresence.events.length} time(s) and you were not present. Mid Boss is a game-deciding objective — always rotate when it's in play.`,
      impact: 18,
    });
  }
}

module.exports = { generateInsights };
