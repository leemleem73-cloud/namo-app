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
require('dotenv').config();

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required');
}

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
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

  if (process.env.RENDER) {
    return '/opt/render/project/src/storage/quality.db';
  }

  return path.join(__dirname, 'quality.db');
}

const dbPath = resolveDbPath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath);

// =============================
// 공통 함수
// =============================
const normalizeEmail = (e) => String(e || '').trim().toLowerCase();
const safeText = (v, m = 100) => String(v || '').slice(0, m);
const safeNumber = (v) => Number(v) || 0;
const makeId = (p) => `${p}_${crypto.randomUUID()}`;

const requireLogin = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: '로그인 필요' });
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.session.user?.role !== 'admin')
    return res.status(403).json({ error: '관리자만' });
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
});

// =============================
// 인증
// =============================
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (name,email,password,department,role,status)
       VALUES (?,?,?,?,?,?)`,
      [
        safeText(name),
        normalizeEmail(email),
        hashed,
        safeText(department),
        'user',
        'APPROVED' // 🔥 자동 승인
      ],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ok: true });
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  const { email, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE email=?`,
    [normalizeEmail(email)],
    async (err, user) => {
      if (!user) return res.status(401).json({ error: '없음' });

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: '틀림' });

      req.session.user = user;
      res.json({ ok: true });
    }
  );
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.post('/api/auth/logout', requireLogin, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ❌ 비밀번호 재설정 막음
app.post('/api/auth/reset-password', (req, res) => {
  res.status(403).json({ error: '비활성화됨' });
});

// =============================
// 관리자
// =============================
app.get('/api/admin/users', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM users`, [], (err, rows) => {
    res.json(rows);
  });
});

// =============================
// IQC 예시 (CRUD 보호)
// =============================
app.get('/api/iqc', requireLogin, (req, res) => {
  db.all(`SELECT * FROM iqc ORDER BY date DESC`, [], (e, r) => res.json(r));
});

app.post('/api/iqc', requireLogin, (req, res) => {
  const d = req.body;

  db.run(
    `INSERT INTO iqc VALUES (?,?,?,?,?,?,?,?)`,
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
    () => res.json({ ok: true })
  );
});

app.delete('/api/iqc/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM iqc WHERE id=?`, [req.params.id], () =>
    res.json({ ok: true })
  );
});

// =============================
// 서버 실행
// =============================
app.listen(process.env.PORT || 3000, () => {
  console.log('서버 실행');
});
