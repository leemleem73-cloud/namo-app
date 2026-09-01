'use strict';

// Additional shared-record API for QMES modules that are still browser-local.
// Installed after session middleware is attached, before the first /api route.
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const EXTRA_TYPES = new Set([
  'coa', 'approval', 'nonconform', 'training', 'calibration',
  'supplier', 'partner', 'report', 'master'
]);

function txt(v) {
  return (v ?? '').toString().trim();
}

function mapNotificationMessage(row) {
  const createdAt = new Date(row.created_at);
  return {
    id: row.id,
    roomId: row.room_id,
    createdAt: createdAt.getTime(),
    sender: row.sender_name,
    dept: row.sender_dept || '',
    text: row.message_text || '',
    time: createdAt.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul',
    }),
    kind: row.message_kind || 'text',
    fileName: row.file_name || '',
    fileType: row.file_type || '',
    // Notification polling never needs the attachment body. Returning it here
    // made afterId=0 responses very large when old image/file messages existed.
    fileData: '',
    replyToId: row.reply_to_id || null,
    replySender: row.reply_sender || '',
    replyText: row.reply_text || '',
    pinned: Boolean(row.pinned),
    edited: Boolean(row.edited_at),
    deleted: Boolean(row.deleted_at),
  };
}

function install(app) {
  if (app.__qmesExtraSyncInstalled) return;
  app.__qmesExtraSyncInstalled = true;

  // PQC shared inspection history can grow indefinitely. The old generic
  // endpoint returned the complete JSON payload history on every screen load,
  // which can exceed proxy response/time limits and surface as 502. Keep all
  // DB history, but bound the operational sync read to the newest records.
  app.get('/api/qmes-sync/pqc', async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ success:false, message:'로그인이 필요합니다.', data:null });
    try {
      const result = await pool.query(
        `SELECT record_type, record_key, payload, updated_by, updated_at
           FROM qmes_sync_records
          WHERE record_type = 'pqc'
          ORDER BY updated_at DESC
          LIMIT 2000`
      );
      return res.json({ success:true, message:'OK', data:result.rows });
    } catch (error) {
      console.error('qmes pqc sync GET failed:', error);
      return res.status(500).json({ success:false, message:'공정검사 공용 DB 조회에 실패했습니다.', data:null });
    }
  });

  // Work-order sync payloads are much larger than the other shared records.
  // The previous generic GET returned the entire historical set at once, which
  // could exceed the upstream response/time limit and surface as 502. Keep the
  // database history intact, but bound the operational read to recent work
  // orders plus the process/worker records used by production management.
  app.get('/api/qmes-sync/workorder', async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ success:false, message:'로그인이 필요합니다.', data:null });
    try {
      const result = await pool.query(
        `WITH recent_orders AS (
           SELECT record_type, record_key, payload, updated_by, updated_at
             FROM qmes_sync_records
            WHERE record_type = 'workorder'
              AND record_key NOT LIKE 'process:%'
              AND record_key NOT LIKE 'worker:%'
            ORDER BY updated_at DESC
            LIMIT 60
         ), operational_rows AS (
           SELECT record_type, record_key, payload, updated_by, updated_at
             FROM qmes_sync_records
            WHERE record_type = 'workorder'
              AND (record_key LIKE 'process:%' OR record_key LIKE 'worker:%')
            ORDER BY updated_at DESC
            LIMIT 500
         )
         SELECT * FROM recent_orders
         UNION ALL
         SELECT * FROM operational_rows
         ORDER BY updated_at DESC`,
        []
      );
      return res.json({ success:true, message:'OK', data:result.rows });
    } catch (error) {
      console.error('qmes workorder sync GET failed:', error);
      return res.status(500).json({ success:false, message:'작업지시 공용 DB 조회에 실패했습니다.', data:null });
    }
  });

  // Notification polling only needs a small message summary. In particular,
  // do not return file_data (base64 attachment bodies) in the poll response.
  // Large historical attachments were enough to make the reverse proxy return
  // 502 before the browser received JSON.
  app.get('/api/namo-talk/notifications', async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ success:false, message:'로그인이 필요합니다.', data:null });
    try {
      const requestedAfterId = Number(req.query.afterId);
      const cursorResult = await pool.query('SELECT COALESCE(MAX(id), 0) AS cursor FROM namo_talk_messages');
      const currentCursor = Number(cursorResult.rows[0]?.cursor || 0);
      if (!Number.isFinite(requestedAfterId)) {
        return res.json({ success:true, message:'OK', data:[], cursor:currentCursor });
      }

      const afterId = Math.max(0, requestedAfterId);
      const user = req.session.user;
      const userName = txt(user.name);
      const result = await pool.query(
        `SELECT id, room_id, sender_name, sender_uid, sender_dept,
                message_kind, message_text, file_name, file_type,
                reply_to_id, reply_sender, reply_text, pinned, edited_at, deleted_at, created_at
           FROM namo_talk_messages
          WHERE id > $1 AND sender_name <> $2 AND deleted_at IS NULL
          ORDER BY id ASC
          LIMIT 30`,
        [afterId, userName]
      );

      const departmentRoom = `dept:${txt(user.department)}`;
      const visible = result.rows.filter(row => {
        if (row.room_id === '전체공지' || row.room_id === departmentRoom) return true;
        if (!String(row.room_id).startsWith('dm:')) return false;
        return String(row.room_id).slice(3).split('|').includes(userName);
      });
      const nextCursor = result.rows.length ? Number(result.rows[result.rows.length - 1].id) : afterId;
      return res.json({
        success:true,
        message:'OK',
        data:visible.map(mapNotificationMessage),
        cursor:nextCursor,
      });
    } catch (error) {
      console.error('NAMO Talk notification GET failed:', error);
      return res.status(500).json({ success:false, message:'알림을 확인할 수 없습니다.', data:null });
    }
  });

  app.get('/api/qmes-extra-sync/:type', async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ success:false, message:'로그인이 필요합니다.', data:null });
    const type = String(req.params.type || '').trim().toLowerCase();
    if (!EXTRA_TYPES.has(type)) return res.status(400).json({ success:false, message:'지원하지 않는 공용 동기화 유형입니다.', data:null });
    try {
      const result = await pool.query(
        `SELECT record_type, record_key, payload, updated_by, updated_at
           FROM qmes_sync_records
          WHERE record_type = $1
          ORDER BY updated_at DESC`,
        [type]
      );
      return res.json({ success:true, message:'OK', data:result.rows });
    } catch (error) {
      console.error('qmes extra sync GET failed:', error);
      return res.status(500).json({ success:false, message:'공용 DB 조회에 실패했습니다.', data:null });
    }
  });

  app.post('/api/qmes-extra-sync/:type', async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ success:false, message:'로그인이 필요합니다.', data:null });
    const type = String(req.params.type || '').trim().toLowerCase();
    if (!EXTRA_TYPES.has(type)) return res.status(400).json({ success:false, message:'지원하지 않는 공용 동기화 유형입니다.', data:null });
    const key = String(req.body?.key || '').trim();
    if (!key) return res.status(400).json({ success:false, message:'공용 기록 키가 없습니다.', data:null });
    const payload = req.body?.payload && typeof req.body.payload === 'object' ? req.body.payload : {};
    const updatedBy = String(req.session.user?.name || req.session.user?.email || '').trim();
    try {
      const result = await pool.query(
        `INSERT INTO qmes_sync_records (record_type, record_key, payload, updated_by, updated_at)
         VALUES ($1,$2,$3::jsonb,$4,NOW())
         ON CONFLICT (record_type, record_key)
         DO UPDATE SET payload = EXCLUDED.payload, updated_by = EXCLUDED.updated_by, updated_at = NOW()
         RETURNING record_type, record_key, payload, updated_by, updated_at`,
        [type, key, JSON.stringify(payload), updatedBy]
      );
      return res.json({ success:true, message:'OK', data:result.rows[0] });
    } catch (error) {
      console.error('qmes extra sync POST failed:', error);
      return res.status(500).json({ success:false, message:'공용 DB 저장에 실패했습니다.', data:null });
    }
  });
}

const originalGet = express.application.get;
const originalPost = express.application.post;

express.application.get = function qmesExtraAwareGet(routePath, ...handlers) {
  if (typeof routePath === 'string' && routePath.startsWith('/api/') && !this.__qmesExtraSyncInstalled) install(this);
  return originalGet.call(this, routePath, ...handlers);
};

express.application.post = function qmesExtraAwarePost(routePath, ...handlers) {
  if (typeof routePath === 'string' && routePath.startsWith('/api/') && !this.__qmesExtraSyncInstalled) install(this);
  return originalPost.call(this, routePath, ...handlers);
};

module.exports = { installQmesExtraSyncRoutes: install };
