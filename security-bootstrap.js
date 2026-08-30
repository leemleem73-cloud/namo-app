'use strict';

// Runtime security hardening for the existing QMS server without rewriting server.js.
// This module is preloaded with Node's -r option before server.js starts.

const express = require('express');
const session = require('express-session');
const { rateLimit } = require('express-rate-limit');
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = String(process.env.SESSION_SECRET || '').trim();

if (!sessionSecret || sessionSecret === 'change-me-session-secret') {
  throw new Error('SESSION_SECRET must be configured with a strong private value.');
}

// Harden express-session options before server.js creates its session middleware.
// QMES is an all-day operational screen. Keep an authenticated session alive while
// the user is actively using the system so background PQC/workorder sync does not
// suddenly start returning 401 after the original fixed expiry time.
const sessionModulePath = require.resolve('express-session');
function hardenedSession(options = {}) {
  const requestedMaxAge = Number(options?.cookie?.maxAge || 0);
  const activeMaxAge = Math.max(requestedMaxAge, 1000 * 60 * 60 * 12);
  return session({
    ...options,
    secret: sessionSecret,
    proxy: isProduction ? true : options.proxy,
    rolling: true,
    cookie: {
      ...(options.cookie || {}),
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction ? 'auto' : false,
      maxAge: activeMaxAge,
    },
  });
}
Object.assign(hardenedSession, session);
require.cache[sessionModulePath].exports = hardenedSession;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    data: null,
  },
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: '비밀번호 초기화 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    data: null,
  },
});

function requireAdmin(req, res, next) {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.',
      data: null,
    });
  }
  return next();
}

// Add protection to sensitive routes as they are registered by server.js.
const originalPost = express.application.post;
express.application.post = function patchedPost(routePath, ...handlers) {
  if (routePath === '/api/auth/login') {
    return originalPost.call(this, routePath, authLimiter, ...handlers);
  }
  if (routePath === '/api/auth/reset-password') {
    return originalPost.call(this, routePath, resetLimiter, requireAdmin, ...handlers);
  }
  return originalPost.call(this, routePath, ...handlers);
};

const originalGet = express.application.get;
express.application.get = function patchedGet(routePath, ...handlers) {
  if (routePath === '/api/backup') {
    return originalGet.call(this, routePath, requireAdmin, ...handlers);
  }
  return originalGet.call(this, routePath, ...handlers);
};

// server.js currently rewrites the configured admin password on every startup.
// Preserve the existing DB password while still allowing the startup code to
// normalize the admin account's role/status/profile fields.
const originalPoolQuery = Pool.prototype.query;
Pool.prototype.query = function patchedPoolQuery(text, values, callback) {
  const sql = typeof text === 'string' ? text : '';
  const isAdminStartupReset =
    sql.includes('UPDATE users') &&
    sql.includes('SET password_hash = $1') &&
    sql.includes("role = 'admin'") &&
    sql.includes('WHERE email = $6') &&
    Array.isArray(values) &&
    values.length >= 6;

  if (!isAdminStartupReset) {
    return originalPoolQuery.apply(this, arguments);
  }

  const safeSql = `UPDATE users
     SET name = $1,
         department = $2,
         title = $3,
         role = 'admin',
         status = 'APPROVED',
         uid = $4
     WHERE email = $5`;
  const safeValues = [values[1], values[2], values[3], values[4], values[5]];
  return originalPoolQuery.call(this, safeSql, safeValues, callback);
};
