const logger = require('./logger');
const responseContracts = require('../../client/src/api/response.contracts.json');

function normalizeSchema(schema) {
  if (!schema || typeof schema !== 'object') return null;
  if (schema.$ref === '#/moduleSchemas/heroPerformance') return responseContracts.moduleSchemas.heroPerformance;
  if (schema.$ref === '#/moduleSchemas/benchmarks') return responseContracts.moduleSchemas.benchmarks;
  return schema;
}

function isType(value, type) {
  switch (type) {
    case 'null':
      return value === null;
    case 'array':
      return Array.isArray(value);
    case 'integer':
      return Number.isInteger(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'string':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return true;
  }
}

function describeValue(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function validateAgainstSchema(value, schema, path = 'response', issues = []) {
  const normalizedSchema = normalizeSchema(schema);
  if (!normalizedSchema) return issues;

  if (normalizedSchema.type) {
    const expectedTypes = Array.isArray(normalizedSchema.type) ? normalizedSchema.type : [normalizedSchema.type];
    const matches = expectedTypes.some((type) => isType(value, type));
    if (!matches) {
      issues.push(`${path} expected ${expectedTypes.join('|')}, got ${describeValue(value)}`);
      return issues;
    }
  }

  if (Array.isArray(normalizedSchema.required) && value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of normalizedSchema.required) {
      if (value[key] === undefined) {
        issues.push(`${path}.${key} is missing`);
      }
    }
  }

  if (normalizedSchema.type === 'array' && Array.isArray(value) && normalizedSchema.items) {
    value.forEach((item, index) => {
      validateAgainstSchema(item, normalizedSchema.items, `${path}[${index}]`, issues);
    });
  }

  if (normalizedSchema.type === 'object' && value && typeof value === 'object' && !Array.isArray(value) && normalizedSchema.properties) {
    for (const [key, childSchema] of Object.entries(normalizedSchema.properties)) {
      if (value[key] !== undefined) {
        validateAgainstSchema(value[key], childSchema, `${path}.${key}`, issues);
      }
    }
  }

  return issues;
}

function warnOnContractMismatch(name, value, schema) {
  const issues = validateAgainstSchema(value, schema, name, []);
  if (issues.length > 0) {
    logger.warn(`[Contract] ${name} shape mismatch:\n- ${issues.join('\n- ')}`);
  }
  return issues;
}

module.exports = {
  responseContracts,
  ANALYSIS_RESPONSE_SCHEMA: responseContracts.analysis,
  HERO_PERFORMANCE_SCHEMA: responseContracts.moduleSchemas.heroPerformance,
  BENCHMARKS_SCHEMA: responseContracts.moduleSchemas.benchmarks,
  MATCH_HISTORY_SCHEMA: responseContracts.matchHistory,
  RESPONSE_CONTRACT_MAP: {
    analysis: responseContracts.analysis,
    'modules.heroPerformance': responseContracts.moduleSchemas.heroPerformance,
    'modules.benchmarks': responseContracts.moduleSchemas.benchmarks,
    matchHistory: responseContracts.matchHistory,
  },
  validateAgainstSchema,
  warnOnContractMismatch,
};
