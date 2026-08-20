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

function install(app) {
  if (app.__qmesExtraSyncInstalled) return;
  app.__qmesExtraSyncInstalled = true;

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
