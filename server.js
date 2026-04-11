const fs = require('fs');
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'namochemical-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: process.env.RENDER ? 'none' : 'lax',
      secure: !!process.env.RENDER,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use(express.static(__dirname));

// =============================
// DB 경로 설정
// =============================
function resolveDbPath() {
  if (process.env.DB_PATH && process.env.DB_PATH.trim() !== '') {
    return process.env.DB_PATH.trim();
  }

  if (process.env.RENDER) {
    return '/tmp/quality.db';
  }

  return path.join(__dirname, 'quality.db');
}

const dbPath = resolveDbPath();
const dbDir = path.dirname(dbPath);

try {
  fs.mkdirSync(dbDir, { recursive: true });
} catch (err) {
  console.error('DB 디렉토리 생성 실패:', err.message);
}

console.log('RENDER:', process.env.RENDER || 'false');
console.log('DB_PATH env:', process.env.DB_PATH || '(not set)');
console.log('Final DB path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('DB 연결 실패:', err.message);
  } else {
    console.log('DB 연결 성공');
  }
});

// =============================
// 공통 함수
// =============================
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isAdmin(req) {
  return !!req.session?.user && String(req.session.user.role || '').toLowerCase() === 'admin';
}

function requireLogin(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: '로그인 필요' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
  }
  next();
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function todayText() {
  return new Date().toISOString().slice(0, 10);
}

