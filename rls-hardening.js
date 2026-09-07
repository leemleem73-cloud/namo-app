'use strict';

const { Pool } = require('pg');
require('dotenv').config();

const TABLES = [
  'attendance_profiles',
  'attendance_logs',
  'leave_requests',
  'leave_approval_history',
  'attendance_notifications',
  'attendance_passkeys',
  'attendance_passkey_challenges',
  'attendance_corrections',
];

if (process.env.DATABASE_URL) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  setImmediate(async () => {
    try {
      for (const table of TABLES) {
        await pool.query(`ALTER TABLE IF EXISTS public.${table} ENABLE ROW LEVEL SECURITY`);
      }
      console.log('[RLS hardening] enabled on attendance tables');
    } catch (error) {
      console.error('[RLS hardening] failed:', error.message);
    } finally {
      await pool.end().catch(() => {});
    }
  });
}
