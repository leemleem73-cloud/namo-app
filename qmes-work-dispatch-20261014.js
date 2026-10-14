'use strict';
// Isolated work-order routing: never modifies the existing QMES work-order documents.
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});
let schemaPromise = null;
const trim = value => String(value == null ? '' : value).trim();
const excludedDept = name => ['GUEST','대표'].includes(trim(name).toUpperCase());
const ok = (res,data,message) => res.json({success:true,data:data == null ? null : data,message:message||'OK'});
const fail = (res,code,message) => res.status(code).json({success:false,message,data:null});
const login = (req,res,next) => req.session && req.session.user && req.session.user.id
  ? next() : fail(res,401,'QMES 로그인이 필요합니다.');

function ensureSchema(){
  if(!schemaPromise){
    schemaPromise = pool.query([
      'CREATE TABLE IF NOT EXISTS qmes_work_order_dispatches (',
      'id BIGSERIAL PRIMARY KEY,',
      'work_order_id TEXT NOT NULL,',
      'department TEXT NOT NULL,',
      'request_key TEXT NOT NULL,',
      'sender_user_id UUID,',
      'sender_name TEXT NOT NULL DEFAULT \'\',',
      'note TEXT NOT NULL DEFAULT \'\',',
      'recipient_count INTEGER NOT NULL DEFAULT 0,',
      'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),',
      'UNIQUE(request_key, department))',
      ';',
      'CREATE TABLE IF NOT EXISTS qmes_work_order_dispatch_receipts (',
      'dispatch_id BIGINT NOT NULL REFERENCES qmes_work_order_dispatches(id) ON DELETE CASCADE,',
      'user_id UUID NOT NULL,',
      'read_at TIMESTAMPTZ,',
      'PRIMARY KEY(dispatch_id,user_id))',
      ';',
      'CREATE INDEX IF NOT EXISTS qmes_work_dispatch_user_idx ON qmes_work_order_dispatch_receipts(user_id,read_at)',
      ';',
      'CREATE INDEX IF NOT EXISTS qmes_work_dispatch_order_idx ON qmes_work_order_dispatches(work_order_id,created_at DESC)'
    ].join(' ')).catch(error=>{schemaPromise=null;throw error;});
  }
  return schemaPromise;
}
function installWorkDispatchRoutes(app){
  if(app.__namoWorkDispatch20261014)return;
  app.__namoWorkDispatch20261014=true;

  app.get('/api/qmes-work-dispatch/departments',login,async(req,res)=>{
    try{
      const result=await pool.query(
        "SELECT TRIM(department) AS name,COUNT(*)::int AS members, "+
        "JSON_AGG(JSON_BUILD_OBJECT('id',id,'name',name,'title',COALESCE(title,'')) ORDER BY name) AS staff "+
        "FROM users WHERE status='APPROVED' AND NULLIF(TRIM(department),'') IS NOT NULL "+
        "AND UPPER(TRIM(department)) NOT IN ('GUEST','대표') "+
        "GROUP BY TRIM(department) ORDER BY TRIM(department)"
      );
      ok(res,result.rows);
    }catch(e){
      console.error('[QMES work dispatch] departments:',e.message);
      fail(res,500,'수신부서 목록을 불러오지 못했습니다.');
    }
  });

  app.post('/api/qmes-work-dispatch/send',login,async(req,res)=>{
    const documentId=trim(req.body && req.body.documentId);
    const raw=req.body && req.body.departments;
    const departments=Array.isArray(raw) ? [...new Set(raw.map(trim).filter(Boolean))] : [];
    const note=trim(req.body && req.body.note);
    const requestKey=trim(req.body && req.body.requestKey);
    const sendMode=trim(req.body && req.body.sendMode)||'department';
    const selectedUserIds=Array.isArray(req.body && req.body.recipientUserIds)
      ? [...new Set(req.body.recipientUserIds.map(trim).filter(Boolean))] : [];
    if(!/^WO-[A-Za-z0-9_-]{6,60}$/.test(documentId))
      return fail(res,400,'유효한 작업지시번호가 필요합니다.');
    if(!departments.length || departments.length>12 || departments.some(x=>x.length>60 || excludedDept(x)))
      return fail(res,400,'수신부서를 1개 이상 선택해 주세요.');
    if(note.length>500 || !/^[A-Za-z0-9_-]{10,100}$/.test(requestKey))
      return fail(res,400,'발송정보를 확인해 주세요.');
    if(!['department','staff'].includes(sendMode) || selectedUserIds.length>200 ||
       (sendMode==='staff' && !selectedUserIds.length) ||
       selectedUserIds.some(id=>!/^[a-f0-9-]{36}$/i.test(id)))
      return fail(res,400,'발송 대상 직원 선택을 확인해 주세요.');
    let client;
    try{
      await ensureSchema();
      client=await pool.connect();
      await client.query('BEGIN');
      const order=await client.query(
        'SELECT doc.id FROM qmes_work_order_documents doc '+
        'WHERE doc.id=$1 AND NOT EXISTS (SELECT 1 FROM qmes_work_order_deletions gone WHERE gone.id=doc.id) LIMIT 1',
        [documentId]
      );
      if(!order.rowCount){await client.query('ROLLBACK');return fail(res,404,'먼저 작업지시서를 저장해 주세요.');}
      const users=await client.query(
        "SELECT id,TRIM(department) AS department FROM users WHERE status='APPROVED' "+
        "AND UPPER(TRIM(department)) NOT IN ('GUEST','대표') "+
        "AND TRIM(department)=ANY($1::text[])"
        [departments]
      );
      const grouped=new Map(departments.map(dept=>[dept,[]]));
      users.rows.forEach(user=>{if(grouped.has(user.department))grouped.get(user.department).push(user.id);});
      const allowed=new Set(users.rows.map(user=>String(user.id)));
      if(sendMode==='staff' && selectedUserIds.some(id=>!allowed.has(id))){
        await client.query('ROLLBACK');
        return fail(res,409,'선택한 직원이 승인된 수신부서 직원등록현황과 일치하지 않습니다.');
      }
      const selected=new Set(selectedUserIds);
      const recipients=new Map(departments.map(dept=>[
        dept,sendMode==='staff'?grouped.get(dept).filter(id=>selected.has(String(id))):grouped.get(dept)
      ]));
      const missing=departments.filter(dept=>!recipients.get(dept).length);
      if(missing.length){
        await client.query('ROLLBACK');
        return fail(res,409,'수신 가능한 승인 사용자가 없는 부서: '+missing.join(', '));
      }
      let recipientTotal=0;
      const dispatchIds=[];
      for(const department of departments){
        const recipientIds=recipients.get(department);
        const inserted=await client.query(
          'INSERT INTO qmes_work_order_dispatches '+
          '(work_order_id,department,request_key,sender_user_id,sender_name,note,recipient_count) '+
          'VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(request_key,department) DO NOTHING RETURNING id',
          [documentId,department,requestKey,req.session.user.id,trim(req.session.user.name),note,recipientIds.length]
        );
        const dispatch=inserted.rows[0] || (await client.query(
          'SELECT id,work_order_id FROM qmes_work_order_dispatches WHERE request_key=$1 AND department=$2',
          [requestKey,department]
        )).rows[0];
        if(!dispatch){throw new Error('작업지시 발송 기록을 만들지 못했습니다.');}
        if(dispatch.work_order_id && dispatch.work_order_id!==documentId){
          throw new Error('중복 발송 요청번호가 다른 작업지시서와 일치합니다.');
        }
        dispatchIds.push(dispatch.id);
        if(inserted.rowCount){
          for(const userId of recipientIds){
            await client.query(
              'INSERT INTO qmes_work_order_dispatch_receipts(dispatch_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
              [dispatch.id,userId]
            );
          }
        }
        recipientTotal+=recipientIds.length;
      }
      await client.query('COMMIT');
      ok(res,{documentId,departments,recipientTotal,dispatchIds},'선택한 부서에 작업지시서를 발송했습니다.');
    }catch(e){
      if(client){try{await client.query('ROLLBACK');}catch(_){}}
      console.error('[QMES work dispatch] send:',e.message);
      fail(res,500,'작업지시서 발송에 실패했습니다. 다시 시도해 주세요.');
    }finally{if(client)client.release();}
  });

  app.get('/api/qmes-work-dispatch/inbox',login,async(req,res)=>{
    try{
      await ensureSchema();
      const result=await pool.query(
        'SELECT d.id,d.work_order_id,d.department,d.sender_name,d.note,d.created_at,r.read_at,'+
        "COALESCE(w.document->'fields'->>'제품명','') AS product,"+
        "COALESCE(w.document->'fields'->>'생산 LOT NO','') AS lot "+
        'FROM qmes_work_order_dispatch_receipts r '+
        'JOIN qmes_work_order_dispatches d ON d.id=r.dispatch_id '+
        'LEFT JOIN qmes_work_order_documents w ON w.id=d.work_order_id '+
        'WHERE r.user_id=$1 ORDER BY d.created_at DESC LIMIT 100',
        [req.session.user.id]
      );
      ok(res,result.rows);
    }catch(e){
      console.error('[QMES work dispatch] inbox:',e.message);
      fail(res,500,'작업지시 알림을 불러오지 못했습니다.');
    }
  });

  app.post('/api/qmes-work-dispatch/inbox/:id/read',login,async(req,res)=>{
    try{
      await ensureSchema();
      if(!/^\d{1,18}$/.test(trim(req.params.id)))return fail(res,400,'알림 번호가 올바르지 않습니다.');
      const result=await pool.query(
        'UPDATE qmes_work_order_dispatch_receipts SET read_at=COALESCE(read_at,NOW()) '+
        'WHERE dispatch_id=$1 AND user_id=$2 RETURNING dispatch_id,read_at',
        [req.params.id,req.session.user.id]
      );
      if(!result.rowCount)return fail(res,404,'해당 알림을 찾을 수 없습니다.');
      ok(res,result.rows[0],'확인 처리했습니다.');
    }catch(e){fail(res,500,'수신 확인에 실패했습니다.');}
  });

  app.get('/api/qmes-work-dispatch/history/:id',login,async(req,res)=>{
    try{
      await ensureSchema();
      const id=trim(req.params.id);
      if(!/^WO-[A-Za-z0-9_-]{6,60}$/.test(id))return fail(res,400,'작업지시번호를 확인해 주세요.');
      const result=await pool.query(
        'SELECT d.id,d.department,d.sender_name,d.created_at,d.recipient_count,'+
        'COUNT(r.read_at)::int AS read_count '+
        'FROM qmes_work_order_dispatches d LEFT JOIN qmes_work_order_dispatch_receipts r ON r.dispatch_id=d.id '+
        'WHERE d.work_order_id=$1 GROUP BY d.id ORDER BY d.created_at DESC LIMIT 50',
        [id]
      );
      ok(res,result.rows);
    }catch(e){fail(res,500,'발송이력을 불러오지 못했습니다.');}
  });
}
module.exports={installWorkDispatchRoutes};
