import { useQuery } from '@tanstack/react-query';
import { getTierList } from '../api/client';
import StateHandler from '../components/ui/StateHandler';
import { useAssets } from '../contexts/AssetContext';
import { getHeroImage } from '../utils/formatters';
import SEOHead from '../components/seo/SEOHead';
import {
  absoluteUrl,
  breadcrumbSchema,
  organizationSchema,
  speakableSchema,
  websiteSchema,
} from '../utils/seo';

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

  // Build dynamic ItemList schema from live tier data
  const tierListSchema = tierListData?.tiers
    ? {
        '@type': 'ItemList',
        name: 'Deadlock Hero Meta Tier List',
        description: 'Global hero tier rankings for Deadlock based on win rate and pick rate data.',
        numberOfItems: Object.values(tierListData.tiers).reduce((sum, arr) => sum + (arr?.length || 0), 0),
        itemListElement: Object.entries(tierListData.tiers).flatMap(([tier, heroes], tierIdx) =>
          (heroes || []).map((hero, heroIdx) => ({
            '@type': 'ListItem',
            position: tierIdx * 20 + heroIdx + 1,
            name: `${hero.heroName} (${tier}-Tier)`,
            description: `${hero.heroName}: ${hero.winRate?.toFixed(1)}% win rate, ${hero.pickRate?.toFixed(1)}% pick rate`,
          }))
        ),
      }
    : null;

  const resourcesSchema = [
    organizationSchema(),
    websiteSchema(),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Meta Tier List', path: '/resources' },
    ]),
    speakableSchema('/resources'),
    ...(tierListSchema ? [tierListSchema] : []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEOHead
        title="Deadlock Hero Tier List and Meta Rankings | AfterMatch"
        description="Live Deadlock hero tier list ranked by win rate, pick rate, and global meta data. Find the best Deadlock heroes for ranked play with S through D tier rankings."
        canonical={absoluteUrl('/resources')}
        imageUrl="/images/og-share.png"
        schema={resourcesSchema}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 font-display uppercase tracking-wider mb-2">
          Global Meta Intelligence
        </h1>
        <p className="text-gray-400">
          Live tier list based on global match data and win rates.
          {tierListData?.updatedAt && ` Last updated: ${new Date(tierListData.updatedAt).toLocaleString()}`}
        </p>
      </div>

      {/* AEO answer block — provides entity-rich context for AI crawlers and voice assistants */}
      <section aria-label="Deadlock tier list explanation" className="mb-10">
        <p className="answer-block text-sm text-deadlock-text-dim leading-relaxed max-w-3xl">
          The Deadlock AfterMatch meta tier list ranks every Deadlock hero from S-tier to D-tier using global win rate
          and pick rate data. S-tier heroes are dominant picks with the highest win rates, while D-tier heroes are
          currently struggling and may need specific team compositions to succeed. Tier rankings update automatically
          as new match data becomes available.
        </p>
      </section>

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
