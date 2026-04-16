const { Pool } = require('pg');

require('dotenv').config();

const connectionString = 'postgresql://postgres:@***REMOVED_PASSWORD***@db.***REMOVED_PROJECT_ID***.supabase.co:5432/postgres';

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

    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analyses_updated_at ON analyses(updated_at DESC)
    `);
    console.log('✓ Created index on updated_at');

    // Enable Row Level Security
    await client.query(`
      ALTER TABLE analyses ENABLE ROW LEVEL SECURITY
    `);
    console.log('✓ Enabled Row Level Security');

    // Create policy for service role (drop if exists first)
    try {
      await client.query(`DROP POLICY IF EXISTS "Service role can do everything" ON analyses`);
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
