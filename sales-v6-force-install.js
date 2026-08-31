/* QMES startup hotfix - force Sales Order V6 on legacy V5 URL.
 * 2026-08-31
 *
 * Why this exists:
 * Some clients/deploy layers keep requesting the historical V5 asset URL.
 * At process startup, copy the current V6 implementation over the legacy V5
 * runtime file so even an old loader receives the new UI. Also disable cache
 * for the affected sales-order assets through express.static.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const source = path.join(root, 'public', 'js', 'qmes-sales-new-order-namo-modal-20260831-v6.js');
const legacy = path.join(root, 'public', 'js', 'qmes-sales-new-order-namo-modal-20260828-v5.js');

try {
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, legacy);
    console.log('[QMES] Sales Order V6 forced onto legacy V5 runtime asset');
  } else {
    console.warn('[QMES] Sales Order V6 source asset not found:', source);
  }
} catch (err) {
  console.error('[QMES] Failed to force Sales Order V6 runtime asset:', err && err.message ? err.message : err);
}

try {
  const express = require('express');
  const originalStatic = express.static;
  if (typeof originalStatic === 'function' && !express.__qmesSalesV6StaticPatched) {
    express.__qmesSalesV6StaticPatched = true;
    express.static = function qmesStatic(rootDir, options) {
      const opts = Object.assign({}, options || {});
      const originalSetHeaders = opts.setHeaders;
      opts.setHeaders = function setQmesHeaders(res, filePath, stat) {
        if (/qmes-sales-new-order-namo-modal-202608(28-v5|31-v6)\.js$|qmes-mes-master-loader-20260820-v2\.js$|[\\/]index\.html$/i.test(String(filePath || ''))) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.setHeader('Surrogate-Control', 'no-store');
        }
        if (typeof originalSetHeaders === 'function') originalSetHeaders(res, filePath, stat);
      };
      return originalStatic.call(express, rootDir, opts);
    };
    console.log('[QMES] Sales Order V6 cache-bypass headers enabled');
  }
} catch (err) {
  console.error('[QMES] Failed to patch static cache headers:', err && err.message ? err.message : err);
}
