require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const puppeteer = require('puppeteer');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

const STORAGE_DIR = path.join(__dirname, 'storage');
const PDF_DIR = path.join(STORAGE_DIR, 'pdf');
const IQC_PDF_DIR = path.join(PDF_DIR, 'iqc');
const IPQC_PDF_DIR = path.join(PDF_DIR, 'ipqc');
const OQC_PDF_DIR = path.join(PDF_DIR, 'oqc');
const NCR_PDF_DIR = path.join(PDF_DIR, 'ncr');

[STORAGE_DIR, PDF_DIR, IQC_PDF_DIR, IPQC_PDF_DIR, OQC_PDF_DIR, NCR_PDF_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

const uid = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const safeFilePart = (v) =>
  String(v || '')
    .replace(/[^a-zA-Z0-9._-가-힣]/g, '_')
    .slice(0, 80);

const allowedDocTables = ['iqc', 'ipqc', 'oqc', 'ncrs'];
const allowedApprovalActions = ['WRITE', 'REVIEW', 'APPROVE'];
const allowedRoles = ['user', 'manager', 'executive', 'admin'];
const allowedUserStatus = ['PENDING', 'APPROVED', 'REJECTED'];

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({
  name: 'namo.sid',
  secret: process.env.SESSION_SECRET || 'namo-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

app.use('/files', express.static(STORAGE_DIR));
app.use(express.static(path.join(__dirname, 'public')));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.' }
});

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

async function query(text, params = []) {
  return pool.query(text, params);
}

async function writeAuditLog(userEmail, actionType, targetTable, targetId, detail = '') {
  await query(`
    INSERT INTO audit_logs (user_email, action_type, target_table, target_id, detail)
    VALUES ($1, $2, $3, $4, $5)
  `, [userEmail || '', actionType, targetTable, String(targetId || ''), detail || '']);
}

function sanitizeUser(row) {
  return {
    id: row.id,
    loginId: row.login_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    department: row.department,
    title: row.title,
    role: row.role,
    status: row.status,
    createdAt: row.created_at
  };
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  req.me = req.session.user;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  if (String(req.session.user.role || '').toLowerCase() !== 'admin') {
    return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
  }
  req.me = req.session.user;
  next();
}

function canApprove(user) {
  return ['manager', 'executive', 'admin'].includes(String(user?.role || '').toLowerCase());
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidSignatureDataUrl(v) {
  return typeof v === 'string'
    && /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)
    && v.length <= 2000000;
}

function toNonNegativeInt(value, fieldName) {
  const n = Number(value ?? 0);
  if (!Number.isInteger(n) || n < 0) {
    const err = new Error(`${fieldName} 값이 올바르지 않습니다.`);
    err.status = 400;
    throw err;
  }
  return n;
}

function validateQtyFail(qty, fail) {
  if (fail > qty) {
    const err = new Error('불량수량은 검사수량보다 클 수 없습니다.');
    err.status = 400;
    throw err;
  }
}

function validateRequired(value, message) {
  if (value === undefined || value === null || String(value).trim() === '') {
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
}

async function initDb() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await query(sql);
  }

  const exists = await query(`SELECT id FROM users WHERE email = $1`, ['admin@namochemical.com']);
  if (exists.rowCount === 0) {
    const hash = await bcrypt.hash(process.env.ADMIN_INIT_PASSWORD || 'ChangeMe1234!', 12);
    await query(`
      INSERT INTO users (id, login_id, name, email, department, title, role, status, password_hash)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [
      'user_admin',
      'admin',
      '시스템관리자',
      'admin@namochemical.com',
      '품질보증',
      '관리자',
      'admin',
      'APPROVED',
      hash
    ]);
  }
}

async function generatePdfFromHtml(html, outputPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', right: '10mm', bottom: '16mm', left: '10mm' }
    });
  } finally {
    await browser.close();
  }
}

function buildSignCell(name, date, sign) {
  return `${esc(name)}<br>${esc(date)}<br>${sign ? `<img class="sign" src="${sign}" />` : ''}`;
}

function baseStyle(title) {
  return `
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>${esc(title)}</title>
      <style>
        body { font-family: 'Malgun Gothic', sans-serif; padding: 20px; color: #111; }
        h1 { font-size: 22px; margin-bottom: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #333; padding: 7px; font-size: 12px; vertical-align: top; }
        th { background: #f3f6fa; }
        .sign { width: 140px; height: 60px; object-fit: contain; }
        .section { margin-top: 14px; font-size: 13px; font-weight: 700; }
      </style>
    </head>
    <body>
  `;
}

function buildIqcHtml(row) {
  return `${baseStyle('입고검사 성적서')}
    <h1>나모케미칼 입고검사 성적서</h1>
    <table>
      <tr><th>검사일자</th><td>${esc(row.date)}</td><th>입고일자</th><td>${esc(row.receipt_date || row.date)}</td></tr>
      <tr><th>공급업체명</th><td>${esc(row.supplier)}</td><th>원료명</th><td>${esc(row.item)}</td></tr>
      <tr><th>LOT No</th><td>${esc(row.lot)}</td><th>CoA 번호</th><td>${esc(row.coa_no)}</td></tr>
      <tr><th>입고수량</th><td>${esc(row.in_qty)}</td><th>검사수량</th><td>${esc(row.qty)}</td></tr>
    </table>
    <div class="section">검사결과</div>
    <table>
      <tr><th>No</th><th>검사항목</th><th>검사기준</th><th>검사결과</th><th>판정</th></tr>
      <tr><td>1</td><td>외관</td><td>이물질, 파손 없을 것</td><td>${esc(row.appearance_result || '양호')}</td><td>${esc(row.appearance_judge || '합격')}</td></tr>
      <tr><td>2</td><td>포장상태</td><td>파손, 변형, 오염 없을 것</td><td>${esc(row.package_result || '양호')}</td><td>${esc(row.package_judge || '합격')}</td></tr>
      <tr><td>3</td><td>라벨상태</td><td>라벨 누락, 오기 없음</td><td>${esc(row.label_result || '양호')}</td><td>${esc(row.label_judge || '합격')}</td></tr>
      <tr><td>4</td><td>CoA 확인</td><td>누락 없을 것</td><td>${esc(row.coa_result || '확인')}</td><td>${esc(row.coa_judge || '합격')}</td></tr>
    </table>
    <div class="section">종합판정</div>
    <table><tr><th>종합판정</th><td>${esc(row.judge)}</td><th>비고</th><td>${esc(row.remark)}</td></tr></table>
    <div class="section">전자결재</div>
    <table>
      <tr><th>작성</th><th>검토</th><th>승인</th></tr>
      <tr>
        <td>${buildSignCell(row.writer, row.writer_date, row.writer_sign)}</td>
        <td>${buildSignCell(row.reviewer, row.reviewer_date, row.reviewer_sign)}</td>
        <td>${buildSignCell(row.approver, row.approver_date, row.approver_sign)}</td>
      </tr>
    </table>
    </body></html>`;
}

function buildIpqcHtml(row) {
  return `${baseStyle('공정검사 성적서')}
    <h1>나모케미칼 공정검사 성적서</h1>
    <table>
      <tr><th>검사일자</th><td>${esc(row.date)}</td><th>제품명</th><td>${esc(row.product)}</td></tr>
      <tr><th>LOT No</th><td>${esc(row.lot)}</td><th>검사자</th><td>${esc(row.inspector)}</td></tr>
    </table>
    <div class="section">검사결과</div>
    <table>
      <tr><th>항목</th><th>기준</th><th>결과</th><th>판정</th></tr>
      <tr><td>육안검사</td><td>이상없음</td><td>${esc(row.visual)}</td><td>${esc(row.judge)}</td></tr>
      <tr><td>점도</td><td>규격내</td><td>${esc(row.viscosity)}</td><td>${esc(row.judge)}</td></tr>
      <tr><td>고형분</td><td>규격내</td><td>${esc(row.solid)}</td><td>${esc(row.judge)}</td></tr>
      <tr><td>입도</td><td>규격내</td><td>${esc(row.particle)}</td><td>${esc(row.judge)}</td></tr>
    </table>
    <div class="section">전자결재</div>
    <table>
      <tr><th>작성</th><th>검토</th><th>승인</th></tr>
      <tr>
        <td>${buildSignCell(row.writer, row.writer_date, row.writer_sign)}</td>
        <td>${buildSignCell(row.reviewer, row.reviewer_date, row.reviewer_sign)}</td>
        <td>${buildSignCell(row.approver, row.approver_date, row.approver_sign)}</td>
      </tr>
    </table>
    </body></html>`;
}

function buildOqcHtml(row) {
  return `${baseStyle('출하검사 성적서')}
    <h1>나모케미칼 출하검사 성적서</h1>
    <table>
      <tr><th>검사일자</th><td>${esc(row.date)}</td><th>고객사</th><td>${esc(row.customer)}</td></tr>
      <tr><th>제품명</th><td>${esc(row.product)}</td><th>LOT No</th><td>${esc(row.lot)}</td></tr>
    </table>
    <div class="section">검사결과</div>
    <table>
      <tr><th>항목</th><th>기준</th><th>결과</th><th>판정</th></tr>
      <tr><td>외관</td><td>이물질, 파손 없을 것</td><td>${esc(row.visual)}</td><td>${esc(row.judge)}</td></tr>
      <tr><td>CoA</td><td>누락 없을 것</td><td>${esc(row.coa)}</td><td>${esc(row.judge)}</td></tr>
      <tr><td>점도</td><td>1,500±300 cp</td><td>${esc(row.viscosity)}</td><td>${esc(row.judge)}</td></tr>
      <tr><td>고형분</td><td>20.0±1.0 wt.%</td><td>${esc(row.solid)}</td><td>${esc(row.judge)}</td></tr>
      <tr><td>Dmax</td><td>≤ 10.0 μm</td><td>${esc(row.particle)}</td><td>${esc(row.judge)}</td></tr>
      <tr><td>접착력</td><td>≥ 400 gf/12.7 mm</td><td>${esc(row.adhesion)}</td><td>${esc(row.judge)}</td></tr>
      <tr><td>절연저항</td><td>≥ 200 MΩ</td><td>${esc(row.resistance)}</td><td>${esc(row.judge)}</td></tr>
      <tr><td>팽윤성</td><td>&lt; 120%</td><td>${esc(row.swelling)}</td><td>${esc(row.judge)}</td></tr>
      <tr><td>수분</td><td>&lt; 2,000 ppm</td><td>${esc(row.moisture)}</td><td>${esc(row.judge)}</td></tr>
    </table>
    <div class="section">전자결재</div>
    <table>
      <tr><th>작성</th><th>검토</th><th>승인</th></tr>
      <tr>
        <td>${buildSignCell(row.writer, row.writer_date, row.writer_sign)}</td>
        <td>${buildSignCell(row.reviewer, row.reviewer_date, row.reviewer_sign)}</td>
        <td>${buildSignCell(row.approver, row.approver_date, row.approver_sign)}</td>
      </tr>
    </table>
    </body></html>`;
}

function buildNcrHtml(row) {
  return `${baseStyle('NCR')}
    <h1>나모케미칼 NCR</h1>
    <table>
      <tr><th>NCR 번호</th><td>${esc(row.ncr_no)}</td><th>출력번호</th><td>${esc(row.print_no)}</td></tr>
      <tr><th>발생구분</th><td>${esc(row.source_type)}</td><th>원본번호</th><td>${esc(row.source_no)}</td></tr>
      <tr><th>품목</th><td>${esc(row.item_name)}</td><th>LOT No</th><td>${esc(row.lot_no)}</td></tr>
      <tr><th>부적합유형</th><td>${esc(row.defect_type)}</td><th>중대도</th><td>${esc(row.severity)}</td></tr>
      <tr><th>즉시조치</th><td colspan="3">${esc(row.disposition)}</td></tr>
      <tr><th>상세내용</th><td colspan="3">${esc(row.description)}</td></tr>
    </table>
    <div class="section">전자결재</div>
    <table>
      <tr><th>작성</th><th>검토</th><th>승인</th></tr>
      <tr>
        <td>${buildSignCell(row.writer, row.writer_date, row.writer_sign)}</td>
        <td>${buildSignCell(row.reviewer, row.reviewer_date, row.reviewer_sign)}</td>
        <td>${buildSignCell(row.approver, row.approver_date, row.approver_sign)}</td>
      </tr>
    </table>
    </body></html>`;
}

async function fetchOne(table, id) {
  if (!allowedDocTables.includes(table)) {
    const err = new Error('허용되지 않은 테이블입니다.');
    err.status = 400;
    throw err;
  }

  const result = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

function getLocalPdfAbsolutePath(pdfPath) {
  if (!pdfPath || typeof pdfPath !== 'string' || !pdfPath.startsWith('/files/')) return null;
  const relative = pdfPath.replace('/files/', '');
  return path.join(STORAGE_DIR, relative);
}

function deleteLocalPdfIfExists(pdfPath) {
  const abs = getLocalPdfAbsolutePath(pdfPath);
  if (abs && fs.existsSync(abs)) {
    fs.unlinkSync(abs);
  }
}

async function savePdfAndPath(table, row, dir, filePrefix, buildHtml) {
  const baseNo = safeFilePart(row.lot || row.lot_no || row.ncr_no || row.id);
  const folderName = filePrefix.toLowerCase();
  const fileName = `${filePrefix}_${baseNo}_${Date.now()}.pdf`;
  const filePath = path.join(dir, fileName);
  const publicPath = `/files/pdf/${folderName}/${fileName}`;

  await generatePdfFromHtml(buildHtml(row), filePath);
  await query(`UPDATE ${table} SET pdf_path = $1 WHERE id = $2`, [publicPath, row.id]);

  return publicPath;
}

async function lockCheck(table, id) {
  const row = await fetchOne(table, id);
  if (!row) {
    const err = new Error('데이터를 찾을 수 없습니다.');
    err.status = 404;
    throw err;
  }
  if (row.status === 'Approved') {
    const err = new Error('승인 완료 문서는 수정할 수 없습니다.');
    err.status = 400;
    throw err;
  }
  return row;
}

function validateApprovalStep(row, action) {
  if (!allowedApprovalActions.includes(action)) {
    const err = new Error('허용되지 않은 액션입니다.');
    err.status = 400;
    throw err;
  }

  if (row.status === 'Approved') {
    const err = new Error('이미 승인 완료된 문서입니다.');
    err.status = 400;
    throw err;
  }

  if (action === 'REVIEW' && !row.writer_sign) {
    const err = new Error('작성 완료 후 검토할 수 있습니다.');
    err.status = 400;
    throw err;
  }

  if (action === 'APPROVE' && !row.reviewer_sign) {
    const err = new Error('검토 완료 후 승인할 수 있습니다.');
    err.status = 400;
    throw err;
  }
}

async function documentApproval(table, id, action, me, signatureDataUrl) {
  const row = await fetchOne(table, id);
  if (!row) {
    const err = new Error('문서를 찾을 수 없습니다.');
    err.status = 404;
    throw err;
  }

  validateApprovalStep(row, action);

  if (action !== 'WRITE' && !canApprove(me)) {
    const err = new Error('검토/승인 권한은 승인권자만 가능합니다.');
    err.status = 403;
    throw err;
  }

  if (signatureDataUrl && !isValidSignatureDataUrl(signatureDataUrl)) {
    const err = new Error('서명 데이터 형식이 올바르지 않습니다.');
    err.status = 400;
    throw err;
  }

  if (action === 'WRITE') {
    await query(`
      UPDATE ${table}
      SET writer = $1, writer_date = NOW(), writer_sign = $2, status = 'Draft'
      WHERE id = $3
    `, [me.name, signatureDataUrl || '', id]);
  } else if (action === 'REVIEW') {
    await query(`
      UPDATE ${table}
      SET reviewer = $1, reviewer_date = NOW(), reviewer_sign = $2, status = 'Reviewed'
      WHERE id = $3
    `, [me.name, signatureDataUrl || '', id]);
  } else if (action === 'APPROVE') {
    if (table === 'ncrs') {
      await query(`
        UPDATE ${table}
        SET approver = $1, approver_date = NOW(), approver_sign = $2, status = 'Approved',
            print_no = COALESCE(print_no, $4)
        WHERE id = $3
      `, [me.name, signatureDataUrl || '', id, `NCR-PRN-${Date.now()}`]);
    } else {
      await query(`
        UPDATE ${table}
        SET approver = $1, approver_date = NOW(), approver_sign = $2, status = 'Approved'
        WHERE id = $3
      `, [me.name, signatureDataUrl || '', id]);
    }
  }

  return fetchOne(table, id);
}

/* AUTH */
app.get('/api/auth/me', requireAuth, asyncHandler(async (req, res) => {
  res.json(req.me);
}));

app.post('/api/auth/signup', asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body || {};

  validateRequired(name, '이름을 입력하세요.');
  validateRequired(email, '이메일을 입력하세요.');
  validateRequired(password, '비밀번호를 입력하세요.');

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: '이메일 형식이 올바르지 않습니다.' });
  }

  if (String(password).length < 8) {
    return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
  }

  const exists = await query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (exists.rowCount > 0) {
    return res.status(400).json({ error: '이미 가입된 이메일입니다.' });
  }

  const loginId = String(email).split('@')[0];
  const loginIdExists = await query(`SELECT id FROM users WHERE login_id = $1`, [loginId]);
  if (loginIdExists.rowCount > 0) {
    return res.status(400).json({ error: '중복된 로그인 ID가 발생했습니다. 다른 이메일을 사용하세요.' });
  }

  const passwordHash = await bcrypt.hash(String(password), 12);
  const id = uid('user');

  await query(`
    INSERT INTO users (
      id, login_id, name, email, department, title, role, status, password_hash
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9
    )
  `, [id, loginId, name, email, department || '', 'staff', 'user', 'PENDING', passwordHash]);

  await writeAuditLog(email, 'SIGNUP', 'users', id, '회원가입 신청');
  res.json({ message: '회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' });
}));

app.post('/api/auth/login', loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  validateRequired(email, '이메일을 입력하세요.');
  validateRequired(password, '비밀번호를 입력하세요.');

  const result = await query(`SELECT * FROM users WHERE email = $1`, [email]);
  const user = result.rows[0];

  if (!user) {
    return res.status(400).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }
  if (user.status === 'PENDING') {
    return res.status(403).json({ error: '관리자 승인 후 로그인할 수 있습니다.' });
  }
  if (user.status === 'REJECTED') {
    return res.status(403).json({ error: '반려된 계정입니다.' });
  }

  const ok = await bcrypt.compare(String(password || ''), user.password_hash);
  if (!ok) {
    return res.status(400).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  req.session.user = sanitizeUser(user);
  await writeAuditLog(email, 'LOGIN', 'users', user.id, '로그인');

  res.json({
    message: '로그인되었습니다.',
    user: req.session.user
  });
}));

app.post('/api/auth/logout', requireAuth, asyncHandler(async (req, res) => {
  const email = req.me.email;

  req.session.destroy(async (err) => {
    if (err) {
      return res.status(500).json({ error: '로그아웃 처리 중 오류가 발생했습니다.' });
    }

    try {
      await writeAuditLog(email, 'LOGOUT', 'users', '', '로그아웃');
    } catch (_) {}

    res.json({ message: '로그아웃되었습니다.' });
  });
}));

/* ADMIN USERS */
app.get('/api/admin/users', requireAdmin, asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT id, login_id, name, email, phone, department, title, role, status, created_at
    FROM users
    ORDER BY created_at DESC
  `);
  res.json(result.rows.map(sanitizeUser));
}));

app.post('/api/admin/users/:id/approve', requireAdmin, asyncHandler(async (req, res) => {
  const result = await query(`UPDATE users SET status = 'APPROVED' WHERE id = $1`, [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'APPROVE_USER', 'users', req.params.id, '회원 승인');
  res.json({ message: '회원 승인이 완료되었습니다.' });
}));

app.post('/api/admin/users/:id/reject', requireAdmin, asyncHandler(async (req, res) => {
  const result = await query(`UPDATE users SET status = 'REJECTED' WHERE id = $1`, [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'REJECT_USER', 'users', req.params.id, '회원 반려');
  res.json({ message: '회원 반려가 완료되었습니다.' });
}));

app.put('/api/admin/users/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { name, email, department, title, role, status, phone } = req.body || {};

  validateRequired(name, '이름을 입력하세요.');
  validateRequired(email, '이메일을 입력하세요.');

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: '이메일 형식이 올바르지 않습니다.' });
  }
  if (!allowedRoles.includes(String(role))) {
    return res.status(400).json({ error: '유효하지 않은 권한입니다.' });
  }
  if (!allowedUserStatus.includes(String(status))) {
    return res.status(400).json({ error: '유효하지 않은 사용자 상태입니다.' });
  }

  const dup = await query(`SELECT id FROM users WHERE email = $1 AND id <> $2`, [email, req.params.id]);
  if (dup.rowCount > 0) {
    return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
  }

  const result = await query(`
    UPDATE users
    SET name = $1, email = $2, department = $3, title = $4, role = $5, status = $6, phone = $7
    WHERE id = $8
  `, [name, email, department || '', title || '', role, status, phone || '', req.params.id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'UPDATE', 'users', req.params.id, '회원 수정');
  res.json({ message: '회원 정보가 저장되었습니다.' });
}));

