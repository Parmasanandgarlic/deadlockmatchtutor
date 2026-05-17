import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { memo, useMemo } from 'react';

const PerformanceRadar = memo(function PerformanceRadar({ modules }) {
  if (!modules) return null;

  const { data, unavailableSubjects } = useMemo(() => {
    const moduleScore = (key) => {
      const module = modules[key];
      return module?.available !== false && typeof module?.score === 'number' && Number.isFinite(module.score)
        ? module.score
        : null;
    };

    const matchFarming = moduleScore('itemization');
    const matchFighting = moduleScore('combat');
    const matchConsistency = moduleScore('benchmarks');
    const rankObjective = modules.rankBenchmarks?.comparisons?.find((c) => c.metric === 'Objective Damage')?.score;
    const objectiveSignal =
      modules.combat?.objectiveScore ??
      rankObjective ??
      modules.heroPerformance?.metrics?.objectiveScore;
    const matchObjectives = typeof objectiveSignal === 'number' && Number.isFinite(objectiveSignal) ? objectiveSignal : null;
    const matchPositioning =
      modules.combat?.available !== false && typeof modules.combat?.positioningScore === 'number'
        ? modules.combat.positioningScore
        : null;
    const matchSurvival =
      modules.combat?.available !== false && typeof modules.combat?.deaths === 'number'
        ? Math.max(0, 100 - (modules.combat.deaths * 8))
        : null;

    // Determine benchmark/average expectations
    // If we don't have enough data to calculate an exact benchmark, we default to 50
    const getBench = (matchScore, userStat, benchStat) => {
      if (typeof matchScore !== 'number' || !Number.isFinite(matchScore)) return null;
      if (!userStat || !benchStat || userStat === 0) return 50;
      const ratio = benchStat / userStat;
      // Scale match score by benchmark ratio, keep between 10-100
      return Math.min(100, Math.max(10, matchScore * ratio));
    };

    const benchFarming = getBench(matchFarming, modules.benchmarks?.userSoulsPerMin, modules.benchmarks?.benchmarkSoulsPerMin);
    const benchFighting = getBench(matchFighting, modules.benchmarks?.userKda, modules.benchmarks?.benchmarkKda);

    const points = [
      {
        subject: 'Farming',
        Match: matchFarming == null ? null : Math.round(matchFarming),
        Average: benchFarming == null ? null : Math.round(benchFarming),
        fullMark: 100,
      },
      {
        subject: 'Fighting',
        Match: matchFighting == null ? null : Math.round(matchFighting),
        Average: benchFighting == null ? null : Math.round(benchFighting),
        fullMark: 100,
      },
      {
        subject: 'Objectives',
        Match: matchObjectives == null ? null : Math.round(matchObjectives),
        Average: 50,
        fullMark: 100,
      },
      {
        subject: 'Survival',
        Match: matchSurvival == null ? null : Math.round(matchSurvival),
        Average: 60,
        fullMark: 100,
      },
      {
        subject: 'Positioning',
        Match: matchPositioning == null ? null : Math.round(matchPositioning),
        Average: 50,
        fullMark: 100,
      },
      {
        subject: 'Consistency',
        Match: matchConsistency == null ? null : Math.round(matchConsistency),
        Average: 50,
        fullMark: 100,
      },
    ];

    return {
      data: points,
      unavailableSubjects: points.filter((point) => point.Match == null).map((point) => point.subject),
    };
  }, [modules]);

  return (
    <div className="card h-full flex flex-col justify-start animate-reveal border-l-4 border-l-deadlock-blue">
      <div className="flex items-center gap-3 mb-2">
        <div>
          <h2 className="text-lg font-serif tracking-widest text-white uppercase">Tactical Matrix</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-deadlock-muted">Combat Signature</p>
        </div>
      </div>
      {unavailableSubjects.length > 0 && (
        <p className="text-[11px] text-deadlock-muted leading-relaxed mt-2">
          Suppressed unavailable signals: {unavailableSubjects.join(', ')}.
        </p>
      )}
      <div className="w-full flex-1 min-h-[300px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
            <PolarGrid stroke="#2d3243" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#8b92a5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }} 
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Current Match"
              dataKey="Match"
              stroke="#ffad1c"
              fill="#ffad1c"
              fillOpacity={0.4}
              isAnimationActive={true}
            />
            <Radar
              name="Career Avg"
              dataKey="Average"
              stroke="#3b7db2"
              fill="transparent"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={0}
              isAnimationActive={true}
            />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: '#0f1117', borderColor: '#1a1d26', borderRadius: '0px' }}
              itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
              labelStyle={{ color: '#8b92a5', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default PerformanceRadar;
