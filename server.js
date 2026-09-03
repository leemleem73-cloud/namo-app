'use strict';

// NAMO Chemical ERP/MES enterprise dashboard server entry - 2026-09-03.
// Original production server is preserved verbatim in server-legacy-20260903.js.
const fs = require('fs');
const path = require('path');

// Always install mobile root routing before the legacy Express app is created.
// This works whether production starts with `npm start` or `node server.js`.
require('./mobile-static-preload.js');

const publicIndex = path.resolve(__dirname, 'public', 'index.html');
const legacyDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard.jsx');
const enterpriseDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard-namo-enterprise-20260903.jsx');
const originalReadFile = fs.readFile.bind(fs);

if (!fs.existsSync(enterpriseDashboard)) {
  console.error('[QMES] Enterprise dashboard module is missing:', enterpriseDashboard);
  process.exit(1);
}

fs.readFile = function qmesEnterpriseShellReadFile(file, ...args) {
  let target = file;
  let resolved = '';
  try {
    resolved = path.resolve(String(file));
    if (resolved === legacyDashboard) target = enterpriseDashboard;
  } catch (_error) {}

  const callbackIndex = args.findIndex(arg => typeof arg === 'function');
  if (callbackIndex < 0) return originalReadFile(target, ...args);

  const shouldPatchDashboard = target === enterpriseDashboard;
  const shouldPatchIndex = resolved === publicIndex;
  if (!shouldPatchDashboard && !shouldPatchIndex) return originalReadFile(target, ...args);

  const callback = args[callbackIndex];
  const nextArgs = args.slice();
  nextArgs[callbackIndex] = (error, source) => {
    if (error) return callback(error);
    let patched = String(source);

    if (shouldPatchDashboard) {
      patched = patched.replace(
        '["INV","재고입고", data.inventoryLotCount + " LOT","inventory","inventoryMenu"]',
        '["INV","재고입고", data.inventoryLotCount + " LOT","inv",""]'
      );
      patched = patched.replace(
        '.namo-enterprise-dashboard *{box-sizing:border-box}',
        '.namo-enterprise-dashboard *{box-sizing:border-box}.qmes-ref-brand-mark{display:none!important}'
      );
    }

    if (shouldPatchIndex) {
      // Force a new URL for the rebuilt shell assets so stale browser/CDN CSS cannot survive.
      patched = patched
        .replace('qmes-shell-layer-base-20260827.css?v=20260903-erp-sidebar-rebuild1', 'qmes-shell-layer-base-20260827.css?v=20260903-shell-final3')
        .replace('router.jsx?v=20260903-errorfix1', 'router.jsx?v=20260903-shell-final3')
        .replace('app.jsx?v=20260903-errorfix1', 'app.jsx?v=20260903-shell-final3')
        .replace('qmes-collapsible-side-menu.js?v=20260903-erp-sidebar-rebuild1', 'qmes-collapsible-side-menu.js?v=20260903-shell-final3');
    }

    callback(null, patched);
  };
  return originalReadFile(target, ...nextArgs);
};

process.env.QMES_DASHBOARD_BUILD = process.env.QMES_DASHBOARD_BUILD || '20260903-enterprise-v5-shell-final3';
require('./server-legacy-20260903.js');
