const logger = require('../utils/logger');

/**
 * Actionable Insights Engine v2 — Post-Match Improvement Platform
 *
 * Generates interpreted match intelligence centered on Deadlock-specific gameplay:
 *   • Soul timing & power spike windows
 *   • Map movement & rotation quality
 *   • Fight timing & decision quality
 *   • Item timing efficiency
 *
 * Answers three questions better than competitors:
 *   1. What happened in this match?
 *   2. Why did I win or lose?
 *   3. What should I change next game?
 *
 * Insight shape:
 *   severity     : 'critical' | 'warning' | 'info' | 'positive'
 *   module       : which gameplay dimension it relates to
 *   category     : 'soulTiming' | 'powerSpike' | 'mapMovement' | 'fightTiming' | 'decisionQuality'
 *   title        : short headline
 *   detail       : plain-English explanation with numbers
 *   action       : specific, actionable change for next game
 *   impact       : estimated score-point impact (drives sort)
 *   timestamp    : optional match phase reference (early/mid/late)
 */

function generateInsights(heroPerf, itemization, combat, benchmarks, meta = {}) {
  logger.debug('Generating insight cards v2');

  const insights = [];

  // Core gameplay intelligence layers
  analyzeSoulTiming(heroPerf, itemization, meta, insights);
  analyzePowerSpikes(itemization, meta, insights);
  analyzeMapMovement(heroPerf, meta, insights);
  analyzeFightTiming(combat, meta, insights);
  analyzeDecisionQuality(heroPerf, combat, benchmarks, meta, insights);

  // Sort by impact (highest first) to surface most critical improvements
  insights.sort((a, b) => b.impact - a.impact);
  const top = insights.slice(0, 6);
  logger.info(`Generated ${top.length} insight cards`);
  return top;
}

// ----------------------------------------------------------------
// Deadlock-Specific Gameplay Intelligence Layers
// ----------------------------------------------------------------

/**
 * Soul Timing Analysis
 * Evaluates farm pace against Deadlock-specific benchmarks and power spike windows.
 */
function analyzeSoulTiming(heroPerf, itemization, meta, insights) {
  if (!heroPerf || !itemization) return;

  const soulsPerMin = heroPerf.soulsPerMin || itemization.soulsPerMin || 0;
  const duration = meta?.duration || 0;
  const durationMin = duration > 0 ? duration / 60 : 0;

  // Early game soul window (0-10 min): critical for power spike timing
  if (durationMin >= 10 && soulsPerMin > 0) {
    if (soulsPerMin < 350) {
      insights.push({
        severity: 'critical',
        module: 'economy',
        category: 'soulTiming',
        timestamp: 'early',
        title: 'Lost Early Soul Window',
        detail: `At ${soulsPerMin} souls/min, you fell behind the 400+ souls/min benchmark needed for timely power spikes. In Deadlock, falling 1k+ souls behind by minute 10 cascades into lost lane priority.`,
        action: 'Next game: Prioritize last-hits over trades in lane. Use abilities to secure creeps, not harass. Rotate to jungle camps between waves.',
        impact: 28,
      });
    } else if (soulsPerMin >= 400 && soulsPerMin < 550) {
      insights.push({
        severity: 'warning',
        module: 'economy',
        category: 'soulTiming',
        timestamp: 'early',
        title: 'Acceptable Soul Pace, Room to Improve',
        detail: `${soulsPerMin} souls/min is adequate but below the 600+ benchmark for strong cores. You're leaving ~2-3k souls on the table per 10-minute window.`,
        action: 'Next game: Track your soul count at 5-min intervals. Target 3k by min 5, 6k by min 10. Use downtime between fights to clear jungle.',
        impact: 15,
      });
    } else if (soulsPerMin >= 650) {
      insights.push({
        severity: 'positive',
        module: 'economy',
        category: 'soulTiming',
        timestamp: 'early',
        title: 'Elite Soul Timing',
        detail: `${soulsPerMin} souls/min puts you in the top 15% of players. This economy pace lets you hit power spikes 2-3 minutes ahead of opponents.`,
        action: 'Keep prioritizing farm patterns. Consider sharing jungle rotations with supports once you hit core items.',
        impact: 0,
      });
    }
  }
}

