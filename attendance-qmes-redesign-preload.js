'use strict';

const fs = require('fs');
const path = require('path');

function install() {
  try {
    const file = path.resolve(__dirname, 'public', 'attendance.html');
    if (!fs.existsSync(file)) return;
    let html = fs.readFileSync(file, 'utf8');

    html = html
      .replace(/<link rel="stylesheet" href="\/attendance-qmes-redesign-20260918\.css\?v=[^"]+"\s*\/?>/g, '')
      .replace(/<script src="\/attendance-qmes-redesign-20260918\.js\?v=[^"]+"><\/script>/g, '');

    html = html.replace(
      '</head>',
      '<link rel="stylesheet" href="/attendance-qmes-redesign-20260918.css?v=20260918-ui4">\n</head>'
    );
    html = html.replace(
      '</body>',
      '<script src="/attendance-qmes-redesign-20260918.js?v=20260918-ui4"></script>\n</body>'
    );

    fs.writeFileSync(file, html, 'utf8');
    console.log('[Attendance QMES redesign] 2026-09-18 full mobile UI installed');
  } catch (error) {
    console.error('[Attendance QMES redesign] install failed', error);
  }
}

install();
module.exports = { installAttendanceQmesRedesign: install };
