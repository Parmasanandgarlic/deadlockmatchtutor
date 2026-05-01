const logger = require('../utils/logger');

/**
 * Actionable Insights Engine v3 — Match-Event-Grounded Coaching
 *
 * UPGRADE from v2: Insights are now tied to specific match events and data
 * points from the full module suite, not just aggregate stats. Each insight
 * references what happened, when it happened, and what to do differently.
 *
 * New capabilities:
 *   • Matchup-aware insights (references specific enemy heroes)
 *   • Build-path intelligence (item timing + meta context)
 *   • Temporal trend warnings (declining/improving performance)
 *   • Decision quality linkage (ties deaths to specific game states)
 *   • Meta context injection (hero tier, win rate at rank, optimal builds)
 *
 * Insight shape:
 *   severity     : 'critical' | 'warning' | 'info' | 'positive'
 *   module       : which gameplay dimension it relates to
 *   category     : 'soulTiming' | 'powerSpike' | 'mapMovement' | 'fightTiming' |
 *                  'decisionQuality' | 'metaContext' | 'matchupAwareness' | 'buildPath' | 'trend'
 *   title        : short headline
 *   detail       : plain-English explanation with specific numbers and timestamps
 *   action       : specific, actionable change for next game
 *   impact       : estimated score-point impact (drives sort)
 *   timestamp    : match phase reference (early/mid/late/all)
 *   evidence     : { type, data } — the specific match event backing this insight
 */

function generateInsights(heroPerf, itemization, combat, benchmarks, meta = {}) {
  logger.debug('Generating insight cards v3');

  const insights = [];

  // Core gameplay intelligence layers
  analyzeSoulTiming(heroPerf, itemization, meta, insights);
  analyzePowerSpikes(itemization, meta, insights);
  analyzeMapMovement(heroPerf, meta, insights);
  analyzeFightTiming(combat, meta, insights);
  analyzeDecisionQuality(heroPerf, combat, benchmarks, meta, insights);

  // Event-grounded layers using full module data
  analyzeMatchupContext(meta, insights);
  analyzeBuildPathInsights(meta, insights);
  analyzeTemporalTrends(meta, insights);
  analyzeMetaContext(meta, insights);

  // Win Condition insight — the single biggest factor that decided the game
  synthesizeWinCondition(heroPerf, combat, itemization, benchmarks, meta, insights);

  // Assign tiers for frontend grouping
  for (const insight of insights) {
    if (insight.severity === 'critical') {
      insight.tier = 'must-fix';
    } else if (insight.severity === 'warning') {
      insight.tier = 'optimize';
    } else {
      insight.tier = 'context';
    }
  }

  // Smart cap: return ALL critical + warning insights, plus top 3 info/positive.
  // This ensures no critical coaching is ever dropped.
  insights.sort((a, b) => b.impact - a.impact);
  const mustFix = insights.filter(i => i.tier === 'must-fix');
  const optimize = insights.filter(i => i.tier === 'optimize');
  const context = insights.filter(i => i.tier === 'context').slice(0, 3);
  const result = [...mustFix, ...optimize, ...context];

  logger.info(`Generated ${result.length} insight cards (${mustFix.length} critical, ${optimize.length} warning, ${context.length} context)`);
  return result;
}

// ----------------------------------------------------------------
// Core Gameplay Intelligence (Enhanced with event evidence)
// ----------------------------------------------------------------