/**
 * Power Spike Analysis
 * Evaluates item timing efficiency and whether key items were completed in impactful windows.
 */
function analyzePowerSpikes(itemization, meta, insights) {
  if (!itemization) return;

  const soulsPerMin = itemization.soulsPerMin || 0;
  const netWorth = itemization.netWorth || 0;
  const items = itemization.items || [];
  const duration = meta?.duration || 0;
  const durationMin = duration > 0 ? duration / 60 : 0;

  // Identify power spike delays based on net worth efficiency
  if (netWorth > 0 && durationMin > 0) {
    const expectedNetWorth = durationMin * 550; // Benchmark: 550 souls/min average
    const netWorthRatio = netWorth / expectedNetWorth;

    if (netWorthRatio < 0.75 && durationMin >= 20) {
      insights.push({
        severity: 'critical',
        module: 'itemization',
        category: 'powerSpike',
        timestamp: durationMin < 25 ? 'mid' : 'late',
        title: 'Delayed Power Spikes',
        detail: `Your net worth (${netWorth}) is ${(100 - netWorthRatio * 100).toFixed(0)}% below expected for a ${durationMin.toFixed(0)}-minute game. This suggests missed farm windows or inefficient item purchases.`,
        action: 'Next game: Build toward ONE power spike item (e.g., Spirit Accumulator, Kinetic Field) before branching. Avoid buying multiple cheap items—save for completed upgrades.',
        impact: 25,
      });
    } else if (netWorthRatio >= 1.1 && durationMin >= 15) {
      insights.push({
        severity: 'positive',
        module: 'itemization',
        category: 'powerSpike',
        timestamp: durationMin < 25 ? 'mid' : 'late',
        title: 'Ahead on Power Timeline',
        detail: `Net worth ${Math.round((netWorthRatio - 1) * 100)}% above expected. You're hitting item timings ahead of schedule, creating pressure windows.`,
        action: 'Use your item advantage to force objectives. Group with team and take barrels/mid before enemy cores catch up.',
        impact: 0,
      });
    }
  }

  // Item build coherence check (if we have item data)
  if (items.length > 0 && items.length < 4 && durationMin >= 25) {
    insights.push({
      severity: 'warning',
      module: 'itemization',
      category: 'powerSpike',
      timestamp: 'late',
      title: 'Incomplete Core Build',
      detail: `Only ${items.length} items by ${durationMin.toFixed(0)} minutes suggests either deaths interrupting farm or suboptimal item choices. Strong cores typically complete 5-6 items by this point.`,
      action: 'Next game: Plan your build path before the match. Identify 3 core items for your hero and prioritize them. Sell early-game consumables once you can afford upgrades.',
      impact: 18,
    });
  }
}

/**
 * Map Movement Analysis
 * Infers rotation quality and lane presence from KDA patterns and soul efficiency.
 */
