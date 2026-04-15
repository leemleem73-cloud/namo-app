console.log("NEW CODE DEPLOYED");

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv 없음, 계속 진행');
}

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'namo-secret';

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      sameSite: process.env.RENDER ? 'none' : 'lax',
      secure: !!process.env.RENDER,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30
});

const dbPath = path.join(__dirname, 'quality.db');

try {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (err) {
  console.error('DB 디렉토리 생성 실패:', err);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('DB 연결 실패:', err);
    process.exit(1);
  }
  console.log('DB 연결 성공:', dbPath);
});

const normalizeEmail = (e) => String(e || '').trim().toLowerCase();
const safeText = (v, m = 300) => String(v || '').trim().slice(0, m);
const safeNumber = (v) => Number(v) || 0;
const makeId = (p) => `${p}_${crypto.randomUUID()}`;
const todayText = () => new Date().toISOString().slice(0, 10);

const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인 필요' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.session.user?.role !== 'admin') {
    return res.status(403).json({ error: '관리자만' });
  }
  next();
};

function addChangeLog(message) {
  return new Promise((resolve) => {
    db.run(
      `INSERT INTO change_logs (id, logDate, message) VALUES (?, ?, ?)`,
      [makeId('log'), new Date().toLocaleString('ko-KR'), safeText(message, 1000)],
      () => resolve()
    );
  });
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      department TEXT,
      title TEXT DEFAULT 'staff',
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'APPROVED',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
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
      qty INTEGER,
      fail INTEGER
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
    CREATE TABLE IF NOT EXISTS ipqc (
      id TEXT PRIMARY KEY,
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
      qty INTEGER,
      fail INTEGER,
      judge TEXT
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

  db.run(`
    CREATE TABLE IF NOT EXISTS change_logs (
      id TEXT PRIMARY KEY,
      logDate TEXT,
      message TEXT
    )
  `);

  db.get(
    `SELECT id, email FROM users WHERE email = ?`,
    ['admin@namochemical.com'],
    async (err, adminRow) => {
      if (err) {
        console.error('관리자 계정 확인 실패:', err.message);
        return;
      }

      try {
        const hashed = await bcrypt.hash('admin1234', 10);

        if (adminRow) {
          db.run(
            `
            UPDATE users
            SET name = ?, password = ?, department = ?, title = ?, role = ?, status = ?
            WHERE email = ?
            `,
            ['관리자', hashed, '관리부', 'admin', 'admin', 'APPROVED', 'admin@namochemical.com'],
            (updateErr) => {
              if (updateErr) {
                console.error('기본 관리자 계정 갱신 실패:', updateErr.message);
              } else {
                console.log('기본 관리자 계정 갱신 완료: admin@namochemical.com / admin1234');
              }
            }
          );
        } else {
          db.run(
            `
            INSERT INTO users (name, email, password, department, title, role, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            ['관리자', 'admin@namochemical.com', hashed, '관리부', 'admin', 'admin', 'APPROVED'],
            (insertErr) => {
              if (insertErr) {
                console.error('기본 관리자 생성 실패:', insertErr.message);
              } else {
                console.log('기본 관리자 계정 생성 완료: admin@namochemical.com / admin1234');
              }
            }
          );
        }
      } catch (hashErr) {
        console.error('기본 관리자 비밀번호 해시 실패:', hashErr.message);
      }
    }
  );
});

// --------------------
// 인증 API
// --------------------

app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: '이름, 이메일, 비밀번호를 입력하세요.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (name, email, password, department, title, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        safeText(name),
        normalizeEmail(email),
        hashed,
        safeText(department),
        'staff',
        'user',
        'APPROVED'
      ],
      async function (err) {
        if (err) {
          if (err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: '이미 존재하는 이메일입니다.' });
          }
          return res.status(500).json({ error: err.message });
        }
        await addChangeLog(`회원가입: ${normalizeEmail(email)}`);
        res.json({ ok: true, id: this.lastID });
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  const { email, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [normalizeEmail(email)],
    async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: '존재하지 않는 계정입니다.' });

      const ok = await bcrypt.compare(password || '', user.password || '');
      if (!ok) return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        title: user.title,
        role: user.role,
        status: user.status
      };

      req.session.save(async (saveErr) => {
        if (saveErr) return res.status(500).json({ error: '세션 저장 실패' });
        await addChangeLog(`로그인: ${user.email}`);
        res.json({ ok: true, user: req.session.user });
      });
    }
  );
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인 필요' });
  }
  res.json(req.session.user);
});

app.post('/api/auth/logout', (req, res) => {
  const email = req.session?.user?.email || '';
  if (!req.session) return res.json({ ok: true });
  req.session.destroy(async () => {
    if (email) await addChangeLog(`로그아웃: ${email}`);
    res.json({ ok: true });
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  res.status(403).json({ error: '비활성화됨' });
});

app.post('/api/auth/change-password', requireLogin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호가 필요합니다.' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: '새 비밀번호는 8자 이상이어야 합니다.' });
    }

    db.get(
      `SELECT * FROM users WHERE id = ?`,
      [req.session.user.id],
      async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

        const ok = await bcrypt.compare(currentPassword, user.password || '');
        if (!ok) {
          return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        db.run(
          `UPDATE users SET password = ? WHERE id = ?`,
          [hashed, req.session.user.id],
          async (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            await addChangeLog(`비밀번호 변경: ${user.email}`);
            res.json({ ok: true, message: '비밀번호가 변경되었습니다.' });
          }
        );
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --------------------
// 관리자 / 회원관리
// --------------------

app.get('/api/admin/users', requireAdmin, adminLimiter, (req, res) => {
  db.all(
    `SELECT id, name, email, department, title, role, status, createdAt
     FROM users
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/admin/users/:id/approve', requireAdmin, (req, res) => {
  db.run(
    `UPDATE users SET status = 'APPROVED' WHERE id = ?`,
    [req.params.id],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`회원 승인: ${req.params.id}`);
      res.json({ ok: true, message: '회원 승인이 완료되었습니다.' });
    }
  );
});

app.post('/api/admin/users/:id/reject', requireAdmin, (req, res) => {
  db.run(
    `UPDATE users SET status = 'REJECTED' WHERE id = ?`,
    [req.params.id],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`회원 반려: ${req.params.id}`);
      res.json({ ok: true, message: '회원 반려가 완료되었습니다.' });
    }
  );
});

app.put('/api/admin/users/:id', requireAdmin, (req, res) => {
  const d = req.body;
  db.run(
    `UPDATE users
     SET name=?, email=?, department=?, title=?, role=?, status=?
     WHERE id=?`,
    [
      safeText(d.name),
      normalizeEmail(d.email),
      safeText(d.department),
      safeText(d.title || 'staff'),
      safeText(d.role || 'user'),
      safeText(d.status || 'APPROVED'),
      req.params.id
    ],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`회원 수정: ${req.params.id}`);
      res.json({ ok: true, message: '회원 정보가 저장되었습니다.' });
    }
  );
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    await addChangeLog(`회원 삭제: ${req.params.id}`);
    res.json({ ok: true, message: '회원 삭제가 완료되었습니다.' });
  });
});

