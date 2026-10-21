'use strict';

// Restore only missing 2025 IQC links. Never rewrite source inspections,
// existing/deleted approvals, signatures, inspection dates, or audit dates.
const running = new WeakMap();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = value => typeof value === 'string' ? value.trim() : '';
function signatureObject(value) {
  for (let i = 0; i < 2 && typeof value === 'string'; i++) {
    try { value = JSON.parse(value); } catch (_) { return {}; }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function savedTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  return Number.isFinite(Date.parse(value)) ? value : null;
}
function stageSignature(value, stage) {
  const data = signatureObject(value);
  const name = text(data.name);
  const userId = UUID.test(text(data.userId)) ? text(data.userId) : null;
  const signedAt = savedTime(data.signedAt);
  const state = text(data.status).replace(/\s+/g, '').toUpperCase();
  const action = text(data.action).toUpperCase();
  const complete = stage === 'approve'
    ? ['APPROVED', 'COMPLETED', 'DONE', '\uc644\ub8cc', '\uc2b9\uc778\uc644\ub8cc']
    : ['REVIEWED', 'COMPLETED', 'DONE', '\uc644\ub8cc', '\uac80\ud1a0\uc644\ub8cc'];
  const actions = stage === 'approve' ? ['APPROVE', '\uc2b9\uc778'] : ['REVIEW', '\uac80\ud1a0'];
  // A typed name or job title alone is not evidence of approval.
  const completed = !!(name || userId) && (!action || actions.includes(action))
    && (complete.includes(state) || (!state && !!signedAt));
  return { name, userId, completed, signedAt: completed ? signedAt : null };
}
function person(signature, users) {
  const byId = signature.userId && users.find(u => String(u.id) === signature.userId);
  const named = users.filter(u => text(u.name) === signature.name);
  const user = byId || (signature.name && named.length === 1 ? named[0] : null);
  return { id: user ? user.id : null, name: signature.name || text(user?.name) };
}
function approvalFromSource(row, users, manager) {
  const writerSignature = signatureObject(row.sign_writer);
  // The saved inspector remains the author; never use the current login.
  const writerName = text(row.inspector) || text(writerSignature.name);
  const writer = person({ name: writerName, userId: writerName === text(writerSignature.name) ? text(writerSignature.userId) : null }, users);
  const review = stageSignature(row.sign_reviewer, 'review');
  const approve = stageSignature(row.sign_approver, 'approve');
  const status = approve.completed ? 'APPROVED' : review.completed ? 'REVIEWED' : 'PENDING';
  const assignee = { id: manager?.id || null, name: text(manager?.name) };
  return {
    writer,
    reviewer: review.completed ? person(review, users) : status === 'APPROVED' ? { id: null, name: '' } : assignee,
    approver: approve.completed ? person(approve, users) : assignee,
    status,
    reviewedAt: review.signedAt,
    approvedAt: approve.signedAt
  };
}

async function recover(pool, manager) {
  const client = await pool.connect();
  const counts = { added: 0, approved: 0, reviewed: 0, pending: 0 };
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query("SET LOCAL statement_timeout = '30s'");
    await client.query('SELECT pg_advisory_xact_lock(20261021, 2025)');
    const missing = await client.query(`
      SELECT i.id::text AS record_id, i.inspector, i.item, i.lot,
             i.date AS inspection_date, i.created_at,
             i.sign_writer, i.sign_reviewer, i.sign_approver
      FROM iqc i
      WHERE LEFT(i.date::text, 4) = '2025'
        AND NOT EXISTS (
          SELECT 1 FROM qmes_quality_approvals a
          WHERE a.doc_type='IQC' AND a.record_id=i.id::text
        )
      ORDER BY i.date, i.id
      FOR UPDATE OF i
    `);
    if (missing.rows.length) {
      const users = (await client.query('SELECT id, name FROM users')).rows;
      await client.query(`CREATE TABLE IF NOT EXISTS qmes_iqc_2025_recovery_audit (
        approval_id BIGINT PRIMARY KEY REFERENCES qmes_quality_approvals(id),
        record_id TEXT NOT NULL,
        source_snapshot JSONB NOT NULL,
        recovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      for (const row of missing.rows) {
        const a = approvalFromSource(row, users, manager);
        const title = `\uc218\uc785\uac80\uc0ac \uc131\uc801\uc11c \uac80\ud1a0\u00b7\uc2b9\uc778 \u00b7 ${row.item || '-'} / LOT ${row.lot || '-'}`;
        const result = await client.query(`
          INSERT INTO qmes_quality_approvals
          (doc_type,record_id,title,page,writer_user_id,writer_name,
           reviewer_user_id,reviewer_name,approver_user_id,approver_name,
           status,reviewed_at,approved_at,created_at,updated_at)
          VALUES('IQC',$1,$2,'approval',$3,$4,$5,$6,$7,$8,$9,$10,$11,COALESCE($12,NOW()),NOW())
          ON CONFLICT DO NOTHING RETURNING id
        `, [row.record_id, title, a.writer.id, a.writer.name,
          a.reviewer.id, a.reviewer.name, a.approver.id, a.approver.name,
          a.status, a.reviewedAt, a.approvedAt, row.created_at]);
        if (!result.rowCount) continue;
        await client.query(`INSERT INTO qmes_iqc_2025_recovery_audit
          (approval_id,record_id,source_snapshot) VALUES($1,$2,$3::jsonb)`,
          [result.rows[0].id, row.record_id, JSON.stringify(row)]);
        counts.added++;
        counts[a.status === 'APPROVED' ? 'approved' : a.status === 'REVIEWED' ? 'reviewed' : 'pending']++;
      }
    }
    const check = await client.query(`SELECT COUNT(*)::int AS inspections,
      COUNT(a.id)::int AS linked,
      COUNT(*) FILTER (WHERE a.id IS NULL)::int AS missing,
      COUNT(*) FILTER (WHERE a.status='DELETED')::int AS intentionally_deleted
      FROM iqc i LEFT JOIN qmes_quality_approvals a
        ON a.doc_type='IQC' AND a.record_id=i.id::text
      WHERE LEFT(i.date::text, 4) = '2025'`);
    counts.verified = check.rows[0];
    await client.query('COMMIT');
    console.log('[QMES IQC 2025 recovery]', JSON.stringify(counts));
    return counts.added;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) { /* Keep the original error. */ }
    throw error;
  } finally {
    client.release();
  }
}
function recoverIqc2025Approvals(pool, manager) {
  // Startup and simultaneous list/notification requests share one transaction.
  // Retry after failures; a successful one-time migration is safe on restarts.
  if (!running.has(pool)) {
    const task = recover(pool, manager).catch(error => { running.delete(pool); throw error; });
    running.set(pool, task);
  }
  return running.get(pool);
}
module.exports = { recoverIqc2025Approvals, approvalFromSource, stageSignature };
