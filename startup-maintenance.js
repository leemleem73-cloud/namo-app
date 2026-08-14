const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    await pool.query("DELETE FROM qmes_sync_records WHERE record_type = 'inventory'");
    await pool.query("DELETE FROM audit_logs WHERE target_table = 'qmes_sync_records' AND target_id LIKE 'inventory:%'");
    console.log('[QMES] retired data cleanup complete');
  } catch (error) {
    if (error && error.code === '42P01') {
      console.log('[QMES] retired data cleanup skipped: schema not ready');
    } else {
      console.error('[QMES] startup cleanup failed:', error.message);
      process.exitCode = 1;
    }
  } finally {
    await pool.end().catch(() => {});
  }
})();
