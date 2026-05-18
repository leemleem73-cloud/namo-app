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
      secure: false,
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
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    title: user.title || '',
    status: user.status,
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
  `);

  await db(`
    ALTER TABLE users ALTER COLUMN status SET DEFAULT 'APPROVED';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';

    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS items_json JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS sign_writer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS sign_reviewer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE iqc ADD COLUMN IF NOT EXISTS sign_approver JSONB DEFAULT '{}'::jsonb;

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

    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS sign_writer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS sign_reviewer JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS sign_approver JSONB DEFAULT '{}'::jsonb;
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
    const email = txt(req.body.email).toLowerCase();
    const password = txt(req.body.password);

    const r = await db('SELECT * FROM users WHERE email = $1', [email]);
    if (!r.rowCount) return fail(res, 401, '이메일 또는 비밀번호가 올바르지 않습니다.');

    const user = r.rows[0];
    const matched = await bcrypt.compare(password, user.password_hash);
    if (!matched) return fail(res, 401, '이메일 또는 비밀번호가 올바르지 않습니다.');
    if (user.status !== 'APPROVED') return fail(res, 403, '승인된 계정만 로그인할 수 있습니다.');

    req.session.user = buildSessionUser(user);

    ok(res, { user: req.session.user }, '로그인 성공');
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

      ok(res, r.rows[0], '저장되었습니다.');
    } catch (err) {
      fail(res, 500, err.message);
    }
  });

  app.put(`/api/${table}/:id`, requireLogin, async (req, res) => {
    try {
      const body = mapper(req.body);
      const keys = Object.keys(body);
      const vals = Object.values(body);
      const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

      const r = await db(
        `UPDATE ${table} SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
        [...vals, req.params.id]
      );

      if (!r.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');
      ok(res, r.rows[0], '수정되었습니다.');
    } catch (err) {
      fail(res, 500, err.message);
    }
  });

  app.delete(`/api/${table}/:id`, requireLogin, async (req, res) => {
    try {
      const r = await db(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [req.params.id]);
      if (!r.rowCount) return fail(res, 404, '데이터를 찾을 수 없습니다.');
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

app.get('/api/backup', requireLogin, async (_req, res) => {
  try {
    const [iqc, pqc, oqc, suppliers, nonconform, worklog, certificates, training, instruments] = await Promise.all([
      db('SELECT * FROM iqc ORDER BY created_at DESC'),
      db('SELECT * FROM pqc ORDER BY created_at DESC'),
      db('SELECT * FROM oqc ORDER BY created_at DESC'),
      db('SELECT * FROM suppliers ORDER BY created_at DESC'),
      db('SELECT * FROM nonconform ORDER BY created_at DESC'),
      db('SELECT * FROM worklog ORDER BY created_at DESC'),
      db('SELECT * FROM certificates ORDER BY created_at DESC'),
      db('SELECT * FROM training_reports ORDER BY created_at DESC'),
      db('SELECT * FROM instruments ORDER BY created_at ASC'),
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
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@namochemical.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234!';

    const existing = await db('SELECT id FROM users WHERE email = $1', [adminEmail]);
    const hash = await bcrypt.hash(adminPassword, 10);

    if (!existing.rowCount) {
      await db(
        `INSERT INTO users (name, email, password_hash, department, title, role, status)
         VALUES ($1,$2,$3,$4,$5,'admin','APPROVED')`,
        ['관리자', adminEmail, hash, '관리부', '관리자']
      );
    } else {
      await db(
        `UPDATE users
         SET password_hash = $1,
             name = $2,
             department = $3,
             title = $4,
             role = 'admin',
             status = 'APPROVED'
         WHERE email = $5`,
        [hash, '관리자', '관리부', '관리자', adminEmail]
      );
    }

    app.listen(port, () => {
      console.log(`QMS server listening on ${port} (Asia/Seoul)`);
    });
  })
  .catch((err) => {
    console.error('Schema initialization failed:', err);
    process.exit(1);
  });
