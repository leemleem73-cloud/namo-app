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
const publicRouter = path.resolve(__dirname, 'public', 'js', 'router.jsx');
const legacyDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard.jsx');
const enterpriseDashboard = path.resolve(__dirname, 'public', 'js', 'dashboard-namo-enterprise-20260903.jsx');
const originalReadFile = fs.readFile.bind(fs);
const SHELL_BUILD = '20260903-shell-mobile-button1';

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

// Desktop header shortcut: place a dedicated mobile-workspace button immediately
// to the left of NAMO Talk. The original router source remains unchanged in Git;
// this startup patch only normalizes the deployed working copy.
try {
  const source = fs.readFileSync(publicRouter, 'utf8');
  const mobileButton = '<button type="button" onClick={()=>window.location.assign("/mobile.html?v=20260903-mobile-button1")} className="relative flex items-center gap-2 px-3.5 py-2 rounded border text-sm font-bold" style={{background:"#fff",borderColor:"#bfd0dc",color:"#29485f"}} aria-label="모바일용 화면 열기"><span aria-hidden="true">📱</span><span>모바일용</span></button>';
  const talkButton = '<button type="button" onClick={()=>setTalkOpen(value=>!value)} className="relative flex items-center gap-2 px-3.5 py-2 rounded border text-sm font-bold" style={{background:talkOpen?"#e7f2fa":"#fff",borderColor:talkOpen?"#8cb8d4":"#bfd0dc",color:"#29485f"}} aria-label={talkOpen?"NAMO Talk 닫기":"NAMO Talk 열기"} aria-expanded={talkOpen}><span aria-hidden="true">💬</span><span>NAMO Talk</span></button>';
  const patched = source.includes(mobileButton)
    ? source
    : source.replace(talkButton, `${mobileButton}\n          ${talkButton}`);
  if (patched !== source) fs.writeFileSync(publicRouter, patched, 'utf8');
} catch (error) {
  console.error('[QMES] Failed to install mobile header shortcut:', error);
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
