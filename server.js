require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const SQLiteStoreFactory = require('connect-sqlite3');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = Number(process.env.PORT || 3000);

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'fallback-secret';

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || 'admin@namochemical.com';

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || 'Admin1234!';

const SMTP_HOST =
  process.env.SMTP_HOST || 'smtp.naver.com';

const SMTP_PORT =
  Number(process.env.SMTP_PORT || 465);

const SMTP_SECURE =
  String(process.env.SMTP_SECURE) === 'true';

const EMAIL_USER =
  process.env.EMAIL_USER || '';

const EMAIL_PASS =
  process.env.EMAIL_PASS || '';

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'namochemical.db');
const db = new sqlite3.Database(DB_PATH);
const SQLiteStore = SQLiteStoreFactory(session);

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: DATA_DIR
  }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 8
  }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function nowDateTime() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function todayDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeRole(role) {
  return String(role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user';
}

async function logChange(message, userId = null) {
  await run(
    `INSERT INTO change_logs (logDate, message, userId, createdAt)
     VALUES (?, ?, ?, ?)`,
    [todayDate(), message, userId, nowDateTime()]
  );
}

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }
  next();
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      department TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'PENDING',
      createdAt TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      manager TEXT,
      phone TEXT,
      category TEXT,
      status TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS iqc (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      lot TEXT NOT NULL,
      supplier TEXT,
      item TEXT,
      inspector TEXT,
      qty REAL DEFAULT 0,
      fail REAL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS ipqc (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      product TEXT,
      lot TEXT NOT NULL,
      visual TEXT,
      viscosity TEXT,
      solid TEXT,
      particle TEXT,
      qty REAL DEFAULT 0,
      fail REAL DEFAULT 0,
      judge TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS oqc (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      customer TEXT,
      product TEXT,
      lot TEXT NOT NULL,
      visual TEXT,
      viscosity TEXT,
      solid TEXT,
      particle TEXT,
      adhesion TEXT,
      resistance TEXT,
      swelling TEXT,
      moisture TEXT,
      qty REAL DEFAULT 0,
      fail REAL DEFAULT 0,
      judge TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS worklog (
      id TEXT PRIMARY KEY,
      workDate TEXT NOT NULL,
      finishedLot TEXT,
      seq TEXT,
      material TEXT,
      supName TEXT,
      inputQty TEXT,
      inputRatio TEXT,
      lotNo TEXT,
      inputTime TEXT,
      worker TEXT,
      note TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS nonconform (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT,
      lot TEXT,
      item TEXT,
      issue TEXT,
      cause TEXT,
      action TEXT,
      owner TEXT,
      status TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS change_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      logDate TEXT NOT NULL,
      message TEXT NOT NULL,
      userId TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  const admin = await get(`SELECT * FROM users WHERE email = ?`, [ADMIN_EMAIL]);
if (!admin) {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await run(
      `INSERT INTO users (id, name, email, passwordHash, department, role, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `user_${Date.now()}`,
        '관리자',
        ADMIN_EMAIL,
        passwordHash,
        '관리팀',
        'admin',
        'APPROVED',
        nowDateTime()
      ]
    );
    await logChange('기본 관리자 계정 생성');
  }
}

/* auth */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const department = String(req.body.department || '').trim();

    if (!name) return res.status(400).json({ error: '이름을 입력하세요.' });
    if (!email) return res.status(400).json({ error: '이메일을 입력하세요.' });
    if (password.length < 8) return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });

    const exists = await get(`SELECT id FROM users WHERE email = ?`, [email]);
    if (exists) return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const id = `user_${Date.now()}`;

    await run(
      `INSERT INTO users (id, name, email, passwordHash, department, role, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, passwordHash, department, 'user', 'PENDING', nowDateTime()]
    );

    await logChange(`회원가입 신청: ${name} (${email})`, id);
    res.json({ message: '회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력하세요.' });
    }

    const user = await get(`SELECT * FROM users WHERE email = ?`, [email]);
    if (!user) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    if (user.status !== 'APPROVED') {
      return res.status(403).json({ error: '관리자 승인 후 로그인 가능합니다.' });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role)
    };

    await logChange(`로그인: ${user.name} (${user.email})`, user.id);
    res.json({ message: '로그인 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
  }
});

app.post('/api/auth/logout', requireLogin, async (req, res) => {
  try {
    const user = req.session.user;
    await logChange(`로그아웃: ${user.name} (${user.email})`, user.id);
    req.session.destroy(() => {
      res.json({ message: '로그아웃되었습니다.' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '로그아웃 처리 중 오류가 발생했습니다.' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: '비로그인 상태입니다.' });
    }
    const user = await get(
      `SELECT id, name, email, department, role, status, createdAt FROM users WHERE id = ?`,
      [req.session.user.id]
    );
    if (!user) return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '사용자 조회 중 오류가 발생했습니다.' });
  }
});

/* admin */
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const rows = await all(
      `SELECT id, name, email, department, role, status, createdAt
       FROM users
       ORDER BY datetime(createdAt) DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '회원 목록 조회 실패' });
  }
});

app.post('/api/admin/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    const target = await get(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
    if (!target) return res.status(404).json({ error: '회원을 찾을 수 없습니다.' });

    await run(`UPDATE users SET status = 'APPROVED' WHERE id = ?`, [req.params.id]);
    await logChange(`회원 승인: ${target.name} (${target.email})`, req.session.user.id);

    res.json({ message: '회원 승인이 완료되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '회원 승인 실패' });
  }
});

app.post('/api/admin/users/:id/reject', requireAdmin, async (req, res) => {
  try {
    const target = await get(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
    if (!target) return res.status(404).json({ error: '회원을 찾을 수 없습니다.' });

    await run(`UPDATE users SET status = 'REJECTED' WHERE id = ?`, [req.params.id]);
    await logChange(`회원 반려: ${target.name} (${target.email})`, req.session.user.id);

    res.json({ message: '회원 반려가 완료되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '회원 반려 실패' });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const target = await get(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
    if (!target) return res.status(404).json({ error: '회원을 찾을 수 없습니다.' });

    if (target.role === 'admin' && target.email === ADMIN_EMAIL) {
      return res.status(400).json({ error: '기본 관리자 계정은 삭제할 수 없습니다.' });
    }

    await run(`DELETE FROM users WHERE id = ?`, [req.params.id]);
    await logChange(`회원 삭제: ${target.name} (${target.email})`, req.session.user.id);

    res.json({ message: '회원 삭제가 완료되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '회원 삭제 실패' });
  }
});

app.post('/api/admin/delete-all', requireAdmin, async (req, res) => {
  try {
    if (req.body.confirm !== 'DELETE') {
      return res.status(400).json({ error: '확인 값이 올바르지 않습니다.' });
    }

    await run(`DELETE FROM suppliers`);
    await run(`DELETE FROM iqc`);
    await run(`DELETE FROM ipqc`);
    await run(`DELETE FROM oqc`);
    await run(`DELETE FROM worklog`);
    await run(`DELETE FROM nonconform`);
    await run(`DELETE FROM change_logs`);

    await logChange('전체 데이터 삭제 실행', req.session.user.id);
    res.json({ message: '전체 데이터 삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '전체 데이터 삭제 실패' });
  }
});

/* suppliers */
app.get('/api/suppliers', requireLogin, async (req, res) => {
  try {
    const rows = await all(`SELECT * FROM suppliers ORDER BY datetime(createdAt) DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '공급업체 조회 실패' });
  }
});