function analyzeSoulTiming(heroPerf, itemization, meta, insights) {
  if (!heroPerf || !itemization) return;

  const soulsPerMin = heroPerf.soulsPerMin || itemization.soulsPerMin || 0;
  const duration = meta?.duration || 0;
  const durationMin = duration > 0 ? duration / 60 : 0;
  const heroName = meta?.heroName || 'your hero';
  const roleBenchmark = meta?.roleBenchmarks?.soulsPerMin;

  if (durationMin >= 10 && soulsPerMin > 0) {
    // Use role-specific benchmarks when available
    const goodThreshold = roleBenchmark?.excellent || 600;
    const poorThreshold = roleBenchmark?.poor || 350;

    if (soulsPerMin < poorThreshold) {
      const deficit = Math.round((poorThreshold - soulsPerMin) * durationMin);
      insights.push({
        severity: 'critical',
        module: 'economy',
        category: 'soulTiming',
        timestamp: 'early',
        title: 'Lost Early Soul Window',
        detail: `At ${soulsPerMin} souls/min, you fell ${deficit} souls behind the ${poorThreshold}+ benchmark for ${heroName}'s role. ` +
          `By minute ${Math.min(10, Math.floor(durationMin))}, this deficit cascaded into delayed power spikes and lost lane priority.`,
        action: `Next game on ${heroName}: Prioritize last-hits over trades in the first 10 minutes. Clear the nearest jungle camp between every wave. Target ${poorThreshold}+ souls/min.`,
        impact: 28,
        evidence: { type: 'stat', data: { soulsPerMin, threshold: poorThreshold, deficit } },
      });
    } else if (soulsPerMin >= 400 && soulsPerMin < goodThreshold) {
      insights.push({
        severity: 'warning',
        module: 'economy',
        category: 'soulTiming',
        timestamp: 'early',
        title: 'Acceptable Farm, Room to Improve',
        detail: `${soulsPerMin} souls/min is adequate but ${goodThreshold - soulsPerMin} below the top-quartile benchmark (${goodThreshold}) for ${heroName}'s role. ` +
          `You're leaving ~${Math.round((goodThreshold - soulsPerMin) * durationMin)} souls on the table.`,
        action: `Track your soul count at 5-min intervals. Target ${Math.round(goodThreshold * 5 / 60)}k by min 5, ${Math.round(goodThreshold * 10 / 60)}k by min 10. Use downtime between fights to clear jungle.`,
        impact: 15,
        evidence: { type: 'stat', data: { soulsPerMin, target: goodThreshold } },
      });
    } else if (soulsPerMin >= goodThreshold) {
      insights.push({
        severity: 'positive',
        module: 'economy',
        category: 'soulTiming',
        timestamp: 'early',
        title: 'Elite Soul Timing',
        detail: `${soulsPerMin} souls/min puts you above the ${goodThreshold} benchmark for ${heroName}'s role. This economy pace let you hit power spikes 2-3 minutes ahead of opponents.`,
        action: 'Keep prioritizing farm patterns. Consider sharing jungle rotations with supports once you hit core items.',
        impact: 0,
        evidence: { type: 'stat', data: { soulsPerMin, benchmark: goodThreshold } },
      });
    }
  }
}

function analyzePowerSpikes(itemization, meta, insights) {
  if (!itemization) return;

  const soulsPerMin = itemization.soulsPerMin || 0;
  const netWorth = itemization.netWorth || 0;
  const items = itemization.items || [];
  const duration = meta?.duration || 0;
  const durationMin = duration > 0 ? duration / 60 : 0;

  if (netWorth > 0 && durationMin > 0) {
    const expectedNetWorth = durationMin * 550;
    const netWorthRatio = netWorth / expectedNetWorth;

    if (netWorthRatio < 0.75 && durationMin >= 20) {
      const behindBy = Math.round(expectedNetWorth - netWorth);
      insights.push({
        severity: 'critical',
        module: 'itemization',
        category: 'powerSpike',
        timestamp: durationMin < 25 ? 'mid' : 'late',
        title: 'Delayed Power Spikes',
        detail: `Your net worth (${netWorth.toLocaleString()}) is ${behindBy.toLocaleString()} souls behind expected for a ${durationMin.toFixed(0)}-minute game. ` +
          `This means your key items were completed ${Math.round(behindBy / 550)} minutes later than optimal.`,
        action: 'Next game: Build toward ONE power spike item before branching. Avoid buying multiple cheap items—save for completed upgrades.',
        impact: 25,
        evidence: { type: 'economy', data: { netWorth, expected: Math.round(expectedNetWorth), behindBy } },
      });
    } else if (netWorthRatio >= 1.1 && durationMin >= 15) {
      insights.push({
        severity: 'positive',
        module: 'itemization',
        category: 'powerSpike',
        timestamp: durationMin < 25 ? 'mid' : 'late',
        title: 'Ahead on Power Timeline',
        detail: `Net worth ${Math.round((netWorthRatio - 1) * 100)}% above expected. Your items came online ~${Math.round((netWorth - expectedNetWorth) / 550)} minutes early, creating pressure windows.`,
        action: 'Use your item advantage to force objectives. Group with team and take barrels/mid before enemy cores catch up.',
        impact: 0,
        evidence: { type: 'economy', data: { netWorth, expected: Math.round(expectedNetWorth) } },
      });
    }
  }

  if (items.length > 0 && items.length < 4 && durationMin >= 25) {
    insights.push({
      severity: 'warning',
      module: 'itemization',
      category: 'powerSpike',
      timestamp: 'late',
      title: 'Incomplete Core Build',
      detail: `Only ${items.length} items by ${durationMin.toFixed(0)} minutes suggests deaths interrupted your farm or suboptimal item choices. Strong cores typically complete 5-6 items by this point.`,
      action: 'Next game: Plan your 3 core items before the match starts. Sell early consumables once you can afford upgrades.',
      impact: 18,
      evidence: { type: 'build', data: { itemCount: items.length, duration: durationMin } },
    });
  }
}

