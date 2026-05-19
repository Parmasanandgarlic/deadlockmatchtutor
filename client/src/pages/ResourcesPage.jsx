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
    S: 'border-deadlock-amber text-deadlock-amber',
    A: 'border-deadlock-green text-deadlock-green',
    B: 'border-deadlock-blue text-deadlock-blue',
    C: 'border-yellow-500 text-yellow-500',
    D: 'border-deadlock-red text-deadlock-red',
  };
  
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-none border-2 flex items-center justify-center text-xl font-bold font-serif ${tierColors[tier] || 'border-deadlock-border text-deadlock-text-dim'}`}>
          {tier}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{label}</h2>
          <p className="text-sm text-deadlock-text-dim">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {heroes.filter(h => h.heroId > 0).map(hero => {
          const heroAsset = heroesMap?.[hero.heroId];
          const heroAvatar = heroAsset?.images?.icon_image_small_webp || 
                             heroAsset?.images?.icon_image_small || 
                             getHeroImage(heroAsset || hero.heroName, 'small');
          
          return (
            <div key={hero.heroId} className="panel-inset p-3 hover:border-deadlock-amber/50 transition-colors flex flex-col items-center">
               <div className="w-14 h-14 rounded-none bg-black/40 overflow-hidden mb-2 relative group flex items-center justify-center border border-deadlock-border/30">
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
                   <span className="text-lg font-bold text-deadlock-text-dim">
                     {hero.heroName?.substring(0, 2)}
                   </span>
                 )}
               </div>
               <div className="text-center w-full">
                 <h3 className="font-bold text-white truncate w-full text-sm">{hero.heroName}</h3>
                 <div className="flex justify-between items-center text-xs mt-1 w-full px-1">
                   <span className="text-deadlock-muted">WR:</span>
                   <span className={hero.winRate >= 50 ? 'text-deadlock-green font-bold' : 'text-deadlock-red font-bold'}>
                     {hero.winRate?.toFixed(1)}%
                   </span>
                 </div>
                 <div className="flex justify-between items-center text-xs w-full px-1">
                   <span className="text-deadlock-muted">PR:</span>
                   <span className="text-deadlock-text-dim">{hero.pickRate?.toFixed(1)}%</span>
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
        description: 'Cursed Apple threat assessment — global hero tier rankings for Deadlock based on win rate and pick rate data.',
        numberOfItems: Object.values(tierListData.tiers).reduce((sum, arr) => sum + (arr?.length || 0), 0),
        itemListElement: Object.entries(tierListData.tiers).flatMap(([tier, heroes], tierIdx) =>
          (heroes || []).filter(h => h.heroId > 0).map((hero, heroIdx) => ({
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
        title="Deadlock Meta Tier List — Cursed Apple Threat Assessment | AfterMatch"
        description="Deadlock meta tier list and hero rankings — OSIC threat assessment of Ritual combatants in the Cursed Apple. Live S through D tier rankings by win rate and pick rate."
        canonical={absoluteUrl('/resources')}
        imageUrl="/images/og-share.webp"
        schema={resourcesSchema}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-serif uppercase tracking-wider mb-2">
          Deadlock Meta Tier List — Cursed Apple Threat Assessment
        </h1>
        <p className="text-deadlock-text-dim">
          OSIC field intelligence on active Ritual combatants, ranked by win rate across all engagements in the Cursed Apple.
          {tierListData?.updatedAt && ` Last filed: ${new Date(tierListData.updatedAt).toLocaleString()}`}
        </p>
      </div>

      {/* AEO answer block — provides entity-rich context for AI crawlers and voice assistants */}
      <section aria-label="Deadlock meta tier list explanation" className="mb-10">
        <p className="answer-block text-sm text-deadlock-text-dim leading-relaxed max-w-3xl">
          The Deadlock meta tier list ranks every Ritual combatant from S-tier (apex threat) to D-tier (neutralized) using 
          live win rate and engagement data from the Cursed Apple. S-tier heroes dominate the meta — the Hidden King 
          and the Archmother both covet their service. D-tier heroes are struggling in the current meta and may 
          need specific team compositions to contribute. Tier rankings update as new meta data is curated.
        </p>
      </section>

      <section aria-label="Deadlock Community Benchmarks" className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">OSIC Operative Performance Standards</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-deadlock-text-dim bg-deadlock-surface border border-deadlock-border overflow-hidden">
            <thead className="text-xs text-deadlock-text uppercase bg-black/40 border-b border-deadlock-border">
              <tr>
                <th scope="col" className="px-6 py-3">Role / Position</th>
                <th scope="col" className="px-6 py-3">Target SPM (15 min)</th>
                <th scope="col" className="px-6 py-3">Target KDA Ratio</th>
                <th scope="col" className="px-6 py-3">Win Rate Goal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-deadlock-border hover:bg-white/[0.02]">
                <td className="px-6 py-4 font-bold text-white">Carry / Core</td>
                <td className="px-6 py-4">1200 - 1500+</td>
                <td className="px-6 py-4">3.5+</td>
                <td className="px-6 py-4">&gt; 52%</td>
              </tr>
              <tr className="border-b border-deadlock-border hover:bg-white/[0.02]">
                <td className="px-6 py-4 font-bold text-white">Flex / Roamer</td>
                <td className="px-6 py-4">1000 - 1200</td>
                <td className="px-6 py-4">2.5+</td>
                <td className="px-6 py-4">&gt; 50%</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="px-6 py-4 font-bold text-white">Support / Utility</td>
                <td className="px-6 py-4">800 - 1000</td>
                <td className="px-6 py-4">1.5+ (High Assists)</td>
                <td className="px-6 py-4">&gt; 50%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-deadlock-text-dim">
          * Standards calibrated by the Sandman Division against top 10% operative performance across all Cursed Apple engagements.
        </p>
      </section>

      <StateHandler
        loading={isLoading}
        error={error?.message}
        loadingText="Intercepting Cursed Apple intel..."
      >
        {tierListData && tierListData.tiers && (
          <div className="space-y-6">
            <TierRow tier="S" heroes={tierListData.tiers.S} label="S-Tier (Apex Threat)" description="Dominant — the Patrons covet their service" heroesMap={heroesMap} />
            <TierRow tier="A" heroes={tierListData.tiers.A} label="A-Tier (High Priority)" description="Strong — reliable combatants in any Ritual" heroesMap={heroesMap} />
            <TierRow tier="B" heroes={tierListData.tiers.B} label="B-Tier (Under Surveillance)" description="Balanced — effectiveness depends on operative skill" heroesMap={heroesMap} />
            <TierRow tier="C" heroes={tierListData.tiers.C} label="C-Tier (Low Threat)" description="Weak — requires specific team configurations" heroesMap={heroesMap} />
            <TierRow tier="D" heroes={tierListData.tiers.D} label="D-Tier (Neutralized)" description="Struggling — avoid deploying in ranked Rituals" heroesMap={heroesMap} />
          </div>
        )}
      </StateHandler>
    </div>
  );
}
