const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'namochemical-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use(express.static(path.join(__dirname, 'public')));

const dbPath = path.join(__dirname, 'quality.db');
const db = new sqlite3.Database(dbPath);

function dbError(res, err, label = 'DB 오류') {
  console.error(label, err.message);
  return res.status(500).json({ error: err.message });
}

function ensureColumns(tableName, wantedColumns) {
  db.all(`PRAGMA table_info(${tableName})`, [], (err, cols) => {
    if (err) {
      console.error(`${tableName} 스키마 확인 오류:`, err.message);
      return;
    }

    const existing = cols.map(c => c.name);

    wantedColumns.forEach(col => {
      if (!existing.includes(col.name)) {
        db.run(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type}`, alterErr => {
          if (alterErr) {
            console.error(`${tableName}.${col.name} 컬럼 추가 오류:`, alterErr.message);
          }
        });
      }
    });
  });
}

function makeLogDate() {
  const now = new Date();
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

function addChangeLog(category, action, message) {
  db.run(
    `INSERT INTO change_logs (logDate, category, action, message)
     VALUES (?, ?, ?, ?)`,
    [makeLogDate(), category, action, message],
    err => {
      if (err) console.error('변경 로그 저장 오류:', err.message);
    }
  );
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  if (String(req.session.user.role || '').toLowerCase() !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
  }
  next();
}

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

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
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      codeHash TEXT,
      purpose TEXT,
      expiresAt TEXT,
      verified INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS iqc (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      lot TEXT,
      supplier TEXT,
      item TEXT,
      inspector TEXT,
      qty INTEGER,
      fail INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ipqc (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      product TEXT,
      lot TEXT,
      visual TEXT,
      viscosity TEXT,
      solid TEXT,
      particle TEXT,
      qty INTEGER,
      fail INTEGER,
      judge TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS oqc (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      qty INTEGER,
      fail INTEGER,
      judge TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      manager TEXT,
      phone TEXT,
      category TEXT,
      status TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS worklog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      logDate TEXT,
      category TEXT,
      action TEXT,
      message TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS nonconform (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  ensureColumns('users', [
    { name: 'department', type: 'TEXT' },
    { name: 'role', type: 'TEXT DEFAULT "user"' },
    { name: 'status', type: 'TEXT DEFAULT "PENDING"' }
  ]);

  ensureColumns('ipqc', [
    { name: 'product', type: 'TEXT' },
    { name: 'visual', type: 'TEXT' },
    { name: 'viscosity', type: 'TEXT' },
    { name: 'solid', type: 'TEXT' },
    { name: 'particle', type: 'TEXT' },
    { name: 'judge', type: 'TEXT' }
  ]);

  ensureColumns('oqc', [
    { name: 'customer', type: 'TEXT' },
    { name: 'product', type: 'TEXT' },
    { name: 'visual', type: 'TEXT' },
    { name: 'viscosity', type: 'TEXT' },
    { name: 'solid', type: 'TEXT' },
    { name: 'particle', type: 'TEXT' },
    { name: 'adhesion', type: 'TEXT' },
    { name: 'resistance', type: 'TEXT' },
    { name: 'swelling', type: 'TEXT' },
    { name: 'moisture', type: 'TEXT' },
    { name: 'judge', type: 'TEXT' }
  ]);

  ensureColumns('worklog', [
    { name: 'workDate', type: 'TEXT' },
    { name: 'finishedLot', type: 'TEXT' },
    { name: 'seq', type: 'TEXT' },
    { name: 'material', type: 'TEXT' },
    { name: 'supName', type: 'TEXT' },
    { name: 'inputQty', type: 'TEXT' },
    { name: 'inputRatio', type: 'TEXT' },
    { name: 'lotNo', type: 'TEXT' },
    { name: 'inputTime', type: 'TEXT' },
    { name: 'worker', type: 'TEXT' },
    { name: 'note', type: 'TEXT' }
  ]);

  db.get(`SELECT id FROM users WHERE role='admin' LIMIT 1`, [], async (err, row) => {
    if (err) {
      console.error('관리자 계정 확인 오류:', err.message);
      return;
    }

    if (!row) {
      try {
        const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@namochemical.com');
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';
        const hashed = await bcrypt.hash(adminPassword, 10);

        db.run(
          `INSERT INTO users (name, email, password, department, role, status)
           VALUES (?, ?, ?, ?, 'admin', 'APPROVED')`,
          ['관리자', adminEmail, hashed, '관리부'],
          insertErr => {
            if (insertErr) {
              console.error('초기 관리자 생성 오류:', insertErr.message);
            } else {
              console.log('초기 관리자 계정 생성 완료');
              console.log(`관리자 이메일: ${adminEmail}`);
              console.log(`관리자 초기 비밀번호: ${adminPassword}`);
            }
          }
        );
      } catch (createErr) {
        console.error('초기 관리자 생성 실패:', createErr.message);
      }
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  res.json(req.session.user);
});

// 메일 인증 제거: 요청만 성공 처리
app.post('/api/auth/send-code', async (req, res) => {
  return res.json({
    ok: true,
    message: '메일 인증 없이 진행하도록 설정되었습니다.'
  });
});

// 메일 인증 제거: 요청만 성공 처리
app.post('/api/auth/send-reset-code', async (req, res) => {
  return res.json({
    ok: true,
    message: '메일 인증 없이 진행하도록 설정되었습니다.'
  });
});

// 메일 인증 제거: 항상 성공 처리
app.post('/api/auth/verify-code', (req, res) => {
  return res.json({
    ok: true,
    message: '메일 인증 없이 완료 처리되었습니다.'
  });
});

// 회원가입: 메일 인증 없이 가입, 대신 관리자 승인 필요(PENDING)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const department = String(req.body.department || '').trim();

    if (!name) return res.status(400).json({ error: '이름을 입력하세요.' });
    if (!email) return res.status(400).json({ error: '이메일을 입력하세요.' });
    if (!password || password.length < 8) {
      return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
    }

    db.get(`SELECT id FROM users WHERE email=?`, [email], async (findErr, found) => {
      if (findErr) return dbError(res, findErr, '회원조회 오류');
      if (found) return res.status(409).json({ error: '이미 가입된 이메일입니다.' });

      const hashed = await bcrypt.hash(password, 10);

      db.run(
        `INSERT INTO users (name, email, password, department, role, status)
         VALUES (?, ?, ?, ?, 'user', 'PENDING')`,
        [name, email, hashed, department],
        function (insertErr) {
          if (insertErr) return dbError(res, insertErr, '회원가입 오류');

          addChangeLog('auth', '회원가입신청', `회원가입 신청: ${email}`);
          res.json({
            ok: true,
            message: '회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.'
          });
        }
      );
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력하세요.' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return dbError(res, err, '로그인 조회 오류');
    if (!user) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    if ((user.status || 'PENDING') !== 'APPROVED') {
      return res.status(403).json({ error: '관리자 승인 후 로그인할 수 있습니다.' });
    }

    try {
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user'
      };

      addChangeLog('auth', '로그인', `로그인: ${user.email}`);
      res.json({ ok: true, user: req.session.user });
    } catch (compareErr) {
      console.error(compareErr);
      res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
    }
  });
});

// 메일 없이 비밀번호 재설정
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || req.body.newPassword || '');

    if (!email) return res.status(400).json({ error: '이메일을 입력하세요.' });
    if (!password || password.length < 8) {
      return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
    }

    db.get(`SELECT id FROM users WHERE email=?`, [email], async (findErr, found) => {
      if (findErr) return dbError(res, findErr, '회원조회 오류');
      if (!found) return res.status(404).json({ error: '가입되지 않은 이메일입니다.' });

      const hashed = await bcrypt.hash(password, 10);

      db.run(`UPDATE users SET password=? WHERE email=?`, [hashed, email], function (updateErr) {
        if (updateErr) return dbError(res, updateErr, '비밀번호 변경 오류');

        addChangeLog('auth', '비밀번호변경', `비밀번호 재설정: ${email}`);
        res.json({ ok: true, message: '비밀번호가 변경되었습니다.' });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '비밀번호 재설정 중 오류가 발생했습니다.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const email = req.session.user?.email || '';
  req.session.destroy(err => {
    if (err) return dbError(res, err, '로그아웃 오류');
    if (email) addChangeLog('auth', '로그아웃', `로그아웃: ${email}`);
    res.json({ ok: true });
  });
});

app.get('/api/admin/users/pending', requireAuth, (req, res) => {
  db.all(
    `SELECT id, name, email, department, role, status, createdAt
     FROM users
     WHERE status='PENDING'
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) return dbError(res, err, '승인대기 회원 조회 오류');
      res.json(rows);
    }
  );
});

app.post('/api/admin/users/:id/approve', requireAuth, (req, res) => {
  db.run(`UPDATE users SET status='APPROVED' WHERE id=?`, [req.params.id], function (err) {
    if (err) return dbError(res, err, '회원 승인 오류');
    addChangeLog('auth', '회원승인', `회원 승인: ${req.params.id}`);
    res.json({ ok: true, message: '회원 승인이 완료되었습니다.' });
  });
});

app.post('/api/admin/users/:id/reject', requireAdmin, (req, res) => {
  db.run(`UPDATE users SET status='REJECTED' WHERE id=?`, [req.params.id], function (err) {
    if (err) return dbError(res, err, '회원 반려 오류');
    addChangeLog('auth', '회원반려', `회원 반려: ${req.params.id}`);
    res.json({ ok: true, message: '회원 반려가 완료되었습니다.' });
  });
});
app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM users WHERE id=?`, [req.params.id], function (err) {
    if (err) return dbError(res, err, '회원 삭제 오류');
    res.json({ ok: true, message: '회원 삭제가 완료되었습니다.' });
  });
});

app.get('/api/admin/users', requireAuth, (req, res) => {
  db.all(
    `SELECT id, name, email, department, role, status, createdAt
     FROM users
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) return dbError(res, err, '전체 회원 조회 오류');
      res.json(rows);
    }
  );
});
app.get('/api/change-logs', requireAuth, (req, res) => {
  db.all(`SELECT * FROM change_logs ORDER BY id DESC LIMIT 20`, [], (err, rows) => {
    if (err) return dbError(res, err, '변경 로그 조회 오류');
    res.json(rows);
  });
});

