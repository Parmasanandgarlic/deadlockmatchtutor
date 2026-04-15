import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Player ----

export async function resolvePlayer(steamInput) {
  const { data } = await api.post('/players/resolve', { steamInput });
  return data;
}

export async function getPlayerMatches(accountId) {
  const { data } = await api.get(`/players/${accountId}/matches`);
  return data;
}

// ---- Match ----

export async function getMatchInfo(matchId) {
  const { data } = await api.get(`/matches/${matchId}`);
  return data;
}

export async function getMatchMetadata(matchId) {
  const { data } = await api.get(`/matches/${matchId}/metadata`);
  return data;
}

// ---- Analysis ----

export async function runAnalysis(matchId, accountId) {
  const { data } = await api.post('/analysis/run', { matchId, accountId });
  return data;
}

export async function getCachedAnalysis(matchId, accountId) {
  const { data } = await api.get(`/analysis/${matchId}/${accountId}`);
  return data;
}

export default api;
