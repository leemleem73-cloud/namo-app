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
const safeText = (v, m = 100) => String(v || '').trim().slice(0, m);
const safeNumber = (v) => Number(v) || 0;
const makeId = (p) => `${p}_${crypto.randomUUID()}`;

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

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      department TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'APPROVED'
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

  db.get(`SELECT COUNT(*) AS count FROM users`, [], async (err, row) => {
  if (err) {
    console.error('관리자 계정 확인 실패:', err.message);
    return;
  }

  if ((row?.count || 0) === 0) {
    try {
      const hashed = await bcrypt.hash('admin1234', 10);
      db.run(
        `INSERT INTO users (name, email, password, department, role, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['관리자', 'admin@namochemical.com', hashed, '관리부', 'admin', 'APPROVED'],
        (insertErr) => {
          if (insertErr) {
            console.error('기본 관리자 생성 실패:', insertErr.message);
          } else {
            console.log('기본 관리자 계정 생성 완료: admin@namochemical.com / admin1234');
          }
        }
      );
    } catch (hashErr) {
      console.error('기본 관리자 비밀번호 해시 실패:', hashErr.message);
    }
  }
});

// --------------------
// API 먼저
// --------------------

app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호 필요' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (name, email, password, department, role, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [safeText(name), normalizeEmail(email), hashed, safeText(department), 'user', 'APPROVED'],
      function (err) {
        if (err) {
          if (err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: '이미 존재하는 이메일' });
          }
          return res.status(500).json({ error: err.message });
        }
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
        role: user.role,
        status: user.status
      };

      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).json({ error: '세션 저장 실패' });
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
  if (!req.session) return res.json({ ok: true });
  req.session.destroy(() => res.json({ ok: true }));
});

app.post('/api/auth/reset-password', (req, res) => {
  res.status(403).json({ error: '비활성화됨' });
});

app.get('/api/admin/users', requireAdmin, adminLimiter, (req, res) => {
  db.all(
    `SELECT id, name, email, department, role, status
     FROM users
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/admin/delete-all', requireAdmin, (req, res) => {
  res.json({ ok: true });
});

app.get('/api/iqc', requireLogin, (req, res) => {
  db.all(`SELECT * FROM iqc ORDER BY date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/iqc', requireLogin, (req, res) => {
  const d = req.body;

  db.run(
    `INSERT INTO iqc (id, date, lot, supplier, item, inspector, qty, fail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      makeId('iqc'),
      safeText(d.date),
      safeText(d.lot),
      safeText(d.supplier),
      safeText(d.item),
      safeText(d.inspector),
      safeNumber(d.qty),
      safeNumber(d.fail)
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

app.delete('/api/iqc/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM iqc WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// 프론트가 호출하는 나머지 API 임시 대응
app.get('/api/suppliers', requireLogin, (req, res) => res.json([]));
app.get('/api/ipqc', requireLogin, (req, res) => res.json([]));
app.get('/api/oqc', requireLogin, (req, res) => res.json([]));
app.get('/api/worklog', requireLogin, (req, res) => res.json([]));
app.get('/api/change-logs', requireLogin, (req, res) => res.json([]));
app.get('/api/nonconform', requireLogin, (req, res) => res.json([]));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// --------------------
// 정적 파일
// --------------------
app.use(express.static(path.join(__dirname, 'public')));

// --------------------
// fallback
// --------------------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`서버 실행: ${PORT}`);
});
