const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const SITE_URL = 'https://www.aftermatch.xyz';
const API_URL = 'https://api.aftermatch.xyz';

const components = {
  securitySchemes: {
    cookieAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: 'aftermatch.sid',
    },
    csrfToken: {
      type: 'apiKey',
      in: 'header',
      name: 'x-csrf-token',
    },
  },
  schemas: {
    ErrorResponse: {
      type: 'object',
      required: ['error'],
      properties: {
        error: { type: 'string' },
        code: { type: 'string' },
        message: { type: 'string' },
        details: { nullable: true },
      },
    },
    HealthResponse: {
      type: 'object',
      required: ['status', 'timestamp'],
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        redis: { type: 'string' },
        redisRequired: { type: 'boolean' },
        uptime: { type: 'integer' },
        version: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
    CsrfResponse: {
      type: 'object',
      required: ['csrfToken'],
      properties: {
        csrfToken: { type: 'string' },
      },
    },
    PlayerResolveRequest: {
      type: 'object',
      required: ['steamInput'],
      properties: {
        steamInput: {
          type: 'string',
          minLength: 2,
          description: 'Steam ID, Steam vanity name, profile URL, or custom URL.',
        },
      },
    },
    MatchSummary: {
      type: 'object',
      additionalProperties: true,
      properties: {
        match_id: { type: 'integer' },
        hero_id: { type: 'integer' },
        start_time: { type: 'integer' },
        match_duration_s: { type: 'integer' },
        player_kills: { type: 'integer' },
        player_deaths: { type: 'integer' },
        player_assists: { type: 'integer' },
        net_worth: { type: 'integer' },
      },
    },
    AnalysisRequest: {
      type: 'object',
      required: ['matchId', 'accountId'],
      properties: {
        matchId: { type: 'integer', minimum: 0 },
        accountId: { type: 'integer', minimum: 0 },
        refresh: { type: 'boolean', description: 'Bypass cached analysis when supported.' },
      },
    },
    AnalysisResponse: {
      type: 'object',
      additionalProperties: true,
      properties: {
        meta: { type: 'object', additionalProperties: true },
        overall: {
          type: 'object',
          properties: {
            impactScore: { type: 'integer', minimum: 0, maximum: 100 },
            letterGrade: { type: 'string' },
          },
        },
        modules: { type: 'object', additionalProperties: true },
        insights: {
          type: 'array',
          items: { type: 'object', additionalProperties: true },
        },
      },
    },
    PlayerProfile: {
      type: 'object',
      additionalProperties: true,
      properties: {
        accountId: { type: 'integer' },
        rank: { type: 'object', additionalProperties: true },
        stats: { type: 'object', additionalProperties: true },
        topHeroes: {
          type: 'array',
          items: { type: 'object', additionalProperties: true },
        },
        generatedAt: { type: 'string', format: 'date-time' },
      },
    },
    TrendResponse: {
      type: 'object',
      additionalProperties: true,
      properties: {
        accountId: { type: 'integer' },
        sampleSize: { type: 'integer' },
        overallTrend: { type: 'string' },
        timeline: {
          type: 'array',
          items: { type: 'object', additionalProperties: true },
        },
      },
    },
    FavoriteRequest: {
      type: 'object',
      required: ['type', 'targetId'],
      properties: {
        type: { type: 'string', enum: ['player', 'match'] },
        targetId: { type: 'integer' },
        notes: { type: 'string' },
      },
    },
  },
  responses: {
    BadRequest: {
      description: 'Invalid request',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    Unauthorized: {
      description: 'Authentication required',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    NotFound: {
      description: 'Resource not found',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    TooManyRequests: {
      description: 'Rate limit exceeded',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
    ServerError: {
      description: 'Internal server error',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
    },
  },
};

function createOpenApiSpec({ isDev = false, port = 3001 } = {}) {
  return swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Deadlock AfterMatch API',
        version: '1.0.1',
        description:
          'REST API for Deadlock AfterMatch: Steam player resolution, match retrieval, match analysis, trends, metadata, favorites, and auth/session operations.',
        contact: { name: 'Support', email: 'contact@aftermatch.xyz' },
        license: { name: 'Proprietary' },
      },
      servers: [
        { url: API_URL, description: 'Production API Server' },
        { url: `http://localhost:${port}`, description: 'Local Development Server' },
      ],
      externalDocs: { description: 'Deadlock AfterMatch', url: SITE_URL },
      components,
      tags: [
        { name: 'Utility', description: 'Health, CSRF, cron, and operational endpoints.' },
        { name: 'Players', description: 'Steam resolution, player profile, match history, and rank timelines.' },
        { name: 'Matches', description: 'Match detail and metadata retrieval.' },
        { name: 'Analysis', description: 'Match analysis pipeline and cached reports.' },
        { name: 'Trends', description: 'Aggregated performance trends over recent analyses.' },
        { name: 'Metadata', description: 'Heroes, items, and ranks.' },
        { name: 'Authentication', description: 'Steam login and session endpoints.' },
        { name: 'Favorites', description: 'Authenticated user favorite players and matches.' },
        { name: 'Users', description: 'Authenticated user preferences.' },
      ],
    },
    apis: [path.join(__dirname, '..', 'routes', '*.js')],
  });
}

module.exports = {
  createOpenApiSpec,
};
