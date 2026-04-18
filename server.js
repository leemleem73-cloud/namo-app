const { Pool } = require('pg');
console.log("NEW CODE DEPLOYED");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

console.log("이 파일 실행중:", __filename);
console.log("현재 DB 경로 확인:", path.join(__dirname, 'data', 'namochemical.db'));

try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv 없음, 계속 진행');
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
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

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'namochemical.db');
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
const safeText = (v, m = 200) => String(v || '').trim().slice(0, m);
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
      title TEXT DEFAULT 'staff',
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'APPROVED',
      createdAt TEXT DEFAULT (datetime('now','localtime'))
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
    CREATE TABLE IF NOT EXISTS pqc (
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

  db.get(`SELECT COUNT(*) AS count FROM users`, [], async (err, row) => {
    if (err) {
      console.error('관리자 계정 확인 실패:', err.message);
      return;
    }

    if ((row?.count || 0) === 0) {
      try {
        const hashed = await bcrypt.hash('admin1234', 10);
        db.run(
          `INSERT INTO users (name, email, password, department, title, role, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ['관리자', 'admin@namochemical.com', hashed, '관리부', 'admin', 'admin', 'APPROVED'],
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
});

function addChangeLog(message) {
  db.run(
    `INSERT INTO change_logs (id, logDate, message) VALUES (?, ?, ?)`,
    [
      makeId('log'),
      new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      safeText(message, 500)
    ]
  );
}

/* =========================
   엑셀 업로드용 추가 유틸
========================= */

function normalizeDate(v) {
  const s = String(v || '').trim();
  if (!s) return '';

  // 2026.04.01 / 2026-04-01 / 2026/04/01
  let m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }

  // 20260401
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]}`;
  }

  return s;
}

function normalizeKey(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()]/g, '');
}

function rowPick(row, keys, defaultValue = '') {
  if (!row || typeof row !== 'object') return defaultValue;

  const map = {};
  Object.keys(row).forEach((k) => {
    map[normalizeKey(k)] = row[k];
  });

  for (const key of keys) {
    const v = map[normalizeKey(key)];
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return v;
    }
  }
  return defaultValue;
}

function classifySheetType(raw) {
  const s = String(raw || '').trim().toUpperCase();

  if (['IQC', '입고', '입고검사'].includes(s)) return 'IQC';
  if (['PQC', 'PQC', '공정', '공정검사'].includes(s)) return 'PQC';
  if (['OQC', '출하', '출하검사'].includes(s)) return 'OQC';
  if (['SUPPLIERS', 'SUPPLIER', '거래처', '공급업체', '업체'].includes(s)) return 'SUPPLIERS';
  if (['WORKLOG', '작업일지', '원료투입', '투입일지'].includes(s)) return 'WORKLOG';

  return '';
}

function previewMappedRows(sheetType, rows) {
  const type = classifySheetType(sheetType);
  if (!type) {
    return { ok: false, error: '지원하지 않는 sheetType 입니다.' };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: '업로드할 rows 가 없습니다.' };
  }

  let mapped = [];

  if (type === 'IQC') {
    mapped = rows.map((r) => ({
      id: makeId('iqc'),
      date: normalizeDate(rowPick(r, ['date', '일자', '날짜', '검사일', '검사일자'])),
      lot: safeText(rowPick(r, ['lot', 'lotno', 'lot no', '로트', 'lot번호'])),
      supplier: safeText(rowPick(r, ['supplier', '업체', '거래처', '공급업체'])),
      item: safeText(rowPick(r, ['item', '품목', '원자재', '자재명'])),
      inspector: safeText(rowPick(r, ['inspector', '검사자', '담당자'])),
      qty: safeNumber(rowPick(r, ['qty', '수량', '검사수량', 'lot수량'])),
      fail: safeNumber(rowPick(r, ['fail', '불량', '불량수량', 'ng'])),
    }));
  }

  if (type === 'PQC') {
    mapped = rows.map((r) => ({
      id: makeId('pqc'),
      date: normalizeDate(rowPick(r, ['date', '일자', '날짜', '검사일', '검사일자'])),
      product: safeText(rowPick(r, ['product', '제품', '제품명'])),
      lot: safeText(rowPick(r, ['lot', 'lotno', 'lot no', '로트'])),
      visual: safeText(rowPick(r, ['visual', '외관'])),
      viscosity: safeText(rowPick(r, ['viscosity', '점도'])),
      solid: safeText(rowPick(r, ['solid', '고형분'])),
      particle: safeText(rowPick(r, ['particle', '입자'])),
      qty: safeNumber(rowPick(r, ['qty', '수량', '검사수량'])),
      fail: safeNumber(rowPick(r, ['fail', '불량', '불량수량', 'ng'])),
      judge: safeText(rowPick(r, ['judge', '판정', '결과'])),
    }));
  }

  if (type === 'OQC') {
    mapped = rows.map((r) => ({
      id: makeId('oqc'),
      date: normalizeDate(rowPick(r, ['date', '일자', '날짜', '검사일', '검사일자'])),
      customer: safeText(rowPick(r, ['customer', '고객사', '거래처', '납품처'])),
      product: safeText(rowPick(r, ['product', '제품', '제품명'])),
      lot: safeText(rowPick(r, ['lot', 'lotno', 'lot no', '로트'])),
      visual: safeText(rowPick(r, ['visual', '외관'])),
      viscosity: safeText(rowPick(r, ['viscosity', '점도'])),
      solid: safeText(rowPick(r, ['solid', '고형분'])),
      particle: safeText(rowPick(r, ['particle', '입자'])),
      adhesion: safeText(rowPick(r, ['adhesion', '접착력'])),
      resistance: safeText(rowPick(r, ['resistance', '저항', '내성'])),
      swelling: safeText(rowPick(r, ['swelling', '팽윤'])),
      moisture: safeText(rowPick(r, ['moisture', '수분'])),
      qty: safeNumber(rowPick(r, ['qty', '수량', '검사수량'])),
      fail: safeNumber(rowPick(r, ['fail', '불량', '불량수량', 'ng'])),
      judge: safeText(rowPick(r, ['judge', '판정', '결과'])),
    }));
  }

  if (type === 'SUPPLIERS') {
    mapped = rows.map((r) => ({
      id: makeId('sup'),
      name: safeText(rowPick(r, ['name', '업체명', '거래처명', '공급업체명'])),
      manager: safeText(rowPick(r, ['manager', '담당자', '대표', '연락담당'])),
      phone: safeText(rowPick(r, ['phone', '전화', '연락처', '전화번호'])),
      category: safeText(rowPick(r, ['category', '분류', '구분', '품목군'])),
      status: safeText(rowPick(r, ['status', '상태', '사용여부'])),
    }));
  }

  if (type === 'WORKLOG') {
    mapped = rows.map((r) => ({
      id: makeId('work'),
      workDate: normalizeDate(rowPick(r, ['workdate', '작업일자', '작업일', '날짜'])),
      finishedLot: safeText(rowPick(r, ['finishedlot', '완제품lot', '완제품 lot', 'finished lot'])),
      seq: safeText(rowPick(r, ['seq', '순번', '차수'])),
      material: safeText(rowPick(r, ['material', '원료', '자재명'])),
      supName: safeText(rowPick(r, ['supname', 'supplier', '업체명', '공급업체'])),
      inputQty: safeText(rowPick(r, ['inputqty', '투입량', '수량'])),
      inputRatio: safeText(rowPick(r, ['inputratio', '투입비율', '비율'])),
      lotNo: safeText(rowPick(r, ['lotno', 'lot no', '원료lot', '원료 lot', '로트'])),
      inputTime: safeText(rowPick(r, ['inputtime', '투입시간', '시간'])),
      worker: safeText(rowPick(r, ['worker', '작업자', '담당자'])),
      note: safeText(rowPick(r, ['note', '비고', '메모'])),
    }));
  }

  const validRows = mapped.filter((r) => {
    if (type === 'IQC') return r.date || r.lot || r.item || r.supplier;
    if (type === 'PQC') return r.date || r.product || r.lot;
    if (type === 'OQC') return r.date || r.customer || r.product || r.lot;
    if (type === 'SUPPLIERS') return r.name;
    if (type === 'WORKLOG') return r.workDate || r.finishedLot || r.material;
    return false;
  });

  return {
    ok: true,
    type,
    totalRows: rows.length,
    validCount: validRows.length,
    skippedCount: rows.length - validRows.length,
    preview: validRows.slice(0, 5),
    mappedRows: validRows
  };
}

