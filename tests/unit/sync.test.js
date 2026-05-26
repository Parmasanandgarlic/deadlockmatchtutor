require('dotenv').config();
const { syncActiveAccounts, trackAccount } = require('../../server/services/sync.service');

async function testSyncLogic() {
  console.log('Testing Synchronization Logic...');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('SKIP: Supabase service credentials missing in .env');
    process.exitCode = 2;
    return;
  }
  
  try {
    // 1. Test tracking an account
    // Should not crash when the required tracked_accounts table exists.
    console.log('Test: Tracking account 12345...');
    await trackAccount(12345);
    console.log('PASS: trackAccount completed without crashing.');

    // 2. Test batch sync
    // Should complete against the required tracked_accounts table.
    console.log('Test: Running batch sync...');
    const result = await syncActiveAccounts(1);
    console.log('Result:', result);
    console.log('PASS: syncActiveAccounts completed.');

  } catch (err) {
    console.error('FAIL: Sync test failed. Ensure tracked_accounts migration has been applied.');
    console.error(err);
    process.exit(1);
  }
}

testSyncLogic();
