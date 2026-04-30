process.env.TZ = 'Asia/Seoul';

const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, Date.now() + '_' + safe.replace(/[^a-zA-Z0-9가-힣._-]/g, '_'));
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-me-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      // BUG #11 수정: 환경변수로 분기
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use(express.static(path.join(__dirname, 'public')));

function ok(res, data = null, message = 'OK') {
  return res.json({ success: true, message, data });
}
function fail(res, status, message) {
  return res.status(status).json({ success: false, message, data: null });
}
function txt(v) { return (v ?? '').toString().trim(); }
function num(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function arr(v) { return Array.isArray(v) ? v : []; }
async function db(sql, params = []) { return pool.query(sql, params); }

function requireLogin(req, res, next) {
  if (!req.session.user) return fail(res, 401, '로그인이 필요합니다.');
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return fail(res, 403, '관리자 권한이 필요합니다.');
  }
  next();
}
function buildSessionUser(user) {
  return {
    id: user.id, name: user.name, email: user.email,
    role: user.role, department: user.department,
    title: user.title || '', status: user.status,
  };
}
function calcJudgeFromItems(items = []) {
  const rows = arr(items);
  if (!rows.length) return '합격';
  if (rows.some((x) => txt(x.judge) === '불합격')) return '불합격';
  if (rows.some((x) => txt(x.judge) === '보류')) return '보류';
  return '합격';
}

const SENIOR_TITLES = ['부장','이사','상무','전무','임원','대표이사','대표','사장','회장','본부장','실장','센터장','ceo','cto','coo','cfo','chief'];
function isSenior(user) {
  if (!user) return false;
  if ((user.role || '') === 'admin') return true;
  const t = (user.title || '').toLowerCase();
  return SENIOR_TITLES.some(s => t.includes(s));
}

