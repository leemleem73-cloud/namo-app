'use strict';

const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const port = Number(process.env.QMES_TEST_PORT || 3000);
const publicDir = path.join(__dirname, 'public');
const indexFile = path.join(publicDir, 'index.html');
const productionOrigin = new URL(process.env.NAMO_TEST_UPSTREAM || 'https://namo-app-xcuy.onrender.com');

function noCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

function rewriteSetCookie(value) {
  if (!value) return value;
  const items = Array.isArray(value) ? value : [value];
  return items.map((cookie) => String(cookie)
    .replace(/;\s*Domain=[^;]+/ig, '')
    .replace(/;\s*Secure/ig, '')
    .replace(/SameSite=None/ig, 'SameSite=Lax'));
}

function proxyToProduction(req, res) {
  const headers = { ...req.headers };
  headers.host = productionOrigin.host;
  headers.origin = productionOrigin.origin;
  headers.referer = `${productionOrigin.origin}${req.originalUrl || '/'}`;
  delete headers.connection;
  delete headers['proxy-connection'];
  delete headers['accept-encoding'];

  const upstreamReq = https.request({
    protocol: productionOrigin.protocol,
    hostname: productionOrigin.hostname,
    port: productionOrigin.port || 443,
    method: req.method,
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
      outHeaders.location = String(outHeaders.location).replace(
        productionOrigin.origin,
        `http://localhost:${port}`
      );
    }

    res.writeHead(upstreamRes.statusCode || 502, outHeaders);
    upstreamRes.pipe(res);
  });

  upstreamReq.on('error', (error) => {
    console.error('[QMES TEST proxy] upstream error:', error.message);
    if (!res.headersSent) {
      res.status(502).json({ success: false, message: '현재 QMES 운영 서버에 연결할 수 없습니다.' });
    } else {
      res.end();
    }
  });

  req.pipe(upstreamReq);
}

app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html' || /\.(?:js|jsx|css|html)$/.test(req.path)) {
    noCache(res);
  }
  next();
});

// TEST의 QMES 화면은 TEST branch의 public 파일을 그대로 사용한다.
// 현재 public/index.html은 main(QMES 운영 웹)과 동일한 파일이며,
// TEST에서 수정한 프론트 파일은 localhost 새로고침 즉시 반영된다.
app.get(['/', '/index.html'], (_req, res) => {
  noCache(res);
  res.sendFile(indexFile);
});

app.use(express.static(publicDir, {
  index: false,
  etag: false,
  maxAge: 0,
  fallthrough: true,
  setHeaders: (res, filePath) => {
    if (/\.(?:js|jsx|css|html)$/.test(filePath)) noCache(res);
  },
}));

// API, 업로드 파일, 서버 전용 경로는 실제 QMES 서버를 사용한다.
// 따라서 TEST 화면 구조는 로컬 branch 파일로 확인하면서 서버 기능은 운영 QMES와 동일하게 동작한다.
app.use((req, res) => proxyToProduction(req, res));

app.listen(port, '127.0.0.1', () => {
  console.log(`QMES TEST: http://localhost:${port}/`);
  console.log(`Local frontend: ${publicDir}`);
  console.log(`Upstream API/server: ${productionOrigin.origin}`);
  console.log('TEST branch public files are served locally; API/server-only requests are proxied to QMES.');
  console.log('IMPORTANT: create/update/delete API actions can affect live QMES data.');
});
