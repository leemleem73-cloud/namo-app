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

async function signQualityStage(docType, recordId, field, actor, action) {
  const table={IQC:'iqc',IPQC:'pqc',OQC:'oqc'}[String(docType||'').toUpperCase()];
  if(!table||!recordId||!['sign_reviewer','sign_approver'].includes(field)) return;
  try {
    await pool.query(`UPDATE ${table} SET ${field}=$1::jsonb WHERE id::text=$2`,
      [signature(actor,action),String(recordId)]);
  } catch (error) {
    // Approval state is authoritative. A legacy/source-table signature sync failure
    // must not make a successful review/approval look failed to the user.
    console.error('[QMES quality approval source stage sync]', {docType,recordId,field,error:error?.message||error});
  }
}
function hasSeniorApprovalRole(user) {
  const title = String(user?.title || '').replace(/\s+/g, '').trim();
  const role = String(user?.role || '').toLowerCase().trim();
  if (role === 'admin') return true;
  if (!title) return false;
  return ['부장','이사','상무','전무','대표이사','사장','부사장','회장']
    .some(rank => title === rank || title.includes(rank));
}
async function departmentServerPermission(key,user,defaults=['품질부']) {
  if(!user) return false;
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS qmes_server_permissions(
      permission_key TEXT PRIMARY KEY,
      allowed_departments JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_by TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const q=await pool.query('SELECT allowed_departments FROM qmes_server_permissions WHERE permission_key=$1',[key]);
    const allowed=q.rowCount&&Array.isArray(q.rows[0].allowed_departments)?q.rows[0].allowed_departments:defaults;
    return allowed.map(v=>String(v||'').trim()).includes(String(user.department||'').trim());
  } catch(error) {
    console.error('[QMES approval server permission]',key,error);
    return defaults.includes(String(user.department||'').trim());
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


const QMES_APPROVAL_DOC_TYPES = new Set(['IQC','IPQC','OQC','NCR','STANDARD','CHANGE','TRAINING','WORK']);

function validUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}

async function ensureGenericApproval(input = {}) {
  await ensureSchema();
  const docType = String(input.docType || '').trim().toUpperCase();
  const recordId = String(input.recordId || '').trim();
  if (!QMES_APPROVAL_DOC_TYPES.has(docType) || !recordId) return null;

  const manager = await getQualityManager();
  if (!manager) return null;

  let writerUserId = validUuid(input.writerUserId) ? String(input.writerUserId) : null;
  let writerName = String(input.writerName || '작성자').trim() || '작성자';
  if (!writerUserId && writerName) {
    const u = await pool.query(
      "SELECT id,name FROM users WHERE name=$1 AND status='APPROVED' ORDER BY created_at DESC NULLS LAST LIMIT 1",
      [writerName]
    ).catch(() => ({rows:[]}));
    if (u.rows[0]) {
      writerUserId = u.rows[0].id;
      writerName = u.rows[0].name || writerName;
    }
  }

  const title = String(input.title || docType + ' 문서 검토·승인').trim();
  const page = String(input.page || 'approval').trim() || 'approval';
  const desiredStatus = ['PENDING','REVIEWED','APPROVED'].includes(input.status) ? input.status : 'PENDING';
  const existing = await pool.query(
    "SELECT * FROM qmes_quality_approvals WHERE doc_type=$1 AND record_id=$2 LIMIT 1",
    [docType, recordId]
  );

  let approval;
  if (existing.rowCount) {
    const old = existing.rows[0];
    if (old.status !== 'DELETED' && !input.resetExisting) return old;
    const q = await pool.query(
      `UPDATE qmes_quality_approvals
       SET title=$1,page=$2,writer_user_id=$3,writer_name=$4,
           reviewer_user_id=$5,reviewer_name=$6,approver_user_id=$5,approver_name=$6,
           status=$7,
           reviewed_at=CASE WHEN $7='PENDING' THEN NULL ELSE COALESCE($8::timestamptz,reviewed_at,NOW()) END,
           approved_at=CASE WHEN $7='APPROVED' THEN COALESCE($9::timestamptz,approved_at,NOW()) ELSE NULL END,
           created_at=COALESCE($10::timestamptz,created_at,NOW()),updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [title,page,writerUserId,writerName,manager.id,manager.name||'',desiredStatus,
       input.reviewedAt||null,input.approvedAt||null,input.createdAt||null,old.id]
    );
    approval=q.rows[0];
    await pool.query('DELETE FROM qmes_quality_notifications WHERE approval_id=$1',[approval.id]).catch(()=>{});
  } else {
    const q = await pool.query(
      `INSERT INTO qmes_quality_approvals
       (doc_type,record_id,title,page,writer_user_id,writer_name,
        reviewer_user_id,reviewer_name,approver_user_id,approver_name,status,reviewed_at,approved_at,created_at,updated_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$7,$8,$9,
         CASE WHEN $9='PENDING' THEN NULL ELSE COALESCE($10::timestamptz,NOW()) END,
         CASE WHEN $9='APPROVED' THEN COALESCE($11::timestamptz,NOW()) ELSE NULL END,
         COALESCE($12::timestamptz,NOW()),NOW())
       RETURNING *`,
      [docType,recordId,title,page,writerUserId,writerName,manager.id,manager.name||'',desiredStatus,
       input.reviewedAt||null,input.approvedAt||null,input.createdAt||null]
    );
    approval=q.rows[0];
  }

  if (desiredStatus === 'PENDING' && input.notifyReviewer !== false) {
    await notify(manager.id, docType+' 검토·승인 요청',
      writerName+'님이 '+title+' 검토·승인을 요청했습니다.', page, approval.id).catch(()=>{});
  }
  return approval;
}

async function syncGenericSourceStage(docType, recordId, stage, actor) {
  const type=String(docType||'').toUpperCase();
  const id=String(recordId||'').trim();
  if(!id)return;
  try{
    if(type==='NCR'){
      if(/^[0-9]+$/.test(id)){
        if(stage==='review'){
          await pool.query("UPDATE qmes_ncr_reports SET reviewed_by=$1,reviewed_at=COALESCE(reviewed_at,NOW()),approved_by='',approved_at=NULL,updated_at=NOW() WHERE id=$2",
            [actor.name,id]);
        }else{
          await pool.query("UPDATE qmes_ncr_reports SET approved_by=$1,approved_at=COALESCE(approved_at,NOW()),updated_at=NOW() WHERE id=$2",
            [actor.name,id]);
        }
      }else if(/^[0-9a-f-]{36}$/i.test(id)){
        const field=stage==='review'?'sign_reviewer':'sign_approver';
        await pool.query(`UPDATE nonconform SET ${field}=jsonb_build_object('name',$1::text,'userId',$2::text,'at',now()),qmes_updated_at=now() WHERE id=$3::uuid`,
          [actor.name,String(actor.id||''),id]);
      }
      return;
    }
    if(type==='STANDARD'){
      const patch=stage==='review'
        ? {approvalStatus:'REVIEWED',reviewerName:actor.name,reviewedAt:new Date().toISOString(),approverName:'',approvedAt:null}
        : {approvalStatus:'APPROVED',approverName:actor.name,approvedAt:new Date().toISOString()};
      await pool.query("UPDATE qmes_standard_documents SET document=document||$2::jsonb,updated_at=NOW() WHERE id=$1 AND deleted_at IS NULL",
        [id,JSON.stringify(patch)]);
    }
  }catch(error){
    console.error('[QMES generic source approval sync]',{type,id,stage,error:error?.message||error});
  }
}

async function ensureMissingNcrApprovals() {
  await ensureSchema();
  let created=0;
  try{
    const modern=await pool.query(`
      SELECT r.id::text record_id,r.report_no,r.source,r.product,r.lot,r.created_by writer_name,r.created_by_id writer_user_id,
             r.created_at,r.reviewed_by,r.reviewed_at,r.approved_by,r.approved_at
      FROM qmes_ncr_reports r
      LEFT JOIN qmes_quality_approvals a ON a.doc_type='NCR' AND a.record_id=r.id::text AND a.status<>'DELETED'
      WHERE a.id IS NULL ORDER BY r.created_at DESC LIMIT 300`);
    for(const row of modern.rows){
      const status=row.approved_at?'APPROVED':row.reviewed_at?'REVIEWED':'PENDING';
      const a=await ensureGenericApproval({
        docType:'NCR',recordId:row.record_id,
        title:'부적합 NCR 검토·승인 · '+(row.report_no||row.source||'NCR')+' / LOT '+(row.lot||'-'),
        page:'ncr',writerUserId:row.writer_user_id,writerName:row.writer_name||'작성자',
        status,reviewedAt:row.reviewed_at,approvedAt:row.approved_at,createdAt:row.created_at,notifyReviewer:false
      });
      if(a)created++;
    }
    const legacy=await pool.query(`
      SELECT n.id::text record_id,n.nc_no,n.type,n.item,n.lot,n.owner writer_name,n.created_at,
             n.sign_reviewer,n.sign_approver
      FROM nonconform n
      LEFT JOIN qmes_quality_approvals a ON a.doc_type='NCR' AND a.record_id=n.id::text AND a.status<>'DELETED'
      WHERE a.id IS NULL ORDER BY n.created_at DESC LIMIT 300`);
    for(const row of legacy.rows){
      const reviewedAt=row.sign_reviewer?.at||null,approvedAt=row.sign_approver?.at||null;
      const status=approvedAt?'APPROVED':reviewedAt?'REVIEWED':'PENDING';
      const a=await ensureGenericApproval({
        docType:'NCR',recordId:row.record_id,
        title:'부적합 NCR 검토·승인 · '+(row.nc_no||row.type||'NCR')+' / LOT '+(row.lot||'-'),
        page:'ncr',writerName:row.writer_name||'QMES 자동생성',
        status,reviewedAt,approvedAt,createdAt:row.created_at,notifyReviewer:false
      });
      if(a)created++;
    }
  }catch(error){console.error('[QMES NCR approval backfill]',error);}
  return created;
}

async function ensureMissingStandardApprovals() {
  await ensureSchema();
  let created=0;
  try{
    const q=await pool.query(`
      SELECT d.id,d.document,d.created_at,d.updated_at
      FROM qmes_standard_documents d
      LEFT JOIN qmes_quality_approvals a ON a.doc_type='STANDARD' AND a.record_id=d.id AND a.status<>'DELETED'
      WHERE d.deleted_at IS NULL AND a.id IS NULL
      ORDER BY d.updated_at DESC LIMIT 300`);
    for(const row of q.rows){
      const doc=row.document||{};
      const status=doc.approvalStatus==='APPROVED'?'APPROVED':doc.approvalStatus==='REVIEWED'?'REVIEWED':'PENDING';
      const a=await ensureGenericApproval({
        docType:'STANDARD',recordId:row.id,
        title:'기준서/문서 검토·승인 · '+(doc.documentNo||'-')+' '+(doc.name||''),
        page:'standard',writerName:doc.updatedBy||'작성자',status,
        reviewedAt:doc.reviewedAt||null,approvedAt:doc.approvedAt||null,createdAt:row.created_at,notifyReviewer:false
      });
      if(a)created++;
    }
  }catch(error){
    // Module table may not exist on older deployments; fail open.
    if(!/does not exist/i.test(String(error?.message||'')))console.error('[QMES standard approval backfill]',error);
  }
  return created;
}

async function ensureMissingIqcApprovals() {
  await ensureSchema();
  const manager = await getQualityManager();
  await require('./qmes-iqc-2025-recovery').recoverIqc2025Approvals(pool, manager);
  if (!manager) return 0;

  const missing = await pool.query(`
    SELECT i.id::text AS record_id,
           i.inspector,
           i.item,
           i.lot,
           i.created_at,
           u.id AS writer_user_id,
           u.name AS writer_name
    FROM iqc i
    LEFT JOIN users u ON u.name = i.inspector
    LEFT JOIN qmes_quality_approvals a
      ON a.doc_type='IQC' AND a.record_id=i.id::text
    WHERE a.id IS NULL
      AND COALESCE(i.sign_approver,'{}'::jsonb) = '{}'::jsonb
    ORDER BY i.created_at DESC
    LIMIT 100
  `);

  let created = 0;
  for (const row of missing.rows) {
    const writerId = row.writer_user_id || null;
    const writerName = row.writer_name || row.inspector || '작성자';
    const title = `수입검사 성적서 검토·승인 · ${row.item || '-'} / LOT ${row.lot || '-'}`;

    const ins = await pool.query(
      `INSERT INTO qmes_quality_approvals
       (doc_type,record_id,title,page,writer_user_id,writer_name,
        reviewer_user_id,reviewer_name,approver_user_id,approver_name,status,created_at,updated_at)
       VALUES('IQC',$1,$2,'approval',$3,$4,$5,$6,$5,$6,'PENDING',COALESCE($7,NOW()),NOW())
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [row.record_id,title,writerId,writerName,manager.id,manager.name||'',row.created_at]
    );

    if (ins.rowCount) {
      const approvalId = ins.rows[0].id;
      await notify(
        manager.id,
        'IQC 검토·승인 요청',
        `${writerName}님이 수입검사 성적서 검토·승인을 요청했습니다.`,
        'approval',
        approvalId
      );
      await updateSourceSignatures(
        'IQC',
        row.record_id,
        {id:writerId,name:writerName,department:'',title:''},
        manager,
        false
      );
      created++;
    }
  }
  return created;
}


async function ensurePqcApprovalForSyncRecord(input = {}) {
  await ensureSchema();
  const recordId = String(input.recordId || '').trim();
  if (!recordId) return null;

  const judge = String(input.judge || '').trim();
  if (!judge || /대기|미검사|미입력/.test(judge)) return null;

  const manager = await getQualityManager();
  if (!manager) return null;

  const existing = await pool.query(
    'SELECT * FROM qmes_quality_approvals WHERE doc_type=$1 AND record_id=$2 LIMIT 1',
    ['IPQC', recordId]
  );
  if (existing.rowCount && existing.rows[0].status !== 'DELETED') return existing.rows[0];

  const writerUserId = input.writerUserId || null;
  const writerName = String(input.writerName || '작성자').trim() || '작성자';
  const title = String(input.title || '공정검사 성적서 검토·승인').trim();
  const createdAt = input.createdAt || null;

  let approval;
  if (existing.rowCount) {
    const q = await pool.query(
      `UPDATE qmes_quality_approvals
       SET title=$1,page='approval',writer_user_id=$2,writer_name=$3,
           reviewer_user_id=$4,reviewer_name=$5,approver_user_id=$4,approver_name=$5,
           status='PENDING',reviewed_at=NULL,approved_at=NULL,
           created_at=COALESCE($6,created_at,NOW()),updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [title, writerUserId, writerName, manager.id, manager.name || '', createdAt, existing.rows[0].id]
    );
    approval = q.rows[0];
  } else {
    const q = await pool.query(
      `INSERT INTO qmes_quality_approvals
       (doc_type,record_id,title,page,writer_user_id,writer_name,
        reviewer_user_id,reviewer_name,approver_user_id,approver_name,status,created_at,updated_at)
       VALUES('IPQC',$1,$2,'approval',$3,$4,$5,$6,$5,$6,'PENDING',COALESCE($7,NOW()),NOW())
       RETURNING *`,
      [recordId, title, writerUserId, writerName, manager.id, manager.name || '', createdAt]
    );
    approval = q.rows[0];
  }

  if (input.notifyReviewer !== false) {
    await notify(
      manager.id,
      'IPQC 검토·승인 요청',
      `${writerName}님이 ${title} 검토·승인을 요청했습니다.`,
      'approval',
      approval.id
    );
  }
  return approval;
}

async function ensureMissingOqcSyncApprovals() {
  await ensureSchema();
  let rows;
  try {
    const result = await pool.query(
      `SELECT payload, updated_at
       FROM qmes_sync_records
       WHERE record_type='oqc'
       ORDER BY updated_at DESC
       LIMIT 2000`
    );
    rows = result.rows;
  } catch (error) {
    console.error('[QMES OQC approval backfill source]', error);
    return 0;
  }

  let created = 0;
  for (const source of rows) {
    const payload = source.payload || {};
    if (payload.deleted) continue;
    const records = Array.isArray(payload.rows) ? payload.rows : [];
    for (const record of records) {
      const recordId = String(record?.id || '').trim();
      const judge = String(record?.judge || record?.result || '').trim();
      const inspector = String(record?.writerName || record?.inspector || '').trim();
      if (!recordId || !inspector || !judge || /대기|미검사|미입력/.test(judge)) continue;

      const prior = await pool.query(
        "SELECT id FROM qmes_quality_approvals WHERE doc_type=$1 AND record_id=$2 AND status <> 'DELETED' LIMIT 1",
        ['OQC', recordId]
      );
      if (prior.rowCount) continue;

      const userQ = await pool.query(
        "SELECT id,name FROM users WHERE name=$1 ORDER BY status='APPROVED' DESC LIMIT 1",
        [inspector]
      );
      const product = String(record.product || '-').trim() || '-';
      const lot = String(record.lot || '-').trim() || '-';
      const approval = await ensureGenericApproval({
        docType:'OQC',
        recordId,
        title:`출하검사 성적서 검토·승인 · ${product} / LOT ${lot}`,
        page:'outgoing',
        writerUserId:userQ.rows[0]?.id || null,
        writerName:userQ.rows[0]?.name || inspector,
        createdAt:source.updated_at,
        notifyReviewer:false
      });
      if (approval) created++;
    }
  }
  return created;
}

async function ensureMissingPqcSyncApprovals() {
  await ensureSchema();
  let rows;
  try {
    const q = await pool.query(
      `SELECT payload, updated_at
       FROM qmes_sync_records
       WHERE record_type='pqc'
       ORDER BY updated_at DESC
       LIMIT 2000`
    );
    rows = q.rows;
  } catch (error) {
    console.error('[QMES PQC approval backfill source]', error);
    return 0;
  }

  let created = 0;
  for (const source of rows) {
    const payload = source.payload || {};
    const records = Array.isArray(payload.rows) ? payload.rows : [];
    for (const record of records) {
      const recordId = String(record?.id || '').trim();
      const judge = String(record?.judge || record?.detailFields?.['검사합부'] || '').trim();
      const inspector = String(record?.inspector || '').trim();
      if (!recordId || !inspector || !judge || /대기|미검사|미입력/.test(judge)) continue;

      const prior = await pool.query(
        'SELECT id FROM qmes_quality_approvals WHERE doc_type=$1 AND record_id=$2 AND status <> \'DELETED\' LIMIT 1',
        ['IPQC', recordId]
      );
      if (prior.rowCount) continue;

      const userQ = await pool.query(
        'SELECT id,name FROM users WHERE name=$1 ORDER BY status=\'APPROVED\' DESC LIMIT 1',
        [inspector]
      );
      const product = String(record.product || record.detailFields?.['제품명'] || '-').trim() || '-';
      const lot = String(record.lot || record.detailFields?.['생산 LOT NO'] || '-').trim() || '-';
      const approval = await ensurePqcApprovalForSyncRecord({
        recordId,
        judge,
        writerUserId: userQ.rows[0]?.id || null,
        writerName: userQ.rows[0]?.name || inspector,
        title: `공정검사 성적서 검토·승인 · ${product} / LOT ${lot}`,
        createdAt: source.updated_at,
        notifyReviewer: false
      });
      if (approval) created++;
    }
  }
  return created;
}

function install(app) {
  if (app.__qmesQualityApprovalSafeInstalled) return;
  app.__qmesQualityApprovalSafeInstalled = true;
  require('./qmes-module-notifications-20261029.js').install(app,{pool,requireLogin});

  // Recover requested historical links at deploy time only for a configured DB.
  // List requests share the transaction and retry if startup recovery fails.
  if (process.env.DATABASE_URL) {
    setImmediate(() => {
      ensureSchema().then(getQualityManager)
        .then(manager => require('./qmes-iqc-2025-recovery').recoverIqc2025Approvals(pool, manager))
        .catch(error => console.error('[QMES IQC 2025 recovery startup]', error));
    });
  }

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

      if (!QMES_APPROVAL_DOC_TYPES.has(docType)) return fail(res, 400, '전자결재 문서구분이 올바르지 않습니다.');

      let approval = null;
      if (recordId) {
        const existing = await pool.query(
          'SELECT * FROM qmes_quality_approvals WHERE doc_type=$1 AND record_id=$2 AND status <> \'DELETED\' LIMIT 1',
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
    res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      await ensureSchema();
      await ensureMissingIqcApprovals();
      await ensureMissingPqcSyncApprovals();
      await ensureMissingOqcSyncApprovals();
      await ensureMissingNcrApprovals();
      await ensureMissingStandardApprovals();
      const u = req.session.user || {};
      const admin = isAdmin(req);
      const q = await pool.query(
        admin
          ? `SELECT a.*, i.date AS inspection_date FROM qmes_quality_approvals a LEFT JOIN iqc i ON a.doc_type='IQC' AND a.record_id=i.id::text WHERE a.status <> 'DELETED' ORDER BY a.created_at DESC LIMIT 200`
          : `SELECT a.*, i.date AS inspection_date FROM qmes_quality_approvals a LEFT JOIN iqc i ON a.doc_type='IQC' AND a.record_id=i.id::text
             WHERE a.status <> 'DELETED' AND (a.writer_user_id=$1 OR a.reviewer_user_id=$1 OR a.approver_user_id=$1)
             ORDER BY a.created_at DESC LIMIT 200`,
        admin ? [] : [u.id]
      );
      return ok(res, q.rows);
    } catch (e) {
      return fail(res, 500, '전자결재 목록을 불러오지 못했습니다.');
    }
  });

  // IQC viewers share document status; the personal approval inbox remains scoped.
  // Match /api/iqc's login requirement and never create requests while reading status.
  app.get('/api/qmes-quality/iqc-statuses', requireLogin, async (_req, res) => {
    res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      await ensureSchema();
      const q = await pool.query(`
        SELECT DISTINCT ON (i.id) i.id::text AS record_id, a.status, a.updated_at,
          a.writer_name, a.reviewer_name, a.approver_name, a.reviewed_at, a.approved_at
        FROM iqc i
        LEFT JOIN qmes_quality_approvals a
          ON a.doc_type='IQC' AND a.record_id=i.id::text AND a.status <> 'DELETED'
        ORDER BY i.id, a.updated_at DESC NULLS LAST, a.created_at DESC NULLS LAST
      `);
      return ok(res, q.rows);
    } catch (e) {
      return fail(res, 500, '수입검사 결재 상태를 불러오지 못했습니다.');
    }
  });

  app.get('/api/qmes-quality/approvals/record', requireLogin, async (req, res) => {
    res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
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

  app.post('/api/qmes-quality/approvals/:id/review', requireLogin, async (req,res) => {
    try {
      await ensureSchema();
      const user=req.session.user||{};
      const profile=await pool.query('SELECT id,name,department,title FROM users WHERE id=$1 LIMIT 1',[user.id]);
      const actor=profile.rows[0];
      if(!actor||!hasSeniorApprovalRole(actor)||!(await departmentServerPermission('approvalReviewDepartments',actor))) return fail(res,403,'현재 서버 권한 설정상 전자결재 검토 권한이 없습니다.');
      const result=await pool.query(`UPDATE qmes_quality_approvals
        SET status='REVIEWED',reviewer_user_id=$1,reviewer_name=$2,reviewed_at=COALESCE(reviewed_at,NOW()),updated_at=NOW()
        WHERE id=$3
          AND COALESCE(status,'PENDING') NOT IN ('APPROVED','DELETED')
          AND reviewed_at IS NULL
        RETURNING *`,[actor.id,actor.name,req.params.id]);
      if(!result.rowCount){
        const current=await pool.query('SELECT * FROM qmes_quality_approvals WHERE id=$1 LIMIT 1',[req.params.id]);
        if(current.rowCount && current.rows[0].status==='REVIEWED' && current.rows[0].reviewed_at){
          return ok(res,current.rows[0],'이미 검토가 완료되어 승인대기 상태입니다.');
        }
        return fail(res,409,'현재 상태에서는 검토 처리할 수 없습니다.');
      }
      const approval=result.rows[0];
      await signQualityStage(approval.doc_type,approval.record_id,'sign_reviewer',actor,'검토');
      await syncGenericSourceStage(approval.doc_type,approval.record_id,'review',actor);
      if(approval.approver_user_id){
        try {
          await notify(approval.approver_user_id,'최종 승인대기',approval.title+' 최종 승인을 요청합니다.',approval.page,approval.id);
        } catch (error) {
          console.error('[QMES review notification]', error);
        }
      }
      return ok(res,approval,'검토가 완료되어 승인대기로 변경됐습니다.');
    }catch(e){console.error('[QMES review]',e);return fail(res,500,'검토 처리에 실패했습니다.');}
  });

  app.post('/api/qmes-quality/approvals/:id/approve',requireLogin,async(req,res)=>{
    try {
      await ensureSchema();
      const user=req.session.user||{};
      const profile=await pool.query('SELECT id,name,department,title FROM users WHERE id=$1 LIMIT 1',[user.id]);
      const actor=profile.rows[0];
      if(!actor||!hasSeniorApprovalRole(actor)||!(await departmentServerPermission('approvalFinalDepartments',actor)))return fail(res,403,'현재 서버 권한 설정상 최종 승인 권한이 없습니다.');
      const result=await pool.query(`UPDATE qmes_quality_approvals
        SET status='APPROVED',approver_user_id=$1,approver_name=$2,approved_at=COALESCE(approved_at,NOW()),updated_at=NOW()
        WHERE id=$3
          AND reviewed_at IS NOT NULL
          AND COALESCE(status,'REVIEWED') NOT IN ('APPROVED','DELETED')
        RETURNING *`,[actor.id,actor.name,req.params.id]);
      if(!result.rowCount){
        const current=await pool.query('SELECT * FROM qmes_quality_approvals WHERE id=$1 LIMIT 1',[req.params.id]);
        if(current.rowCount && current.rows[0].status==='APPROVED' && current.rows[0].approved_at){
          return ok(res,current.rows[0],'이미 최종 승인 완료된 문서입니다.');
        }
        return fail(res,409,'검토 완료 후에만 최종 승인할 수 있습니다.');
      }
      const approval=result.rows[0];
      await signQualityStage(approval.doc_type,approval.record_id,'sign_approver',actor,'승인');
      await syncGenericSourceStage(approval.doc_type,approval.record_id,'approve',actor);
      if(approval.writer_user_id){
        try {
          await notify(approval.writer_user_id,'최종 승인완료',approval.title+' 최종 승인이 완료됐습니다.',approval.page,approval.id);
        } catch (error) {
          console.error('[QMES approve notification]', error);
        }
      }
      return ok(res,approval,'최종 승인이 완료됐습니다.');
    }catch(e){console.error('[QMES approve]',e);return fail(res,500,'최종 승인에 실패했습니다.');}
  });

  app.delete('/api/qmes-quality/approvals/:id', requireLogin, async (req, res) => {
    try {
      await ensureSchema();
      const current = await pool.query('SELECT * FROM qmes_quality_approvals WHERE id=$1 AND status <> \'DELETED\' LIMIT 1', [req.params.id]);
      if (!current.rowCount) return fail(res, 404, '결재 문서를 찾을 수 없습니다.');

      const approval = current.rows[0];
      const u = req.session.user || {};
      const allowed = isAdmin(req)
        || String(u.id || '') === String(approval.writer_user_id || '')
        || String(u.id || '') === String(approval.reviewer_user_id || '')
        || String(u.id || '') === String(approval.approver_user_id || '');
      if (!allowed) return fail(res, 403, '삭제 권한이 없습니다.');

      await pool.query('DELETE FROM qmes_quality_notifications WHERE approval_id=$1', [approval.id]);
      await pool.query(
        "UPDATE qmes_quality_approvals SET status='DELETED', updated_at=NOW() WHERE id=$1",
        [approval.id]
      );

      return ok(res, null, '결재 문서가 삭제되었습니다.');
    } catch (e) {
      console.error('[QMES quality approval delete]', e);
      return fail(res, 500, '결재 문서 삭제에 실패했습니다.');
    }
  });

  app.get('/api/qmes-quality/notifications', requireLogin, async (req, res) => {
    res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const dates=require('./public/js/qmes-notification-dates-20261021.js').validateRange(req.query);
      if(!dates)return fail(res,400,'조회 날짜를 확인해 주세요.');
      await ensureSchema();
      await ensureMissingIqcApprovals();
      const q = await pool.query(
        `SELECT n.*,a.doc_type,a.record_id,a.status AS approval_status,a.writer_name,a.reviewer_name,a.approver_name,a.approved_at
         FROM qmes_quality_notifications n
         LEFT JOIN qmes_quality_approvals a ON a.id=n.approval_id
         WHERE n.user_id=$1
           AND ($2::date IS NULL OR n.created_at>=($2::date::timestamp AT TIME ZONE 'Asia/Seoul'))
           AND ($3::date IS NULL OR n.created_at<(($3::date + INTERVAL '1 day') AT TIME ZONE 'Asia/Seoul'))
         ORDER BY n.created_at DESC
         LIMIT 100`,
        [req.session.user.id,dates.from,dates.to]
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

module.exports = { installQmesQualityApprovalSafe: install, ensurePqcApprovalForSyncRecord, ensureGenericApproval };
