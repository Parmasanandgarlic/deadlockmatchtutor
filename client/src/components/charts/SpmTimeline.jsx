import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export default function SpmTimeline({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-deadlock-muted text-sm">
        No SPM timeline data available.
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="spmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" />
          <XAxis
            dataKey="minute"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#1e2230' }}
            tickLine={false}
            label={{ value: 'Minute', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#1e2230' }}
            tickLine={false}
            label={{ value: 'SPM', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141720',
              border: '1px solid #1e2230',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '13px',
            }}
            labelFormatter={(v) => `Minute ${v}`}
            formatter={(value) => [`${value} SPM`, 'Souls Per Minute']}
          />
          <Area
            type="monotone"
            dataKey="spm"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#spmGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#f59e0b' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
