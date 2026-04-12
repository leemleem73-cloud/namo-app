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
} catch (e) {}

const app = express();
const SESSION_SECRET = process.env.SESSION_SECRET || 'namo-secret';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true
    }
  })
);

// =============================
// 🔥 DB 경로 (완전 안전 버전)
// =============================
const dbPath = path.join(__dirname, 'quality.db');

// 절대 /var/data 사용 안함
try {
  if (!fs.existsSync(__dirname)) {
    fs.mkdirSync(__dirname, { recursive: true });
  }
} catch (e) {
  console.error('폴더 생성 실패:', e);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('DB 연결 실패:', err);
    process.exit(1);
  }
  console.log('DB 연결 성공:', dbPath);
});

// =============================
// 기본 함수
// =============================
const makeId = (p) => `${p}_${crypto.randomUUID()}`;
const safeText = (v) => String(v || '').trim();
const safeNumber = (v) => Number(v) || 0;

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
      role TEXT DEFAULT 'user'
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
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '필수값 없음' });
  }

  const hash = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (name,email,password,department)
     VALUES (?,?,?,?)`,
    [safeText(name), safeText(email), hash, safeText(department)],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email=?`, [email], async (err, user) => {
    if (!user) return res.status(401).json({ error: '없음' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: '틀림' });

    req.session.user = user;
    res.json({ ok: true });
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

// =============================
// IQC
// =============================
app.get('/api/iqc', (req, res) => {
  db.all(`SELECT * FROM iqc ORDER BY date DESC`, [], (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/api/iqc', (req, res) => {
  const d = req.body;

  db.run(
    `INSERT INTO iqc VALUES (?,?,?,?,?,?,?,?)`,
    [
      makeId('iqc'),
      d.date,
      d.lot,
      d.supplier,
      d.item,
      d.inspector,
      safeNumber(d.qty),
      safeNumber(d.fail)
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

// =============================
// 정적 파일
// =============================
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('서버 실행:', PORT);
});
