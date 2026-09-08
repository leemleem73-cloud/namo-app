'use strict';

// Load attendance production patches early because Render starts with `node server.js`.
// These modules install their API hooks before the legacy Express app is created,
// and inject the latest attendance mobile client assets into public/attendance.html.
require('./attendance-work-schedule-safe.js');
require('./attendance-mobile-fix-preload.js');

// Hard mobile-entry guard. This runs before the normal mobile preload and before
// the legacy Express app is created. It does not change desktop source files.
// Its only job is to stop the desktop React shell/sidebar from ever rendering on
// a phone/iPad when the session is logged out, expired, or coming from an older
// cached mobile page.
const express = require('express');

if (!express.__NAMO_MOBILE_HARD_ENTRY_PATCHED__) {
  express.__NAMO_MOBILE_HARD_ENTRY_PATCHED__ = true;
  const originalStatic = express.static;

  function currentRequestForcesDesktop(req) {
    return String(req.query?.desktop || '') === '1'
      || String(req.query?.view || '') === 'desktop'
      || String(req.query?.embeddedMobile || '') === '1';
  }

  function mobileHeader(req) {
    const ua = String(req.headers['user-agent'] || '');
    const chMobile = String(req.headers['sec-ch-ua-mobile'] || '').trim() === '?1';
    const chPlatform = String(req.headers['sec-ch-ua-platform'] || '');
    return chMobile
      || /Android|iPhone|iPad|iPod|Mobile|Tablet|SamsungBrowser|KAKAOTALK|KakaoTalk|DaumApps|NAVER|; wv\)|\bwv\b/i.test(ua)
      || /Android|iOS/i.test(chPlatform);
  }

  function mobileIntent(req) {
    const queryIntent = String(req.query?.mobileLogin || '') === '1'
      || String(req.query?.mobile || '') === '1';
    const referer = String(req.headers.referer || '');
    const mobileReferer = /\/(?:mobile|mobile-work|mobile-login)\.html(?:[?#]|$)/i.test(referer);
    return queryIntent || mobileReferer;
  }

  function shouldForceMobile(req) {
    return !currentRequestForcesDesktop(req) && (mobileHeader(req) || mobileIntent(req));
  }

  function isEntry(pathname) {
    return pathname === '/' || pathname === '/index.html';
  }

  express.static = function namoHardMobileEntryStatic(root, options) {
    const staticMiddleware = originalStatic(root, options);

    return function namoHardMobileEntryMiddleware(req, res, next) {
      const pathname = String(req.path || '').toLowerCase();

      if (shouldForceMobile(req) && isEntry(pathname)) {
        req.url = '/mobile-login.html?v=20260903-hard-entry1';
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        return staticMiddleware(req, res, next);
      }

      if (shouldForceMobile(req) && pathname === '/js/app.jsx') {
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        return res.send("location.replace('/mobile-login.html?v=20260903-hard-entry1');");
      }

      return staticMiddleware(req, res, next);
    };
  };
}
