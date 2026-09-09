'use strict';

const crypto = require('crypto');
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
const sessions = new Map();
let currentTestPassword = String(process.env.NAMO_TEST_PASSWORD || '1234');

function cookieValue(req, name) {
  const source = String(req.headers?.cookie || '');
  for (const part of source.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    if (key !== name) continue;
    try { return decodeURIComponent(part.slice(index + 1).trim()); } catch (_error) { return part.slice(index + 1).trim(); }
  }
  return '';
}

function testUser(loginId) {
  const configuredId = String(process.env.NAMO_TEST_LOGIN_ID || 'admin@namo.local').trim();
  const id = String(loginId || configuredId).trim();
  const isAdmin = id.toLowerCase() === configuredId.toLowerCase() || id.toLowerCase() === 'admin@namo.local';
  return {
    id: '00000000-0000-4000-8000-000000000001',
    uid: 'U-TEST-0001',
    name: String(process.env.NAMO_TEST_USER_NAME || (isAdmin ? 'TEST 관리자' : id)),
    email: String(process.env.NAMO_TEST_USER_EMAIL || (id.includes('@') ? id : '')),
    department: String(process.env.NAMO_TEST_USER_DEPARTMENT || '품질부'),
    title: String(process.env.NAMO_TEST_USER_TITLE || (isAdmin ? '관리자' : '사원')),
    role: isAdmin ? 'admin' : 'user',
    status: 'APPROVED',
    mustChangePassword: false,
  };
}

function sessionUser(req) {
  const token = cookieValue(req, 'namo_test_session');
  return token ? sessions.get(token) || null : null;
}

function sendSuccess(res, data, message = 'OK') {
  return res.json({ success: true, message, data });
}

function installLocalTest(app) {
  if (app.__namoIndependentTestInstalled) return;
  app.__namoIndependentTestInstalled = true;

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

  app.post('/api/auth/login', (req, res) => {
    const loginId = String(req.body?.loginId || '').trim();
    const password = String(req.body?.password || '');
    const expectedId = String(process.env.NAMO_TEST_LOGIN_ID || 'admin@namo.local').trim();

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해 주세요.', data: null });
    }
    if (loginId.toLowerCase() !== expectedId.toLowerCase() || password !== currentTestPassword) {
      return res.status(401).json({ success: false, message: 'TEST 아이디 또는 비밀번호가 올바르지 않습니다.', data: null });
    }

    const user = testUser(loginId);
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, user);
    res.setHeader('Set-Cookie', `namo_test_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`);
    return sendSuccess(res, { user }, 'TEST 로그인 성공');
  });

  app.get('/api/auth/me', (req, res) => {
    const user = sessionUser(req);
    if (!user) return res.status(401).json({ success: false, message: '로그인이 필요합니다.', data: null });
    return sendSuccess(res, { user });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = cookieValue(req, 'namo_test_session');
    if (token) sessions.delete(token);
    res.setHeader('Set-Cookie', 'namo_test_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return sendSuccess(res, null, 'TEST 로그아웃 완료');
  });

  app.put('/api/auth/password', (req, res) => {
    const user = sessionUser(req);
    if (!user) return res.status(401).json({ success: false, message: '로그인이 필요합니다.', data: null });
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (currentPassword !== currentTestPassword) return res.status(400).json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.', data: null });
    if (newPassword.length < 4) return res.status(400).json({ success: false, message: '새 비밀번호는 4자 이상 입력해 주세요.', data: null });
    currentTestPassword = newPassword;
    return sendSuccess(res, null, 'TEST 비밀번호 변경 완료');
  });

  app.get('/api/attendance/me', (req, res) => {
    const user = sessionUser(req);
    if (!user) return res.status(401).json({ success: false, message: '로그인이 필요합니다.', data: null });
    return sendSuccess(res, { user });
  });

  app.get('/api/attendance/directory', (req, res) => {
    const user = sessionUser(req);
    if (!user) return res.status(401).json({ success: false, message: '로그인이 필요합니다.', data: null });
    return sendSuccess(res, [user]);
  });

  app.get('/api/admin/users', (req, res) => {
    const user = sessionUser(req);
    if (!user) return res.status(401).json({ success: false, message: '로그인이 필요합니다.', data: null });
    return sendSuccess(res, [user]);
  });

  app.get('/api/attendance/leave', (req, res) => {
    const user = sessionUser(req);
    if (!user) return res.status(401).json({ success: false, message: '로그인이 필요합니다.', data: null });
    return sendSuccess(res, { requests: [] });
  });

  console.log('[NAMO TEST] independent localhost login enabled.');
  console.log(`[NAMO TEST] login: ${process.env.NAMO_TEST_LOGIN_ID || 'admin@namo.local'} / ${process.env.NAMO_TEST_PASSWORD ? '(env password)' : '1234'}`);
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

console.log('[NAMO TEST network] localhost independent TEST bootstrap loaded.');