function analyzeMapMovement(heroPerf, meta, insights) {
  if (!heroPerf) return;

  const deaths = heroPerf.deaths || 0;
  const assists = heroPerf.assists || 0;
  const kills = heroPerf.kills || 0;
  const soulsPerMin = heroPerf.soulsPerMin || 0;
  const duration = meta?.duration || 0;
  const durationMin = duration > 0 ? duration / 60 : 0;

  if (deaths > 8 && soulsPerMin > 0 && soulsPerMin < 450) {
    const avgRespawnSeconds = 10 + (durationMin * 1.5);
    const deathCost = Math.round(deaths * avgRespawnSeconds);
    insights.push({
      severity: 'critical',
      module: 'combat',
      category: 'mapMovement',
      timestamp: 'all',
      title: 'Poor Map Positioning',
      detail: `${deaths} deaths combined with only ${soulsPerMin} souls/min indicates unsafe rotations. ` +
        `Those deaths cost you ~${deathCost} seconds of farm time (${Math.round(deathCost * soulsPerMin / 60)} lost souls).`,
      action: "Next game: Assume every bush has an enemy until proven safe. Farm toward your team's side of the map. Use teleport to escape ganks, not just to initiate.",
      impact: 22,
      evidence: { type: 'deaths', data: { deaths, soulsPerMin, estimatedLostSouls: Math.round(deathCost * soulsPerMin / 60) } },
    });
  }

  if (kills > 5 && assists < 5 && durationMin >= 20) {
    insights.push({
      severity: 'warning',
      module: 'combat',
      category: 'mapMovement',
      timestamp: 'mid',
      title: 'Playing Too Isolated',
      detail: `${kills} kills but only ${assists} assists in ${durationMin.toFixed(0)} minutes suggests solo play. ` +
        `Deadlock rewards coordinated pushes over solo picks—your kills aren't translating into team objectives.`,
      action: 'Next game: After laning phase, stick with 1-2 teammates. Group for mid-lane pushes and barrel contests.',
      impact: 16,
      evidence: { type: 'kda', data: { kills, assists, ratio: kills > 0 ? (assists / kills).toFixed(1) : '0' } },
    });
  }

  if (soulsPerMin >= 550 && assists >= 8 && deaths <= 5) {
    insights.push({
      severity: 'positive',
      module: 'combat',
      category: 'mapMovement',
      timestamp: 'all',
      title: 'Strong Rotation Balance',
      detail: `${soulsPerMin} souls/min with ${assists} assists and only ${deaths} deaths. You farmed efficiently while being present for team fights—the ideal core pattern.`,
      action: 'Continue rotating between farm and fights. Watch the minimap every 10 seconds to identify when your presence matters most.',
      impact: 0,
      evidence: { type: 'rotation', data: { soulsPerMin, assists, deaths } },
    });
  }
}

