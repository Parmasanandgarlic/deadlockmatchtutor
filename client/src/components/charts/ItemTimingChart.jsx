import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ZAxis,
} from 'recharts';

export default function ItemTimingChart({ purchases }) {
  if (!purchases || purchases.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-deadlock-muted text-sm">
        No item purchase data available.
      </div>
    );
  }

  const chartData = purchases.map((p, i) => ({
    minute: Math.round(p.timeSeconds / 60),
    cost: p.cost,
    item: p.item,
    index: i,
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" />
          <XAxis
            dataKey="minute"
            type="number"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#1e2230' }}
            tickLine={false}
            label={{ value: 'Minute', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
            dataKey="cost"
            type="number"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#1e2230' }}
            tickLine={false}
            label={{ value: 'Item Cost', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
          />
          <ZAxis range={[50, 200]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141720',
              border: '1px solid #1e2230',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '13px',
            }}
            formatter={(value, name) => {
              if (name === 'cost') return [`${Number(value).toLocaleString()} souls`, 'Cost'];
              if (name === 'minute') return [`${value}:00`, 'Time'];
              return [value, name];
            }}
            labelFormatter={() => ''}
            content={({ payload }) => {
              if (!payload || payload.length === 0) return null;
              const d = payload[0]?.payload;
              return (
                <div className="bg-deadlock-surface border border-deadlock-border rounded-lg p-2 text-sm">
                  <p className="font-semibold">{d?.item}</p>
                  <p className="text-deadlock-muted">{d?.cost?.toLocaleString()} souls @ {d?.minute}:00</p>
                </div>
              );
            }}
          />
          <Scatter
            data={chartData}
            fill="#f59e0b"
            shape="circle"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
