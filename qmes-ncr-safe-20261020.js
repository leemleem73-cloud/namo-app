'use strict';
const express=require('express');
const {Pool}=require('pg');
const multer=require('multer');
require('dotenv').config();
let pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});
let schemaPromise;
function schema(){
 if(!schemaPromise)schemaPromise=pool.query(`
 CREATE TABLE IF NOT EXISTS qmes_ncr_reports(
 id BIGSERIAL PRIMARY KEY, report_no TEXT UNIQUE,
 occurred_on DATE NOT NULL, source TEXT NOT NULL, product TEXT NOT NULL DEFAULT '',
 lot TEXT NOT NULL DEFAULT '', customer TEXT NOT NULL DEFAULT '',
 description TEXT NOT NULL, containment TEXT NOT NULL DEFAULT '',
 root_cause TEXT NOT NULL DEFAULT '', corrective_action TEXT NOT NULL DEFAULT '',
 effectiveness TEXT NOT NULL DEFAULT '', owner TEXT NOT NULL DEFAULT '',
 due_on DATE, status TEXT NOT NULL DEFAULT 'OPEN',
 created_by TEXT NOT NULL DEFAULT '', created_by_id TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
 ALTER TABLE qmes_ncr_reports ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;
 CREATE TABLE IF NOT EXISTS qmes_ncr_attachments (id BIGSERIAL PRIMARY KEY,report_id BIGINT NOT NULL REFERENCES qmes_ncr_reports(id) ON DELETE CASCADE,file_name TEXT NOT NULL,mime_type TEXT NOT NULL,file_size INTEGER NOT NULL,content BYTEA NOT NULL,uploaded_by TEXT NOT NULL DEFAULT '',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
 CREATE INDEX IF NOT EXISTS qmes_ncr_attach_report_idx ON qmes_ncr_attachments(report_id,id DESC);
 ALTER TABLE qmes_ncr_reports ADD COLUMN IF NOT EXISTS reviewed_by TEXT NOT NULL DEFAULT '';
 ALTER TABLE qmes_ncr_reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
 ALTER TABLE qmes_ncr_reports ADD COLUMN IF NOT EXISTS approved_by TEXT NOT NULL DEFAULT '';
 ALTER TABLE qmes_ncr_reports ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
 ALTER TABLE IF EXISTS nonconform ADD COLUMN IF NOT EXISTS qmes_details JSONB NOT NULL DEFAULT '{}'::jsonb;
 ALTER TABLE IF EXISTS nonconform ADD COLUMN IF NOT EXISTS qmes_updated_at TIMESTAMPTZ;
 CREATE INDEX IF NOT EXISTS qmes_ncr_created_idx ON qmes_ncr_reports(id DESC);
 `).catch(e=>{schemaPromise=null;throw e;});
 return schemaPromise;
}
const bad=(res,status,message)=>res.status(status).json({success:false,message});
const str=(v,n=3000)=>String(v==null?'':v).trim().slice(0,n);
const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v);
const ncrUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1}});
const allowedMime=new Set(['application/pdf','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','text/csv','application/vnd.ms-excel','application/msword']);
const detailKeys=['reporter','department','process','work_order','specification','actual_result','inspected_qty','affected_qty','severity','isolation_location','disposition','disposition_approved_by','cause_method','action_owner','action_completed_on','verification_method','verification_date','verification_result','verified_by','closure_approved_by','closed_on','repeat_issue','related_lots','customer_notified','improvement_completed','before_condition','after_condition','improvement_comparison','inspection_record_id','inspection_stage','auto_created'];
function cleanDetails(input){const out={};if(input&&typeof input==='object'&&!Array.isArray(input))for(const k of detailKeys)if(Object.prototype.hasOwnProperty.call(input,k))out[k]=str(input[k],1500);return out;}

