'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const publicDir = path.join(__dirname, 'public');
const qmesIndex = path.join(publicDir, 'index.html');
const attendancePreview = path.join(publicDir, 'attendance-preview-20260909.html');

const mockUser = {
  id: 1,
  uid: 'LOCAL-ADMIN',
  name: '관리자',
  email: 'admin@namo.local',
  department: '관리자',
  title: '관리자',
  role: 'admin',
  mustChangePassword: false,
};

app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// TEST branch local review flow:
// - localhost:3000 opens the QMES shell first.
// - preview mode auto-authenticates a local admin so the login overlay does not block review.
// - attendance opens the modified attendance test screen.
// This launcher never connects to the production database.
app.get('/', (_req, res) => {
  fs.readFile(qmesIndex, 'utf8', (error, source) => {
    if (error) return res.status(500).send('QMES index load failed.');
    const previewSession = {
      id: mockUser.id,
      uid: mockUser.uid,
      name: mockUser.name,
      email: mockUser.email,
      dept: mockUser.department,
      position: mockUser.title,
      role: mockUser.role,
      mustChangePassword: false,
    };
    const bootstrap = `<script data-namo-local-preview>\ntry {\n  sessionStorage.setItem('qmes-current-user-v1', ${JSON.stringify(JSON.stringify(previewSession))});\n  window.__NAMO_LOCAL_UI_PREVIEW__ = true;\n} catch (_error) {}\n</script>`;
    const html = source.includes('<head>')
      ? source.replace('<head>', `<head>\n${bootstrap}`)
      : `${bootstrap}\n${source}`;
    res.type('html').send(html);
  });
});

app.get(['/attendance.html', '/attendance'], (_req, res) => {
  res.sendFile(attendancePreview);
});

// Local-only mock authentication. This exists only in the preview launcher and never
// writes user/password data or talks to the production database.
app.post('/api/auth/login', (_req, res) => {
  res.json({ success: true, data: { user: mockUser } });
});
app.get('/api/auth/me', (_req, res) => {
  res.json({ success: true, data: { user: mockUser } });
});
app.put('/api/auth/password', (_req, res) => {
  res.json({ success: true, data: { user: mockUser } });
});
app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true, data: null });
});

// Other database APIs remain disabled in UI-preview mode.
app.all('/api/*', (_req, res) => {
  res.status(503).json({
    success: false,
    message: 'LOCAL_UI_PREVIEW: database APIs are disabled in this test launcher.',
    data: null,
  });
});

app.use(express.static(publicDir));

app.listen(port, '127.0.0.1', () => {
  console.log('NAMO QMES TEST preview listening on http://localhost:3000/');
  console.log('QMES local preview auto-login: admin mode');
  console.log('Attendance test screen: http://localhost:3000/attendance.html');
  console.log('UI preview only - production database is not used.');
});
