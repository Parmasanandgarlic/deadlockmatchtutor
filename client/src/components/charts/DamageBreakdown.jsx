import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatNumber } from '../../utils/formatters';

export default function DamageBreakdown({ data }) {
  if (!data || data.totalDamageTaken === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-deadlock-muted text-sm">
        No damage data available.
      </div>
    );
  }

  const chartData = [
    {
      name: 'Damage Taken',
      poke: data.pokeDamage || 0,
      fight: data.fightDamage || 0,
    },
  ];

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#1e2230' }}
            tickLine={false}
            tickFormatter={(v) => formatNumber(v)}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#1e2230' }}
            tickLine={false}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141720',
              border: '1px solid #1e2230',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '13px',
            }}
            formatter={(value) => formatNumber(value)}
          />
          <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
          <Bar dataKey="poke" name="Poke (Out of Fight)" fill="#ef4444" radius={[0, 4, 4, 0]} />
          <Bar dataKey="fight" name="In-Fight" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
