import { useState } from 'react';
import { MODULE_KEYS, MODULE_LABELS } from '../../utils/constants';
import { getScoreColor } from '../../utils/grading';
import HeroPerformanceModule from '../modules/HeroPerformanceModule';
import ItemizationModule from '../modules/ItemizationModule';
import CombatModule from '../modules/CombatModule';
import BenchmarksModule from '../modules/BenchmarksModule';
import RankBenchmarksModule from '../modules/RankBenchmarksModule';
import MatchupDifficultyModule from '../modules/MatchupDifficultyModule';
import BuildPathModule from '../modules/BuildPathModule';
import DecisionQualityModule from '../modules/DecisionQualityModule';
import Tooltip from '../ui/Tooltip';

const MODULE_COMPONENTS = {
  heroPerformance: HeroPerformanceModule,
  itemization: ItemizationModule,
  combat: CombatModule,
  benchmarks: BenchmarksModule,
  rankBenchmarks: RankBenchmarksModule,
  matchupDifficulty: MatchupDifficultyModule,
  buildPath: BuildPathModule,
  decisionQuality: DecisionQualityModule,
};

const MODULE_DESCRIPTIONS = {
  heroPerformance: 'Your overall performance with this hero, including KDA, farm, and consistency across matches.',
  itemization: 'Item build efficiency, net worth progression, and soul collection patterns.',
  combat: 'Damage output, fight participation, and death analysis for teamfight impact.',
  benchmarks: 'How your performance compares to career averages and hero-specific benchmarks.',
  rankBenchmarks: 'How this match compares to a typical player at your predicted rank.',
  matchupDifficulty: 'Difficulty rating of the enemy composition: rank delta, counters, and net-worth gap.',
  buildPath: 'Optimization of your item build: slot balance, power-spike timing, and missing items.',
  decisionQuality: 'Synthesis of engagement, farm, death discipline, objectives, build, and adaptation.',
};

export default function ModuleTabs({ modules, meta }) {
  const [active, setActive] = useState('heroPerformance');

  if (!modules) return null;

  const ActiveComponent = MODULE_COMPONENTS[active];
  const activeData = modules[active];
  const playerStats = meta?.playerStats;

  return (
    <div>
      {/* Module Dossier Tabs */}
      <div
        role="tablist"
        aria-label="Analysis modules"
        className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none"
      >
        {MODULE_KEYS.map((key, idx) => {
          const isActive = key === active;
          const score = modules[key]?.score ?? 0;
          const label = MODULE_LABELS[key] || key;
          const fileTag = `§${String(idx + 1).padStart(2, '0')}`;
          return (
            <Tooltip
              key={key}
              content={{
                term: label,
                definition: MODULE_DESCRIPTIONS[key] || 'Detailed performance analysis for this category.',
                category: 'Module'
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(key)}
                className={`module-chip ${isActive ? 'module-chip-active' : ''}`}
              >
                {isActive && <span className="module-chip-rail" aria-hidden="true" />}
                <span className="module-chip-label">
                  <span className="module-chip-sub">{fileTag}</span>
                  <span className="module-chip-title">{label}</span>
                </span>
                <span className="module-score-plate" aria-label={`Score ${score} of 100`}>
                  <span className={`module-score-plate-value ${getScoreColor(score)}`}>{score}</span>
                  <span className="module-score-plate-label">/100</span>
                </span>
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Active Module Content */}
      <div className="card">
        {ActiveComponent && activeData ? (
          <ActiveComponent data={activeData} playerStats={playerStats} meta={meta} />
        ) : (
          <p className="text-deadlock-text-dim text-center py-8">No data available.</p>
        )}
      </div>
    </div>
  );
}
