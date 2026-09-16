'use strict';

// Local-only reverse proxy for the CURRENT production QMES.
// This file lives on an isolated branch and does not modify production QMES files.
// It serves https://qmes.namochemical.com through http://localhost:3000.

const express = require('express');

const app = express();
const port = Number(process.env.PORT || 3000);
const upstream = 'https://qmes.namochemical.com';
const localOrigin = `http://localhost:${port}`;

const hopByHop = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'content-encoding',
  'strict-transport-security',
  'content-security-policy',
  'content-security-policy-report-only',
]);

function isTextual(contentType = '') {
  return /text\//i.test(contentType) ||
    /javascript|json|xml|svg|css|html/i.test(contentType);
}

function rewriteText(text) {
  return text
    .replaceAll('https://qmes.namochemical.com', localOrigin)
    .replaceAll('http://qmes.namochemical.com', localOrigin);
}

function rewriteCookie(cookie) {
  return cookie
    .replace(/;\s*Domain=[^;]+/gi, '')
    .replace(/;\s*Secure/gi, '')
    .replace(/;\s*SameSite=None/gi, '; SameSite=Lax');
}

async function proxy(req, res) {
  const target = `${upstream}${req.originalUrl}`;

  try {
    const headers = { ...req.headers };
    delete headers.host;
    delete headers['content-length'];
    delete headers.connection;

    // Make the upstream see requests as coming from its own origin.
    headers.origin = upstream;
    if (headers.referer) {
      headers.referer = String(headers.referer).replace(localOrigin, upstream);
    } else {
      headers.referer = `${upstream}/`;
    }

    const method = req.method.toUpperCase();
    const options = {
      method,
      headers,
      redirect: 'manual',
    };

    if (!['GET', 'HEAD'].includes(method)) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      options.body = Buffer.concat(chunks);
    }

    const response = await fetch(target, options);

    for (const [key, value] of response.headers.entries()) {
      const lower = key.toLowerCase();
      if (hopByHop.has(lower) || lower === 'set-cookie' || lower === 'location') continue;
      res.setHeader(key, value);
    }

    // Never let a stale localhost copy survive while comparing to live QMES.
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    let cookies = [];
    if (typeof response.headers.getSetCookie === 'function') {
      cookies = response.headers.getSetCookie();
    } else {
      const cookie = response.headers.get('set-cookie');
      if (cookie) cookies = [cookie];
    }
    if (cookies.length) res.setHeader('set-cookie', cookies.map(rewriteCookie));

    const location = response.headers.get('location');
    if (location) {
      res.setHeader('location', rewriteText(location));
    }

    res.status(response.status);

    if (method === 'HEAD' || response.status === 204 || response.status === 304) {
      return res.end();
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || '';

    if (!isTextual(contentType)) {
      return res.send(buffer);
    }

    let text = rewriteText(buffer.toString('utf8'));

    if (/text\/html/i.test(contentType)) {
      const cacheReset = `<script id="qmes-local-cache-reset">(function(){try{if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});}if(window.caches){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k);});});}}catch(e){}})();</script>`;
      if (text.includes('</head>')) text = text.replace('</head>', `${cacheReset}</head>`);
      else if (text.includes('</body>')) text = text.replace('</body>', `${cacheReset}</body>`);
    }

    return res.send(text);
  } catch (error) {
    console.error('[QMES LIVE MIRROR]', req.method, req.originalUrl, error);
    return res.status(502).send(`QMES 연결 실패: ${error.message}`);
  }
}

app.use(proxy);

app.listen(port, '127.0.0.1', () => {
  console.log('----------------------------------------------');
  console.log(`CURRENT QMES MIRROR : ${localOrigin}`);
  console.log(`UPSTREAM            : ${upstream}`);
  console.log('Source               : live QMES only');
  console.log('Cache                : disabled');
  console.log('----------------------------------------------');
});
