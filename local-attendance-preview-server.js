'use strict';

const express = require('express');
const path = require('path');

const app = express();
const port = 3000;
const publicDir = path.join(__dirname, 'public');
const qmesIndex = path.join(publicDir, 'index.html');
const attendancePreview = path.join(publicDir, 'attendance-preview-20260909.html');

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// TEST branch local review flow:
// 1) localhost:3000 starts on the normal QMES shell.
// 2) QMES attendance shortcut opens the modified attendance test screen.
// This remains UI-review-only and does not connect to the production database.
app.get('/', (_req, res) => {
  res.sendFile(qmesIndex);
});

app.get(['/attendance.html', '/attendance'], (_req, res) => {
  res.sendFile(attendancePreview);
});

// Keep the QMES shell responsive in UI-only mode when it probes APIs.
app.all('/api/*', (req, res) => {
  res.status(503).json({
    success: false,
    message: 'LOCAL_UI_PREVIEW: database APIs are disabled in this test launcher.',
    data: null,
  });
});

app.use(express.static(publicDir));

app.listen(port, '127.0.0.1', () => {
  console.log('NAMO QMES TEST preview listening on http://localhost:3000/');
  console.log('Attendance test screen: http://localhost:3000/attendance.html');
  console.log('UI preview only - database/login APIs are intentionally disabled.');
});
