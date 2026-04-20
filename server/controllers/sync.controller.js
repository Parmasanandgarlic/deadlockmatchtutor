const { syncActiveAccounts, trackAccount, invalidatePlayerCaches } = require('../services/sync.service');
const { supabase } = require('../utils/supabase');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * GET /api/cron/sync
 * Scheduled job to refresh match data.
 * Protected by secret header.
 */
async function handleCronSync(req, res) {
  const authHeader = req.headers['authorization'];
  const vercelCronHeader = req.headers['x-vercel-cron'];
  const cronSecret = process.env.CRON_SECRET;

  // Vercel Cron requests do not support custom auth headers.
  // Accept either Vercel's cron signal header or a bearer token (used by GitHub Actions).
  const isVercelCron = vercelCronHeader === '1' || vercelCronHeader === 'true';
  const isAuthorizedManualTrigger = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (cronSecret && !isVercelCron && !isAuthorizedManualTrigger) {
    return res.status(401).json({ error: 'Unauthorized cron trigger' });
  }

  try {
    const limit = parseInt(req.query.limit) || 10;
    const results = await syncActiveAccounts(limit);
    
    res.json({
      status: 'success',
      message: `Synced ${results.success} accounts`,
      results
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

    // 2. Force a track update (this refreshes the timestamp)
    await trackAccount(accountId);
    
    res.json({ status: 'success', message: 'Sync triggered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Manual sync failed', message: err.message });
  }
}

module.exports = {
  handleCronSync,
  handleManualSync,
};
