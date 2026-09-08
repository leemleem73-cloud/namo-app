'use strict';
const express=require('express');
const{Pool}=require('pg');
require('dotenv').config();
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});
const ok=(res,data=null,message='OK')=>res.json({success:true,message,data});
const fail=(res,status,message)=>res.status(status).json({success:false,message,data:null});
const requireLogin=(req,res,next)=>req.session?.user?next():fail(res,401,'로그인이 필요합니다.');
const WORKPLACES={
  chungju:{code:'chungju',name:'충주 1공장',address:'충청북도 주덕읍 중원산업로 309'},
  pangyo:{code:'pangyo',name:'판교사무소',address:'경기도 성남시 분당구 대왕판교로 606번지 39 판교럭스타워 11층'}
};
let schemaReady=false;
async function ensureSchema(){if(schemaReady)return;await pool.query("ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS workplace_code TEXT DEFAULT ''; ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS workplace_name TEXT DEFAULT ''; ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS workplace_address TEXT DEFAULT ''; ");schemaReady=true}
function wp(v){return WORKPLACES[String(v||'')]||null}
function dto(r){return r?{id:r.id,workDate:r.work_date,clockIn:r.clock_in,clockOut:r.clock_out,gpsIn:r.gps_in||{},gpsOut:r.gps_out||{},deviceInfo:r.device_info||'',workplaceCode:r.workplace_code||'',workplaceName:r.workplace_name||'',workplaceAddress:r.workplace_address||''}:null}
function install(app){
  if(app.__namoAttendanceWorkplaceInstalled)return;
  app.__namoAttendanceWorkplaceInstalled=true;
  app.get('/api/attendance/workplaces',requireLogin,(_req,res)=>ok(res,Object.values(WORKPLACES)));
  app.get('/api/attendance/today-v2',requireLogin,async(req,res)=>{try{await ensureSchema();const q=await pool.query("SELECT * FROM attendance_logs WHERE user_id=$1 AND work_date=(NOW() AT TIME ZONE 'Asia/Seoul')::date LIMIT 1",[req.session.user.id]);return ok(res,dto(q.rows[0]||null))}catch(e){console.error('[Attendance workplace today]',e);return fail(res,500,'오늘 근태를 불러오지 못했습니다.')}});
  app.post('/api/attendance/clock-in-v2',requireLogin,async(req,res)=>{try{await ensureSchema();const place=wp(req.body?.workplaceCode);if(!place)return fail(res,400,'출근 근무지를 선택해주세요.');const gps=req.body?.gps&&typeof req.body.gps==='object'?req.body.gps:{},device=String(req.body?.device||'').slice(0,500);const q=await pool.query("INSERT INTO attendance_logs(user_id,work_date,clock_in,gps_in,device_info,workplace_code,workplace_name,workplace_address) VALUES($1,(NOW() AT TIME ZONE 'Asia/Seoul')::date,NOW(),$2::jsonb,$3,$4,$5,$6) ON CONFLICT(user_id,work_date) DO UPDATE SET clock_in=COALESCE(attendance_logs.clock_in,EXCLUDED.clock_in),gps_in=CASE WHEN attendance_logs.clock_in IS NULL THEN EXCLUDED.gps_in ELSE attendance_logs.gps_in END,device_info=CASE WHEN attendance_logs.clock_in IS NULL THEN EXCLUDED.device_info ELSE attendance_logs.device_info END,workplace_code=CASE WHEN attendance_logs.clock_in IS NULL THEN EXCLUDED.workplace_code ELSE attendance_logs.workplace_code END,workplace_name=CASE WHEN attendance_logs.clock_in IS NULL THEN EXCLUDED.workplace_name ELSE attendance_logs.workplace_name END,workplace_address=CASE WHEN attendance_logs.clock_in IS NULL THEN EXCLUDED.workplace_address ELSE attendance_logs.workplace_address END,updated_at=NOW() RETURNING *",[req.session.user.id,JSON.stringify(gps),device,place.code,place.name,place.address]);return ok(res,dto(q.rows[0]),`${place.name} 출근 처리되었습니다.`)}catch(e){console.error('[Attendance workplace clock-in]',e);return fail(res,500,'출근 처리에 실패했습니다.')}});
  app.post('/api/attendance/clock-out-v2',requireLogin,async(req,res)=>{try{await ensureSchema();const gps=req.body?.gps&&typeof req.body.gps==='object'?req.body.gps:{};const q=await pool.query("UPDATE attendance_logs SET clock_out=COALESCE(clock_out,NOW()),gps_out=CASE WHEN clock_out IS NULL THEN $2::jsonb ELSE gps_out END,updated_at=NOW() WHERE user_id=$1 AND work_date=(NOW() AT TIME ZONE 'Asia/Seoul')::date AND clock_in IS NOT NULL RETURNING *",[req.session.user.id,JSON.stringify(gps)]);if(!q.rowCount)return fail(res,400,'먼저 출근 처리를 해주세요.');return ok(res,dto(q.rows[0]),'퇴근 처리되었습니다.')}catch(e){console.error('[Attendance workplace clock-out]',e);return fail(res,500,'퇴근 처리에 실패했습니다.')}});
}
const originalUse=express.application.use;
express.application.use=function attendanceWorkplaceUse(...args){const result=originalUse.apply(this,args);if(!this.__namoAttendanceWorkplaceInstalled){const fns=args.flat().filter(v=>typeof v==='function');if(fns.some(fn=>fn.name==='session'||/session/i.test(String(fn.name||'')))){install(this);console.log('[Attendance workplace] workplace routes installed')}}return result};
module.exports={installAttendanceWorkplace:install};
