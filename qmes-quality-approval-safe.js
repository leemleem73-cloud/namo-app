'use strict';

const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

let schemaReady = false;
let schemaPromise = null;

const ok = (res, data = null, message = 'OK') => res.json({ success: true, message, data });
const fail = (res, status, message) => res.status(status).json({ success: false, message, data: null });
const requireLogin = (req, res, next) => req.session?.user ? next() : fail(res, 401, '로그인이 필요합니다.');
const isAdmin = (req) => String(req.session?.user?.role || '').toLowerCase() === 'admin';

async function ensureSchema() {
  if (schemaReady) return;
  if (schemaPromise) return schemaPromise;
  schemaPromise = pool.query(`
    CREATE TABLE IF NOT EXISTS qmes_quality_approvals (
      id BIGSERIAL PRIMARY KEY,
      doc_type TEXT NOT NULL,
      record_id TEXT,
      title TEXT NOT NULL DEFAULT '',
      page TEXT NOT NULL DEFAULT 'approval',
      writer_user_id UUID,
      writer_name TEXT NOT NULL DEFAULT '',
      reviewer_user_id UUID,
      reviewer_name TEXT NOT NULL DEFAULT '',
      approver_user_id UUID,
      approver_name TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'PENDING',
      reviewed_at TIMESTAMPTZ,
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS qmes_quality_approvals_record_uq
      ON qmes_quality_approvals(doc_type, record_id)
      WHERE record_id IS NOT NULL AND record_id <> '';

    CREATE TABLE IF NOT EXISTS qmes_quality_notifications (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID NOT NULL,
      kind TEXT NOT NULL DEFAULT 'approval',
      title TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      page TEXT NOT NULL DEFAULT 'approval',
      approval_id BIGINT REFERENCES qmes_quality_approvals(id) ON DELETE CASCADE,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS qmes_quality_notifications_user_idx
      ON qmes_quality_notifications(user_id, created_at DESC);
  `).then(() => { schemaReady = true; }).finally(() => { schemaPromise = null; });
  return schemaPromise;
}

async function getQualityManager() {
  const q = await pool.query(`
    SELECT id, name, department, title, role
    FROM users
    WHERE status='APPROVED'
      AND department='품질부'
      AND title IN ('부장','이사','상무','전무','대표이사')
    ORDER BY CASE title
      WHEN '부장' THEN 0
      WHEN '이사' THEN 1
      WHEN '상무' THEN 2
      WHEN '전무' THEN 3
      WHEN '대표이사' THEN 4
      ELSE 9 END
    LIMIT 1
  `);
  return q.rows[0] || null;
}

function signature(user, action) {
  return JSON.stringify({
    userId: user?.id || '',
    name: user?.name || '',
    department: user?.department || '',
    position: user?.title || '',
    action,
    status: '완료',
    signedAt: new Date().toISOString()
  });
}

async function updateSourceSignatures(docType, recordId, writer, approver, approved) {
  const table = { IQC: 'iqc', IPQC: 'pqc', OQC: 'oqc' }[String(docType || '').toUpperCase()];
  if (!table || !recordId) return;
  try {
    if (approved) {
      await pool.query(
        `UPDATE ${table}
         SET sign_writer=$1::jsonb, sign_reviewer=$2::jsonb, sign_approver=$3::jsonb
         WHERE id::text=$4`,
        [signature(writer, '작성'), signature(approver, '검토'), signature(approver, '승인'), String(recordId)]
      );
    } else {
      await pool.query(
        `UPDATE ${table}
         SET sign_writer=$1::jsonb, sign_reviewer='{}'::jsonb, sign_approver='{}'::jsonb
         WHERE id::text=$2`,
        [signature(writer, '작성'), String(recordId)]
      );
    }
  } catch (e) {
    console.error('[QMES quality approval source signature]', e);
  }
}

async function notify(userId, title, message, page, approvalId) {
  if (!userId) return;
  await pool.query(
    `INSERT INTO qmes_quality_notifications(user_id,title,message,page,approval_id)
     VALUES($1,$2,$3,$4,$5)`,
    [userId, title, message, page || 'approval', approvalId || null]
  );
}

