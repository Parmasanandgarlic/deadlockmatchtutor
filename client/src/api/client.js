import axios from 'axios';
import responseContracts from './response.contracts.json';

// Allow overriding the API base URL via environment variable.
// This enables deploying the client separately from the server (e.g. client on Vercel,
// server on Railway/Render). If unset, defaults to same-origin /api (monorepo deployment).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

function warnOnContractMismatch(name, payload, contract) {
  if (!import.meta.env.DEV) return;
  const issues = [];

  const visit = (value, schema, path) => {
    if (!schema || typeof schema !== 'object') return;

    if (schema.$ref === '#/moduleSchemas/heroPerformance') {
      return visit(value, responseContracts.moduleSchemas.heroPerformance, path);
    }
    if (schema.$ref === '#/moduleSchemas/benchmarks') {
      return visit(value, responseContracts.moduleSchemas.benchmarks, path);
    }

    const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type].filter(Boolean);
    if (expectedTypes.length > 0) {
      const valid = expectedTypes.some((type) => {
        if (type === 'array') return Array.isArray(value);
        if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
        if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
        if (type === 'integer') return Number.isInteger(value);
        if (type === 'string') return typeof value === 'string';
        if (type === 'boolean') return typeof value === 'boolean';
        if (type === 'null') return value === null;
        return true;
      });
      if (!valid) {
        issues.push(`${path} expected ${expectedTypes.join('|')}`);
        return;
      }
    }

    if (Array.isArray(schema.required) && value && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of schema.required) {
        if (value[key] === undefined) issues.push(`${path}.${key} is missing`);
      }
    }

    if (schema.type === 'array' && Array.isArray(value) && schema.items) {
      value.forEach((item, index) => visit(item, schema.items, `${path}[${index}]`));
      return;
    }

    if (schema.type === 'object' && value && typeof value === 'object' && !Array.isArray(value) && schema.properties) {
      for (const [key, childSchema] of Object.entries(schema.properties)) {
        if (value[key] !== undefined) visit(value[key], childSchema, `${path}.${key}`);
      }
    }
  };

  visit(payload, contract, name);

  if (issues.length > 0) {
    console.warn(`[Contract] ${name} mismatch:\n- ${issues.join('\n- ')}`, payload);
  }
}

// Request interceptor for diagnostic headers
api.interceptors.request.use((config) => {
  config.headers['X-Client-Timestamp'] = new Date().toISOString();
  return config;
});

// Detect non-JSON responses (e.g. HTML from SPA fallback or Vercel 404 pages)
api.interceptors.response.use(
  (response) => {
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      const error = new Error('The API server returned an invalid response (HTML). This often indicates a server-side crash or a routing misconfiguration (e.g. Vercel 404 page).');
      error.code = 'ERR_INVALID_RESPONSE';
      error.status = response.status;
      return Promise.reject(error);
    }
    return response;
  },
  (error) => {
    // Attach status and method for diagnostics
    error.status = error.response?.status || 0;
    error.method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    error.url = error.config?.url || 'UNKNOWN';

    // Handle HTML responses even in the error block (e.g. a 404 that returned HTML)
    const contentType = error.response?.headers?.['content-type'] || '';
    if (contentType.includes('text/html')) {
      error.message = 'The API server returned an invalid response (HTML). This often indicates a server-side crash or a routing misconfiguration (e.g. Vercel 404 page).';
      error.errorCode = 'ERR_INVALID_RESPONSE';
      return Promise.reject(error);
    }

    // 1. Handle explicit backend error objects (JSON)
    if (error.response?.data) {
      const { error: errorMsg, code, details } = error.response.data;
      
      if (errorMsg) {
        // If it's a string, use it. If it's an object, try to extract a msg.
        const msg = typeof errorMsg === 'string' 
          ? errorMsg 
          : (errorMsg.message || errorMsg.code || 'An unexpected server error occurred.');
        
        error.message = msg;
        // Also update the response data to be a string to prevent downstream rendering crashes
        error.response.data.error = msg;
      }

      if (code) error.errorCode = code;
      if (details) error.details = details;
    }
    // 2. Handle HTTP 500s that didn't return JSON (redundant but safe)
    else if (error.response?.status >= 500) {
      error.message = 'The server encountered an internal error. Please check the logs or try again later.';
      error.errorCode = 'INTERNAL_SERVER_ERROR';
    }
    // 3. Handle network/connectivity issues
    else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      error.message = 'Network connection failed. Ensure the backend server is running and reachable.';
      error.errorCode = 'NETWORK_FAILURE';
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'The request timed out. The server might be under heavy load or processing a large match.';
      error.errorCode = 'TIMEOUT';
    } else if (!error.response) {
      error.message = 'A network error occurred and no response was received from the server.';
      error.errorCode = 'NO_RESPONSE';
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
  warnOnContractMismatch('matchHistory', data, responseContracts.matchHistory);
  return data;
}

export async function syncPlayerMatches(accountId) {
  const { data } = await api.post(`/players/${accountId}/sync`);
  return data;
}

export async function getPlayerMmrHistory(accountId) {
  const { data } = await api.get(`/players/${accountId}/mmr-history`);
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
  warnOnContractMismatch('analysis', data, responseContracts.analysis);
  return data;
}

export async function getCachedAnalysis(matchId, accountId) {
  const { data } = await api.get(`/analysis/${matchId}/${accountId}`);
  return data;
}

// ---- Trends ----

export async function getPlayerTrends(accountId, limit = 10) {
  const { data } = await api.get(`/trends/${accountId}?limit=${limit}`);
  return data;
}

// ---- Metadata ----

export async function getHeroes() {
  const { data } = await api.get('/meta/heroes');
  return data;
}

export async function getItems() {
  const { data } = await api.get('/meta/items');
  return data;
}

export async function getRanks() {
  const { data } = await api.get('/meta/ranks');
// ---- Assets (Direct from Deadlock CDN) ----

export async function getDeadlockHeroes() {
  const { data } = await axios.get('https://assets.deadlock-api.com/v2/heroes');
  return data;
}

export async function getDeadlockItems() {
  const { data } = await axios.get('https://assets.deadlock-api.com/v2/items');
  return data;
}

export default api;
