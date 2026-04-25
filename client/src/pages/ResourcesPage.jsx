import { useQuery } from '@tanstack/react-query';
import { getTierList } from '../api/client';
import StateHandler from '../components/ui/StateHandler';
import { useAssets } from '../contexts/AssetContext';
import { getHeroImage } from '../utils/formatters';

function TierRow({ tier, heroes, label, description, heroesMap }) {
  if (!heroes || heroes.length === 0) return null;
  
  const tierColors = {
    S: 'border-brand-primary text-brand-primary',
    A: 'border-green-400 text-green-400',
    B: 'border-blue-400 text-blue-400',
    C: 'border-yellow-400 text-yellow-400',
    D: 'border-red-400 text-red-400',
  };
  
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold ${tierColors[tier] || 'border-gray-400 text-gray-400'}`}>
          {tier}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-100">{label}</h2>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {heroes.map(hero => {
          const heroAsset = heroesMap?.[hero.heroId];
          const heroAvatar = heroAsset?.images?.icon_image_small_webp || 
                             heroAsset?.images?.icon_image_small || 
                             getHeroImage(heroAsset || hero.heroName, 'small');
          
          return (
            <div key={hero.heroId} className="bg-dark-600 rounded-lg p-3 border border-dark-500 hover:border-brand-primary transition-colors flex flex-col items-center">
               <div className="w-14 h-14 rounded-full bg-dark-700 overflow-hidden mb-2 relative group flex items-center justify-center">
                 {heroAvatar ? (
                   <img 
                     src={heroAvatar} 
                     alt={hero.heroName} 
                     className="w-full h-full object-cover" 
                     onError={(e) => {
                       e.currentTarget.onerror = null;
                       e.currentTarget.style.display = 'none';
                     }}
                   />
                 ) : (
                   <span className="text-lg font-bold text-gray-300">
                     {hero.heroName?.substring(0, 2)}
                   </span>
                 )}
               </div>
               <div className="text-center w-full">
                 <h3 className="font-bold text-gray-100 truncate w-full text-sm">{hero.heroName}</h3>
                 <div className="flex justify-between items-center text-xs mt-1 w-full px-1">
                   <span className="text-gray-400">WR:</span>
                   <span className={hero.winRate >= 50 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                     {hero.winRate?.toFixed(1)}%
                   </span>
                 </div>
                 <div className="flex justify-between items-center text-xs w-full px-1">
                   <span className="text-gray-400">PR:</span>
                   <span className="text-gray-300">{hero.pickRate?.toFixed(1)}%</span>
                 </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const { heroesMap } = useAssets();
  const { data: tierListData, isLoading, error } = useQuery({
    queryKey: ['meta', 'tierlist'],
    queryFn: getTierList,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 font-display uppercase tracking-wider mb-2">
          Global Meta Intelligence
        </h1>
        <p className="text-gray-400">
          Live tier list based on global match data and win rates.
          {tierListData?.updatedAt && ` Last updated: ${new Date(tierListData.updatedAt).toLocaleString()}`}
        </p>
      </div>

      <StateHandler
        loading={isLoading}
        error={error?.message}
        loadingText="Analyzing global meta..."
      >
        {tierListData && tierListData.tiers && (
          <div className="space-y-6">
            <TierRow tier="S" heroes={tierListData.tiers.S} label="S-Tier (Dominant)" description="Dominant — pick or ban" heroesMap={heroesMap} />
            <TierRow tier="A" heroes={tierListData.tiers.A} label="A-Tier (Strong)" description="Strong — reliable picks" heroesMap={heroesMap} />
            <TierRow tier="B" heroes={tierListData.tiers.B} label="B-Tier (Balanced)" description="Balanced — skill-dependent" heroesMap={heroesMap} />
            <TierRow tier="C" heroes={tierListData.tiers.C} label="C-Tier (Weak)" description="Weak — needs specific comps" heroesMap={heroesMap} />
            <TierRow tier="D" heroes={tierListData.tiers.D} label="D-Tier (Struggling)" description="Struggling — avoid in ranked" heroesMap={heroesMap} />
          </div>
        )}
      </StateHandler>
    </div>
  );
}
