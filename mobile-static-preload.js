'use strict';

// Small, reversible production hook: when Express registers its static middleware,
// serve /mobile.html for authenticated phone/tablet requests to the site root.
// Desktop requests and explicit /index.html requests are left untouched.
const express = require('express');

if (!express.__NAMO_MOBILE_STATIC_PATCHED__) {
  express.__NAMO_MOBILE_STATIC_PATCHED__ = true;
  const originalStatic = express.static;

  express.static = function namoMobileAwareStatic(root, options) {
    const staticMiddleware = originalStatic(root, options);

    return function namoMobileStaticMiddleware(req, res, next) {
      const originalUrl = req.url;
      try {
        const ua = String(req.headers['user-agent'] || '');
        const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
        const rootRequest = req.path === '/' || req.url === '/';
        const forceDesktop = String(req.query?.desktop || '') === '1' || String(req.query?.view || '') === 'desktop';
        const loggedIn = Boolean(req.session && req.session.user);

        if (mobile && rootRequest && loggedIn && !forceDesktop) {
          req.url = '/mobile.html';
          return staticMiddleware(req, res, err => {
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