app.post('/api/suppliers', requireLogin, async (req, res) => {
  try {
    const now = nowDateTime();
    const id = `sup_${Date.now()}`;
    const payload = {
      name: String(req.body.name || '').trim(),
      manager: String(req.body.manager || '').trim(),
      phone: String(req.body.phone || '').trim(),
      category: String(req.body.category || '').trim(),
      status: String(req.body.status || '사용').trim()
    };

    if (!payload.name) return res.status(400).json({ error: '공급업체명을 입력하세요.' });

    await run(
      `INSERT INTO suppliers (id, name, manager, phone, category, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, payload.name, payload.manager, payload.phone, payload.category, payload.status, now, now]
    );

    await logChange(`공급업체 등록: ${payload.name}`, req.session.user.id);
    res.json({ message: '저장 완료', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '공급업체 저장 실패' });
  }
});

app.put('/api/suppliers/:id', requireLogin, async (req, res) => {
  try {
    await run(
      `UPDATE suppliers
       SET name = ?, manager = ?, phone = ?, category = ?, status = ?, updatedAt = ?
       WHERE id = ?`,
      [
        String(req.body.name || '').trim(),
        String(req.body.manager || '').trim(),
        String(req.body.phone || '').trim(),
        String(req.body.category || '').trim(),
        String(req.body.status || '사용').trim(),
        nowDateTime(),
        req.params.id
      ]
    );
    res.json({ message: '수정 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '공급업체 수정 실패' });
  }
});

app.delete('/api/suppliers/:id', requireLogin, async (req, res) => {
  try {
    await run(`DELETE FROM suppliers WHERE id = ?`, [req.params.id]);
    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '공급업체 삭제 실패' });
  }
});

/* iqc */
app.get('/api/iqc', requireLogin, async (req, res) => {
  try {
    const rows = await all(`SELECT * FROM iqc ORDER BY date DESC, datetime(createdAt) DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'IQC 조회 실패' });
  }
});

