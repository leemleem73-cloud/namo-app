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

    if (outHeaders['set-cookie']) {
      outHeaders['set-cookie'] = rewriteSetCookie(outHeaders['set-cookie']);
    }
    if (outHeaders.location) {
      outHeaders.location = String(outHeaders.location).replace(
        productionOrigin.origin,
        'http://localhost:3000'
      );
    }

    res.writeHead(upstreamRes.statusCode || 502, outHeaders);
    upstreamRes.pipe(res);
  });

  upstreamReq.setTimeout(15000, () => upstreamReq.destroy(new Error('QMES auth timeout')));
  upstreamReq.on('error', (error) => {
    console.error('[NAMO TEST auth proxy]', error.message);
    if (!res.headersSent) {
      res.status(502).json({ success: false, message: '현재 QMES 서버에 연결할 수 없습니다.' });
    } else {
      res.end();
    }
  });

  if (body) upstreamReq.end(body);
  else upstreamReq.end();
}

function installLocalTest(app) {
  if (app.__namoIndependentTestInstalled) return;
  app.__namoIndependentTestInstalled = true;

  // QMES 회원 로그인/세션은 운영 QMES와 동일한 인증 API를 사용합니다.
  // express.json()이 먼저 요청 본문을 읽으므로, 인증 요청은 여기서 JSON 본문을
  // 다시 만들어 upstream으로 전송해야 로그인 비밀번호가 그대로 전달됩니다.
  originalUse.call(app, '/api/auth', proxyQmesAuth);

  // TEST branch QMES shell/assets are served locally; business APIs continue
  // to use the configured QMES upstream through the preview server.
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
  console.log('[NAMO TEST] authentication: identical QMES member login enabled.');
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