function validUuidLike(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||'').trim());}
function normalizeDateOnly(value){
 if(!value)return '';
 const raw=String(value).trim();
 const iso=raw.match(/(\d{4})-(\d{2})-(\d{2})/);
 if(iso)return iso[1]+'-'+iso[2]+'-'+iso[3];
 if(value instanceof Date&&!Number.isNaN(value.getTime())){
  const y=value.getUTCFullYear(),m=String(value.getUTCMonth()+1).padStart(2,'0'),d=String(value.getUTCDate()).padStart(2,'0');
  return y+'-'+m+'-'+d;
 }
 return '';
}
async function autoCreateNcr(input={}){
 const source=str(input.source,30),date=normalizeDateOnly(input.occurred_on),recordId=str(input.inspection_record_id,240);
 if(!['IQC','PQC','OQC'].includes(source)||!validDate(date)||!recordId){
  console.warn('[AUTO NCR SKIP]',JSON.stringify({source,date,recordId}));
  return null;
 }

 const safeId=recordId.replace(/[^A-Za-z0-9]/g,'').slice(-12)||String(Date.now());
 const ncNo='NCR-'+date.replace(/-/g,'')+'-'+source+'-'+safeId;

 const existing=await pool.query("SELECT * FROM nonconform WHERE nc_no=$1 ORDER BY created_at DESC LIMIT 1",[ncNo]);
 if(existing.rowCount)return existing.rows[0];

 const details=input.details||{};
 const q=await pool.query(`INSERT INTO nonconform
  (date,type,lot,item,issue,cause,action,owner,status,nc_no,dept,qty,severity,priority,capa_status,containment,impact_scope,correction,preventive_action,verification_result,progress)
  VALUES($1,$2,$3,$4,$5,'','',$6,'OPEN',$7,$8,$9,$10,$11,'OPEN',$12,$13,'','', '',0)
  RETURNING *`,[
   date,
   source,
   str(input.lot,120),
   str(input.product,200),
   str(input.description)||source+' 검사 불합격 자동 발생',
   str(input.owner,120),
   ncNo,
   str(details.department||details.dept||'',120),
   Number(details.affected_qty||0)||0,
   str(details.severity||'중',40),
   str(details.priority||'높음',40),
   str(input.containment)||'해당 LOT 보류 및 후속 공정/출하 차단',
   str(details.process||source,200)
  ]);
 console.log('[AUTO NCR NONCONFORM]',JSON.stringify({source,nc_no:ncNo,id:q.rows[0]?.id}));
 try{
  const approval=require('./qmes-quality-approval-safe.js');
  if(typeof approval.ensureGenericApproval==='function'){
   await approval.ensureGenericApproval({
    docType:'NCR',
    recordId:String(q.rows[0]?.id||''),
    title:'부적합 NCR 검토·승인 · '+ncNo+' / LOT '+(q.rows[0]?.lot||'-'),
    page:'ncr',
    writerUserId:validUuidLike(input.created_by_id)?String(input.created_by_id):null,
    writerName:str(input.created_by||input.owner||'QMES 자동생성',150)
   });
  }
 }catch(error){console.error('[AUTO NCR CENTRAL APPROVAL]',error);}
 return q.rows[0];
}

