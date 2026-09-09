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

// TEST root must look like the normal QMES web, not jump directly to mobile attendance.
// Skip only the preview server's explicit '/' -> '/attendance.html' redirect.
const originalGet = express.application.get;
express.application.get = function patchedGet(path, ...handlers) {
  if (path === '/' && handlers.some((fn) => {
    const src = String(fn || '');
    return src.includes("redirect(302, '/attendance.html')") || src.includes('redirect(302, "/attendance.html")');
  })) {
    console.log('[NAMO TEST] root redirect disabled; localhost:3000 mirrors QMES web.');
    return this;
  }
  return originalGet.call(this, path, ...handlers);
};

console.log('[NAMO TEST network] IPv4-first upstream mode enabled.');
