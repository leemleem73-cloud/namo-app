const { Pool } = require('pg');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const pgSession = require('connect-pg-simple')(session);
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(express.json());

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    secret: 'namo-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }
  })
);

const requireLogin = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: '로그인 필요' });
  next();
};

/* =========================
   🔥 camelCase 변환 함수
========================= */
function mapWorklog(row) {
  return {
    id: row.id,
    workDate: row.workdate,
    finishedLot: row.finishedlot,
    seq: row.seq,
    material: row.material,
    supName: row.supname,
    inputQty: row.inputqty,
    inputRatio: row.inputratio,
    lotNo: row.lotno,
    inputTime: row.inputtime,
    worker: row.worker,
    note: row.note
  };
}

/* =========================
   로그인
========================= */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    'SELECT * FROM users WHERE email=$1',
    [email]
  );

  if (!result.rows.length) return res.status(401).json({ error: '계정 없음' });

  const user = result.rows[0];
  const ok = await bcrypt.compare(password, user.password);

  if (!ok) return res.status(401).json({ error: '비밀번호 오류' });

  req.session.user = user;
  res.json({ ok: true, user });
});

/* =========================
   WORKLOG (핵심 수정)
========================= */
app.get('/api/worklog', requireLogin, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM worklog ORDER BY workdate DESC'
  );

  res.json(result.rows.map(mapWorklog));
});

app.post('/api/worklog', requireLogin, async (req, res) => {
  const d = req.body;

  await pool.query(
    `INSERT INTO worklog 
    (id, workdate, finishedlot, seq, material, supname, inputqty, inputratio, lotno, inputtime, worker, note)
    VALUES (gen_random_uuid(), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      d.workDate,
      d.finishedLot,
      d.seq,
      d.material,
      d.supName,
      d.inputQty,
      d.inputRatio,
      d.lotNo,
      d.inputTime,
      d.worker,
      d.note
    ]
  );

  res.json({ ok: true });
});

/* =========================
   🔥 백업 API 추가
========================= */
app.get('/api/backup', requireLogin, async (req, res) => {
  const tables = ['iqc','pqc','oqc','worklog','suppliers','nonconform'];
  const result = {};

  for (const t of tables) {
    const r = await pool.query(`SELECT * FROM ${t}`);
    result[t] = r.rows;
  }

  res.setHeader('Content-Disposition', 'attachment; filename=backup.json');
  res.json(result);
});

/* ========================= */
app.listen(PORT, () => {
  console.log('서버 실행:', PORT);
});
