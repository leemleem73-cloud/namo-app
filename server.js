const fs = require('fs');
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcrypt');
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
      secure: false, // Render HTTPS 쓰면 true로 바꿔도 됨
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

// 정적 폴더
app.use(express.static(path.join(__dirname, 'public')));


// =============================
// DB 경로 설정 (핵심)
// =============================
function resolveDbPath() {
  if (process.env.DB_PATH && process.env.DB_PATH.trim() !== '') {
    return process.env.DB_PATH.trim();
  }

  // Render 환경인데 DB_PATH 없을 경우
  if (process.env.RENDER) {
    return '/tmp/quality.db';
  }

  // 로컬 기본
  return path.join(__dirname, 'quality.db');
}

const dbPath = resolveDbPath();
const dbDir = path.dirname(dbPath);

// 폴더 없으면 생성
try {
  fs.mkdirSync(dbDir, { recursive: true });
} catch (err) {
  console.error('DB 디렉토리 생성 실패:', err.message);
}

console.log('RENDER:', process.env.RENDER || 'false');
console.log('DB_PATH env:', process.env.DB_PATH || '(not set)');
console.log('Final DB path:', dbPath);

// DB 연결
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
function dbError(res, err, label = 'DB 오류') {
  console.error(label, err.message);
  return res.status(500).json({ error: err.message });
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

// =============================
// DB 초기화
// =============================
db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      department TEXT,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'PENDING'
    )
    `,
    (err) => {
      if (err) {
        console.error('users 테이블 생성 실패:', err.message);
      } else {
        console.log('users 테이블 준비 완료');
      }
    }
  );
});

// =============================
// 기본 라우트
// =============================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  res.json(req.session.user);
});

// =============================
// 회원가입
// =============================
app.post('/api/auth/signup', async (req, res) => {
  try {
    const name = req.body.name;
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const department = req.body.department || null;

    if (!name || !email || !password) {
      return res.status(400).json({ error: '필수값 누락' });
    }

    const hashed = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (name, email, password, department) VALUES (?, ?, ?, ?)`,
      [name, email, hashed, department],
      function (err) {
        if (err) return dbError(res, err);
        res.json({ ok: true, id: this.lastID });
      }
    );
  } catch (err) {
    console.error('회원가입 오류:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================
// 로그인
// =============================
app.post('/api/auth/login', (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력하세요.' });
  }

  db.get(`SELECT * FROM users WHERE email=?`, [email], async (err, user) => {
    if (err) return dbError(res, err);
    if (!user) return res.status(401).json({ error: '사용자 없음' });

    try {
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: '비밀번호 틀림' });

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status
      };

      res.json({ ok: true, user: req.session.user });
    } catch (err2) {
      console.error('비밀번호 비교 오류:', err2.message);
      res.status(500).json({ error: err2.message });
    }
  });
});

// =============================
// 로그아웃
// =============================
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('로그아웃 오류:', err.message);
      return res.status(500).json({ error: '로그아웃 실패' });
    }
    res.json({ ok: true });
  });
});

// =============================
// 관리자 테스트 API
// =============================
app.get('/api/admin/check', requireAdmin, (req, res) => {
  res.json({ ok: true });
});

// =============================
// 에러 핸들러
// =============================
app.use((err, req, res, next) => {
  console.error('서버 오류:', err.stack || err.message);
  res.status(500).json({ error: '서버 내부 오류' });
});

// =============================
// 서버 실행
// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행: ${PORT}`);
});
