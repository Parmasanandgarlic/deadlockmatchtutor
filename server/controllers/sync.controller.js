const { syncActiveAccounts, trackAccount, invalidatePlayerCaches } = require('../services/sync.service');
const { getMatchHistory } = require('../services/deadlockApi.service');
const logger = require('../utils/logger');

/**
 * GET /api/cron/sync
 * Scheduled job to refresh match data.
 *
 * Vercel sends CRON_SECRET as an Authorization bearer token for configured
 * Cron Jobs. Require that secret explicitly rather than trusting a
 * client-supplied platform-identification header.
 */
async function handleCronSync(req, res) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error('Cron sync rejected because CRON_SECRET is not configured');
    return res.status(503).json({ error: 'Cron sync is not configured' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized cron trigger' });
  }

  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 10;
    const results = await syncActiveAccounts(limit);

    res.json({
      status: 'success',
      message: `Synced ${results.success || 0} accounts`,
      results,
    });
  } catch (err) {
    logger.error('Cron sync handler failed:', err);
    res.status(500).json({ error: 'Cron sync failed', message: err.message });
  }
}

/**
 * POST /api/players/:accountId/sync
 * Manually trigger a fresh fetch for a specific account.
 */
async function handleManualSync(req, res) {
  try {
    const { accountId } = req.params;
    if (!accountId) return res.status(400).json({ error: 'Account ID required' });

    logger.info(`Manual sync requested for ${accountId}`);

    // 1. Clear stale cached match/profile/analysis data
    await invalidatePlayerCaches(accountId);

    // 2. Force a fresh fetch and re-track the account
    const matches = await getMatchHistory(accountId, { bypassCache: true });
    await trackAccount(accountId);

    res.json({
      status: 'success',
      message: 'Sync triggered successfully',
      matches,
    });
  } catch (err) {
    res.status(500).json({ error: 'Manual sync failed', message: err.message });
  }
}

module.exports = {
  handleCronSync,
  handleManualSync,
};
