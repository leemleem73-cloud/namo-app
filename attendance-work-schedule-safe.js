'use strict';
const express=require('express');
const{Pool}=require('pg');
require('dotenv').config();
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});
const ok=(res,data=null,message='OK')=>res.json({success:true,message,data});
const fail=(res,status,message)=>res.status(status).json({success:false,message,data:null});
const requireLogin=(req,res,next)=>req.session?.user?next():fail(res,401,'로그인이 필요합니다.');
let ready=false;
async function ensure(){if(ready)return;await pool.query(`CREATE TABLE IF NOT EXISTS attendance_work_schedules(user_id UUID PRIMARY KEY,start_time TIME NOT NULL DEFAULT '09:00',end_time TIME NOT NULL DEFAULT '18:00',updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);ready=true}
function valid(v){return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v||''))}
function install(app){if(app.__namoAttendanceWorkScheduleInstalled)return;app.__namoAttendanceWorkScheduleInstalled=true;
app.get('/api/attendance/work-schedule',requireLogin,async(req,res)=>{try{await ensure();const q=await pool.query("SELECT TO_CHAR(start_time,'HH24:MI') start_time,TO_CHAR(end_time,'HH24:MI') end_time FROM attendance_work_schedules WHERE user_id=$1 LIMIT 1",[req.session.user.id]);const r=q.rows[0]||{start_time:'09:00',end_time:'18:00'};return ok(res,{startTime:r.start_time,endTime:r.end_time})}catch(e){console.error('[Attendance schedule get]',e);return fail(res,500,'근무시간을 불러오지 못했습니다.')}});
app.put('/api/attendance/work-schedule',requireLogin,async(req,res)=>{try{await ensure();const start=String(req.body?.startTime||'').trim(),end=String(req.body?.endTime||'').trim();if(!valid(start)||!valid(end))return fail(res,400,'근무시간 형식을 확인해주세요.');if(end<=start)return fail(res,400,'퇴근시간은 출근시간보다 늦어야 합니다.');const q=await pool.query("INSERT INTO attendance_work_schedules(user_id,start_time,end_time) VALUES($1,$2::time,$3::time) ON CONFLICT(user_id) DO UPDATE SET start_time=EXCLUDED.start_time,end_time=EXCLUDED.end_time,updated_at=NOW() RETURNING TO_CHAR(start_time,'HH24:MI') start_time,TO_CHAR(end_time,'HH24:MI') end_time",[req.session.user.id,start,end]);return ok(res,{startTime:q.rows[0].start_time,endTime:q.rows[0].end_time},'근무시간이 저장되었습니다.')}catch(e){console.error('[Attendance schedule put]',e);return fail(res,500,'근무시간 저장에 실패했습니다.')}});
}
const originalUse=express.application.use;
express.application.use=function namoScheduleUse(...args){const result=originalUse.apply(this,args);if(!this.__namoAttendanceWorkScheduleInstalled){const fns=args.flat().filter(v=>typeof v==='function');if(fns.some(fn=>fn.name==='session'||/session/i.test(String(fn.name||''))))install(this)}return result};
module.exports={installAttendanceWorkSchedule:install};
