'use strict';

const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');

const app = express();
const port = 3000;
const publicDir = path.join(__dirname, 'public');
const attendanceFile = path.join(publicDir, 'attendance.html');
const productionOrigin = new URL(process.env.NAMO_TEST_UPSTREAM || 'https://namo-app-xcuy.onrender.com');

function noCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

function buildAttendanceHtml(source) {
  let html = String(source || '');

  html = html.replace(/<link rel="stylesheet" href="\/attendance-mobile-stability-20260908\.css\?v=[^"]+"\s*\/?>/g, '');
  html = html.replace(/<link rel="stylesheet" href="\/attendance-reference-ui-20260908\.css\?v=[^"]+"\s*\/?>/g, '');
  html = html.replace(/<link rel="stylesheet" href="\/attendance-admin-test-fix-20260909\.css\?v=[^"]+"\s*\/?>/g, '');
  html = html.replace(/<link rel="stylesheet" href="\/attendance-test-ui-20260909-v1\.css\?v=[^"]+"\s*\/?>/g, '');
  html = html.replace(/<link rel="stylesheet" href="\/attendance-layout-fix-20260909\.css\?v=[^"]+"\s*\/?>/g, '');
  html = html.replace(/<script src="\/attendance-dom-compat-20260908\.js\?v=[^"]+"><\/script>/g, '');
  html = html.replace(/<script src="\/attendance-reference-ui-20260908\.js\?v=[^"]+"><\/script>/g, '');
  html = html.replace(/<script src="\/attendance-admin-benchmark-20260909\.js\?v=[^"]+"><\/script>/g, '');
  html = html.replace(/<script src="\/attendance-test-fixes-20260909\.js\?v=[^"]+"><\/script>/g, '');
  html = html.replace(/\sdata-attendance-boot="[^"]*"/g, '');
  html = html.replace(/<html([^>]*data-namo-attendance-full-ui="v4"[^>]*)>/i, '<html$1 data-attendance-boot="pending">');
  html = html.replace(
    /<script src="\/attendance-admin-mode-v4\.js\?v=[^"]+"><\/script>/g,
    '<script src="/attendance-admin-mode-v4.js?v=20260909-admin-fix4"></script>'
  );

  const testStyles = [
    '<link rel="stylesheet" href="/attendance-mobile-stability-20260908.css?v=20260908-stable2">',
    '<link rel="stylesheet" href="/attendance-reference-ui-20260908.css?v=20260908-ref2">',
    '<link rel="stylesheet" href="/attendance-admin-test-fix-20260909.css?v=20260909-kakao-admin1">',
    '<link rel="stylesheet" href="/attendance-test-ui-20260909-v1.css?v=20260909-test-ui1">',
    '<link rel="stylesheet" href="/attendance-layout-fix-20260909.css?v=20260909-layout1">'
  ].join('');

  if (html.includes('</head>')) html = html.replace('</head>', `${testStyles}</head>`);

  html = html.replace(
    '<script src="/attendance-v4-live.js',
    '<script src="/attendance-dom-compat-20260908.js?v=20260908-dom2"></script><script src="/attendance-test-fixes-20260909.js?v=20260909-reviewers1"></script><script src="/attendance-v4-live.js'
  );

  if (html.includes('</body>')) {
    html = html.replace(
      '</body>',
      '<script src="/attendance-admin-benchmark-20260909.js?v=20260909-kakao-admin1"></script><script src="/attendance-reference-ui-20260908.js?v=20260908-ref2"></script></body>'
    );
  }

  return html;
}

function localAttendanceAssetPath(urlPath) {
  const clean = decodeURIComponent(String(urlPath || '').split('?')[0]);
  const base = path.basename(clean);

  if (base === 'attendance.html' || base === 'attendance') return null;
  if (base.startsWith('attendance-') || base === 'attendance.css' || base === 'attendance-app.js') {
    const candidate = path.join(publicDir, base);
    if (candidate.startsWith(publicDir) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  if (clean === '/assets/namo-mobile-logo.svg') {
    const candidate = path.join(publicDir, 'assets', 'namo-mobile-logo.svg');
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
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

  const options = {
    protocol: productionOrigin.protocol,
    hostname: productionOrigin.hostname,
    port: productionOrigin.port || 443,
    method: req.method,
    path: req.originalUrl || req.url,
    headers,
  };

  const upstreamReq = https.request(options, (upstreamRes) => {
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
    console.error('[NAMO TEST proxy] upstream error:', error.message);
    if (!res.headersSent) {
      res.status(502).json({
        success: false,
        message: '현재 QMES 서버에 연결할 수 없습니다.',
      });
    } else {
      res.end();
    }
  });

  req.pipe(upstreamReq);
}

app.use((req, res, next) => {
  noCache(res);
  next();
});

app.get(['/attendance.html', '/attendance'], (_req, res) => {
  fs.readFile(attendanceFile, 'utf8', (error, source) => {
    if (error) return res.status(500).send('Attendance TEST page load failed.');
    res.type('html').send(buildAttendanceHtml(source));
  });
});

app.get('*', (req, res, next) => {
  const file = localAttendanceAssetPath(req.path);
  if (!file) return next();
  res.sendFile(file);
});

app.use((req, res) => proxyToProduction(req, res));

app.listen(port, '127.0.0.1', () => {
  console.log(`NAMO full TEST mirror: http://localhost:${port}/`);
  console.log(`Upstream QMES/mobile: ${productionOrigin.origin}`);
  console.log(`Attendance TEST page: http://localhost:${port}/attendance.html`);
  console.log('IMPORTANT: functions use the live QMES backend; create/update/delete actions affect live data.');
});
