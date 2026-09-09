'use strict';

const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const nodemailer = require('nodemailer');

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
  html = html.replace(/<link rel="stylesheet" href="\/attendance-enterprise-home-20260909\.css\?v=[^"]+"\s*\/?>/g, '');
  html = html.replace(/<script src="\/attendance-dom-compat-20260908\.js\?v=[^"]+"><\/script>/g, '');
  html = html.replace(/<script src="\/attendance-reference-ui-20260908\.js\?v=[^"]+"><\/script>/g, '');
  html = html.replace(/<script src="\/attendance-admin-benchmark-20260909\.js\?v=[^"]+"><\/script>/g, '');
  html = html.replace(/<script src="\/attendance-test-fixes-20260909\.js\?v=[^"]+"><\/script>/g, '');
  html = html.replace(/<script src="\/attendance-enterprise-home-20260909\.js\?v=[^"]+"><\/script>/g, '');
  html = html.replace(/<script src="\/attendance-approved-detail-test-20260909\.js\?v=[^"]+"><\/script>/g, '');
  html = html.replace(/<script src="\/attendance-direct-mail-test-20260909\.js\?v=[^"]+"><\/script>/g, '');
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
    '<link rel="stylesheet" href="/attendance-layout-fix-20260909.css?v=20260909-layout1">',
    '<link rel="stylesheet" href="/attendance-enterprise-home-20260909.css?v=20260909-enterprise1">'
  ].join('');

  if (html.includes('</head>')) html = html.replace('</head>', `${testStyles}</head>`);

  html = html.replace(
    '<script src="/attendance-v4-live.js',
    '<script src="/attendance-dom-compat-20260908.js?v=20260908-dom2"></script><script src="/attendance-test-fixes-20260909.js?v=20260909-reviewers1"></script><script src="/attendance-v4-live.js'
  );

  if (html.includes('</body>')) {
    html = html.replace(
      '</body>',
      '<script src="/attendance-admin-benchmark-20260909.js?v=20260909-kakao-admin1"></script><script src="/attendance-reference-ui-20260908.js?v=20260908-ref2"></script><script src="/attendance-enterprise-home-20260909.js?v=20260909-enterprise1"></script><script src="/attendance-approved-detail-test-20260909.js?v=20260909-approved-detail1"></script><script src="/attendance-direct-mail-test-20260909.js?v=20260909-direct-mail1"></script></body>'
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

function escapePdfText(value) {
  return String(value ?? '').replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1');
}

function buildApprovalPdf(payload) {
  const req = payload?.request || {};
  const recipients = Array.isArray(payload?.recipients) ? payload.recipients : [];
  const lines = [
    'NAMO CHEMICAL ATTENDANCE APPROVAL',
    `Request ID: ${req.id || '-'}`,
    `Leave Type: ${req.leaveName || req.leaveType || '-'}`,
    `Employee: ${req.employeeName || '-'}`,
    `Department: ${req.employeeDepartment || '-'}`,
    `Period: ${req.startDate || '-'} ~ ${req.endDate || '-'}`,
    `Days: ${req.days ?? '-'}`,
    `Reviewer: ${req.reviewerName || '-'}`,
    'Status: APPROVED',
    `Recipient Department: ${req.recipientDepartment || '-'}`,
    `Recipients: ${recipients.map(x => x.email).join(', ') || '-'}`,
    '',
    'This document was generated by NAMO Chemical attendance TEST app.'
  ];

  const content = ['BT', '/F1 13 Tf', '50 790 Td'];
  lines.forEach((line, index) => {
    if (index > 0) content.push('0 -24 Td');
    content.push(`(${escapePdfText(line)}) Tj`);
  });
  content.push('ET');
  const stream = content.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function mailConfig() {
  return {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || Number(process.env.SMTP_PORT) === 465,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || ''
  };
}

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  noCache(res);
  next();
});

app.post('/api/attendance/test-direct-mail', async (req, res) => {
  const cfg = mailConfig();
  if (!cfg.host || !cfg.user || !cfg.pass || !cfg.from) {
    return res.status(503).json({
      success: false,
      code: 'SMTP_NOT_CONFIGURED',
      message: 'SMTP_HOST / SMTP_USER / SMTP_PASS / SMTP_FROM 설정이 필요합니다.'
    });
  }

  const recipients = Array.isArray(req.body?.recipients) ? req.body.recipients.filter(x => x?.email) : [];
  if (!recipients.length) {
    return res.status(400).json({ success: false, message: '수신자를 선택해 주세요.' });
  }

  const request = req.body?.request || {};
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass }
  });

  const to = recipients.map(x => x.email).join(', ');
  const subject = `[나모케미칼] ${request.leaveName || '휴가'} 승인 완료`;
  const html = `
    <div style="font-family:Arial,'Noto Sans KR',sans-serif;color:#1f2937;line-height:1.65">
      <h2 style="color:#176dd0">나모케미칼 근태 요청 승인완료</h2>
      <p>검토 완료 후 자동 승인된 근태 요청입니다.</p>
      <table style="border-collapse:collapse;width:100%;max-width:640px">
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">신청자</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.employeeName || '-'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">부서</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.employeeDepartment || '-'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">휴가</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.leaveName || request.leaveType || '-'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">일정</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.startDate || '-'} ~ ${request.endDate || '-'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">일수</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.days ?? '-'}일</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">사유</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.reason || '-'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">검토자</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.reviewerName || '-'}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">상태</td><td style="padding:8px;border-bottom:1px solid #ddd">승인완료</td></tr>
      </table>
      <p style="margin-top:18px;color:#64748b">승인 문서는 PDF로 첨부되었습니다.</p>
    </div>`;

  try {
    const info = await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      html,
      attachments: [{
        filename: `NAMO_Attendance_Approval_${String(request.id || 'approved').replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`,
        content: buildApprovalPdf(req.body),
        contentType: 'application/pdf'
      }]
    });

    return res.json({
      success: true,
      data: { sent: recipients.length, messageId: info.messageId || null }
    });
  } catch (error) {
    console.error('[NAMO TEST direct mail]', error);
    return res.status(502).json({
      success: false,
      code: 'SMTP_SEND_FAILED',
      message: `메일 발송 실패: ${error.message}`
    });
  }
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
  console.log('Direct mail TEST endpoint is enabled when SMTP_* environment variables are configured.');
  console.log('IMPORTANT: functions use the live QMES backend; create/update/delete actions affect live data.');
});
