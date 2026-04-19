const { Pool } = require('pg');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const pgSession = require('connect-pg-simple')(session);

console.log('NEW CODE DEPLOYED');
console.log('이 파일 실행중:', __filename);

try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv 없음, 계속 진행');
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL 이 없습니다. Render/Supabase 환경변수를 확인하세요.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-session-secret';

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
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
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

function normalizeDate(v) {
  const s = String(v || '').trim();
  if (!s) return '';

  let m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }

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
  if (['PQC', '공정', '공정검사'].includes(s)) return 'PQC';
  if (['OQC', '출하', '출하검사'].includes(s)) return 'OQC';
  if (['SUPPLIERS', 'SUPPLIER', '거래처', '공급업체', '업체'].includes(s)) return 'SUPPLIERS';
  if (['WORKLOG', '작업일지', '원료투입', '투입일지'].includes(s)) return 'WORKLOG';

  return '';
}

function mapWorklogRow(row) {
  return {
    ...row,
    workDate: row.workdate || row.workDate || '',
    finishedLot: row.finishedlot || row.finishedLot || '',
    supName: row.supname || row.supName || '',
    inputQty: row.inputqty || row.inputQty || '',
    inputRatio: row.inputratio || row.inputRatio || '',
    lotNo: row.lotno || row.lotNo || '',
    inputTime: row.inputtime || row.inputTime || '',
  };
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
      workdate: normalizeDate(rowPick(r, ['workdate', '작업일자', '작업일', '날짜', 'workDate'])),
      finishedlot: safeText(rowPick(r, ['finishedlot', '완제품lot', '완제품 lot', 'finished lot', 'finishedLot'])),
      seq: safeText(rowPick(r, ['seq', '순번', '차수'])),
      material: safeText(rowPick(r, ['material', '원료', '자재명'])),
      supname: safeText(rowPick(r, ['supname', 'supplier', '업체명', '공급업체', 'supName'])),
      inputqty: safeText(rowPick(r, ['inputqty', '투입량', '수량', 'inputQty'])),
      inputratio: safeText(rowPick(r, ['inputratio', '투입비율', '비율', 'inputRatio'])),
      lotno: safeText(rowPick(r, ['lotno', 'lot no', '원료lot', '원료 lot', '로트', 'lotNo'])),
      inputtime: safeText(rowPick(r, ['inputtime', '투입시간', '시간', 'inputTime'])),
      worker: safeText(rowPick(r, ['worker', '작업자', '담당자'])),
      note: safeText(rowPick(r, ['note', '비고', '메모'])),
    }));
  }

  const validRows = mapped.filter((r) => {
    if (type === 'IQC') return r.date || r.lot || r.item || r.supplier;
    if (type === 'PQC') return r.date || r.product || r.lot;
    if (type === 'OQC') return r.date || r.customer || r.product || r.lot;
    if (type === 'SUPPLIERS') return r.name;
    if (type === 'WORKLOG') return r.workdate || r.finishedlot || r.material;
    return false;
  });

  return {
    ok: true,
    type,
    totalRows: rows.length,
    validCount: validRows.length,
    skippedCount: rows.length - validRows.length,
    preview: validRows.slice(0, 5),
    mappedRows: validRows,
  };
}

async function addChangeLog(message) {
  try {
    await pool.query(
      'INSERT INTO change_logs (id, message, created_at) VALUES ($1, $2, NOW())',
      [makeId('log'), safeText(message, 500)]
    );
  } catch (e) {
    console.error('change log error:', e.message);
  }
}

async function queryOne(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
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

    const result = await pool.query(
      `INSERT INTO users (name, email, password, department, title, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id`,
      [
        safeText(name),
        normalizeEmail(email),
        hashed,
        safeText(department),
        'staff',
        'user',
        'PENDING',
      ]
    );

    await addChangeLog(`회원가입 신청: ${safeText(name)} / ${normalizeEmail(email)}`);
    res.json({ ok: true, id: result.rows[0].id, message: '가입 신청이 완료되었습니다. 관리자 승인 후 로그인 가능합니다.' });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: '이미 존재하는 이메일' });
    }
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await queryOne('SELECT * FROM users WHERE email = $1 LIMIT 1', [normalizeEmail(email)]);

    if (!user) {
      return res.status(401).json({ error: '존재하지 않는 계정입니다.' });
    }

    if (user.status !== 'APPROVED') {
      return res.status(403).json({ error: '관리자 승인 후 로그인 가능합니다.' });
    }

    const result = await pool.query(
  'SELECT crypt($1, $2) = $2 AS match',
  [password || '', user.password]
);

