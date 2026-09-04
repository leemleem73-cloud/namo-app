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
  'supplier', 'partner', 'report', 'master', 'attendance'
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

  app.get('/api/qmes-sync/oqc', async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ success:false, message:'로그인이 필요합니다.', data:null });
    try {
      const result = await pool.query(
        `SELECT record_type, record_key, payload, updated_by, updated_at
           FROM qmes_sync_records
          WHERE record_type = 'oqc'
          ORDER BY updated_at DESC
          LIMIT 1000`
      );
      return res.json({ success:true, message:'OK', data:result.rows });
    } catch (error) {
      console.error('qmes oqc sync GET failed:', error);
      return res.status(500).json({ success:false, message:'출하검사 공용 DB 조회에 실패했습니다.', data:null });
    }
  });

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
      let result;
      if (type === 'attendance' && req.session.user.role !== 'admin') {
        result = await pool.query(
          `SELECT record_type, record_key, payload, updated_by, updated_at
             FROM qmes_sync_records
            WHERE record_type = 'attendance'
              AND payload->>'userId' = $1
            ORDER BY updated_at DESC
            LIMIT 370`,
          [String(req.session.user.id)]
        );
      } else if (type === 'attendance') {
        result = await pool.query(
          `SELECT record_type, record_key, payload, updated_by, updated_at
             FROM qmes_sync_records
            WHERE record_type = 'attendance'
            ORDER BY updated_at DESC
            LIMIT 5000`
        );
      } else {
        result = await pool.query(
          `SELECT record_type, record_key, payload, updated_by, updated_at
             FROM qmes_sync_records
            WHERE record_type = $1
            ORDER BY updated_at DESC`,
          [type]
        );
      }
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
    let key = String(req.body?.key || '').trim();
    let payload = req.body?.payload && typeof req.body.payload === 'object' ? { ...req.body.payload } : {};
    if (type === 'attendance') {
      const currentUserId = String(req.session.user.id || '');
      if (!currentUserId) return res.status(401).json({ success:false, message:'로그인이 필요합니다.', data:null });
      payload.userId = currentUserId;
      payload.userName = txt(req.session.user.name);
      payload.department = txt(req.session.user.department);
      payload.title = txt(req.session.user.title);
      const workDate = /^\d{4}-\d{2}-\d{2}$/.test(String(payload.workDate || '')) ? String(payload.workDate) : new Date().toLocaleDateString('sv-SE', { timeZone:'Asia/Seoul' });
      payload.workDate = workDate;
      key = `attendance:${currentUserId}:${workDate}`;
    }
    if (!key) return res.status(400).json({ success:false, message:'공용 기록 키가 없습니다.', data:null });
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