app.delete('/api/admin/users/:id', requireAdmin, asyncHandler(async (req, res) => {
  const result = await query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'DELETE', 'users', req.params.id, '회원 삭제');
  res.json({ message: '회원 삭제가 완료되었습니다.' });
}));

/* SUPPLIERS */
app.get('/api/suppliers', requireAuth, asyncHandler(async (req, res) => {
  const result = await query(`SELECT * FROM suppliers ORDER BY name ASC`);
  res.json(result.rows);
}));

app.post('/api/suppliers', requireAuth, asyncHandler(async (req, res) => {
  const { name, manager, phone, category, status } = req.body || {};
  validateRequired(name, '공급업체명을 입력하세요.');

  const id = uid('sup');
  await query(`
    INSERT INTO suppliers (id, name, manager, phone, category, status)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [id, name, manager || '', phone || '', category || '', status || '']);

  await writeAuditLog(req.me.email, 'CREATE', 'suppliers', id, '공급업체 등록');
  res.json({ message: '저장되었습니다.' });
}));

app.put('/api/suppliers/:id', requireAuth, asyncHandler(async (req, res) => {
  const { name, manager, phone, category, status } = req.body || {};
  validateRequired(name, '공급업체명을 입력하세요.');

  const result = await query(`
    UPDATE suppliers
    SET name = $1, manager = $2, phone = $3, category = $4, status = $5
    WHERE id = $6
  `, [name, manager || '', phone || '', category || '', status || '', req.params.id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: '공급업체를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'UPDATE', 'suppliers', req.params.id, '공급업체 수정');
  res.json({ message: '수정되었습니다.' });
}));

app.delete('/api/suppliers/:id', requireAuth, asyncHandler(async (req, res) => {
  const result = await query(`DELETE FROM suppliers WHERE id = $1`, [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: '공급업체를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'DELETE', 'suppliers', req.params.id, '공급업체 삭제');
  res.json({ message: '삭제되었습니다.' });
}));

/* IQC */
app.get('/api/iqc', requireAuth, asyncHandler(async (req, res) => {
  const rows = (await query(`SELECT * FROM iqc ORDER BY date DESC, id DESC`)).rows;
  res.json(rows);
}));

app.post('/api/iqc', requireAuth, asyncHandler(async (req, res) => {
  const p = req.body || {};
  validateRequired(p.date, '검사일자를 입력하세요.');
  validateRequired(p.lot, 'LOT No를 입력하세요.');

  const inQty = toNonNegativeInt(p.inQty || 0, '입고수량');
  const qty = toNonNegativeInt(p.qty || 0, '검사수량');
  const fail = toNonNegativeInt(p.fail || 0, '불량수량');
  validateQtyFail(qty, fail);

  const id = uid('iqc');
  const judge = fail > 0 ? '불합격' : '합격';

  await query(`
    INSERT INTO iqc (
      id, date, receipt_date, lot, supplier, item, coa_no, in_qty, qty, fail,
      appearance_result, appearance_judge, package_result, package_judge,
      label_result, label_judge, coa_result, coa_judge, inspector, remark,
      judge, writer, writer_date, status
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,
      $15,$16,$17,$18,$19,$20,
      $21,$22,NOW(),$23
    )
  `, [
    id,
    p.date,
    p.receiptDate || p.date,
    p.lot,
    p.supplier || '',
    p.item || '',
    p.coaNo || '',
    inQty,
    qty,
    fail,
    p.appearanceResult || '양호',
    p.appearanceJudge || '합격',
    p.packageResult || '양호',
    p.packageJudge || '합격',
    p.labelResult || '양호',
    p.labelJudge || '합격',
    p.coaResult || '확인',
    p.coaJudge || '합격',
    p.inspector || req.me.name,
    p.remark || '',
    judge,
    req.me.name,
    'Draft'
  ]);

  await writeAuditLog(req.me.email, 'CREATE', 'iqc', id, '입고검사 등록');
  res.json({ message: '저장되었습니다.' });
}));

app.put('/api/iqc/:id', requireAuth, asyncHandler(async (req, res) => {
  await lockCheck('iqc', req.params.id);

  const p = req.body || {};
  validateRequired(p.date, '검사일자를 입력하세요.');
  validateRequired(p.lot, 'LOT No를 입력하세요.');

  const inQty = toNonNegativeInt(p.inQty || 0, '입고수량');
  const qty = toNonNegativeInt(p.qty || 0, '검사수량');
  const fail = toNonNegativeInt(p.fail || 0, '불량수량');
  validateQtyFail(qty, fail);

  const judge = fail > 0 ? '불합격' : '합격';

  const result = await query(`
    UPDATE iqc SET
      date = $1, receipt_date = $2, lot = $3, supplier = $4, item = $5, coa_no = $6,
      in_qty = $7, qty = $8, fail = $9,
      appearance_result = $10, appearance_judge = $11,
      package_result = $12, package_judge = $13,
      label_result = $14, label_judge = $15,
      coa_result = $16, coa_judge = $17,
      inspector = $18, remark = $19, judge = $20
    WHERE id = $21
  `, [
    p.date,
    p.receiptDate || p.date,
    p.lot,
    p.supplier || '',
    p.item || '',
    p.coaNo || '',
    inQty,
    qty,
    fail,
    p.appearanceResult || '양호',
    p.appearanceJudge || '합격',
    p.packageResult || '양호',
    p.packageJudge || '합격',
    p.labelResult || '양호',
    p.labelJudge || '합격',
    p.coaResult || '확인',
    p.coaJudge || '합격',
    p.inspector || req.me.name,
    p.remark || '',
    judge,
    req.params.id
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'UPDATE', 'iqc', req.params.id, '입고검사 수정');
  res.json({ message: '수정되었습니다.' });
}));

app.delete('/api/iqc/:id', requireAuth, asyncHandler(async (req, res) => {
  const row = await lockCheck('iqc', req.params.id);
  deleteLocalPdfIfExists(row.pdf_path);

  const result = await query(`DELETE FROM iqc WHERE id = $1`, [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'DELETE', 'iqc', req.params.id, '입고검사 삭제');
  res.json({ message: '삭제되었습니다.' });
}));

/* IPQC */
app.get('/api/ipqc', requireAuth, asyncHandler(async (req, res) => {
  const rows = (await query(`SELECT * FROM ipqc ORDER BY date DESC, id DESC`)).rows;
  res.json(rows);
}));

app.post('/api/ipqc', requireAuth, asyncHandler(async (req, res) => {
  const p = req.body || {};
  validateRequired(p.date, '검사일자를 입력하세요.');
  validateRequired(p.lot, 'LOT No를 입력하세요.');

  const qty = toNonNegativeInt(p.qty || 0, '검사수량');
  const fail = toNonNegativeInt(p.fail || 0, '불량수량');
  validateQtyFail(qty, fail);

  const id = uid('ipqc');
  const judge = fail > 0 ? '불합격' : '합격';

  await query(`
    INSERT INTO ipqc (
      id, date, product, lot, visual, viscosity, solid, particle,
      qty, fail, inspector, remark, judge, writer, writer_date, status
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,
      $9,$10,$11,$12,$13,$14,NOW(),$15
    )
  `, [
    id,
    p.date,
    p.product || '',
    p.lot,
    p.visual || '',
    p.viscosity || '',
    p.solid || '',
    p.particle || '',
    qty,
    fail,
    p.inspector || req.me.name,
    p.remark || '',
    judge,
    req.me.name,
    'Draft'
  ]);

  await writeAuditLog(req.me.email, 'CREATE', 'ipqc', id, '공정검사 등록');
  res.json({ message: '저장되었습니다.' });
}));

app.put('/api/ipqc/:id', requireAuth, asyncHandler(async (req, res) => {
  await lockCheck('ipqc', req.params.id);

  const p = req.body || {};
  validateRequired(p.date, '검사일자를 입력하세요.');
  validateRequired(p.lot, 'LOT No를 입력하세요.');

  const qty = toNonNegativeInt(p.qty || 0, '검사수량');
  const fail = toNonNegativeInt(p.fail || 0, '불량수량');
  validateQtyFail(qty, fail);

  const judge = fail > 0 ? '불합격' : '합격';

  const result = await query(`
    UPDATE ipqc SET
      date = $1, product = $2, lot = $3, visual = $4, viscosity = $5,
      solid = $6, particle = $7, qty = $8, fail = $9,
      inspector = $10, remark = $11, judge = $12
    WHERE id = $13
  `, [
    p.date,
    p.product || '',
    p.lot,
    p.visual || '',
    p.viscosity || '',
    p.solid || '',
    p.particle || '',
    qty,
    fail,
    p.inspector || req.me.name,
    p.remark || '',
    judge,
    req.params.id
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'UPDATE', 'ipqc', req.params.id, '공정검사 수정');
  res.json({ message: '수정되었습니다.' });
}));

app.delete('/api/ipqc/:id', requireAuth, asyncHandler(async (req, res) => {
  const row = await lockCheck('ipqc', req.params.id);
  deleteLocalPdfIfExists(row.pdf_path);

  const result = await query(`DELETE FROM ipqc WHERE id = $1`, [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'DELETE', 'ipqc', req.params.id, '공정검사 삭제');
  res.json({ message: '삭제되었습니다.' });
}));

/* OQC */
app.get('/api/oqc', requireAuth, asyncHandler(async (req, res) => {
  const rows = (await query(`SELECT * FROM oqc ORDER BY date DESC, id DESC`)).rows;
  res.json(rows);
}));

app.post('/api/oqc', requireAuth, asyncHandler(async (req, res) => {
  const p = req.body || {};
  validateRequired(p.date, '검사일자를 입력하세요.');
  validateRequired(p.lot, 'LOT No를 입력하세요.');

  const qty = toNonNegativeInt(p.qty || 0, '검사수량');
  const fail = toNonNegativeInt(p.fail || 0, '불량수량');
  validateQtyFail(qty, fail);

  const id = uid('oqc');
  const judge = fail > 0 ? '불합격' : '합격';

  await query(`
    INSERT INTO oqc (
      id, date, customer, product, lot, visual, coa, viscosity, solid, particle,
      adhesion, resistance, swelling, moisture, qty, fail, inspector, remark,
      judge, writer, writer_date, status
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,$16,$17,$18,
      $19,$20,NOW(),$21
    )
  `, [
    id,
    p.date,
    p.customer || '',
    p.product || '',
    p.lot,
    p.visual || '',
    p.coa || '',
    p.viscosity || '',
    p.solid || '',
    p.particle || '',
    p.adhesion || '',
    p.resistance || '',
    p.swelling || '',
    p.moisture || '',
    qty,
    fail,
    p.inspector || req.me.name,
    p.remark || '',
    judge,
    req.me.name,
    'Draft'
  ]);

  await writeAuditLog(req.me.email, 'CREATE', 'oqc', id, '출하검사 등록');
  res.json({ message: '저장되었습니다.' });
}));

app.put('/api/oqc/:id', requireAuth, asyncHandler(async (req, res) => {
  await lockCheck('oqc', req.params.id);

  const p = req.body || {};
  validateRequired(p.date, '검사일자를 입력하세요.');
  validateRequired(p.lot, 'LOT No를 입력하세요.');

  const qty = toNonNegativeInt(p.qty || 0, '검사수량');
  const fail = toNonNegativeInt(p.fail || 0, '불량수량');
  validateQtyFail(qty, fail);

  const judge = fail > 0 ? '불합격' : '합격';

  const result = await query(`
    UPDATE oqc SET
      date = $1, customer = $2, product = $3, lot = $4, visual = $5, coa = $6,
      viscosity = $7, solid = $8, particle = $9, adhesion = $10,
      resistance = $11, swelling = $12, moisture = $13,
      qty = $14, fail = $15, inspector = $16, remark = $17, judge = $18
    WHERE id = $19
  `, [
    p.date,
    p.customer || '',
    p.product || '',
    p.lot,
    p.visual || '',
    p.coa || '',
    p.viscosity || '',
    p.solid || '',
    p.particle || '',
    p.adhesion || '',
    p.resistance || '',
    p.swelling || '',
    p.moisture || '',
    qty,
    fail,
    p.inspector || req.me.name,
    p.remark || '',
    judge,
    req.params.id
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'UPDATE', 'oqc', req.params.id, '출하검사 수정');
  res.json({ message: '수정되었습니다.' });
}));

app.delete('/api/oqc/:id', requireAuth, asyncHandler(async (req, res) => {
  const row = await lockCheck('oqc', req.params.id);
  deleteLocalPdfIfExists(row.pdf_path);

  const result = await query(`DELETE FROM oqc WHERE id = $1`, [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'DELETE', 'oqc', req.params.id, '출하검사 삭제');
  res.json({ message: '삭제되었습니다.' });
}));

/* NONCONFORM */
app.get('/api/nonconform', requireAuth, asyncHandler(async (req, res) => {
  const rows = (await query(`SELECT * FROM nonconform ORDER BY date DESC, id DESC`)).rows;
  res.json(rows);
}));

app.post('/api/nonconform', requireAuth, asyncHandler(async (req, res) => {
  const p = req.body || {};
  validateRequired(p.date, '발생일자를 입력하세요.');

  const id = uid('nc');
  await query(`
    INSERT INTO nonconform (id, date, type, lot, item, issue, cause, action, owner, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
  `, [
    id,
    p.date,
    p.type || '',
    p.lot || '',
    p.item || '',
    p.issue || '',
    p.cause || '',
    p.action || '',
    p.owner || '',
    p.status || ''
  ]);

  await writeAuditLog(req.me.email, 'CREATE', 'nonconform', id, '부적합 등록');
  res.json({ message: '저장되었습니다.' });
}));

app.put('/api/nonconform/:id', requireAuth, asyncHandler(async (req, res) => {
  const p = req.body || {};
  validateRequired(p.date, '발생일자를 입력하세요.');

  const result = await query(`
    UPDATE nonconform
    SET date = $1, type = $2, lot = $3, item = $4, issue = $5,
        cause = $6, action = $7, owner = $8, status = $9
    WHERE id = $10
  `, [
    p.date,
    p.type || '',
    p.lot || '',
    p.item || '',
    p.issue || '',
    p.cause || '',
    p.action || '',
    p.owner || '',
    p.status || '',
    req.params.id
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: '데이터를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'UPDATE', 'nonconform', req.params.id, '부적합 수정');
  res.json({ message: '수정되었습니다.' });
}));

app.delete('/api/nonconform/:id', requireAuth, asyncHandler(async (req, res) => {
  const result = await query(`DELETE FROM nonconform WHERE id = $1`, [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: '데이터를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'DELETE', 'nonconform', req.params.id, '부적합 삭제');
  res.json({ message: '삭제되었습니다.' });
}));

/* CHANGE LOGS */
app.get('/api/change-logs', requireAuth, asyncHandler(async (req, res) => {
  const rows = (await query(`
    SELECT created_at AS "logDate", detail AS message
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 200
  `)).rows;
  res.json(rows);
}));

/* NCR */
app.get('/api/ncrs', requireAuth, asyncHandler(async (req, res) => {
  const rows = (await query(`SELECT * FROM ncrs ORDER BY created_at DESC, id DESC`)).rows;
  res.json(rows);
}));

app.post('/api/ncrs', requireAuth, asyncHandler(async (req, res) => {
  const p = req.body || {};
  validateRequired(p.sourceType, '발생구분을 입력하세요.');

  const id = uid('ncr');
  const ncrNo = p.ncrNo || `NCR-${new Date().getFullYear()}-${Date.now()}`;

  await query(`
    INSERT INTO ncrs (
      id, ncr_no, source_type, source_no, item_name, lot_no, defect_type,
      severity, disposition, owner_name, description, status, writer, writer_date
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,'Draft',$12,NOW()
    )
  `, [
    id,
    ncrNo,
    p.sourceType,
    p.sourceNo || '',
    p.itemName || '',
    p.lotNo || '',
    p.defectType || '',
    p.severity || '',
    p.disposition || '',
    p.ownerName || '',
    p.description || '',
    req.me.name
  ]);

  await writeAuditLog(req.me.email, 'CREATE', 'ncrs', id, 'NCR 발행');
  res.json({ message: 'NCR이 발행되었습니다.' });
}));

app.delete('/api/ncrs/:id', requireAuth, asyncHandler(async (req, res) => {
  const row = await lockCheck('ncrs', req.params.id);
  deleteLocalPdfIfExists(row.pdf_path);

  const result = await query(`DELETE FROM ncrs WHERE id = $1`, [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });
  }

  await writeAuditLog(req.me.email, 'DELETE', 'ncrs', req.params.id, 'NCR 삭제');
  res.json({ message: '삭제되었습니다.' });
}));

/* APPROVAL */
app.post('/api/iqc/:id/approval', requireAuth, asyncHandler(async (req, res) => {
  const { action, signatureDataUrl } = req.body || {};
  const updated = await documentApproval('iqc', req.params.id, action, req.me, signatureDataUrl);

  let pdfPath = updated.pdf_path;
  if (action === 'APPROVE') {
    pdfPath = await savePdfAndPath('iqc', updated, IQC_PDF_DIR, 'IQC', buildIqcHtml);
  }

  await writeAuditLog(req.me.email, 'APPROVAL', 'iqc', req.params.id, `입고검사 ${action}`);
  res.json({ message: '전자결재가 반영되었습니다.', pdfPath });
}));

app.post('/api/ipqc/:id/approval', requireAuth, asyncHandler(async (req, res) => {
  const { action, signatureDataUrl } = req.body || {};
  const updated = await documentApproval('ipqc', req.params.id, action, req.me, signatureDataUrl);

  let pdfPath = updated.pdf_path;
  if (action === 'APPROVE') {
    pdfPath = await savePdfAndPath('ipqc', updated, IPQC_PDF_DIR, 'IPQC', buildIpqcHtml);
  }

  await writeAuditLog(req.me.email, 'APPROVAL', 'ipqc', req.params.id, `공정검사 ${action}`);
  res.json({ message: '전자결재가 반영되었습니다.', pdfPath });
}));

app.post('/api/oqc/:id/approval', requireAuth, asyncHandler(async (req, res) => {
  const { action, signatureDataUrl } = req.body || {};
  const updated = await documentApproval('oqc', req.params.id, action, req.me, signatureDataUrl);

  let pdfPath = updated.pdf_path;
  if (action === 'APPROVE') {
    pdfPath = await savePdfAndPath('oqc', updated, OQC_PDF_DIR, 'OQC', buildOqcHtml);
  }

  await writeAuditLog(req.me.email, 'APPROVAL', 'oqc', req.params.id, `출하검사 ${action}`);
  res.json({ message: '전자결재가 반영되었습니다.', pdfPath });
}));

app.post('/api/ncrs/:id/approval', requireAuth, asyncHandler(async (req, res) => {
  const { action, signatureDataUrl } = req.body || {};
  const updated = await documentApproval('ncrs', req.params.id, action, req.me, signatureDataUrl);

  let pdfPath = updated.pdf_path;
  if (action === 'APPROVE') {
    pdfPath = await savePdfAndPath('ncrs', updated, NCR_PDF_DIR, 'NCR', buildNcrHtml);
  }

  await writeAuditLog(req.me.email, 'APPROVAL', 'ncrs', req.params.id, `NCR ${action}`);
  res.json({ message: '전자결재가 반영되었습니다.', pdfPath });
}));

/* PDF */
app.post('/api/iqc/:id/pdf', requireAuth, asyncHandler(async (req, res) => {
  const row = await fetchOne('iqc', req.params.id);
  if (!row) return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });

  const pdfPath = await savePdfAndPath('iqc', row, IQC_PDF_DIR, 'IQC', buildIqcHtml);
  await writeAuditLog(req.me.email, 'PRINT', 'iqc', req.params.id, '입고검사 PDF 생성');
  res.json({ message: 'PDF가 생성되었습니다.', pdfPath });
}));

app.post('/api/ipqc/:id/pdf', requireAuth, asyncHandler(async (req, res) => {
  const row = await fetchOne('ipqc', req.params.id);
  if (!row) return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });

  const pdfPath = await savePdfAndPath('ipqc', row, IPQC_PDF_DIR, 'IPQC', buildIpqcHtml);
  await writeAuditLog(req.me.email, 'PRINT', 'ipqc', req.params.id, '공정검사 PDF 생성');
  res.json({ message: 'PDF가 생성되었습니다.', pdfPath });
}));

app.post('/api/oqc/:id/pdf', requireAuth, asyncHandler(async (req, res) => {
  const row = await fetchOne('oqc', req.params.id);
  if (!row) return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });

  const pdfPath = await savePdfAndPath('oqc', row, OQC_PDF_DIR, 'OQC', buildOqcHtml);
  await writeAuditLog(req.me.email, 'PRINT', 'oqc', req.params.id, '출하검사 PDF 생성');
  res.json({ message: 'PDF가 생성되었습니다.', pdfPath });
}));

app.post('/api/ncrs/:id/pdf', requireAuth, asyncHandler(async (req, res) => {
  const row = await fetchOne('ncrs', req.params.id);
  if (!row) return res.status(404).json({ error: '문서를 찾을 수 없습니다.' });

  const pdfPath = await savePdfAndPath('ncrs', row, NCR_PDF_DIR, 'NCR', buildNcrHtml);
  await writeAuditLog(req.me.email, 'PRINT', 'ncrs', req.params.id, 'NCR PDF 생성');
  res.json({ message: 'PDF가 생성되었습니다.', pdfPath });
}));

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send('Not Found');
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === '23505') {
    return res.status(400).json({ error: '중복된 데이터입니다.' });
  }

  const status = err.status || 500;
  const message = status >= 500 ? '서버 내부 오류가 발생했습니다.' : err.message;
  res.status(status).json({ error: message });
});

(async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`나모케미칼 QMS 서버 실행: http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('서버 초기화 실패', err);
    process.exit(1);
  }
})();