let failedInspectionBackfillPromise=null;
async function backfillFailedSyncInspections(){
 if(failedInspectionBackfillPromise)return failedInspectionBackfillPromise;
 failedInspectionBackfillPromise=(async()=>{
  let created=0,failed=0;
  try{
   const result=await pool.query(`
    SELECT record_type,record_key,payload,updated_at
    FROM qmes_sync_records
    WHERE record_type IN ('pqc','oqc')
    ORDER BY updated_at DESC
    LIMIT 3000`);
   const seen=new Set();
   for(const source of result.rows){
    const payload=source.payload||{};
    const rows=Array.isArray(payload.rows)?payload.rows:[];
    if(source.record_type==='pqc'){
     for(const row of rows){
      if(String(row?.judge||row?.detailFields?.['검사합부']||'').trim()!=='불합격')continue;
      failed++;
      const inspectionId='PQC:'+String(source.record_key)+':'+String(row?.id||row?.lot||'');
      if(seen.has(inspectionId))continue; seen.add(inspectionId);
      const before=await pool.query("SELECT id FROM nonconform WHERE nc_no=$1 LIMIT 1",[
       'NCR-'+String(row?.date||'').slice(0,10).replace(/-/g,'')+'-PQC-'+inspectionId.replace(/[^A-Za-z0-9]/g,'').slice(-12)
      ]).catch(()=>({rowCount:0}));
      const ncr=await autoCreateNcr({
       source:'PQC',
       occurred_on:String(row?.date||'').slice(0,10),
       lot:row?.lot||'',
       product:row?.product||row?.detailFields?.['제품명']||'',
       description:'PQC 공정검사 불합격 자동 발생',
       containment:'해당 생산 LOT 보류 및 후속 공정 차단',
       owner:row?.inspector||'',
       created_by:row?.inspector||'QMES 자동생성',
       created_by_id:'SYSTEM',
       inspection_record_id:inspectionId,
       details:{process:'공정검사',work_order:row?.workOrderNo||'',actual_result:'불합격',reporter:row?.inspector||''}
      });
      if(ncr&&!before.rowCount)created++;
     }
    }else if(source.record_type==='oqc'){
     const failedRows=rows.filter(row=>String(row?.judge||row?.result||'').trim()==='불합격');
     if(!failedRows.length)continue;
     failed++;
     const sample=failedRows[0]||rows[0]||{};
     const lot=sample?.lot||payload?.lotNo||'';
     const inspectionId='OQC:'+String(source.record_key)+':'+String(lot||'');
     if(seen.has(inspectionId))continue; seen.add(inspectionId);
     const before=await pool.query("SELECT id FROM nonconform WHERE nc_no=$1 LIMIT 1",[
      'NCR-'+String(sample?.date||sample?.shipDate||'').slice(0,10).replace(/-/g,'')+'-OQC-'+inspectionId.replace(/[^A-Za-z0-9]/g,'').slice(-12)
     ]).catch(()=>({rowCount:0}));
     const ncr=await autoCreateNcr({
      source:'OQC',
      occurred_on:String(sample?.date||sample?.shipDate||'').slice(0,10),
      lot,
      product:sample?.product||'',
      customer:sample?.customer||'',
      description:'OQC 출하검사 불합격 자동 발생',
      containment:'해당 완제품 LOT 출하보류 및 출하 차단',
      owner:sample?.inspector||'',
      created_by:sample?.inspector||'QMES 자동생성',
      created_by_id:'SYSTEM',
      inspection_record_id:inspectionId,
      details:{process:'출하검사',actual_result:'불합격',reporter:sample?.inspector||''}
     });
     if(ncr&&!before.rowCount)created++;
    }
   }
   console.log('[AUTO NCR PQC/OQC BACKFILL]',JSON.stringify({failed,created}));
  }catch(e){
   console.error('[AUTO NCR PQC/OQC BACKFILL]',e);
   failedInspectionBackfillPromise=null;
  }
  return {failed,created};
 })();
 return failedInspectionBackfillPromise;
}