app.post('/api/admin/delete-all', requireAdmin, (req, res) => {
  db.serialize(() => {
    db.run(`DELETE FROM iqc`);
    db.run(`DELETE FROM suppliers`);
    db.run(`DELETE FROM ipqc`);
    db.run(`DELETE FROM oqc`);
    db.run(`DELETE FROM worklog`);
    db.run(`DELETE FROM nonconform`);
    db.run(`DELETE FROM change_logs`, async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog('전체 데이터 삭제 실행');
      res.json({ ok: true, message: '전체 데이터 삭제 완료' });
    });
  });
});

// --------------------
// IQC
// --------------------

app.get('/api/iqc', requireLogin, (req, res) => {
  db.all(`SELECT * FROM iqc ORDER BY date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/iqc', requireLogin, (req, res) => {
  const d = req.body;

  if (!safeText(d.lot)) {
    return res.status(400).json({ error: 'LOT No를 입력하세요.' });
  }

  db.run(
    `INSERT INTO iqc (id, date, lot, supplier, item, inspector, qty, fail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      makeId('iqc'),
      safeText(d.date || todayText()),
      safeText(d.lot),
      safeText(d.supplier),
      safeText(d.item),
      safeText(d.inspector),
      safeNumber(d.qty),
      safeNumber(d.fail)
    ],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`IQC 등록: ${safeText(d.lot)}`);
      res.json({ ok: true });
    }
  );
});

