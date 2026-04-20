const { clamp } = require('../../utils/helpers');
const { getItemName, getItemData } = require('../../utils/items');

/**
 * Build Path Optimization Analyzer.
 *
 * Evaluates the order + timing + slot balance of the player's purchases and
 * produces actionable optimization suggestions. Works with whatever item
 * metadata the Deadlock Assets API has already populated on items
 * (tier/cost/slot_type). Does NOT require replay parsing.
 *
 * Output:
 *   {
 *     score,                       // 0..100 build efficiency
 *     slotBalance: { weapon, vitality, spirit, utility, flex }, // counts
 *     expectedSlotBalance:  { ... }, // role-guided ideal distribution
 *     tierProgression:      [ { tier, count, avgTime } ... ],
 *     firstT3Item, firstT4Item,    // key timing milestones
 *     underutilizedSlots: [ 'vitality' ],
 *     overusedSlots:      [ 'spirit'   ],
 *     missingKeyItems:    [ { slot: 'vitality', reason: '...' } ],
 *     nextPurchases:      [ { name, reason } ],
 *     summary
 *   }
 */

const ROLE_IDEAL_DISTRIBUTION = {
  // Expected ~share of build by slot class
  tank:    { weapon: 0.20, vitality: 0.45, spirit: 0.20, utility: 0.15 },
  carry:   { weapon: 0.50, vitality: 0.20, spirit: 0.20, utility: 0.10 },
  support: { weapon: 0.15, vitality: 0.30, spirit: 0.40, utility: 0.15 },
  brawler: { weapon: 0.35, vitality: 0.30, spirit: 0.25, utility: 0.10 },
};

function normalizeSlot(raw) {
  if (!raw) return 'flex';
  const s = String(raw).toLowerCase();
  if (s.includes('weapon')) return 'weapon';
  if (s.includes('vital') || s.includes('armor') || s.includes('survival')) return 'vitality';
  if (s.includes('spirit') || s.includes('magic')) return 'spirit';
  if (s.includes('tech') || s.includes('util')) return 'utility';
  return 'flex';
}

function extractItemMeta(item) {
  // item can be a number, string, or object depending on source.
  if (item == null) return null;
  if (typeof item === 'number') {
    const meta = getItemData(item);
    return {
      id: item,
      name: meta?.name || getItemName(item),
      cost: Number(meta?.cost ?? meta?.item_cost ?? 0),
      tier: Number(meta?.item_tier ?? meta?.tier ?? 0),
      slot: normalizeSlot(meta?.item_slot_type || meta?.slot || meta?.slot_type),
      time: 0,
    };
  }
  if (typeof item === 'string') {
    return { id: null, name: item, cost: 0, tier: 0, slot: 'flex', time: 0 };
  }
  const id = item.id ?? item.item_id ?? item.item ?? null;
  const meta = id != null ? getItemData(id) : null;
  const name = item.name ?? item.item_name ?? meta?.name ?? getItemName(id) ?? 'Unknown Item';
  const cost = Number(item.cost ?? item.item_cost ?? item.price ?? meta?.cost ?? meta?.item_cost ?? 0);
  const tier = Number(item.tier ?? item.item_tier ?? meta?.item_tier ?? meta?.tier ?? 0);
  const slot = normalizeSlot(item.slot || item.item_slot_type || meta?.item_slot_type || meta?.slot);
  const time = Number(item.time_s ?? item.game_time_s ?? item.timeSeconds ?? item.time ?? 0);
  return { id, name, cost, tier, slot, time };
}

function costFromTier(tier) {
  switch (Number(tier)) {
    case 1: return 500;
    case 2: return 1250;
    case 3: return 3000;
    case 4: return 6200;
    default: return 0;
  }
}