function analyzeFightTiming(combat, meta, insights) {
  if (!combat) return;

  const kda = combat.kda || 0;
  const deaths = combat.deaths || 0;
  const damagePerMin = combat.damagePerMin || 0;
  const deathsPerMin = combat.deathsPerMin || 0;
  const duration = meta?.duration || 0;
  const durationMin = duration > 0 ? duration / 60 : 0;

  if (deathsPerMin > 0.5 && deaths > 7) {
    const deathInterval = Math.round(60 / deathsPerMin);
    insights.push({
      severity: 'critical',
      module: 'combat',
      category: 'fightTiming',
      timestamp: deathsPerMin > 0.7 ? 'early' : 'mid',
      title: 'Dying in Lost Fights',
      detail: `You died every ~${deathInterval} seconds (${deathsPerMin.toFixed(2)} deaths/min). ` +
        `This pattern indicates fighting unwinnable battles or chasing kills into enemy territory.`,
      action: 'Next game: Disengage immediately when a teammate dies in a 2v3+. Respect enemy power spikes—if they just completed a major item, avoid fights for 30-60 seconds.',
      impact: 24,
      evidence: { type: 'deaths', data: { deathsPerMin, deathInterval, totalDeaths: deaths } },
    });
  }

  if (damagePerMin > 0 && damagePerMin < 600 && durationMin >= 20) {
    insights.push({
      severity: 'warning',
      module: 'combat',
      category: 'fightTiming',
      timestamp: 'mid',
      title: 'Missing Fight Impact',
      detail: `Only ${damagePerMin} damage/min in a ${durationMin.toFixed(0)}-minute game. You're either joining fights late, dying before dealing damage, or building the wrong items for your role.`,
      action: "Position behind your frontline before fights start. Focus fire the same target as your team.",
      impact: 17,
      evidence: { type: 'damage', data: { damagePerMin, duration: durationMin } },
    });
  }

  if (kda >= 3 && damagePerMin >= 900 && deaths <= 4) {
    insights.push({
      severity: 'positive',
      module: 'combat',
      category: 'fightTiming',
      timestamp: 'all',
      title: 'Dominant Fight Presence',
      detail: `${kda.toFixed(1)} KDA with ${damagePerMin} damage/min and only ${deaths} deaths. You consistently won engagements through superior positioning or farm advantage.`,
      action: 'Capitalize on this pattern. Force fights when you complete key items. Push objectives before enemies can recover.',
      impact: 0,
      evidence: { type: 'combat', data: { kda, damagePerMin, deaths } },
    });
  }
}

