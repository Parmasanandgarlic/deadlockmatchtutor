/* eslint-disable no-undef */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('analyses', {
    match_id: { type: 'bigint', notNull: true },
    account_id: { type: 'bigint', notNull: true },
    data: { type: 'jsonb', notNull: true },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func("timezone('utc'::text, now())"),
    },
  }, {
    ifNotExists: true,
  });

  pgm.addConstraint('analyses', 'analyses_pkey', {
    primaryKey: ['match_id', 'account_id'],
  });

  pgm.createIndex('analyses', 'updated_at', {
    name: 'idx_analyses_updated_at',
    method: 'btree',
    opclass: 'desc',
    ifNotExists: true,
  });

  pgm.createIndex('analyses', ['match_id', 'account_id'], {
    name: 'idx_analyses_match_account',
    ifNotExists: true,
  });
};

exports.down = (pgm) => {
  pgm.dropTable('analyses', { ifExists: true });
};
