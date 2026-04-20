const { supabase } = require('../utils/supabase');
const { getMatchHistory } = require('./deadlockApi.service');
const redisClient = require('./redis.service');
const logger = require('../utils/logger');

/**
 * Record an account as 'tracked' and update its last seen time.
 * @param {string|number} accountId
 */
async function trackAccount(accountId) {
  if (!accountId || !supabase) return;

  try {
    const { error } = await supabase
      .from('tracked_accounts')
      .upsert({ 
        account_id: accountId,
        last_synced_at: new Date().toISOString(),
        is_active: true
      }, { onConflict: 'account_id' });

    if (error) {
      // If table doesn't exist yet, we catch it silently in production
      if (error.code === 'PGRST116' || error.message.includes('not found')) {
        logger.warn(`tracked_accounts table not found. Skipping tracking for ${accountId}.`);
        return;
      }
      throw error;
    }
    
    // Increment search count separately to avoid race conditions or use RPC if needed
    // For now, a simple upsert is fine as last_synced_at is the primary driver
    logger.debug(`Tracked account: ${accountId}`);
  } catch (err) {
    logger.error(`Failed to track account ${accountId}: ${err.message}`);
  }
}

async function invalidatePlayerCaches(accountId, { includeAnalyses = true } = {}) {
  const cacheKeys = [
    redisClient.cacheKeys?.playerMatches?.(accountId),
    redisClient.cacheKeys?.userProfile?.(accountId),
    `mmr:${accountId}`,
  ].filter(Boolean);

  await Promise.all(cacheKeys.map((key) => redisClient.del(key).catch(() => false)));

  if (includeAnalyses && supabase) {
    try {
      await supabase
        .from('analyses')
        .delete()
        .eq('account_id', Number(accountId));
    } catch (err) {
      logger.warn(`Failed to invalidate Supabase analyses for ${accountId}: ${err.message}`);
    }
  }
}

/**
 * Sync the most out-of-date accounts.
 * @param {number} limit Number of accounts to sync in this batch
 */
async function syncActiveAccounts(limit = 10) {
  if (!supabase) throw new Error('Supabase client not initialized');

  logger.info(`Starting batch sync for ${limit} accounts...`);

  // 1. Fetch oldest synced accounts
  const { data: accounts, error } = await supabase
    .from('tracked_accounts')
    .select('account_id')
    .eq('is_active', true)
    .order('last_synced_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  if (!accounts || accounts.length === 0) {
    logger.info('No accounts found for syncing.');
    return { synced: 0 };
  }

  const results = {
    total: accounts.length,
    success: 0,
    failed: 0,
    errors: []
  };

  // 2. Loop and refresh
  for (const account of accounts) {
    try {
      logger.info(`Syncing account ${account.account_id}...`);
      
      await invalidatePlayerCaches(account.account_id, { includeAnalyses: false });

      // We call the API. Even if we don't store the matches yet (as per current design),
      // the "sync" ensures the API has them cached or the service has done its duty.
      // In a future step, we will implement a match_cache table.
      await getMatchHistory(account.account_id);

      // Update timestamp
      await supabase
        .from('tracked_accounts')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('account_id', account.account_id);

      results.success++;
    } catch (err) {
      logger.error(`Sync failed for ${account.account_id}: ${err.message}`);
      results.failed++;
      results.errors.push({ account_id: account.account_id, error: err.message });
    }
  }

  logger.info(`Batch sync complete. Success: ${results.success}, Failed: ${results.failed}`);
  return results;
}

module.exports = {
  trackAccount,
  syncActiveAccounts,
  invalidatePlayerCaches,
};
