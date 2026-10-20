'use strict';
const express=require('express');
const {Pool}=require('pg');
const multer=require('multer');
require('dotenv').config();
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});
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
 CREATE INDEX IF NOT EXISTS qmes_ncr_created_idx ON qmes_ncr_reports(id DESC);
 `).catch(e=>{schemaPromise=null;throw e;});
 return schemaPromise;
}
const bad=(res,status,message)=>res.status(status).json({success:false,message});
const str=(v,n=3000)=>String(v==null?'':v).trim().slice(0,n);
const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v);
const ncrUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1}});
const allowedMime=new Set(['application/pdf','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','text/csv','application/vnd.ms-excel','application/msword']);
const detailKeys=['reporter','department','process','work_order','specification','actual_result','inspected_qty','affected_qty','severity','isolation_location','disposition','disposition_approved_by','cause_method','action_owner','action_completed_on','verification_method','verification_date','verification_result','verified_by','closure_approved_by','closed_on','repeat_issue','related_lots','customer_notified'];
function cleanDetails(input){const out={};if(input&&typeof input==='object'&&!Array.isArray(input))for(const k of detailKeys)if(Object.prototype.hasOwnProperty.call(input,k))out[k]=str(input[k],1500);return out;}
function install(app){
 if(app.__qmesNcrInstalled)return;
 app.__qmesNcrInstalled=true;
 const auth=(req,res,next)=>req.session?.user?next():bad(res,401,'로그인이 필요합니다.');
 app.get('/api/qmes-ncr/reports',auth,async(req,res)=>{
  try{await schema();const q=await pool.query('SELECT * FROM qmes_ncr_reports ORDER BY id DESC LIMIT 500');res.json({success:true,data:q.rows});}
  catch(e){console.error('[NCR list]',e);bad(res,500,'NCR 목록 조회 실패');}
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
   res.status(201).json({success:true,data:saved.rows[0]});
  }catch(e){console.error('[NCR create]',e);bad(res,500,'NCR 저장 실패');}
 });
 app.patch('/api/qmes-ncr/reports/:id',auth,async(req,res)=>{
  const id=Number(req.params.id),b=req.body||{},status=str(b.status,30);
  if(!Number.isSafeInteger(id)||id<1||!['OPEN','IN_PROGRESS','CLOSED'].includes(status))return bad(res,400,'처리상태를 확인하세요.');
  try{
   await schema();
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
  const id=Number(req.params.id),action=str(req.body?.action,20),u=req.session.user||{};
  if(!Number.isSafeInteger(id)||id<1||!['review','approve'].includes(action))return bad(res,400,'잘못된 결재 요청입니다.');
  const role=String(u.role||'').toLowerCase(),title=String(u.title||u.position||'');
  const allowed=role==='admin'||role==='관리자'||['이사','상무','전무','부사장','대표이사','대표','사장','회장'].some(v=>title.includes(v));
  if(!allowed)return bad(res,403,'검토 및 승인 권한은 이사 이상 또는 관리자에게 있습니다.');
  try{
   await schema();
   const name=str(u.name||u.email||'담당자',120);
   const q=action==='review'
    ?await pool.query("UPDATE qmes_ncr_reports SET reviewed_by=$1,reviewed_at=NOW(),approved_by='',approved_at=NULL,updated_at=NOW() WHERE id=$2 AND approved_at IS NULL RETURNING *",[name,id])
    :await pool.query("UPDATE qmes_ncr_reports SET approved_by=$1,approved_at=NOW(),updated_at=NOW() WHERE id=$2 AND reviewed_at IS NOT NULL AND approved_at IS NULL RETURNING *",[name,id]);
   if(!q.rowCount)return bad(res,409,action==='review'?'이미 승인된 문서이거나 존재하지 않습니다.':'검토 완료 후 승인할 수 있습니다.');
   res.json({success:true,data:q.rows[0]});
  }catch(e){console.error('[NCR signature]',e);bad(res,500,'전자결재 처리 실패');}
 });
 app.delete('/api/qmes-ncr/reports/:id',auth,async(req,res)=>{
  const id=Number(req.params.id);
  if(!Number.isSafeInteger(id)||id<1)return bad(res,400,'문서번호가 올바르지 않습니다.');
  try{
   await schema();
   const u=req.session.user||{};
   const isAdmin=String(u.role||'').toLowerCase()==='admin'||String(u.role||'')==='관리자';
   const result=await pool.query('SELECT id,created_by_id FROM qmes_ncr_reports WHERE id=$1',[id]);
   if(!result.rowCount)return bad(res,404,'NCR을 찾을 수 없습니다.');
   if(!isAdmin&&String(result.rows[0].created_by_id)!==String(u.id))return bad(res,403,'작성자 또는 관리자만 삭제할 수 있습니다.');
   await pool.query('DELETE FROM qmes_ncr_reports WHERE id=$1',[id]);
   res.json({success:true,data:{id}});
  }catch(e){console.error('[NCR delete]',e);bad(res,500,'NCR 삭제 실패');}
 });

}
const originalUse=express.application.use;
express.application.use=function ncrUse(...args){
 const out=originalUse.apply(this,args);
 if(!this.__qmesNcrInstalled){
  const fns=args.flat().filter(x=>typeof x==='function');
  if(fns.some(fn=>fn.name==='session'||/session/i.test(fn.name||'')))install(this);
 }
 return out;
};
module.exports={install};