function analyzeDecisionQuality(heroPerf, combat, benchmarks, meta, insights) {
  if (!heroPerf || !combat) return;

  const won = meta?.won;
  const matchKda = heroPerf.matchKda || 0;
  const soulsPerMin = heroPerf.soulsPerMin || 0;
  const kdaDiff = benchmarks?.kdaDiff || 0;
  const benchmarkKda = benchmarks?.benchmarkKda || 0;
  const heroName = meta?.heroName || 'this hero';

  if (won === false) {
    if (soulsPerMin < 400 && combat.deaths > 8) {
      const durationMin = (meta?.duration || 0) > 0 ? meta.duration / 60 : 20;
      const avgRespawnSeconds = 10 + (durationMin * 1.5);
      const lostSoulsPerDeath = Math.round((soulsPerMin / 60) * avgRespawnSeconds);
      const totalLostSouls = lostSoulsPerDeath * combat.deaths;

      insights.push({
        severity: 'critical',
        module: 'heroPerformance',
        category: 'decisionQuality',
        timestamp: 'all',
        title: 'Compound Errors: Farm + Deaths',
        detail: `This loss came from two compounding issues: low farm (${soulsPerMin} souls/min) and ${combat.deaths} deaths. ` +
          `Each death cost ~${lostSoulsPerDeath} souls in lost farm time, creating an insurmountable ${totalLostSouls} soul deficit.`,
        action: `Next game: Pick ONE focus. Either commit to safe farming (accept fewer fights) OR aggressive play (accept some deaths). Half-measures cause losses like this.`,
        impact: 30,
        evidence: { type: 'compound', data: { soulsPerMin, deaths: combat.deaths, estimatedDeficit: totalLostSouls } },
      });
    } else if (soulsPerMin >= 500 && combat.deaths <= 6) {
      insights.push({
        severity: 'info',
        module: 'heroPerformance',
        category: 'decisionQuality',
        timestamp: 'late',
        title: 'Strong Personal Game, Team Loss',
        detail: `You performed well individually (${soulsPerMin} souls/min, ${combat.deaths} deaths) but still lost. ` +
          `The loss likely came from another lane or a strategic team comp mismatch.`,
        action: `Review the replay from your teammates' perspectives. Identify the lane where the game was lost.`,
        impact: 5,
        evidence: { type: 'team_loss', data: { soulsPerMin, deaths: combat.deaths } },
      });
    } else if (kdaDiff < -2 && benchmarkKda > 0) {
      insights.push({
        severity: 'warning',
        module: 'heroPerformance',
        category: 'decisionQuality',
        timestamp: 'all',
        title: `Below Your Standard on ${heroName}`,
        detail: `Your KDA (${matchKda.toFixed(1)}) is ${Math.abs(kdaDiff).toFixed(1)} below your career average (${benchmarkKda.toFixed(1)}) on ${heroName}. ` +
          `This wasn't a bad matchup—it was uncharacteristic decision-making.`,
        action: `Watch your replay focusing on each death. Ask: "Was this necessary for an objective?" If not, that's a decision to eliminate.`,
        impact: 20,
        evidence: { type: 'benchmark', data: { matchKda, careerKda: benchmarkKda, diff: kdaDiff } },
      });
    }
  }

  if (won === true && soulsPerMin >= 600 && matchKda >= 3) {
    insights.push({
      severity: 'positive',
      module: 'heroPerformance',
      category: 'decisionQuality',
      timestamp: 'all',
      title: 'Textbook Win Execution',
      detail: `${soulsPerMin} souls/min funded your items, ${matchKda.toFixed(1)} KDA shows fight dominance. ` +
        `Save this replay as a reference for ${heroName}.`,
      action: `Note your item timings and rotation patterns. Replicate this decision framework on similar heroes.`,
      impact: 0,
      evidence: { type: 'win', data: { soulsPerMin, kda: matchKda } },
    });
  }

  const durationMin = (meta?.duration || 0) > 0 ? meta.duration / 60 : 0;
  if (durationMin >= 35 && Math.abs(soulsPerMin - 500) < 100) {
    insights.push({
      severity: 'info',
      module: 'heroPerformance',
      category: 'decisionQuality',
      timestamp: 'late',
      title: 'Evenly Matched Late Game',
      detail: `A ${durationMin.toFixed(0)}-minute game with even soul parity. The outcome came down to 1-2 decisive team fights.`,
      action: 'Identify the turning point: usually a fight around an objective or a high-ground push. In close games, single decisions matter more than stats.',
      impact: 8,
      evidence: { type: 'close_game', data: { duration: durationMin, soulsPerMin } },
    });
  }
}

// ----------------------------------------------------------------
// NEW v3: Event-Grounded Intelligence Layers
// ----------------------------------------------------------------

/**
 * Matchup-Aware Insights
 * References specific enemy heroes and how they countered the player.
 */