function legacyReport(r){return {
    id:r.id,
    report_no:r.nc_no||'',
    occurred_on:r.date,
    source:r.type||'',
    product:r.item||'',
    lot:r.lot||'',
    customer:'',
    description:r.issue||'',
    containment:r.containment||'',
    root_cause:r.cause||'',
    corrective_action:r.action||'',
    effectiveness:r.verification_result||'',
    owner:r.owner||'',
    due_on:r.due_date||null,
    status:r.capa_status||r.status||'OPEN',
    created_by:'',
    created_by_id:'',
    created_at:r.created_at,
    updated_at:r.qmes_updated_at||r.created_at,
    reviewed_by:r.sign_reviewer?.name||'',
    reviewed_at:r.sign_reviewer?.at||null,
    approved_by:r.sign_approver?.name||'',
    approved_at:r.sign_approver?.at||null,
    details:{
      department:r.dept||'',
      affected_qty:r.qty||0,
      severity:r.severity||'',
      process:r.type||'',
      actual_result:'불합격',
      ...r.qmes_details,
      auto_created:(r.nc_no||'').startsWith('NCR-')?'Y':''
    }
};}
const uuidReportId=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
function install(app,options={}){
 if(options.pool)pool=options.pool;
 if(app.__qmesNcrInstalled)return;
 app.__qmesNcrInstalled=true;
 const auth=(req,res,next)=>req.session?.user?next():bad(res,401,'로그인이 필요합니다.');

 // Fail-safe IQC -> NCR bridge.
 // Runs before the legacy /api/iqc route and observes its successful JSON response,
 // so automatic NCR creation works even if another IQC handler is registered first.
 app.use((req,res,next)=>{
  const isCreate=req.method==='POST'&&req.path==='/api/iqc';
  const isUpdate=req.method==='PUT'&&/^\/api\/iqc\/[^/]+$/.test(req.path);
  if(!isCreate&&!isUpdate)return next();
  const originalJson=res.json.bind(res);
  res.json=function(payload){
   try{
    const row=payload?.data||payload;
    const postedJudge=String(req.body?.judge||req.body?.result||'').trim();
    const itemJudges=Array.isArray(req.body?.items)?req.body.items.map(item=>String(item?.judge||item?.result||item?.value||'').trim()):[];
    const failed=String(row?.judge||'').trim()==='불합격'||postedJudge==='불합격'||itemJudges.some(v=>v==='불합격'||v==='부적합'||v==='NG'||v==='FAIL');
    if(res.statusCode<400&&failed&&(row?.id||isUpdate)){
     const user=req.session?.user||{};
     autoCreateNcr({
      source:'IQC',
      occurred_on:String(row.date||req.body?.date||'').slice(0,10),
      lot:row.lot||req.body?.lot||'',
      product:row.item||req.body?.item||'',
      customer:row.supplier||req.body?.supplier||'',
      description:'IQC 수입검사 불합격 자동 발생',
      containment:'해당 원료 LOT 보류 및 후속 공정 투입 차단',
      owner:str(user.name||user.email||'',120),
      created_by:str(user.name||user.email||'QMES 자동생성',150),
      created_by_id:str(user.id||'SYSTEM',100),
      inspection_record_id:'IQC:'+String(row?.id||req.params?.id||req.path.split('/').pop()),
      details:{
       process:'수입검사',
       actual_result:'불합격',
       affected_qty:String(row.incoming_qty||row.qty||req.body?.incomingQty||''),
       reporter:str(user.name||user.email||'',120)
      }
     }).catch(e=>console.error('[AUTO NCR IQC BRIDGE]',e));
    }
   }catch(e){console.error('[AUTO NCR IQC BRIDGE]',e);}
   return originalJson(payload);
  };
  next();
 });

 // Backfill any existing failed IQC records that predate the bridge.
 // Safe to run repeatedly because autoCreateNcr de-duplicates by inspection_record_id.
 (async()=>{
  try{
   await schema();
   const candidates=await pool.query("SELECT id,date,lot,item,supplier,incoming_qty,qty,inspector,judge,items_json FROM iqc ORDER BY id DESC LIMIT 500");
   let created=0,failedCount=0;
   for(const row of candidates.rows){
    let items=row.items_json;
    if(typeof items==='string'){try{items=JSON.parse(items)}catch(_){items=[]}}
    if(!Array.isArray(items))items=[];
    const values=[row.judge];
    for(const item of items){
      values.push(item?.judge,item?.result,item?.status,item?.value);
      if(Array.isArray(item?.values))values.push(...item.values);
      if(Array.isArray(item?.measurements))values.push(...item.measurements);
    }
    const failed=values.map(v=>String(v??'').trim().toUpperCase()).some(v=>v.includes('불합격')||v.includes('부적합')||v.includes('미확인')||v==='NG'||v==='FAIL');
    if(!failed)continue;
    failedCount++;
    const before=await pool.query("SELECT id FROM qmes_ncr_reports WHERE source='IQC' AND details->>'inspection_record_id'=$1 LIMIT 1",['IQC:'+String(row.id)]);
    await autoCreateNcr({
     source:'IQC',
     occurred_on:String(row.date||'').slice(0,10),
     lot:row.lot,
     product:row.item,
     customer:row.supplier,
     description:'IQC 수입검사 불합격 자동 발생',
     containment:'해당 원료 LOT 보류 및 후속 공정 투입 차단',
     owner:row.inspector||'',
     created_by:row.inspector||'QMES 자동생성',
     created_by_id:'SYSTEM',
     inspection_record_id:'IQC:'+String(row.id),
     details:{process:'수입검사',actual_result:'불합격',affected_qty:String(row.incoming_qty||row.qty||''),reporter:row.inspector||''}
    });
    if(!before.rowCount)created++;
   }
   console.log('[AUTO NCR IQC BACKFILL]',JSON.stringify({candidates:candidates.rows.length,failed:failedCount,created}));
  }catch(e){console.error('[AUTO NCR IQC BACKFILL]',e);}
 })();

 app.get('/api/qmes-ncr/reports',auth,async(req,res)=>{
  try{
   await schema();
   await backfillFailedSyncInspections();
   const q=await pool.query(`SELECT * FROM nonconform ORDER BY created_at DESC LIMIT 500`);
   const reports=await pool.query('SELECT * FROM qmes_ncr_reports ORDER BY created_at DESC LIMIT 500');
   const rows=q.rows.map(legacyReport).concat(reports.rows)
     .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,500);
   console.log('[NCR list/nonconform]',JSON.stringify({count:rows.length}));
   res.set('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');
   res.set('Pragma','no-cache');
   res.json({success:true,data:rows});
  }catch(e){
   console.error('[NCR list/nonconform]',e);
   bad(res,500,'NCR 목록 조회 실패');
  }
 });
 app.post('/api/qmes-ncr/reports',auth,async(req,res)=>{
  const b=req.body||{},date=str(b.occurred_on,10),source=str(b.source,30),description=str(b.description);
  if(!validDate(date)||!['IQC','PQC','OQC','생산','고객','기타'].includes(source)||!description)return bad(res,400,'발생일자·구분·부적합 내용을 입력하세요.');
  try{
   await schema();
   const user=req.session.user;
   const q=await pool.query(`INSERT INTO qmes_ncr_reports
    (occurred_on,source,product,lot,customer,description,containment,root_cause,corrective_action,effectiveness,owner,due_on,created_by,created_by_id,details)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,[
    date,source,str(b.product,200),str(b.lot,120),str(b.customer,200),description,
    str(b.containment),str(b.root_cause),str(b.corrective_action),str(b.effectiveness),
    str(b.owner,120),validDate(str(b.due_on,10))?str(b.due_on,10):null,
    str(user.name||user.email||'작성자',150),str(user.id,100),JSON.stringify(cleanDetails(b.details))
   ]);
   const row=q.rows[0],no='NCR-'+date.replace(/-/g,'')+'-'+String(row.id).padStart(3,'0');
   const saved=await pool.query('UPDATE qmes_ncr_reports SET report_no=$1 WHERE id=$2 RETURNING *',[no,row.id]);
   try{
    const approval=require('./qmes-quality-approval-safe.js');
    if(typeof approval.ensureGenericApproval==='function'){
      await approval.ensureGenericApproval({
        docType:'NCR',
        recordId:String(saved.rows[0].id),
        title:'부적합 NCR 검토·승인 · '+(saved.rows[0].report_no||'NCR')+' / LOT '+(saved.rows[0].lot||'-'),
        page:'ncr',
        writerUserId:user.id||null,
        writerName:user.name||user.email||'작성자'
      });
    }
   }catch(error){console.error('[NCR central approval link]',error);}
   res.status(201).json({success:true,data:saved.rows[0]});
  }catch(e){console.error('[NCR create]',e);bad(res,500,'NCR 저장 실패');}
 });
 app.patch('/api/qmes-ncr/reports/:id',auth,async(req,res)=>{
  const rawId=req.params.id,legacy=uuidReportId(rawId),id=Number(rawId),b=req.body||{},status=str(b.status,30);
  if((!legacy&&(!Number.isSafeInteger(id)||id<1))||!['OPEN','IN_PROGRESS','CLOSED'].includes(status))return bad(res,400,'처리상태를 확인하세요.');
  try{
   await schema();
   if(legacy){
    const due=b.due_on===undefined?null:(validDate(str(b.due_on,10))?str(b.due_on,10):null);
    const fields=['containment','root_cause','corrective_action','effectiveness','owner'];
    const values=fields.map(key=>b[key]===undefined?null:str(b[key],key==='owner'?120:3000));
    const q=await pool.query(`UPDATE nonconform SET status=$1,capa_status=$1,
      containment=coalesce($2,containment),cause=coalesce($3,cause),action=coalesce($4,action),
      verification_result=coalesce($5,verification_result),owner=coalesce($6,owner),
      due_date=CASE WHEN $7 THEN $8::date ELSE due_date END,qmes_details=qmes_details||$9::jsonb,qmes_updated_at=now()
      WHERE id=$10::uuid AND ($1<>'CLOSED' OR coalesce(nullif(capa_status,''),status)='CLOSED'
        OR nullif(sign_approver->>'at','') IS NOT NULL) RETURNING *`,
    [status,...values,b.due_on!==undefined,due,JSON.stringify(cleanDetails(b.details)),rawId]);
    if(!q.rowCount){
     const exists=await pool.query('SELECT 1 FROM nonconform WHERE id=$1::uuid',[rawId]);
     return exists.rowCount?bad(res,409,'검토 및 최종 승인 후 완료 처리할 수 있습니다.'):bad(res,404,'NCR을 찾을 수 없습니다.');
    }
    return res.json({success:true,data:legacyReport(q.rows[0])});
   }
   const current=await pool.query('SELECT * FROM qmes_ncr_reports WHERE id=$1',[id]);
   if(!current.rowCount)return bad(res,404,'NCR을 찾을 수 없습니다.');
   const old=current.rows[0];
   const fields=['containment','root_cause','corrective_action','effectiveness','owner'];
   const values=fields.map(k=>b[k]===undefined?old[k]:str(b[k],k==='owner'?120:3000));
   const due=b.due_on===undefined?old.due_on:(validDate(str(b.due_on,10))?str(b.due_on,10):null);
   const details=b.details===undefined?(old.details||{}):Object.assign({},old.details||{},cleanDetails(b.details));
   const q=await pool.query(`UPDATE qmes_ncr_reports SET status=$1,containment=$2,root_cause=$3,corrective_action=$4,effectiveness=$5,owner=$6,due_on=$7,details=$9,updated_at=NOW() WHERE id=$8 RETURNING *`,[status,...values,due,id,JSON.stringify(details)]);
   res.json({success:true,data:q.rows[0]});
  }catch(e){console.error('[NCR update]',e);bad(res,500,'NCR 수정 실패');}
 });


 app.get('/api/qmes-ncr/reports/:id/attachments',auth,async(req,res)=>{
  const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return bad(res,400,'잘못된 문서번호입니다.');
  try{await schema();const q=await pool.query('SELECT id,report_id,file_name,mime_type,file_size,uploaded_by,created_at FROM qmes_ncr_attachments WHERE report_id=$1 ORDER BY id DESC',[id]);res.json({success:true,data:q.rows});}
  catch(e){console.error('[NCR attachments]',e);bad(res,500,'첨부파일 조회 실패');}
 });
 app.post('/api/qmes-ncr/reports/:id/attachments',auth,(req,res)=>{
  ncrUpload.single('file')(req,res,async err=>{
   if(err)return bad(res,400,err.code==='LIMIT_FILE_SIZE'?'파일은 10MB 이하만 등록할 수 있습니다.':'첨부파일 업로드 실패');
   const id=Number(req.params.id),f=req.file;
   if(!Number.isSafeInteger(id)||id<1||!f)return bad(res,400,'첨부파일을 선택하세요.');
   if(!allowedMime.has(f.mimetype))return bad(res,400,'PDF, 이미지, Word, Excel, CSV, TXT 파일만 등록할 수 있습니다.');
   try{await schema();const exists=await pool.query('SELECT id FROM qmes_ncr_reports WHERE id=$1',[id]);if(!exists.rowCount)return bad(res,404,'부적합보고서를 찾을 수 없습니다.');
    const count=await pool.query('SELECT COUNT(*)::int AS n FROM qmes_ncr_attachments WHERE report_id=$1',[id]);if(count.rows[0].n>=10)return bad(res,400,'보고서당 최대 10개까지 첨부할 수 있습니다.');
    const u=req.session.user||{};const q=await pool.query('INSERT INTO qmes_ncr_attachments(report_id,file_name,mime_type,file_size,content,uploaded_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,report_id,file_name,mime_type,file_size,uploaded_by,created_at',[id,str(f.originalname,240),f.mimetype,f.size,f.buffer,str(u.name||u.email||'',120)]);
    res.status(201).json({success:true,data:q.rows[0]});
   }catch(e){console.error('[NCR attachment upload]',e);bad(res,500,'첨부파일 저장 실패');}
  });
 });
 app.get('/api/qmes-ncr/attachments/:id/download',auth,async(req,res)=>{
  const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return bad(res,400,'잘못된 첨부파일입니다.');
  try{await schema();const q=await pool.query('SELECT file_name,mime_type,content FROM qmes_ncr_attachments WHERE id=$1',[id]);if(!q.rowCount)return bad(res,404,'첨부파일을 찾을 수 없습니다.');
   const f=q.rows[0];res.setHeader('Content-Type',f.mime_type);res.setHeader('Content-Disposition',"attachment; filename*=UTF-8''"+encodeURIComponent(f.file_name));res.setHeader('X-Content-Type-Options','nosniff');res.send(f.content);
  }catch(e){console.error('[NCR attachment download]',e);bad(res,500,'첨부파일 다운로드 실패');}
 });
 app.delete('/api/qmes-ncr/attachments/:id',auth,async(req,res)=>{
  const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return bad(res,400,'잘못된 첨부파일입니다.');
  try{await schema();const u=req.session.user||{},isAdmin=String(u.role||'').toLowerCase()==='admin'||String(u.role||'')==='관리자';
   const q=await pool.query('SELECT a.id,r.created_by_id FROM qmes_ncr_attachments a JOIN qmes_ncr_reports r ON r.id=a.report_id WHERE a.id=$1',[id]);
   if(!q.rowCount)return bad(res,404,'첨부파일을 찾을 수 없습니다.');
   if(!isAdmin&&String(q.rows[0].created_by_id)!==String(u.id))return bad(res,403,'작성자 또는 관리자만 삭제할 수 있습니다.');
   await pool.query('DELETE FROM qmes_ncr_attachments WHERE id=$1',[id]);res.json({success:true,data:{id}});
  }catch(e){console.error('[NCR attachment delete]',e);bad(res,500,'첨부파일 삭제 실패');}
 });

 app.post('/api/qmes-ncr/reports/:id/sign',auth,async(req,res)=>{
  const rawId=req.params.id,legacy=uuidReportId(rawId),id=Number(rawId),action=str(req.body?.action,20),u=req.session.user||{};
  if((!legacy&&(!Number.isSafeInteger(id)||id<1))||!['review','approve'].includes(action))return bad(res,400,'잘못된 결재 요청입니다.');
  const role=String(u.role||'').toLowerCase(),title=String(u.title||u.position||'');
  const allowed=role==='admin'||role==='관리자'||['부장','이사','상무','전무','부사장','대표이사','대표','사장','회장'].some(v=>title.includes(v));
  if(!allowed)return bad(res,403,'검토 및 승인 권한은 이사 이상 또는 관리자에게 있습니다.');
  try{
   await schema();
   const name=str(u.name||u.email||'담당자',120);
   if(legacy){
    const column=action==='review'?'sign_reviewer':'sign_approver';
    const reviewerRequired=action==='approve'?"AND nullif(sign_reviewer->>'at','') IS NOT NULL":"";
    const q=await pool.query(`UPDATE nonconform SET ${column}=jsonb_build_object('name',$1::text,'userId',$2::text,'at',now()),qmes_updated_at=now()
     WHERE id=$3::uuid AND nullif(sign_approver->>'at','') IS NULL ${reviewerRequired} RETURNING *`,[name,str(u.id,100),rawId]);
    if(!q.rowCount)return bad(res,409,'문서 상태와 검토·승인 이력을 확인하세요.');
    return res.json({success:true,data:legacyReport(q.rows[0])});
   }
   const q=action==='review'
    ?await pool.query("UPDATE qmes_ncr_reports SET reviewed_by=$1,reviewed_at=NOW(),approved_by='',approved_at=NULL,updated_at=NOW() WHERE id=$2 AND approved_at IS NULL RETURNING *",[name,id])
    :await pool.query("UPDATE qmes_ncr_reports SET approved_by=$1,approved_at=NOW(),updated_at=NOW() WHERE id=$2 AND reviewed_at IS NOT NULL AND approved_at IS NULL RETURNING *",[name,id]);
   if(!q.rowCount)return bad(res,409,action==='review'?'이미 승인된 문서이거나 존재하지 않습니다.':'검토 완료 후 승인할 수 있습니다.');
   res.json({success:true,data:q.rows[0]});
  }catch(e){console.error('[NCR signature]',e);bad(res,500,'전자결재 처리 실패');}
 });
 app.delete('/api/qmes-ncr/reports/:id',auth,async(req,res)=>{
  const rawId=req.params.id;
  const legacyId=uuidReportId(rawId);
  const id=Number(rawId);
  if(!legacyId&&(!Number.isSafeInteger(id)||id<1))return bad(res,400,'문서번호가 올바르지 않습니다.');
  try{
   await schema();
   const u=req.session.user||{};
   // Always re-check the current DB account because session role/title may be stale.
   const account=await pool.query('SELECT role,status,department,title FROM users WHERE id::text=$1',[str(u.id,100)]);
   const current=account.rows[0]||{};
   const currentRole=str(current.role,30).toLowerCase();
   const currentDept=str(current.department,60);
   const currentTitle=str(current.title,60);
   const isAdmin=['admin','관리자'].includes(currentRole);
   const isQualitySenior=currentDept==='품질부'&&['부장','이사','상무','전무','부사장','대표이사','대표','사장','회장'].includes(currentTitle);
   const canDelete=current.status==='APPROVED'&&(isAdmin||isQualitySenior);
   if(legacyId){
    if(!canDelete){
     return bad(res,403,'NCR 삭제는 승인된 관리자 또는 품질부 부장 이상만 가능합니다.');
    }
    const removed=await pool.query(`WITH removed AS (
      DELETE FROM nonconform WHERE id=$1::uuid RETURNING *
    )
    INSERT INTO qmes_lot_gate_events(action,lot,actor,detail)
    SELECT 'NCR_DELETE',coalesce(lot,''),$2,jsonb_build_object('userId',$3::text,'report',to_jsonb(removed))
    FROM removed RETURNING id`,[rawId,str(u.name||u.id,150),str(u.id,100)]);
    if(!removed.rowCount)return bad(res,404,'NCR을 찾을 수 없습니다.');
    return res.json({success:true,data:{id:rawId}});
   }
   const result=await pool.query('SELECT id,created_by_id FROM qmes_ncr_reports WHERE id=$1',[id]);
   if(!result.rowCount)return bad(res,404,'NCR을 찾을 수 없습니다.');
   if(!canDelete&&String(result.rows[0].created_by_id)!==String(u.id))return bad(res,403,'작성자 또는 승인된 관리자·품질부 부장 이상만 삭제할 수 있습니다.');
   await pool.query('DELETE FROM qmes_ncr_reports WHERE id=$1',[id]);
   res.json({success:true,data:{id}});
  }catch(e){console.error('[NCR delete]',e);bad(res,500,'NCR 삭제 실패');}
 });

}
module.exports={install,autoCreateNcr};
