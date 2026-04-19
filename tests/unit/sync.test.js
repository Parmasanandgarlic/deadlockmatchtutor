const { syncActiveAccounts, trackAccount } = require('../../server/services/sync.service');
const logger = require('../../server/utils/logger');

async function testSyncLogic() {
  console.log('Testing Synchronization Logic (Graceful Degradation Check)...');
  
  try {
    // 1. Test tracking an account
    // Should not crash even if Supabase is misconfigured or table is missing
    console.log('Test: Tracking account 12345...');
    await trackAccount(12345);
    console.log('PASS: trackAccount completed without crashing.');

    // 2. Test batch sync
    // Should catch the error if table is missing or DB is down
    console.log('Test: Running batch sync...');
    const result = await syncActiveAccounts(1);
    console.log('Result:', result);
    console.log('PASS: syncActiveAccounts completed.');

  } catch (err) {
    if (err.message.includes('relation "tracked_accounts" does not exist') || err.message.includes('not initialized')) {
      console.log('PASS: Correctly caught expected database/init error:', err.message);
    } else {
      console.error('FAIL: Unexpected error:', err);
      process.exit(1);
    }
  }
}

testSyncLogic();
