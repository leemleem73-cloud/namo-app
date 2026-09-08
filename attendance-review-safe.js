'use strict';
const express=require('express');
const{Pool}=require('pg');
require('dotenv').config();
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});
const ok=(res,data=null,message='OK')=>res.json({success:true,message,data});
const fail=(res,status,message)=>res.status(status).json({success:false,message,data:null});
const requireLogin=(req,res,next)=>req.session?.user?next():fail(res,401,'로그인이 필요합니다.');
const isAdmin=req=>String(req.session?.user?.role||'').toLowerCase()==='admin';
let schemaReady=false;
async function ensureSchema(){
  if(schemaReady)return;
  await pool.query(`
    ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reviewed_by_user_id UUID;
    ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
    ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS mail_recipients JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS mail_sent_at TIMESTAMPTZ;
  `);
  schemaReady=true;
}
function activeStatus(v){return !['REJECTED','INACTIVE','DISABLED','DELETED','WITHDRAWN'].includes(String(v||'').toUpperCase())}
function roleLevel(u){
  const t=`${u?.title||''} ${u?.role||''}`.replace(/\s/g,'').toLowerCase();
  if(/대표이사|대표|사장|회장|ceo/.test(t))return 4;
  if(/전무|상무|이사|임원|cto|coo|cfo|chief/.test(t)&&!/대표이사/.test(t))return 3;
  if(/부장|본부장|실장|센터장|팀장/.test(t))return 2;
  return 1;
}
async function userById(id){if(!id)return null;const q=await pool.query('SELECT id,name,email,department,title,role,status FROM users WHERE id=$1 LIMIT 1',[id]);return q.rows[0]||null}
async function balance(userId){
  const y=new Date().getFullYear();
  const q=await pool.query("SELECT COALESCE(SUM(days),0)::float used FROM leave_requests WHERE user_id=$1 AND status='APPROVED' AND leave_type IN ('annual','am_half','pm_half') AND EXTRACT(YEAR FROM start_date)=$2",[userId,y]);
  const used=Number(q.rows[0]?.used||0);return{granted:15,used,remaining:Math.max(0,15-used)};
}
async function notify(userId,title,message,target='approval'){
  if(!userId)return;
  try{await pool.query('INSERT INTO attendance_notifications(user_id,title,message,target) VALUES($1,$2,$3,$4)',[userId,title,String(message||'').slice(0,1000),target])}catch(e){console.error('[Attendance review notify]',e)}
}
async function reviewerList(excludeId=''){
  const q=await pool.query("SELECT id,name,email,department,title,role,status FROM users WHERE COALESCE(status,'APPROVED') NOT IN ('REJECTED','INACTIVE','DISABLED','DELETED','WITHDRAWN') ORDER BY name");
  const all=q.rows.filter(u=>String(u.id)!==String(excludeId)&&activeStatus(u.status));
  const executives=all.filter(u=>roleLevel(u)===3).slice(0,3);
  const managers=all.filter(u=>roleLevel(u)===2).slice(0,1);
  return[...executives,...managers];
}
function install(app){
  if(app.__namoAttendanceReviewSafeInstalled)return;
  app.__namoAttendanceReviewSafeInstalled=true;
  app.get('/api/attendance/reviewers',requireLogin,async(req,res)=>{
    try{await ensureSchema();return ok(res,await reviewerList(req.session.user.id));}catch(e){console.error('[Attendance reviewers]',e);return fail(res,500,'검토자 목록을 불러오지 못했습니다.');}
  });
  app.get('/api/attendance/directory',requireLogin,async(req,res)=>{
    try{
      await ensureSchema();const dept=String(req.query.department||'').trim();
      const args=[];let where="COALESCE(status,'APPROVED') NOT IN ('REJECTED','INACTIVE','DISABLED','DELETED','WITHDRAWN')";
      if(dept){args.push(dept);where+=` AND department=$${args.length}`}
      const q=await pool.query(`SELECT id,name,email,department,title,role,status FROM users WHERE ${where} ORDER BY department,name`,args);
      return ok(res,q.rows);
    }catch(e){console.error('[Attendance directory]',e);return fail(res,500,'직원등록현황을 불러오지 못했습니다.');}
  });
  app.post('/api/attendance/leave-v2',requireLogin,async(req,res)=>{
    try{
      await ensureSchema();
      const{leaveType='annual',startDate,endDate,days,reason='',handover='',reviewerId=''}=req.body||{};
      const n=Number(days);if(!startDate||!endDate||!Number.isFinite(n)||n<=0)return fail(res,400,'휴가 신청 정보를 확인해주세요.');
      const reviewer=await userById(reviewerId);if(!reviewer||!activeStatus(reviewer.status)||![2,3].includes(roleLevel(reviewer)))return fail(res,400,'선택한 검토자를 확인해주세요.');
      if(String(reviewer.id)===String(req.session.user.id))return fail(res,400,'본인은 자신의 검토자가 될 수 없습니다.');
      if(['annual','am_half','pm_half'].includes(String(leaveType))){const b=await balance(req.session.user.id);if(n>b.remaining)return fail(res,400,'잔여 연차가 부족합니다.');}
      const q=await pool.query("INSERT INTO leave_requests(user_id,leave_type,start_date,end_date,days,reason,handover,status,approver1_user_id,approver2_user_id) VALUES($1,$2,$3,$4,$5,$6,$7,'PENDING_1',$8,$8) RETURNING *",[req.session.user.id,leaveType,startDate,endDate,n,String(reason).slice(0,1000),String(handover).slice(0,1000),reviewer.id]);
      await notify(reviewer.id,'근태 검토 요청',`${req.session.user.name||'직원'}님이 ${startDate} 휴가/근태 검토를 요청했습니다.`,'approval');
      return ok(res,{...q.rows[0],reviewer:{id:reviewer.id,name:reviewer.name,email:reviewer.email,title:reviewer.title,department:reviewer.department}},'검토 요청이 전달되었습니다.');
    }catch(e){console.error('[Attendance leave-v2]',e);return fail(res,500,'검토 요청 등록에 실패했습니다.');}
  });
  app.get('/api/attendance/reviews-v2',requireLogin,async(req,res)=>{
    try{
      await ensureSchema();const uid=req.session.user.id;
      const base=`SELECT l.*,u.name employee_name,u.email employee_email,u.department employee_department,u.title employee_title,r.name reviewer_name,r.email reviewer_email,r.department reviewer_department,r.title reviewer_title FROM leave_requests l JOIN users u ON u.id=l.user_id LEFT JOIN users r ON r.id=l.approver1_user_id WHERE l.status IN ('PENDING_1','PENDING_2')`;
      const q=isAdmin(req)?await pool.query(base+' ORDER BY l.created_at ASC'):await pool.query(base+' AND l.approver1_user_id=$1 ORDER BY l.created_at ASC',[uid]);
      return ok(res,q.rows);
    }catch(e){console.error('[Attendance reviews-v2]',e);return fail(res,500,'검토 대기 목록을 불러오지 못했습니다.');}
  });
  app.post('/api/attendance/leave/:id/review-complete-v2',requireLogin,async(req,res)=>{
    try{
      await ensureSchema();const cur=await pool.query('SELECT * FROM leave_requests WHERE id=$1 LIMIT 1',[req.params.id]);if(!cur.rowCount)return fail(res,404,'검토할 신청을 찾을 수 없습니다.');
      const row=cur.rows[0];if(!isAdmin(req)&&String(row.approver1_user_id||'')!==String(req.session.user.id))return fail(res,403,'지정된 검토자만 검토 완료할 수 있습니다.');
      const q=await pool.query("UPDATE leave_requests SET status='APPROVED',reviewed_by_user_id=$2,reviewed_at=NOW(),updated_at=NOW() WHERE id=$1 AND status IN ('PENDING_1','PENDING_2') RETURNING *",[req.params.id,req.session.user.id]);if(!q.rowCount)return fail(res,409,'이미 처리된 요청입니다.');
      await notify(q.rows[0].user_id,'근태 요청 승인 완료','검토가 완료되어 자동 승인 처리되었습니다.','leave');
      return ok(res,q.rows[0],'검토 완료 · 자동 승인되었습니다.');
    }catch(e){console.error('[Attendance review complete]',e);return fail(res,500,'검토 완료 처리에 실패했습니다.');}
  });
  app.post('/api/attendance/leave/:id/reject-v2',requireLogin,async(req,res)=>{
    try{
      await ensureSchema();const reason=String(req.body?.reason||'').trim();if(!reason)return fail(res,400,'반려 사유를 입력해주세요.');
      const cur=await pool.query('SELECT * FROM leave_requests WHERE id=$1 LIMIT 1',[req.params.id]);if(!cur.rowCount)return fail(res,404,'반려할 신청을 찾을 수 없습니다.');
      const row=cur.rows[0];if(!isAdmin(req)&&String(row.approver1_user_id||'')!==String(req.session.user.id))return fail(res,403,'지정된 검토자만 반려할 수 있습니다.');
      const q=await pool.query("UPDATE leave_requests SET status='REJECTED',reject_reason=$2,reviewed_by_user_id=$3,reviewed_at=NOW(),updated_at=NOW() WHERE id=$1 AND status IN ('PENDING_1','PENDING_2') RETURNING *",[req.params.id,reason.slice(0,1000),req.session.user.id]);if(!q.rowCount)return fail(res,409,'이미 처리된 요청입니다.');
      await notify(q.rows[0].user_id,'근태 요청 반려',`신청이 반려되었습니다. 사유: ${reason}`,'leave');return ok(res,q.rows[0],'반려 처리되었습니다.');
    }catch(e){console.error('[Attendance reject-v2]',e);return fail(res,500,'반려 처리에 실패했습니다.');}
  });
  app.post('/api/attendance/leave/:id/mail-log',requireLogin,async(req,res)=>{
    try{
      await ensureSchema();const recipients=Array.isArray(req.body?.recipients)?req.body.recipients.slice(0,100):[];
      const q=await pool.query("UPDATE leave_requests SET mail_recipients=$2::jsonb,mail_sent_at=NOW(),updated_at=NOW() WHERE id=$1 AND status='APPROVED' RETURNING id,mail_recipients,mail_sent_at",[req.params.id,JSON.stringify(recipients)]);if(!q.rowCount)return fail(res,404,'승인완료 요청을 찾을 수 없습니다.');return ok(res,q.rows[0],'메일 수신자 이력을 저장했습니다.');
    }catch(e){console.error('[Attendance mail log]',e);return fail(res,500,'메일 수신자 이력을 저장하지 못했습니다.');}
  });
}
const originalUse=express.application.use;
express.application.use=function attendanceReviewSafeUse(...args){const result=originalUse.apply(this,args);if(!this.__namoAttendanceReviewSafeInstalled){const fns=args.flat().filter(v=>typeof v==='function');if(fns.some(fn=>fn.name==='session'||/session/i.test(String(fn.name||'')))){install(this);console.log('[Attendance review] reviewer/auto-approve routes installed')}}return result};
module.exports={installAttendanceReviewSafe:install};
