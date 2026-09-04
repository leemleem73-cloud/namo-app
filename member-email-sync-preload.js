'use strict';

const { Pool } = require('pg');

const MEMBER_EMAILS = [
  ['임흥배', 'hbleem@namochemical.com'],
  ['김현진', 'hyunjinkim@namochemical.com'],
  ['박도훈', 'dhbak@namochemical.com'],
  ['박지헌', 'jhp1767@namochemical.com'],
  ['박현아', 'hapark@namochemical.com'],
  ['문지훈', 'jh4ever@namochemical.com'],
  ['김세희', 'shkim@namochemical.com'],
  ['정영기', 'ygjeong@namochemical.com'],
];

let attempt = 0;
const MAX_ATTEMPTS = 20;
const RETRY_MS = 1500;

async function syncMemberEmails() {
  attempt += 1;

  if (!process.env.DATABASE_URL) {
    console.warn('[QMES] MEMBER_EMAIL_SYNC skipped: DATABASE_URL is missing.');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const exists = await pool.query("SELECT to_regclass('public.users') AS table_name");
    if (!exists.rows[0]?.table_name) {
      throw new Error('users table is not ready');
    }

    let changed = 0;
    let skipped = 0;

    for (const [name, email] of MEMBER_EMAILS) {
      const result = await pool.query(
        `UPDATE users AS u
         SET email = $1
         WHERE u.name = $2
           AND LOWER(COALESCE(u.email, '')) <> LOWER($1)
           AND NOT EXISTS (
             SELECT 1
             FROM users AS other
             WHERE LOWER(other.email) = LOWER($1)
               AND other.id <> u.id
           )
         RETURNING u.id, u.name, u.email`,
        [email, name]
      );

      if (result.rowCount) changed += result.rowCount;
      else {
        const check = await pool.query('SELECT email FROM users WHERE name = $1 LIMIT 1', [name]);
        if (!check.rowCount || String(check.rows[0].email || '').toLowerCase() !== email.toLowerCase()) skipped += 1;
      }
    }

    console.log(`[QMES] MEMBER_EMAIL_SYNC complete: changed=${changed}, skipped=${skipped}`);
  } catch (error) {
    if (attempt < MAX_ATTEMPTS) {
      console.warn(`[QMES] MEMBER_EMAIL_SYNC retry ${attempt}/${MAX_ATTEMPTS}: ${error.message}`);
      setTimeout(syncMemberEmails, RETRY_MS);
    } else {
      console.error('[QMES] MEMBER_EMAIL_SYNC failed:', error);
    }
  } finally {
    await pool.end().catch(() => {});
  }
}

setTimeout(syncMemberEmails, 0);

module.exports = { MEMBER_EMAILS, syncMemberEmails };
