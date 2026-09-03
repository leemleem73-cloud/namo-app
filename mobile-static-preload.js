'use strict';

// Reversible production hook for NAMO QMES mobile/iPad routing and branding.
// The PC source files remain unchanged. Mobile/iPad behavior is applied only at response time.
const fs = require('fs');
const path = require('path');
const express = require('express');

if (!express.__NAMO_MOBILE_STATIC_PATCHED__) {
  express.__NAMO_MOBILE_STATIC_PATCHED__ = true;
  const originalStatic = express.static;

  function rewriteMobileAuthTargets(source) {
    return String(source || '')
      // Always use the dedicated mobile login page from mobile-only code.
      // This prevents the desktop React shell/sidebar from ever becoming the
      // logout/session-expiry destination on a phone or iPad.
      .replace(/\/index\.html\?logout=1&mobileLogin=1/g, '/mobile-login.html?logout=1')
      .replace(/\/index\.html\?mobileLogin=1/g, '/mobile-login.html?mobile=1');
  }

  function servePatchedMobileFile(root, req, res, next) {
    const pathname = String(req.path || '').toLowerCase();
    if (pathname !== '/mobile.html' && pathname !== '/mobile-work.html' && pathname !== '/mobile-login.html') return false;

    const fileName = pathname === '/mobile-work.html'
      ? 'mobile-work.html'
      : pathname === '/mobile-login.html'
        ? 'mobile-login.html'
        : 'mobile.html';
    const filePath = path.join(root, fileName);

    fs.readFile(filePath, 'utf8', (error, source) => {
      if (error) return next(error);

      let html = rewriteMobileAuthTargets(source);

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

        if (!html.includes('qmes-mobile-native-adapter-20260903.js')) {
          html = html.replace(
            '</body>',
            '<script src="/js/qmes-mobile-native-adapter-20260903.js?v=20260903-native1"></script>\n</body>'
          );
        }

        // PQC/OQC native editor is loaded only inside mobile-work.html.
        // It never touches or executes in the desktop index.html source path.
        if (!html.includes('qmes-mobile-quality-entry-20260903.js')) {
          html = html.replace(
            '</body>',
            '<script src="/js/qmes-mobile-quality-entry-20260903.js?v=20260903-quality1"></script>\n</body>'
          );
        }

        // Inventory and LOT trace native workspace is also mobile-work only.
        // Desktop index.html and its React modules remain unchanged.
        if (!html.includes('qmes-mobile-inventory-trace-20260903.js')) {
          html = html.replace(
            '</body>',
            '<script src="/js/qmes-mobile-inventory-trace-20260903.js?v=20260903-invtrace1"></script>\n</body>'
          );
        }

        // Work order and production process native workspace is mobile-work only.
        // Desktop index.html and production React modules remain unchanged.
        if (!html.includes('qmes-mobile-production-20260903.js')) {
          html = html.replace(
            '</body>',
            '<script src="/js/qmes-mobile-production-20260903.js?v=20260903-prod1"></script>\n</body>'
          );
        }

        // Dedicated IQC workspace is loaded only inside mobile-work.html.
        // Desktop IQC React source remains untouched.
        if (!html.includes('qmes-mobile-iqc-20260903.js')) {
          html = html.replace(
            '</body>',
            '<script src="/js/qmes-mobile-iqc-20260903.js?v=20260903-iqc1"></script>\n</body>'
          );
        }

        // Writable production/equipment/partner/POP overlays stay mobile-work only.
        if (!html.includes('qmes-mobile-operation-write-20260903.js')) {
          html = html.replace(
            '</body>',
            '<script src="/js/qmes-mobile-operation-write-20260903.js?v=20260903-write1"></script>\n</body>'
          );
        }

        // ?new=1 opens the correct native create editor immediately.
        if (!html.includes('qmes-mobile-direct-entry-20260903.js')) {
          html = html.replace(
            '</body>',
            '<script src="/js/qmes-mobile-direct-entry-20260903.js?v=20260903-direct1"></script>\n</body>'
          );
        }

        // Current PC IssueWoTab parity implementation, mobile-work only.
        // Loaded last so it replaces the older simplified mobile work-order UI without touching PC source.
        if (!html.includes('qmes-mobile-workorder-pc-parity-20260903.js')) {
          html = html.replace(
            '</body>',
            '<script src="/js/qmes-mobile-workorder-pc-parity-20260903.js?v=20260903-wopc1"></script>\n</body>'
          );
        }
      }

      // Mobile document authoring center is available from both the mobile home
      // and mobile-work shell. It is never injected into the desktop index.html.
      if (fileName !== 'mobile-login.html' && !html.includes('qmes-mobile-documents-20260903.js')) {
        html = html.replace(
          '</body>',
          '<script src="/js/qmes-mobile-documents-20260903.js?v=20260903-docs1"></script>\n</body>'
        );
      }

      // Re-apply auth-target rewrite after script injection so every inline path
      // remains mobile-only even when the underlying file still contains an old
      // /index.html?mobileLogin=1 destination.
      html = rewriteMobileAuthTargets(html);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      return res.send(html);
    });

    return true;
  }

  function servePatchedMobileScript(root, req, res, next) {
    const pathname = String(req.path || '').toLowerCase();
    if (!/^\/js\/qmes-mobile-[a-z0-9._-]+\.js$/.test(pathname)) return false;

    const relativePath = pathname.replace(/^\//, '');
    const filePath = path.join(root, relativePath);
    fs.readFile(filePath, 'utf8', (error, source) => {
      if (error) {
        if (error.code === 'ENOENT') return next();
        return next(error);
      }
      const patched = rewriteMobileAuthTargets(source);
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      return res.send(patched);
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

  function isCurrentRequestExplicitDesktop(req) {
    return String(req.query?.desktop || '') === '1'
      || String(req.query?.view || '') === 'desktop'
      || String(req.query?.embeddedMobile || '') === '1';
  }

  function servePatchedLoginApp(root, req, res, next) {
    const pathname = String(req.path || '').toLowerCase();
    if (pathname !== '/js/app.jsx' || isExplicitDesktopRequest(req)) return false;

    const filePath = path.join(root, 'js', 'app.jsx');
    fs.readFile(filePath, 'utf8', (error, source) => {
      if (error) return next(error);

      const runtimeHelper = `\nfunction qmesShouldUseMobileWorkspace(){\n  try {\n    const ua=String(navigator.userAgent||'');\n    const mobileUA=/Android|iPhone|iPad|iPod|Mobile|Tablet|SamsungBrowser|KAKAOTALK/i.test(ua);\n    const ipadDesktop=String(navigator.platform||'')==='MacIntel' && Number(navigator.maxTouchPoints||0)>1;\n    const params=new URLSearchParams(location.search);\n    const forceDesktop=params.get('desktop')==='1'||params.get('view')==='desktop'||params.get('embeddedMobile')==='1';\n    return !forceDesktop && (mobileUA||ipadDesktop);\n  } catch(_error) { return false; }\n}\nfunction qmesGoMobileWorkspace(){\n  if(!qmesShouldUseMobileWorkspace()) return false;\n  location.replace('/mobile-login.html?v=20260903-mobile-entry3');\n  return true;\n}\n`;

      let patched = runtimeHelper + source;

      // Critical mobile login guard: browser-side detection runs before the
      // desktop login component can render. This prevents the persistent PC
      // sidebar/dashboard DOM from appearing behind the login form.
      patched = patched.replace(
        'function QMESApp() {',
        `function QMESApp() {\n  if (qmesShouldUseMobileWorkspace()) {\n    location.replace('/mobile-login.html?v=20260903-mobile-entry3');\n    return null;\n  }`
      );

      patched = patched.replace(
        '    setCheckingSession(false);\n    setCurrentUser(user);',
        '    setCheckingSession(false);\n    if (qmesGoMobileWorkspace()) return;\n    setCurrentUser(user);'
      );

      patched = patched.replace(
        '        saveLoginSession(normalized);\n        setCurrentUser(normalized);',
        '        saveLoginSession(normalized);\n        if (qmesGoMobileWorkspace()) return;\n        setCurrentUser(normalized);'
      );

      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      return res.send(patched);
    });

    return true;
  }

  function isMobileOrIPadRequest(req) {
    const ua = String(req.headers['user-agent'] || '');
    return /Android|iPhone|iPad|iPod|Mobile|Tablet|SamsungBrowser|KAKAOTALK/i.test(ua);
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
      if (servePatchedMobileScript(root, req, res, next)) return;
      if (servePatchedLoginApp(root, req, res, next)) return;

      try {
        const mobileOrIPad = isMobileOrIPadRequest(req);
        const entryPage = isEntryPageRequest(req);
        // For a fresh root/index request, only the CURRENT query may explicitly
        // request desktop mode. A stale desktop referer must never force a phone
        // back into the PC shell after logout.
        const explicitDesktop = isCurrentRequestExplicitDesktop(req);
        const loggedIn = Boolean(req.session && req.session.user);

        if (mobileOrIPad && entryPage && !explicitDesktop) {
          req.url = loggedIn ? '/mobile.html' : '/mobile-login.html';
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