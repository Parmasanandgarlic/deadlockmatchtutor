export function resolveMatchResult(match) {
  if (!match) return null;

  if (match.match_result != null && match.player_team != null) {
    return Number(match.match_result) === Number(match.player_team);
  }

  if (typeof match.player_team_won === 'boolean') return match.player_team_won;
  if (typeof match.won === 'boolean') return match.won;

  return null;
}
