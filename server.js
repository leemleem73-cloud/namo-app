'use strict';

// NAMO Chemical ERP/MES enterprise dashboard server entry - 2026-09-03.
// The previous production server is preserved verbatim in server-legacy-20260903.js.
const fs = require('fs');
const path = require('path');

const enterpriseDashboard = path.join(__dirname, 'public', 'js', 'dashboard-namo-enterprise-20260903.jsx');
if (!fs.existsSync(enterpriseDashboard)) {
  console.error('[QMES] Enterprise dashboard module is missing:', enterpriseDashboard);
  process.exit(1);
}

process.env.QMES_DASHBOARD_BUILD = process.env.QMES_DASHBOARD_BUILD || '20260903-enterprise-v2';
require('./server-legacy-20260903.js');
