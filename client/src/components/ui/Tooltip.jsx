import React from 'react';
import { Info } from 'lucide-react';

const Tooltip = ({ metric, children }) => {
  const definitions = {
    // --- CORE ECONOMY & SOULS ---
    soulPerMin: "Souls collected per minute. Primary currency for items/levels. \n\nBenchmark: \n• Laning (0-10m): 400-600 spm\n• Mid Game (10-20m): 600-900 spm\n• Late Game: 900+ spm",
    netWorth: "Total value of Souls spent on items + Unspent Souls. Indicates overall economic power.",
    soulTiming: "When you hit key soul thresholds compared to average. Critical for Power Spikes.\n\nKey Thresholds:\n• 800 Souls: First major item component\n• 3200 Souls: Tier 2 Items / Level 6 Power Spike\n• 7200 Souls: Tier 3 Items / Level 12+ Power Spike",
    trooperWaveControl: "Percentage of enemy trooper waves denied or last-hit by you. Directly impacts soul income and lane pressure.",
    denizenFarm: "Efficiency of clearing Neutral Camps (Denizens).\n\nCamp Timers:\n• Easy: 2:00 spawn (1:25 respawn)\n• Medium: 6:00 spawn (4:50 respawn)\n• Hard/Vault: 8:00 spawn (5:00+ respawn)",
    breakableFarm: "Souls gained from Crates (60% drop), Golden Statues (50% drop), and Sinner's Sacrifice.",
   
    // --- MAP OBJECTIVES & MACRO ---
    objectiveDamage: "Damage dealt to Guardians, Walkers, Shrines, and the Patron. High values indicate proactive pushing.",
    midBossControl: "Participation in the Mid-Boss fight (spawns 10:00). Grants team-wide Rejuvenator Crystal buff.",
    shrinePressure: "Time spent contesting or damaging Enemy Shrines. Destroying both is required to damage the Patron.",
    ziplineEfficiency: "Usage of ziplines for rotation. Ziplines extend as you destroy enemy structures.",
    mapMovement: "Distance traveled and rotation timing. Critical for being in right place for fights/objectives.",
    firstBloodParticipation: "Involvement in the first kill of the match. Often sets early tempo.",
   
    // --- COMBAT & MECHANICS ---
    parrySuccess: "Successful Parries (Block melee with F). Stuns enemy for 2.75s and grants +20% damage taken debuff on them.",
    staminaManagement: "Efficiency of Stamina usage for Double Jumps, Dashes, and Wall Jumps. No fall damage exists; stamina is the limiting factor.",
    abilityUptime: "Percentage of time your abilities were available vs on cooldown during fights.",
    spiritPower: "Stat that scales ability damage and healing. Increased by Spirit Items and leveling.",
    weaponDps: "Sustained Damage Per Second from primary weapon, accounting for reloads and accuracy.",
    damageMitigated: "Damage prevented via Shields, Barriers, Parries, or Invulnerability abilities.",
    fightTiming: "Presence in key fights relative to Power Spikes (Item completions/Level ups).",
   
    // --- ITEMIZATION & BUILDS ---
    itemTiming: "Time taken to complete key items. Faster timings = earlier power spikes.",
    investmentTier: "Current bonus tier based on total souls invested in a category (Weapon/Vitality/Spirit).\n\nTiers:\n• 800: +7% Dmg / +8% HP\n• 3200: +20% Dmg / +17% HP\n• 7200: +60% Dmg / +39% HP\n• 16000: +95% Dmg / +48% HP\n• 28800: +135% Dmg / +56% HP",
    buildPathEfficiency: "Optimality of item purchase order relative to game state (e.g., buying regen early vs damage).",
   
    // --- HERO SPECIFIC ROLES ---
    tankInitiation: "Quality of engage for Tank heroes (Abrams, Viscous, Warden). Did you catch key targets?",
    supportUtility: "Effectiveness of support abilities (heals, shields, CC) in keeping carries alive.",
    carryFarmPriority: "Access to farm resources relative to team. Carries should prioritize Troopers/Denizens.",
   
    // --- ADVANCED METRICS ---
    wpa: "Win Probability Added. Estimated % increase in win chance from a specific action (kill, objective take).",
    positioningScore: "Calculated based on damage taken vs. dealt. High score = high damage output with low damage taken.",
    rotationSpeed: "Time taken to move between lanes after wave clear. Critical for creating overloads.",
    comebackMechanic: "Performance relative to being behind. Soul Urns (spawn 10:00, then every 5:00) favor the losing team."
  };

  if (!definitions[metric]) return children || null;

  return (
    <div className="group relative inline-flex items-center">
      {children ? (
        <span className="cursor-help border-b border-dotted border-gray-400 hover:border-gray-600 transition-colors">
          {children}
        </span>
      ) : (
        <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-blue-500 transition-colors" />
      )}
     
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none border border-gray-700">
        <div className="font-bold mb-1 text-blue-400 uppercase tracking-wider text-[10px]">
          {metric.replace(/([A-Z])/g, ' $1').trim()}
        </div>
        <div className="leading-relaxed whitespace-pre-line text-gray-200">
          {definitions[metric]}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

export default Tooltip;
