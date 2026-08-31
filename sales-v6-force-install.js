/* QMES startup static-asset optimizer - 2026-08-31
 * Historical filename kept because package.json preloads this module.
 *
 * Fixes:
 * 1) DO NOT copy V6 over V5 at server startup anymore.
 * 2) Keep index / master loader / current Sales Order V8 uncached so deployments appear immediately.
 * 3) Allow the remaining dated JS/CSS assets to be browser-cached and revalidated,
 *    reducing F5 reload time without changing runtime execution order.
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
        const isCurrentSalesOrder = /qmes-sales-new-order-namo-modal-20260831-v8\.js$/i.test(file);
        const isStaticAsset = /\.(?:js|jsx|css)$/i.test(file);

        if (isHtml || isMasterLoader || isCurrentSalesOrder) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.setHeader('Surrogate-Control', 'no-store');
        } else if (isStaticAsset) {
          // Dated/versioned QMES assets can be reused on normal reloads.
          // F5 may revalidate, but ETag/Last-Modified can return 304 instead of full payloads.
          res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
          res.removeHeader('Pragma');
          res.removeHeader('Expires');
          res.removeHeader('Surrogate-Control');
        }

        if (typeof originalSetHeaders === 'function') originalSetHeaders(res, filePath, stat);
      };

      return originalStatic.call(express, rootDir, opts);
    };

    console.log('[QMES] Static cache optimization enabled; obsolete Sales V6 force-copy disabled');
  }
} catch (err) {
  console.error('[QMES] Failed to optimize static cache:', err && err.message ? err.message : err);
}
