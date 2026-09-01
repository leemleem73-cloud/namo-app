process.env.TZ = 'Asia/Seoul';

const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

class PostgresSessionStore extends session.Store {
  constructor(dbPool) {
    super();
    this.dbPool = dbPool;
  }

  get(sid, callback) {
    this.dbPool
      .query('SELECT sess FROM qmes_sessions WHERE sid = $1 AND expire > NOW()', [sid])
      .then(result => callback(null, result.rows[0]?.sess || null))
      .catch(callback);
  }

  set(sid, sess, callback = () => {}) {
    const expire = sess?.cookie?.expires
      ? new Date(sess.cookie.expires)
      : new Date(Date.now() + 1000 * 60 * 60 * 8);
    this.dbPool
      .query(
        `INSERT INTO qmes_sessions (sid, sess, expire)
         VALUES ($1,$2::jsonb,$3)
         ON CONFLICT (sid)
         DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire`,
        [sid, JSON.stringify(sess), expire]
      )
      .then(() => callback(null))
      .catch(callback);
  }

  destroy(sid, callback = () => {}) {
    this.dbPool
      .query('DELETE FROM qmes_sessions WHERE sid = $1', [sid])
      .then(() => callback(null))
      .catch(callback);
  }

  touch(sid, sess, callback = () => {}) {
    const expire = sess?.cookie?.expires
      ? new Date(sess.cookie.expires)
      : new Date(Date.now() + 1000 * 60 * 60 * 8);
    this.dbPool
      .query('UPDATE qmes_sessions SET expire = $1 WHERE sid = $2', [expire, sid])
      .then(() => callback(null))
      .catch(callback);
  }
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store: new PostgresSessionStore(pool),
    secret: process.env.SESSION_SECRET || require('crypto').randomBytes(48).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

// Register PostgreSQL inventory APIs even when production starts with `node server.js` directly.
require('./inventory-server').installInventoryRoutes(app);

app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html' || /\.(?:js|jsx|html)$/.test(req.path)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

function ok(res, data = null, message = 'OK') {
  return res.json({ success: true, message, data });
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, message, data: null });
}

function txt(v) {
  return (v ?? '').toString().trim();
}

