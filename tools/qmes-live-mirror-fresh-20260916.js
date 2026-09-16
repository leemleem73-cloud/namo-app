'use strict';

// Fresh localhost mirror for comparing with CURRENT production QMES.
// Isolated helper only: does not change production/main files.
// Key difference from the first mirror: localhost browser storage is cleared
// before QMES app scripts run, because the dashboard reads localStorage first.

const express = require('express');

const app = express();
const port = Number(process.env.PORT || 3000);
const upstream = 'https://qmes.namochemical.com';
const localOrigin = `http://localhost:${port}`;

const hopByHop = new Set([
  'connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailer',
  'transfer-encoding','upgrade','content-length','content-encoding','strict-transport-security',
  'content-security-policy','content-security-policy-report-only'
]);

function isTextual(contentType = '') {
  return /text\//i.test(contentType) || /javascript|json|xml|svg|css|html/i.test(contentType);
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

const resetScript = `<script id="qmes-local-fresh-reset">(function(){
  try {
    localStorage.clear();
    sessionStorage.clear();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});
    }
    if (window.caches) {
      caches.keys().then(function(keys){keys.forEach(function(k){caches.delete(k);});});
    }
  } catch (e) { console.warn('[QMES LOCAL] storage reset failed', e); }
})();</script>`;

async function proxy(req, res) {
  const target = `${upstream}${req.originalUrl}`;
  try {
    const headers = { ...req.headers };
    delete headers.host;
    delete headers['content-length'];
    delete headers.connection;
    headers.origin = upstream;
    headers.referer = headers.referer ? String(headers.referer).replace(localOrigin, upstream) : `${upstream}/`;

    const method = req.method.toUpperCase();
    const options = { method, headers, redirect: 'manual' };
    if (!['GET','HEAD'].includes(method)) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      options.body = Buffer.concat(chunks);
    }

    const response = await fetch(target, options);

    for (const [key,value] of response.headers.entries()) {
      const lower = key.toLowerCase();
      if (hopByHop.has(lower) || lower === 'set-cookie' || lower === 'location') continue;
      res.setHeader(key, value);
    }

    res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma','no-cache');
    res.setHeader('Expires','0');

    let cookies = [];
    if (typeof response.headers.getSetCookie === 'function') cookies = response.headers.getSetCookie();
    else {
      const c = response.headers.get('set-cookie');
      if (c) cookies = [c];
    }
    if (cookies.length) res.setHeader('set-cookie', cookies.map(rewriteCookie));

    const location = response.headers.get('location');
    if (location) res.setHeader('location', rewriteText(location));

    res.status(response.status);
    if (method === 'HEAD' || response.status === 204 || response.status === 304) return res.end();

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || '';
    if (!isTextual(contentType)) return res.send(buffer);

    let text = rewriteText(buffer.toString('utf8'));
    if (/text\/html/i.test(contentType)) {
      if (text.includes('<head>')) text = text.replace('<head>', `<head>${resetScript}`);
      else if (text.includes('</head>')) text = text.replace('</head>', `${resetScript}</head>`);
      else text = resetScript + text;
    }
    return res.send(text);
  } catch (error) {
    console.error('[QMES LIVE FRESH MIRROR]', req.method, req.originalUrl, error);
    return res.status(502).send(`QMES 연결 실패: ${error.message}`);
  }
}

app.use(proxy);

app.listen(port, '127.0.0.1', () => {
  console.log('------------------------------------------------');
  console.log(`CURRENT QMES FRESH MIRROR : ${localOrigin}`);
  console.log(`UPSTREAM                  : ${upstream}`);
  console.log('Browser storage           : cleared before app boot');
  console.log('Production/main files     : untouched');
  console.log('------------------------------------------------');
});