function analyzeMapMovement(heroPerf, meta, insights) {
  if (!heroPerf) return;

  const matchKda = heroPerf.matchKda || 0;
  const deaths = heroPerf.deaths || 0;
  const assists = heroPerf.assists || 0;
  const soulsPerMin = heroPerf.soulsPerMin || 0;
  const won = meta?.won;

  // High deaths + low souls = poor map positioning
  if (deaths > 8 && soulsPerMin > 0 && soulsPerMin < 450) {
    insights.push({
      severity: 'critical',
      module: 'combat',
      category: 'mapMovement',
      timestamp: 'all',
      title: 'Poor Map Positioning',
      detail: `${deaths} deaths combined with only ${soulsPerMin} souls/min indicates you died while farming or rotated unsafely. Every death costs ~15-20 seconds of farm time.`,
      action: "Next game: Assume every bush has an enemy until proven safe. Farm toward your team's side of the map. Use teleport to escape ganks, not just to initiate.",
      impact: 22,
    });
  }

  // Low assists relative to team kills suggests isolation
  if (matchKda > 0 && assists < 5 && heroPerf.kills > 5) {
    insights.push({
      severity: 'warning',
      module: 'combat',
      category: 'mapMovement',
      timestamp: 'mid',
      title: 'Playing Too Isolated',
      detail: `High kills (${heroPerf.kills}) but low assists (${assists}) suggests you're fighting alone rather than with your team. Deadlock rewards coordinated pushes over solo plays.`,
      action: 'Next game: After laning phase, stick with 1-2 teammates. Group for mid-lane pushes and barrel contests. Solo farm only when you have vision control.',
      impact: 16,
    });
  }

  // Positive: good balance of farm and fights
  if (soulsPerMin >= 550 && assists >= 8 && deaths <= 5) {
    insights.push({
      severity: 'positive',
      module: 'combat',
      category: 'mapMovement',
      timestamp: 'all',
      title: 'Strong Rotation Balance',
      detail: `${soulsPerMin} souls/min with ${assists} assists shows you farmed efficiently while being present for team fights. This is the ideal core play pattern.`,
      action: 'Continue rotating between farm and fights. Watch the minimap every 10 seconds to identify when your presence matters most.',
      impact: 0,
    });
  }
}

/**
 * Fight Timing Analysis
 * Evaluates engagement quality, death patterns, and fight participation.
 */
function analyzeFightTiming(combat, meta, insights) {
  if (!combat) return;

  const kda = combat.kda || 0;
  const deaths = combat.deaths || 0;
  const kills = combat.kills || 0;
  const damagePerMin = combat.damagePerMin || 0;
  const deathsPerMin = combat.deathsPerMin || 0;
  const duration = meta?.duration || 0;
  const durationMin = duration > 0 ? duration / 60 : 0;

  // Death clustering analysis (inferring from deathsPerMin)
  if (deathsPerMin > 0.5 && deaths > 7) {
    insights.push({
      severity: 'critical',
      module: 'combat',
      category: 'fightTiming',
      timestamp: deathsPerMin > 0.7 ? 'early' : 'mid',
      title: 'Dying in Lost Fights',
      detail: `${deathsPerMin.toFixed(2)} deaths/min means you died roughly every ${Math.round(60 / deathsPerMin)} seconds. This pattern suggests fighting unwinnable battles or chasing kills too deep.`,
      action: 'Next game: Disengage immediately when a teammate dies in a 2v3+ situation. Respect enemy power spikes—if they just completed a major item, avoid fights for 30-60 seconds.',
      impact: 24,
    });
  }

  // Low damage output suggests poor fight positioning or wrong engagements
  if (damagePerMin > 0 && damagePerMin < 600 && durationMin >= 20) {
    insights.push({
      severity: 'warning',
      module: 'combat',
      category: 'fightTiming',
      timestamp: 'mid',
      title: 'Missing Fight Impact',
      detail: `Only ${damagePerMin} damage/min in a ${durationMin.toFixed(0)}-minute game. Either you're joining fights too late, dying before dealing damage, or building the wrong items for your role.`,
      action: "Next game: Position behind your frontline before fights start. Focus fire the same target as your team. If you're a support, build utility items that let you contribute without needing damage stats.",
      impact: 17,
    });
  }

  // Positive: strong fight presence
  if (kda >= 3 && damagePerMin >= 900 && deaths <= 4) {
    insights.push({
      severity: 'positive',
      module: 'combat',
      category: 'fightTiming',
      timestamp: 'all',
      title: 'Dominant Fight Presence',
      detail: `${kda} KDA with ${damagePerMin} damage/min shows you're winning fights consistently. You're either out-farming opponents or out-positioning them in engagements.`,
      action: 'Capitalize on this advantage. Force fights when you have item completion timing. Push for high-ground before enemy cores can recover.',
      impact: 0,
    });
  }
}

/**
 * Decision Quality Analysis
 * Synthesizes all data to evaluate macro decisions and strategic errors.
 */
