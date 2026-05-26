const { Pool } = require('pg');

require('dotenv').config();

// Set DATABASE_URL in your .env file — never hardcode credentials here.
// Format: postgresql://postgres:YOUR_PASSWORD@db.<project-ref>.supabase.co:5432/postgres // sast-ignore
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  console.error('Copy .env.example to .env and fill in your credentials.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

async function setupDatabase() {
  console.log('Setting up Supabase database schema...');

  const client = await pool.connect();

  try {
    // Create analyses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        match_id BIGINT NOT NULL,
        account_id BIGINT NOT NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        PRIMARY KEY (match_id, account_id)
      )
    `);
    console.log('✓ Created analyses table');

    // Create tracked_accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tracked_accounts (
        account_id BIGINT PRIMARY KEY,
        last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      )
    `);
    console.log('✓ Created tracked_accounts table');

    await client.query(`
      ALTER TABLE tracked_accounts
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    `);
    await client.query(`
      UPDATE tracked_accounts SET is_active = true WHERE is_active IS NULL
    `);
    await client.query(`
      ALTER TABLE tracked_accounts
        ALTER COLUMN is_active SET DEFAULT true,
        ALTER COLUMN is_active SET NOT NULL,
        ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
        ALTER COLUMN created_at SET NOT NULL
    `);
    console.log('✓ Normalized tracked_accounts columns');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analyses_updated_at ON analyses(updated_at DESC)
    `);
    console.log('✓ Created index on updated_at');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analyses_account_id ON analyses(account_id, updated_at DESC)
    `);
    console.log('✓ Created index on account_id');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tracked_accounts_sync
      ON tracked_accounts(is_active, last_synced_at ASC)
      WHERE is_active = true
    `);
    console.log('✓ Created tracked_accounts sync index');

    // Enable Row Level Security
    await client.query(`
      ALTER TABLE analyses ENABLE ROW LEVEL SECURITY
    `);
    await client.query(`
      ALTER TABLE tracked_accounts ENABLE ROW LEVEL SECURITY
    `);
    console.log('✓ Enabled Row Level Security');

    // Create policy for service role (drop if exists first)
    try {
      await client.query(`DROP POLICY IF EXISTS "Service role can do everything" ON analyses`);
      await client.query(`DROP POLICY IF EXISTS "Service role can do everything" ON tracked_accounts`);
    } catch (err) {
      // Policy doesn't exist, that's fine
    }
    await client.query(`
      CREATE POLICY "Service role can do everything" ON analyses
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role')
    `);
    console.log('✓ Created service role policy');

    await client.query(`
      CREATE POLICY "Service role can do everything" ON tracked_accounts
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role')
    `);
    console.log('✓ Created tracked_accounts service role policy');

    console.log('\n✓ Database schema created successfully');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
