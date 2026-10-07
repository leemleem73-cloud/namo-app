'use strict';

const { Pool } = require('pg');
require('dotenv').config();

const token = String(process.env.QMES_RESET_TOKEN || '').trim();
if (!token) {
  console.log('[QMES-RESET] no reset token; skipped');
  process.exit(0);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const TARGET_TABLES = [
  'certificates',
  'worklog_materials',
  'worklog',
  'nonconform',
  'supplier_scores',
  'suppliers',
  'oqc',
  'pqc',
  'iqc',
  'training_reports',
  'instruments',
  'purchase_receipts',
  'purchase_orders',
  'inventory_transactions',
  'inventory_reservations',
  'inventory_counts',
  'inventory_balances',
  'inventory_lots',
  'qmes_sync_records'
];

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS qmes_maintenance_markers (
        marker_key TEXT PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        note TEXT NOT NULL DEFAULT ''
      )
    `);

    const done = await client.query(
      'SELECT 1 FROM qmes_maintenance_markers WHERE marker_key = $1',
      [token]
    );
    if (done.rowCount) {
      await client.query('ROLLBACK');
      console.log('[QMES-RESET] token already executed; skipped:', token);
      return;
    }

    const tableRows = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    );
    const existing = new Set(tableRows.rows.map(row => row.tablename));
    const targets = TARGET_TABLES.filter(name => existing.has(name));

    if (targets.length) {
      const quoted = targets.map(name => '"' + name.replace(/"/g, '""') + '"').join(', ');
      await client.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
    }

    await client.query(
      `INSERT INTO qmes_maintenance_markers(marker_key, note)
       VALUES ($1, $2)`,
      [token, 'QMES operational/test data reset; users, sessions, attendance, NAMO Talk, inventory masters preserved']
    );

    await client.query('COMMIT');
    console.log('[QMES-RESET] completed:', token, targets.join(', '));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[QMES-RESET] failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }
})().catch(error => {
  console.error('[QMES-RESET] fatal:', error);
  process.exitCode = 1;
});
