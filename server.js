// =============================
// 기본 설정
// =============================
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

const SESSION_SECRET = process.env.SESSION_SECRET || 'namo-default-secret';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: SESSION_SECRET,
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

// 정적 파일 public만 공개
app.use(express.static(path.join(__dirname, 'public')));

// =============================
// Rate Limit
// =============================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30
});

// =============================
// DB 경로
// =============================
function resolveDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;

  // Render에서는 쓰기 가능한 경로를 사용해야 함
  // Persistent Disk를 연결했다면 /var/data 사용 권장
  if (process.env.RENDER) {
    return '/var/data/quality.db';
  }

  return path.join(__dirname, 'quality.db');
}

const dbPath = resolveDbPath();

try {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
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

// =============================
// 공통 함수
// =============================
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
});

// =============================
// 인증
// =============================
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호 필요' });
    }

    const hashed = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (name, email, password, department, role, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        safeText(name),
        normalizeEmail(email),
        hashed,
        safeText(department),
        'user',
        'APPROVED'
      ],
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
      if (!user) return res.status(401).json({ error: '없음' });

      const ok = await bcrypt.compare(password || '', user.password || '');
      if (!ok) return res.status(401).json({ error: '틀림' });

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        status: user.status
      };

      res.json({ ok: true, user: req.session.user });
    }
  );
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.post('/api/auth/logout', requireLogin, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// 비밀번호 재설정 비활성화
app.post('/api/auth/reset-password', (req, res) => {
  res.status(403).json({ error: '비활성화됨' });
});

// =============================
// 관리자
// =============================
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

// =============================
// IQC
// =============================
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

// =============================
// 헬스체크
// =============================
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// =============================
// SPA fallback
// =============================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================
// 서버 실행
// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`서버 실행: ${PORT}`);
});
