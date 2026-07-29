const expressModule = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const schemaReady = pool.query(`
  CREATE TABLE IF NOT EXISTS namo_talk_messages (
    id BIGSERIAL PRIMARY KEY,
    room_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_dept TEXT DEFAULT '',
    kind TEXT NOT NULL DEFAULT 'text',
    message_text TEXT DEFAULT '',
    file_name TEXT DEFAULT '',
    file_data TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_namo_talk_room_created
    ON namo_talk_messages(room_id, created_at, id);
`).catch((err) => {
  console.error('NAMO Talk schema initialization failed:', err.message);
});

function mapMessage(row) {
  const createdAt = new Date(row.created_at).getTime();
  return {
    id: Number(row.id),
    roomId: row.room_id,
    sender: row.sender_name,
    dept: row.sender_dept || '',
    kind: row.kind || 'text',
    text: row.message_text || '',
    fileName: row.file_name || '',
    fileData: row.file_data || '',
    createdAt,
    time: new Date(row.created_at).toLocaleTimeString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
}

function registerNamoTalkRoutes(app) {
  if (app.__namoTalkRoutesRegistered) return;
  app.__namoTalkRoutesRegistered = true;

  app.get('/api/namo-talk/messages', async (req, res) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.', data: null });
      }
      await schemaReady;
      const roomId = String(req.query.roomId || '').trim();
      if (!roomId) {
        return res.status(400).json({ success: false, message: '대화방 정보가 필요합니다.', data: null });
      }
      const result = await pool.query(
        `SELECT id, room_id, sender_name, sender_dept, kind, message_text, file_name, file_data, created_at
           FROM namo_talk_messages
          WHERE room_id = $1
          ORDER BY created_at ASC, id ASC
          LIMIT 1000`,
        [roomId]
      );
      return res.json({ success: true, message: 'OK', data: result.rows.map(mapMessage) });
    } catch (err) {
      console.error('NAMO Talk message list failed:', err);
      return res.status(500).json({ success: false, message: err.message, data: null });
    }
  });

  app.post('/api/namo-talk/messages', async (req, res) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.', data: null });
      }
      await schemaReady;
      const body = req.body || {};
      const roomId = String(body.roomId || '').trim();
      const kind = String(body.kind || 'text').trim();
      const text = String(body.text || '');
      const fileName = String(body.fileName || '');
      const fileData = String(body.fileData || '');
      const user = req.session.user;
      if (!roomId) {
        return res.status(400).json({ success: false, message: '대화방 정보가 필요합니다.', data: null });
      }
      if (!text && !fileData) {
        return res.status(400).json({ success: false, message: '메시지 내용이 없습니다.', data: null });
      }
      const result = await pool.query(
        `INSERT INTO namo_talk_messages
          (room_id, sender_name, sender_dept, kind, message_text, file_name, file_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, room_id, sender_name, sender_dept, kind, message_text, file_name, file_data, created_at`,
        [roomId, user.name || '', user.department || '', kind, text, fileName, fileData]
      );
      return res.json({ success: true, message: '전송되었습니다.', data: mapMessage(result.rows[0]) });
    } catch (err) {
      console.error('NAMO Talk send failed:', err);
      return res.status(500).json({ success: false, message: err.message, data: null });
    }
  });
}

const wrappedExpress = function wrappedExpress(...args) {
  const app = expressModule(...args);
  const originalUse = app.use.bind(app);
  let useCount = 0;
  app.use = function patchedUse(...middleware) {
    const result = originalUse(...middleware);
    useCount += 1;
    if (useCount === 3) registerNamoTalkRoutes(app);
    return result;
  };
  return app;
};

Object.assign(wrappedExpress, expressModule);
require.cache[require.resolve('express')].exports = wrappedExpress;