function install(app) {
  if (app.__qmesQualityApprovalSafeInstalled) return;
  app.__qmesQualityApprovalSafeInstalled = true;

  app.get('/api/qmes-quality/health', (_req, res) => ok(res, { service: 'quality-approval', status: 'ready' }));

  app.post('/api/qmes-quality/approvals/request', requireLogin, async (req, res) => {
    try {
      await ensureSchema();
      const manager = await getQualityManager();
      if (!manager) return fail(res, 409, '품질부 부장 계정을 찾을 수 없습니다.');

      const u = req.session.user || {};
      const docType = String(req.body?.docType || '').trim().toUpperCase();
      const recordId = String(req.body?.recordId || '').trim() || null;
      const title = String(req.body?.title || '품질문서 검토·승인 요청').trim();
      const page = String(req.body?.page || 'approval').trim() || 'approval';

      if (!['IQC','IPQC','OQC'].includes(docType)) return fail(res, 400, '품질문서 구분이 올바르지 않습니다.');

      let approval = null;
      if (recordId) {
        const existing = await pool.query(
          'SELECT * FROM qmes_quality_approvals WHERE doc_type=$1 AND record_id=$2 LIMIT 1',
          [docType, recordId]
        );
        if (existing.rowCount) {
          const q = await pool.query(
            `UPDATE qmes_quality_approvals
             SET title=$1,page=$2,writer_user_id=$3,writer_name=$4,
                 reviewer_user_id=$5,reviewer_name=$6,approver_user_id=$5,approver_name=$6,
                 status='PENDING',reviewed_at=NULL,approved_at=NULL,updated_at=NOW()
             WHERE id=$7 RETURNING *`,
            [title, page, u.id || null, u.name || '', manager.id, manager.name || '', existing.rows[0].id]
          );
          approval = q.rows[0];
          await pool.query('DELETE FROM qmes_quality_notifications WHERE approval_id=$1', [approval.id]);
        }
      }

      if (!approval) {
        const q = await pool.query(
          `INSERT INTO qmes_quality_approvals
           (doc_type,record_id,title,page,writer_user_id,writer_name,reviewer_user_id,reviewer_name,approver_user_id,approver_name,status)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$7,$8,'PENDING')
           RETURNING *`,
          [docType, recordId, title, page, u.id || null, u.name || '', manager.id, manager.name || '']
        );
        approval = q.rows[0];
      }

      await updateSourceSignatures(docType, recordId, u, manager, false);
      await notify(
        manager.id,
        `${docType} 검토·승인 요청`,
        `${u.name || '작성자'}님이 ${title} 검토·승인을 요청했습니다.`,
        page,
        approval.id
      );

      return ok(res, approval, '품질부 부장 통합알림으로 검토·승인 요청을 보냈습니다.');
    } catch (e) {
      console.error('[QMES quality approval request]', e);
      return fail(res, 500, '검토·승인 요청에 실패했습니다.');
    }
  });

  app.get('/api/qmes-quality/approvals', requireLogin, async (req, res) => {
    try {
      await ensureSchema();
      const u = req.session.user || {};
      const admin = isAdmin(req);
      const q = await pool.query(
        admin
          ? `SELECT * FROM qmes_quality_approvals ORDER BY created_at DESC LIMIT 200`
          : `SELECT * FROM qmes_quality_approvals
             WHERE writer_user_id=$1 OR reviewer_user_id=$1 OR approver_user_id=$1
             ORDER BY created_at DESC LIMIT 200`,
        admin ? [] : [u.id]
      );
      return ok(res, q.rows);
    } catch (e) {
      return fail(res, 500, '전자결재 목록을 불러오지 못했습니다.');
    }
  });

  app.get('/api/qmes-quality/approvals/record', requireLogin, async (req, res) => {
    try {
      await ensureSchema();
      const docType = String(req.query.docType || '').trim().toUpperCase();
      const recordId = String(req.query.recordId || '').trim();
      if (!docType || !recordId) return ok(res, null);
      const q = await pool.query(
        'SELECT * FROM qmes_quality_approvals WHERE doc_type=$1 AND record_id=$2 LIMIT 1',
        [docType, recordId]
      );
      return ok(res, q.rows[0] || null);
    } catch (e) {
      return fail(res, 500, '결재 상태를 불러오지 못했습니다.');
    }
  });

  app.post('/api/qmes-quality/approvals/:id/approve', requireLogin, async (req, res) => {
    try {
      await ensureSchema();
      const current = await pool.query('SELECT * FROM qmes_quality_approvals WHERE id=$1 LIMIT 1', [req.params.id]);
      if (!current.rowCount) return fail(res, 404, '결재 요청을 찾을 수 없습니다.');
      const approval = current.rows[0];
      const u = req.session.user || {};
      const allowed = isAdmin(req) || String(u.id || '') === String(approval.reviewer_user_id || '') || String(u.id || '') === String(approval.approver_user_id || '');
      if (!allowed) return fail(res, 403, '검토·승인 권한이 없습니다.');

      const manager = {
        id: u.id || approval.approver_user_id,
        name: u.name || approval.approver_name,
        department: u.department || '품질부',
        title: u.title || '부장'
      };
      const writerQ = approval.writer_user_id
        ? await pool.query('SELECT id,name,department,title FROM users WHERE id=$1 LIMIT 1', [approval.writer_user_id])
        : { rows: [] };
      const writer = writerQ.rows[0] || { id: approval.writer_user_id, name: approval.writer_name };

      const q = await pool.query(
        `UPDATE qmes_quality_approvals
         SET status='APPROVED',reviewer_name=$1,approver_name=$1,
             reviewed_at=NOW(),approved_at=NOW(),updated_at=NOW()
         WHERE id=$2 RETURNING *`,
        [manager.name || approval.approver_name, approval.id]
      );

      await updateSourceSignatures(approval.doc_type, approval.record_id, writer, manager, true);
      await pool.query('UPDATE qmes_quality_notifications SET read_at=COALESCE(read_at,NOW()) WHERE approval_id=$1 AND user_id=$2', [approval.id, u.id]);

      if (approval.writer_user_id) {
        await notify(
          approval.writer_user_id,
          `${approval.doc_type} 검토·승인 완료`,
          `${approval.title}이(가) ${manager.name || '품질부 부장'} 검토·승인 완료되었습니다.`,
          approval.page || 'approval',
          approval.id
        );
      }
      return ok(res, q.rows[0], '검토·승인이 완료되었습니다.');
    } catch (e) {
      console.error('[QMES quality approve]', e);
      return fail(res, 500, '검토·승인 처리에 실패했습니다.');
    }
  });

  app.get('/api/qmes-quality/notifications', requireLogin, async (req, res) => {
    try {
      await ensureSchema();
      const q = await pool.query(
        `SELECT n.*,a.doc_type,a.record_id,a.status AS approval_status,a.writer_name,a.reviewer_name,a.approver_name,a.approved_at
         FROM qmes_quality_notifications n
         LEFT JOIN qmes_quality_approvals a ON a.id=n.approval_id
         WHERE n.user_id=$1
         ORDER BY n.created_at DESC
         LIMIT 100`,
        [req.session.user.id]
      );
      return ok(res, q.rows);
    } catch (e) {
      return fail(res, 500, '통합알림을 불러오지 못했습니다.');
    }
  });

  app.post('/api/qmes-quality/notifications/read-all', requireLogin, async (req, res) => {
    try {
      await ensureSchema();
      await pool.query(
        'UPDATE qmes_quality_notifications SET read_at=COALESCE(read_at,NOW()) WHERE user_id=$1',
        [req.session.user.id]
      );
      return ok(res, null, '모두 읽음 처리했습니다.');
    } catch (e) {
      return fail(res, 500, '알림 처리에 실패했습니다.');
    }
  });
}

const originalUse = express.application.use;
express.application.use = function qmesQualityApprovalUse(...args) {
  const result = originalUse.apply(this, args);
  if (!this.__qmesQualityApprovalSafeInstalled) {
    const fns = args.flat().filter(v => typeof v === 'function');
    if (fns.some(fn => fn.name === 'session' || /session/i.test(String(fn.name || '')))) {
      install(this);
      console.log('[QMES quality approval] routes installed after QMES session middleware');
    }
  }
  return result;
};

module.exports = { installQmesQualityApprovalSafe: install };