app.get('/api/iqc', requireAuth, (req, res) => {
  db.all(`SELECT * FROM iqc ORDER BY id DESC`, [], (err, rows) => {
    if (err) return dbError(res, err, 'IQC 조회 오류');
    res.json(rows);
  });
});

app.post('/api/iqc', requireAuth, (req, res) => {
  const { date, lot, supplier, item, inspector, qty, fail } = req.body;
  db.run(
    `INSERT INTO iqc (date, lot, supplier, item, inspector, qty, fail)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [date || '', lot || '', supplier || '', item || '', inspector || '', Number(qty || 0), Number(fail || 0)],
    function (err) {
      if (err) return dbError(res, err, 'IQC 저장 오류');
      addChangeLog('iqc', '등록', `수입검사 등록: ${item || '-'} / ${lot || '-'}`);
      res.json({ ok: true, id: this.lastID });
    }
  );
});

app.put('/api/iqc/:id', requireAuth, (req, res) => {
  const { date, lot, supplier, item, inspector, qty, fail } = req.body;
  db.run(
    `UPDATE iqc
     SET date=?, lot=?, supplier=?, item=?, inspector=?, qty=?, fail=?
     WHERE id=?`,
    [date || '', lot || '', supplier || '', item || '', inspector || '', Number(qty || 0), Number(fail || 0), req.params.id],
    function (err) {
      if (err) return dbError(res, err, 'IQC 수정 오류');
      addChangeLog('iqc', '수정', `수입검사 수정: ${item || '-'} / ${lot || '-'}`);
      res.json({ ok: true });
    }
  );
});

app.delete('/api/iqc/:id', requireAuth, (req, res) => {
  db.run(`DELETE FROM iqc WHERE id=?`, [req.params.id], function (err) {
    if (err) return dbError(res, err, 'IQC 삭제 오류');
    res.json({ ok: true });
  });
});

app.get('/api/ipqc', requireAuth, (req, res) => {
  db.all(`SELECT * FROM ipqc ORDER BY id DESC`, [], (err, rows) => {
    if (err) return dbError(res, err, 'PQC 조회 오류');
    res.json(rows);
  });
});

app.post('/api/ipqc', requireAuth, (req, res) => {
  const { date, product, lot, visual, viscosity, solid, particle, qty, fail, judge } = req.body;
  db.run(
    `INSERT INTO ipqc (date, product, lot, visual, viscosity, solid, particle, qty, fail, judge)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [date || '', product || '', lot || '', visual || '', viscosity || '', solid || '', particle || '', Number(qty || 0), Number(fail || 0), judge || '합격'],
    function (err) {
      if (err) return dbError(res, err, 'PQC 저장 오류');
      addChangeLog('ipqc', '등록', `공정검사 등록: ${product || '-'} / ${lot || '-'}`);
      res.json({ ok: true, id: this.lastID });
    }
  );
});