function analyzeBuildPath({ items = [], role = 'brawler', durationSeconds = 0 } = {}) {
  const metas = (items || []).map(extractItemMeta).filter(Boolean);
  if (metas.length === 0) {
    return {
      score: 50,
      slotBalance: { weapon: 0, vitality: 0, spirit: 0, utility: 0, flex: 0 },
      expectedSlotBalance: ROLE_IDEAL_DISTRIBUTION[role] || ROLE_IDEAL_DISTRIBUTION.brawler,
      tierProgression: [],
      firstT3Item: null,
      firstT4Item: null,
      underutilizedSlots: [],
      overusedSlots: [],
      missingKeyItems: [],
      nextPurchases: [],
      summary: 'No items found for this match — build path could not be graded.',
    };
  }

  // Backfill missing costs using tier fallback
  for (const m of metas) {
    if (!m.cost && m.tier) m.cost = costFromTier(m.tier);
  }

  const totalSpent = metas.reduce((a, m) => a + (m.cost || 0), 0);

  // Slot balance (by cost-weighted share, not just count)
  const slotBalance = { weapon: 0, vitality: 0, spirit: 0, utility: 0, flex: 0 };
  for (const m of metas) slotBalance[m.slot] = (slotBalance[m.slot] || 0) + (m.cost || 0);
  const slotShares = {};
  for (const k of Object.keys(slotBalance)) {
    slotShares[k] = totalSpent > 0 ? slotBalance[k] / totalSpent : 0;
  }

  const expectedDist = ROLE_IDEAL_DISTRIBUTION[role] || ROLE_IDEAL_DISTRIBUTION.brawler;

  // Identify under/over-used slots
  const underutilizedSlots = [];
  const overusedSlots = [];
  for (const [slot, expected] of Object.entries(expectedDist)) {
    const actual = slotShares[slot] || 0;
    if (actual < expected - 0.12) underutilizedSlots.push(slot);
    if (actual > expected + 0.15) overusedSlots.push(slot);
  }

  // Tier progression
  const byTier = new Map();
  for (const m of metas) {
    if (!m.tier) continue;
    if (!byTier.has(m.tier)) byTier.set(m.tier, []);
    byTier.get(m.tier).push(m);
  }
  const tierProgression = Array.from(byTier.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([tier, arr]) => {
      const times = arr.map((m) => m.time).filter((t) => t > 0);
      return {
        tier,
        count: arr.length,
        avgTimeSeconds: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
      };
    });

  const firstT3Item = metas
    .filter((m) => m.tier === 3 && m.time > 0)
    .sort((a, b) => a.time - b.time)[0] || null;
  const firstT4Item = metas
    .filter((m) => m.tier === 4 && m.time > 0)
    .sort((a, b) => a.time - b.time)[0] || null;

  // Missing key items (role-specific)
  const missingKeyItems = [];
  const hasAnySlot = (slot) => (slotBalance[slot] || 0) > 0;
  if (role === 'carry' && !hasAnySlot('vitality')) {
    missingKeyItems.push({ slot: 'vitality', reason: 'Carries need at least one survival item to stay alive in fights.' });
  }
  if (role === 'support' && !hasAnySlot('utility')) {
    missingKeyItems.push({ slot: 'utility', reason: 'Supports should grab utility/tech items to unlock team playmaking.' });
  }
  if (role === 'tank' && !hasAnySlot('vitality')) {
    missingKeyItems.push({ slot: 'vitality', reason: 'Tanks without vitality items cannot reliably frontline.' });
  }
  // All roles: at least one high-tier spike
  if (!firstT3Item && !firstT4Item && metas.length >= 6) {
    missingKeyItems.push({ slot: 'spike', reason: 'You did not reach a Tier 3/4 power-spike item — focus farm earlier.' });
  }

  // Timing grade: Tier 3 by ~20 min is strong, ~28 min is weak
  let timingScore = 50;
  if (firstT3Item?.time) {
    const minutes = firstT3Item.time / 60;
    if (minutes <= 18) timingScore = 90;
    else if (minutes <= 22) timingScore = 75;
    else if (minutes <= 28) timingScore = 60;
    else timingScore = 40;
  } else if (durationSeconds > 18 * 60) {
    timingScore = 35;
  }

  // Balance grade: mean squared deviation from ideal distribution
  let balanceDeviation = 0;
  for (const [slot, expected] of Object.entries(expectedDist)) {
    balanceDeviation += ((slotShares[slot] || 0) - expected) ** 2;
  }
  const balanceScore = Math.round(clamp(100 - balanceDeviation * 250, 0, 100));

  // Completeness grade: ratio of slots filled with meaningful cost
  const filledSlots = Object.entries(slotBalance).filter(([k, v]) => k !== 'flex' && v > 0).length;
  const completenessScore = Math.round(clamp((filledSlots / 4) * 100, 0, 100));

  const score = Math.round(timingScore * 0.4 + balanceScore * 0.4 + completenessScore * 0.2);

  // Next-purchase suggestions: prioritize underutilized slots
  const nextPurchases = underutilizedSlots.slice(0, 2).map((slot) => ({
    slot,
    reason: `Your build is light on ${slot} items. Adding a ${slot} item next will shore up your weakest axis.`,
  }));
  if (missingKeyItems.length > 0) {
    for (const k of missingKeyItems) {
      if (!nextPurchases.some((n) => n.slot === k.slot)) {
        nextPurchases.push({ slot: k.slot, reason: k.reason });
      }
    }
  }

  return {
    score,
    totalSpent,
    slotBalance: {
      weapon: Math.round(slotBalance.weapon || 0),
      vitality: Math.round(slotBalance.vitality || 0),
      spirit: Math.round(slotBalance.spirit || 0),
      utility: Math.round(slotBalance.utility || 0),
      flex: Math.round(slotBalance.flex || 0),
    },
    slotShares: Object.fromEntries(
      Object.entries(slotShares).map(([k, v]) => [k, Number((v * 100).toFixed(1))])
    ),
    expectedSlotBalance: expectedDist,
    tierProgression,
    firstT3Item: firstT3Item
      ? { id: firstT3Item.id, name: firstT3Item.name, timeSeconds: firstT3Item.time }
      : null,
    firstT4Item: firstT4Item
      ? { id: firstT4Item.id, name: firstT4Item.name, timeSeconds: firstT4Item.time }
      : null,
    underutilizedSlots,
    overusedSlots,
    missingKeyItems,
    nextPurchases,
    timingScore,
    balanceScore,
    completenessScore,
    summary:
      score >= 80
        ? 'Your build path was efficient, well-timed, and balanced across slots.'
        : score >= 60
        ? 'Your build was workable but has clear optimization opportunities.'
        : 'Your build had pacing or balance issues that likely cost you fight potential.',
  };
}

module.exports = { analyzeBuildPath, ROLE_IDEAL_DISTRIBUTION };