function analyzeDecisionQuality(heroPerf, combat, benchmarks, meta, insights) {
  if (!heroPerf || !combat) return;

  const won = meta?.won;
  const matchKda = heroPerf.matchKda || 0;
  const soulsPerMin = heroPerf.soulsPerMin || 0;
  const kdaDiff = benchmarks?.kdaDiff || 0;
  const benchmarkKda = benchmarks?.benchmarkKda || 0;

  // Loss analysis: identify the most likely cause
  if (won === false) {
    if (soulsPerMin < 400 && combat.deaths > 8) {
      insights.push({
        severity: 'critical',
        module: 'heroPerformance',
        category: 'decisionQuality',
        timestamp: 'all',
        title: 'Compound Errors: Farm + Deaths',
        detail: `This loss traces to two compounding issues: low farm (${soulsPerMin} souls/min) and excessive deaths (${combat.deaths}). One mistake is recoverable; both together create an insurmountable deficit.`,
        action: 'Next game: Pick ONE focus area. Either commit to safe farming (accept fewer fights) OR commit to aggressive play (accept some deaths). Trying both half-way leads to losses like this.',
        impact: 30,
      });
    } else if (soulsPerMin >= 500 && combat.deaths <= 6) {
      insights.push({
        severity: 'info',
        module: 'heroPerformance',
        category: 'decisionQuality',
        timestamp: 'late',
        title: 'Strong Personal Game, Team Loss',
        detail: `You performed well individually (${soulsPerMin} souls/min, ${combat.deaths} deaths) but still lost. This suggests either a skill gap on other lanes or a strategic mismatch in team compositions.`,
        action: `Review the replay from your teammates' perspectives. Identify where the game was actually lost—often it's a lane you weren't watching. Consider queuing with a stack to coordinate better.`,
        impact: 5,
      });
    } else if (kdaDiff < -2 && benchmarkKda > 0) {
      insights.push({
        severity: 'warning',
        module: 'heroPerformance',
        category: 'decisionQuality',
        timestamp: 'all',
        title: 'Below Your Standard on Familiar Hero',
        detail: `Your KDA (${matchKda}) is ${Math.abs(kdaDiff).toFixed(1)} below your career average (${benchmarkKda}) on this hero. This wasn't a bad matchup—it was uncharacteristic decision-making.`,
        action: "Watch your own replay focusing on deaths. For each death, ask: \"Was this necessary for an objective?\" If not, that's a decision to eliminate next game.",
        impact: 20,
      });
    }
  }

  // Win analysis: reinforce good decisions
  if (won === true && soulsPerMin >= 600 && matchKda >= 3) {
    insights.push({
      severity: 'positive',
      module: 'heroPerformance',
      category: 'decisionQuality',
      timestamp: 'all',
      title: 'Textbook Win Condition Execution',
      detail: `This is a masterclass in core play: ${soulsPerMin} souls/min funded your items, ${matchKda} KDA shows fight dominance, and the win confirms correct macro decisions.`,
      action: `Save this replay as a reference. Note your item timings, rotation patterns, and when you chose to fight vs. farm. Replicate this decision framework on similar heroes.`,
      impact: 0,
    });
  }

  // Close game analysis
  const duration = meta?.duration || 0;
  const durationMin = duration > 0 ? duration / 60 : 0;
  if (durationMin >= 35 && Math.abs(soulsPerMin - 500) < 100) {
    insights.push({
      severity: 'info',
      module: 'heroPerformance',
      category: 'decisionQuality',
      timestamp: 'late',
      title: 'Evenly Matched Late Game',
      detail: `A ${durationMin.toFixed(0)}-minute game with even soul parity suggests both teams made similar mistakes. The win/loss came down to one or two decisive moments.`,
      action: 'Identify the turning point: usually a team fight around Roshan/Barrel or a high-ground push. In close games, single decisions matter more than overall performance.',
      impact: 8,
    });
  }
}

module.exports = { generateInsights };
