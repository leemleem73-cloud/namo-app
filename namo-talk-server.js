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
    reply_to_id BIGINT,
    reply_sender TEXT DEFAULT '',
    reply_text TEXT DEFAULT '',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS reply_to_id BIGINT;
  ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS reply_sender TEXT DEFAULT '';
  ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS reply_text TEXT DEFAULT '';
  ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
  ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
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
    replyToId: row.reply_to_id == null ? null : Number(row.reply_to_id),
    replySender: row.reply_sender || '',
    replyText: row.reply_text || '',
    pinned: Boolean(row.is_pinned),
    edited: Boolean(row.edited_at),
    deleted: Boolean(row.deleted_at),
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
        `SELECT id, room_id, sender_name, sender_dept, kind, message_text, file_name, file_data,
                reply_to_id, reply_sender, reply_text, is_pinned, edited_at, deleted_at, created_at
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
      const replyToId = body.replyToId == null ? null : Number(body.replyToId);
      const replySender = String(body.replySender || '').slice(0, 100);
      const replyText = String(body.replyText || '').slice(0, 300);
      const user = req.session.user;
      if (!roomId) {
        return res.status(400).json({ success: false, message: '대화방 정보가 필요합니다.', data: null });
      }
      if (!text && !fileData) {
        return res.status(400).json({ success: false, message: '메시지 내용이 없습니다.', data: null });
      }
      const result = await pool.query(
        `INSERT INTO namo_talk_messages
          (room_id, sender_name, sender_dept, kind, message_text, file_name, file_data,
           reply_to_id, reply_sender, reply_text)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id, room_id, sender_name, sender_dept, kind, message_text, file_name, file_data,
                   reply_to_id, reply_sender, reply_text, is_pinned, edited_at, deleted_at, created_at`,
        [roomId, user.name || '', user.department || '', kind, text, fileName, fileData, replyToId, replySender, replyText]
      );
      return res.json({ success: true, message: '전송되었습니다.', data: mapMessage(result.rows[0]) });
    } catch (err) {
      console.error('NAMO Talk send failed:', err);
      return res.status(500).json({ success: false, message: err.message, data: null });
    }
  });

  app.patch('/api/namo-talk/messages/:id', async (req, res) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.', data: null });
      }
      await schemaReady;
      const id = Number(req.params.id);
      const action = String(req.body?.action || '').trim();
      if (!Number.isFinite(id)) {
        return res.status(400).json({ success: false, message: '메시지 정보가 올바르지 않습니다.', data: null });
      }
      const current = await pool.query('SELECT * FROM namo_talk_messages WHERE id = $1', [id]);
      const row = current.rows[0];
      if (!row) return res.status(404).json({ success: false, message: '메시지를 찾을 수 없습니다.', data: null });

      if (action === 'edit') {
        if (row.sender_name !== (req.session.user.name || '')) {
          return res.status(403).json({ success: false, message: '본인이 보낸 메시지만 수정할 수 있습니다.', data: null });
        }
        const text = String(req.body?.text || '').trim();
        if (!text) return res.status(400).json({ success: false, message: '메시지 내용을 입력하세요.', data: null });
        await pool.query('UPDATE namo_talk_messages SET message_text = $1, edited_at = NOW() WHERE id = $2', [text, id]);
      } else if (action === 'pin') {
        await pool.query('UPDATE namo_talk_messages SET is_pinned = $1 WHERE id = $2', [Boolean(req.body?.pinned), id]);
      } else {
        return res.status(400).json({ success: false, message: '지원하지 않는 작업입니다.', data: null });
      }

      const updated = await pool.query('SELECT * FROM namo_talk_messages WHERE id = $1', [id]);
      return res.json({ success: true, message: '처리되었습니다.', data: mapMessage(updated.rows[0]) });
    } catch (err) {
      console.error('NAMO Talk message update failed:', err);
      return res.status(500).json({ success: false, message: err.message, data: null });
    }
  });

  app.delete('/api/namo-talk/messages/:id', async (req, res) => {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.', data: null });
      }
      await schemaReady;
      const id = Number(req.params.id);
      const current = await pool.query('SELECT * FROM namo_talk_messages WHERE id = $1', [id]);
      const row = current.rows[0];
      if (!row) return res.status(404).json({ success: false, message: '메시지를 찾을 수 없습니다.', data: null });
      if (row.sender_name !== (req.session.user.name || '')) {
        return res.status(403).json({ success: false, message: '본인이 보낸 메시지만 삭제할 수 있습니다.', data: null });
      }
      const updated = await pool.query(
        `UPDATE namo_talk_messages
            SET message_text = '삭제된 메시지입니다.', file_name = '', file_data = '',
                kind = 'text', deleted_at = NOW(), is_pinned = FALSE
          WHERE id = $1 RETURNING *`,
        [id]
      );
      return res.json({ success: true, message: '삭제되었습니다.', data: mapMessage(updated.rows[0]) });
    } catch (err) {
      console.error('NAMO Talk message delete failed:', err);
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
