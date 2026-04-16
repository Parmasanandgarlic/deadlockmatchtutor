/**
 * Database Tests: Supabase `analyses` table CRUD + schema integrity
 *
 * Validates:
 *   - Table exists with required columns
 *   - Insert, Read, Update (upsert), Delete
 *   - Primary key uniqueness (match_id, account_id)
 *   - Reasonable write latency (<3s per operation)
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { createClient } = require('@supabase/supabase-js');
const assert = require('assert');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

async function test(name, fn) {
  try { await fn(); console.log(`  PASS  ${name}`); test.passed++; }
  catch (err) { console.error(`  FAIL  ${name}`); console.error(`        ${err.message}`); test.failed++; }
}
test.passed = 0; test.failed = 0;

(async () => {
  console.log('\n[Database] Supabase `analyses` table');

  if (!url || !key) {
    console.error('  SKIP  Supabase credentials missing in .env');
    process.exitCode = 2;
    return;
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Unique test keys so parallel runs don't collide
  const testMatchId = 999_000_000 + Math.floor(Math.random() * 999_999);
  const testAccountId = 888_000_000 + Math.floor(Math.random() * 999_999);

  await test('Schema: analyses table selectable', async () => {
    const { error } = await supabase.from('analyses').select('match_id').limit(1);
    assert.ok(!error, `Select failed: ${error?.message}`);
  });

  await test('CREATE: insert new analysis', async () => {
    const t0 = Date.now();
    const { error } = await supabase.from('analyses').insert({
      match_id: testMatchId,
      account_id: testAccountId,
      data: { test: true, createdBy: 'db.test.js' },
    });
    assert.ok(!error, `Insert failed: ${error?.message}`);
    assert.ok(Date.now() - t0 < 3000, 'Insert >3s');
  });

  await test('READ: read inserted analysis', async () => {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('match_id', testMatchId)
      .eq('account_id', testAccountId)
      .maybeSingle();
    assert.ok(!error, `Read failed: ${error?.message}`);
    assert.ok(data);
    assert.strictEqual(data.data.test, true);
  });

  await test('UPDATE: upsert existing analysis', async () => {
    const { error } = await supabase.from('analyses').upsert(
      { match_id: testMatchId, account_id: testAccountId, data: { test: true, updated: true } },
      { onConflict: 'match_id,account_id' }
    );
    assert.ok(!error, `Upsert failed: ${error?.message}`);

    const { data } = await supabase
      .from('analyses')
      .select('data')
      .eq('match_id', testMatchId)
      .eq('account_id', testAccountId)
      .maybeSingle();
    assert.strictEqual(data.data.updated, true);
  });

  await test('CONSTRAINT: duplicate insert rejected', async () => {
    const { error } = await supabase.from('analyses').insert({
      match_id: testMatchId,
      account_id: testAccountId,
      data: {},
    });
    assert.ok(error, 'Duplicate insert should fail');
  });

  await test('DELETE: remove test record', async () => {
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('match_id', testMatchId)
      .eq('account_id', testAccountId);
    assert.ok(!error, `Delete failed: ${error?.message}`);

    const { data } = await supabase
      .from('analyses')
      .select('*')
      .eq('match_id', testMatchId)
      .eq('account_id', testAccountId)
      .maybeSingle();
    assert.strictEqual(data, null);
  });

  console.log(`\n  ${test.passed} passed / ${test.failed} failed`);
  if (test.failed > 0) process.exitCode = 1;
})();