const ok = result.rows[0].match;
    if (!ok) {
      return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      title: user.title,
      role: user.role,
      status: user.status,
    };

    req.session.save(async (saveErr) => {
      if (saveErr) return res.status(500).json({ error: '세션 저장 실패' });
      await addChangeLog(`로그인: ${user.name} / ${user.email}`);
      res.json({ ok: true, user: req.session.user });
    });
  } catch (e) {
  console.error('LOGIN ERROR:', e);
  res.status(500).json({ error: e.message });
}
});

app.get('/api/auth/me', (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: '로그인 필요' });
    }
    res.json(req.session.user);
  } catch (e) {
    console.error('AUTH ME ERROR:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const user = req.session?.user;
  if (!req.session) return res.json({ ok: true });

  req.session.destroy(async () => {
    if (user?.email) {
      await addChangeLog(`로그아웃: ${user.name} / ${user.email}`);
    }
    res.json({ ok: true });
  });
});

app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  try {
    const { name, email, department, newPassword } = req.body;

    if (!name) return res.status(400).json({ error: '이름을 입력하세요.' });
    if (!email) return res.status(400).json({ error: '이메일을 입력하세요.' });
    if (!department) return res.status(400).json({ error: '부서 / 팀을 입력하세요.' });
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
    }

    const user = await queryOne(
      `SELECT * FROM users WHERE email = $1 AND name = $2 AND department = $3 LIMIT 1`,
      [normalizeEmail(email), safeText(name), safeText(department)]
    );

    if (!user) {
      return res.status(404).json({ error: '일치하는 사용자를 찾을 수 없습니다.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
    await addChangeLog(`비밀번호 초기화: ${user.name} / ${user.email}`);

    res.json({ ok: true, message: '비밀번호가 재설정되었습니다.' });
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

    const user = await queryOne('SELECT * FROM users WHERE id = $1 LIMIT 1', [req.session.user.id]);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const ok = await bcrypt.compare(currentPassword, user.password || '');
    if (!ok) {
      return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
    await addChangeLog(`비밀번호 변경: ${user.name} / ${user.email}`);

    res.json({ ok: true, message: '비밀번호가 변경되었습니다.' });
 } catch (e) {
  console.error('CHANGE PASSWORD ERROR:', e);
  res.status(500).json({ error: e.message });
}
});

/* =========================
   관리자
========================= */

app.get('/api/admin/users', requireAdmin, adminLimiter, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, department, title, role, status, created_at
       FROM users
       ORDER BY created_at DESC NULLS LAST, id DESC`
    );
    res.json(result.rows);
  } catch (e) {
  console.error('ADMIN USERS ERROR:', e);
  res.status(500).json({ error: e.message });
}
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { name, email, department, title, role, status } = req.body;

    await pool.query(
      `UPDATE users
       SET name = $1, email = $2, department = $3, title = $4, role = $5, status = $6
       WHERE id = $7`,
      [
        safeText(name),
        normalizeEmail(email),
        safeText(department),
        safeText(title),
        safeText(role),
        safeText(status),
        req.params.id,
      ]
    );

    await addChangeLog(`회원 수정: ${safeText(name)} / ${normalizeEmail(email)}`);
    res.json({ ok: true, message: '회원 정보가 저장되었습니다.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    await pool.query(`UPDATE users SET status = 'APPROVED' WHERE id = $1`, [req.params.id]);
    res.json({ ok: true, message: '회원 승인이 완료되었습니다.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/users/:id/reject', requireAdmin, async (req, res) => {
  try {
    await pool.query(`UPDATE users SET status = 'REJECTED' WHERE id = $1`, [req.params.id]);
    res.json({ ok: true, message: '회원 반려가 완료되었습니다.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    res.json({ ok: true, message: '회원 삭제가 완료되었습니다.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/delete-all', requireAdmin, async (req, res) => {
  const { confirm } = req.body;
  if (confirm !== 'DELETE') {
    return res.status(400).json({ error: '삭제 확인값이 올바르지 않습니다.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM suppliers');
    await client.query('DELETE FROM iqc');
    await client.query('DELETE FROM pqc');
    await client.query('DELETE FROM oqc');
    await client.query('DELETE FROM worklog');
    await client.query('DELETE FROM nonconform');
    await client.query('DELETE FROM change_logs');
    await client.query('COMMIT');
    res.json({ ok: true, message: '전체 데이터 삭제 완료' });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

/* =========================
   공급업체
========================= */

app.get('/api/suppliers', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM suppliers ORDER BY created_at DESC NULLS LAST, id DESC`);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/suppliers', requireLogin, async (req, res) => {
  try {
    const d = req.body;
    await pool.query(
      `INSERT INTO suppliers (id, name, manager, phone, category, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        makeId('sup'),
        safeText(d.name),
        safeText(d.manager),
        safeText(d.phone),
        safeText(d.category),
        safeText(d.status),
      ]
    );
    await addChangeLog(`공급업체 등록: ${safeText(d.name)}`);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/suppliers/:id', requireLogin, async (req, res) => {
  try {
    const d = req.body;
    await pool.query(
      `UPDATE suppliers
       SET name = $1, manager = $2, phone = $3, category = $4, status = $5
       WHERE id = $6`,
      [
        safeText(d.name),
        safeText(d.manager),
        safeText(d.phone),
        safeText(d.category),
        safeText(d.status),
        req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/suppliers/:id', requireLogin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM suppliers WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   IQC
========================= */

app.get('/api/iqc', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM iqc ORDER BY date DESC NULLS LAST, created_at DESC NULLS LAST`);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/iqc', requireLogin, async (req, res) => {
  try {
    const d = req.body;

    await pool.query(
      `INSERT INTO iqc (id, date, lot, supplier, item, inspector, qty, fail, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        makeId('iqc'),
        safeText(d.date) || null,
        safeText(d.lot),
        safeText(d.supplier),
        safeText(d.item),
        safeText(d.inspector),
        safeNumber(d.qty),
        safeNumber(d.fail),
      ]
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/iqc/:id', requireLogin, async (req, res) => {
  try {
    const d = req.body;
    await pool.query(
      `UPDATE iqc
       SET date = $1, lot = $2, supplier = $3, item = $4, inspector = $5, qty = $6, fail = $7
       WHERE id = $8`,
      [
        safeText(d.date) || null,
        safeText(d.lot),
        safeText(d.supplier),
        safeText(d.item),
        safeText(d.inspector),
        safeNumber(d.qty),
        safeNumber(d.fail),
        req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/iqc/:id', requireLogin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM iqc WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   PQC
========================= */

app.get('/api/pqc', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM pqc ORDER BY date DESC NULLS LAST, created_at DESC NULLS LAST`);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/pqc', requireLogin, async (req, res) => {
  try {
    const d = req.body;
    await pool.query(
      `INSERT INTO pqc (id, date, product, lot, visual, viscosity, solid, particle, qty, fail, judge, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      [
        makeId('pqc'),
        safeText(d.date) || null,
        safeText(d.product),
        safeText(d.lot),
        safeText(d.visual),
        safeText(d.viscosity),
        safeText(d.solid),
        safeText(d.particle),
        safeNumber(d.qty),
        safeNumber(d.fail),
        safeText(d.judge),
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/pqc/:id', requireLogin, async (req, res) => {
  try {
    const d = req.body;
    await pool.query(
      `UPDATE pqc
       SET date = $1, product = $2, lot = $3, visual = $4, viscosity = $5, solid = $6, particle = $7, qty = $8, fail = $9, judge = $10
       WHERE id = $11`,
      [
        safeText(d.date) || null,
        safeText(d.product),
        safeText(d.lot),
        safeText(d.visual),
        safeText(d.viscosity),
        safeText(d.solid),
        safeText(d.particle),
        safeNumber(d.qty),
        safeNumber(d.fail),
        safeText(d.judge),
        req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/pqc/:id', requireLogin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM pqc WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   OQC
========================= */

app.get('/api/oqc', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM oqc ORDER BY date DESC NULLS LAST, created_at DESC NULLS LAST`);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/oqc', requireLogin, async (req, res) => {
  try {
    const d = req.body;
    await pool.query(
      `INSERT INTO oqc (id, date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())`,
      [
        makeId('oqc'),
        safeText(d.date) || null,
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
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/oqc/:id', requireLogin, async (req, res) => {
  try {
    const d = req.body;
    await pool.query(
      `UPDATE oqc
       SET date = $1, customer = $2, product = $3, lot = $4, visual = $5, viscosity = $6, solid = $7, particle = $8, adhesion = $9, resistance = $10, swelling = $11, moisture = $12, qty = $13, fail = $14, judge = $15
       WHERE id = $16`,
      [
        safeText(d.date) || null,
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
        req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/oqc/:id', requireLogin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM oqc WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   Worklog
========================= */

app.get('/api/worklog', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM worklog ORDER BY workdate DESC NULLS LAST, created_at DESC NULLS LAST`);
    res.json(result.rows.map(mapWorklogRow));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/worklog', requireLogin, async (req, res) => {
  try {
    const d = req.body;
    await pool.query(
      `INSERT INTO worklog (id, workdate, finishedlot, seq, material, supname, inputqty, inputratio, lotno, inputtime, worker, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        makeId('work'),
        safeText(d.workdate || d.workDate) || null,
        safeText(d.finishedlot || d.finishedLot),
        safeText(d.seq),
        safeText(d.material),
        safeText(d.supname || d.supName),
        safeText(d.inputqty || d.inputQty),
        safeText(d.inputratio || d.inputRatio),
        safeText(d.lotno || d.lotNo),
        safeText(d.inputtime || d.inputTime),
        safeText(d.worker),
        safeText(d.note),
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/worklog/:id', requireLogin, async (req, res) => {
  try {
    const d = req.body;
    await pool.query(
      `UPDATE worklog
       SET workdate = $1, finishedlot = $2, seq = $3, material = $4, supname = $5, inputqty = $6, inputratio = $7, lotno = $8, inputtime = $9, worker = $10, note = $11
       WHERE id = $12`,
      [
        safeText(d.workdate || d.workDate) || null,
        safeText(d.finishedlot || d.finishedLot),
        safeText(d.seq),
        safeText(d.material),
        safeText(d.supname || d.supName),
        safeText(d.inputqty || d.inputQty),
        safeText(d.inputratio || d.inputRatio),
        safeText(d.lotno || d.lotNo),
        safeText(d.inputtime || d.inputTime),
        safeText(d.worker),
        safeText(d.note),
        req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/worklog/:id', requireLogin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM worklog WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   부적합
========================= */

app.get('/api/nonconform', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM nonconform ORDER BY date DESC NULLS LAST, created_at DESC NULLS LAST`);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/nonconform', requireLogin, async (req, res) => {
  try {
    const d = req.body;
    await pool.query(
      `INSERT INTO nonconform (id, date, type, lot, item, issue, cause, action, owner, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        safeText(d.id || makeId('nc')),
        safeText(d.date) || null,
        safeText(d.type),
        safeText(d.lot),
        safeText(d.item),
        safeText(d.issue),
        safeText(d.cause),
        safeText(d.action),
        safeText(d.owner),
        safeText(d.status),
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/nonconform/:id', requireLogin, async (req, res) => {
  try {
    const d = req.body;
    await pool.query(
      `UPDATE nonconform
       SET date = $1, type = $2, lot = $3, item = $4, issue = $5, cause = $6, action = $7, owner = $8, status = $9
       WHERE id = $10`,
      [
        safeText(d.date) || null,
        safeText(d.type),
        safeText(d.lot),
        safeText(d.item),
        safeText(d.issue),
        safeText(d.cause),
        safeText(d.action),
        safeText(d.owner),
        safeText(d.status),
        req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/nonconform/:id', requireLogin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM nonconform WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   변경 로그
========================= */

app.get('/api/change-logs', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM change_logs ORDER BY created_at DESC NULLS LAST, id DESC`);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
      preview: result.preview,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/api/import/commit', requireLogin, async (req, res) => {
  const client = await pool.connect();

  try {
    const { sheetType, rows } = req.body;
    const result = previewMappedRows(sheetType, rows);

    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.error });
    }

    await client.query('BEGIN');

    if (result.type === 'IQC') {
      for (const r of result.mappedRows) {
        await client.query(
          `INSERT INTO iqc (id, date, lot, supplier, item, inspector, qty, fail, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [r.id, r.date || null, r.lot, r.supplier, r.item, r.inspector, r.qty, r.fail]
        );
      }
    }

    if (result.type === 'PQC') {
      for (const r of result.mappedRows) {
        await client.query(
          `INSERT INTO pqc (id, date, product, lot, visual, viscosity, solid, particle, qty, fail, judge, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
          [r.id, r.date || null, r.product, r.lot, r.visual, r.viscosity, r.solid, r.particle, r.qty, r.fail, r.judge]
        );
      }
    }

    if (result.type === 'OQC') {
      for (const r of result.mappedRows) {
        await client.query(
          `INSERT INTO oqc (id, date, customer, product, lot, visual, viscosity, solid, particle, adhesion, resistance, swelling, moisture, qty, fail, judge, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())`,
          [
            r.id,
            r.date || null,
            r.customer,
            r.product,
            r.lot,
            r.visual,
            r.viscosity,
            r.solid,
            r.particle,
            r.adhesion,
            r.resistance,
            r.swelling,
            r.moisture,
            r.qty,
            r.fail,
            r.judge,
          ]
        );
      }
    }

    if (result.type === 'SUPPLIERS') {
      for (const r of result.mappedRows) {
        await client.query(
          `INSERT INTO suppliers (id, name, manager, phone, category, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [r.id, r.name, r.manager, r.phone, r.category, r.status]
        );
      }
    }

    if (result.type === 'WORKLOG') {
      for (const r of result.mappedRows) {
        await client.query(
          `INSERT INTO worklog (id, workdate, finishedlot, seq, material, supname, inputqty, inputratio, lotno, inputtime, worker, note, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
          [
            r.id,
            r.workdate || null,
            r.finishedlot,
            r.seq,
            r.material,
            r.supname,
            r.inputqty,
            r.inputratio,
            r.lotno,
            r.inputtime,
            r.worker,
            r.note,
          ]
        );
      }
    }

    await client.query('COMMIT');

    await addChangeLog(`엑셀 업로드 반영: ${result.type} / ${result.mappedRows.length}건 / 사용자 ${req.session.user?.email || ''}`);

    res.json({
      ok: true,
      message: `${result.type} ${result.mappedRows.length}건 반영 완료`,
      sheetType: result.type,
      insertedCount: result.mappedRows.length,
      skippedCount: result.skippedCount,
    });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ ok: false, error: e.message });
  } finally {
    client.release();
  }
});

/* =========================
   백업
========================= */

app.get('/api/backup', requireLogin, async (req, res) => {
  try {
    const [iqc, pqc, oqc, suppliers, worklog, nonconform, users, changeLogs] = await Promise.all([
      pool.query('SELECT * FROM iqc ORDER BY created_at DESC NULLS LAST'),
      pool.query('SELECT * FROM pqc ORDER BY created_at DESC NULLS LAST'),
      pool.query('SELECT * FROM oqc ORDER BY created_at DESC NULLS LAST'),
      pool.query('SELECT * FROM suppliers ORDER BY created_at DESC NULLS LAST'),
      pool.query('SELECT * FROM worklog ORDER BY created_at DESC NULLS LAST'),
      pool.query('SELECT * FROM nonconform ORDER BY created_at DESC NULLS LAST'),
      req.session.user?.role === 'admin'
        ? pool.query(`SELECT id, name, email, department, title, role, status, created_at FROM users ORDER BY created_at DESC NULLS LAST`)
        : Promise.resolve({ rows: [] }),
      pool.query('SELECT * FROM change_logs ORDER BY created_at DESC NULLS LAST'),
    ]);

    const backupData = {
      exportedAt: new Date().toISOString(),
      exportedBy: req.session.user?.email || '',
      iqc: iqc.rows,
      pqc: pqc.rows,
      oqc: oqc.rows,
      suppliers: suppliers.rows,
      worklog: worklog.rows.map(mapWorklogRow),
      nonconform: nonconform.rows,
      users: users.rows,
      changeLogs: changeLogs.rows,
    };

    const fileName = `namochemical_qms_backup_${new Date().toISOString().slice(0, 10)}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================
   상태 / 정적 파일
========================= */

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ ok: true, time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API not found' });
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`서버 실행: ${PORT}`);
});
