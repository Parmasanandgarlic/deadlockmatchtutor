import { useState } from 'react';
import { MODULE_KEYS, MODULE_LABELS } from '../../utils/constants';
import { getScoreColor } from '../../utils/grading';
import HeroPerformanceModule from '../modules/HeroPerformanceModule';
import ItemizationModule from '../modules/ItemizationModule';
import CombatModule from '../modules/CombatModule';
import BenchmarksModule from '../modules/BenchmarksModule';

const MODULE_COMPONENTS = {
  heroPerformance: HeroPerformanceModule,
  itemization: ItemizationModule,
  combat: CombatModule,
  benchmarks: BenchmarksModule,
};

export default function ModuleTabs({ modules }) {
  const [active, setActive] = useState('heroPerformance');

  if (!modules) return null;

  const ActiveComponent = MODULE_COMPONENTS[active];
  const activeData = modules[active];

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {MODULE_KEYS.map((key) => {
          const isActive = key === active;
          const score = modules[key]?.score ?? 0;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={isActive ? 'tab-active' : 'tab'}
            >
              <span>{MODULE_LABELS[key]}</span>
              <span className={`ml-3 px-1.5 py-0.5 bg-black/40 border border-white/5 font-bold text-[10px] ${getScoreColor(score)}`}>
                {score}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Module Content */}
      <div className="card">
        {ActiveComponent && activeData ? (
          <ActiveComponent data={activeData} />
        ) : (
          <p className="text-deadlock-text-dim text-center py-8">No data available.</p>
        )}
      </div>
    </div>
  );
}
