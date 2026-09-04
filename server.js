'use strict';

// NAMO Chemical ERP/MES enterprise dashboard server entry - 2026-09-03.
// Original production server is preserved verbatim in server-legacy-20260903.js.
const fs = require('fs');
const path = require('path');

require('./attendance-core-safe.js');
require('./attendance-correction-safe.js');
require('./attendance-leave-cancel-safe.js');
require('./mobile-hard-entry-preload.js');
require('./mobile-static-preload.js');
require('./member-email-sync-preload.js');

const publicIndex = path.resolve(__dirname, 'public', 'index.html');
const publicRouter = path.resolve(__dirname, 'public', 'js', 'router.jsx');
const publicShellMenu = path.resolve(__dirname, 'public', 'js', 'qmes-collapsible-side-menu.js');
const legacyDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard.jsx');
const enterpriseDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard-namo-enterprise-20260903.jsx');
const originalReadFile = fs.readFile.bind(fs);
const SHELL_BUILD = '20260904-deepclean-fit45';

// Preserve the working production server below this header.
require('./server-legacy-20260903.js');