app.put('/api/ipqc/:id', requireAuth, (req, res) => {
  const { date, product, lot, visual, viscosity, solid, particle, qty, fail, judge } = req.body;
  db.run(
    `UPDATE ipqc
     SET date=?, product=?, lot=?, visual=?, viscosity=?, solid=?, particle=?, qty=?, fail=?, judge=?
     WHERE id=?`,
    [date || '', product || '', lot || '', visual || '', viscosity || '', solid || '', particle || '', Number(qty || 0), Number(fail || 0), judge || '합격', req.params.id],
    function (err) {
      if (err) return dbError(res, err, 'PQC 수정 오류');
      addChangeLog('ipqc', '수정', `공정검사 수정: ${product || '-'} / ${lot || '-'}`);
      res.json({ ok: true });
    }
  );
});

app.delete('/api/ipqc/:id', requireAuth, (req, res) => {
  db.run(`DELETE FROM ipqc WHERE id=?`, [req.params.id], function (err) {
    if (err) return dbError(res, err, 'PQC 삭제 오류');
    res.json({ ok: true });
  });
});

app.get('/api/oqc', requireAuth, (req, res) => {
  db.all(`SELECT * FROM oqc ORDER BY id DESC`, [], (err, rows) => {
    if (err) return dbError(res, err, 'OQC 조회 오류');
    res.json(rows);
  });
});