function analyzeMatchupContext(meta, insights) {
  const matchup = meta?.matchupDifficulty;
  if (!matchup || matchup.difficulty === 'unknown') return;

  // Hard counter call-out
  const hardCounters = (matchup.counters || []).filter(c => c.strength === 'hard');
  if (hardCounters.length > 0 && meta?.won === false) {
    const counterNames = hardCounters.map(c => c.heroName).join(' and ');
    insights.push({
      severity: 'warning',
      module: 'heroPerformance',
      category: 'matchupAwareness',
      timestamp: 'all',
      title: `Countered by ${counterNames}`,
      detail: `${counterNames} ${hardCounters.length > 1 ? 'are' : 'is a'} known counter${hardCounters.length > 1 ? 's' : ''} to your hero. ` +
        `${hardCounters[0].reason} Factor this into your death analysis—some deaths were structural, not mistakes.`,
      action: `When facing ${counterNames}, itemize defensively early. Consider different skill order or positioning to mitigate the counter.`,
      impact: 14,
      evidence: { type: 'matchup', data: { counters: hardCounters.map(c => ({ heroName: c.heroName, reason: c.reason })) } },
    });
  }

  // Extreme difficulty acknowledgment
  if (matchup.difficulty === 'extreme' && matchup.rankDelta > 0) {
    insights.push({
      severity: 'info',
      module: 'heroPerformance',
      category: 'matchupAwareness',
      timestamp: 'all',
      title: 'Outranked Opponents',
      detail: `The enemy team averaged ${matchup.enemyRankName || 'a higher rank'} (${matchup.rankDelta > 0 ? '+' : ''}${matchup.rankDelta} tier delta). ` +
        `Your performance should be evaluated against this difficulty.`,
      action: 'Focus on what you learned rather than the outcome. Playing above your rank accelerates improvement.',
      impact: 6,
      evidence: { type: 'rank', data: { rankDelta: matchup.rankDelta, enemyRank: matchup.enemyRankName } },
    });
  }
}

/**
 * Build Path Intelligence
 * Ties item decisions to match outcomes with meta context.
 */
function analyzeBuildPathInsights(meta, insights) {
  const buildPath = meta?.buildPath;
  const metaCtx = meta?.metaContext;
  if (!buildPath) return;

  // Build coherence warning
  if (buildPath.coherenceScore != null && buildPath.coherenceScore < 40) {
    insights.push({
      severity: 'warning',
      module: 'itemization',
      category: 'buildPath',
      timestamp: 'all',
      title: 'Scattered Item Build',
      detail: `Your build coherence score is ${buildPath.coherenceScore}/100. ` +
        `You bought items that don't synergize well with your hero's role. ` +
        (buildPath.issues?.[0] ? `Specifically: ${buildPath.issues[0]}` : ''),
      action: metaCtx?.itemBuilds?.winningBuilds?.length > 0
        ? `Top-performing players build: ${metaCtx.itemBuilds.winningBuilds.slice(0, 3).map(i => i.itemName).join(' → ')}. Consider this progression.`
        : 'Look up the recommended build for your hero and stick to it for the next 5 games.',
      impact: 16,
      evidence: { type: 'build', data: { coherenceScore: buildPath.coherenceScore, issues: buildPath.issues } },
    });
  }

  // Meta build recommendation
  if (metaCtx?.itemBuilds?.coreItems?.length > 0 && meta?.won === false) {
    const topItems = metaCtx.itemBuilds.coreItems.slice(0, 3);
    const playerItems = buildPath.items || [];
    const missingCore = topItems.filter(
      item => !playerItems.some(pi => Number(pi) === Number(item.itemId))
    );

    if (missingCore.length >= 2) {
      insights.push({
        severity: 'info',
        module: 'itemization',
        category: 'buildPath',
        timestamp: 'mid',
        title: 'Missing Core Meta Items',
        detail: `You skipped ${missingCore.map(i => i.itemName).join(' and ')} — items that appear in ${missingCore[0].pickRate}%+ of games on your hero with ${missingCore[0].winRate}% win rate.`,
        action: `Try incorporating ${missingCore[0].itemName} into your next build. Its ${missingCore[0].winRate}% win rate suggests it synergizes well with your hero.`,
        impact: 12,
        evidence: { type: 'meta_build', data: { missingItems: missingCore } },
      });
    }
  }
}

/**
 * Temporal Trend Analysis
 * Warns about declining performance or reinforces improvement.
 */