app.post('/api/iqc', requireLogin, async (req, res) => {
  try {
    const now = nowDateTime();
    const id = `iqc_${Date.now()}`;
    await run(
      `INSERT INTO iqc (id, date, lot, supplier, item, inspector, qty, fail, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        String(req.body.date || '').trim(),
        String(req.body.lot || '').trim(),
        String(req.body.supplier || '').trim(),
        String(req.body.item || '').trim(),
        String(req.body.inspector || '').trim(),
        Number(req.body.qty || 0),
        Number(req.body.fail || 0),
        now,
        now
      ]
    );
    res.json({ message: '저장 완료', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'IQC 저장 실패' });
  }
});

app.put('/api/iqc/:id', requireLogin, async (req, res) => {
  try {
    await run(
      `UPDATE iqc
       SET date = ?, lot = ?, supplier = ?, item = ?, inspector = ?, qty = ?, fail = ?, updatedAt = ?
       WHERE id = ?`,
      [
        String(req.body.date || '').trim(),
        String(req.body.lot || '').trim(),
        String(req.body.supplier || '').trim(),
        String(req.body.item || '').trim(),
        String(req.body.inspector || '').trim(),
        Number(req.body.qty || 0),
        Number(req.body.fail || 0),
        nowDateTime(),
        req.params.id
      ]
    );
    res.json({ message: '수정 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'IQC 수정 실패' });
  }
});

app.delete('/api/iqc/:id', requireLogin, async (req, res) => {
  try {
    await run(`DELETE FROM iqc WHERE id = ?`, [req.params.id]);
    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'IQC 삭제 실패' });
  }
});

/* ipqc */
app.get('/api/ipqc', requireLogin, async (req, res) => {
  try {
    const rows = await all(`SELECT * FROM ipqc ORDER BY date DESC, datetime(createdAt) DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'IPQC 조회 실패' });
  }
});

