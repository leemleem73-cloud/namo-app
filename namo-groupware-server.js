const expressModule = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const schemaReady = pool.query(`
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE IF NOT EXISTS namo_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    location TEXT DEFAULT '',
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN NOT NULL DEFAULT FALSE,
    scope TEXT NOT NULL DEFAULT '개인',
    department TEXT DEFAULT '',
    creator_id UUID NOT NULL,
    creator_name TEXT NOT NULL,
    creator_title TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_namo_calendar_range
    ON namo_calendar_events(start_at, end_at, scope, department);
`).catch((err) => console.error('NAMO groupware schema failed:', err.message));

function text(v) { return String(v ?? '').trim(); }
function ok(res, data = null, message = 'OK') { return res.json({ success: true, message, data }); }
function fail(res, status, message) { return res.status(status).json({ success: false, message, data: null }); }
function userOf(req, res) {
  if (!req.session?.user) { fail(res, 401, '로그인이 필요합니다.'); return null; }
  return req.session.user;
}
function manager(user) {
  const title = text(user?.title).replace(/\s/g, '');
  return user?.role === 'admin' || title.includes('이사');
}
function mapEvent(row) {
  return {
    id: row.id, title: row.title, description: row.description || '', location: row.location || '',
    start: row.start_at, end: row.end_at, allDay: row.all_day, scope: row.scope,
    department: row.department || '', creatorId: row.creator_id,
    creatorName: row.creator_name, creatorTitle: row.creator_title || '',
  };
}

function registerRoutes(app) {
  if (app.__namoGroupwareRegistered) return;
  app.__namoGroupwareRegistered = true;

  app.get('/api/namo-groupware/organization', async (req, res) => {
    try {
      if (!userOf(req, res)) return;
      const result = await pool.query(`
        SELECT id, uid, name, email, department, title, role
        FROM users WHERE status='APPROVED'
        ORDER BY department ASC,
          CASE WHEN title LIKE '%대표%' THEN 1 WHEN title LIKE '%이사%' THEN 2
               WHEN title LIKE '%부장%' THEN 3 WHEN title LIKE '%과장%' THEN 4 ELSE 9 END,
          name ASC
      `);
      const departments = {};
      for (const row of result.rows) {
        const dept = row.department || '미지정';
        if (!departments[dept]) departments[dept] = [];
        departments[dept].push({ id: row.id, uid: row.uid || '', name: row.name,
          email: row.email, department: dept, title: row.title || '', role: row.role });
      }
      ok(res, Object.entries(departments).map(([name, members]) => ({ name, members })));
    } catch (err) { fail(res, 500, err.message); }
  });

  app.get('/api/namo-groupware/calendar', async (req, res) => {
    try {
      const user = userOf(req, res); if (!user) return;
      await schemaReady;
      const from = text(req.query.from) || new Date(Date.now() - 31 * 86400000).toISOString();
      const to = text(req.query.to) || new Date(Date.now() + 62 * 86400000).toISOString();
      const result = await pool.query(`
        SELECT * FROM namo_calendar_events
        WHERE start_at < $1::timestamptz AND end_at >= $2::timestamptz
          AND (scope='전사' OR (scope='부서' AND department=$3) OR creator_id=$4)
        ORDER BY start_at ASC
      `, [to, from, user.department || '', user.id]);
      ok(res, result.rows.map(mapEvent));
    } catch (err) { fail(res, 500, err.message); }
  });

  app.post('/api/namo-groupware/calendar', async (req, res) => {
    try {
      const user = userOf(req, res); if (!user) return;
      await schemaReady;
      const title = text(req.body?.title), scope = text(req.body?.scope) || '개인';
      const start = text(req.body?.start), end = text(req.body?.end);
      if (!title || !start || !end) return fail(res, 400, '일정명과 시작·종료 시간을 입력해 주세요.');
      if (!['개인','부서','전사'].includes(scope)) return fail(res, 400, '일정 공개 범위를 확인해 주세요.');
      if (scope === '전사' && !manager(user)) return fail(res, 403, '전사 일정은 이사 또는 관리자만 등록할 수 있습니다.');
      const result = await pool.query(`
        INSERT INTO namo_calendar_events
        (title,description,location,start_at,end_at,all_day,scope,department,creator_id,creator_name,creator_title)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
      `, [title,text(req.body.description),text(req.body.location),start,end,Boolean(req.body.allDay),scope,
          user.department || '',user.id,user.name || '',user.title || '']);
      ok(res, mapEvent(result.rows[0]), '일정이 등록되었습니다.');
    } catch (err) { fail(res, 500, err.message); }
  });

  app.put('/api/namo-groupware/calendar/:id', async (req, res) => {
    try {
      const user = userOf(req, res); if (!user) return;
      await schemaReady;
      const before = await pool.query('SELECT * FROM namo_calendar_events WHERE id=$1', [req.params.id]);
      if (!before.rowCount) return fail(res, 404, '일정을 찾을 수 없습니다.');
      const old = before.rows[0];
      if (old.creator_id !== user.id && !manager(user)) return fail(res, 403, '일정 수정 권한이 없습니다.');
      const scope = text(req.body?.scope) || old.scope;
      if (scope === '전사' && !manager(user)) return fail(res, 403, '전사 일정은 이사 또는 관리자만 수정할 수 있습니다.');
      const result = await pool.query(`
        UPDATE namo_calendar_events SET title=$1,description=$2,location=$3,start_at=$4,end_at=$5,
          all_day=$6,scope=$7,updated_at=NOW() WHERE id=$8 RETURNING *
      `,[text(req.body.title)||old.title,text(req.body.description),text(req.body.location),
         text(req.body.start)||old.start_at,text(req.body.end)||old.end_at,Boolean(req.body.allDay),scope,req.params.id]);
      ok(res, mapEvent(result.rows[0]), '일정이 수정되었습니다.');
    } catch (err) { fail(res, 500, err.message); }
  });

  app.delete('/api/namo-groupware/calendar/:id', async (req, res) => {
    try {
      const user = userOf(req, res); if (!user) return;
      await schemaReady;
      const result = await pool.query(`DELETE FROM namo_calendar_events
        WHERE id=$1 AND (creator_id=$2 OR $3::boolean=TRUE) RETURNING id`,
        [req.params.id,user.id,manager(user)]);
      if (!result.rowCount) return fail(res, 403, '일정 삭제 권한이 없습니다.');
      ok(res, null, '일정이 삭제되었습니다.');
    } catch (err) { fail(res, 500, err.message); }
  });
}

const wrappedExpress = function (...args) {
  const app = expressModule(...args);
  const originalUse = app.use.bind(app);
  let count = 0;
  app.use = function (...middleware) {
    const result = originalUse(...middleware);
    count += 1;
    if (count === 3) registerRoutes(app);
    return result;
  };
  return app;
};
Object.assign(wrappedExpress, expressModule);
require.cache[require.resolve('express')].exports = wrappedExpress;
