/* eslint-disable no-undef */

/**
 * Migration 003: Create tracked_accounts for search tracking and cron sync.
 *
 * This table is used by sync.service.js and /api/cron/sync. Keeping it in the
 * node-pg-migrate path prevents production databases from relying on the
 * one-off setup-supabase.js script.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('tracked_accounts', {
    account_id: { type: 'bigint', notNull: true, primaryKey: true },
    last_synced_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("timezone('utc'::text, now())"),
    },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("timezone('utc'::text, now())"),
    },
  }, {
    ifNotExists: true,
  });

  pgm.sql(`
    ALTER TABLE tracked_accounts
      ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
  `);
  pgm.sql('UPDATE tracked_accounts SET is_active = true WHERE is_active IS NULL');
  pgm.sql(`
    ALTER TABLE tracked_accounts
      ALTER COLUMN is_active SET DEFAULT true,
      ALTER COLUMN is_active SET NOT NULL,
      ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
      ALTER COLUMN created_at SET NOT NULL
  `);

  pgm.createIndex('tracked_accounts', ['is_active', { name: 'last_synced_at', sort: 'ASC' }], {
    name: 'idx_tracked_accounts_sync',
    where: 'is_active = true',
    ifNotExists: true,
  });

  pgm.sql('ALTER TABLE tracked_accounts ENABLE ROW LEVEL SECURITY');
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'tracked_accounts'
          AND policyname = 'Service role can do everything'
      ) THEN
        CREATE POLICY "Service role can do everything" ON tracked_accounts
          FOR ALL
          USING (auth.role() = 'service_role')
          WITH CHECK (auth.role() = 'service_role');
      END IF;
    END
    $$;
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('tracked_accounts', { ifExists: true });
};