app.post('/api/ipqc', requireLogin, async (req, res) => {
  try {
    const now = nowDateTime();
    const id = `ipqc_${Date.now()}`;
    await run(
      `INSERT INTO ipqc (id, date, product, lot, visual, viscosity, solid, particle, qty, fail, judge, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        String(req.body.date || '').trim(),
        String(req.body.product || '').trim(),
        String(req.body.lot || '').trim(),
        String(req.body.visual || '').trim(),
        String(req.body.viscosity || '').trim(),
        String(req.body.solid || '').trim(),
        String(req.body.particle || '').trim(),
        Number(req.body.qty || 0),
        Number(req.body.fail || 0),
        String(req.body.judge || '').trim(),
        now,
        now
      ]
    );
    res.json({ message: '저장 완료', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'IPQC 저장 실패' });
  }
});

app.put('/api/ipqc/:id', requireLogin, async (req, res) => {
  try {
    await run(
      `UPDATE ipqc
       SET date = ?, product = ?, lot = ?, visual = ?, viscosity = ?, solid = ?, particle = ?, qty = ?, fail = ?, judge = ?, updatedAt = ?
       WHERE id = ?`,
      [
        String(req.body.date || '').trim(),
        String(req.body.product || '').trim(),
        String(req.body.lot || '').trim(),
        String(req.body.visual || '').trim(),
        String(req.body.viscosity || '').trim(),
        String(req.body.solid || '').trim(),
        String(req.body.particle || '').trim(),
        Number(req.body.qty || 0),
        Number(req.body.fail || 0),
        String(req.body.judge || '').trim(),
        nowDateTime(),
        req.params.id
      ]
    );
    res.json({ message: '수정 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'IPQC 수정 실패' });
  }
});

app.delete('/api/ipqc/:id', requireLogin, async (req, res) => {
  try {
    await run(`DELETE FROM ipqc WHERE id = ?`, [req.params.id]);
    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'IPQC 삭제 실패' });
  }
});

/* oqc */
app.get('/api/oqc', requireLogin, async (req, res) => {
  try {
    const rows = await all(`SELECT * FROM oqc ORDER BY date DESC, datetime(createdAt) DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OQC 조회 실패' });
  }
});

app.post('/api/oqc', requireLogin, async (req, res) => {
  try {
    const now = nowDateTime();
    const id = `oqc_${Date.now()}`;
    await run(
      `INSERT INTO oqc (id, date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        String(req.body.date || '').trim(),
        String(req.body.customer || '').trim(),
        String(req.body.product || '').trim(),
        String(req.body.lot || '').trim(),
        String(req.body.visual || '').trim(),
        String(req.body.viscosity || '').trim(),
        String(req.body.solid || '').trim(),
        String(req.body.particle || '').trim(),
        String(req.body.adhesion || '').trim(),
        String(req.body.resistance || '').trim(),
        String(req.body.swelling || '').trim(),
        String(req.body.moisture || '').trim(),
        Number(req.body.qty || 0),
        Number(req.body.fail || 0),
        String(req.body.judge || '').trim(),
        now,
        now
      ]
    );
    res.json({ message: '저장 완료', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OQC 저장 실패' });
  }
});

app.put('/api/oqc/:id', requireLogin, async (req, res) => {
  try {
    await run(
      `UPDATE oqc
       SET date = ?, customer = ?, product = ?, lot = ?, visual = ?, viscosity = ?, solid = ?, particle = ?, adhesion = ?, resistance = ?, swelling = ?, moisture = ?, qty = ?, fail = ?, judge = ?, updatedAt = ?
       WHERE id = ?`,
      [
        String(req.body.date || '').trim(),
        String(req.body.customer || '').trim(),
        String(req.body.product || '').trim(),
        String(req.body.lot || '').trim(),
        String(req.body.visual || '').trim(),
        String(req.body.viscosity || '').trim(),
        String(req.body.solid || '').trim(),
        String(req.body.particle || '').trim(),
        String(req.body.adhesion || '').trim(),
        String(req.body.resistance || '').trim(),
        String(req.body.swelling || '').trim(),
        String(req.body.moisture || '').trim(),
        Number(req.body.qty || 0),
        Number(req.body.fail || 0),
        String(req.body.judge || '').trim(),
        nowDateTime(),
        req.params.id
      ]
    );
    res.json({ message: '수정 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OQC 수정 실패' });
  }
});

app.delete('/api/oqc/:id', requireLogin, async (req, res) => {
  try {
    await run(`DELETE FROM oqc WHERE id = ?`, [req.params.id]);
    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OQC 삭제 실패' });
  }
});

/* worklog */
app.get('/api/worklog', requireLogin, async (req, res) => {
  try {
    const rows = await all(`SELECT * FROM worklog ORDER BY workDate DESC, datetime(createdAt) DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '작업일지 조회 실패' });
  }
});

app.post('/api/worklog', requireLogin, async (req, res) => {
  try {
    const now = nowDateTime();
    const id = `work_${Date.now()}`;
    await run(
      `INSERT INTO worklog (id, workDate, finishedLot, seq, material, supName, inputQty, inputRatio, lotNo, inputTime, worker, note, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        String(req.body.workDate || '').trim(),
        String(req.body.finishedLot || '').trim(),
        String(req.body.seq || '').trim(),
        String(req.body.material || '').trim(),
        String(req.body.supName || '').trim(),
        String(req.body.inputQty || '').trim(),
        String(req.body.inputRatio || '').trim(),
        String(req.body.lotNo || '').trim(),
        String(req.body.inputTime || '').trim(),
        String(req.body.worker || '').trim(),
        String(req.body.note || '').trim(),
        now,
        now
      ]
    );
    res.json({ message: '저장 완료', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '작업일지 저장 실패' });
  }
});

app.put('/api/worklog/:id', requireLogin, async (req, res) => {
  try {
    await run(
      `UPDATE worklog
       SET workDate = ?, finishedLot = ?, seq = ?, material = ?, supName = ?, inputQty = ?, inputRatio = ?, lotNo = ?, inputTime = ?, worker = ?, note = ?, updatedAt = ?
       WHERE id = ?`,
      [
        String(req.body.workDate || '').trim(),
        String(req.body.finishedLot || '').trim(),
        String(req.body.seq || '').trim(),
        String(req.body.material || '').trim(),
        String(req.body.supName || '').trim(),
        String(req.body.inputQty || '').trim(),
        String(req.body.inputRatio || '').trim(),
        String(req.body.lotNo || '').trim(),
        String(req.body.inputTime || '').trim(),
        String(req.body.worker || '').trim(),
        String(req.body.note || '').trim(),
        nowDateTime(),
        req.params.id
      ]
    );
    res.json({ message: '수정 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '작업일지 수정 실패' });
  }
});

app.delete('/api/worklog/:id', requireLogin, async (req, res) => {
  try {
    await run(`DELETE FROM worklog WHERE id = ?`, [req.params.id]);
    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '작업일지 삭제 실패' });
  }
});

/* nonconform */
app.get('/api/nonconform', requireLogin, async (req, res) => {
  try {
    const rows = await all(`SELECT * FROM nonconform ORDER BY date DESC, datetime(createdAt) DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '부적합 조회 실패' });
  }
});

