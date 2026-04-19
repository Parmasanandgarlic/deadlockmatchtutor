const { syncActiveAccounts, trackAccount } = require('../services/sync.service');
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
  const cronSecret = process.env.CRON_SECRET;

  // Simple secret check for Vercel Cron protection
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
    
    // 1. Force a track update (this refreshes the timestamp)
    await trackAccount(accountId);
    
    // 2. Clear any local/API caches if they existed (in our case, just hit the service)
    // The service call results are what we care about
    res.json({ status: 'success', message: 'Sync triggered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Manual sync failed', message: err.message });
  }
}

module.exports = {
  handleCronSync,
  handleManualSync,
};
