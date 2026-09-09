'use strict';

const express = require('express');
const path = require('path');

const app = express();
const port = 3000;
const publicDir = path.join(__dirname, 'public');
const previewFile = path.join(publicDir, 'attendance-preview-20260909.html');

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// TEST branch visual-review route: keep the familiar localhost URL while avoiding
// DATABASE_URL / SESSION_SECRET requirements. This is UI-only and does not touch data.
app.get(['/attendance.html', '/attendance', '/'], (_req, res) => {
  res.sendFile(previewFile);
});

app.use(express.static(publicDir));

app.listen(port, '127.0.0.1', () => {
  console.log('NAMO attendance TEST preview listening on http://localhost:3000/attendance.html');
  console.log('UI preview only - database/login APIs are intentionally disabled.');
});
