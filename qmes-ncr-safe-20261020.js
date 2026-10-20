'use strict';
const express=require('express');
const {Pool}=require('pg');
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
 CREATE INDEX IF NOT EXISTS qmes_ncr_created_idx ON qmes_ncr_reports(id DESC);
 `).catch(e=>{schemaPromise=null;throw e;});
 return schemaPromise;
}
const bad=(res,status,message)=>res.status(status).json({success:false,message});
const str=(v,n=3000)=>String(v==null?'':v).trim().slice(0,n);
const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v);
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
    (occurred_on,source,product,lot,customer,description,containment,root_cause,corrective_action,effectiveness,owner,due_on,created_by,created_by_id)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,[
    date,source,str(b.product,200),str(b.lot,120),str(b.customer,200),description,
    str(b.containment),str(b.root_cause),str(b.corrective_action),str(b.effectiveness),
    str(b.owner,120),validDate(str(b.due_on,10))?str(b.due_on,10):null,
    str(user.name||user.email||'작성자',150),str(user.id,100)
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
   const q=await pool.query(`UPDATE qmes_ncr_reports SET status=$1,containment=$2,root_cause=$3,corrective_action=$4,effectiveness=$5,owner=$6,due_on=$7,updated_at=NOW() WHERE id=$8 RETURNING *`,[status,...values,due,id]);
   res.json({success:true,data:q.rows[0]});
  }catch(e){console.error('[NCR update]',e);bad(res,500,'NCR 수정 실패');}
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