function analyzeTemporalTrends(meta, insights) {
  const temporal = meta?.temporal;
  if (!temporal) return;

  // Performance trend
  if (temporal.trendSlug === 'declining' && temporal.recentMatches >= 3) {
    const streak = temporal.lossStreak || 0;
    insights.push({
      severity: 'warning',
      module: 'heroPerformance',
      category: 'trend',
      timestamp: 'all',
      title: `Performance Declining${streak >= 3 ? ` (${streak}-Game Loss Streak)` : ''}`,
      detail: `Your recent ${temporal.recentMatches}-game trend shows declining KDA and soul income. ` +
        (streak >= 3 ? `A ${streak}-game loss streak often indicates tilt or fatigue. ` : '') +
        `This match fits the pattern.`,
      action: streak >= 3
        ? 'Take a 15-minute break. Losing streaks compound—your decision-making degrades with each loss. Come back fresh.'
        : 'Review your last 3 matches for a common thread. Are you dying to the same hero type? Making the same rotation mistake?',
      impact: 13,
      evidence: { type: 'trend', data: { trendSlug: temporal.trendSlug, lossStreak: streak, recentMatches: temporal.recentMatches } },
    });
  }

  if (temporal.trendSlug === 'improving' && temporal.recentMatches >= 3) {
    insights.push({
      severity: 'positive',
      module: 'heroPerformance',
      category: 'trend',
      timestamp: 'all',
      title: 'Performance Trending Up',
      detail: `Your recent ${temporal.recentMatches}-game trend shows improving KDA and soul income. Whatever adjustments you've made are working.`,
      action: 'Identify what changed in your recent wins. Was it hero choice, item builds, or playstyle? Double down on what works.',
      impact: 0,
      evidence: { type: 'trend', data: { trendSlug: temporal.trendSlug, recentMatches: temporal.recentMatches } },
    });
  }
}

/**
 * Meta Context Insights
 * "What's strong right now" — hero tier info and win rate context.
 */
function analyzeMetaContext(meta, insights) {
  const metaCtx = meta?.metaContext;
  if (!metaCtx) return;

  const heroName = metaCtx.heroName || meta?.heroName || 'Your hero';
  const tier = metaCtx.tier;
  const winRate = metaCtx.winRate;

  // Low win-rate hero warning
  if (winRate != null && winRate < 47 && tier === 'D') {
    insights.push({
      severity: 'info',
      module: 'heroPerformance',
      category: 'metaContext',
      timestamp: 'all',
      title: `${heroName} is Struggling in the Current Meta`,
      detail: `${heroName} currently sits at ${winRate.toFixed(1)}% win rate (${metaCtx.tierLabel}). ` +
        `This doesn't mean you can't win, but expect harder games. You need to outperform the average player on this hero to climb.`,
      action: `If climbing is your goal, consider meta-adjacent heroes in the same role. If you love ${heroName}, focus on mastery—win rate gaps shrink with experience.`,
      impact: 7,
      evidence: { type: 'meta', data: { heroName, winRate, tier } },
    });
  }

  // S-tier hero with a loss
  if (tier === 'S' && meta?.won === false && winRate != null) {
    insights.push({
      severity: 'info',
      module: 'heroPerformance',
      category: 'metaContext',
      timestamp: 'all',
      title: `${heroName} is S-Tier — This Loss is on Execution`,
      detail: `${heroName} has a ${winRate.toFixed(1)}% win rate — one of the strongest picks right now. ` +
        `Losing on an S-tier hero means the issue is execution, not hero choice. Focus on the specific mistakes above.`,
      action: 'Review the insights above. On a strong hero, fixing 1-2 mistakes per game translates directly into wins.',
      impact: 9,
      evidence: { type: 'meta', data: { heroName, winRate, tier } },
    });
  }
}

/**
 * Win Condition Synthesis
 * Identifies the single most impactful factor that decided the game outcome.
 * For wins: "What won you this game?"
 * For losses: "What lost you this game?"
 */