async function ensureSchema() {
  await db(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      department TEXT DEFAULT '',
      title TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'APPROVED',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS iqc (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      lot TEXT NOT NULL,
      supplier TEXT NOT NULL,
      item TEXT NOT NULL,
      inspector TEXT NOT NULL,
      incoming_qty NUMERIC,
      qty NUMERIC,
      fail NUMERIC DEFAULT 0,
      items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      sign_writer JSONB,
      sign_reviewer JSONB,
      sign_approver JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pqc (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      product TEXT NOT NULL,
      lot TEXT NOT NULL,
      visual TEXT DEFAULT '',
      viscosity TEXT DEFAULT '',
      solid TEXT DEFAULT '',
      particle TEXT DEFAULT '',
      judge TEXT DEFAULT '',
      incoming_qty NUMERIC,
      qty NUMERIC,
      fail NUMERIC DEFAULT 0,
      items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      sign_writer JSONB,
      sign_reviewer JSONB,
      sign_approver JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS oqc (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      customer TEXT NOT NULL,
      product TEXT NOT NULL,
      lot TEXT NOT NULL,
      visual TEXT DEFAULT '',
      package TEXT DEFAULT '',
      viscosity TEXT DEFAULT '',
      solid TEXT DEFAULT '',
      particle TEXT DEFAULT '',
      adhesion TEXT DEFAULT '',
      resistance TEXT DEFAULT '',
      swelling TEXT DEFAULT '',
      moisture TEXT DEFAULT '',
      qty NUMERIC DEFAULT 0,
      fail NUMERIC DEFAULT 0,
      judge TEXT DEFAULT '',
      items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      sign_writer JSONB,
      sign_reviewer JSONB,
      sign_approver JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL,
      manager TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      category TEXT DEFAULT '',
      status TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS nonconform (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nc_date DATE NOT NULL,
      nc_no TEXT DEFAULT '',
      nc_type TEXT DEFAULT '',
      dept TEXT DEFAULT '',
      lot TEXT DEFAULT '',
      item TEXT DEFAULT '',
      qty NUMERIC DEFAULT 0,
      issue TEXT DEFAULT '',
      cause TEXT DEFAULT '',
      action TEXT DEFAULT '',
      action_date DATE,
      verify TEXT DEFAULT '',
      verify_date DATE,
      owner TEXT DEFAULT '',
      status TEXT DEFAULT '미결',
      sign_writer JSONB,
      sign_reviewer JSONB,
      sign_approver JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS worklog (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      work_date DATE NOT NULL,
      finished_lot TEXT NOT NULL,
      worker TEXT NOT NULL,
      plan_qty TEXT DEFAULT '',
      prod_qty TEXT DEFAULT '',
      fail_qty TEXT DEFAULT '',
      remark TEXT DEFAULT '',
      flow_set TEXT DEFAULT '',
      flow_actual TEXT DEFAULT '',
      temp_set TEXT DEFAULT '',
      temp_actual TEXT DEFAULT '',
      press_set TEXT DEFAULT '',
      press_actual TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS worklog_materials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      worklog_id UUID NOT NULL REFERENCES worklog(id) ON DELETE CASCADE,
      seq INTEGER NOT NULL,
      material TEXT DEFAULT '',
      sup_name TEXT DEFAULT '',
      lot_no TEXT DEFAULT '',
      input_qty TEXT DEFAULT '',
      input_time TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS worklog_attachments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      worklog_id UUID NOT NULL REFERENCES worklog(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cert_type TEXT NOT NULL,
      date DATE NOT NULL,
      lot TEXT NOT NULL,
      inspector TEXT DEFAULT '',
      item TEXT DEFAULT '',
      company TEXT DEFAULT '',
      incoming_qty TEXT DEFAULT '',
      check_qty TEXT DEFAULT '',
      fail_qty TEXT DEFAULT '',
      judge TEXT DEFAULT '',
      remark TEXT DEFAULT '',
      items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 마이그레이션: 기존 테이블에 컬럼 추가
  const alters = [
    `ALTER TABLE users ALTER COLUMN status SET DEFAULT 'APPROVED'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT DEFAULT ''`,
    `ALTER TABLE iqc ADD COLUMN IF NOT EXISTS items_json JSONB NOT NULL DEFAULT '[]'::jsonb`,
    `ALTER TABLE iqc ADD COLUMN IF NOT EXISTS sign_writer JSONB`,
    `ALTER TABLE iqc ADD COLUMN IF NOT EXISTS sign_reviewer JSONB`,
    `ALTER TABLE iqc ADD COLUMN IF NOT EXISTS sign_approver JSONB`,
    `ALTER TABLE pqc ADD COLUMN IF NOT EXISTS items_json JSONB NOT NULL DEFAULT '[]'::jsonb`,
    `ALTER TABLE pqc ADD COLUMN IF NOT EXISTS sign_writer JSONB`,
    `ALTER TABLE pqc ADD COLUMN IF NOT EXISTS sign_reviewer JSONB`,
    `ALTER TABLE pqc ADD COLUMN IF NOT EXISTS sign_approver JSONB`,
    `ALTER TABLE oqc ADD COLUMN IF NOT EXISTS items_json JSONB NOT NULL DEFAULT '[]'::jsonb`,
    `ALTER TABLE oqc ADD COLUMN IF NOT EXISTS package TEXT DEFAULT ''`,
    `ALTER TABLE oqc ADD COLUMN IF NOT EXISTS sign_writer JSONB`,
    `ALTER TABLE oqc ADD COLUMN IF NOT EXISTS sign_reviewer JSONB`,
    `ALTER TABLE oqc ADD COLUMN IF NOT EXISTS sign_approver JSONB`,
    // BUG #04 수정: oqc qty TEXT → NUMERIC
    `ALTER TABLE oqc ALTER COLUMN qty TYPE NUMERIC USING qty::NUMERIC`,
    // BUG #02 수정: nonconform 컬럼 마이그레이션 (date → nc_date 컬럼명 통일)
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS nc_date DATE`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS nc_no TEXT DEFAULT ''`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS nc_type TEXT DEFAULT ''`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS dept TEXT DEFAULT ''`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS qty NUMERIC DEFAULT 0`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS action_date DATE`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS verify TEXT DEFAULT ''`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS verify_date DATE`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS sign_writer JSONB`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS sign_reviewer JSONB`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS sign_approver JSONB`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS issue TEXT DEFAULT ''`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS cause TEXT DEFAULT ''`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS action TEXT DEFAULT ''`,
    `ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS owner TEXT DEFAULT ''`,
    // nc_date가 null인 기존 행: date 컬럼에서 복사 (date 컬럼이 있던 구버전 마이그레이션)
    `UPDATE nonconform SET nc_date = created_at::date WHERE nc_date IS NULL`,
    `CREATE TABLE IF NOT EXISTS worklog_attachments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      worklog_id UUID NOT NULL REFERENCES worklog(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  ];

  for (const sql of alters) {
    try { await db(sql); } catch (e) { /* 무시 */ }
  }
}

/* ═══ 서명 가능 사용자 API ═══ */
app.get('/api/users/signable', requireLogin, async (_req, res) => {
  try {
    const r = await db(`
      SELECT id, name, email, department, title, role, status
      FROM users
      WHERE status = 'APPROVED'
      ORDER BY name ASC
    `);
    ok(res, r.rows);
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get('/api/test-db', async (_req, res) => {
  try {
    const r = await db(`SELECT NOW() AS db_now, NOW() AT TIME ZONE 'Asia/Seoul' AS korea_now`);
    ok(res, r.rows[0], 'DB 연결 성공');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

/* ═══ AUTH ═══ */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const name = txt(req.body.name), email = txt(req.body.email).toLowerCase();
    const password = txt(req.body.password), department = txt(req.body.department);
    const title = txt(req.body.title);
    if (!name || !email || !password) return fail(res, 400, '성명, 이메일, 비밀번호는 필수입니다.');
    const exists = await db('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rowCount) return fail(res, 409, '이미 사용 중인 이메일입니다.');
    const hash = await bcrypt.hash(password, 10);
    await db(`INSERT INTO users (name,email,password_hash,department,title,role,status) VALUES ($1,$2,$3,$4,$5,'user','APPROVED')`,
      [name, email, hash, department, title]);
    ok(res, null, '회원가입이 완료되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = txt(req.body.email).toLowerCase(), password = txt(req.body.password);
    const r = await db('SELECT * FROM users WHERE email = $1', [email]);
    if (!r.rowCount) return fail(res, 401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    const user = r.rows[0];
    if (!await bcrypt.compare(password, user.password_hash)) return fail(res, 401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    if (user.status !== 'APPROVED') return fail(res, 403, '승인된 계정만 로그인할 수 있습니다.');
    req.session.user = buildSessionUser(user);
    ok(res, { user: req.session.user }, '로그인 성공');
  } catch (err) { fail(res, 500, err.message); }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => ok(res, null, '로그아웃 완료'));
});
app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return fail(res, 401, '로그인이 필요합니다.');
  ok(res, req.session.user);
});
app.post('/api/auth/change-password', requireLogin, async (req, res) => {
  try {
    const cp = txt(req.body.currentPassword), np = txt(req.body.newPassword);
    if (!cp || !np) return fail(res, 400, '현재 비밀번호와 새 비밀번호를 입력하세요.');
    const r = await db('SELECT * FROM users WHERE id = $1', [req.session.user.id]);
    if (!r.rowCount) return fail(res, 404, '사용자를 찾을 수 없습니다.');
    if (!await bcrypt.compare(cp, r.rows[0].password_hash)) return fail(res, 400, '현재 비밀번호가 올바르지 않습니다.');
    await db('UPDATE users SET password_hash=$1 WHERE id=$2', [await bcrypt.hash(np, 10), r.rows[0].id]);
    ok(res, null, '비밀번호가 변경되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const name=txt(req.body.name), email=txt(req.body.email).toLowerCase();
    const department=txt(req.body.department), newPassword=txt(req.body.newPassword);
    if(!name||!email||!department||!newPassword) return fail(res,400,'모든 항목을 입력하세요.');
    const r=await db('SELECT * FROM users WHERE name=$1 AND email=$2 AND department=$3',[name,email,department]);
    if(!r.rowCount) return fail(res,404,'일치하는 사용자를 찾을 수 없습니다.');
    await db('UPDATE users SET password_hash=$1 WHERE id=$2',[await bcrypt.hash(newPassword,10),r.rows[0].id]);
    ok(res,null,'비밀번호가 초기화되었습니다.');
  } catch(err){ fail(res,500,err.message); }
});

/* ═══ IQC CRUD ═══ */
// BUG #01 수정: items_json 필드명 통일 및 날짜 정확한 반환
app.get('/api/iqc', requireLogin, async (_req, res) => {
  try {
    const r = await db('SELECT * FROM iqc ORDER BY created_at DESC');
    ok(res, r.rows.map(row => ({
      id: row.id,
      // BUG #날짜 수정: DATE 컬럼을 ISO 문자열로 정확히 반환
      date: row.date ? row.date.toISOString().slice(0,10) : '',
      lot: row.lot,
      supplier: row.supplier,
      item: row.item,
      inspector: row.inspector,
      incoming_qty: row.incoming_qty,
      qty: row.qty,
      fail: row.fail,
      // BUG #01 수정: items_json → items로 일관되게 반환
      items_json: Array.isArray(row.items_json) ? row.items_json : (row.items_json || []),
      sign_writer: row.sign_writer,
      sign_reviewer: row.sign_reviewer,
      sign_approver: row.sign_approver,
    })));
  } catch (err) { fail(res, 500, err.message); }
});
app.post('/api/iqc', requireLogin, async (req, res) => {
  try {
    const b = req.body;
    const items = arr(b.items);
    const r = await db(
      `INSERT INTO iqc (date,lot,supplier,item,inspector,incoming_qty,qty,fail,items_json,sign_writer,sign_reviewer,sign_approver)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [txt(b.date),txt(b.lot),txt(b.supplier),txt(b.item),txt(b.inspector||b.signWriter?.name||''),
       num(b.incomingQty),num(b.checkQty||b.qty),num(b.failQty||b.fail)??0,
       JSON.stringify(items),
       JSON.stringify(b.signWriter||null),JSON.stringify(b.signReviewer||null),JSON.stringify(b.signApprover||null)]
    );
    const row = r.rows[0];
    ok(res, {
      ...row,
      date: row.date ? row.date.toISOString().slice(0,10) : '',
      items_json: row.items_json || []
    }, '저장되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.put('/api/iqc/:id', requireLogin, async (req, res) => {
  try {
    const b = req.body;
    const items = arr(b.items);
    const r = await db(
      `UPDATE iqc SET date=$1,lot=$2,supplier=$3,item=$4,inspector=$5,incoming_qty=$6,qty=$7,fail=$8,
       items_json=$9,sign_writer=$10,sign_reviewer=$11,sign_approver=$12 WHERE id=$13 RETURNING *`,
      [txt(b.date),txt(b.lot),txt(b.supplier),txt(b.item),txt(b.inspector||b.signWriter?.name||''),
       num(b.incomingQty),num(b.checkQty||b.qty),num(b.failQty||b.fail)??0,
       JSON.stringify(items),
       JSON.stringify(b.signWriter||null),JSON.stringify(b.signReviewer||null),JSON.stringify(b.signApprover||null),
       req.params.id]
    );
    if (!r.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');
    const row = r.rows[0];
    ok(res, {
      ...row,
      date: row.date ? row.date.toISOString().slice(0,10) : '',
      items_json: row.items_json || []
    }, '수정되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.delete('/api/iqc/:id', requireLogin, async (req, res) => {
  try {
    const r = await db('DELETE FROM iqc WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');
    ok(res, null, '삭제되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});

/* ═══ PQC CRUD ═══ */
// BUG #06 수정: shift(작업조) = particle 컬럼, line(설비명) = visual 컬럼 매핑 명확화
app.get('/api/pqc', requireLogin, async (_req, res) => {
  try {
    const r = await db('SELECT * FROM pqc ORDER BY created_at DESC');
    ok(res, r.rows.map(row => ({
      id: row.id,
      date: row.date ? row.date.toISOString().slice(0,10) : '',
      lot: row.lot,
      product: row.product,
      line: row.visual,      // 설비명 → visual 컬럼
      shift: row.particle,   // 작업조 → particle 컬럼
      inspector: row.solid,  // 작업자 → solid 컬럼
      qty: row.qty,
      failQty: row.fail,
      judge: row.judge,
      items_json: Array.isArray(row.items_json) ? row.items_json : (row.items_json || []),
      sign_writer: row.sign_writer,
      sign_reviewer: row.sign_reviewer,
      sign_approver: row.sign_approver,
    })));
  } catch (err) { fail(res, 500, err.message); }
});
app.post('/api/pqc', requireLogin, async (req, res) => {
  try {
    const b = req.body;
    const items = arr(b.items);
    // BUG #06 수정: 프론트의 particle 필드(= 작업조 shift)를 particle 컬럼에 저장
    const r = await db(
      `INSERT INTO pqc (date,product,lot,visual,solid,particle,judge,qty,fail,items_json,sign_writer,sign_reviewer,sign_approver)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [txt(b.date),txt(b.product),txt(b.lot),
       txt(b.visual||b.line||''),           // 설비명
       txt(b.solid||b.inspector||b.signWriter?.name||''), // 작업자
       txt(b.particle||b.shift||''),        // 작업조
       txt(b.judge)||calcJudgeFromItems(items),
       num(b.qty||b.checkQty),num(b.failQty||b.fail)??0,
       JSON.stringify(items),
       JSON.stringify(b.signWriter||null),JSON.stringify(b.signReviewer||null),JSON.stringify(b.signApprover||null)]
    );
    const row = r.rows[0];
    ok(res, { ...row, date: row.date ? row.date.toISOString().slice(0,10) : '' }, '저장되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.put('/api/pqc/:id', requireLogin, async (req, res) => {
  try {
    const b = req.body;
    const items = arr(b.items);
    const r = await db(
      `UPDATE pqc SET date=$1,product=$2,lot=$3,visual=$4,solid=$5,particle=$6,judge=$7,qty=$8,fail=$9,
       items_json=$10,sign_writer=$11,sign_reviewer=$12,sign_approver=$13 WHERE id=$14 RETURNING *`,
      [txt(b.date),txt(b.product),txt(b.lot),
       txt(b.visual||b.line||''),
       txt(b.solid||b.inspector||b.signWriter?.name||''),
       txt(b.particle||b.shift||''),
       txt(b.judge)||calcJudgeFromItems(items),
       num(b.qty||b.checkQty),num(b.failQty||b.fail)??0,
       JSON.stringify(items),
       JSON.stringify(b.signWriter||null),JSON.stringify(b.signReviewer||null),JSON.stringify(b.signApprover||null),
       req.params.id]
    );
    if (!r.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');
    const row = r.rows[0];
    ok(res, { ...row, date: row.date ? row.date.toISOString().slice(0,10) : '' }, '수정되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.delete('/api/pqc/:id', requireLogin, async (req, res) => {
  try {
    const r = await db('DELETE FROM pqc WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');
    ok(res, null, '삭제되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});

/* ═══ OQC CRUD ═══ */
app.get('/api/oqc', requireLogin, async (_req, res) => {
  try {
    const r = await db('SELECT * FROM oqc ORDER BY created_at DESC');
    ok(res, r.rows.map(row => ({
      id: row.id,
      date: row.date ? row.date.toISOString().slice(0,10) : '',
      customer: row.customer,
      product: row.product,
      lot: row.lot,
      inspector: row.visual,
      qty: row.qty,
      failQty: row.fail,
      judge: row.judge,
      package: row.package,
      items_json: Array.isArray(row.items_json) ? row.items_json : (row.items_json || []),
      sign_writer: row.sign_writer,
      sign_reviewer: row.sign_reviewer,
      sign_approver: row.sign_approver,
    })));
  } catch (err) { fail(res, 500, err.message); }
});
app.post('/api/oqc', requireLogin, async (req, res) => {
  try {
    const b = req.body;
    const items = arr(b.items);
    const r = await db(
      `INSERT INTO oqc (date,customer,product,lot,visual,package,qty,fail,judge,items_json,sign_writer,sign_reviewer,sign_approver)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [txt(b.date),txt(b.customer),txt(b.product),txt(b.lot),
       txt(b.visual||b.inspector||b.signWriter?.name||''),
       txt(b.package||b.remark||''),
       // BUG #04 수정: qty NUMERIC으로 저장
       num(b.qty||b.checkQty)??0,
       num(b.failQty||b.fail)??0,
       txt(b.judge)||calcJudgeFromItems(items),
       JSON.stringify(items),
       JSON.stringify(b.signWriter||null),JSON.stringify(b.signReviewer||null),JSON.stringify(b.signApprover||null)]
    );
    const row = r.rows[0];
    ok(res, { ...row, date: row.date ? row.date.toISOString().slice(0,10) : '' }, '저장되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.put('/api/oqc/:id', requireLogin, async (req, res) => {
  try {
    const b = req.body;
    const items = arr(b.items);
    const r = await db(
      `UPDATE oqc SET date=$1,customer=$2,product=$3,lot=$4,visual=$5,package=$6,qty=$7,fail=$8,judge=$9,
       items_json=$10,sign_writer=$11,sign_reviewer=$12,sign_approver=$13 WHERE id=$14 RETURNING *`,
      [txt(b.date),txt(b.customer),txt(b.product),txt(b.lot),
       txt(b.visual||b.inspector||b.signWriter?.name||''),
       txt(b.package||b.remark||''),
       num(b.qty||b.checkQty)??0,
       num(b.failQty||b.fail)??0,
       txt(b.judge)||calcJudgeFromItems(items),
       JSON.stringify(items),
       JSON.stringify(b.signWriter||null),JSON.stringify(b.signReviewer||null),JSON.stringify(b.signApprover||null),
       req.params.id]
    );
    if (!r.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');
    const row = r.rows[0];
    ok(res, { ...row, date: row.date ? row.date.toISOString().slice(0,10) : '' }, '수정되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.delete('/api/oqc/:id', requireLogin, async (req, res) => {
  try {
    const r = await db('DELETE FROM oqc WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');
    ok(res, null, '삭제되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});

/* ═══ SUPPLIERS CRUD ═══ */
app.get('/api/suppliers', requireLogin, async (_req, res) => {
  try { const r = await db('SELECT * FROM suppliers ORDER BY created_at DESC'); ok(res, r.rows); }
  catch (err) { fail(res, 500, err.message); }
});
app.post('/api/suppliers', requireLogin, async (req, res) => {
  try {
    const b = req.body;
    const r = await db(`INSERT INTO suppliers (name,manager,phone,category,status) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [txt(b.name),txt(b.manager),txt(b.phone),txt(b.category),txt(b.status)]);
    ok(res, r.rows[0], '저장되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.put('/api/suppliers/:id', requireLogin, async (req, res) => {
  try {
    const b = req.body;
    const r = await db(`UPDATE suppliers SET name=$1,manager=$2,phone=$3,category=$4,status=$5 WHERE id=$6 RETURNING *`,
      [txt(b.name),txt(b.manager),txt(b.phone),txt(b.category),txt(b.status),req.params.id]);
    if (!r.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');
    ok(res, r.rows[0], '수정되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.delete('/api/suppliers/:id', requireLogin, async (req, res) => {
  try {
    const r = await db('DELETE FROM suppliers WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');
    ok(res, null, '삭제되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});

/* ═══ NONCONFORM CRUD ═══ */
// BUG #02 수정: nc_date 컬럼명 통일
app.get('/api/nonconform', requireLogin, async (_req, res) => {
  try {
    const r = await db('SELECT * FROM nonconform ORDER BY created_at DESC');
    ok(res, r.rows.map(row => ({
      id: row.id,
      ncDate: row.nc_date ? row.nc_date.toISOString().slice(0,10) : '',
      ncNo: row.nc_no,
      ncType: row.nc_type,
      dept: row.dept,
      lot: row.lot,
      item: row.item,
      qty: row.qty,
      issue: row.issue,
      cause: row.cause,
      action: row.action,
      actionDate: row.action_date ? row.action_date.toISOString().slice(0,10) : '',
      verify: row.verify,
      verifyDate: row.verify_date ? row.verify_date.toISOString().slice(0,10) : '',
      owner: row.owner,
      status: row.status,
      sign_writer: row.sign_writer,
      sign_reviewer: row.sign_reviewer,
      sign_approver: row.sign_approver,
    })));
  } catch (err) { fail(res, 500, err.message); }
});
app.post('/api/nonconform', requireLogin, async (req, res) => {
  try {
    const b = req.body;
    const r = await db(
      `INSERT INTO nonconform (nc_date,nc_no,nc_type,dept,lot,item,qty,issue,cause,action,action_date,verify,verify_date,owner,status,sign_writer,sign_reviewer,sign_approver)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [txt(b.ncDate||b.date),txt(b.ncNo),txt(b.ncType),txt(b.dept),txt(b.lot),txt(b.item),
       num(b.qty)??0,txt(b.issue),txt(b.cause),txt(b.action),
       b.actionDate||null, txt(b.verify), b.verifyDate||null,
       txt(b.owner),txt(b.status)||'미결',
       JSON.stringify(b.signWriter||null),JSON.stringify(b.signReviewer||null),JSON.stringify(b.signApprover||null)]
    );
    const row = r.rows[0];
    ok(res, {
      ...row,
      ncDate: row.nc_date ? row.nc_date.toISOString().slice(0,10) : '',
    }, '저장되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.put('/api/nonconform/:id', requireLogin, async (req, res) => {
  try {
    const b = req.body;
    const r = await db(
      `UPDATE nonconform SET nc_date=$1,nc_no=$2,nc_type=$3,dept=$4,lot=$5,item=$6,qty=$7,issue=$8,cause=$9,action=$10,
       action_date=$11,verify=$12,verify_date=$13,owner=$14,status=$15,sign_writer=$16,sign_reviewer=$17,sign_approver=$18
       WHERE id=$19 RETURNING *`,
      [txt(b.ncDate||b.date),txt(b.ncNo),txt(b.ncType),txt(b.dept),txt(b.lot),txt(b.item),
       num(b.qty)??0,txt(b.issue),txt(b.cause),txt(b.action),
       b.actionDate||null, txt(b.verify), b.verifyDate||null,
       txt(b.owner),txt(b.status)||'미결',
       JSON.stringify(b.signWriter||null),JSON.stringify(b.signReviewer||null),JSON.stringify(b.signApprover||null),
       req.params.id]
    );
    if (!r.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');
    const row = r.rows[0];
    ok(res, {
      ...row,
      ncDate: row.nc_date ? row.nc_date.toISOString().slice(0,10) : '',
    }, '수정되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.delete('/api/nonconform/:id', requireLogin, async (req, res) => {
  try {
    const r = await db('DELETE FROM nonconform WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');
    ok(res, null, '삭제되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});

/* ═══ WORKLOG ═══ */
app.get('/api/worklog', requireLogin, async (_req, res) => {
  try {
    const r = await db('SELECT * FROM worklog ORDER BY created_at DESC');
    const ids = r.rows.map(x => x.id);
    let materials = [], attachments = [];
    if (ids.length) {
      const m = await db('SELECT * FROM worklog_materials WHERE worklog_id=ANY($1::uuid[]) ORDER BY seq ASC', [ids]);
      materials = m.rows;
      try {
        const a = await db('SELECT * FROM worklog_attachments WHERE worklog_id=ANY($1::uuid[]) ORDER BY uploaded_at ASC', [ids]);
        attachments = a.rows;
      } catch(e) {}
    }
    ok(res, r.rows.map(row => ({
      id: row.id,
      workDate: row.work_date ? row.work_date.toISOString().slice(0,10) : '',
      finishedLot: row.finished_lot,
      worker: row.worker,
      planQty: row.plan_qty,
      prodQty: row.prod_qty,
      failQty: row.fail_qty,
      remark: row.remark,
      flowSet: row.flow_set, flowActual: row.flow_actual,
      tempSet: row.temp_set, tempActual: row.temp_actual,
      pressSet: row.press_set, pressActual: row.press_actual,
      materials: materials.filter(m => m.worklog_id === row.id).map(m => ({
        seq: m.seq, material: m.material, supName: m.sup_name,
        lotNo: m.lot_no, inputQty: m.input_qty, inputTime: m.input_time,
      })),
      attachments: attachments.filter(a => a.worklog_id === row.id).map(a => ({
        id: a.id, filename: a.filename, originalName: a.original_name, fileSize: a.file_size,
      })),
    })));
  } catch (err) { fail(res, 500, err.message); }
});

app.post('/api/worklog', requireLogin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const b = req.body || {};
    const inserted = await client.query(
      `INSERT INTO worklog (work_date,finished_lot,worker,plan_qty,prod_qty,fail_qty,remark,flow_set,flow_actual,temp_set,temp_actual,press_set,press_actual)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [txt(b.workDate),txt(b.finishedLot),txt(b.worker),txt(b.planQty),txt(b.prodQty),txt(b.failQty),
       txt(b.remark),txt(b.flowSet),txt(b.flowActual),txt(b.tempSet),txt(b.tempActual),txt(b.pressSet),txt(b.pressActual)]
    );
    const worklogId = inserted.rows[0].id;
    for (let i = 0; i < arr(b.materials).length; i++) {
      const m = b.materials[i];
      await client.query(
        `INSERT INTO worklog_materials (worklog_id,seq,material,sup_name,lot_no,input_qty,input_time) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [worklogId,i+1,txt(m.material),txt(m.supName),txt(m.lotNo),txt(m.inputQty),txt(m.inputTime)]
      );
    }
    await client.query('COMMIT');
    ok(res, { id: worklogId }, '작업일지가 저장되었습니다.');
  } catch (err) {
    await client.query('ROLLBACK');
    fail(res, 500, err.message);
  } finally { client.release(); }
});

app.put('/api/worklog/:id', requireLogin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const b = req.body || {};
    const updated = await client.query(
      `UPDATE worklog SET work_date=$1,finished_lot=$2,worker=$3,plan_qty=$4,prod_qty=$5,fail_qty=$6,
       remark=$7,flow_set=$8,flow_actual=$9,temp_set=$10,temp_actual=$11,press_set=$12,press_actual=$13 WHERE id=$14 RETURNING id`,
      [txt(b.workDate),txt(b.finishedLot),txt(b.worker),txt(b.planQty),txt(b.prodQty),txt(b.failQty),
       txt(b.remark),txt(b.flowSet),txt(b.flowActual),txt(b.tempSet),txt(b.tempActual),txt(b.pressSet),txt(b.pressActual),
       req.params.id]
    );
    if (!updated.rowCount) { await client.query('ROLLBACK'); return fail(res, 404, '작업일지를 찾을 수 없습니다.'); }
    await client.query('DELETE FROM worklog_materials WHERE worklog_id=$1', [req.params.id]);
    for (let i = 0; i < arr(b.materials).length; i++) {
      const m = b.materials[i];
      await client.query(
        `INSERT INTO worklog_materials (worklog_id,seq,material,sup_name,lot_no,input_qty,input_time) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [req.params.id,i+1,txt(m.material),txt(m.supName),txt(m.lotNo),txt(m.inputQty),txt(m.inputTime)]
      );
    }
    await client.query('COMMIT');
    ok(res, { id: req.params.id }, '작업일지가 수정되었습니다.');
  } catch (err) {
    await client.query('ROLLBACK');
    fail(res, 500, err.message);
  } finally { client.release(); }
});

app.delete('/api/worklog/:id', requireLogin, async (req, res) => {
  try {
    const r = await db('DELETE FROM worklog WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rowCount) return fail(res, 404, '작업일지를 찾을 수 없습니다.');
    ok(res, null, '작업일지가 삭제되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});

/* ═══ 파일 업로드 ═══ */
app.post('/api/worklog/:id/upload', requireLogin, upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files || [];
    for (const f of files) {
      await db(
        `INSERT INTO worklog_attachments (worklog_id,filename,original_name,file_size) VALUES ($1,$2,$3,$4)`,
        [req.params.id, f.filename, Buffer.from(f.originalname,'latin1').toString('utf8'), f.size]
      );
    }
    ok(res, files.map(f => ({
      filename: f.filename,
      originalName: Buffer.from(f.originalname,'latin1').toString('utf8'),
      fileSize: f.size,
    })), '업로드 완료');
  } catch (err) { fail(res, 500, err.message); }
});

app.delete('/api/worklog/attachment/:id', requireLogin, async (req, res) => {
  try {
    const r = await db('DELETE FROM worklog_attachments WHERE id=$1 RETURNING filename', [req.params.id]);
    if (!r.rowCount) return fail(res, 404, '파일을 찾을 수 없습니다.');
    const fp = path.join(uploadDir, r.rows[0].filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    ok(res, null, '삭제되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});

/* ═══ 성적서 ═══ */
app.post('/api/certificate', requireLogin, async (req, res) => {
  try {
    const b = req.body || {};
    const items = arr(b.items);
    const r = await db(
      `INSERT INTO certificates (cert_type,date,lot,inspector,item,company,incoming_qty,check_qty,fail_qty,judge,remark,items_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [txt(b.type),txt(b.date),txt(b.lot),txt(b.inspector),txt(b.item),txt(b.company),
       txt(b.incomingQty),txt(b.checkQty),txt(b.failQty),
       txt(b.judge)||calcJudgeFromItems(items),txt(b.remark),JSON.stringify(items)]
    );
    ok(res, r.rows[0], '성적서가 저장되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.get('/api/certificate/:type/:id', requireLogin, async (req, res) => {
  try {
    const r = await db('SELECT * FROM certificates WHERE cert_type=$1 AND id=$2',[req.params.type,req.params.id]);
    if (!r.rowCount) return fail(res, 404, '성적서를 찾을 수 없습니다.');
    ok(res, r.rows[0]);
  } catch (err) { fail(res, 500, err.message); }
});

/* ═══ LOT 추적 ═══ */
app.get('/api/trace', requireLogin, async (req, res) => {
  try {
    const keyword = `%${txt(req.query.keyword).toLowerCase()}%`;
    const r = await db(
      `SELECT w.work_date,w.finished_lot,w.worker,m.seq,m.material,m.sup_name,m.lot_no,m.input_qty,m.input_time
       FROM worklog w LEFT JOIN worklog_materials m ON w.id=m.worklog_id
       WHERE LOWER(w.finished_lot) LIKE $1 OR LOWER(m.lot_no) LIKE $1 OR LOWER(m.material) LIKE $1
       ORDER BY w.work_date DESC, m.seq ASC`, [keyword]
    );
    ok(res, r.rows.map(x => ({
      workDate: x.work_date ? x.work_date.toISOString().slice(0,10) : '',
      finishedLot: x.finished_lot, worker: x.worker,
      seq: x.seq, material: x.material, supName: x.sup_name,
      lotNo: x.lot_no, inputQty: x.input_qty, inputTime: x.input_time,
    })));
  } catch (err) { fail(res, 500, err.message); }
});

/* ═══ 관리자 ═══ */
app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    const r = await db('SELECT id,name,email,department,title,role,status,created_at FROM users ORDER BY created_at DESC');
    ok(res, r.rows);
  } catch (err) { fail(res, 500, err.message); }
});
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    const name=txt(b.name), email=txt(b.email).toLowerCase();
    if (!name||!email) return fail(res, 400, '성명과 이메일은 필수입니다.');
    const exists = await db('SELECT id FROM users WHERE email=$1',[email]);
    if (exists.rowCount) return fail(res, 409, '이미 사용 중인 이메일입니다.');
    const hash = await bcrypt.hash(txt(b.password)||'1234', 10);
    const r = await db(
      `INSERT INTO users (name,email,password_hash,department,title,role,status) VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id,name,email,department,title,role,status,created_at`,
      [name,email,hash,txt(b.department),txt(b.title),txt(b.role)||'user',txt(b.status)||'APPROVED']
    );
    ok(res, r.rows[0], '회원이 추가되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    const name=txt(b.name), email=txt(b.email).toLowerCase();
    if (!name||!email) return fail(res, 400, '성명과 이메일은 필수입니다.');
    const dup = await db('SELECT id FROM users WHERE email=$1 AND id<>$2',[email,req.params.id]);
    if (dup.rowCount) return fail(res, 409, '이미 사용 중인 이메일입니다.');
    let updateSql = `UPDATE users SET name=$1,email=$2,department=$3,title=$4,role=$5,status=$6 WHERE id=$7
       RETURNING id,name,email,department,title,role,status,created_at`;
    let params = [name,email,txt(b.department),txt(b.title),txt(b.role)||'user',txt(b.status)||'APPROVED',req.params.id];
    // 비밀번호 변경 요청 시
    if (txt(b.password)) {
      const hash = await bcrypt.hash(txt(b.password), 10);
      updateSql = `UPDATE users SET name=$1,email=$2,department=$3,title=$4,role=$5,status=$6,password_hash=$7 WHERE id=$8
         RETURNING id,name,email,department,title,role,status,created_at`;
      params = [name,email,txt(b.department),txt(b.title),txt(b.role)||'user',txt(b.status)||'APPROVED',hash,req.params.id];
    }
    const r = await db(updateSql, params);
    if (!r.rowCount) return fail(res, 404, '회원을 찾을 수 없습니다.');
    if (req.session.user?.id === req.params.id) {
      req.session.user = { ...req.session.user, name, email, department: txt(b.department), title: txt(b.title), role: txt(b.role), status: txt(b.status) };
    }
    ok(res, r.rows[0], '회원정보가 수정되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});
app.post('/api/admin/users/:id/approve', requireAdmin, async (req, res) => {
  try { await db(`UPDATE users SET status='APPROVED' WHERE id=$1`,[req.params.id]); ok(res, null, '승인되었습니다.'); }
  catch (err) { fail(res, 500, err.message); }
});
app.post('/api/admin/users/:id/reject', requireAdmin, async (req, res) => {
  try { await db(`UPDATE users SET status='REJECTED' WHERE id=$1`,[req.params.id]); ok(res, null, '반려되었습니다.'); }
  catch (err) { fail(res, 500, err.message); }
});
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try { await db('DELETE FROM users WHERE id=$1',[req.params.id]); ok(res, null, '회원이 삭제되었습니다.'); }
  catch (err) { fail(res, 500, err.message); }
});
app.post('/api/admin/delete-all', requireAdmin, async (req, res) => {
  if (txt(req.body.confirm) !== 'DELETE') return fail(res, 400, '확인 문자열이 일치하지 않습니다.');
  try {
    await db(`TRUNCATE TABLE certificates,worklog_attachments,worklog_materials,worklog,nonconform,suppliers,oqc,pqc,iqc RESTART IDENTITY CASCADE`);
    ok(res, null, '전체 데이터가 삭제되었습니다.');
  } catch (err) { fail(res, 500, err.message); }
});

/* ═══ 백업 ═══ */
app.get('/api/backup', requireLogin, async (_req, res) => {
  try {
    const [iqc,pqc,oqc,sup,nc,wlog,cert] = await Promise.all([
      db('SELECT * FROM iqc ORDER BY created_at DESC'),
      db('SELECT * FROM pqc ORDER BY created_at DESC'),
      db('SELECT * FROM oqc ORDER BY created_at DESC'),
      db('SELECT * FROM suppliers ORDER BY created_at DESC'),
      db('SELECT * FROM nonconform ORDER BY created_at DESC'),
      db('SELECT * FROM worklog ORDER BY created_at DESC'),
      db('SELECT * FROM certificates ORDER BY created_at DESC'),
    ]);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="qms-backup.json"');
    res.send(JSON.stringify({ iqc:iqc.rows,pqc:pqc.rows,oqc:oqc.rows,suppliers:sup.rows,nonconform:nc.rows,worklog:wlog.rows,certificates:cert.rows }, null, 2));
  } catch (err) { fail(res, 500, err.message); }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureSchema()
  .then(async () => {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@namochemical.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234!';
    const existing = await db('SELECT id FROM users WHERE email=$1', [adminEmail]);
    const hash = await bcrypt.hash(adminPassword, 10);
    if (!existing.rowCount) {
      await db(`INSERT INTO users (name,email,password_hash,department,title,role,status) VALUES ($1,$2,$3,$4,$5,'admin','APPROVED')`,
        ['관리자', adminEmail, hash, '관리부', '관리자']);
    } else {
      await db(`UPDATE users SET password_hash=$1,name=$2,department=$3,title=$4,role='admin',status='APPROVED' WHERE email=$5`,
        [hash, '관리자', '관리부', '관리자', adminEmail]);
    }
    app.listen(port, () => console.log(`QMS server listening on ${port} (Asia/Seoul)`));
  })
  .catch(err => { console.error('Schema initialization failed:', err); process.exit(1); });
