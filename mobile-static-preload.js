'use strict';

// Small, reversible production hook for NAMO QMES mobile routing and branding.
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

      // Mobile home: use the official NM symbol extracted from the supplied company logo.
      if (fileName === 'mobile.html') {
        html = html
          .replace(/\/assets\/namo-mobile-logo\.svg(?:\?[^"']*)?/g, '/assets/namo-symbol-official.png?v=20260903-official')
          .replace(/\/assets\/namo-header-logo\.svg(?:\?[^"']*)?/g, '/assets/namo-symbol-official.png?v=20260903-official');
      }

      // Mobile work screens: remove the temporary letter N and show only the official NM symbol.
      if (fileName === 'mobile-work.html') {
        html = html.replace('.brandmark{display:none}', '.brandmark{display:grid}');
        html = html.replace(
          '</style>',
          '.brandmark{font-size:0!important;color:transparent!important;background:transparent url("/assets/namo-symbol-official.png?v=20260903-official") center/contain no-repeat!important;box-shadow:none!important;border-radius:0!important;border:0!important}\n</style>'
        );
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return res.send(html);
    });

    return true;
  }

  express.static = function namoMobileAwareStatic(root, options) {
    const staticMiddleware = originalStatic(root, options);

    return function namoMobileStaticMiddleware(req, res, next) {
      const originalUrl = req.url;

      // Apply mobile branding at response time so browser cache cannot keep the old placeholder logo.
      if (servePatchedMobileFile(root, req, res, next)) return;

      try {
        const ua = String(req.headers['user-agent'] || '');
        const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
        const rootRequest = req.path === '/' || req.url === '/';
        const forceDesktop = String(req.query?.desktop || '') === '1' || String(req.query?.view || '') === 'desktop';
        const loggedIn = Boolean(req.session && req.session.user);

        if (mobile && rootRequest && loggedIn && !forceDesktop) {
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