app.put('/api/iqc/:id', requireLogin, (req, res) => {
  const d = req.body;

  db.run(
    `UPDATE iqc
     SET date=?, lot=?, supplier=?, item=?, inspector=?, qty=?, fail=?
     WHERE id=?`,
    [
      safeText(d.date),
      safeText(d.lot),
      safeText(d.supplier),
      safeText(d.item),
      safeText(d.inspector),
      safeNumber(d.qty),
      safeNumber(d.fail),
      req.params.id
    ],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`IQC 수정: ${req.params.id}`);
      res.json({ ok: true });
    }
  );
});

app.delete('/api/iqc/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM iqc WHERE id = ?`, [req.params.id], async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    await addChangeLog(`IQC 삭제: ${req.params.id}`);
    res.json({ ok: true });
  });
});

// --------------------
// Suppliers
// --------------------

app.get('/api/suppliers', requireLogin, (req, res) => {
  db.all(`SELECT * FROM suppliers ORDER BY name ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/suppliers', requireLogin, (req, res) => {
  const d = req.body;

  if (!safeText(d.name)) {
    return res.status(400).json({ error: '공급업체명을 입력하세요.' });
  }

  db.run(
    `INSERT INTO suppliers (id, name, manager, phone, category, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      makeId('sup'),
      safeText(d.name),
      safeText(d.manager),
      safeText(d.phone),
      safeText(d.category),
      safeText(d.status || '사용')
    ],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`공급업체 등록: ${safeText(d.name)}`);
      res.json({ ok: true });
    }
  );
});

app.put('/api/suppliers/:id', requireLogin, (req, res) => {
  const d = req.body;

  db.run(
    `UPDATE suppliers
     SET name=?, manager=?, phone=?, category=?, status=?
     WHERE id=?`,
    [
      safeText(d.name),
      safeText(d.manager),
      safeText(d.phone),
      safeText(d.category),
      safeText(d.status),
      req.params.id
    ],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`공급업체 수정: ${req.params.id}`);
      res.json({ ok: true });
    }
  );
});

app.delete('/api/suppliers/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM suppliers WHERE id=?`, [req.params.id], async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    await addChangeLog(`공급업체 삭제: ${req.params.id}`);
    res.json({ ok: true });
  });
});
// --------------------
// IPQC
// --------------------

app.get('/api/ipqc', requireLogin, (req, res) => {
  db.all(`SELECT * FROM ipqc ORDER BY date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/ipqc', requireLogin, (req, res) => {
  const d = req.body;

  if (!safeText(d.lot)) {
    return res.status(400).json({ error: 'LOT No를 입력하세요.' });
  }

  db.run(
    `INSERT INTO ipqc (id, date, product, lot, visual, viscosity, solid, particle, qty, fail, judge)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      makeId('ipqc'),
      safeText(d.date || todayText()),
      safeText(d.product),
      safeText(d.lot),
      safeText(d.visual),
      safeText(d.viscosity),
      safeText(d.solid),
      safeText(d.particle),
      safeNumber(d.qty),
      safeNumber(d.fail),
      safeText(d.judge)
    ],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`IPQC 등록: ${safeText(d.lot)}`);
      res.json({ ok: true });
    }
  );
});

