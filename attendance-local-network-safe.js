'use strict';

const dns = require('dns');
const fs = require('fs');
const https = require('https');
const path = require('path');
const express = require('express');

try {
  if (typeof dns.setDefaultResultOrder === 'function') dns.setDefaultResultOrder('ipv4first');
} catch (_error) {}

try {
  https.globalAgent.options.family = 4;
  https.globalAgent.options.keepAlive = false;
} catch (_error) {}

const publicDir = path.join(process.cwd(), 'public');
const indexFile = path.join(publicDir, 'index.html');

function installLocalTest(app) {
  if (app.__namoIndependentTestInstalled) return;
  app.__namoIndependentTestInstalled = true;

  // Serve the TEST branch QMES shell/assets locally.
  // Authentication and all /api routes intentionally fall through to
  // local-attendance-preview-server.js, which proxies them to the real QMES
  // backend so member IDs/passwords are exactly the same as QMES.
  const staticHandler = express.static(publicDir, { index: false, fallthrough: true });
  const localStatic = (req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api/')) return next();
    if (req.path === '/attendance.html' || req.path === '/attendance') return next();

    if (req.path === '/') {
      if (!fs.existsSync(indexFile)) return next();
      res.setHeader('Cache-Control', 'no-store');
      return res.sendFile(indexFile);
    }

    return staticHandler(req, res, next);
  };

  originalUse.call(app, localStatic);

  console.log('[NAMO TEST] local QMES shell enabled.');
  console.log('[NAMO TEST] authentication: QMES live member login passthrough.');
}

// TEST root must be the normal QMES web, not a forced attendance redirect.
const originalGet = express.application.get;
express.application.get = function patchedGet(routePath, ...handlers) {
  if (routePath === '/' && handlers.some((fn) => {
    const src = String(fn || '');
    return src.includes("redirect(302, '/attendance.html')") || src.includes('redirect(302, "/attendance.html")');
  })) {
    console.log('[NAMO TEST] forced attendance root redirect disabled.');
    return this;
  }
  return originalGet.call(this, routePath, ...handlers);
};

const originalUse = express.application.use;
express.application.use = function patchedUse(...args) {
  const result = originalUse.apply(this, args);
  if (!this.__namoIndependentTestInstalled) installLocalTest(this);
  return result;
};

console.log('[NAMO TEST network] localhost QMES-auth passthrough bootstrap loaded.');