function addColumnIfMissing(table, column, definition) {
  db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
    if (err) {
      console.error('컬럼 확인 실패:', err.message);
      return;
    }

    const exists = rows.some((r) => r.name === column);
    if (!exists) {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${definition}`, (err2) => {
        if (err2) {
          console.error(`${column} 컬럼 추가 실패:`, err2.message);
        } else {
          console.log(`${column} 컬럼 추가 완료`);
        }
      });
    }
  });
}

// =============================
// DB 초기화
// =============================
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      department TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'PENDING'
    )
  `);

  addColumnIfMissing('users', 'title', `title TEXT DEFAULT 'staff'`);
  addColumnIfMissing('users', 'createdAt', `createdAt TEXT`);

  db.run(`
    CREATE TABLE IF NOT EXISTS iqc (
      id TEXT PRIMARY KEY,
      date TEXT,
      lot TEXT,
      supplier TEXT,
      item TEXT,
      inspector TEXT,
      qty REAL,
      fail REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ipqc (
      id TEXT PRIMARY KEY,
      date TEXT,
      product TEXT,
      lot TEXT,
      visual TEXT,
      viscosity TEXT,
      solid TEXT,
      particle TEXT,
      qty REAL,
      fail REAL,
      judge TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS oqc (
      id TEXT PRIMARY KEY,
      date TEXT,
      customer TEXT,
      product TEXT,
      lot TEXT,
      visual TEXT,
      viscosity TEXT,
      solid TEXT,
      particle TEXT,
      adhesion TEXT,
      resistance TEXT,
      swelling TEXT,
      moisture TEXT,
      qty REAL,
      fail REAL,
      judge TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT,
      manager TEXT,
      phone TEXT,
      category TEXT,
      status TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS worklog (
      id TEXT PRIMARY KEY,
      workDate TEXT,
      finishedLot TEXT,
      seq TEXT,
      material TEXT,
      supName TEXT,
      inputQty TEXT,
      inputRatio TEXT,
      lotNo TEXT,
      inputTime TEXT,
      worker TEXT,
      note TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS change_logs (
      id TEXT PRIMARY KEY,
      logDate TEXT,
      message TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS nonconform (
      id TEXT PRIMARY KEY,
      date TEXT,
      type TEXT,
      lot TEXT,
      item TEXT,
      issue TEXT,
      cause TEXT,
      action TEXT,
      owner TEXT,
      status TEXT
    )
  `);

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    ['admin@namochemical.com'],
    async (err, user) => {
      if (err) {
        console.error('관리자 조회 실패:', err.message);
        return;
      }

      if (user) {
        console.log('관리자 이미 존재');
        return;
      }

      try {
        const initPassword = process.env.ADMIN_INIT_PASSWORD || '1234';
        const hashed = await bcrypt.hash(initPassword, 10);

        db.run(
          `INSERT INTO users (name, email, password, department, title, role, status, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            '관리자',
            'admin@namochemical.com',
            hashed,
            '관리부',
            'admin',
            'admin',
           'APPROVED',
            todayText()
          ],
          (err2) => {
            if (err2) console.error('관리자 생성 실패:', err2.message);
            else console.log('기본 관리자 계정 생성 완료');
          }
        );
      } catch (e) {
        console.error('관리자 생성 오류:', e.message);
      }
    }
  );
});

// =============================
// 메인 페이지
// =============================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// =============================
// 인증
// =============================
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: '필수값 누락' });
    }

    if (String(password).length < 4) {
      return res.status(400).json({ error: '비밀번호가 너무 짧습니다.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await getAsync(`SELECT id FROM users WHERE email = ?`, [normalizedEmail]);

    if (existing) {
      return res.status(409).json({ error: '이미 등록된 이메일입니다.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await runAsync(
      `INSERT INTO users (name, email, password, department, title, role, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        normalizedEmail,
        hashed,
        department || '',
        'staff',
        'user',
        'PENDING',
        todayText()
      ]
    );

    res.json({ ok: true, message: '회원가입 신청이 완료되었습니다.' });
  } catch (err) {
    console.error('회원가입 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getAsync(`SELECT * FROM users WHERE email = ?`, [normalizeEmail(email)]);

    if (!user) {
      return res.status(401).json({ error: '사용자 없음' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: '비밀번호 틀림' });
    }

    if (user.status !== 'APPROVED') {
      return res.status(403).json({ error: '승인 대기 계정입니다.' });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      title: user.title || 'staff'
    };

    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('세션 저장 실패:', saveErr);
        return res.status(500).json({ error: '세션 저장 실패' });
      }

      res.json({ ok: true });
    });
  } catch (err) {
    console.error('로그인 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session?.user) {
    return res.json({
      authenticated: false,
      id: '',
      name: '',
      role: 'guest'
    });
  }

  return res.json({
    authenticated: true,
    id: req.session.user.id || '',
    name: req.session.user.name || '',
    role: req.session.user.role || 'user',
    email: req.session.user.email || '',
    status: req.session.user.status || '',
    title: req.session.user.title || 'staff'
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: '로그아웃 실패' });
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

app.post('/api/auth/find-id', async (req, res) => {
  try {
    const { name, department } = req.body;

    if (!name || !department) {
      return res.status(400).json({ error: '이름과 부서를 입력하세요.' });
    }

    const user = await getAsync(
      `SELECT email FROM users WHERE name = ? AND department = ?`,
      [name, department]
    );

    if (!user) {
      return res.status(404).json({ error: '일치하는 계정을 찾을 수 없습니다.' });
    }

    res.json({ ok: true, email: user.email });
  } catch (err) {
    console.error('ID 찾기 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: '값 누락' });
    }

    const user = await getAsync(`SELECT * FROM users WHERE email = ?`, [normalizeEmail(email)]);

    if (!user) {
      return res.status(404).json({ error: '사용자 없음' });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({ error: '현재 비밀번호 틀림' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await runAsync(`UPDATE users SET password = ? WHERE email = ?`, [
      hashed,
      normalizeEmail(email)
    ]);

    res.json({ ok: true, message: '비밀번호 변경 완료' });
  } catch (err) {
    console.error('비밀번호 변경 오류:', err);
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email) {
      return res.status(400).json({ error: '이메일을 입력하세요.' });
    }

    if (!newPassword) {
      return res.status(400).json({ error: '새 비밀번호를 입력하세요.' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await getAsync(
      `SELECT * FROM users WHERE email = ?`,
      [normalizedEmail]
    );

    if (!user) {
      return res.status(404).json({ error: '일치하는 사용자가 없습니다.' });
    }

    const hashed = await bcrypt.hash(String(newPassword), 10);

    await runAsync(
      `UPDATE users SET password = ? WHERE email = ?`,
      [hashed, normalizedEmail]
    );

    res.json({ ok: true, message: '비밀번호가 재설정되었습니다.' });
  } catch (err) {
    console.error('비밀번호 재설정 오류:', err);
    res.status(500).json({ error: err.message });
  }
});
// =============================
// 관리자 회원 관리
// =============================
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const rows = await allAsync(
      `SELECT id, name, email, department, title, role, status, createdAt
       FROM users
       ORDER BY id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, title, role, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: '이름을 입력하세요.' });
    }

    if (!email) {
      return res.status(400).json({ error: '이메일을 입력하세요.' });
    }

    const normalizedEmail = normalizeEmail(email);

    const existing = await getAsync(
      `SELECT id FROM users WHERE email = ? AND id != ?`,
      [normalizedEmail, id]
    );

    if (existing) {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    }

    const result = await runAsync(
      `UPDATE users
       SET name = ?, email = ?, department = ?, title = ?, role = ?, status = ?
       WHERE id = ?`,
      [
        name,
        normalizedEmail,
        department || '',
        title || 'staff',
        role || 'user',
        status || 'PENDING',
        id
      ]
    );

    if (!result || result.changes === 0) {
      return res.status(404).json({ error: '해당 회원을 찾을 수 없습니다.' });
    }

    const updatedUser = await getAsync(
      `SELECT id, name, email, department, title, role, status, createdAt
       FROM users
       WHERE id = ?`,
      [id]
    );

    res.json({
      ok: true,
      message: '회원 정보가 저장되었습니다.',
      user: updatedUser
    });
  } catch (err) {
    console.error('회원 수정 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    const result = await runAsync(
      `UPDATE users SET status = 'APPROVED' WHERE id = ?`,
      [req.params.id]
    );

    if (!result || result.changes === 0) {
      return res.status(404).json({ error: '해당 회원을 찾을 수 없습니다.' });
    }

    const updatedUser = await getAsync(
      `SELECT id, name, email, department, title, role, status, createdAt
       FROM users
       WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      ok: true,
      message: '회원 승인이 완료되었습니다.',
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/reject', requireAdmin, async (req, res) => {
  try {
    const result = await runAsync(
      `UPDATE users SET status = 'REJECTED' WHERE id = ?`,
      [req.params.id]
    );

    if (!result || result.changes === 0) {
      return res.status(404).json({ error: '해당 회원을 찾을 수 없습니다.' });
    }

    const updatedUser = await getAsync(
      `SELECT id, name, email, department, title, role, status, createdAt
       FROM users
       WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      ok: true,
      message: '회원 반려가 완료되었습니다.',
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    await runAsync(`DELETE FROM users WHERE id = ?`, [req.params.id]);
    res.json({ ok: true, message: '회원 삭제가 완료되었습니다.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/delete-all', requireAdmin, async (req, res) => {
  try {
    if (req.body.confirm !== 'DELETE') {
      return res.status(400).json({ error: '삭제 확인값이 올바르지 않습니다.' });
    }

    await runAsync(`DELETE FROM iqc`);
    await runAsync(`DELETE FROM ipqc`);
    await runAsync(`DELETE FROM oqc`);
    await runAsync(`DELETE FROM suppliers`);
    await runAsync(`DELETE FROM worklog`);
    await runAsync(`DELETE FROM change_logs`);
    await runAsync(`DELETE FROM nonconform`);

    res.json({ ok: true, message: '전체 데이터 삭제 완료' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// Import
// =============================
app.post('/api/import/preview', requireAdmin, async (req, res) => {
  try {
    const {
      iqcRows = [],
      ipqcRows = [],
      oqcRows = [],
      supplierRows = [],
      worklogRows = []
    } = req.body || {};

    res.json({
      ok: true,
      summary: {
        iqc: Array.isArray(iqcRows) ? iqcRows.length : 0,
        ipqc: Array.isArray(ipqcRows) ? ipqcRows.length : 0,
        oqc: Array.isArray(oqcRows) ? oqcRows.length : 0,
        suppliers: Array.isArray(supplierRows) ? supplierRows.length : 0,
        worklog: Array.isArray(worklogRows) ? worklogRows.length : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/import/commit', requireAdmin, async (req, res) => {
  try {
    const {
      iqcRows = [],
      ipqcRows = [],
      oqcRows = [],
      supplierRows = [],
      worklogRows = []
    } = req.body || {};

    for (const r of iqcRows) {
      await runAsync(
        `INSERT OR REPLACE INTO iqc (id, date, lot, supplier, item, inspector, qty, fail)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id || `iqc_${Date.now()}_${Math.random()}`,
          r.date || '',
          r.lot || '',
          r.supplier || '',
          r.item || '',
          r.inspector || '',
          Number(r.qty || 0),
          Number(r.fail || 0)
        ]
      );
    }

    for (const r of ipqcRows) {
      await runAsync(
        `INSERT OR REPLACE INTO ipqc (id, date, product, lot, visual, viscosity, solid, particle, qty, fail, judge)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id || `ipqc_${Date.now()}_${Math.random()}`,
          r.date || '',
          r.product || '',
          r.lot || '',
          r.visual || '',
          r.viscosity || '',
          r.solid || '',
          r.particle || '',
          Number(r.qty || 0),
          Number(r.fail || 0),
          r.judge || '합격'
        ]
      );
    }

    for (const r of oqcRows) {
      await runAsync(
        `INSERT OR REPLACE INTO oqc (id, date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id || `oqc_${Date.now()}_${Math.random()}`,
          r.date || '',
          r.customer || '',
          r.product || '',
          r.lot || '',
          r.visual || '',
          r.viscosity || '',
          r.solid || '',
          r.particle || '',
          r.adhesion || '',
          r.resistance || '',
          r.swelling || '',
          r.moisture || '',
          Number(r.qty || 0),
          Number(r.fail || 0),
          r.judge || '합격'
        ]
      );
    }

    for (const r of supplierRows) {
      await runAsync(
        `INSERT OR REPLACE INTO suppliers (id, name, manager, phone, category, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          r.id || `sup_${Date.now()}_${Math.random()}`,
          r.name || '',
          r.manager || '',
          r.phone || '',
          r.category || '',
          r.status || '사용'
        ]
      );
    }

    for (const r of worklogRows) {
      await runAsync(
        `INSERT OR REPLACE INTO worklog (id, workDate, finishedLot, seq, material, supName, inputQty, inputRatio, lotNo, inputTime, worker, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id || `work_${Date.now()}_${Math.random()}`,
          r.workDate || '',
          r.finishedLot || '',
          r.seq || '',
          r.material || '',
          r.supName || '',
          r.inputQty || '',
          r.inputRatio || '',
          r.lotNo || '',
          r.inputTime || '',
          r.worker || '',
          r.note || ''
        ]
      );
    }

    res.json({ ok: true, message: '엑셀 반영 완료' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// IQC
// =============================
app.get('/api/iqc', async (req, res) => {
  try {
    const rows = await allAsync(`SELECT * FROM iqc ORDER BY date DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/iqc', async (req, res) => {
  try {
    const data = { id: `iqc_${Date.now()}`, ...req.body };
    await runAsync(
      `INSERT INTO iqc (id, date, lot, supplier, item, inspector, qty, fail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.date || '',
        data.lot || '',
        data.supplier || '',
        data.item || '',
        data.inspector || '',
        Number(data.qty || 0),
        Number(data.fail || 0)
      ]
    );
    res.json({ ok: true, id: data.id });
  } catch (err) {
    console.error('IQC 저장 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/iqc/:id', async (req, res) => {
  try {
    const d = req.body;
    await runAsync(
      `UPDATE iqc
       SET date=?, lot=?, supplier=?, item=?, inspector=?, qty=?, fail=?
       WHERE id=?`,
      [
        d.date || '',
        d.lot || '',
        d.supplier || '',
        d.item || '',
        d.inspector || '',
        Number(d.qty || 0),
        Number(d.fail || 0),
        req.params.id
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('IQC 수정 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/iqc/:id', async (req, res) => {
  try {
    await runAsync(`DELETE FROM iqc WHERE id=?`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// IPQC
// =============================
app.get('/api/ipqc', async (req, res) => {
  try {
    const rows = await allAsync(`SELECT * FROM ipqc ORDER BY date DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ipqc', async (req, res) => {
  try {
    const data = { id: `ipqc_${Date.now()}`, ...req.body };
    await runAsync(
      `INSERT INTO ipqc (id, date, product, lot, visual, viscosity, solid, particle, qty, fail, judge)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.date || '',
        data.product || '',
        data.lot || '',
        data.visual || '',
        data.viscosity || '',
        data.solid || '',
        data.particle || '',
        Number(data.qty || 0),
        Number(data.fail || 0),
        data.judge || '합격'
      ]
    );
    res.json({ ok: true, id: data.id });
  } catch (err) {
    console.error('IPQC 저장 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/ipqc/:id', async (req, res) => {
  try {
    const d = req.body;
    await runAsync(
      `UPDATE ipqc
       SET date=?, product=?, lot=?, visual=?, viscosity=?, solid=?, particle=?, qty=?, fail=?, judge=?
       WHERE id=?`,
      [
        d.date || '',
        d.product || '',
        d.lot || '',
        d.visual || '',
        d.viscosity || '',
        d.solid || '',
        d.particle || '',
        Number(d.qty || 0),
        Number(d.fail || 0),
        d.judge || '합격',
        req.params.id
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('IPQC 수정 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/ipqc/:id', async (req, res) => {
  try {
    await runAsync(`DELETE FROM ipqc WHERE id=?`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// OQC
// =============================
app.get('/api/oqc', async (req, res) => {
  try {
    const rows = await allAsync(`SELECT * FROM oqc ORDER BY date DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/oqc', async (req, res) => {
  try {
    const data = { id: `oqc_${Date.now()}`, ...req.body };
    await runAsync(
      `INSERT INTO oqc (id, date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.date || '',
        data.customer || '',
        data.product || '',
        data.lot || '',
        data.visual || '',
        data.viscosity || '',
        data.solid || '',
        data.particle || '',
        data.adhesion || '',
        data.resistance || '',
        data.swelling || '',
        data.moisture || '',
        Number(data.qty || 0),
        Number(data.fail || 0),
        data.judge || '합격'
      ]
    );
    res.json({ ok: true, id: data.id });
  } catch (err) {
    console.error('OQC 저장 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/oqc/:id', async (req, res) => {
  try {
    const d = req.body;
    await runAsync(
      `UPDATE oqc
       SET date=?, customer=?, product=?, lot=?, visual=?, viscosity=?, solid=?, particle=?, adhesion=?, resistance=?, swelling=?, moisture=?, qty=?, fail=?, judge=?
       WHERE id=?`,
      [
        d.date || '',
        d.customer || '',
        d.product || '',
        d.lot || '',
        d.visual || '',
        d.viscosity || '',
        d.solid || '',
        d.particle || '',
        d.adhesion || '',
        d.resistance || '',
        d.swelling || '',
        d.moisture || '',
        Number(d.qty || 0),
        Number(d.fail || 0),
        d.judge || '합격',
        req.params.id
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('OQC 수정 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/oqc/:id', async (req, res) => {
  try {
    await runAsync(`DELETE FROM oqc WHERE id=?`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// Suppliers
// =============================
app.get('/api/suppliers', async (req, res) => {
  try {
    const rows = await allAsync(`SELECT * FROM suppliers ORDER BY name ASC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const data = { id: `sup_${Date.now()}`, ...req.body };
    await runAsync(
      `INSERT INTO suppliers (id, name, manager, phone, category, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.name || '',
        data.manager || '',
        data.phone || '',
        data.category || '',
        data.status || '사용'
      ]
    );
    res.json({ ok: true, id: data.id });
  } catch (err) {
    console.error('공급업체 저장 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const d = req.body;
    await runAsync(
      `UPDATE suppliers
       SET name=?, manager=?, phone=?, category=?, status=?
       WHERE id=?`,
      [
        d.name || '',
        d.manager || '',
        d.phone || '',
        d.category || '',
        d.status || '사용',
        req.params.id
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('공급업체 수정 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    await runAsync(`DELETE FROM suppliers WHERE id=?`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// Worklog
// =============================
app.get('/api/worklog', async (req, res) => {
  try {
    const rows = await allAsync(`SELECT * FROM worklog ORDER BY workDate DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/worklog', async (req, res) => {
  try {
    const data = { id: `work_${Date.now()}`, ...req.body };
    await runAsync(
      `INSERT INTO worklog (id, workDate, finishedLot, seq, material, supName, inputQty, inputRatio, lotNo, inputTime, worker, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.workDate || '',
        data.finishedLot || '',
        data.seq || '',
        data.material || '',
        data.supName || '',
        data.inputQty || '',
        data.inputRatio || '',
        data.lotNo || '',
        data.inputTime || '',
        data.worker || '',
        data.note || ''
      ]
    );
    res.json({ ok: true, id: data.id });
  } catch (err) {
    console.error('작업일지 저장 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/worklog/:id', async (req, res) => {
  try {
    const d = req.body;
    await runAsync(
      `UPDATE worklog
       SET workDate=?, finishedLot=?, seq=?, material=?, supName=?, inputQty=?, inputRatio=?, lotNo=?, inputTime=?, worker=?, note=?
       WHERE id=?`,
      [
        d.workDate || '',
        d.finishedLot || '',
        d.seq || '',
        d.material || '',
        d.supName || '',
        d.inputQty || '',
        d.inputRatio || '',
        d.lotNo || '',
        d.inputTime || '',
        d.worker || '',
        d.note || '',
        req.params.id
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('작업일지 수정 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/worklog/:id', async (req, res) => {
  try {
    await runAsync(`DELETE FROM worklog WHERE id=?`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// Change logs
// =============================
app.get('/api/change-logs', async (req, res) => {
  try {
    const rows = await allAsync(`SELECT * FROM change_logs ORDER BY logDate DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// Nonconform
// =============================
app.get('/api/nonconform', async (req, res) => {
  try {
    const rows = await allAsync(`SELECT * FROM nonconform ORDER BY date DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/nonconform', async (req, res) => {
  try {
    const data = { id: req.body.id || `nc_${Date.now()}`, ...req.body };
    await runAsync(
      `INSERT INTO nonconform (id, date, type, lot, item, issue, cause, action, owner, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(data.id),
        data.date || '',
        data.type || '',
        data.lot || '',
        data.item || '',
        data.issue || '',
        data.cause || '',
        data.action || '',
        data.owner || '',
        data.status || '대기'
      ]
    );
    res.json({ ok: true, message: '부적합 데이터가 저장되었습니다.' });
  } catch (err) {
    console.error('부적합 저장 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/nonconform/:id', async (req, res) => {
  try {
    const d = req.body;
    await runAsync(
      `UPDATE nonconform
       SET date=?, type=?, lot=?, item=?, issue=?, cause=?, action=?, owner=?, status=?
       WHERE id=?`,
      [
        d.date || '',
        d.type || '',
        d.lot || '',
        d.item || '',
        d.issue || '',
        d.cause || '',
        d.action || '',
        d.owner || '',
        d.status || '대기',
        String(req.params.id)
      ]
    );
    res.json({ ok: true, message: '부적합 데이터가 수정되었습니다.' });
  } catch (err) {
    console.error('부적합 수정 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/nonconform/:id', async (req, res) => {
  try {
    await runAsync(`DELETE FROM nonconform WHERE id=?`, [String(req.params.id)]);
    res.json({ ok: true, message: '부적합 데이터가 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// 서버 실행
// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행: ${PORT}`);
});