app.post('/api/oqc', requireAuth, (req, res) => {
  const { date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge } = req.body;
  db.run(
    `INSERT INTO oqc (date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [date || '', customer || '', product || '', lot || '', visual || '', viscosity || '', solid || '', particle || '', adhesion || '', resistance || '', swelling || '', moisture || '', Number(qty || 0), Number(fail || 0), judge || '합격'],
    function (err) {
      if (err) return dbError(res, err, 'OQC 저장 오류');
      addChangeLog('oqc', '등록', `출하검사 등록: ${product || '-'} / ${lot || '-'}`);
      res.json({ ok: true, id: this.lastID });
    }
  );
});

app.put('/api/oqc/:id', requireAuth, (req, res) => {
  const { date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge } = req.body;
  db.run(
    `UPDATE oqc
     SET date=?, customer=?, product=?, lot=?, visual=?, viscosity=?, solid=?, particle=?, adhesion=?, resistance=?, swelling=?, moisture=?, qty=?, fail=?, judge=?
     WHERE id=?`,
    [date || '', customer || '', product || '', lot || '', visual || '', viscosity || '', solid || '', particle || '', adhesion || '', resistance || '', swelling || '', moisture || '', Number(qty || 0), Number(fail || 0), judge || '합격', req.params.id],
    function (err) {
      if (err) return dbError(res, err, 'OQC 수정 오류');
      addChangeLog('oqc', '수정', `출하검사 수정: ${product || '-'} / ${lot || '-'}`);
      res.json({ ok: true });
    }
  );
});

app.delete('/api/oqc/:id', requireAuth, (req, res) => {
  db.run(`DELETE FROM oqc WHERE id=?`, [req.params.id], function (err) {
    if (err) return dbError(res, err, 'OQC 삭제 오류');
    res.json({ ok: true });
  });
});

app.get('/api/suppliers', requireAuth, (req, res) => {
  db.all(`SELECT * FROM suppliers ORDER BY id DESC`, [], (err, rows) => {
    if (err) return dbError(res, err, '공급업체 조회 오류');
    res.json(rows);
  });
});

app.post('/api/suppliers', requireAuth, (req, res) => {
  const { name, manager, phone, category, status } = req.body;
  db.run(
    `INSERT INTO suppliers (name, manager, phone, category, status)
     VALUES (?, ?, ?, ?, ?)`,
    [name || '', manager || '', phone || '', category || '', status || '사용'],
    function (err) {
      if (err) return dbError(res, err, '공급업체 저장 오류');
      addChangeLog('suppliers', '등록', `공급업체 등록: ${name || '-'}`);
      res.json({ ok: true, id: this.lastID });
    }
  );
});

app.put('/api/suppliers/:id', requireAuth, (req, res) => {
  const { name, manager, phone, category, status } = req.body;
  db.run(
    `UPDATE suppliers
     SET name=?, manager=?, phone=?, category=?, status=?
     WHERE id=?`,
    [name || '', manager || '', phone || '', category || '', status || '사용', req.params.id],
    function (err) {
      if (err) return dbError(res, err, '공급업체 수정 오류');
      addChangeLog('suppliers', '수정', `공급업체 수정: ${name || '-'}`);
      res.json({ ok: true });
    }
  );
});

app.delete('/api/suppliers/:id', requireAuth, (req, res) => {
  db.run(`DELETE FROM suppliers WHERE id=?`, [req.params.id], function (err) {
    if (err) return dbError(res, err, '공급업체 삭제 오류');
    res.json({ ok: true });
  });
});

app.get('/api/worklog', requireAuth, (req, res) => {
  db.all(`SELECT * FROM worklog ORDER BY id DESC`, [], (err, rows) => {
    if (err) return dbError(res, err, '작업일지 조회 오류');
    res.json(rows);
  });
});

app.post('/api/worklog', requireAuth, (req, res) => {
  const { workDate, finishedLot, seq, material, supName, inputQty, inputRatio, lotNo, inputTime, worker, note } = req.body;
  db.run(
    `INSERT INTO worklog (workDate, finishedLot, seq, material, supName, inputQty, inputRatio, lotNo, inputTime, worker, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [workDate || '', finishedLot || '', seq || '', material || '', supName || '', inputQty || '', inputRatio || '', lotNo || '', inputTime || '', worker || '', note || ''],
    function (err) {
      if (err) return dbError(res, err, '작업일지 저장 오류');
      addChangeLog('worklog', '등록', `작업일지 등록: ${material || '-'} / ${finishedLot || '-'}`);
      res.json({ ok: true, id: this.lastID });
    }
  );
});

app.put('/api/worklog/:id', requireAuth, (req, res) => {
  const { workDate, finishedLot, seq, material, supName, inputQty, inputRatio, lotNo, inputTime, worker, note } = req.body;
  db.run(
    `UPDATE worklog
     SET workDate=?, finishedLot=?, seq=?, material=?, supName=?, inputQty=?, inputRatio=?, lotNo=?, inputTime=?, worker=?, note=?
     WHERE id=?`,
    [workDate || '', finishedLot || '', seq || '', material || '', supName || '', inputQty || '', inputRatio || '', lotNo || '', inputTime || '', worker || '', note || '', req.params.id],
    function (err) {
      if (err) return dbError(res, err, '작업일지 수정 오류');
      addChangeLog('worklog', '수정', `작업일지 수정: ${material || '-'} / ${finishedLot || '-'}`);
      res.json({ ok: true });
    }
  );
});

app.delete('/api/worklog/:id', requireAuth, (req, res) => {
  db.run(`DELETE FROM worklog WHERE id=?`, [req.params.id], function (err) {
    if (err) return dbError(res, err, '작업일지 삭제 오류');
    res.json({ ok: true });
  });
});

app.post('/api/import/preview', requireAuth, (req, res) => {
  const counts = {
    suppliers: Array.isArray(req.body.supplierRows) ? req.body.supplierRows.length : 0,
    iqc: Array.isArray(req.body.iqcRows) ? req.body.iqcRows.length : 0,
    ipqc: Array.isArray(req.body.ipqcRows) ? req.body.ipqcRows.length : 0,
    oqc: Array.isArray(req.body.oqcRows) ? req.body.oqcRows.length : 0,
    worklog: Array.isArray(req.body.worklogRows) ? req.body.worklogRows.length : 0
  };
  res.json({ ok: true, counts });
});

app.post('/api/import/commit', requireAuth, (req, res) => {
  const supplierRows = Array.isArray(req.body.supplierRows) ? req.body.supplierRows : [];
  const iqcRows = Array.isArray(req.body.iqcRows) ? req.body.iqcRows : [];
  const ipqcRows = Array.isArray(req.body.ipqcRows) ? req.body.ipqcRows : [];
  const oqcRows = Array.isArray(req.body.oqcRows) ? req.body.oqcRows : [];
  const worklogRows = Array.isArray(req.body.worklogRows) ? req.body.worklogRows : [];

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run(`DELETE FROM suppliers`);
    db.run(`DELETE FROM iqc`);
    db.run(`DELETE FROM ipqc`);
    db.run(`DELETE FROM oqc`);
    db.run(`DELETE FROM worklog`);

    const supplierStmt = db.prepare(`INSERT INTO suppliers (name, manager, phone, category, status) VALUES (?, ?, ?, ?, ?)`);
    const iqcStmt = db.prepare(`INSERT INTO iqc (date, lot, supplier, item, inspector, qty, fail) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const ipqcStmt = db.prepare(`INSERT INTO ipqc (date, product, lot, visual, viscosity, solid, particle, qty, fail, judge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const oqcStmt = db.prepare(`INSERT INTO oqc (date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const worklogStmt = db.prepare(`INSERT INTO worklog (workDate, finishedLot, seq, material, supName, inputQty, inputRatio, lotNo, inputTime, worker, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    supplierRows.forEach(row => supplierStmt.run(row.name || '', row.manager || '', row.phone || '', row.category || '', row.status || '사용'));
    iqcRows.forEach(row => iqcStmt.run(row.date || '', row.lot || '', row.supplier || '', row.item || '', row.inspector || '', Number(row.qty || 0), Number(row.fail || 0)));
    ipqcRows.forEach(row => ipqcStmt.run(row.date || '', row.product || '', row.lot || '', row.visual || '', row.viscosity || '', row.solid || '', row.particle || '', Number(row.qty || 0), Number(row.fail || 0), row.judge || '합격'));
    oqcRows.forEach(row => oqcStmt.run(row.date || '', row.customer || '', row.product || '', row.lot || '', row.visual || '', row.viscosity || '', row.solid || '', row.particle || '', row.adhesion || '', row.resistance || '', row.swelling || '', row.moisture || '', Number(row.qty || 0), Number(row.fail || 0), row.judge || '합격'));
    worklogRows.forEach(row => worklogStmt.run(row.workDate || '', row.finishedLot || '', row.seq || '', row.material || '', row.supName || '', row.inputQty || '', row.inputRatio || '', row.lotNo || '', row.inputTime || '', row.worker || '', row.note || ''));

    supplierStmt.finalize();
    iqcStmt.finalize();
    ipqcStmt.finalize();
    oqcStmt.finalize();
    worklogStmt.finalize();

    db.run('COMMIT', err => {
      if (err) return dbError(res, err, '엑셀 반영 오류');
      addChangeLog('import', '엑셀반영', '엑셀 반영 완료');
      res.json({ ok: true });
    });
  });
});

app.post('/api/admin/delete-all', requireAdmin, (req, res) => {
  if (req.body.confirm !== 'DELETE') {
    return res.status(400).json({ error: 'confirm 값이 올바르지 않습니다.' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run(`DELETE FROM iqc`);
    db.run(`DELETE FROM ipqc`);
    db.run(`DELETE FROM oqc`);
    db.run(`DELETE FROM suppliers`);
    db.run(`DELETE FROM worklog`);
    db.run(`DELETE FROM change_logs`);
    db.run('COMMIT', err => {
      if (err) return dbError(res, err, '전체 삭제 오류');
      res.json({ ok: true });
    });
  });
});
// =============================
// 부적합 관리 API
// =============================

app.get('/api/nonconform', requireAuth, (req, res) => {
  db.all(
    `SELECT id, date, type, lot, item, issue, cause, action, owner, status
     FROM nonconform
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) return dbError(res, err, '부적합 조회 오류');
      res.json(rows || []);
    }
  );
});

app.post('/api/nonconform', requireAuth, (req, res) => {
  const {
    date = '',
    type = '',
    lot = '',
    item = '',
    issue = '',
    cause = '',
    action = '',
    owner = '',
    status = '대기'
  } = req.body || {};

  db.run(
    `INSERT INTO nonconform (date, type, lot, item, issue, cause, action, owner, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [date, type, lot, item, issue, cause, action, owner, status],
    function (err) {
      if (err) return dbError(res, err, '부적합 등록 오류');
      res.status(201).json({ id: this.lastID, ok: true });
    }
  );
});
// 수정
app.put('/api/nonconform/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const {
    date = '',
    type = '',
    lot = '',
    item = '',
    issue = '',
    cause = '',
    action = '',
    owner = '',
    status = '대기'
  } = req.body || {};

  db.run(
    `UPDATE nonconform
     SET date = ?, type = ?, lot = ?, item = ?, issue = ?, cause = ?, action = ?, owner = ?, status = ?
     WHERE id = ?`,
    [date, type, lot, item, issue, cause, action, owner, status, id],
    function (err) {
      if (err) return dbError(res, err, '부적합 수정 오류');
      if (this.changes === 0) {
        return res.status(404).json({ error: '부적합 데이터를 찾을 수 없습니다.' });
      }
      res.json({ ok: true });
    }
  );
});

// 삭제
app.delete('/api/nonconform/:id', requireAuth, (req, res) => {
  const { id } = req.params;

  db.run(
    `DELETE FROM nonconform WHERE id = ?`,
    [id],
    function (err) {
      if (err) return dbError(res, err, '부적합 삭제 오류');
      if (this.changes === 0) {
        return res.status(404).json({ error: '부적합 데이터를 찾을 수 없습니다.' });
      }
      res.json({ ok: true });
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
});