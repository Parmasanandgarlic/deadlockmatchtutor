import { Link } from 'react-router-dom';
import { ArrowRight, User } from 'lucide-react';
import { formatDuration, formatResult, getHeroImage } from '../../utils/formatters';

export default function MatchCard({ match, accountId }) {
  const won = match.player_team_won ?? match.won ?? null;
  const heroName = match.hero_name || match.hero || 'Unknown Hero';
  const kills = match.player_kills ?? match.kills ?? 0;
  const deaths = match.player_deaths ?? match.deaths ?? 0;
  const assists = match.player_assists ?? match.assists ?? 0;
  const kda = (kills != null && deaths != null && assists != null)
    ? `${kills}/${deaths}/${assists}`
    : '--/--/--';
  const duration = formatDuration(match.duration_s || match.duration || 0);
  const netWorth = match.net_worth != null
    ? Number(match.net_worth).toLocaleString()
    : '--';

  const avatarUrl = getHeroImage(heroName, 'small');

  return (
    <Link
      to={`/dashboard/${match.match_id}/${accountId}`}
      className="card group hover:border-deadlock-accent/50 transition-all duration-200 cursor-pointer flex flex-col"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
           {avatarUrl ? (
             <img 
               src={avatarUrl} 
               alt={heroName} 
               className="w-8 h-8 rounded-full border border-deadlock-border object-cover bg-black"
               onError={(e) => {
                 e.currentTarget.onerror = null;
                 e.currentTarget.style.display = 'none';
               }}
             />
           ) : (
             <div className="w-8 h-8 rounded-full overflow-hidden bg-deadlock-bg flex items-center justify-center border border-deadlock-border text-deadlock-muted">
                 <User className="w-5 h-5" />
             </div>
           )}
           <h3 className="font-semibold text-deadlock-text truncate">{heroName}</h3>
        </div>
        {won !== null && (
          <span className={won ? 'badge-win' : 'badge-loss'}>
            {formatResult(won)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
        <div>
          <p className="text-deadlock-muted text-xs">KDA</p>
          <p className="font-mono font-medium">{kda}</p>
        </div>
        <div>
          <p className="text-deadlock-muted text-xs">Net Worth</p>
          <p className="font-mono font-medium">{netWorth}</p>
        </div>
        <div>
          <p className="text-deadlock-muted text-xs">Duration</p>
          <p className="font-mono font-medium">{duration}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-deadlock-muted mt-auto pt-2 border-t border-deadlock-border/50">
        <span className="font-mono">#{match.match_id}</span>
        <span className="flex items-center gap-1 text-deadlock-accent opacity-0 group-hover:opacity-100 transition-opacity">
          Analyze <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}
