const fs = require('fs');
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'namochemical-secret-key',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use(express.static(__dirname));

// =============================
// DB 경로 설정
// =============================
function resolveDbPath() {
  return process.env.DB_PATH || '/var/data/quality.db';
}

const dbPath = resolveDbPath();
const dbDir = path.dirname(dbPath);

try {
  fs.mkdirSync(dbDir, { recursive: true });
} catch (err) {
  console.error('DB 디렉토리 생성 실패:', err.message);
}

console.log('RENDER:', process.env.RENDER || 'false');
console.log('NODE_ENV:', process.env.NODE_ENV || '(not set)');
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
  return String(req.session?.user?.role || '').toLowerCase() === 'admin';
}

function requireLogin(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
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
    db.run(sql, params, function onRun(err) {
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
      status TEXT DEFAULT 'PENDING',
      title TEXT DEFAULT 'staff',
      createdAt TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

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

  // 구버전 DB 호환용 컬럼 추가
  db.run(`ALTER TABLE users ADD COLUMN title TEXT DEFAULT 'staff'`, (err) => {
    if (err && !String(err.message).includes('duplicate column name')) {
      console.error('title 컬럼 추가 실패:', err.message);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN createdAt TEXT`, (err) => {
    if (err && !String(err.message).includes('duplicate column name')) {
      console.error('createdAt 컬럼 추가 실패:', err.message);
    }
  });

  db.run(
    `UPDATE users SET createdAt = datetime('now', 'localtime') WHERE createdAt IS NULL OR createdAt = ''`,
    [],
    (err) => {
      if (err) {
        console.error('createdAt 보정 실패:', err.message);
      }
    }
  );

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
        const hashed = await bcrypt.hash('Admin1234!', 10);
        db.run(
          `INSERT INTO users (name, email, password, department, role, status, title, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
          ['관리자', 'admin@namochemical.com', hashed, '관리부', 'admin', 'APPROVED', 'admin'],
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

// 관리자 비밀번호 즉시 초기화
app.get('/reset-admin-password-now', async (req, res) => {
  try {
    const email = 'admin@namochemical.com';
    const plainPassword = '1234';
    const hashed = await bcrypt.hash(plainPassword, 10);

    const existing = await getAsync(
      `SELECT id, email, role, status FROM users WHERE email = ?`,
      [email]
    );

    if (existing) {
      await runAsync(
        `UPDATE users
         SET password = ?, role = 'admin', status = 'APPROVED'
         WHERE email = ?`,
        [hashed, email]
      );

      const updated = await getAsync(
        `SELECT id, email, role, status FROM users WHERE email = ?`,
        [email]
      );

      return res.json({
        ok: true,
        mode: 'updated',
        message: '기존 관리자 비밀번호가 1234로 초기화되었습니다.',
        user: updated,
        dbPath
      });
    }

    await runAsync(
      `INSERT INTO users (name, email, password, department, role, status, title, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
      ['관리자', email, hashed, '관리부', 'admin', 'APPROVED', 'admin']
    );

    const created = await getAsync(
      `SELECT id, email, role, status FROM users WHERE email = ?`,
      [email]
    );

    return res.json({
      ok: true,
      mode: 'created',
      message: '관리자 계정이 새로 생성되었고 비밀번호는 1234입니다.',
      user: created,
      dbPath
    });
  } catch (err) {
    console.error('관리자 초기화 오류:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
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

    const exists = await getAsync(`SELECT id FROM users WHERE email = ?`, [normalizeEmail(email)]);
    if (exists) {
      return res.status(409).json({ error: '이미 등록된 이메일입니다.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await runAsync(
  `INSERT INTO users (name, email, password, department, role, status, title, createdAt)
   VALUES (?, ?, ?, ?, 'user', 'PENDING', 'staff', datetime('now', 'localtime'))`,
  [name, normalizeEmail(email), hashed, department || '']
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
      department: user.department || '',
      title: user.title || 'staff'
    };

    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('세션 저장 실패:', saveErr);
        return res.status(500).json({ error: '세션 저장 실패' });
      }
      res.json({ ok: true, user: req.session.user });
    });
  } catch (err) {
    console.error('로그인 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: '로그인 필요' });
  }
  res.json(req.session.user);
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: '로그아웃 실패' });

    res.clearCookie('connect.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction
    });

    res.json({ ok: true });
  });
});
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: '이메일과 새 비밀번호를 입력하세요.' });
    }

    if (String(newPassword).length < 4) {
      return res.status(400).json({ error: '비밀번호는 4자 이상 입력하세요.' });
    }

    const hashed = await bcrypt.hash(String(newPassword), 10);

    const result = await runAsync(
      `UPDATE users SET password=? WHERE email=?`,
      [hashed, normalizeEmail(email)]
    );

    if (!result || result.changes === 0) {
      return res.status(404).json({ error: '해당 이메일의 회원을 찾을 수 없습니다.' });
    }

    res.json({ ok: true, message: '비밀번호가 변경되었습니다.' });
  } catch (err) {
    console.error('비밀번호 초기화 오류:', err);
    res.status(500).json({ error: err.message });
  }
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

// 프론트가 사용하는 비밀번호 변경 방식에 맞춤
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: '값 누락' });
    }

    const user = await getAsync(
      `SELECT * FROM users WHERE email = ?`,
      [normalizeEmail(email)]
    );

    if (!user) {
      return res.status(404).json({ error: '사용자 없음' });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({ error: '현재 비밀번호 틀림' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await runAsync(
      `UPDATE users SET password = ? WHERE email = ?`,
      [hashed, normalizeEmail(email)]
    );

    res.json({ ok: true, message: '비밀번호 변경 완료' });
  } catch (err) {
    console.error('비밀번호 변경 오류:', err);
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
       FROM users WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      ok: true,
      message: '회원 승인이 완료되었습니다.',
      user: updatedUser
    });
  } catch (err) {
    console.error('회원 승인 오류:', err);
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
       FROM users WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      ok: true,
      message: '회원 반려가 완료되었습니다.',
      user: updatedUser
    });
  } catch (err) {
    console.error('회원 반려 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const d = req.body;

    const result = await runAsync(
      `UPDATE users
       SET name = ?, email = ?, department = ?, title = ?, role = ?, status = ?
       WHERE id = ?`,
      [
        String(d.name || ''),
        normalizeEmail(d.email || ''),
        String(d.department || ''),
        String(d.title || 'staff'),
        String(d.role || 'user'),
        String(d.status || 'PENDING'),
        req.params.id
      ]
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
      message: '회원 정보가 수정되었습니다.',
      user: updatedUser
    });
  } catch (err) {
    console.error('회원 수정 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const targetId = String(req.params.id);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: '비밀번호가 없습니다.' });
    }

    const user = await getAsync(`SELECT id FROM users WHERE id = ?`, [targetId]);
    if (!user) {
      return res.status(404).json({ error: '회원을 찾을 수 없습니다.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await runAsync(
      `UPDATE users SET password = ? WHERE id = ?`,
      [hashed, targetId]
    );

    res.json({ ok: true, message: '비밀번호 초기화 완료' });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const targetId = String(req.params.id);
    const me = req.session?.user || {};

    if (String(me.id || '') === targetId) {
      return res.status(400).json({ error: '본인 계정은 삭제할 수 없습니다.' });
    }

    const result = await runAsync(`DELETE FROM users WHERE id = ?`, [targetId]);

    if (!result || result.changes === 0) {
      return res.status(404).json({ error: '해당 회원을 찾을 수 없습니다.' });
    }

    res.json({ ok: true, message: '회원 삭제가 완료되었습니다.' });
  } catch (err) {
    console.error('회원 삭제 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/delete-all', requireAdmin, async (req, res) => {
  try {
    if (String(req.body?.confirm || '') !== 'DELETE') {
      return res.status(400).json({ error: '확인 문자열이 올바르지 않습니다.' });
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
    console.error('전체 삭제 오류:', err);
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
        Number(data.qty ?? 0),
        Number(data.fail ?? 0)
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
        Number(d.qty ?? 0),
        Number(d.fail ?? 0),
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
    console.error('IQC 삭제 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================
// PQC / PQC
// =============================
async function listIpqc(req, res) {
  try {
    const rows = await allAsync(`SELECT * FROM ipqc ORDER BY date DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createIpqc(req, res) {
  try {
    const d = req.body;
    const id = d.id || `ipqc_${Date.now()}`;

    await runAsync(
      `INSERT INTO ipqc (id, date, product, lot, visual, viscosity, solid, particle, qty, fail, judge)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        String(d.date || ''),
        String(d.product || ''),
        String(d.lot || ''),
        String(d.visual || ''),
        String(d.viscosity || ''),
        String(d.solid || ''),
        String(d.particle || ''),
        Number(d.qty ?? 0),
        Number(d.fail ?? 0),
        String(d.judge || '합격')
      ]
    );

    res.json({ ok: true, id });
  } catch (err) {
    console.error('IPQC 저장 오류:', err);
    res.status(500).json({ error: err.message });
  }
}

async function updateIpqc(req, res) {
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
        Number(d.qty ?? 0),
        Number(d.fail ?? 0),
        d.judge || '합격',
        req.params.id
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('IPQC 수정 오류:', err);
    res.status(500).json({ error: err.message });
  }
}

async function deleteIpqc(req, res) {
  try {
    await runAsync(`DELETE FROM ipqc WHERE id=?`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('IPQC 삭제 오류:', err);
    res.status(500).json({ error: err.message });
  }
}

// 기존 /api/pqc 유지
app.get('/api/pqc', listIpqc);
app.post('/api/pqc', createIpqc);
app.put('/api/pqc/:id', updateIpqc);
app.delete('/api/pqc/:id', deleteIpqc);

// 프론트에서 쓰는 /api/ipqc 추가
app.get('/api/ipqc', listIpqc);
app.post('/api/ipqc', createIpqc);
app.put('/api/ipqc/:id', updateIpqc);
app.delete('/api/ipqc/:id', deleteIpqc);

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
    const d = req.body;
    const id = d.id || `oqc_${Date.now()}`;

    await runAsync(
      `INSERT INTO oqc (id, date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        String(d.date || ''),
        String(d.customer || ''),
        String(d.product || ''),
        String(d.lot || ''),
        String(d.visual || ''),
        String(d.viscosity || ''),
        String(d.solid || ''),
        String(d.particle || ''),
        String(d.adhesion || ''),
        String(d.resistance || ''),
        String(d.swelling || ''),
        String(d.moisture || ''),
        Number(d.qty ?? 0),
        Number(d.fail ?? 0),
        String(d.judge || '합격')
      ]
    );

    res.json({ ok: true, id });
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
        Number(d.qty ?? 0),
        Number(d.fail ?? 0),
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
    console.error('OQC 삭제 오류:', err);
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
    console.error('공급업체 삭제 오류:', err);
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
    console.error('작업일지 삭제 오류:', err);
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
        data.id,
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
        req.params.id
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
    await runAsync(`DELETE FROM nonconform WHERE id=?`, [req.params.id]);
    res.json({ ok: true, message: '부적합 데이터가 삭제되었습니다.' });
  } catch (err) {
    console.error('부적합 삭제 오류:', err);
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
