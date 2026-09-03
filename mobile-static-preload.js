'use strict';

// Reversible production hook for NAMO QMES mobile/iPad routing and branding.
// The PC source files remain unchanged. Mobile/iPad behavior is applied only at response time.
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

      if (fileName === 'mobile.html') {
        html = html
          .replace(/\/assets\/namo-mobile-logo\.svg(?:\?[^"']*)?/g, '/assets/namo-mobile-logo.svg?v=20260903-ipad3')
          .replace(/\/assets\/namo-header-logo\.svg(?:\?[^"']*)?/g, '/assets/namo-mobile-logo.svg?v=20260903-ipad3');
      }

      if (fileName === 'mobile-work.html') {
        html = html.replace('.brandmark{display:none}', '.brandmark{display:grid}');
        html = html.replace(
          '</style>',
          '.brandmark{font-size:0!important;color:transparent!important;background:transparent url("/assets/namo-mobile-logo.svg?v=20260903-ipad3") center/contain no-repeat!important;box-shadow:none!important;border-radius:0!important;border:0!important}\n</style>'
        );
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return res.send(html);
    });

    return true;
  }

  function isExplicitDesktopRequest(req) {
    const queryDesktop = String(req.query?.desktop || '') === '1' || String(req.query?.view || '') === 'desktop';
    const referer = String(req.headers.referer || '');
    const refererDesktop = /[?&](?:desktop=1|view=desktop)(?:&|$)/i.test(referer);
    const embeddedMobile = String(req.query?.embeddedMobile || '') === '1' || /[?&]embeddedMobile=1(?:&|$)/i.test(referer);
    return queryDesktop || refererDesktop || embeddedMobile;
  }

  // app.jsx is a SPA: after a successful login it calls setCurrentUser() and stays
  // on the already-loaded PC page, so an HTTP redirect never gets a chance to run.
  // Inject only a tiny runtime detector into the served JS. It recognizes modern
  // iPadOS desktop-mode Safari via MacIntel + touch points, while a real Mac stays PC.
  function servePatchedLoginApp(root, req, res, next) {
    const pathname = String(req.path || '').toLowerCase();
    if (pathname !== '/js/app.jsx' || isExplicitDesktopRequest(req)) return false;

    const filePath = path.join(root, 'js', 'app.jsx');
    fs.readFile(filePath, 'utf8', (error, source) => {
      if (error) return next(error);

      const runtimeHelper = `\nfunction qmesShouldUseMobileWorkspace(){\n  try {\n    const ua=String(navigator.userAgent||'');\n    const mobileUA=/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);\n    const ipadDesktop=String(navigator.platform||'')==='MacIntel' && Number(navigator.maxTouchPoints||0)>1;\n    const params=new URLSearchParams(location.search);\n    const forceDesktop=params.get('desktop')==='1'||params.get('view')==='desktop'||params.get('embeddedMobile')==='1';\n    return !forceDesktop && (mobileUA||ipadDesktop);\n  } catch(_error) { return false; }\n}\nfunction qmesGoMobileWorkspace(){\n  if(!qmesShouldUseMobileWorkspace()) return false;\n  location.replace('/mobile.html?v=20260903-ipad-login3');\n  return true;\n}\n`;

      let patched = runtimeHelper + source;

      // Normal login and initial-password completion both go through handleLogin.
      patched = patched.replace(
        '    setCheckingSession(false);\n    setCurrentUser(user);',
        '    setCheckingSession(false);\n    if (qmesGoMobileWorkspace()) return;\n    setCurrentUser(user);'
      );

      // Existing saved login sessions are verified through /api/auth/me and then
      // call setCurrentUser directly, so redirect there as well.
      patched = patched.replace(
        '        saveLoginSession(normalized);\n        setCurrentUser(normalized);',
        '        saveLoginSession(normalized);\n        if (qmesGoMobileWorkspace()) return;\n        setCurrentUser(normalized);'
      );

      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return res.send(patched);
    });

    return true;
  }

  function isMobileOrIPadRequest(req) {
    const ua = String(req.headers['user-agent'] || '');
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

      if (servePatchedMobileFile(root, req, res, next)) return;
      if (servePatchedLoginApp(root, req, res, next)) return;

      try {
        const mobileOrIPad = isMobileOrIPadRequest(req);
        const entryPage = isEntryPageRequest(req);
        const explicitDesktop = isExplicitDesktopRequest(req);
        const loggedIn = Boolean(req.session && req.session.user);

        if (mobileOrIPad && entryPage && loggedIn && !explicitDesktop) {
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
