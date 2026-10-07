'use strict';

const { Pool } = require('pg');
require('dotenv').config();

const RUN_KEY = 'qmes-operational-data-reset-20261007-v1';

function quoteIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

async function runQmesOperationalResetOnce() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS qmes_maintenance_runs (
        run_key TEXT PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        note TEXT DEFAULT ''
      )
    `);

    const marker = await client.query(
      `INSERT INTO qmes_maintenance_runs (run_key, note)
       VALUES ($1, $2)
       ON CONFLICT (run_key) DO NOTHING
       RETURNING run_key`,
      [RUN_KEY, 'Operational test-data reset; preserve users, permissions, attendance, NAMO Talk and master data']
    );

    if (!marker.rowCount) {
      await client.query('COMMIT');
      console.log('[QMES RESET] already completed:', RUN_KEY);
      return { skipped: true, runKey: RUN_KEY };
    }

    const candidates = [
      'purchase_receipts',
      'purchase_orders',
      'iqc',
      'pqc',
      'oqc',
      'nonconform',
      'worklog_materials',
      'worklog',
      'certificates',
      'training_reports',
      'inventory_lots',
      'inventory_balances',
      'inventory_transactions',
      'inventory_reservations',
      'inventory_counts'
    ];

    const existingResult = await client.query(
      `SELECT c.relname
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relname = ANY($1::text[])`,
      [candidates]
    );
    const existing = existingResult.rows.map((row) => row.relname);

    const counts = {};
    for (const table of existing) {
      const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdent(table)}`);
      counts[table] = Number(result.rows[0]?.count || 0);
    }

    if (existing.length) {
      await client.query(
        `TRUNCATE TABLE ${existing.map(quoteIdent).join(', ')} RESTART IDENTITY`
      );
    }

    let syncDeleted = 0;
    const syncExists = await client.query(
      `SELECT to_regclass('public.qmes_sync_records') IS NOT NULL AS present`
    );
    if (syncExists.rows[0]?.present) {
      const syncResult = await client.query(`
        DELETE FROM qmes_sync_records
         WHERE LOWER(COALESCE(record_type, '')) NOT IN (
           'attendance',
           'master',
           'supplier',
           'partner',
           'calibration',
           'user',
           'users',
           'member',
           'members',
           'permission',
           'permissions'
         )
      `);
      syncDeleted = Number(syncResult.rowCount || 0);
    }

    await client.query('COMMIT');
    console.log('[QMES RESET] completed:', JSON.stringify({
      runKey: RUN_KEY,
      clearedTables: counts,
      clearedSyncRecords: syncDeleted
    }));
    return { skipped: false, runKey: RUN_KEY, clearedTables: counts, clearedSyncRecords: syncDeleted };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[QMES RESET] failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = { runQmesOperationalResetOnce };
