'use strict';

// Minimal NAMO mobile attendance API.
// Installs only after the existing QMES session middleware is already attached.
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

let schemaReady = false;
let schemaPromise = null;
const ok = (res, data = null, message = 'OK') => res.json({ success:true, message, data });
const fail = (res, status, message) => res.status(status).json({ success:false, message, data:null });
const requireLogin = (req,res,next) => req.session?.user ? next() : fail(res,401,'로그인이 필요합니다.');

async function ensureSchema(){
  if(schemaReady) return;
  if(schemaPromise) return schemaPromise;
  schemaPromise = pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_logs(
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      work_date DATE NOT NULL,
      clock_in TIMESTAMPTZ,
      clock_out TIMESTAMPTZ,
      gps_in JSONB NOT NULL DEFAULT '{}'::jsonb,
      gps_out JSONB NOT NULL DEFAULT '{}'::jsonb,
      device_info TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id,work_date)
    );
    CREATE INDEX IF NOT EXISTS attendance_logs_user_date_idx
      ON attendance_logs(user_id,work_date DESC);
  `).then(()=>{schemaReady=true;}).finally(()=>{schemaPromise=null;});
  return schemaPromise;
}

function dto(r){return r?{id:r.id,workDate:r.work_date,clockIn:r.clock_in,clockOut:r.clock_out,gpsIn:r.gps_in||{},gpsOut:r.gps_out||{},deviceInfo:r.device_info||''}:null;}

function install(app){
  if(app.__namoAttendanceCoreSafeInstalled) return;
  app.__namoAttendanceCoreSafeInstalled = true;

  app.get('/api/attendance/me', requireLogin, async (req,res)=>{
    try{
      await ensureSchema();
      const u=req.session.user;
      const r=await pool.query('SELECT id,uid,name,email,department,title,role,status,must_change_password FROM users WHERE id=$1 LIMIT 1',[u.id]);
      const user=r.rows[0]||u;
      return ok(res,{user:{id:user.id,uid:user.uid||'',name:user.name,email:user.email,department:user.department||'',title:user.title||'',role:user.role,status:user.status,mustChangePassword:Boolean(user.must_change_password)},balance:{granted:15,used:0,remaining:15},passkeyCount:0,profile:{annualLeaveDays:15,mobileEnabled:true,approver1:null,approver2:null}});
    }catch(e){console.error('[Attendance core] me',e);return fail(res,500,'근태 사용자 정보를 불러오지 못했습니다.');}
  });

  app.get('/api/attendance/today', requireLogin, async (req,res)=>{
    try{
      await ensureSchema();
      const r=await pool.query(`SELECT * FROM attendance_logs WHERE user_id=$1 AND work_date=(NOW() AT TIME ZONE 'Asia/Seoul')::date LIMIT 1`,[req.session.user.id]);
      return ok(res,dto(r.rows[0]||null));
    }catch(e){console.error('[Attendance core] today',e);return fail(res,500,'오늘 근태를 불러오지 못했습니다.');}
  });

  app.get('/api/attendance/logs', requireLogin, async (req,res)=>{
    try{
      await ensureSchema();
      const month=/^\d{4}-\d{2}$/.test(String(req.query.month||''))?String(req.query.month):null;
      const r=month
        ? await pool.query(`SELECT * FROM attendance_logs WHERE user_id=$1 AND TO_CHAR(work_date,'YYYY-MM')=$2 ORDER BY work_date DESC`,[req.session.user.id,month])
        : await pool.query(`SELECT * FROM attendance_logs WHERE user_id=$1 ORDER BY work_date DESC LIMIT 100`,[req.session.user.id]);
      return ok(res,r.rows.map(dto));
    }catch(e){console.error('[Attendance core] logs',e);return fail(res,500,'근태기록을 불러오지 못했습니다.');}
  });

  app.post('/api/attendance/clock-in', requireLogin, async (req,res)=>{
    try{
      await ensureSchema();
      const gps=req.body?.gps&&typeof req.body.gps==='object'?req.body.gps:{};
      const device=String(req.body?.device||'').slice(0,500);
      const r=await pool.query(`
        INSERT INTO attendance_logs(user_id,work_date,clock_in,gps_in,device_info)
        VALUES($1,(NOW() AT TIME ZONE 'Asia/Seoul')::date,NOW(),$2::jsonb,$3)
        ON CONFLICT(user_id,work_date) DO UPDATE SET
          clock_in=COALESCE(attendance_logs.clock_in,EXCLUDED.clock_in),
          gps_in=CASE WHEN attendance_logs.clock_in IS NULL THEN EXCLUDED.gps_in ELSE attendance_logs.gps_in END,
          device_info=CASE WHEN attendance_logs.clock_in IS NULL THEN EXCLUDED.device_info ELSE attendance_logs.device_info END,
          updated_at=NOW()
        RETURNING *`,[req.session.user.id,JSON.stringify(gps),device]);
      return ok(res,dto(r.rows[0]),'출근 처리되었습니다.');
    }catch(e){console.error('[Attendance core] clock-in',e);return fail(res,500,'출근 처리에 실패했습니다.');}
  });

  app.post('/api/attendance/clock-out', requireLogin, async (req,res)=>{
    try{
      await ensureSchema();
      const gps=req.body?.gps&&typeof req.body.gps==='object'?req.body.gps:{};
      const r=await pool.query(`
        UPDATE attendance_logs SET
          clock_out=COALESCE(clock_out,NOW()),
          gps_out=CASE WHEN clock_out IS NULL THEN $2::jsonb ELSE gps_out END,
          updated_at=NOW()
        WHERE user_id=$1
          AND work_date=(NOW() AT TIME ZONE 'Asia/Seoul')::date
          AND clock_in IS NOT NULL
        RETURNING *`,[req.session.user.id,JSON.stringify(gps)]);
      if(!r.rowCount) return fail(res,400,'먼저 출근 처리를 해주세요.');
      return ok(res,dto(r.rows[0]),'퇴근 처리되었습니다.');
    }catch(e){console.error('[Attendance core] clock-out',e);return fail(res,500,'퇴근 처리에 실패했습니다.');}
  });

  // Optional calls used by the current mobile UI. Keep them harmless while core attendance is restored.
  app.get('/api/attendance/notifications', requireLogin, (_req,res)=>ok(res,[]));
  app.post('/api/attendance/notifications/read-all', requireLogin, (_req,res)=>ok(res,null,'모두 읽음 처리했습니다.'));
}

const originalGet=express.application.get;
const originalPost=express.application.post;
express.application.get=function attendanceSafeGet(routePath,...handlers){
  if(typeof routePath==='string'&&routePath.startsWith('/api/')&&!this.__namoAttendanceCoreSafeInstalled) install(this);
  return originalGet.call(this,routePath,...handlers);
};
express.application.post=function attendanceSafePost(routePath,...handlers){
  if(typeof routePath==='string'&&routePath.startsWith('/api/')&&!this.__namoAttendanceCoreSafeInstalled) install(this);
  return originalPost.call(this,routePath,...handlers);
};

module.exports={installAttendanceCoreSafe:install};
