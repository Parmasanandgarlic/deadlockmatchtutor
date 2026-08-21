const { supabase } = require('../utils/supabase');
const { getMatchHistory } = require('./deadlockApi.service');
const redisClient = require('./redis.service');
const logger = require('../utils/logger');
const { logAndFallback } = require('../utils/logging');

/**
 * Record an account as tracked and update its last-seen time.
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
        is_active: true,
      }, { onConflict: 'account_id' });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('not found')) {
        logger.warn(`tracked_accounts table not found. Skipping tracking for ${accountId}.`);
        return;
      }
      throw error;
    }

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

  await Promise.all(cacheKeys.map((key) => (
    redisClient.del(key).catch(logAndFallback(`[Redis] Failed to delete cache key ${key}`, false))
  )));

  if (includeAnalyses && supabase) {
    try {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('account_id', Number(accountId));
      if (error) throw error;
    } catch (err) {
      logger.warn(`Failed to invalidate Supabase analyses for ${accountId}: ${err.message}`);
    }
  }
}

/**
 * Sync the least-recently refreshed active accounts.
 * @param {number} limit Number of accounts to sync in this batch
 * @returns {Promise<{total:number,success:number,failed:number,errors:Array}>}
 */
async function syncActiveAccounts(limit = 10) {
  if (!supabase) throw new Error('Supabase client not initialized');

  logger.info(`Starting batch sync for ${limit} accounts...`);

  const { data: accounts, error } = await supabase
    .from('tracked_accounts')
    .select('account_id')
    .eq('is_active', true)
    .order('last_synced_at', { ascending: true })
    .limit(limit);

  if (error) throw error;

  const results = {
    total: accounts?.length || 0,
    success: 0,
    failed: 0,
    errors: [],
  };

  if (!accounts || accounts.length === 0) {
    logger.info('No accounts found for syncing.');
    return results;
  }

  for (const account of accounts) {
    try {
      logger.info(`Syncing account ${account.account_id}...`);

      await invalidatePlayerCaches(account.account_id, { includeAnalyses: false });
      await getMatchHistory(account.account_id);

      const { error: updateError } = await supabase
        .from('tracked_accounts')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('account_id', account.account_id);
      if (updateError) throw updateError;

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
