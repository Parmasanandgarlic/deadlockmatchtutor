import { Link } from 'react-router-dom';
import { ArrowRight, User } from 'lucide-react';
import {
  formatDuration,
  formatResult,
  formatRelativeTime,
  formatDateTime,
  getHeroImage,
} from '../../utils/formatters';
import { getHeroName } from '../../utils/heroes';

export default function MatchCard({ match, accountId }) {
  // match_result: winning team (0 or 1); player_team: which team the player was on.
  // Fallback to legacy player_team_won/won fields if present.
  let won = null;
  if (match.match_result != null && match.player_team != null) {
    won = match.match_result === match.player_team;
  } else if (match.player_team_won != null) {
    won = match.player_team_won;
  } else if (match.won != null) {
    won = match.won;
  }

  const heroName = match.hero_name || getHeroName(match.hero_id);
  const kills = match.player_kills ?? match.kills ?? 0;
  const deaths = match.player_deaths ?? match.deaths ?? 0;
  const assists = match.player_assists ?? match.assists ?? 0;
  const kda = `${kills}/${deaths}/${assists}`;
  const duration = formatDuration(match.match_duration_s || match.duration_s || match.duration || 0);
  const netWorth = match.net_worth != null
    ? Number(match.net_worth).toLocaleString()
    : '--';

  const startTime = match.start_time ?? match.match_start_time ?? null;
  const relative = startTime ? formatRelativeTime(startTime) : '';
  const absolute = startTime ? formatDateTime(startTime) : '';

  const avatarUrl = getHeroImage(heroName, 'small');

  // Subtle colored accent based on result.
  const accentClass =
    won === true
      ? 'border-l-4 border-l-deadlock-green/70'
      : won === false
      ? 'border-l-4 border-l-deadlock-red/70'
      : '';

  return (
    <Link
      to={`/dashboard/${match.match_id}/${accountId}`}
      className={`card group hover:border-deadlock-accent/50 transition-all duration-200 cursor-pointer flex flex-col ${accentClass}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={heroName}
              className="w-9 h-9 rounded-full border border-deadlock-border object-cover bg-black shrink-0"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-9 h-9 rounded-full overflow-hidden bg-deadlock-bg flex items-center justify-center border border-deadlock-border text-deadlock-muted shrink-0">
              <User className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-deadlock-text truncate">{heroName}</h3>
            {relative && (
              <p
                className="text-xs text-deadlock-muted truncate"
                title={absolute}
              >
                {relative}
              </p>
            )}
          </div>
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
