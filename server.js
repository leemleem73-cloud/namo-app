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
      secure: false,
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
        return;
      }

      console.log('users 테이블 준비 완료');

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
            const hashed = await bcrypt.hash('1234', 10);

            db.run(
              `INSERT INTO users (name, email, password, department, role, status)
               VALUES (?, ?, ?, ?, ?, ?)`,
              ['관리자', 'admin@namochemical.com', hashed, '관리부', 'admin', 'APPROVED'],
              (err) => {
                if (err) {
                  console.error('관리자 생성 실패:', err.message);
                } else {
                  console.log('기본 관리자 계정 생성 완료');
                }
              }
            );
          } catch (e) {
            console.error('관리자 생성 오류:', e.message);
          }
        }
      );
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
// 공통 함수
// =============================
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isAdmin(req) {
  return !!req.session.user && String(req.session.user.role).toLowerCase() === 'admin';
}

// =============================
// 회원가입
// =============================
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: '필수값 누락' });
    }

    const hashed = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (name, email, password, department) VALUES (?, ?, ?, ?)`,
      [name, normalizeEmail(email), hashed, department || ''],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          ok: true,
          message: '회원가입 신청이 완료되었습니다.'
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// 로그인
// =============================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [normalizeEmail(email)],
    async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: '사용자 없음' });

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: '비밀번호 틀림' });

      if (user.status !== 'APPROVED') {
        return res.status(403).json({ error: '승인 대기 계정입니다.' });
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      };

      req.session.save((saveErr) => {
        if (saveErr) {
          return res.status(500).json({ error: '세션 저장 실패' });
        }

        res.json({ ok: true });
      });
    }
  );
});

// =============================
// 로그인 사용자 확인
// =============================
app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인 필요' });
  }

  res.json({
    id: req.session.user.id,
    name: req.session.user.name,
    email: req.session.user.email,
    role: req.session.user.role,
    status: req.session.user.status
  });
});

// =============================
// 로그아웃
// =============================
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: '로그아웃 실패' });
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// =============================
// 관리자 - 전체 회원 조회
// =============================
app.get('/api/admin/users', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
  }

  db.all(
    `SELECT id, name, email, department, role, status
FROM users
WHERE role != 'admin'
ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// =============================
// 관리자 - 회원 승인
// =============================
app.post('/api/admin/users/:id/approve', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
  }

  db.run(
    `UPDATE users SET status = 'APPROVED' WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, message: '회원 승인이 완료되었습니다.' });
    }
  );
});

// =============================
// 관리자 - 회원 반려
// =============================
app.post('/api/admin/users/:id/reject', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
  }

  db.run(
    `UPDATE users SET status = 'REJECTED' WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, message: '회원 반려가 완료되었습니다.' });
    }
  );
});

// =============================
// 관리자 - 회원 삭제
// =============================
app.delete('/api/admin/users/:id', (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: '관리자만 접근 가능합니다.' });
  }

  db.run(
    `DELETE FROM users WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, message: '회원 삭제가 완료되었습니다.' });
    }
  );
});

// =============================
// 임시 데이터 API
// 프론트에서 호출하는 주소가 없어서 에러 나는 것 방지
// =============================
app.get('/api/ipqc', (req, res) => {
  res.json([]);
});

app.get('/api/iqc', (req, res) => {
  res.json([]);
});

app.get('/api/oqc', (req, res) => {
  res.json([]);
});

app.get('/api/suppliers', (req, res) => {
  res.json([]);
});

app.get('/api/worklog', (req, res) => {
  res.json([]);
});

app.get('/api/change-logs', (req, res) => {
  res.json([]);
});

app.get('/api/nonconform', (req, res) => {
  res.json([]);
});

// =============================
// 서버 실행
// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행: ${PORT}`);
});
