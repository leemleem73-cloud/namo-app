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
      .replace(/\/index\.html\?logout=1&mobileLogin=1/g, '/mobile-login.html?logout=1')
      .replace(/\/index\.html\?mobileLogin=1/g, '/mobile-login.html?mobile=1');
  }

  function forceLatestMobileMenuRoutes(source) {
    let html = String(source || '');

    html = html
      .replace("['수주 · 납기관리','▤','pending:erpSales']", "['수주 · 납기관리','▤','erpSales']")
      .replace("['수주·납기관리','▤','pending:erpSales']", "['수주·납기관리','▤','erpSales']")
      .replace("['생산계획 · MRP','▥','pending:erpPlan']", "['생산계획 · MRP','▥','erpPlan']")
      .replace("['생산계획·MRP','▥','pending:erpPlan']", "['생산계획·MRP','▥','erpPlan']")
      .replace("['구매 · 발주관리','□','pending:erpPurchase']", "['구매 · 발주관리','□','erpPurchase']")
      .replace("['구매·발주관리','□','pending:erpPurchase']", "['구매·발주관리','□','erpPurchase']")
      .replace(/function goPurchase\(\)\{location\.assign\('\/mobile-work\.html\?tab=erpPurchase[^']*'\)\}/g, "function goPurchase(){location.assign('/mobile-purchase.html?v=20260904-purchase3')}");

    const routeAnchor = "openingText.textContent=`${label} 화면을 여는 중입니다.`;opening.classList.add('show');";
    const forcedRoutes = [
      "if(code==='spc'){location.assign('/mobile-spc.html?v=20260904-spc2');return}",
      "if(code==='erpSales'){location.assign('/mobile-sales.html?v=20260904-sales5');return}",
      "if(code==='erpPlan'){location.assign('/mobile-plan.html?v=20260904-plan2');return}",
      "if(code==='erpPurchase'){location.assign('/mobile-purchase.html?v=20260904-purchase3');return}",
      "if(code==='pending:erpSales'){location.assign('/mobile-sales.html?v=20260904-sales5');return}",
      "if(code==='pending:erpPlan'){location.assign('/mobile-plan.html?v=20260904-plan2');return}",
      "if(code==='pending:erpPurchase'){location.assign('/mobile-purchase.html?v=20260904-purchase3');return}"
    ].filter(line=>!html.includes(line));

    if (forcedRoutes.length && html.includes(routeAnchor)) {
      html = html.replace(routeAnchor, forcedRoutes.join('\n    ') + '\n    ' + routeAnchor);
    }

    return html;
  }

  function servePatchedMobileFile(root, req, res, next) {
    const pathname = String(req.path || '').toLowerCase();
    const mobileFiles = new Set([
      '/mobile.html',
      '/mobile-work.html',
      '/mobile-login.html',
      '/mobile-spc.html',
      '/mobile-sales.html',
      '/mobile-plan.html',
      '/mobile-purchase.html',
      '/mobile-dashboard.html'
    ]);
    if (!mobileFiles.has(pathname)) return false;

    const fileName = pathname.replace(/^\//, '');
    const filePath = path.join(root, fileName);

    fs.readFile(filePath, 'utf8', (error, source) => {
      if (error) {
        if (error.code === 'ENOENT') return next();
        return next(error);
      }

      let html = rewriteMobileAuthTargets(source);

      if (fileName === 'mobile.html') {
        html = forceLatestMobileMenuRoutes(html)
          .replace(/\/assets\/namo-mobile-logo\.svg(?:\?[^"']*)?/g, '/assets/namo-mobile-logo.svg?v=20260904-mobile-force8')
          .replace(/\/assets\/namo-header-logo\.svg(?:\?[^"']*)?/g, '/assets/namo-mobile-logo.svg?v=20260904-mobile-force8');
      }

      if (fileName === 'mobile-work.html') {
        html = html.replace('.brandmark{display:none}', '.brandmark{display:grid}');
        html = html.replace(
          '</style>',
          '.brandmark{font-size:0!important;color:transparent!important;background:transparent url("/assets/namo-mobile-logo.svg?v=20260904-mobile-force8") center/contain no-repeat!important;box-shadow:none!important;border-radius:0!important;border:0!important}\n</style>'
        );

        if (!html.includes('qmes-mobile-native-adapter-20260903.js')) html = html.replace('</body>', '<script src="/js/qmes-mobile-native-adapter-20260903.js?v=20260903-native1"></script>\n</body>');
        if (!html.includes('qmes-mobile-quality-entry-20260903.js')) html = html.replace('</body>', '<script src="/js/qmes-mobile-quality-entry-20260903.js?v=20260903-quality1"></script>\n</body>');
        if (!html.includes('qmes-mobile-inventory-trace-20260903.js')) html = html.replace('</body>', '<script src="/js/qmes-mobile-inventory-trace-20260903.js?v=20260903-invtrace1"></script>\n</body>');
        if (!html.includes('qmes-mobile-production-20260903.js')) html = html.replace('</body>', '<script src="/js/qmes-mobile-production-20260903.js?v=20260903-prod1"></script>\n</body>');
        if (!html.includes('qmes-mobile-iqc-20260903.js')) html = html.replace('</body>', '<script src="/js/qmes-mobile-iqc-20260903.js?v=20260903-iqc1"></script>\n</body>');
        if (!html.includes('qmes-mobile-operation-write-20260903.js')) html = html.replace('</body>', '<script src="/js/qmes-mobile-operation-write-20260903.js?v=20260903-write1"></script>\n</body>');
        if (!html.includes('qmes-mobile-direct-entry-20260903.js')) html = html.replace('</body>', '<script src="/js/qmes-mobile-direct-entry-20260903.js?v=20260903-direct1"></script>\n</body>');
        if (!html.includes('qmes-mobile-workorder-pc-parity-20260903.js')) html = html.replace('</body>', '<script src="/js/qmes-mobile-workorder-pc-parity-20260903.js?v=20260903-wopc1"></script>\n</body>');
      }

      if (fileName === 'mobile-sales.html' && !html.includes('qmes-mobile-sales-detail-20260904.js')) {
        html = html.replace('</body>', '<script src="/js/qmes-mobile-sales-detail-20260904.js?v=20260904-sales-detail2"></script>\n</body>');
      }

      if (fileName !== 'mobile-login.html'
          && fileName !== 'mobile-spc.html'
          && fileName !== 'mobile-sales.html'
          && fileName !== 'mobile-plan.html'
          && fileName !== 'mobile-purchase.html'
          && fileName !== 'mobile-dashboard.html'
          && !html.includes('qmes-mobile-documents-20260903.js')) {
        html = html.replace('</body>', '<script src="/js/qmes-mobile-documents-20260903.js?v=20260903-docs1"></script>\n</body>');
      }

      html = rewriteMobileAuthTargets(html);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
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
      if (error) { if (error.code === 'ENOENT') return next(); return next(error); }
      const patched = rewriteMobileAuthTargets(source);
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
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
    return String(req.query?.desktop || '') === '1' || String(req.query?.view || '') === 'desktop' || String(req.query?.embeddedMobile || '') === '1';
  }

  function servePatchedLoginApp(root, req, res, next) {
    const pathname = String(req.path || '').toLowerCase();
    if (pathname !== '/js/app.jsx' || isExplicitDesktopRequest(req)) return false;
    const filePath = path.join(root, 'js', 'app.jsx');
    fs.readFile(filePath, 'utf8', (error, source) => {
      if (error) return next(error);
      const runtimeHelper = `\nfunction qmesShouldUseMobileWorkspace(){\n  try {\n    const ua=String(navigator.userAgent||'');\n    const mobileUA=/Android|iPhone|iPad|iPod|Mobile|Tablet|SamsungBrowser|KAKAOTALK/i.test(ua);\n    const ipadDesktop=String(navigator.platform||'')==='MacIntel' && Number(navigator.maxTouchPoints||0)>1;\n    const params=new URLSearchParams(location.search);\n    const forceDesktop=params.get('desktop')==='1'||params.get('view')==='desktop'||params.get('embeddedMobile')==='1';\n    return !forceDesktop && (mobileUA||ipadDesktop);\n  } catch(_error) { return false; }\n}\nfunction qmesGoMobileWorkspace(){\n  if(!qmesShouldUseMobileWorkspace()) return false;\n  location.replace('/mobile-login.html?v=20260904-mobile-force8');\n  return true;\n}\n`;
      let patched = runtimeHelper + source;
      patched = patched.replace('function QMESApp() {', `function QMESApp() {\n  if (qmesShouldUseMobileWorkspace()) {\n    location.replace('/mobile-login.html?v=20260904-mobile-force8');\n    return null;\n  }`);
      patched = patched.replace('    setCheckingSession(false);\n    setCurrentUser(user);', '    setCheckingSession(false);\n    if (qmesGoMobileWorkspace()) return;\n    setCurrentUser(user);');
      patched = patched.replace('        saveLoginSession(normalized);\n        setCurrentUser(normalized);', '        saveLoginSession(normalized);\n        if (qmesGoMobileWorkspace()) return;\n        setCurrentUser(normalized);');
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
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
        const explicitDesktop = isCurrentRequestExplicitDesktop(req);
        const loggedIn = Boolean(req.session && req.session.user);
        if (mobileOrIPad && entryPage && !explicitDesktop) {
          req.url = loggedIn ? '/mobile.html?v=20260904-mobile-force8' : '/mobile-login.html?v=20260904-mobile-force8';
          return servePatchedMobileFile(root, req, res, next) || staticMiddleware(req, res, err => {
            req.url = originalUrl;
            if (err) return next(err);
            return next();
          });
        }
      } catch (error) { req.url = originalUrl; }
      return staticMiddleware(req, res, next);
    };
  };
}