function num(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function arr(v) {
  return Array.isArray(v) ? v : [];
}

function sign(v) {
  return JSON.stringify(v || {});
}

async function db(sql, params = []) {
  return pool.query(sql, params);
}


function jsonObj(v, fallback = {}) {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch (_err) {
    return fallback;
  }
}

async function auditLog(req, action, targetTable, targetId, beforeData = null, afterData = null) {
  try {
    const user = req.session?.user || {};
    await db(
      `INSERT INTO audit_logs
       (user_id, user_name, user_email, action, target_table, target_id, before_data, after_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        user.id || null,
        user.name || '',
        user.email || '',
        action,
        targetTable,
        targetId ? String(targetId) : '',
        beforeData ? JSON.stringify(beforeData) : null,
        afterData ? JSON.stringify(afterData) : null,
      ]
    );
  } catch (err) {
    console.warn('auditLog failed:', err.message);
  }
}

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
    id: user.id,
    uid: user.uid || '',
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    title: user.title || '',
    status: user.status,
    mustChangePassword: Boolean(user.must_change_password),
  };
}

function calcJudgeFromItems(items = []) {
  const rows = arr(items);
  if (!rows.length) return '합격';
  if (rows.some((x) => txt(x.judge) === '불합격')) return '불합격';
  if (rows.some((x) => txt(x.judge) === '보류')) return '보류';
  return '합격';
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
      must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS qmes_sessions (
      sid TEXT PRIMARY KEY,
      sess JSONB NOT NULL,
      expire TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS qmes_sessions_expire_idx
      ON qmes_sessions (expire);

    DELETE FROM qmes_sessions WHERE expire <= NOW();

    CREATE TABLE IF NOT EXISTS qmes_sync_records (
      record_type TEXT NOT NULL,
      record_key TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_by TEXT DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (record_type, record_key)
    );

    CREATE INDEX IF NOT EXISTS qmes_sync_records_type_updated_idx
      ON qmes_sync_records (record_type, updated_at DESC);

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      purchase_no TEXT UNIQUE NOT NULL,
      purchase_type TEXT NOT NULL DEFAULT '정기발주',
      production_type TEXT NOT NULL DEFAULT 'D-양산',
      supplier TEXT NOT NULL,
      supplier_grade TEXT DEFAULT '',
      item TEXT NOT NULL,
      item_code TEXT DEFAULT '',
      spec TEXT DEFAULT '',
      qty NUMERIC NOT NULL CHECK (qty >= 0),
      unit TEXT NOT NULL DEFAULT 'kg',
      unit_price NUMERIC NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
      amount NUMERIC NOT NULL DEFAULT 0 CHECK (amount >= 0),
      order_date DATE NOT NULL DEFAULT CURRENT_DATE,
      requested_due_date DATE,
      confirmed_due_date DATE,
      priority TEXT NOT NULL DEFAULT '일반',
      mrp_no TEXT DEFAULT '',
      work_order_no TEXT DEFAULT '',
      purpose TEXT DEFAULT '',
      warehouse TEXT DEFAULT '',
      delivery_address TEXT DEFAULT '',
      payment_terms TEXT DEFAULT '',
      approval_status TEXT NOT NULL DEFAULT '구매검토',
      receipt_status TEXT NOT NULL DEFAULT '미입고',
      received_qty NUMERIC NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
      receipt_date DATE,
      material_lot TEXT DEFAULT '',
      iqc_required BOOLEAN NOT NULL DEFAULT TRUE,
      iqc_status TEXT NOT NULL DEFAULT '계획 대기',
      coa_required BOOLEAN NOT NULL DEFAULT TRUE,
      msds_required BOOLEAN NOT NULL DEFAULT FALSE,
      lot_required BOOLEAN NOT NULL DEFAULT TRUE,
      status TEXT NOT NULL DEFAULT '결재대기',
      requester TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      updated_by TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (received_qty <= qty)
    );

    CREATE INDEX IF NOT EXISTS purchase_orders_order_date_idx
      ON purchase_orders (order_date DESC, created_at DESC);
    CREATE INDEX IF NOT EXISTS purchase_orders_supplier_idx
      ON purchase_orders (supplier, created_at DESC);
    CREATE INDEX IF NOT EXISTS purchase_orders_due_idx
      ON purchase_orders (requested_due_date, status);

    CREATE TABLE IF NOT EXISTS purchase_receipts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
      qty NUMERIC NOT NULL CHECK (qty > 0),
      material_lot TEXT DEFAULT '',
      expiry_date DATE,
      iqc_status TEXT NOT NULL DEFAULT '검사 대기',
      note TEXT DEFAULT '',
      created_by TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS purchase_receipts_order_idx
      ON purchase_receipts (purchase_order_id, receipt_date DESC, created_at DESC);

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
      packaging_type TEXT DEFAULT '',
      packaging_type_other TEXT DEFAULT '',
      package_qty INTEGER,
      unit_weight NUMERIC,
      calculated_weight NUMERIC,
      barcode_qty INTEGER,
      items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      sign_writer JSONB DEFAULT '{}'::jsonb,
      sign_reviewer JSONB DEFAULT '{}'::jsonb,
      sign_approver JSONB DEFAULT '{}'::jsonb,
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
      sign_writer JSONB DEFAULT '{}'::jsonb,
      sign_reviewer JSONB DEFAULT '{}'::jsonb,
      sign_approver JSONB DEFAULT '{}'::jsonb,
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
      qty TEXT DEFAULT '',
      fail NUMERIC DEFAULT 0,
      judge TEXT DEFAULT '',
      items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      sign_writer JSONB DEFAULT '{}'::jsonb,
      sign_reviewer JSONB DEFAULT '{}'::jsonb,
      sign_approver JSONB DEFAULT '{}'::jsonb,
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
      date DATE NOT NULL,
      type TEXT NOT NULL,
      lot TEXT DEFAULT '',
      item TEXT DEFAULT '',
      issue TEXT DEFAULT '',
      cause TEXT DEFAULT '',
      action TEXT DEFAULT '',
      owner TEXT DEFAULT '',
      status TEXT DEFAULT '',
      sign_writer JSONB DEFAULT '{}'::jsonb,
      sign_reviewer JSONB DEFAULT '{}'::jsonb,
      sign_approver JSONB DEFAULT '{}'::jsonb,
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
      sign_writer JSONB DEFAULT '{}'::jsonb,
      sign_reviewer JSONB DEFAULT '{}'::jsonb,
      sign_approver JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS training_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      report_no TEXT DEFAULT '',
      type TEXT DEFAULT '',
      title TEXT NOT NULL,
      place TEXT DEFAULT '',
      instructor TEXT DEFAULT '',
      dept TEXT DEFAULT '',
      hours TEXT DEFAULT '',
      attendees TEXT DEFAULT '',
      absentees TEXT DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      eval_method TEXT DEFAULT '',
      result TEXT DEFAULT '완료',
      remark TEXT DEFAULT '',
      photos JSONB NOT NULL DEFAULT '[]'::jsonb,
      sign_writer JSONB DEFAULT '{}'::jsonb,
      sign_reviewer JSONB DEFAULT '{}'::jsonb,
      sign_approver JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS instruments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      no TEXT NOT NULL,
      name TEXT NOT NULL,
      model TEXT DEFAULT '',
      maker TEXT DEFAULT '',
      location TEXT DEFAULT '',
      cycle TEXT DEFAULT '12',
      last_cal DATE,
      next_cal DATE,
      status TEXT DEFAULT '정상',
      remark TEXT DEFAULT '',
      photo TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS namo_talk_messages (
      id BIGSERIAL PRIMARY KEY,
      room_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_uid TEXT DEFAULT '',
      sender_dept TEXT DEFAULT '',
      message_kind TEXT NOT NULL DEFAULT 'text',
      message_text TEXT DEFAULT '',
      file_name TEXT,
      file_type TEXT,
      file_data TEXT,
      reply_to_id BIGINT,
      reply_sender TEXT DEFAULT '',
      reply_text TEXT DEFAULT '',
      pinned BOOLEAN NOT NULL DEFAULT FALSE,
      edited_at TIMESTAMPTZ,
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS namo_talk_messages_room_created_idx
      ON namo_talk_messages (room_id, created_at);

    CREATE TABLE IF NOT EXISTS namo_talk_reads (
      room_id TEXT NOT NULL,
      user_uid TEXT NOT NULL,
      user_name TEXT NOT NULL,
      last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (room_id, user_uid)
    );

    CREATE INDEX IF NOT EXISTS namo_talk_reads_room_idx
      ON namo_talk_reads (room_id, last_read_at);

    CREATE TABLE IF NOT EXISTS namo_talk_presence (
      user_name TEXT PRIMARY KEY,
      department TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'online',
      status_message TEXT DEFAULT '',
      last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS namo_talk_profiles (
      user_name TEXT PRIMARY KEY,
      avatar_type TEXT NOT NULL DEFAULT 'preset',
      avatar_value TEXT NOT NULL DEFAULT 'drop-blue',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );


    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      user_name TEXT DEFAULT '',
      user_email TEXT DEFAULT '',
      action TEXT NOT NULL,
      target_table TEXT NOT NULL,
      target_id TEXT DEFAULT '',
      before_data JSONB,
      after_data JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS supplier_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID,
      supplier_name TEXT DEFAULT '',
      score_month TEXT NOT NULL,
      quality_score NUMERIC DEFAULT 0,
      delivery_score NUMERIC DEFAULT 0,
      response_score NUMERIC DEFAULT 0,
      defect_rate NUMERIC DEFAULT 0,
      ncr_count INTEGER DEFAULT 0,
      capa_delay_count INTEGER DEFAULT 0,
      total_score NUMERIC DEFAULT 0,
      grade TEXT DEFAULT 'C',
      remark TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS equipments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      no TEXT NOT NULL,
      name TEXT NOT NULL,
      maker TEXT DEFAULT '',
      model TEXT DEFAULT '',
      location TEXT DEFAULT '',
      pm_cycle TEXT DEFAULT '월간',
      last_pm DATE,
      next_pm DATE,
      status TEXT DEFAULT '정상',
      remark TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db(`
    ALTER TABLE users ALTER COLUMN status SET DEFAULT 'APPROVED';

    ALTER TABLE purchase_orders ALTER COLUMN requested_due_date DROP NOT NULL;
    ALTER TABLE purchase_orders ALTER COLUMN warehouse SET DEFAULT '';
    ALTER TABLE purchase_orders ALTER COLUMN delivery_address SET DEFAULT '';
    ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_qty_check;
    ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_qty_nonnegative_check;
    ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_qty_nonnegative_check CHECK (qty >= 0);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS uid TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

    CREATE UNIQUE INDEX IF NOT EXISTS users_uid_unique_idx
      ON users (uid) WHERE uid IS NOT NULL AND uid <> '';

    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS items_json JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS sign_writer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS sign_reviewer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS sign_approver JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS packaging_type TEXT DEFAULT '';
    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS packaging_type_other TEXT DEFAULT '';
    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS package_qty INTEGER;
    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS unit_weight NUMERIC;
    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS calculated_weight NUMERIC;
    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS barcode_qty INTEGER;

    ALTER TABLE pqc ADD COLUMN IF NOT EXISTS items_json JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE pqc ADD COLUMN IF NOT EXISTS sign_writer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE pqc ADD COLUMN IF NOT EXISTS sign_reviewer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE pqc ADD COLUMN IF NOT EXISTS sign_approver JSONB DEFAULT '{}'::jsonb;

    ALTER TABLE oqc ADD COLUMN IF NOT EXISTS items_json JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE oqc ADD COLUMN IF NOT EXISTS package TEXT DEFAULT '';
    ALTER TABLE oqc ADD COLUMN IF NOT EXISTS sign_writer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE oqc ADD COLUMN IF NOT EXISTS sign_reviewer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE oqc ADD COLUMN IF NOT EXISTS sign_approver JSONB DEFAULT '{}'::jsonb;

    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS sign_writer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS sign_reviewer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS sign_approver JSONB DEFAULT '{}'::jsonb;

    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS nc_no TEXT DEFAULT '';
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS dept TEXT DEFAULT '';
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS qty NUMERIC DEFAULT 0;
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT '';
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT '';
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS action_date DATE;
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS verify TEXT DEFAULT '';
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS verify_date DATE;
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS capa_status TEXT DEFAULT 'OPEN';
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS containment TEXT DEFAULT '';
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS impact_scope TEXT DEFAULT '';
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS correction TEXT DEFAULT '';
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS preventive_action TEXT DEFAULT '';
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS verification_result TEXT DEFAULT '';
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS due_date DATE;
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS progress NUMERIC DEFAULT 0;
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS photos JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS why_json JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS fishbone_json JSONB NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE nonconform ADD COLUMN IF NOT EXISTS capa_actions JSONB NOT NULL DEFAULT '[]'::jsonb;

    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS sign_writer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS sign_reviewer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS sign_approver JSONB DEFAULT '{}'::jsonb;

    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS sender_uid TEXT DEFAULT '';
    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS sender_dept TEXT DEFAULT '';
    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS message_kind TEXT NOT NULL DEFAULT 'text';
    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS message_text TEXT DEFAULT '';
    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS file_name TEXT;
    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS file_type TEXT;
    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS file_data TEXT;
    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS reply_to_id BIGINT;
    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS reply_sender TEXT DEFAULT '';
    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS reply_text TEXT DEFAULT '';
    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

    ALTER TABLE namo_talk_reads ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT '';
    ALTER TABLE namo_talk_reads ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
}

app.get('/api/test-db', async (_req, res) => {
  try {
    const r = await db(`
      SELECT
        NOW() AS db_now,
        NOW() AT TIME ZONE 'Asia/Seoul' AS korea_now
    `);
    ok(res, r.rows[0], 'DB 연결 성공');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const name = txt(req.body.name);
    const email = txt(req.body.email).toLowerCase();
    const password = txt(req.body.password);
    const department = txt(req.body.department);
    const title = txt(req.body.title);

    if (!name || !email || !password) {
      return fail(res, 400, '성명, 이메일, 비밀번호는 필수입니다.');
    }

    const exists = await db('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rowCount) return fail(res, 409, '이미 사용 중인 이메일입니다.');

    const hash = await bcrypt.hash(password, 10);

    await db(
      `INSERT INTO users (name, email, password_hash, department, title, role, status)
       VALUES ($1, $2, $3, $4, $5, 'user', 'APPROVED')`,
      [name, email, hash, department, title]
    );

    ok(res, null, '회원가입이 완료되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const loginId = txt(req.body.loginId || req.body.email);
    const password = txt(req.body.password);

    if (!loginId || !password) {
      return fail(res, 400, '아이디와 비밀번호를 입력해 주세요.');
    }

    const r = await db(
      `SELECT *
       FROM users
       WHERE LOWER(email) = LOWER($1)
          OR LOWER(name) = LOWER($1)
          OR LOWER(COALESCE(uid, '')) = LOWER($1)
       LIMIT 1`,
      [loginId]
    );
    if (!r.rowCount) return fail(res, 401, '아이디 또는 비밀번호가 올바르지 않습니다.');

    const user = r.rows[0];
    const matched = await bcrypt.compare(password, user.password_hash);
    if (!matched) return fail(res, 401, '아이디 또는 비밀번호가 올바르지 않습니다.');
    if (user.status !== 'APPROVED') return fail(res, 403, '승인된 계정만 로그인할 수 있습니다.');

    // 새 로그인은 기존/손상된 세션 ID를 재사용하지 않고 새 세션으로 교체합니다.
    await new Promise((resolve, reject) => {
      req.session.regenerate((sessionError) => {
        if (sessionError) reject(sessionError);
        else resolve();
      });
    });

    req.session.user = buildSessionUser(user);

    // 로그인 응답 전에 PostgreSQL 세션 저장을 끝내 다른 PC의 즉시 401을 방지합니다.
    await new Promise((resolve, reject) => {
      req.session.save((sessionError) => {
        if (sessionError) reject(sessionError);
        else resolve();
      });
    });

    return ok(res, { user: req.session.user }, '로그인 성공');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => ok(res, null, '로그아웃 완료'));
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return fail(res, 401, '로그인이 필요합니다.');
  ok(res, req.session.user);
});

app.put('/api/auth/password', requireLogin, async (req, res) => {
  try {
    const currentPassword = txt(req.body.currentPassword);
    const newPassword = txt(req.body.newPassword);
    if (!currentPassword || newPassword.length < 4) {
      return fail(res, 400, '현재 비밀번호와 4자 이상의 새 비밀번호를 입력해 주세요.');
    }

    const r = await db('SELECT password_hash FROM users WHERE id = $1', [req.session.user.id]);
    if (!r.rowCount) return fail(res, 404, '사용자 정보를 찾을 수 없습니다.');

    const matched = await bcrypt.compare(currentPassword, r.rows[0].password_hash);
    if (!matched) return fail(res, 401, '현재 비밀번호가 일치하지 않습니다.');

    const hash = await bcrypt.hash(newPassword, 10);
    await db(
      'UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2',
      [hash, req.session.user.id]
    );
    req.session.user.mustChangePassword = false;
    ok(res, null, '비밀번호가 변경되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get('/api/users/signable', requireLogin, async (_req, res) => {
  try {
    const r = await db(`
      SELECT id, name, email, department, title, role, status
      FROM users
      WHERE status = 'APPROVED'
      ORDER BY name ASC, created_at DESC
    `);
    ok(res, r.rows);
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/auth/change-password', requireLogin, async (req, res) => {
  try {
    const currentPassword = txt(req.body.currentPassword);
    const newPassword = txt(req.body.newPassword);

    if (!currentPassword || !newPassword) {
      return fail(res, 400, '현재 비밀번호와 새 비밀번호를 입력하세요.');
    }

    const r = await db('SELECT * FROM users WHERE id = $1', [req.session.user.id]);
    if (!r.rowCount) return fail(res, 404, '사용자를 찾을 수 없습니다.');

    const user = r.rows[0];
    const matched = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matched) return fail(res, 400, '현재 비밀번호가 올바르지 않습니다.');

    const hash = await bcrypt.hash(newPassword, 10);
    await db('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);

    ok(res, null, '비밀번호가 변경되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const name = txt(req.body.name);
    const email = txt(req.body.email).toLowerCase();
    const department = txt(req.body.department);
    const newPassword = txt(req.body.newPassword);

    if (!name || !email || !department || !newPassword) {
      return fail(res, 400, '성명, 이메일, 부서명, 새 비밀번호를 입력하세요.');
    }

    const r = await db(
      'SELECT * FROM users WHERE name = $1 AND email = $2 AND department = $3',
      [name, email, department]
    );

    if (!r.rowCount) return fail(res, 404, '일치하는 사용자를 찾을 수 없습니다.');

    const hash = await bcrypt.hash(newPassword, 10);
    await db('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, r.rows[0].id]);

    ok(res, null, '비밀번호가 초기화되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

const PURCHASE_PRODUCTION_TYPES = new Set(['D-양산', 'C-Pilot', 'B-Lab']);

function purchaseValue(source, keys, fallback = '') {
  for (const key of keys) {
    if (source && Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      return source[key];
    }
  }
  return fallback;
}

function purchaseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return !['false', '0', 'no', 'n', '아니오'].includes(txt(value).toLowerCase());
}

function normalizePurchaseProductionType(value) {
  const raw = txt(value);
  if (PURCHASE_PRODUCTION_TYPES.has(raw)) return raw;
  if (/^(d|mass|양산)$/i.test(raw)) return 'D-양산';
  if (/^(c|pilot|파일럿|개발)$/i.test(raw)) return 'C-Pilot';
  if (/^(b|lab|랩|샘플)$/i.test(raw)) return 'B-Lab';
  return 'D-양산';
}

function purchaseDate(value, fallback = '') {
  const raw = txt(value || fallback);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw.slice(0, 10)) ? raw.slice(0, 10) : '';
}

function derivePurchaseStatus(row) {
  const manual = txt(row.status);
  const approval = txt(row.approval_status ?? row.approvalStatus ?? row.approval);
  const receipt = txt(row.receipt_status ?? row.receiptStatus ?? row.receiving);
  const iqc = txt(row.iqc_status ?? row.iqcStatus ?? row.iqc);
  const ordered = Number(row.qty || 0);
  const received = Number(row.received_qty ?? row.receivedQty ?? row.received ?? 0);

  if (/취소/.test(manual)) return '발주취소';
  if (/불합격|부적합|FAIL|NG|REJECT/i.test(iqc)) return 'IQC 부적합';
  if (/입고\s*완료/.test(receipt) && ordered <= 0) return '입고완료';
  if (received > 0 && received < ordered) return '부분입고';
  if (ordered > 0 && received >= ordered) {
    if (purchaseBoolean(row.iqc_required ?? row.iqcRequired, true) && !/합격|적합|PASS|OK/i.test(iqc)) {
      return 'IQC대기';
    }
    return '입고완료';
  }
  if (/미승인|검토|대기/.test(approval) && !/승인완료|발주확정/.test(approval)) {
    return '결재대기';
  }

  const due = purchaseDate(
    row.confirmed_due_date ?? row.confirmedDueDate ?? row.expected ?? row.expectedDate
      ?? row.requested_due_date ?? row.requestedDueDate ?? row.due ?? row.dueDate
  );
  if (due && !/입고완료/.test(receipt)) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${due}T00:00:00`);
    const days = Math.round((target.getTime() - today.getTime()) / 86400000);
    if (days < 0) return '입고지연';
    if (days <= 2 || /긴급|최우선/.test(txt(row.priority))) return '납기임박';
  }
  return '발주확정';
}

function mapPurchaseOrder(row, receipts = undefined) {
  const mapped = {
    id: row.purchase_no,
    uuid: row.id,
    purchaseNo: row.purchase_no,
    no: row.purchase_no,
    purchaseType: row.purchase_type,
    type: row.purchase_type,
    productionType: row.production_type,
    supplier: row.supplier,
    supplierGrade: row.supplier_grade,
    grade: row.supplier_grade,
    item: row.item,
    material: row.item,
    itemCode: row.item_code,
    spec: row.spec || row.item_code,
    qty: Number(row.qty || 0),
    unit: row.unit,
    unitPrice: Number(row.unit_price || 0),
    price: Number(row.unit_price || 0),
    amount: Number(row.amount || 0),
    orderDate: purchaseDate(row.order_date),
    requestedDueDate: purchaseDate(row.requested_due_date),
    due: purchaseDate(row.requested_due_date),
    confirmedDueDate: purchaseDate(row.confirmed_due_date),
    expected: purchaseDate(row.confirmed_due_date),
    priority: row.priority,
    mrpNo: row.mrp_no,
    mrp: row.mrp_no,
    workOrderNo: row.work_order_no,
    purpose: row.purpose,
    warehouse: row.warehouse,
    deliveryAddress: row.delivery_address,
    paymentTerms: row.payment_terms,
    terms: row.payment_terms,
    approvalStatus: row.approval_status,
    approval: row.approval_status,
    receiptStatus: row.receipt_status,
    receiving: row.receipt_status,
    receivedQty: Number(row.received_qty || 0),
    received: Number(row.received_qty || 0),
    receiptDate: purchaseDate(row.receipt_date),
    materialLot: row.material_lot,
    lot: row.material_lot,
    iqcRequired: Boolean(row.iqc_required),
    iqcStatus: row.iqc_status,
    iqc: row.iqc_status,
    coaRequired: Boolean(row.coa_required),
    msdsRequired: Boolean(row.msds_required),
    lotRequired: Boolean(row.lot_required),
    requester: row.requester,
    owner: row.requester,
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  mapped.status = derivePurchaseStatus({ ...row, ...mapped });
  if (receipts !== undefined) mapped.receipts = receipts;
  return mapped;
}

function normalizePurchaseInput(input, current = {}) {
  const source = input || {};
  const fallback = current || {};
  const value = (keys, fallbackKeys = keys, defaultValue = '') => purchaseValue(
    source,
    keys,
    purchaseValue(fallback, fallbackKeys, defaultValue)
  );
  const quantity = num(value(['qty', 'quantity'], ['qty'])) ?? 0;
  const unitPrice = num(value(['unitPrice', 'price'], ['unit_price'], 0)) ?? 0;
  const receivedQty = num(value(['receivedQty', 'received'], ['received_qty'], 0)) ?? 0;
  const orderDate = purchaseDate(value(['orderDate', 'date'], ['order_date']), new Date().toISOString().slice(0, 10));
  const requestedDueDate = purchaseDate(value(
    ['requestedDueDate', 'due', 'dueDate'],
    ['requested_due_date']
  ));

  return {
    purchase_type: txt(value(['purchaseType', 'type'], ['purchase_type'], '정기발주')) || '정기발주',
    production_type: normalizePurchaseProductionType(value(['productionType'], ['production_type'], 'D-양산')),
    supplier: txt(value(['supplier', 'vendor'], ['supplier'])),
    supplier_grade: txt(value(['supplierGrade', 'grade'], ['supplier_grade'])),
    item: txt(value(['item', 'material', 'materialName'], ['item'])),
    item_code: txt(value(['itemCode', 'materialCode'], ['item_code'])),
    spec: txt(value(['spec'], ['spec'])),
    qty: quantity,
    unit: txt(value(['unit'], ['unit'], 'kg')) || 'kg',
    unit_price: unitPrice,
    amount: Math.max(0, num(value(['amount'], ['amount'], quantity * unitPrice)) ?? quantity * unitPrice),
    order_date: orderDate,
    requested_due_date: requestedDueDate,
    confirmed_due_date: purchaseDate(value(
      ['confirmedDueDate', 'expected', 'expectedDate'],
      ['confirmed_due_date']
    )) || null,
    priority: txt(value(['priority'], ['priority'], '일반')) || '일반',
    mrp_no: txt(value(['mrpNo', 'mrp', 'requestNo'], ['mrp_no'])),
    work_order_no: txt(value(['workOrderNo', 'workOrder'], ['work_order_no'])),
    purpose: txt(value(['purpose'], ['purpose'])),
    warehouse: txt(value(['warehouse'], ['warehouse'], '')),
    delivery_address: txt(value(
      ['deliveryAddress', 'address'],
      ['delivery_address'],
      ''
    )),
    payment_terms: txt(value(['paymentTerms', 'terms'], ['payment_terms'])),
    approval_status: txt(value(['approvalStatus', 'approval'], ['approval_status'], '구매검토')) || '구매검토',
    receipt_status: txt(value(['receiptStatus', 'receiving'], ['receipt_status'], '미입고')) || '미입고',
    received_qty: receivedQty,
    receipt_date: purchaseDate(value(['receiptDate', 'receivedAt'], ['receipt_date'])) || null,
    material_lot: txt(value(['materialLot', 'lot'], ['material_lot'])),
    iqc_required: purchaseBoolean(value(['iqcRequired'], ['iqc_required'], true), true),
    iqc_status: txt(value(['iqcStatus', 'iqc'], ['iqc_status'], '계획 대기')) || '계획 대기',
    coa_required: purchaseBoolean(value(['coaRequired'], ['coa_required'], true), true),
    msds_required: purchaseBoolean(value(['msdsRequired'], ['msds_required'], false), false),
    lot_required: purchaseBoolean(value(['lotRequired'], ['lot_required'], true), true),
    status: txt(value(['status'], ['status'], '결재대기')) || '결재대기',
    requester: txt(value(['requester', 'owner'], ['requester'])),
    notes: txt(value(['notes', 'note'], ['notes'])),
  };
}

function validatePurchaseInput(body) {
  const importedHistory = body.purchase_type === 'ERP 이관';
  if (!body.supplier || !body.item) return '협력사와 품목을 입력하세요.';
  if (!Number.isFinite(body.qty) || body.qty <= 0) return '발주수량은 0보다 커야 합니다.';
  if (!body.order_date || (!importedHistory && !body.requested_due_date)) {
    return importedHistory ? '발주일을 확인하세요.' : '발주일과 납기 요청일을 확인하세요.';
  }
  if (body.requested_due_date && body.requested_due_date < body.order_date) {
    return '납기 요청일은 발주일보다 빠를 수 없습니다.';
  }
  if (!Number.isFinite(body.unit_price) || body.unit_price < 0) return '단가를 확인하세요.';
  if (!Number.isFinite(body.received_qty) || body.received_qty < 0 || body.received_qty > body.qty) {
    return '입고수량은 0 이상, 발주수량 이하여야 합니다.';
  }
  return '';
}

function normalizeLegacyPurchasePayload(payload) {
  const parsed = jsonObj(payload, {});
  const rows = arr(parsed.rows)
    .filter((row) => !(
      (txt(row?.id) === 'PO-260824-01' && /^Supplier A$/i.test(txt(row?.supplier)))
      || (txt(row?.id) === 'PO-260824-02' && /^Supplier B$/i.test(txt(row?.supplier)))
    ))
    .map((row) => {
      const normalized = {
        ...row,
        id: txt(row.id || row.purchaseNo || row.no),
        purchaseNo: txt(row.purchaseNo || row.no || row.id),
        productionType: normalizePurchaseProductionType(row.productionType),
        supplier: txt(row.supplier || row.vendor),
        material: txt(row.material || row.item),
        item: txt(row.item || row.material),
        qty: Math.max(0, num(row.qty ?? row.quantity) ?? 0),
        unit: txt(row.unit) || 'kg',
        orderDate: purchaseDate(row.orderDate || row.date) || new Date().toISOString().slice(0, 10),
        due: purchaseDate(row.due || row.requestedDueDate || row.dueDate),
        expected: purchaseDate(row.expected || row.confirmedDueDate || row.expectedDate),
        received: Math.max(0, num(row.received ?? row.receivedQty) ?? 0),
      };
      normalized.status = derivePurchaseStatus(normalized);
      return normalized;
    });
  return { ...parsed, module: 'erp', kind: 'purchase', schema: 3, rows };
}

async function nextPurchaseNo(client, orderDate) {
  const date = purchaseDate(orderDate) || new Date().toISOString().slice(0, 10);
  const prefix = `PUR-${date.slice(2, 7).replace('-', '')}-`;
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`purchase:${prefix}`]);
  const result = await client.query(
    `SELECT purchase_no FROM purchase_orders
     WHERE purchase_no LIKE $1
     ORDER BY purchase_no DESC`,
    [`${prefix}%`]
  );
  const max = result.rows.reduce((value, row) => {
    const sequence = Number(txt(row.purchase_no).slice(prefix.length));
    return Number.isInteger(sequence) ? Math.max(value, sequence) : value;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

async function syncPurchaseOrdersToLegacy(client, userName) {
  const result = await client.query('SELECT * FROM purchase_orders ORDER BY order_date DESC, created_at DESC');
  const rows = result.rows.map((row) => mapPurchaseOrder(row));
  const payload = {
    module: 'erp',
    kind: 'purchase',
    schema: 3,
    rows,
    updatedAt: new Date().toISOString(),
    updatedBy: userName,
  };
  await client.query(
    `INSERT INTO qmes_sync_records (record_type, record_key, payload, updated_by, updated_at)
     VALUES ('inventory', 'erp:purchase', $1::jsonb, $2, NOW())
     ON CONFLICT (record_type, record_key)
     DO UPDATE SET payload = EXCLUDED.payload, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
    [JSON.stringify(payload), userName]
  );
}


const PURCHASE_HISTORY_SEED = [
  ["2026-06-25-1","2026-06-25","금호석유화학(주)","SBS(KTR-201) [KG]",50,30700,1535000,"내부창고(충주)","2026/06/25 -1"],
  ["2026-06-08-2","2026-06-08","LG화학","ADC30G(SBR) [KG]",300,11237,3371100,"내부창고(충주)","2026/06/08 -2"],
  ["2026-06-08-1","2026-06-08","한국 사이언스코(주)","Solef5140 [KG]",20,36649,732980,"내부창고(충주)","2026/06/08 -1"],
  ["2026-05-15-1","2026-05-15","한국 사이언스코(주)","Solef5140 [KG]",20,36649,732980,"내부창고(충주)","2026/05/15 -1"],
  ["2026-04-28-1","2026-04-28","금호석유화학(주)","SBS(KTR-201) [KG]",50,29522,1476100,"내부창고(충주)","2026/04/28 -1"],
  ["2026-04-14-1","2026-04-14","한국 사이언스코(주)","Solef5130(PVdF)",40,36448,1457920,"내부창고(충주)","2026/04/14 -1"],
  ["2026-03-30-1","2026-03-30","LG Chemical","ADC30G(SBR) [KG]",300,11237,3371100,"내부창고(충주)","2026/03/30 -1"],
  ["2026-01-26-1","2026-01-26","강신산업(주)","AOH30(Boehmite) [KG]",300,9700,2910000,"내부창고(충주)","2026/01/26 -1"],
  ["2026-01-23-1","2026-01-23","모리토루 케미칼즈 한국 주식회사","NMP(SNET) [KG]",2000,0,6350561,"내부창고(충주)","2026/01/23 -1"],
  ["2026-01-13-1","2026-01-13","(주)케미렉스","NMP(PUYANG GUANGMING CHEMICAL) [KG]",3000,2950,8850000,"내부창고(충주)","2026/01/13 -1"],
  ["2025-12-03-1","2025-12-03","삼화페인트(주)","스피롤터(a부, b부) [KG]",100,5600,560000,"외부창고(충주)","2025/12/03 -1"],
  ["2025-11-11-1","2025-11-11","강신산업(주)","AOH30(Boehmite) [kg]",100,9700,970000,"외부창고(충주)","2025/11/11 -1"],
  ["2025-11-10-1","2025-11-10","모리토루 케미칼즈 한국 주식회사","NMP(SNET) [kg]",1000,3307,3306737,"외부창고(충주)","2025/11/10 -1"],
  ["2025-10-01-2","2025-10-01","한국 사이언스코(주)","Solef5130(PVdF) [KG]",36,0,0,"내부창고(충주)","2025/10/01 -2"],
  ["2025-10-01-1","2025-10-01","코오롱인더스트리","PAI [KG]",160,0,0,"내부창고(충주)","2025/10/01 -1"],
  ["2025-09-30-1","2025-09-30","모리토루 케미칼즈 한국 주식회사","NMP(SNET) [kg]",1000,2903,2902525,"외부창고(충주)","2025/09/30 -1"],
  ["2025-09-16-2","2025-09-16","LG Chemical","ADC30G(sbr) [kg]",400,12507,5002800,"외부창고(충주)","2025/09/16 -2"],
  ["2025-09-12-1","2025-09-12","유니소재(주)","BYK180(Dispersant) [KG]",25,36520,913000,"외부창고(충주)","2025/09/12 -1"],
];

async function ensurePurchaseHistory() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const seedMarker = await client.query(
      `SELECT 1 FROM qmes_sync_records
       WHERE record_type = 'purchase' AND record_key = 'seed:purchase-history-v2'`
    );
    if (!seedMarker.rowCount) {
      for (const [purchaseNo, orderDate, supplier, item, qty, unitPrice, amount, warehouse, originalNo] of PURCHASE_HISTORY_SEED) {
        const note = `기존 ERP 거래내역 · 원본번호 ${originalNo} · 수량·금액 상세 반영 v2${amount > 0 ? '' : ' · 금액 미입력'}`;
        await client.query(
          `INSERT INTO purchase_orders (
             purchase_no, purchase_type, production_type, supplier, item, qty, unit, unit_price, amount,
             order_date, requested_due_date, warehouse, delivery_address, payment_terms,
             approval_status, receipt_status, received_qty, iqc_required, iqc_status,
             coa_required, msds_required, lot_required, status, notes, created_by, updated_by
           )
           VALUES ($1, 'ERP 이관', 'D-양산', $2, $3, $4, 'kg', $5, $6,
                   $7, NULL, $8, '', '부가세율 적용',
                   '승인완료', '입고완료', $4, FALSE, '기존 ERP 반영',
                   FALSE, FALSE, FALSE, '입고완료', $9, 'SYSTEM', 'SYSTEM')
           ON CONFLICT (purchase_no)
           DO UPDATE SET
             supplier = EXCLUDED.supplier,
             item = EXCLUDED.item,
             qty = EXCLUDED.qty,
             unit_price = EXCLUDED.unit_price,
             amount = EXCLUDED.amount,
             order_date = EXCLUDED.order_date,
             warehouse = EXCLUDED.warehouse,
             payment_terms = EXCLUDED.payment_terms,
             approval_status = EXCLUDED.approval_status,
             receipt_status = EXCLUDED.receipt_status,
             received_qty = EXCLUDED.received_qty,
             iqc_required = EXCLUDED.iqc_required,
             iqc_status = EXCLUDED.iqc_status,
             coa_required = EXCLUDED.coa_required,
             msds_required = EXCLUDED.msds_required,
             lot_required = EXCLUDED.lot_required,
             status = EXCLUDED.status,
             notes = EXCLUDED.notes,
             updated_at = NOW()
           WHERE purchase_orders.created_by = 'SYSTEM'
             AND purchase_orders.updated_by = 'SYSTEM'
             AND purchase_orders.notes LIKE '기존 ERP 거래내역%'
             AND purchase_orders.notes NOT LIKE '%수량·금액 상세 반영 v2%'`,
          [purchaseNo, supplier, item, qty, unitPrice, amount, orderDate, warehouse, note]
        );
      }
        await client.query(
        `INSERT INTO qmes_sync_records (record_type, record_key, payload, updated_by, updated_at)
         VALUES ('purchase', 'seed:purchase-history-v2', '{"version":2,"count":18}'::jsonb, 'SYSTEM', NOW())
         ON CONFLICT (record_type, record_key) DO NOTHING`
      );
    }
    await syncPurchaseOrdersToLegacy(client, 'SYSTEM');
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function upsertLegacyPurchaseRows(rows, userName) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of arr(rows)) {
      const requestedNo = txt(row?.purchaseNo || row?.no || row?.id);
      const currentResult = requestedNo
        ? await client.query('SELECT * FROM purchase_orders WHERE purchase_no = $1', [requestedNo])
        : { rows: [] };
      const current = currentResult.rows[0] || {};
      const body = normalizePurchaseInput(row, current);
      if (validatePurchaseInput(body)) continue;
      const purchaseNo = requestedNo || await nextPurchaseNo(client, body.order_date);
      const keys = Object.keys(body);
      const values = Object.values(body);
      const columns = ['purchase_no', ...keys, 'created_by', 'updated_by'];
      const params = [purchaseNo, ...values, userName, userName];
      const marks = params.map((_, index) => `$${index + 1}`).join(', ');
      const updates = keys.map((key) => `${key} = EXCLUDED.${key}`).join(', ');
      await client.query(
        `INSERT INTO purchase_orders (${columns.join(', ')})
         VALUES (${marks})
         ON CONFLICT (purchase_no)
         DO UPDATE SET ${updates}, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
        params
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const QMES_SYNC_TYPES = new Set(['iqc', 'pqc', 'oqc', 'workorder', 'equipment', 'inventory', 'purchase']);

function qmesSyncType(req, res) {
  const type = txt(req.params.type).toLowerCase();
  if (!QMES_SYNC_TYPES.has(type)) {
    fail(res, 400, '지원하지 않는 동기화 유형입니다.');
    return null;
  }
  return type;
}

app.get('/api/qmes-sync/:type', requireLogin, async (req, res) => {
  const type = qmesSyncType(req, res);
  if (!type) return;
  try {
    const result = await db(
      `SELECT record_type, record_key, payload, updated_by, updated_at
       FROM qmes_sync_records
       WHERE record_type = $1
       ORDER BY updated_at DESC`,
      [type]
    );
    const rows = result.rows.map((row) => (
      type === 'inventory' && row.record_key === 'erp:purchase'
        ? { ...row, payload: normalizeLegacyPurchasePayload(row.payload) }
        : row
    ));
    ok(res, rows);
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/qmes-sync/:type', requireLogin, async (req, res) => {
  const type = qmesSyncType(req, res);
  if (!type) return;
  const key = txt(req.body?.key);
  const inputPayload = req.body?.payload;
  if (!key || !inputPayload || typeof inputPayload !== 'object' || Array.isArray(inputPayload)) {
    return fail(res, 400, '기록 키와 저장 데이터를 확인하세요.');
  }
  try {
    const payload = type === 'inventory' && key === 'erp:purchase'
      ? normalizeLegacyPurchasePayload(inputPayload)
      : inputPayload;
    const before = await db(
      'SELECT payload FROM qmes_sync_records WHERE record_type = $1 AND record_key = $2',
      [type, key]
    );
    const userName = txt(req.session?.user?.name);
    const result = await db(
      `INSERT INTO qmes_sync_records (record_type, record_key, payload, updated_by, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, NOW())
       ON CONFLICT (record_type, record_key)
       DO UPDATE SET payload = EXCLUDED.payload, updated_by = EXCLUDED.updated_by, updated_at = NOW()
       RETURNING record_type, record_key, payload, updated_by, updated_at`,
      [type, key, JSON.stringify(payload), userName]
    );
    await auditLog(
      req,
      before.rowCount ? 'UPDATE' : 'CREATE',
      'qmes_sync_records',
      `${type}:${key}`,
      before.rows[0]?.payload || null,
      payload
    );
    if (type === 'inventory' && key === 'erp:purchase') {
      await upsertLegacyPurchaseRows(payload.rows, userName);
    }
    ok(res, result.rows[0], '공용 DB에 저장되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

function purchaseOrderWhere(id, param = '$1') {
  return `(id::text = ${param} OR purchase_no = ${param})`;
}

function mapPurchaseReceipt(row) {
  return {
    id: row.id,
    purchaseOrderId: row.purchase_order_id,
    receiptDate: purchaseDate(row.receipt_date),
    qty: Number(row.qty || 0),
    materialLot: row.material_lot,
    expiryDate: purchaseDate(row.expiry_date),
    iqcStatus: row.iqc_status,
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

app.get('/api/purchase-orders', requireLogin, async (req, res) => {
  try {
    const clauses = [];
    const params = [];
    const search = txt(req.query.q);
    const supplier = txt(req.query.supplier);
    if (search) {
      params.push(`%${search}%`);
      clauses.push(`CONCAT_WS(' ', purchase_no, supplier, item, item_code, spec, mrp_no, work_order_no) ILIKE $${params.length}`);
    }
    if (supplier) {
      params.push(supplier);
      clauses.push(`supplier = $${params.length}`);
    }
    const result = await db(
      `SELECT * FROM purchase_orders
       ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
       ORDER BY order_date DESC, created_at DESC
       LIMIT 500`,
      params
    );
    let rows = result.rows.map((row) => mapPurchaseOrder(row));
    const status = txt(req.query.status);
    if (status && status !== 'all') rows = rows.filter((row) => row.status === status);
    ok(res, rows);
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get('/api/purchase-orders/:id', requireLogin, async (req, res) => {
  try {
    const result = await db(`SELECT * FROM purchase_orders WHERE ${purchaseOrderWhere(req.params.id)}`, [req.params.id]);
    if (!result.rowCount) return fail(res, 404, '발주서를 찾을 수 없습니다.');
    const receipts = await db(
      `SELECT * FROM purchase_receipts
       WHERE purchase_order_id = $1
       ORDER BY receipt_date DESC, created_at DESC`,
      [result.rows[0].id]
    );
    ok(res, mapPurchaseOrder(result.rows[0], receipts.rows.map(mapPurchaseReceipt)));
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/purchase-orders', requireLogin, async (req, res) => {
  const body = normalizePurchaseInput(req.body);
  const validation = validatePurchaseInput(body);
  if (validation) return fail(res, 400, validation);

  const client = await pool.connect();
  let created;
  try {
    await client.query('BEGIN');
    const requestedNo = txt(req.body?.purchaseNo || req.body?.no || req.body?.id);
    const purchaseNo = requestedNo || await nextPurchaseNo(client, body.order_date);
    const keys = Object.keys(body);
    const userName = txt(req.session.user?.name);
    const columns = ['purchase_no', ...keys, 'created_by', 'updated_by'];
    const values = [purchaseNo, ...Object.values(body), userName, userName];
    const marks = values.map((_, index) => `$${index + 1}`).join(', ');
    const result = await client.query(
      `INSERT INTO purchase_orders (${columns.join(', ')})
       VALUES (${marks})
       RETURNING *`,
      values
    );
    created = result.rows[0];
    await syncPurchaseOrdersToLegacy(client, userName);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return fail(res, 409, '이미 사용 중인 발주번호입니다.');
    return fail(res, 500, err.message);
  } finally {
    client.release();
  }

  await auditLog(req, 'CREATE', 'purchase_orders', created.id, null, created);
  ok(res, mapPurchaseOrder(created), '구매 발주서가 저장되었습니다.');
});

app.put('/api/purchase-orders/:id', requireLogin, async (req, res) => {
  const client = await pool.connect();
  let before;
  let updated;
  try {
    await client.query('BEGIN');
    const current = await client.query(
      `SELECT * FROM purchase_orders WHERE ${purchaseOrderWhere(req.params.id)} FOR UPDATE`,
      [req.params.id]
    );
    if (!current.rowCount) {
      await client.query('ROLLBACK');
      return fail(res, 404, '발주서를 찾을 수 없습니다.');
    }
    before = current.rows[0];
    const body = normalizePurchaseInput(req.body, before);
    const validation = validatePurchaseInput(body);
    if (validation) {
      await client.query('ROLLBACK');
      return fail(res, 400, validation);
    }
    const keys = Object.keys(body);
    const values = Object.values(body);
    const sets = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const userName = txt(req.session.user?.name);
    const result = await client.query(
      `UPDATE purchase_orders
       SET ${sets}, updated_by = $${keys.length + 1}, updated_at = NOW()
       WHERE id = $${keys.length + 2}
       RETURNING *`,
      [...values, userName, before.id]
    );
    updated = result.rows[0];
    await syncPurchaseOrdersToLegacy(client, userName);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    return fail(res, 500, err.message);
  } finally {
    client.release();
  }

  await auditLog(req, 'UPDATE', 'purchase_orders', updated.id, before, updated);
  ok(res, mapPurchaseOrder(updated), '구매 발주서가 수정되었습니다.');
});

app.post('/api/purchase-orders/:id/receipts', requireLogin, async (req, res) => {
  const receiptQty = num(req.body?.qty ?? req.body?.receivedQty);
  const receiptDate = purchaseDate(req.body?.receiptDate, new Date().toISOString().slice(0, 10));
  const materialLot = txt(req.body?.materialLot || req.body?.lot);
  const expiryDate = purchaseDate(req.body?.expiryDate) || null;
  if (!receiptQty || receiptQty <= 0 || !receiptDate) {
    return fail(res, 400, '입고일과 입고수량을 확인하세요.');
  }

  const client = await pool.connect();
  let before;
  let updated;
  let receipt;
  try {
    await client.query('BEGIN');
    const current = await client.query(
      `SELECT * FROM purchase_orders WHERE ${purchaseOrderWhere(req.params.id)} FOR UPDATE`,
      [req.params.id]
    );
    if (!current.rowCount) {
      await client.query('ROLLBACK');
      return fail(res, 404, '발주서를 찾을 수 없습니다.');
    }
    before = current.rows[0];
    if (/취소/.test(txt(before.status))) {
      await client.query('ROLLBACK');
      return fail(res, 409, '취소된 발주는 입고 등록할 수 없습니다.');
    }
    const remaining = Number(before.qty) - Number(before.received_qty || 0);
    if (receiptQty > remaining) {
      await client.query('ROLLBACK');
      return fail(res, 400, `입고수량은 미입고 잔량 ${remaining.toLocaleString('ko-KR')} ${before.unit}를 초과할 수 없습니다.`);
    }
    if (before.lot_required && !materialLot) {
      await client.query('ROLLBACK');
      return fail(res, 400, '원료 LOT를 입력하세요.');
    }

    const userName = txt(req.session.user?.name);
    const iqcStatus = before.iqc_required ? '검사 대기' : '비대상';
    const receiptResult = await client.query(
      `INSERT INTO purchase_receipts
       (purchase_order_id, receipt_date, qty, material_lot, expiry_date, iqc_status, note, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [before.id, receiptDate, receiptQty, materialLot, expiryDate, iqcStatus, txt(req.body?.note), userName]
    );
    receipt = receiptResult.rows[0];
    const totalReceived = Number(before.received_qty || 0) + receiptQty;
    const receiptStatus = totalReceived >= Number(before.qty) ? '입고완료' : '부분입고';
    const updateResult = await client.query(
      `UPDATE purchase_orders
       SET received_qty = $1, receipt_status = $2, receipt_date = $3,
           material_lot = $4, iqc_status = $5, updated_by = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [totalReceived, receiptStatus, receiptDate, materialLot, iqcStatus, userName, before.id]
    );
    updated = updateResult.rows[0];

    if (before.iqc_required) {
      const iqcPayload = {
        module: 'purchase',
        kind: 'purchase-receipt-iqc',
        schema: 1,
        rows: [{
          id: `IQC-${before.purchase_no}-${receipt.id}`,
          purchaseOrder: before.purchase_no,
          purchaseOrderNo: before.purchase_no,
          date: receiptDate,
          lot: materialLot,
          supplier: before.supplier,
          item: before.item,
          itemCode: before.item_code,
          incomingQty: receiptQty,
          qty: receiptQty,
          judge: '',
          status: '검사대기',
          createdBy: userName,
        }],
      };
      await client.query(
        `INSERT INTO qmes_sync_records (record_type, record_key, payload, updated_by, updated_at)
         VALUES ('iqc', $1, $2::jsonb, $3, NOW())
         ON CONFLICT (record_type, record_key)
         DO UPDATE SET payload = EXCLUDED.payload, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
        [`purchase:${before.purchase_no}:receipt:${receipt.id}`, JSON.stringify(iqcPayload), userName]
      );
    }

    await syncPurchaseOrdersToLegacy(client, userName);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    return fail(res, 500, err.message);
  } finally {
    client.release();
  }

  await auditLog(req, 'RECEIPT', 'purchase_orders', updated.id, before, { purchase: updated, receipt });
  ok(res, { purchaseOrder: mapPurchaseOrder(updated), receipt: mapPurchaseReceipt(receipt) }, '입고가 등록되고 IQC 계획이 연결되었습니다.');
});

app.post('/api/purchase-orders/:id/cancel', requireLogin, async (req, res) => {
  try {
    const before = await db(`SELECT * FROM purchase_orders WHERE ${purchaseOrderWhere(req.params.id)}`, [req.params.id]);
    if (!before.rowCount) return fail(res, 404, '발주서를 찾을 수 없습니다.');
    if (Number(before.rows[0].received_qty || 0) > 0) {
      return fail(res, 409, '입고 이력이 있는 발주는 취소할 수 없습니다.');
    }
    const userName = txt(req.session.user?.name);
    const client = await pool.connect();
    let updated;
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `UPDATE purchase_orders
         SET status = '발주취소', updated_by = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [userName, before.rows[0].id]
      );
      updated = result.rows[0];
      await syncPurchaseOrdersToLegacy(client, userName);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    await auditLog(req, 'CANCEL', 'purchase_orders', updated.id, before.rows[0], updated);
    ok(res, mapPurchaseOrder(updated), '발주가 취소되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});


app.delete('/api/purchase-orders/:id', requireAdmin, async (req, res) => {
  const before = await db(
    `SELECT * FROM purchase_orders WHERE ${purchaseOrderWhere(req.params.id)}`,
    [req.params.id]
  );
  if (!before.rowCount) return fail(res, 404, '발주서를 찾을 수 없습니다.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM purchase_orders WHERE id = $1', [before.rows[0].id]);
    await syncPurchaseOrdersToLegacy(client, txt(req.session.user?.name) || '관리자');
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    return fail(res, 500, err.message);
  } finally {
    client.release();
  }

  await auditLog(req, 'DELETE', 'purchase_orders', before.rows[0].purchase_no, before.rows[0], null);
  ok(res, null, '구매 발주가 삭제되었습니다.');
});

function bindCrud(table, mapper) {
  app.get(`/api/${table}`, requireLogin, async (_req, res) => {
    try {
      const r = await db(`SELECT * FROM ${table} ORDER BY created_at DESC`);
      ok(res, r.rows);
    } catch (err) {
      fail(res, 500, err.message);
    }
  });

  app.post(`/api/${table}`, requireLogin, async (req, res) => {
    try {
      const body = mapper(req.body);
      const keys = Object.keys(body);
      const vals = Object.values(body);
      const marks = keys.map((_, i) => `$${i + 1}`).join(',');

      const r = await db(
        `INSERT INTO ${table} (${keys.join(',')})
         VALUES (${marks})
         RETURNING *`,
        vals
      );

      await auditLog(req, 'CREATE', table, r.rows[0]?.id, null, r.rows[0]);
      ok(res, r.rows[0], '저장되었습니다.');
    } catch (err) {
      fail(res, 500, err.message);
    }
  });

  app.put(`/api/${table}/:id`, requireLogin, async (req, res) => {
    try {
      const before = await db(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!before.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');

      const body = mapper(req.body);
      const keys = Object.keys(body);
      const vals = Object.values(body);
      const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

      const r = await db(
        `UPDATE ${table} SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
        [...vals, req.params.id]
      );

      await auditLog(req, 'UPDATE', table, req.params.id, before.rows[0], r.rows[0]);
      ok(res, r.rows[0], '수정되었습니다.');
    } catch (err) {
      fail(res, 500, err.message);
    }
  });

  app.delete(`/api/${table}/:id`, requireLogin, async (req, res) => {
    try {
      const before = await db(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!before.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');

      const r = await db(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [req.params.id]);
      await auditLog(req, 'DELETE', table, req.params.id, before.rows[0], null);
      ok(res, null, '삭제되었습니다.');
    } catch (err) {
      fail(res, 500, err.message);
    }
  });
}

bindCrud('iqc', (b) => ({
  date: txt(b.date),
  lot: txt(b.lot),
  supplier: txt(b.supplier),
  item: txt(b.item),
  inspector: txt(b.inspector),
  incoming_qty: num(b.incomingQty),
  qty: num(b.qty ?? b.checkQty),
  fail: num(b.fail ?? b.failQty) ?? 0,
  packaging_type: txt(b.packagingType),
  packaging_type_other: txt(b.packagingTypeOther),
  package_qty: num(b.packageQty),
  unit_weight: num(b.unitWeight),
  calculated_weight: num(b.calculatedWeight),
  barcode_qty: num(b.barcodeQty),
  items_json: JSON.stringify(arr(b.items)),
  sign_writer: sign(b.signWriter),
  sign_reviewer: sign(b.signReviewer),
  sign_approver: sign(b.signApprover),
}));

bindCrud('pqc', (b) => {
  const items = arr(b.items);
  return {
    date: txt(b.date),
    product: txt(b.product),
    lot: txt(b.lot),
    visual: txt(b.visual),
    viscosity: txt(b.viscosity),
    solid: txt(b.solid),
    particle: txt(b.particle),
    judge: txt(b.judge) || calcJudgeFromItems(items),
    incoming_qty: num(b.incomingQty),
    qty: num(b.qty ?? b.checkQty),
    fail: num(b.fail ?? b.failQty) ?? 0,
    items_json: JSON.stringify(items),
    sign_writer: sign(b.signWriter),
    sign_reviewer: sign(b.signReviewer),
    sign_approver: sign(b.signApprover),
  };
});

bindCrud('oqc', (b) => {
  const items = arr(b.items);
  return {
    date: txt(b.date),
    customer: txt(b.customer),
    product: txt(b.product),
    lot: txt(b.lot),
    visual: txt(b.visual),
    package: txt(b.package),
    viscosity: txt(b.viscosity),
    solid: txt(b.solid),
    particle: txt(b.particle),
    adhesion: txt(b.adhesion),
    resistance: txt(b.resistance),
    swelling: txt(b.swelling),
    moisture: txt(b.moisture),
    qty: txt(b.qty ?? b.checkQty),
    fail: num(b.fail ?? b.failQty) ?? 0,
    judge: txt(b.judge) || calcJudgeFromItems(items),
    items_json: JSON.stringify(items),
    sign_writer: sign(b.signWriter),
    sign_reviewer: sign(b.signReviewer),
    sign_approver: sign(b.signApprover),
  };
});

bindCrud('suppliers', (b) => ({
  name: txt(b.name),
  manager: txt(b.manager),
  phone: txt(b.phone),
  category: txt(b.category),
  status: txt(b.status),
}));

bindCrud('nonconform', (b) => ({
  date: txt(b.date ?? b.ncDate),
  type: txt(b.type ?? b.ncType),
  lot: txt(b.lot),
  item: txt(b.item),
  issue: txt(b.issue),
  cause: txt(b.cause),
  action: txt(b.action),
  owner: txt(b.owner),
  status: txt(b.status),
  sign_writer: sign(b.signWriter),
  sign_reviewer: sign(b.signReviewer),
  sign_approver: sign(b.signApprover),
  nc_no: txt(b.ncNo ?? b.no ?? b.reportNo),
  dept: txt(b.dept ?? b.department),
  qty: num(b.qty ?? b.ncQty) ?? 0,
  severity: txt(b.severity),
  priority: txt(b.priority),
  action_date: txt(b.actionDate) || null,
  verify: txt(b.verify),
  verify_date: txt(b.verifyDate) || null,
  capa_status: txt(b.capaStatus) || 'OPEN',
  containment: txt(b.containment),
  impact_scope: txt(b.impactScope),
  correction: txt(b.correction),
  preventive_action: txt(b.preventiveAction),
  verification_result: txt(b.verificationResult),
  due_date: txt(b.dueDate) || null,
  progress: num(b.progress) ?? 0,
  photos: JSON.stringify(arr(b.photos)),
  why_json: JSON.stringify(arr(b.whyList ?? b.whys)),
  fishbone_json: JSON.stringify(jsonObj(b.fishbone)),
  capa_actions: JSON.stringify(arr(b.capaActions)),
}));

app.get('/api/worklog', requireLogin, async (_req, res) => {
  try {
    const r = await db('SELECT * FROM worklog ORDER BY created_at DESC');
    const ids = r.rows.map((x) => x.id);

    let materials = [];
    if (ids.length) {
      const m = await db(
        'SELECT * FROM worklog_materials WHERE worklog_id = ANY($1::uuid[]) ORDER BY seq ASC',
        [ids]
      );
      materials = m.rows;
    }

    const data = r.rows.map((row) => ({
      id: row.id,
      workDate: row.work_date,
      finishedLot: row.finished_lot,
      worker: row.worker,
      planQty: row.plan_qty,
      prodQty: row.prod_qty,
      failQty: row.fail_qty,
      remark: row.remark,
      flowSet: row.flow_set,
      flowActual: row.flow_actual,
      tempSet: row.temp_set,
      tempActual: row.temp_actual,
      pressSet: row.press_set,
      pressActual: row.press_actual,
      materials: materials
        .filter((m) => m.worklog_id === row.id)
        .map((m) => ({
          seq: m.seq,
          material: m.material,
          supName: m.sup_name,
          lotNo: m.lot_no,
          inputQty: m.input_qty,
          inputTime: m.input_time,
        })),
    }));

    ok(res, data);
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/worklog', requireLogin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const b = req.body || {};

    const inserted = await client.query(
      `INSERT INTO worklog
      (work_date, finished_lot, worker, plan_qty, prod_qty, fail_qty, remark, flow_set, flow_actual, temp_set, temp_actual, press_set, press_actual)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id`,
      [
        txt(b.workDate),
        txt(b.finishedLot),
        txt(b.worker),
        txt(b.planQty),
        txt(b.prodQty),
        txt(b.failQty),
        txt(b.remark),
        txt(b.flowSet),
        txt(b.flowActual),
        txt(b.tempSet),
        txt(b.tempActual),
        txt(b.pressSet),
        txt(b.pressActual),
      ]
    );

    const worklogId = inserted.rows[0].id;
    const materials = arr(b.materials);

    for (let i = 0; i < materials.length; i += 1) {
      const m = materials[i];
      await client.query(
        `INSERT INTO worklog_materials
        (worklog_id, seq, material, sup_name, lot_no, input_qty, input_time)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          worklogId,
          i + 1,
          txt(m.material),
          txt(m.supName),
          txt(m.lotNo),
          txt(m.inputQty),
          txt(m.inputTime),
        ]
      );
    }

    await client.query('COMMIT');
    ok(res, { id: worklogId }, '작업일지가 저장되었습니다.');
  } catch (err) {
    await client.query('ROLLBACK');
    fail(res, 500, err.message);
  } finally {
    client.release();
  }
});

app.put('/api/worklog/:id', requireLogin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const b = req.body || {};

    const updated = await client.query(
      `UPDATE worklog
       SET work_date=$1, finished_lot=$2, worker=$3, plan_qty=$4, prod_qty=$5, fail_qty=$6,
           remark=$7, flow_set=$8, flow_actual=$9, temp_set=$10, temp_actual=$11, press_set=$12, press_actual=$13
       WHERE id=$14
       RETURNING id`,
      [
        txt(b.workDate),
        txt(b.finishedLot),
        txt(b.worker),
        txt(b.planQty),
        txt(b.prodQty),
        txt(b.failQty),
        txt(b.remark),
        txt(b.flowSet),
        txt(b.flowActual),
        txt(b.tempSet),
        txt(b.tempActual),
        txt(b.pressSet),
        txt(b.pressActual),
        req.params.id,
      ]
    );

    if (!updated.rowCount) {
      await client.query('ROLLBACK');
      return fail(res, 404, '작업일지를 찾을 수 없습니다.');
    }

    await client.query('DELETE FROM worklog_materials WHERE worklog_id = $1', [req.params.id]);

    const materials = arr(b.materials);
    for (let i = 0; i < materials.length; i += 1) {
      const m = materials[i];
      await client.query(
        `INSERT INTO worklog_materials
        (worklog_id, seq, material, sup_name, lot_no, input_qty, input_time)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          req.params.id,
          i + 1,
          txt(m.material),
          txt(m.supName),
          txt(m.lotNo),
          txt(m.inputQty),
          txt(m.inputTime),
        ]
      );
    }

    await client.query('COMMIT');
    ok(res, { id: req.params.id }, '작업일지가 수정되었습니다.');
  } catch (err) {
    await client.query('ROLLBACK');
    fail(res, 500, err.message);
  } finally {
    client.release();
  }
});

app.delete('/api/worklog/:id', requireLogin, async (req, res) => {
  try {
    const r = await db('DELETE FROM worklog WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rowCount) return fail(res, 404, '작업일지를 찾을 수 없습니다.');
    ok(res, null, '작업일지가 삭제되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/certificate', requireLogin, async (req, res) => {
  try {
    const b = req.body || {};
    const items = arr(b.items);
    const judge = txt(b.judge) || calcJudgeFromItems(items);

    const r = await db(
      `INSERT INTO certificates
      (cert_type, date, lot, inspector, item, company, incoming_qty, check_qty, fail_qty, judge, remark, items_json,
       sign_writer, sign_reviewer, sign_approver)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        txt(b.type),
        txt(b.date),
        txt(b.lot),
        txt(b.inspector),
        txt(b.item),
        txt(b.company),
        txt(b.incomingQty),
        txt(b.checkQty),
        txt(b.failQty),
        judge,
        txt(b.remark),
        JSON.stringify(items),
        sign(b.signWriter),
        sign(b.signReviewer),
        sign(b.signApprover),
      ]
    );

    ok(res, r.rows[0], '성적서가 저장되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get('/api/certificate/:type/:id', requireLogin, async (req, res) => {
  try {
    const r = await db(
      'SELECT * FROM certificates WHERE cert_type = $1 AND id = $2',
      [req.params.type, req.params.id]
    );
    if (!r.rowCount) return fail(res, 404, '성적서를 찾을 수 없습니다.');
    ok(res, r.rows[0]);
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get('/api/trace', requireLogin, async (req, res) => {
  try {
    const keyword = `%${txt(req.query.keyword).toLowerCase()}%`;

    const r = await db(
      `SELECT
         w.work_date,
         w.finished_lot,
         w.worker,
         m.seq,
         m.material,
         m.sup_name,
         m.lot_no,
         m.input_qty,
         m.input_time
       FROM worklog w
       LEFT JOIN worklog_materials m ON w.id = m.worklog_id
       WHERE LOWER(w.finished_lot) LIKE $1
          OR LOWER(m.lot_no) LIKE $1
          OR LOWER(m.material) LIKE $1
       ORDER BY w.work_date DESC, m.seq ASC`,
      [keyword]
    );

    ok(
      res,
      r.rows.map((x) => ({
        workDate: x.work_date,
        finishedLot: x.finished_lot,
        worker: x.worker,
        seq: x.seq,
        material: x.material,
        supName: x.sup_name,
        lotNo: x.lot_no,
        inputQty: x.input_qty,
        inputTime: x.input_time,
      }))
    );
  } catch (err) {
    fail(res, 500, err.message);
  }
});

/* ───────────────────────────────────────
   교육 보고서 API  /api/training
─────────────────────────────────────── */
app.get('/api/training', requireLogin, async (_req, res) => {
  try {
    const r = await db('SELECT * FROM training_reports ORDER BY created_at DESC');
    ok(res, r.rows.map(row => ({
      id: row.id,
      date: row.date,
      no: row.report_no,
      type: row.type,
      title: row.title,
      place: row.place,
      instructor: row.instructor,
      dept: row.dept,
      hours: row.hours,
      attendees: row.attendees,
      absentees: row.absentees,
      content: row.content,
      evalMethod: row.eval_method,
      result: row.result,
      remark: row.remark,
      photos: Array.isArray(row.photos) ? row.photos : [],
      signWriter: row.sign_writer,
      signReviewer: row.sign_reviewer,
      signApprover: row.sign_approver,
      createdAt: row.created_at,
    })));
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/training', requireLogin, async (req, res) => {
  try {
    const b = req.body || {};
    if (!txt(b.date) || !txt(b.title)) {
      return fail(res, 400, '교육일자와 교육명은 필수입니다.');
    }
    const r = await db(
      `INSERT INTO training_reports
        (date, report_no, type, title, place, instructor, dept, hours,
         attendees, absentees, content, eval_method, result, remark, photos,
         sign_writer, sign_reviewer, sign_approver)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING id`,
      [
        txt(b.date),
        txt(b.no || b.reportNo),
        txt(b.type),
        txt(b.title),
        txt(b.place),
        txt(b.instructor),
        txt(b.dept),
        txt(b.hours),
        txt(b.attendees),
        txt(b.absentees),
        txt(b.content),
        txt(b.evalMethod || b.eval_method),
        txt(b.result) || '완료',
        txt(b.remark),
        JSON.stringify(arr(b.photos)),
        sign(b.signWriter),
        sign(b.signReviewer),
        sign(b.signApprover),
      ]
    );
    ok(res, { id: r.rows[0].id }, '교육 보고서가 저장되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.put('/api/training/:id', requireLogin, async (req, res) => {
  try {
    const b = req.body || {};
    const r = await db(
      `UPDATE training_reports SET
        date=$1, report_no=$2, type=$3, title=$4, place=$5, instructor=$6,
        dept=$7, hours=$8, attendees=$9, absentees=$10, content=$11,
        eval_method=$12, result=$13, remark=$14, photos=$15,
        sign_writer=$16, sign_reviewer=$17, sign_approver=$18
       WHERE id=$19 RETURNING id`,
      [
        txt(b.date),
        txt(b.no || b.reportNo),
        txt(b.type),
        txt(b.title),
        txt(b.place),
        txt(b.instructor),
        txt(b.dept),
        txt(b.hours),
        txt(b.attendees),
        txt(b.absentees),
        txt(b.content),
        txt(b.evalMethod || b.eval_method),
        txt(b.result) || '완료',
        txt(b.remark),
        JSON.stringify(arr(b.photos)),
        sign(b.signWriter),
        sign(b.signReviewer),
        sign(b.signApprover),
        req.params.id,
      ]
    );
    if (!r.rowCount) return fail(res, 404, '교육 보고서를 찾을 수 없습니다.');
    ok(res, null, '수정되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.delete('/api/training/:id', requireLogin, async (req, res) => {
  try {
    const r = await db('DELETE FROM training_reports WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rowCount) return fail(res, 404, '교육 보고서를 찾을 수 없습니다.');
    ok(res, null, '삭제되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

/* ───────────────────────────────────────
   측정기 관리 API  /api/instruments
─────────────────────────────────────── */
app.get('/api/instruments', requireLogin, async (_req, res) => {
  try {
    const r = await db('SELECT * FROM instruments ORDER BY created_at ASC');
    ok(res, r.rows.map(row => ({
      id: row.id,
      no: row.no,
      name: row.name,
      model: row.model,
      maker: row.maker,
      location: row.location,
      cycle: row.cycle,
      lastCal: row.last_cal,
      nextCal: row.next_cal,
      status: row.status,
      remark: row.remark,
      photo: row.photo,
      createdAt: row.created_at,
    })));
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/instruments', requireLogin, async (req, res) => {
  try {
    const b = req.body || {};
    if (!txt(b.no) || !txt(b.name)) return fail(res, 400, '관리번호와 측정기명은 필수입니다.');
    const r = await db(
      `INSERT INTO instruments (no, name, model, maker, location, cycle, last_cal, next_cal, status, remark, photo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        txt(b.no),
        txt(b.name),
        txt(b.model),
        txt(b.maker),
        txt(b.location),
        txt(b.cycle) || '12',
        txt(b.lastCal) || null,
        txt(b.nextCal) || null,
        txt(b.status) || '정상',
        txt(b.remark),
        txt(b.photo),
      ]
    );
    ok(res, { id: r.rows[0].id }, '측정기가 저장되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.put('/api/instruments/:id', requireLogin, async (req, res) => {
  try {
    const b = req.body || {};
    if (!txt(b.no) || !txt(b.name)) return fail(res, 400, '관리번호와 측정기명은 필수입니다.');
    const r = await db(
      `UPDATE instruments SET
        no=$1, name=$2, model=$3, maker=$4, location=$5, cycle=$6,
        last_cal=$7, next_cal=$8, status=$9, remark=$10, photo=$11
       WHERE id=$12 RETURNING id`,
      [
        txt(b.no),
        txt(b.name),
        txt(b.model),
        txt(b.maker),
        txt(b.location),
        txt(b.cycle) || '12',
        txt(b.lastCal) || null,
        txt(b.nextCal) || null,
        txt(b.status) || '정상',
        txt(b.remark),
        txt(b.photo),
        req.params.id,
      ]
    );
    if (!r.rowCount) return fail(res, 404, '측정기를 찾을 수 없습니다.');
    ok(res, null, '수정되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.delete('/api/instruments/:id', requireLogin, async (req, res) => {
  try {
    const r = await db('DELETE FROM instruments WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rowCount) return fail(res, 404, '측정기를 찾을 수 없습니다.');
    ok(res, null, '삭제되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    const r = await db(`
      SELECT id, name, email, department, title, role, status, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    ok(res, r.rows);
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const name = txt(req.body.name);
    const email = txt(req.body.email).toLowerCase();
    const department = txt(req.body.department);
    const title = txt(req.body.title);
    const role = txt(req.body.role) || 'user';
    const status = txt(req.body.status) || 'APPROVED';
    const password = txt(req.body.password) || '1234';

    if (!name || !email) {
      return fail(res, 400, '성명과 이메일은 필수입니다.');
    }

    const exists = await db('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rowCount) return fail(res, 409, '이미 사용 중인 이메일입니다.');

    const hash = await bcrypt.hash(password, 10);

    const r = await db(
      `INSERT INTO users (name, email, password_hash, department, title, role, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, name, email, department, title, role, status, created_at`,
      [name, email, hash, department, title, role, status]
    );

    ok(res, r.rows[0], '회원이 추가되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const name = txt(req.body.name);
    const email = txt(req.body.email).toLowerCase();
    const department = txt(req.body.department);
    const title = txt(req.body.title);
    const role = txt(req.body.role) || 'user';
    const status = txt(req.body.status) || 'APPROVED';

    if (!name || !email) {
      return fail(res, 400, '성명과 이메일은 필수입니다.');
    }

    const dup = await db(
      'SELECT id FROM users WHERE email = $1 AND id <> $2',
      [email, req.params.id]
    );
    if (dup.rowCount) return fail(res, 409, '이미 사용 중인 이메일입니다.');

    const r = await db(
      `UPDATE users
       SET name = $1,
           email = $2,
           department = $3,
           title = $4,
           role = $5,
           status = $6
       WHERE id = $7
       RETURNING id, name, email, department, title, role, status, created_at`,
      [name, email, department, title, role, status, req.params.id]
    );

    if (!r.rowCount) return fail(res, 404, '회원을 찾을 수 없습니다.');

    if (req.session.user && req.session.user.id === req.params.id) {
      req.session.user = {
        ...req.session.user,
        name,
        email,
        department,
        title,
        role,
        status,
      };
    }

    ok(res, r.rows[0], '회원정보가 수정되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/admin/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    await db(`UPDATE users SET status = 'APPROVED' WHERE id = $1`, [req.params.id]);
    ok(res, null, '승인되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/admin/users/:id/reject', requireAdmin, async (req, res) => {
  try {
    await db(`UPDATE users SET status = 'REJECTED' WHERE id = $1`, [req.params.id]);
    ok(res, null, '반려되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    await db('DELETE FROM users WHERE id = $1', [req.params.id]);
    ok(res, null, '회원이 삭제되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/admin/delete-all', requireAdmin, async (req, res) => {
  if (txt(req.body.confirm) !== 'DELETE') {
    return fail(res, 400, '확인 문자열이 일치하지 않습니다.');
  }

  try {
    await db(`
      TRUNCATE TABLE
        certificates,
        worklog_materials,
        worklog,
        nonconform,
        suppliers,
        oqc,
        pqc,
        iqc,
        training_reports,
        instruments
      RESTART IDENTITY CASCADE
    `);
    ok(res, null, '전체 데이터가 삭제되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});


app.get('/api/audit-logs', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 200), 1000);
    const r = await db(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    ok(res, r.rows);
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get('/api/dashboard/kpi', requireLogin, async (_req, res) => {
  try {
    const [iqc, pqc, oqc, ncOpen, suppliers, instruments, training] = await Promise.all([
      db('SELECT COUNT(*)::int AS count, COALESCE(SUM(fail),0)::numeric AS fail FROM iqc'),
      db('SELECT COUNT(*)::int AS count, COALESCE(SUM(fail),0)::numeric AS fail FROM pqc'),
      db('SELECT COUNT(*)::int AS count, COALESCE(SUM(fail),0)::numeric AS fail FROM oqc'),
      db(`SELECT COUNT(*)::int AS count FROM nonconform WHERE COALESCE(status,'') <> '완결'`),
      db('SELECT COUNT(*)::int AS count FROM suppliers'),
      db(`SELECT COUNT(*)::int AS count FROM instruments WHERE status IN ('교정예정','교정초과')`),
      db('SELECT COUNT(*)::int AS count FROM training_reports'),
    ]);

    ok(res, {
      iqcCount: iqc.rows[0].count,
      pqcCount: pqc.rows[0].count,
      oqcCount: oqc.rows[0].count,
      iqcFailQty: Number(iqc.rows[0].fail || 0),
      pqcFailQty: Number(pqc.rows[0].fail || 0),
      oqcFailQty: Number(oqc.rows[0].fail || 0),
      ncrOpen: ncOpen.rows[0].count,
      supplierCount: suppliers.rows[0].count,
      instrumentDue: instruments.rows[0].count,
      trainingCount: training.rows[0].count,
    });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

bindCrud('supplier_scores', (b) => ({
  supplier_id: txt(b.supplierId) || null,
  supplier_name: txt(b.supplierName),
  score_month: txt(b.month || b.scoreMonth),
  quality_score: num(b.qualityScore) ?? 0,
  delivery_score: num(b.deliveryScore) ?? 0,
  response_score: num(b.responseScore) ?? 0,
  defect_rate: num(b.defectRate) ?? 0,
  ncr_count: num(b.ncrCount) ?? 0,
  capa_delay_count: num(b.capaDelayCount) ?? 0,
  total_score: num(b.totalScore) ?? 0,
  grade: txt(b.grade) || 'C',
  remark: txt(b.remark),
}));

bindCrud('equipments', (b) => ({
  no: txt(b.no),
  name: txt(b.name),
  maker: txt(b.maker),
  model: txt(b.model),
  location: txt(b.location),
  pm_cycle: txt(b.pmCycle) || '월간',
  last_pm: txt(b.lastPm) || null,
  next_pm: txt(b.nextPm) || null,
  status: txt(b.status) || '정상',
  remark: txt(b.remark),
}));

function mapNamoTalkMessage(row) {
  const createdAt = new Date(row.created_at);
  return {
    id: row.id,
    roomId: row.room_id,
    createdAt: createdAt.getTime(),
    sender: row.sender_name,
    dept: row.sender_dept || '',
    text: row.message_text || '',
    time: createdAt.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul',
    }),
    kind: row.message_kind || 'text',
    fileName: row.file_name || '',
    fileType: row.file_type || '',
    fileData: row.file_data || '',
    replyToId: row.reply_to_id || null,
    replySender: row.reply_sender || '',
    replyText: row.reply_text || '',
    pinned: Boolean(row.pinned),
    edited: Boolean(row.edited_at),
    deleted: Boolean(row.deleted_at),
  };
}

app.get('/api/namo-talk/messages', requireLogin, async (req, res) => {
  try {
    const roomId = txt(req.query.roomId);
    if (!roomId) return fail(res, 400, '대화방 정보가 필요합니다.');

    const r = await db(
      `SELECT id, room_id, sender_name, sender_uid, sender_dept,
              message_kind, message_text, file_name, file_type, file_data,
              reply_to_id, reply_sender, reply_text, pinned, edited_at, deleted_at, created_at
       FROM namo_talk_messages
       WHERE room_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC, id ASC
       LIMIT 2000`,
      [roomId]
    );

    ok(res, r.rows.map(mapNamoTalkMessage));
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get('/api/namo-talk/notifications', requireLogin, async (req, res) => {
  try {
    const requestedAfterId = Number(req.query.afterId);
    const cursorResult = await db('SELECT COALESCE(MAX(id), 0) AS cursor FROM namo_talk_messages');
    const currentCursor = Number(cursorResult.rows[0]?.cursor || 0);
    if (!Number.isFinite(requestedAfterId)) {
      return res.json({ success: true, message: 'OK', data: [], cursor: currentCursor });
    }
    const afterId = Math.max(0, requestedAfterId);
    const user = req.session.user;
    const userName = txt(user.name);
    const result = await db(
      `SELECT id, room_id, sender_name, sender_uid, sender_dept,
              message_kind, message_text, file_name, file_type, file_data,
              reply_to_id, reply_sender, reply_text, pinned, edited_at, deleted_at, created_at
         FROM namo_talk_messages
        WHERE id > $1 AND sender_name <> $2 AND deleted_at IS NULL
        ORDER BY id ASC
        LIMIT 30`,
      [afterId, userName]
    );
    const departmentRoom = `dept:${txt(user.department)}`;
    const visible = result.rows.filter(row => {
      if (row.room_id === '전체공지' || row.room_id === departmentRoom) return true;
      if (!String(row.room_id).startsWith('dm:')) return false;
      return String(row.room_id).slice(3).split('|').includes(userName);
    });
    const nextCursor = result.rows.length ? Number(result.rows[result.rows.length - 1].id) : afterId;
    return res.json({ success: true, message: 'OK', data: visible.map(mapNamoTalkMessage), cursor: nextCursor });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get('/api/namo-talk/presence', requireLogin, async (_req, res) => {
  try {
    const result = await db(
      `SELECT user_name, department, status, status_message, last_seen
         FROM namo_talk_presence
        ORDER BY user_name`
    );
    const now = Date.now();
    ok(res, result.rows.map(row => ({
      name: row.user_name,
      department: row.department || '',
      status: now - new Date(row.last_seen).getTime() > 120000 ? 'offline' : row.status,
      statusMessage: row.status_message || '',
      lastSeen: new Date(row.last_seen).getTime(),
    })));
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/namo-talk/presence', requireLogin, async (req, res) => {
  try {
    const user = req.session.user;
    const allowed = new Set(['online', 'away', 'busy', 'meeting', 'offline']);
    const status = allowed.has(txt(req.body?.status)) ? txt(req.body.status) : 'online';
    const statusMessage = txt(req.body?.statusMessage).slice(0, 60);
    await db(
      `INSERT INTO namo_talk_presence (user_name, department, status, status_message, last_seen)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (user_name)
       DO UPDATE SET department = EXCLUDED.department, status = EXCLUDED.status,
                     status_message = EXCLUDED.status_message, last_seen = NOW()`,
      [txt(user.name), txt(user.department), status, statusMessage]
    );
    ok(res, { name: txt(user.name), status, statusMessage }, '상태가 변경되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get('/api/namo-talk/profiles', requireLogin, async (_req, res) => {
  try {
    const result = await db(
      `SELECT user_name, avatar_type, avatar_value, updated_at
         FROM namo_talk_profiles
        ORDER BY user_name`
    );
    ok(res, result.rows.map(row => ({
      name: row.user_name,
      type: row.avatar_type,
      value: row.avatar_value,
      updatedAt: new Date(row.updated_at).getTime(),
    })));
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/namo-talk/profiles', requireLogin, async (req, res) => {
  try {
    const allowedPresets = new Set([
      'drop-blue', 'drop-purple', 'drop-mint', 'drop-pink',
      'drop-yellow', 'drop-sky', 'drop-navy', 'drop-coral',
      'drop-angry', 'drop-surprise', 'drop-laugh', 'drop-sleepy',
      'drop-curious', 'drop-cheer', 'drop-focus', 'drop-thanks',
    ]);
    const type = txt(req.body?.type);
    const value = txt(req.body?.value);
    if (!['preset', 'image'].includes(type)) return fail(res, 400, '지원하지 않는 프로필 형식입니다.');
    if (type === 'preset' && !allowedPresets.has(value)) return fail(res, 400, '프로필 캐릭터를 다시 선택해 주세요.');
    if (type === 'image' && (!value.startsWith('data:image/') || value.length > 1400000)) {
      return fail(res, 400, '프로필 이미지는 1MB 이하의 그림 파일만 사용할 수 있습니다.');
    }

    const userName = txt(req.session.user?.name);
    const result = await db(
      `INSERT INTO namo_talk_profiles (user_name, avatar_type, avatar_value, updated_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (user_name)
       DO UPDATE SET avatar_type = EXCLUDED.avatar_type,
                     avatar_value = EXCLUDED.avatar_value,
                     updated_at = NOW()
       RETURNING user_name, avatar_type, avatar_value, updated_at`,
      [userName, type, value]
    );
    const row = result.rows[0];
    ok(res, {
      name: row.user_name,
      type: row.avatar_type,
      value: row.avatar_value,
      updatedAt: new Date(row.updated_at).getTime(),
    }, '프로필을 저장했습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/namo-talk/messages', requireLogin, async (req, res) => {
  try {
    const b = req.body || {};
    const roomId = txt(b.roomId);
    const kind = txt(b.kind) || 'text';
    const allowedKinds = new Set(['text', 'notice', 'emoticon', 'sticker', 'image', 'file']);

    if (!roomId) return fail(res, 400, '대화방 정보가 필요합니다.');
    if (!allowedKinds.has(kind)) return fail(res, 400, '지원하지 않는 메시지 형식입니다.');
    if (!txt(b.text) && !txt(b.fileData)) {
      return fail(res, 400, '메시지 내용이 필요합니다.');
    }

    const user = req.session.user;
    const r = await db(
      `INSERT INTO namo_talk_messages
        (room_id, sender_name, sender_uid, sender_dept, message_kind,
         message_text, file_name, file_type, file_data,
         reply_to_id, reply_sender, reply_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, room_id, sender_name, sender_uid, sender_dept,
                 message_kind, message_text, file_name, file_type, file_data,
                 reply_to_id, reply_sender, reply_text, pinned, edited_at, deleted_at, created_at`,
      [
        roomId,
        txt(user.name) || '사용자',
        txt(user.id),
        txt(user.department),
        kind,
        txt(b.text),
        txt(b.fileName) || null,
        txt(b.fileType) || null,
        txt(b.fileData) || null,
        b.replyToId != null && Number.isInteger(Number(b.replyToId)) ? Number(b.replyToId) : null,
        txt(b.replySender).slice(0, 100),
        txt(b.replyText).slice(0, 300),
      ]
    );

    ok(res, mapNamoTalkMessage(r.rows[0]), '메시지가 전송되었습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/namo-talk/messages/:id/action', requireLogin, async (req, res) => {
  try {
    const messageId = Number(req.params.id);
    const action = txt(req.body?.action);
    if (!Number.isInteger(messageId) || messageId <= 0) {
      return fail(res, 400, '메시지 정보가 올바르지 않습니다.');
    }
    if (!['delete', 'edit', 'pin'].includes(action)) {
      return fail(res, 400, '지원하지 않는 메시지 처리입니다.');
    }

    const userName = txt(req.session.user?.name);
    const found = await db(
      `SELECT id, room_id, sender_name FROM namo_talk_messages
        WHERE id = $1 AND deleted_at IS NULL`,
      [messageId]
    );
    if (!found.rowCount) return fail(res, 404, '메시지를 찾을 수 없습니다.');
    const target = found.rows[0];
    const roomId = String(target.room_id || '');
    const departmentRoom = `dept:${txt(req.session.user?.department)}`;
    const canAccess = roomId === '전체공지'
      || roomId === departmentRoom
      || (roomId.startsWith('dm:') && roomId.slice(3).split('|').includes(userName));
    if (!canAccess) return fail(res, 403, '이 대화방의 메시지를 처리할 권한이 없습니다.');

    if (action === 'delete') {
      if (target.sender_name !== userName) return fail(res, 403, '본인이 작성한 메시지만 삭제할 수 있습니다.');
      await db('DELETE FROM namo_talk_messages WHERE id = $1', [messageId]);
      return ok(res, { id: messageId }, '메시지가 완전히 삭제되었습니다.');
    }

    if (action === 'edit') {
      if (target.sender_name !== userName) return fail(res, 403, '본인이 작성한 메시지만 수정할 수 있습니다.');
      const nextText = txt(req.body?.text);
      if (!nextText) return fail(res, 400, '수정할 메시지 내용이 필요합니다.');
      const edited = await db(
        `UPDATE namo_talk_messages SET message_text = $2, edited_at = NOW()
          WHERE id = $1
        RETURNING id, room_id, sender_name, sender_uid, sender_dept,
                  message_kind, message_text, file_name, file_type, file_data,
                  reply_to_id, reply_sender, reply_text, pinned, edited_at, deleted_at, created_at`,
        [messageId, nextText]
      );
      return ok(res, mapNamoTalkMessage(edited.rows[0]), '메시지가 수정되었습니다.');
    }

    const pinned = await db(
      `UPDATE namo_talk_messages SET pinned = $2
        WHERE id = $1
      RETURNING id, room_id, sender_name, sender_uid, sender_dept,
                message_kind, message_text, file_name, file_type, file_data,
                reply_to_id, reply_sender, reply_text, pinned, edited_at, deleted_at, created_at`,
      [messageId, Boolean(req.body?.pinned)]
    );
    return ok(res, mapNamoTalkMessage(pinned.rows[0]), pinned.rows[0].pinned ? '메시지를 고정했습니다.' : '고정을 해제했습니다.');
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get('/api/namo-talk/reads', requireLogin, async (req, res) => {
  try {
    const roomId = txt(req.query.roomId);
    if (!roomId) return fail(res, 400, '대화방 정보가 필요합니다.');

    const r = await db(
      `SELECT room_id, user_uid, user_name, last_read_at
       FROM namo_talk_reads
       WHERE room_id = $1
       ORDER BY last_read_at DESC`,
      [roomId]
    );

    ok(res, r.rows.map(row => ({
      roomId: row.room_id,
      userUid: row.user_uid,
      userName: row.user_name,
      readAt: new Date(row.last_read_at).getTime(),
    })));
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.post('/api/namo-talk/reads', requireLogin, async (req, res) => {
  try {
    const roomId = txt(req.body?.roomId);
    if (!roomId) return fail(res, 400, '대화방 정보가 필요합니다.');

    const user = req.session.user;
    const userUid = txt(user.uid || user.id);
    const userName = txt(user.name);
    const r = await db(
      `INSERT INTO namo_talk_reads (room_id, user_uid, user_name, last_read_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (room_id, user_uid)
       DO UPDATE SET user_name = EXCLUDED.user_name, last_read_at = NOW()
       RETURNING room_id, user_uid, user_name, last_read_at`,
      [roomId, userUid, userName]
    );
    const row = r.rows[0];

    ok(res, {
      roomId: row.room_id,
      userUid: row.user_uid,
      userName: row.user_name,
      readAt: new Date(row.last_read_at).getTime(),
    });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get('/api/backup', requireLogin, async (_req, res) => {
  try {
    const [iqc, pqc, oqc, suppliers, nonconform, worklog, certificates, training, instruments, supplierScores, equipments, purchaseOrders, purchaseReceipts, auditLogs] = await Promise.all([
      db('SELECT * FROM iqc ORDER BY created_at DESC'),
      db('SELECT * FROM pqc ORDER BY created_at DESC'),
      db('SELECT * FROM oqc ORDER BY created_at DESC'),
      db('SELECT * FROM suppliers ORDER BY created_at DESC'),
      db('SELECT * FROM nonconform ORDER BY created_at DESC'),
      db('SELECT * FROM worklog ORDER BY created_at DESC'),
      db('SELECT * FROM certificates ORDER BY created_at DESC'),
      db('SELECT * FROM training_reports ORDER BY created_at DESC'),
      db('SELECT * FROM instruments ORDER BY created_at ASC'),
      db('SELECT * FROM supplier_scores ORDER BY created_at DESC'),
      db('SELECT * FROM equipments ORDER BY created_at DESC'),
      db('SELECT * FROM purchase_orders ORDER BY created_at DESC'),
      db('SELECT * FROM purchase_receipts ORDER BY created_at DESC'),
      db('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1000'),
    ]);

    const payload = {
      iqc: iqc.rows,
      pqc: pqc.rows,
      oqc: oqc.rows,
      suppliers: suppliers.rows,
      nonconform: nonconform.rows,
      worklog: worklog.rows,
      certificates: certificates.rows,
      training: training.rows,
      instruments: instruments.rows,
      supplierScores: supplierScores.rows,
      equipments: equipments.rows,
      purchaseOrders: purchaseOrders.rows,
      purchaseReceipts: purchaseReceipts.rows,
      auditLogs: auditLogs.rows,
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="qms-backup.json"');
    res.send(JSON.stringify(payload, null, 2));
  } catch (err) {
    fail(res, 500, err.message);
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureSchema()
  .then(async () => {
    await ensurePurchaseHistory();

    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = String(process.env.ADMIN_PASSWORD || '');

    if (adminEmail && adminPassword) {

    const existing = await db('SELECT id FROM users WHERE email = $1', [adminEmail]);
    const hash = await bcrypt.hash(adminPassword, 10);

    if (!existing.rowCount) {
      await db(
        `INSERT INTO users (name, email, password_hash, department, title, role, status, uid)
         VALUES ($1,$2,$3,$4,$5,'admin','APPROVED',$6)`,
        ['관리자', adminEmail, hash, '관리부', '관리자', 'U-0001']
      );
    } else {
      // 관리자 권한 403 방지:
      // 서버 시작 시 ADMIN_EMAIL 계정을 항상 관리자(admin)로 고정하고,
      // .env의 ADMIN_PASSWORD 값으로 비밀번호도 동기화합니다.
      await db(
        `UPDATE users
         SET password_hash = $1,
             name = $2,
             department = $3,
             title = $4,
             role = 'admin',
             status = 'APPROVED',
             uid = $5
         WHERE email = $6`,
        [hash, '관리자', '관리부', '관리자', 'U-0001', adminEmail]
      );
    }

    }

    const defaultUsers = [
      ['U-0002', '김종혁', '대표', '대표이사'],
      ['U-0003', '김세희', '연구소', '이사'],
      ['U-0004', '정영기', '연구소', '이사'],
      ['U-0005', '박지헌', '연구소', '연구원'],
      ['U-0006', '박도훈', '생산부', '대리'],
      ['U-0007', '문지훈', '생산부', '주임'],
      ['U-0008', '김현진', '영업부', '과장'],
      ['U-0009', '임흥배', '품질부', '부장'],
      ['U-0010', '박현아', '품질부', '사원'],
    ];
    const defaultPassword = String(process.env.DEFAULT_USER_PASSWORD || '');

    if (defaultPassword) {
      const defaultHash = await bcrypt.hash(defaultPassword, 10);

      for (const [uid, name, department, title] of defaultUsers) {
      const found = await db('SELECT id FROM users WHERE name = $1 OR uid = $2 LIMIT 1', [name, uid]);
      if (found.rowCount) {
        await db(
          `UPDATE users
           SET uid = $1,
               department = CASE WHEN COALESCE(department, '') = '' THEN $2 ELSE department END,
               title = CASE WHEN COALESCE(title, '') = '' THEN $3 ELSE title END,
               status = 'APPROVED'
           WHERE id = $4`,
          [uid, department, title, found.rows[0].id]
        );
      } else {
        await db(
          `INSERT INTO users
            (name, email, password_hash, department, title, role, status, uid, must_change_password)
           VALUES ($1,$2,$3,$4,$5,'user','APPROVED',$6,TRUE)`,
          [name, `${uid.toLowerCase()}@namochemical.local`, defaultHash, department, title, uid]
        );
      }
    }

    }

    app.listen(port, () => {
      console.log(`QMS server listening on ${port} (Asia/Seoul)`);
    });
  })
  .catch((err) => {
    console.error('Schema initialization failed:', err);
    process.exit(1);
  });
