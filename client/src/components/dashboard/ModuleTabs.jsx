import { useState } from 'react';
import { MODULE_KEYS, MODULE_LABELS } from '../../utils/constants';
import { getScoreColor } from '../../utils/grading';
import HeroPerformanceModule from '../modules/HeroPerformanceModule';
import ItemizationModule from '../modules/ItemizationModule';
import CombatModule from '../modules/CombatModule';
import BenchmarksModule from '../modules/BenchmarksModule';
import Tooltip from '../ui/Tooltip';

const MODULE_COMPONENTS = {
  heroPerformance: HeroPerformanceModule,
  itemization: ItemizationModule,
  combat: CombatModule,
  benchmarks: BenchmarksModule,
};

const MODULE_DESCRIPTIONS = {
  heroPerformance: 'Your overall performance with this hero, including KDA, farm, and consistency across matches.',
  itemization: 'Item build efficiency, net worth progression, and soul collection patterns.',
  combat: 'Damage output, fight participation, and death analysis for teamfight impact.',
  benchmarks: 'How your performance compares to career averages and hero-specific benchmarks.',
};

export default function ModuleTabs({ modules, meta }) {
  const [active, setActive] = useState('heroPerformance');

  if (!modules) return null;

  const ActiveComponent = MODULE_COMPONENTS[active];
  const activeData = modules[active];
  const playerStats = meta?.playerStats;

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {MODULE_KEYS.map((key) => {
          const isActive = key === active;
          const score = modules[key]?.score ?? 0;
          return (
            <Tooltip
              key={key}
              content={{
                term: MODULE_LABELS[key],
                definition: MODULE_DESCRIPTIONS[key] || 'Detailed performance analysis for this category.',
                category: 'Module'
              }}
            >
              <button
                onClick={() => setActive(key)}
                className={isActive ? 'tab-active' : 'tab'}
              >
                <span>{MODULE_LABELS[key]}</span>
                <span className={`ml-3 px-1.5 py-0.5 bg-black/40 border border-white/5 font-bold text-[10px] ${getScoreColor(score)}`}>
                  {score}
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
