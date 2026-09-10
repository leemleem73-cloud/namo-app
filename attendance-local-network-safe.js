'use strict';

const dns = require('dns');
const https = require('https');
const express = require('express');

try {
  if (typeof dns.setDefaultResultOrder === 'function') dns.setDefaultResultOrder('ipv4first');
} catch (_error) {}

try {
  https.globalAgent.options.family = 4;
  https.globalAgent.options.keepAlive = false;
} catch (_error) {}

const productionOrigin = new URL(process.env.NAMO_TEST_UPSTREAM || 'https://namo-app-xcuy.onrender.com');

function rewriteSetCookie(value) {
  if (!value) return value;
  const items = Array.isArray(value) ? value : [value];
  return items.map((cookie) => String(cookie)
    .replace(/;\s*Domain=[^;]+/ig, '')
    .replace(/;\s*Secure/ig, '')
    .replace(/SameSite=None/ig, 'SameSite=Lax'));
}

function proxyQmesAuth(req, res) {
  const headers = { ...req.headers };
  headers.host = productionOrigin.host;
  headers.origin = productionOrigin.origin;
  headers.referer = `${productionOrigin.origin}/`;
  headers.connection = 'close';
  delete headers['proxy-connection'];
  delete headers['accept-encoding'];
  delete headers['transfer-encoding'];
  delete headers['content-length'];

  const method = String(req.method || 'GET').toUpperCase();
  let body = null;
  if (!['GET', 'HEAD'].includes(method) && req.body !== undefined) {
    body = Buffer.from(JSON.stringify(req.body || {}), 'utf8');
    headers['content-type'] = 'application/json; charset=utf-8';
    headers['content-length'] = String(body.length);
  }

  const upstreamReq = https.request({
    protocol: productionOrigin.protocol,
    hostname: productionOrigin.hostname,
    port: productionOrigin.port || 443,
    family: 4,
    agent: false,
    method,
    path: req.originalUrl || req.url,
    headers,
  }, (upstreamRes) => {
    const outHeaders = { ...upstreamRes.headers };
    delete outHeaders.connection;
    delete outHeaders['transfer-encoding'];
    delete outHeaders['strict-transport-security'];
    delete outHeaders['access-control-allow-origin'];

    if (outHeaders['set-cookie']) outHeaders['set-cookie'] = rewriteSetCookie(outHeaders['set-cookie']);
    if (outHeaders.location) {
      outHeaders.location = String(outHeaders.location).replace(productionOrigin.origin, 'http://localhost:3000');
    }

    res.writeHead(upstreamRes.statusCode || 502, outHeaders);
    upstreamRes.pipe(res);
  });

  upstreamReq.setTimeout(15000, () => upstreamReq.destroy(new Error('QMES auth timeout')));
  upstreamReq.on('error', (error) => {
    console.error('[NAMO TEST auth proxy]', error.message);
    if (!res.headersSent) res.status(502).json({ success: false, message: '현재 QMES 서버에 연결할 수 없습니다.' });
    else res.end();
  });

  if (body) upstreamReq.end(body);
  else upstreamReq.end();
}

function installQmesMirror(app) {
  if (app.__namoQmesMirrorInstalled) return;
  app.__namoQmesMirrorInstalled = true;

  // Login/password/session must behave exactly like the deployed QMES.
  originalUse.call(app, '/api/auth', proxyQmesAuth);

  // IMPORTANT: do NOT serve the normal QMES shell or normal QMES assets from
  // the TEST branch. They must fall through to local-attendance-preview-server.js
  // and be proxied from the deployed QMES so localhost:3000 matches QMES exactly.
  // Only attendance.html and attendance-* assets stay local in the preview server.
  console.log('[NAMO TEST] QMES base UI/assets: deployed QMES mirror mode.');
  console.log('[NAMO TEST] attendance UI/assets: local TEST override mode.');
}

// Prevent the preview server from redirecting localhost root to attendance.
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
  if (!this.__namoQmesMirrorInstalled) installQmesMirror(this);
  return result;
};

console.log('[NAMO TEST network] deployed QMES mirror bootstrap loaded.');
