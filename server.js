'use strict';

// NAMO Chemical ERP/MES enterprise dashboard server entry - 2026-09-03.
// Original production server is preserved verbatim in server-legacy-20260903.js.
const fs = require('fs');
const path = require('path');

// Hard mobile guard must load before any other mobile/static patch so a phone or
// iPad can never boot the desktop React login/sidebar shell, even from stale
// cached entry pages or in-app browsers with unusual User-Agent strings.
require('./mobile-hard-entry-preload.js');

// Always install mobile root routing before the legacy Express app is created.
// This works whether production starts with `npm start` or `node server.js`.
require('./mobile-static-preload.js');

const publicIndex = path.resolve(__dirname, 'public', 'index.html');
const legacyDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard.jsx');
const enterpriseDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard-namo-enterprise-20260903.jsx');
const originalReadFile = fs.readFile.bind(fs);
const SHELL_BUILD = '20260903-shell-final4';

if (!fs.existsSync(enterpriseDashboard)) {
  console.error('[QMES] Enterprise dashboard module is missing:', enterpriseDashboard);
  process.exit(1);
}

// Express static/sendFile streams index.html and does not reliably pass through a
// fs.readFile monkey-patch. Normalize the actual index source once, before the
// legacy Express server starts, so every static delivery points at one shell build.
try {
  const source = fs.readFileSync(publicIndex, 'utf8');
  const normalized = source
    .replace(/qmes-shell-layer-base-20260827\.css\?v=[^"']+/g, `qmes-shell-layer-base-20260827.css?v=${SHELL_BUILD}`)
    .replace(/router\.jsx\?v=[^"']+/g, `router.jsx?v=${SHELL_BUILD}`)
    .replace(/app\.jsx\?v=[^"']+/g, `app.jsx?v=${SHELL_BUILD}`)
    .replace(/qmes-collapsible-side-menu\.js\?v=[^"']+/g, `qmes-collapsible-side-menu.js?v=${SHELL_BUILD}`);
  if (normalized !== source) fs.writeFileSync(publicIndex, normalized, 'utf8');
} catch (error) {
  console.error('[QMES] Failed to normalize shell asset URLs:', error);
  process.exit(1);
}

fs.readFile = function qmesEnterpriseDashboardReadFile(file, ...args) {
  let target = file;
  try {
    if (path.resolve(String(file)) === legacyDashboard) target = enterpriseDashboard;
  } catch (_error) {}

  const callbackIndex = args.findIndex(arg => typeof arg === 'function');
  if (callbackIndex < 0 || target !== enterpriseDashboard) return originalReadFile(target, ...args);

  const callback = args[callbackIndex];
  const nextArgs = args.slice();
  nextArgs[callbackIndex] = (error, source) => {
    if (error) return callback(error);
    let patched = String(source);
    patched = patched.replace(
      '["INV","재고입고", data.inventoryLotCount + " LOT","inventory","inventoryMenu"]',
      '["INV","재고입고", data.inventoryLotCount + " LOT","inv",""]'
    );
    patched = patched.replace(
      '.namo-enterprise-dashboard *{box-sizing:border-box}',
      '.namo-enterprise-dashboard *{box-sizing:border-box}.qmes-ref-brand-mark{display:none!important}'
    );
    callback(null, patched);
  };
  return originalReadFile(target, ...nextArgs);
};

process.env.QMES_DASHBOARD_BUILD = process.env.QMES_DASHBOARD_BUILD || `20260903-enterprise-v5-${SHELL_BUILD}`;
require('./server-legacy-20260903.js');
