import axios from 'axios';

// Allow overriding the API base URL via environment variable.
// This enables deploying the client separately from the server (e.g. client on Vercel,
// server on Railway/Render). If unset, defaults to same-origin /api (monorepo deployment).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

// Detect non-JSON responses (e.g. HTML from SPA fallback when API routes aren't wired)
api.interceptors.response.use(
  (response) => {
    const contentType = response.headers['content-type'] || '';
    if (response.status === 200 && contentType.includes('text/html')) {
      throw new Error(
        'The API server is not reachable. If you are the deployer, ensure the server is configured as a Vercel serverless function and the Root Directory is set to the project root (not client/).'
      );
    }
    return response;
  },
  (error) => {
    // Transform axios errors into cleaner messages
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      error.message = 'Cannot connect to the server. Please try again later.';
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. The analysis may take longer than expected — please try again.';
    } else if (!error.response) {
      error.message = 'Network error. Please check your connection and try again.';
    }
    return Promise.reject(error);
  }
);

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
