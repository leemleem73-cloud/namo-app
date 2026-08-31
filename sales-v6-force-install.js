/* QMES startup static-asset optimizer - 2026-08-31
 * Historical filename kept because package.json preloads this module.
 *
 * Stability rules:
 * 1) DO NOT copy historical Sales modules over current files.
 * 2) Login/auth critical runtime files are NEVER browser-cached. Different PCs
 *    must not run different auth/bootstrap/observer revisions.
 * 3) Current Sales Order / MRP / master loader are also uncached.
 * 4) Remaining dated JS/CSS assets may be cached and revalidated.
 */
'use strict';

try {
  const express = require('express');
  const originalStatic = express.static;

  if (typeof originalStatic === 'function' && !express.__qmesStaticCacheOptimized20260831) {
    express.__qmesStaticCacheOptimized20260831 = true;

    express.static = function qmesOptimizedStatic(rootDir, options) {
      const opts = Object.assign({}, options || {});
      const originalSetHeaders = opts.setHeaders;

      opts.setHeaders = function setQmesHeaders(res, filePath, stat) {
        const file = String(filePath || '');
        const isHtml = /[\\/]index\.html$/i.test(file) || /\.html$/i.test(file);
        const isMasterLoader = /qmes-mes-master-loader-20260820-v2\.js$/i.test(file);
        const isCurrentSalesOrder = /qmes-sales-new-order-namo-modal-20260831-v9\.js$/i.test(file);
        const isCurrentLiveMrp = /qmes-sample-development-mrp-live-20260831-v1\.js$/i.test(file);

        // Login stability: these files control first paint, server-session check,
        // authenticated app ownership, and the observer that previously caused
        // a whole-document repaint loop on some PCs. Never allow stale copies.
        const isLoginCritical = /(?:auth-session-fastcheck-20260812\.js|qmes-login-sync-guard-20260831-v1\.js|qmes-sync\.js|app\.jsx|router\.jsx|equipment-inspector-selector-20260828\.js)$/i.test(file);
        const isStaticAsset = /\.(?:js|jsx|css)$/i.test(file);

        if (isHtml || isMasterLoader || isCurrentSalesOrder || isCurrentLiveMrp || isLoginCritical) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.setHeader('Surrogate-Control', 'no-store');
        } else if (isStaticAsset) {
          // Other dated/versioned QMES assets can be reused on normal reloads.
          res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
          res.removeHeader('Pragma');
          res.removeHeader('Expires');
          res.removeHeader('Surrogate-Control');
        }

        if (typeof originalSetHeaders === 'function') originalSetHeaders(res, filePath, stat);
      };

      return originalStatic.call(express, rootDir, opts);
    };

    console.log('[QMES] Static cache optimization enabled; login-critical runtime is no-store');
  }
} catch (err) {
  console.error('[QMES] Failed to optimize static cache:', err && err.message ? err.message : err);
}
