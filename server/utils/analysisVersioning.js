const PIPELINE_VERSION = 'pipeline-2026-05-17-data-quality-v1';
const BENCHMARK_VERSION = 'benchmarks-2026-05-17-v1';
const SOURCE_PAYLOAD_VERSION = 'deadlock-bulk-metadata-v2-kda-objectives-items';

function analysisCacheKey(matchId, accountId) {
  return [
    'analysis',
    PIPELINE_VERSION,
    BENCHMARK_VERSION,
    SOURCE_PAYLOAD_VERSION,
    Number(matchId),
    Number(accountId),
  ].join(':');
}

function isFreshAnalysisPayload(payload) {
  const meta = payload?.meta || {};
  return (
    meta.pipelineVersion === PIPELINE_VERSION &&
    meta.benchmarkVersion === BENCHMARK_VERSION &&
    meta.sourcePayloadVersion === SOURCE_PAYLOAD_VERSION
  );
}

module.exports = {
  PIPELINE_VERSION,
  BENCHMARK_VERSION,
  SOURCE_PAYLOAD_VERSION,
  analysisCacheKey,
  isFreshAnalysisPayload,
};
