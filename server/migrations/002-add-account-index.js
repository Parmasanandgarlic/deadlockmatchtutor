/* eslint-disable no-undef */

/**
 * Migration 002: Add account_id index for player-first queries
 *
 * Problem: The analyses table uses a composite PK (match_id, account_id).
 * Querying all analyses for a given player requires a full table scan
 * because Postgres B-tree indexes are left-to-right — the PK index
 * only helps when match_id is provided first.
 *
 * Solution: Add a secondary index on (account_id, updated_at DESC)
 * to support efficient player-history queries.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createIndex('analyses', ['account_id', { name: 'updated_at', sort: 'DESC' }], {
    name: 'idx_analyses_account_id',
    ifNotExists: true,
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('analyses', [], { name: 'idx_analyses_account_id', ifExists: true });
};
