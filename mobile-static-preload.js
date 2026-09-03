'use strict';

// Small, reversible production hook for NAMO QMES mobile/iPad routing and branding.
// Desktop requests are left untouched unless the user is actually on a mobile/tablet user agent.
const fs = require('fs');
const path = require('path');
const express = require('express');

if (!express.__NAMO_MOBILE_STATIC_PATCHED__) {
  express.__NAMO_MOBILE_STATIC_PATCHED__ = true;
  const originalStatic = express.static;

  function servePatchedMobileFile(root, req, res, next) {
    const pathname = String(req.path || '').toLowerCase();
    if (pathname !== '/mobile.html' && pathname !== '/mobile-work.html') return false;

    const fileName = pathname === '/mobile-work.html' ? 'mobile-work.html' : 'mobile.html';
    const filePath = path.join(root, fileName);

    fs.readFile(filePath, 'utf8', (error, source) => {
      if (error) return next(error);

      let html = source;

      // Mobile/iPad home: always use the dedicated NAMO mobile symbol.
      if (fileName === 'mobile.html') {
        html = html
          .replace(/\/assets\/namo-mobile-logo\.svg(?:\?[^"']*)?/g, '/assets/namo-mobile-logo.svg?v=20260903-ipad2')
          .replace(/\/assets\/namo-header-logo\.svg(?:\?[^"']*)?/g, '/assets/namo-mobile-logo.svg?v=20260903-ipad2');
      }

      // Mobile/iPad work screens: remove the temporary letter N and show the NAMO symbol.
      if (fileName === 'mobile-work.html') {
        html = html.replace('.brandmark{display:none}', '.brandmark{display:grid}');
        html = html.replace(
          '</style>',
          '.brandmark{font-size:0!important;color:transparent!important;background:transparent url("/assets/namo-mobile-logo.svg?v=20260903-ipad2") center/contain no-repeat!important;box-shadow:none!important;border-radius:0!important;border:0!important}\n</style>'
        );
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return res.send(html);
    });

    return true;
  }

  function isMobileOrIPadRequest(req) {
    const ua = String(req.headers['user-agent'] || '');
    // iPhone/iPad/iPod, Android mobile/tablet, and iPadOS Safari all include one
    // of these tokens in the deployed browsers used by QMES.
    return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
  }

  function isEntryPageRequest(req) {
    const pathname = String(req.path || '').toLowerCase();
    return pathname === '/' || pathname === '/index.html';
  }

  express.static = function namoMobileAwareStatic(root, options) {
    const staticMiddleware = originalStatic(root, options);

    return function namoMobileStaticMiddleware(req, res, next) {
      const originalUrl = req.url;

      // Apply mobile branding at response time so browser cache cannot keep old assets.
      if (servePatchedMobileFile(root, req, res, next)) return;

      try {
        const mobileOrIPad = isMobileOrIPadRequest(req);
        const entryPage = isEntryPageRequest(req);
        const forceDesktop = String(req.query?.desktop || '') === '1' || String(req.query?.view || '') === 'desktop';
        const embeddedMobile = String(req.query?.embeddedMobile || '') === '1';
        const loggedIn = Boolean(req.session && req.session.user);

        // Login may redirect to /index.html rather than /. Treat both as the same
        // mobile/iPad landing page after authentication. embeddedMobile and
        // desktop=1 are intentional exceptions used by mobile-work.html.
        if (mobileOrIPad && entryPage && loggedIn && !forceDesktop && !embeddedMobile) {
          req.url = '/mobile.html';
          return servePatchedMobileFile(root, req, res, next) || staticMiddleware(req, res, err => {
            req.url = originalUrl;
            if (err) return next(err);
            return next();
          });
        }
      } catch (error) {
        req.url = originalUrl;
      }

      return staticMiddleware(req, res, next);
    };
  };
}