app.post('/api/nonconform', requireLogin, async (req, res) => {
  try {
    const now = nowDateTime();
    const id = String(req.body.id || `nc_${Date.now()}`);
    await run(
      `INSERT INTO nonconform (id, date, type, lot, item, issue, cause, action, owner, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        String(req.body.date || '').trim(),
        String(req.body.type || '').trim(),
        String(req.body.lot || '').trim(),
        String(req.body.item || '').trim(),
        String(req.body.issue || '').trim(),
        String(req.body.cause || '').trim(),
        String(req.body.action || '').trim(),
        String(req.body.owner || '').trim(),
        String(req.body.status || '대기').trim(),
        now,
        now
      ]
    );
    res.json({ message: '저장 완료', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '부적합 저장 실패' });
  }
});

app.put('/api/nonconform/:id', requireLogin, async (req, res) => {
  try {
    await run(
      `UPDATE nonconform
       SET date = ?, type = ?, lot = ?, item = ?, issue = ?, cause = ?, action = ?, owner = ?, status = ?, updatedAt = ?
       WHERE id = ?`,
      [
        String(req.body.date || '').trim(),
        String(req.body.type || '').trim(),
        String(req.body.lot || '').trim(),
        String(req.body.item || '').trim(),
        String(req.body.issue || '').trim(),
        String(req.body.cause || '').trim(),
        String(req.body.action || '').trim(),
        String(req.body.owner || '').trim(),
        String(req.body.status || '대기').trim(),
        nowDateTime(),
        req.params.id
      ]
    );
    res.json({ message: '수정 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '부적합 수정 실패' });
  }
});

app.delete('/api/nonconform/:id', requireLogin, async (req, res) => {
  try {
    await run(`DELETE FROM nonconform WHERE id = ?`, [req.params.id]);
    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '부적합 삭제 실패' });
  }
});

/* change logs */
app.get('/api/change-logs', requireLogin, async (req, res) => {
  try {
    const rows = await all(`SELECT id, logDate, message, userId, createdAt FROM change_logs ORDER BY id DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '변경이력 조회 실패' });
  }
});