app.put('/api/ipqc/:id', requireLogin, (req, res) => {
  const d = req.body;

  db.run(
    `UPDATE ipqc
     SET date=?, product=?, lot=?, visual=?, viscosity=?, solid=?, particle=?, qty=?, fail=?, judge=?
     WHERE id=?`,
    [
      safeText(d.date),
      safeText(d.product),
      safeText(d.lot),
      safeText(d.visual),
      safeText(d.viscosity),
      safeText(d.solid),
      safeText(d.particle),
      safeNumber(d.qty),
      safeNumber(d.fail),
      safeText(d.judge),
      req.params.id
    ],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`IPQC 수정: ${req.params.id}`);
      res.json({ ok: true });
    }
  );
});

app.delete('/api/ipqc/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM ipqc WHERE id=?`, [req.params.id], async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    await addChangeLog(`IPQC 삭제: ${req.params.id}`);
    res.json({ ok: true });
  });
});

// --------------------
// OQC
// --------------------

app.get('/api/oqc', requireLogin, (req, res) => {
  db.all(`SELECT * FROM oqc ORDER BY date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/oqc', requireLogin, (req, res) => {
  const d = req.body;

  if (!safeText(d.lot)) {
    return res.status(400).json({ error: 'LOT No를 입력하세요.' });
  }

  db.run(
    `INSERT INTO oqc (id, date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      makeId('oqc'),
      safeText(d.date || todayText()),
      safeText(d.customer),
      safeText(d.product),
      safeText(d.lot),
      safeText(d.visual),
      safeText(d.viscosity),
      safeText(d.solid),
      safeText(d.particle),
      safeText(d.adhesion),
      safeText(d.resistance),
      safeText(d.swelling),
      safeText(d.moisture),
      safeNumber(d.qty),
      safeNumber(d.fail),
      safeText(d.judge)
    ],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`OQC 등록: ${safeText(d.lot)}`);
      res.json({ ok: true });
    }
  );
});

app.put('/api/oqc/:id', requireLogin, (req, res) => {
  const d = req.body;

  db.run(
    `UPDATE oqc
     SET date=?, customer=?, product=?, lot=?, visual=?, viscosity=?, solid=?, particle=?, adhesion=?, resistance=?, swelling=?, moisture=?, qty=?, fail=?, judge=?
     WHERE id=?`,
    [
      safeText(d.date),
      safeText(d.customer),
      safeText(d.product),
      safeText(d.lot),
      safeText(d.visual),
      safeText(d.viscosity),
      safeText(d.solid),
      safeText(d.particle),
      safeText(d.adhesion),
      safeText(d.resistance),
      safeText(d.swelling),
      safeText(d.moisture),
      safeNumber(d.qty),
      safeNumber(d.fail),
      safeText(d.judge),
      req.params.id
    ],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`OQC 수정: ${req.params.id}`);
      res.json({ ok: true });
    }
  );
});

app.delete('/api/oqc/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM oqc WHERE id=?`, [req.params.id], async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    await addChangeLog(`OQC 삭제: ${req.params.id}`);
    res.json({ ok: true });
  });
});

// --------------------
// Worklog
// --------------------

app.get('/api/worklog', requireLogin, (req, res) => {
  db.all(`SELECT * FROM worklog ORDER BY workDate DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/worklog', requireLogin, (req, res) => {
  const d = req.body;

  if (!safeText(d.material)) {
    return res.status(400).json({ error: '원자재명을 입력하세요.' });
  }

  db.run(
    `INSERT INTO worklog (id, workDate, finishedLot, seq, material, supName, inputQty, inputRatio, lotNo, inputTime, worker, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      makeId('work'),
      safeText(d.workDate || todayText()),
      safeText(d.finishedLot),
      safeText(d.seq),
      safeText(d.material),
      safeText(d.supName),
      safeText(d.inputQty),
      safeText(d.inputRatio),
      safeText(d.lotNo),
      safeText(d.inputTime),
      safeText(d.worker),
      safeText(d.note)
    ],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`작업일지 등록: ${safeText(d.finishedLot) || safeText(d.material)}`);
      res.json({ ok: true });
    }
  );
});

