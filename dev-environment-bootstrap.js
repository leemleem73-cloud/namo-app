'use strict';

// Development/staging safety guard for the 20-user central-DB project.
// This module has NO effect unless QMES_ENV=development or QMES_ENV=staging.
require('dotenv').config();

const mode = String(process.env.QMES_ENV || '').trim().toLowerCase();
const isolated = mode === 'development' || mode === 'staging';

if (isolated) {
  const devUrl = String(process.env.DEV_DATABASE_URL || '').trim();
  if (!devUrl) {
    console.error('[QMES SAFETY] DEV_DATABASE_URL is required when QMES_ENV=' + mode + '.');
    console.error('[QMES SAFETY] Refusing to start so development code cannot use the production database.');
    process.exit(78);
  }

  process.env.DATABASE_URL = devUrl;
  process.env.NODE_ENV = mode === 'development' ? 'development' : 'staging';

  const devSecret = String(process.env.DEV_SESSION_SECRET || '').trim();
  if (devSecret) process.env.SESSION_SECRET = devSecret;

  console.log('[QMES] Isolated ' + mode + ' database mode enabled.');
}