function synthesizeWinCondition(heroPerf, combat, itemization, benchmarks, meta, insights) {
  const won = meta?.won;
  if (won == null) return; // Can't determine outcome

  const soulsPerMin = heroPerf?.soulsPerMin || itemization?.soulsPerMin || 0;
  const deaths = combat?.deaths || 0;
  const kda = combat?.kda || 0;
  const kdaDiff = benchmarks?.kdaDiff || 0;
  const damagePerMin = combat?.damagePerMin || 0;
  const heroName = meta?.heroName || 'your hero';

  if (won) {
    // Identify what won the game
    if (soulsPerMin >= 600 && kda >= 3) {
      insights.push({
        severity: 'positive', module: 'heroPerformance', category: 'winCondition',
        timestamp: 'all', tier: 'context',
        title: 'Win Condition: Economy Dominance',
        detail: `${soulsPerMin} souls/min and ${kda.toFixed(1)} KDA — you out-farmed and out-fought. ` +
          `Your economy advantage funded earlier power spikes that snowballed team fights.`,
        action: `Save this replay. Your farm-to-fight balance on ${heroName} was textbook.`,
        impact: 0,
        evidence: { type: 'win_condition', data: { factor: 'economy', soulsPerMin, kda } },
      });
    } else if (damagePerMin >= 1000 && deaths <= 4) {
      insights.push({
        severity: 'positive', module: 'combat', category: 'winCondition',
        timestamp: 'all', tier: 'context',
        title: 'Win Condition: Fight Mastery',
        detail: `${damagePerMin} damage/min with only ${deaths} deaths — you were the team's damage anchor. ` +
          `Your positioning kept you alive to deal sustained damage.`,
        action: 'Your fight positioning was elite this game. Replicate this aggression level.',
        impact: 0,
        evidence: { type: 'win_condition', data: { factor: 'combat', damagePerMin, deaths } },
      });
    }
  } else {
    // Identify what lost the game
    if (deaths >= 8 && soulsPerMin < 400) {
      insights.push({
        severity: 'critical', module: 'heroPerformance', category: 'winCondition',
        timestamp: 'all', tier: 'must-fix',
        title: 'Loss Condition: Death Spiral',
        detail: `${deaths} deaths while farming only ${soulsPerMin} souls/min created an unrecoverable deficit. ` +
          `Each death cost farm time, and each farm gap made fights harder — a compounding spiral.`,
        action: 'Next game: if you die twice in 3 minutes, switch to safe farming for 5 minutes. Break the spiral.',
        impact: 32,
        evidence: { type: 'loss_condition', data: { factor: 'death_spiral', deaths, soulsPerMin } },
      });
    } else if (soulsPerMin < 350 && deaths < 6) {
      insights.push({
        severity: 'critical', module: 'economy', category: 'winCondition',
        timestamp: 'all', tier: 'must-fix',
        title: 'Loss Condition: Economy Starvation',
        detail: `Only ${soulsPerMin} souls/min despite just ${deaths} deaths. You weren't dying — you weren't farming. ` +
          `Your team needed an item advantage that never came.`,
        action: 'Next game: set a 5-minute timer. If you have less than 3k souls at min 5, prioritize jungle camps immediately.',
        impact: 28,
        evidence: { type: 'loss_condition', data: { factor: 'economy', soulsPerMin, deaths } },
      });
    } else if (kdaDiff < -2 && benchmarks?.benchmarkKda > 0) {
      insights.push({
        severity: 'warning', module: 'heroPerformance', category: 'winCondition',
        timestamp: 'all', tier: 'optimize',
        title: `Loss Condition: Off-Day on ${heroName}`,
        detail: `KDA ${kda.toFixed(1)} vs your career ${benchmarks.benchmarkKda.toFixed(1)} — ` +
          `${Math.abs(kdaDiff).toFixed(1)} below your standard. This wasn't a hero or meta problem, it was execution.`,
        action: `Watch the replay at 2x speed focusing on each death. Were you fighting without vision? Without team?`,
        impact: 22,
        evidence: { type: 'loss_condition', data: { factor: 'execution', kda, careerKda: benchmarks.benchmarkKda } },
      });
    } else {
      insights.push({
        severity: 'info', module: 'heroPerformance', category: 'winCondition',
        timestamp: 'all', tier: 'context',
        title: 'Loss Condition: Strategic Outplay',
        detail: `Your individual metrics were relatively stable. This game was likely decided by macro-strategy, a team composition mismatch, or a single late-game fight.`,
        action: `In close games with stable stats, execution in the final 5 minutes dictates the winner. Review the last teamfight.`,
        impact: 10,
        evidence: { type: 'loss_condition', data: { factor: 'strategic_outplay' } },
      });
    }
  }
}

module.exports = { generateInsights };