function insertImportedRows(type, mappedRows, callback) {
  if (!Array.isArray(mappedRows) || mappedRows.length === 0) {
    return callback(null, 0);
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    let stmt;

    if (type === 'IQC') {
      stmt = db.prepare(`
        INSERT INTO iqc (id, date, lot, supplier, item, inspector, qty, fail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      mappedRows.forEach((r) => {
        stmt.run(r.id, r.date, r.lot, r.supplier, r.item, r.inspector, r.qty, r.fail);
      });
    }

    if (type === 'PQC') {
      stmt = db.prepare(`
        INSERT INTO pqc (id, date, product, lot, visual, viscosity, solid, particle, qty, fail, judge)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      mappedRows.forEach((r) => {
        stmt.run(
          r.id, r.date, r.product, r.lot, r.visual, r.viscosity,
          r.solid, r.particle, r.qty, r.fail, r.judge
        );
      });
    }

    if (type === 'OQC') {
      stmt = db.prepare(`
        INSERT INTO oqc (id, date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      mappedRows.forEach((r) => {
        stmt.run(
          r.id, r.date, r.customer, r.product, r.lot, r.visual, r.viscosity,
          r.solid, r.particle, r.adhesion, r.resistance, r.swelling,
          r.moisture, r.qty, r.fail, r.judge
        );
      });
    }

    if (type === 'SUPPLIERS') {
      stmt = db.prepare(`
        INSERT INTO suppliers (id, name, manager, phone, category, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      mappedRows.forEach((r) => {
        stmt.run(r.id, r.name, r.manager, r.phone, r.category, r.status);
      });
    }

    if (type === 'WORKLOG') {
      stmt = db.prepare(`
        INSERT INTO worklog (id, workDate, finishedLot, seq, material, supName, inputQty, inputRatio, lotNo, inputTime, worker, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      mappedRows.forEach((r) => {
        stmt.run(
          r.id, r.workDate, r.finishedLot, r.seq, r.material, r.supName,
          r.inputQty, r.inputRatio, r.lotNo, r.inputTime, r.worker, r.note
        );
      });
    }

    if (!stmt) {
      db.run('ROLLBACK');
      return callback(new Error('지원하지 않는 업로드 타입입니다.'));
    }

    stmt.finalize((stmtErr) => {
      if (stmtErr) {
        db.run('ROLLBACK');
        return callback(stmtErr);
      }

      db.run('COMMIT', (commitErr) => {
        if (commitErr) {
          db.run('ROLLBACK');
          return callback(commitErr);
        }
        callback(null, mappedRows.length);
      });
    });
  });
}

/* =========================
   인증 / 사용자
========================= */

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
      function (err) {
        if (err) {
          if (err.message && err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: '이미 존재하는 이메일' });
          }
          return res.status(500).json({ error: err.message });
        }
        addChangeLog(`회원가입: ${safeText(name)} / ${normalizeEmail(email)}`);
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

      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).json({ error: '세션 저장 실패' });
        addChangeLog(`로그인: ${user.name} / ${user.email}`);
        res.json({ ok: true, user: req.session.user });
      });
    }
  );
});
app.get('/api/backup', (req, res) => {
 const file = process.env.DB_PATH || path.join(__dirname, 'data', 'namochemical.db');
  res.download(file);
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ ok: true, time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인 필요' });
  }
  res.json(req.session.user);
});

app.post('/api/auth/logout', (req, res) => {
  const user = req.session?.user;
  if (!req.session) return res.json({ ok: true });

  req.session.destroy(() => {
    if (user?.email) addChangeLog(`로그아웃: ${user.name} / ${user.email}`);
    res.json({ ok: true });
  });
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { name, email, department, newPassword } = req.body;

    if (!name) return res.status(400).json({ error: '이름을 입력하세요.' });
    if (!email) return res.status(400).json({ error: '이메일을 입력하세요.' });
    if (!department) return res.status(400).json({ error: '부서 / 팀을 입력하세요.' });
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
    }

    db.get(
      `SELECT * FROM users WHERE email = ? AND name = ? AND department = ?`,
      [normalizeEmail(email), safeText(name), safeText(department)],
      async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: '일치하는 사용자를 찾을 수 없습니다.' });

        const hashed = await bcrypt.hash(newPassword, 10);

        db.run(
          `UPDATE users SET password = ? WHERE id = ?`,
          [hashed, user.id],
          function (updateErr) {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            addChangeLog(`비밀번호 초기화: ${user.name} / ${user.email}`);
            res.json({ ok: true, message: '비밀번호가 재설정되었습니다.' });
          }
        );
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/change-password', requireLogin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: '현재 비밀번호를 입력하세요.' });
    }
    if (!newPassword || String(newPassword).length < 8) {
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
          [hashed, user.id],
          function (updateErr) {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            addChangeLog(`비밀번호 변경: ${user.name} / ${user.email}`);
            res.json({ ok: true, message: '비밀번호가 변경되었습니다.' });
          }
        );
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   관리자
========================= */

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

app.put('/api/admin/users/:id', requireAdmin, (req, res) => {
  const { name, email, department, title, role, status } = req.body;

  db.run(
    `UPDATE users
     SET name = ?, email = ?, department = ?, title = ?, role = ?, status = ?
     WHERE id = ?`,
    [
      safeText(name),
      normalizeEmail(email),
      safeText(department),
      safeText(title),
      safeText(role),
      safeText(status),
      req.params.id
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      addChangeLog(`회원 수정: ${safeText(name)} / ${normalizeEmail(email)}`);
      res.json({ ok: true, message: '회원 정보가 저장되었습니다.' });
    }
  );
});

app.post('/api/admin/users/:id/approve', requireAdmin, (req, res) => {
  db.run(
    `UPDATE users SET status = 'APPROVED' WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, message: '회원 승인이 완료되었습니다.' });
    }
  );
});

app.post('/api/admin/users/:id/reject', requireAdmin, (req, res) => {
  db.run(
    `UPDATE users SET status = 'REJECTED' WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, message: '회원 반려가 완료되었습니다.' });
    }
  );
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, message: '회원 삭제가 완료되었습니다.' });
  });
});

app.post('/api/admin/delete-all', requireAdmin, (req, res) => {
  const { confirm } = req.body;
  if (confirm !== 'DELETE') {
    return res.status(400).json({ error: '삭제 확인값이 올바르지 않습니다.' });
  }

  db.serialize(() => {
    db.run(`DELETE FROM suppliers`);
    db.run(`DELETE FROM iqc`);
    db.run(`DELETE FROM pqc`);
    db.run(`DELETE FROM oqc`);
    db.run(`DELETE FROM worklog`);
    db.run(`DELETE FROM nonconform`);
    db.run(`DELETE FROM change_logs`, [], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, message: '전체 데이터 삭제 완료' });
    });
  });
});

/* =========================
   공급업체
========================= */

app.get('/api/suppliers', requireLogin, (req, res) => {
  db.all(`SELECT * FROM suppliers ORDER BY rowid DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/suppliers', requireLogin, (req, res) => {
  const d = req.body;
  db.run(
    `INSERT INTO suppliers (id, name, manager, phone, category, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      makeId('sup'),
      safeText(d.name),
      safeText(d.manager),
      safeText(d.phone),
      safeText(d.category),
      safeText(d.status)
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      addChangeLog(`공급업체 등록: ${safeText(d.name)}`);
      res.json({ ok: true });
    }
  );
});

app.put('/api/suppliers/:id', requireLogin, (req, res) => {
  const d = req.body;
  db.run(
    `UPDATE suppliers
     SET name = ?, manager = ?, phone = ?, category = ?, status = ?
     WHERE id = ?`,
    [
      safeText(d.name),
      safeText(d.manager),
      safeText(d.phone),
      safeText(d.category),
      safeText(d.status),
      req.params.id
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

app.delete('/api/suppliers/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM suppliers WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

/* =========================
   IQC
========================= */

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

app.put('/api/iqc/:id', requireLogin, (req, res) => {
  const d = req.body;
  db.run(
    `UPDATE iqc
     SET date = ?, lot = ?, supplier = ?, item = ?, inspector = ?, qty = ?, fail = ?
     WHERE id = ?`,
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
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

app.delete('/api/iqc/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM iqc WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

/* =========================
   PQC
========================= */

app.get('/api/pqc', requireLogin, (req, res) => {
  db.all(`SELECT * FROM pqc ORDER BY date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/pqc', requireLogin, (req, res) => {
  const d = req.body;
  db.run(
    `INSERT INTO pqc (id, date, product, lot, visual, viscosity, solid, particle, qty, fail, judge)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      makeId('pqc'),
      safeText(d.date),
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
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

app.put('/api/pqc/:id', requireLogin, (req, res) => {
  const d = req.body;
  db.run(
    `UPDATE pqc
     SET date = ?, product = ?, lot = ?, visual = ?, viscosity = ?, solid = ?, particle = ?, qty = ?, fail = ?, judge = ?
     WHERE id = ?`,
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
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

app.delete('/api/pqc/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM pqc WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

/* =========================
   OQC
========================= */

app.get('/api/oqc', requireLogin, (req, res) => {
  db.all(`SELECT * FROM oqc ORDER BY date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/oqc', requireLogin, (req, res) => {
  const d = req.body;
  db.run(
    `INSERT INTO oqc (id, date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      makeId('oqc'),
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
      safeText(d.judge)
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

app.put('/api/oqc/:id', requireLogin, (req, res) => {
  const d = req.body;
  db.run(
    `UPDATE oqc
     SET date = ?, customer = ?, product = ?, lot = ?, visual = ?, viscosity = ?, solid = ?, particle = ?, adhesion = ?, resistance = ?, swelling = ?, moisture = ?, qty = ?, fail = ?, judge = ?
     WHERE id = ?`,
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
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

app.delete('/api/oqc/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM oqc WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

/* =========================
   Worklog
========================= */

app.get('/api/worklog', requireLogin, (req, res) => {
  db.all(`SELECT * FROM worklog ORDER BY workDate DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/worklog', requireLogin, (req, res) => {
  const d = req.body;
  db.run(
    `INSERT INTO worklog (id, workDate, finishedLot, seq, material, supName, inputQty, inputRatio, lotNo, inputTime, worker, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      makeId('work'),
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
      safeText(d.note)
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

app.put('/api/worklog/:id', requireLogin, (req, res) => {
  const d = req.body;
  db.run(
    `UPDATE worklog
     SET workDate = ?, finishedLot = ?, seq = ?, material = ?, supName = ?, inputQty = ?, inputRatio = ?, lotNo = ?, inputTime = ?, worker = ?, note = ?
     WHERE id = ?`,
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
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

app.delete('/api/worklog/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM worklog WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

/* =========================
   부적합
========================= */

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
      safeText(d.id || makeId('nc')),
      safeText(d.date),
      safeText(d.type),
      safeText(d.lot),
      safeText(d.item),
      safeText(d.issue),
      safeText(d.cause),
      safeText(d.action),
      safeText(d.owner),
      safeText(d.status)
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

app.put('/api/nonconform/:id', requireLogin, (req, res) => {
  const d = req.body;
  db.run(
    `UPDATE nonconform
     SET date = ?, type = ?, lot = ?, item = ?, issue = ?, cause = ?, action = ?, owner = ?, status = ?
     WHERE id = ?`,
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
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

app.delete('/api/nonconform/:id', requireLogin, (req, res) => {
  db.run(`DELETE FROM nonconform WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

/* =========================
   변경 로그
========================= */

app.get('/api/change-logs', requireLogin, (req, res) => {
  db.all(`SELECT * FROM change_logs ORDER BY rowid DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/* =========================
   엑셀 업로드 미리보기 / 반영
========================= */

app.post('/api/import/preview', requireLogin, (req, res) => {
  try {
    const { sheetType, rows } = req.body;
    const result = previewMappedRows(sheetType, rows);

    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.error });
    }

    res.json({
      ok: true,
      sheetType: result.type,
      totalRows: result.totalRows,
      validCount: result.validCount,
      skippedCount: result.skippedCount,
      preview: result.preview
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/import/commit', requireLogin, (req, res) => {
  try {
    const { sheetType, rows } = req.body;
    const result = previewMappedRows(sheetType, rows);

    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.error });
    }

    insertImportedRows(result.type, result.mappedRows, (err, insertedCount) => {
      if (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }

      addChangeLog(`엑셀 업로드 반영: ${result.type} / ${insertedCount}건 / 사용자 ${req.session.user?.email || ''}`);

      res.json({
        ok: true,
        message: `${result.type} ${insertedCount}건 반영 완료`,
        sheetType: result.type,
        insertedCount,
        skippedCount: result.skippedCount
      });
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* =========================
   상태 / 정적 파일
========================= */

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  // API는 제외
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API not found' });
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`서버 실행: ${PORT}`);
});