/* import */
app.post('/api/import/preview', requireLogin, async (req, res) => {
  try {
    const iqcRows = Array.isArray(req.body.iqcRows) ? req.body.iqcRows : [];
    const ipqcRows = Array.isArray(req.body.ipqcRows) ? req.body.ipqcRows : [];
    const oqcRows = Array.isArray(req.body.oqcRows) ? req.body.oqcRows : [];
    const supplierRows = Array.isArray(req.body.supplierRows) ? req.body.supplierRows : [];
    const worklogRows = Array.isArray(req.body.worklogRows) ? req.body.worklogRows : [];

    const total = iqcRows.length + ipqcRows.length + oqcRows.length + supplierRows.length + worklogRows.length;

    res.json({
      message: '미리보기 완료',
      totalRows: total,
      summary: {
        iqc: iqcRows.length,
        ipqc: ipqcRows.length,
        oqc: oqcRows.length,
        suppliers: supplierRows.length,
        worklog: worklogRows.length
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '엑셀 미리보기 실패' });
  }
});

app.post('/api/import/commit', requireLogin, async (req, res) => {
  try {
    const iqcRows = Array.isArray(req.body.iqcRows) ? req.body.iqcRows : [];
    const ipqcRows = Array.isArray(req.body.ipqcRows) ? req.body.ipqcRows : [];
    const oqcRows = Array.isArray(req.body.oqcRows) ? req.body.oqcRows : [];
    const supplierRows = Array.isArray(req.body.supplierRows) ? req.body.supplierRows : [];
    const worklogRows = Array.isArray(req.body.worklogRows) ? req.body.worklogRows : [];
    const now = nowDateTime();

    await run('BEGIN TRANSACTION');

    for (const r of supplierRows) {
      const id = r.id || `sup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await run(
        `INSERT OR REPLACE INTO suppliers (id, name, manager, phone, category, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT createdAt FROM suppliers WHERE id = ?), ?), ?)`,
        [
          id,
          String(r.name || '').trim(),
          String(r.manager || '').trim(),
          String(r.phone || '').trim(),
          String(r.category || '').trim(),
          String(r.status || '사용').trim(),
          id,
          now,
          now
        ]
      );
    }

    for (const r of iqcRows) {
      const id = r.id || `iqc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await run(
        `INSERT OR REPLACE INTO iqc (id, date, lot, supplier, item, inspector, qty, fail, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT createdAt FROM iqc WHERE id = ?), ?), ?)`,
        [
          id,
          String(r.date || '').trim(),
          String(r.lot || '').trim(),
          String(r.supplier || '').trim(),
          String(r.item || '').trim(),
          String(r.inspector || '').trim(),
          Number(r.qty || 0),
          Number(r.fail || 0),
          id,
          now,
          now
        ]
      );
    }

    for (const r of ipqcRows) {
      const id = r.id || `ipqc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await run(
        `INSERT OR REPLACE INTO ipqc (id, date, product, lot, visual, viscosity, solid, particle, qty, fail, judge, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT createdAt FROM ipqc WHERE id = ?), ?), ?)`,
        [
          id,
          String(r.date || '').trim(),
          String(r.product || '').trim(),
          String(r.lot || '').trim(),
          String(r.visual || '').trim(),
          String(r.viscosity || '').trim(),
          String(r.solid || '').trim(),
          String(r.particle || '').trim(),
          Number(r.qty || 0),
          Number(r.fail || 0),
          String(r.judge || '').trim(),
          id,
          now,
          now
        ]
      );
    }

    for (const r of oqcRows) {
      const id = r.id || `oqc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await run(
        `INSERT OR REPLACE INTO oqc (id, date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT createdAt FROM oqc WHERE id = ?), ?), ?)`,
        [
          id,
          String(r.date || '').trim(),
          String(r.customer || '').trim(),
          String(r.product || '').trim(),
          String(r.lot || '').trim(),
          String(r.visual || '').trim(),
          String(r.viscosity || '').trim(),
          String(r.solid || '').trim(),
          String(r.particle || '').trim(),
          String(r.adhesion || '').trim(),
          String(r.resistance || '').trim(),
          String(r.swelling || '').trim(),
          String(r.moisture || '').trim(),
          Number(r.qty || 0),
          Number(r.fail || 0),
          String(r.judge || '').trim(),
          id,
          now,
          now
        ]
      );
    }

    for (const r of worklogRows) {
      const id = r.id || `work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await run(
        `INSERT OR REPLACE INTO worklog (id, workDate, finishedLot, seq, material, supName, inputQty, inputRatio, lotNo, inputTime, worker, note, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT createdAt FROM worklog WHERE id = ?), ?), ?)`,
        [
          id,
          String(r.workDate || '').trim(),
          String(r.finishedLot || '').trim(),
          String(r.seq || '').trim(),
          String(r.material || '').trim(),
          String(r.supName || '').trim(),
          String(r.inputQty || '').trim(),
          String(r.inputRatio || '').trim(),
          String(r.lotNo || '').trim(),
          String(r.inputTime || '').trim(),
          String(r.worker || '').trim(),
          String(r.note || '').trim(),
          id,
          now,
          now
        ]
      );
    }

    await run('COMMIT');
    await logChange(`엑셀 반영: ${req.body.fileName || '업로드 파일'}`, req.session.user.id);

    res.json({ message: '엑셀 반영 완료' });
  } catch (err) {
    console.error(err);
    try { await run('ROLLBACK'); } catch {}
    res.status(500).json({ error: '엑셀 반영 실패' });
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API 경로를 찾을 수 없습니다.' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`서버 실행: http://localhost:${PORT}`);
      console.log(`기본 관리자 이메일: ${ADMIN_EMAIL}`);
    });
  })
  .catch(err => {
    console.error('DB init failed:', err);
    process.exit(1);
  });
