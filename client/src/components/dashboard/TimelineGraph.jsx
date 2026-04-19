import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '../../utils/formatters';
import { Clock } from 'lucide-react';

/**
 * Visualizes soul / net worth progression over time.
 * If true timeline data is unavailable from the API, this synthesizes
 * an organic curve to visually represent farming efficiency.
 */
export default function TimelineGraph({ netWorth, durationSeconds }) {
  if (!netWorth || !durationSeconds || durationSeconds <= 0) return null;

  const durationMins = Math.max(1, Math.round(durationSeconds / 60));
  const benchmarkSpm = 600; // Strong standard benchmark

  // Synthesize an organic S-curve / exponential progression
  const data = [];
  const step = Math.max(1, Math.floor(durationMins / 15)); // Keep data points reasonable

  for (let m = 0; m <= durationMins; m += step) {
    const progress = Math.pow(m / durationMins, 1.3); // Slight exponential pacing
    const playerSouls = m === 0 ? 0 : Math.round(progress * netWorth);
    const idealEndNetWorth = benchmarkSpm * durationMins;
    const idealSouls = m === 0 ? 0 : Math.round(progress * idealEndNetWorth);

    data.push({
      time: m,
      label: `${m}m`,
      Player: playerSouls,
      Benchmark: idealSouls,
    });
  }

  // Ensure the exact end point is plotted
  if (data[data.length - 1].time !== durationMins) {
    data.push({
      time: durationMins,
      label: `${durationMins}m`,
      Player: netWorth,
      Benchmark: Math.round(benchmarkSpm * durationMins),
    });
  }

  return (
    <div className="card mt-6 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-deadlock-accent" />
        <h3 className="text-sm font-semibold text-deadlock-text-dim uppercase tracking-widest">
          Soul Progression Timeline
        </h3>
      </div>
      
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPlayer" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffad1c" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#ffad1c" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBench" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b7db2" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b7db2" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3243" vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="#8b92a5" 
              fontSize={11} 
              tickMargin={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#8b92a5" 
              fontSize={11} 
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
              tickMargin={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f1117', borderColor: '#1a1d26', borderRadius: '4px' }}
              itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
              labelStyle={{ color: '#8b92a5', marginBottom: '8px', fontSize: '12px' }}
              formatter={(value) => [formatNumber(value), undefined]}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Area 
              type="monotone" 
              dataKey="Benchmark" 
              stroke="#3b7db2" 
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1} 
              fill="url(#colorBench)" 
              isAnimationActive={true}
            />
            <Area 
              type="monotone" 
              dataKey="Player" 
              stroke="#ffad1c" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPlayer)" 
              isAnimationActive={true}
              activeDot={{ r: 6, fill: '#ffad1c', stroke: '#0f1117', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-right text-deadlock-muted mt-2 uppercase tracking-wide">
        *Progress curve is an approximated model
      </p>
    </div>
  );
}
