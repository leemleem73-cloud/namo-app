'use strict';
const express=require('express');
const fs=require('fs');
const path=require('path');
const{Pool}=require('pg');
require('dotenv').config();

const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});
const DEFAULT_APPROVER_NAME='임흥배';
let schemaReady=false,schemaPromise=null;
const ok=(res,data=null,message='OK')=>res.json({success:true,message,data});
const fail=(res,status,message)=>res.status(status).json({success:false,message,data:null});
const requireLogin=(req,res,next)=>req.session?.user?next():fail(res,401,'로그인이 필요합니다.');
const isAdmin=req=>String(req.session?.user?.role||'').toLowerCase()==='admin';

function patchAttendanceHtml(){
  try{
    const file=path.resolve(__dirname,'public','attendance.html');
    if(!fs.existsSync(file))return;
    let html=fs.readFileSync(file,'utf8');
    if(!html.includes('/attendance-correction.js')){
      html=html.replace('</body>','<script src="/attendance-correction.js?v=20260904-correction1"></script></body>');
      fs.writeFileSync(file,html,'utf8');
      console.log('[Attendance correction] client script installed');
    }
  }catch(e){console.error('[Attendance correction] HTML patch failed',e)}
}
patchAttendanceHtml();

async function ensureSchema(){
  if(schemaReady)return;
  if(schemaPromise)return schemaPromise;
  schemaPromise=pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_corrections(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      work_date DATE NOT NULL,
      original_clock_in TIMESTAMPTZ,
      original_clock_out TIMESTAMPTZ,
      requested_clock_in TIME,
      requested_clock_out TIME,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      approver_id UUID,
      reject_reason TEXT DEFAULT '',
      approved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS attendance_corrections_user_idx ON attendance_corrections(user_id,created_at DESC);
    CREATE INDEX IF NOT EXISTS attendance_corrections_status_idx ON attendance_corrections(status,created_at ASC);
  `).then(()=>{schemaReady=true}).finally(()=>{schemaPromise=null});
  return schemaPromise;
}
async function approver(){
  const q=await pool.query("SELECT id,name,title,role FROM users WHERE name=$1 ORDER BY CASE WHEN title='부장' THEN 0 ELSE 1 END LIMIT 1",[DEFAULT_APPROVER_NAME]);
  return q.rows[0]||null;
}
function isApproverSession(req,a){const u=req.session?.user||{};return isAdmin(req)||(a&&((u.id&&String(u.id)===String(a.id))||String(u.name||'').trim()===DEFAULT_APPROVER_NAME));}
async function notify(userId,title,message){
  if(!userId)return;
  try{await pool.query('INSERT INTO attendance_notifications(user_id,title,message) VALUES($1,$2,$3)',[userId,title,message])}catch(_e){}
}
function install(app){
  if(app.__namoAttendanceCorrectionInstalled)return;
  app.__namoAttendanceCorrectionInstalled=true;

  app.get('/api/attendance/corrections',requireLogin,async(req,res)=>{
    try{await ensureSchema();const q=await pool.query('SELECT * FROM attendance_corrections WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[req.session.user.id]);return ok(res,q.rows)}catch(e){console.error(e);return fail(res,500,'근태 수정요청을 불러오지 못했습니다.')}
  });

  app.post('/api/attendance/corrections',requireLogin,async(req,res)=>{
    try{
      await ensureSchema();
      const workDate=String(req.body?.workDate||'').trim();
      const requestedClockIn=String(req.body?.requestedClockIn||'').trim()||null;
      const requestedClockOut=String(req.body?.requestedClockOut||'').trim()||null;
      const reason=String(req.body?.reason||'').trim();
      if(!/^\d{4}-\d{2}-\d{2}$/.test(workDate))return fail(res,400,'수정할 근무일을 선택해주세요.');
      if(!requestedClockIn&&!requestedClockOut)return fail(res,400,'수정할 출근 또는 퇴근 시간을 입력해주세요.');
      if(!reason)return fail(res,400,'수정 사유를 입력해주세요.');
      const log=await pool.query('SELECT * FROM attendance_logs WHERE user_id=$1 AND work_date=$2::date LIMIT 1',[req.session.user.id,workDate]);
      if(!log.rowCount)return fail(res,404,'해당 날짜의 출퇴근 기록이 없습니다.');
      const a=await approver();if(!a)return fail(res,500,'임흥배 부장 승인자 계정을 찾을 수 없습니다.');
      const pending=await pool.query("SELECT id FROM attendance_corrections WHERE user_id=$1 AND work_date=$2::date AND status='PENDING' LIMIT 1",[req.session.user.id,workDate]);
      if(pending.rowCount)return fail(res,409,'해당 날짜는 이미 수정 승인 대기 중입니다.');
      const row=log.rows[0];
      const q=await pool.query(`INSERT INTO attendance_corrections(user_id,work_date,original_clock_in,original_clock_out,requested_clock_in,requested_clock_out,reason,status,approver_id)
        VALUES($1,$2::date,$3,$4,$5::time,$6::time,$7,'PENDING',$8) RETURNING *`,[req.session.user.id,workDate,row.clock_in,row.clock_out,requestedClockIn,requestedClockOut,reason.slice(0,1000),a.id]);
      await notify(a.id,'근태 수정 승인 요청',`${req.session.user.name||'직원'}님이 ${workDate} 근태 수정을 요청했습니다.`);
      return ok(res,q.rows[0],'근태 수정 요청이 임흥배 부장 승인함으로 전달되었습니다.');
    }catch(e){console.error('[Attendance correction] request',e);return fail(res,500,'근태 수정 요청에 실패했습니다.')}
  });

  app.get('/api/attendance/correction-approvals',requireLogin,async(req,res)=>{
    try{await ensureSchema();const a=await approver();if(!isApproverSession(req,a))return ok(res,[]);const q=await pool.query(`SELECT c.*,u.name employee_name,u.department employee_department,u.title employee_title FROM attendance_corrections c JOIN users u ON u.id=c.user_id WHERE c.status='PENDING' ORDER BY c.created_at ASC`);return ok(res,q.rows)}catch(e){console.error(e);return fail(res,500,'근태 수정 승인대기를 불러오지 못했습니다.')}
  });

  app.post('/api/attendance/corrections/:id/approve',requireLogin,async(req,res)=>{
    const client=await pool.connect();
    try{
      await ensureSchema();const a=await approver();if(!isApproverSession(req,a))return fail(res,403,'근태 수정 승인 권한이 없습니다.');
      await client.query('BEGIN');
      const cur=await client.query("SELECT * FROM attendance_corrections WHERE id=$1 AND status='PENDING' FOR UPDATE",[req.params.id]);
      if(!cur.rowCount){await client.query('ROLLBACK');return fail(res,404,'승인할 수정 요청이 없습니다.');}
      const c=cur.rows[0];
      const upd=await client.query(`UPDATE attendance_logs SET
        clock_in=CASE WHEN $3::time IS NULL THEN clock_in ELSE (work_date + $3::time) AT TIME ZONE 'Asia/Seoul' END,
        clock_out=CASE WHEN $4::time IS NULL THEN clock_out ELSE (work_date + $4::time) AT TIME ZONE 'Asia/Seoul' END,
        updated_at=NOW()
        WHERE user_id=$1 AND work_date=$2 RETURNING *`,[c.user_id,c.work_date,c.requested_clock_in,c.requested_clock_out]);
      if(!upd.rowCount){await client.query('ROLLBACK');return fail(res,404,'수정할 근태 기록을 찾을 수 없습니다.');}
      const done=await client.query("UPDATE attendance_corrections SET status='APPROVED',approved_at=NOW(),updated_at=NOW() WHERE id=$1 RETURNING *",[c.id]);
      await client.query('COMMIT');
      await notify(c.user_id,'근태 수정 승인 완료',`${String(c.work_date).slice(0,10)} 근태 수정이 승인되어 반영되었습니다.`);
      return ok(res,done.rows[0],'근태 수정이 승인되어 실제 기록에 반영되었습니다.');
    }catch(e){try{await client.query('ROLLBACK')}catch(_e){}console.error('[Attendance correction] approve',e);return fail(res,500,'근태 수정 승인에 실패했습니다.')}finally{client.release()}
  });

  app.post('/api/attendance/corrections/:id/reject',requireLogin,async(req,res)=>{
    try{await ensureSchema();const a=await approver();if(!isApproverSession(req,a))return fail(res,403,'근태 수정 반려 권한이 없습니다.');const reason=String(req.body?.reason||'').trim();if(!reason)return fail(res,400,'반려 사유를 입력해주세요.');const q=await pool.query("UPDATE attendance_corrections SET status='REJECTED',reject_reason=$2,updated_at=NOW() WHERE id=$1 AND status='PENDING' RETURNING *",[req.params.id,reason.slice(0,1000)]);if(!q.rowCount)return fail(res,404,'반려할 수정 요청이 없습니다.');await notify(q.rows[0].user_id,'근태 수정 반려',`근태 수정 요청이 반려되었습니다. 사유: ${reason}`);return ok(res,q.rows[0],'근태 수정 요청을 반려했습니다.')}catch(e){return fail(res,500,'근태 수정 반려에 실패했습니다.')}
  });
}

const originalUse=express.application.use;
express.application.use=function attendanceCorrectionUse(...args){const result=originalUse.apply(this,args);if(!this.__namoAttendanceCorrectionInstalled){const fns=args.flat().filter(v=>typeof v==='function');if(fns.some(fn=>fn.name==='session'||/session/i.test(String(fn.name||'')))){install(this);console.log('[Attendance correction] routes installed')}}return result};
module.exports={installAttendanceCorrection:install};
