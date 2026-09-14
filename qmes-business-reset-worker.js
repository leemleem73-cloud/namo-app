'use strict';

const { Pool } = require('pg');

const mode = String(process.env.QMES_RESET_MODE || '').trim().toLowerCase();
const token = String(process.env.QMES_RESET_BUSINESS_DATA_ONCE || '').trim();

if (!mode || !token || !process.env.DATABASE_URL) {
  console.log('[QMES RESET] skipped: reset mode/token/database not configured');
  process.exit(0);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const quoteIdent = value => `"${String(value).replace(/"/g, '""')}"`;

async function main() {
  const client = await pool.connect();
  try {
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    const tables = tablesResult.rows.map(row => String(row.tablename || '')).filter(Boolean);
    console.log('[QMES RESET] public tables:', tables.join(', '));

    if (mode === 'inspect') {
      console.log('[QMES RESET] inspect only; no data changed');
      return;
    }

    if (mode !== 'execute') {
      throw new Error(`unsupported QMES_RESET_MODE: ${mode}`);
    }

    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS qmes_reset_history (
        token TEXT PRIMARY KEY,
        reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        preserved_tables TEXT[] NOT NULL DEFAULT ARRAY['users']::TEXT[]
      )
    `);

    const previous = await client.query('SELECT token FROM qmes_reset_history WHERE token = $1', [token]);
    if (previous.rowCount) {
      await client.query('ROLLBACK');
      console.log('[QMES RESET] token already executed; skipping:', token);
      return;
    }

    const resetTables = tables.filter(name => name !== 'users' && name !== 'qmes_reset_history');
    if (resetTables.length) {
      const sql = `TRUNCATE TABLE ${resetTables.map(quoteIdent).join(', ')} RESTART IDENTITY CASCADE`;
      await client.query(sql);
    }

    await client.query(
      `INSERT INTO qmes_reset_history (token, preserved_tables)
       VALUES ($1, ARRAY['users']::TEXT[])`,
      [token]
    );
    await client.query('COMMIT');

    const usersCount = await client.query('SELECT COUNT(*)::int AS count FROM users');
    console.log('[QMES RESET] completed:', token);
    console.log('[QMES RESET] truncated tables:', resetTables.join(', '));
    console.log('[QMES RESET] preserved users:', usersCount.rows[0]?.count ?? 0);
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_rollbackError) {}
    console.error('[QMES RESET] failed:', error && error.stack ? error.stack : error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().then(() => process.exit(process.exitCode || 0));
