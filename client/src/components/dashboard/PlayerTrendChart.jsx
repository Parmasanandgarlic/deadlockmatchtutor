import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Custom Tooltip for the Recharts component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1e232d] border border-[#ffad1c]/30 p-3 rounded-md shadow-xl text-sm font-sans">
        <div className="flex justify-between items-center mb-2 border-b border-[#3b7db2]/20 pb-1">
          <span className="text-gray-300 font-semibold">Match ID:</span>
          <span className="text-[#ffad1c]">{data.matchId}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Result:</span>
            <span className={`font-bold ${data.won == null ? 'text-gray-400' : data.won ? 'text-green-400' : 'text-red-400'}`}>
              {data.won == null ? 'Unknown' : data.won ? 'Victory' : 'Defeat'}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Impact Score:</span>
            <span className="text-[#ffad1c] font-bold">{data.score}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">KDA:</span>
            <span className="text-white font-bold">{data.kda.toFixed(1)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Souls/Min:</span>
            <span className="text-[#3b7db2] font-bold">{data.spm}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function PlayerTrendChart({ chartData, averageScore }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3342" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="#4b5563" 
          tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'monospace' }}
          tickMargin={10}
        />
        <YAxis 
          stroke="#4b5563" 
          tick={{ fill: '#9ca3af', fontSize: 12 }} 
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={averageScore} stroke="#3b7db2" strokeDasharray="4 4" opacity={0.6} />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke="#ffad1c" 
          strokeWidth={3}
          dot={{ r: 5, fill: '#151921', stroke: '#ffad1c', strokeWidth: 2 }}
          activeDot={{ r: 7, fill: '#ffad1c', stroke: '#fff', strokeWidth: 1 }}
          animationDuration={1500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