app.put('/api/worklog/:id', requireLogin, (req, res) => {
  const d = req.body;

  db.run(
    `UPDATE worklog
     SET workDate=?, finishedLot=?, seq=?, material=?, supName=?, inputQty=?, inputRatio=?, lotNo=?, inputTime=?, worker=?, note=?
     WHERE id=?`,
    [
      safeText(d.workDate),
      safeText(d.finishedLot),
      safeText(d.seq),
      safeText(d.material),
      safeText(d.supName),
      safeText(d.inputQty),
      safeText(d.inputRatio),
      safeText(d.lotNo),
      safeText(d.inputTime),
      safeText(d.worker),
      safeText(d.note),
      req.params.id
    ],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`작업일지 수정: ${req.params.id}`);
      res.json({ ok: true });
    }
  );
});

app.delete('/api/worklog/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM worklog WHERE id=?`, [req.params.id], async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    await addChangeLog(`작업일지 삭제: ${req.params.id}`);
    res.json({ ok: true });
  });
});

// --------------------
// Nonconform
// --------------------

app.get('/api/nonconform', requireLogin, (req, res) => {
  db.all(`SELECT * FROM nonconform ORDER BY date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/nonconform', requireLogin, (req, res) => {
  const d = req.body;

  db.run(
    `INSERT INTO nonconform (id, date, type, lot, item, issue, cause, action, owner, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      makeId('nc'),
      safeText(d.date || todayText()),
      safeText(d.type),
      safeText(d.lot),
      safeText(d.item),
      safeText(d.issue),
      safeText(d.cause),
      safeText(d.action),
      safeText(d.owner),
      safeText(d.status || '대기')
    ],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`부적합 등록: ${safeText(d.lot) || safeText(d.item)}`);
      res.json({ ok: true });
    }
  );
});

app.put('/api/nonconform/:id', requireLogin, (req, res) => {
  const d = req.body;

  db.run(
    `UPDATE nonconform
     SET date=?, type=?, lot=?, item=?, issue=?, cause=?, action=?, owner=?, status=?
     WHERE id=?`,
    [
      safeText(d.date),
      safeText(d.type),
      safeText(d.lot),
      safeText(d.item),
      safeText(d.issue),
      safeText(d.cause),
      safeText(d.action),
      safeText(d.owner),
      safeText(d.status),
      req.params.id
    ],
    async (err) => {
      if (err) return res.status(500).json({ error: err.message });
      await addChangeLog(`부적합 수정: ${req.params.id}`);
      res.json({ ok: true });
    }
  );
});

app.delete('/api/nonconform/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM nonconform WHERE id=?`, [req.params.id], async (err) => {
    if (err) return res.status(500).json({ error: err.message });
    await addChangeLog(`부적합 삭제: ${req.params.id}`);
    res.json({ ok: true });
  });
});

// --------------------
// Change Logs
// --------------------

app.get('/api/change-logs', requireLogin, (req, res) => {
  db.all(`SELECT * FROM change_logs ORDER BY logDate DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/change-logs', requireLogin, (req, res) => {
  const d = req.body;

  db.run(
    `INSERT INTO change_logs (id, logDate, message)
     VALUES (?, ?, ?)`,
    [
      makeId('log'),
      safeText(d.logDate || new Date().toLocaleString('ko-KR')),
      safeText(d.message, 1000)
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

// --------------------
// Health
// --------------------

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// --------------------
// Static
// --------------------

app.use(express.static(path.join(__dirname, 'public')));

// --------------------
// Fallback
// --------------------

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --------------------
// Server
// --------------------

app.listen(PORT, () => {
  console.log(`서버 실행: ${PORT}`);
});
