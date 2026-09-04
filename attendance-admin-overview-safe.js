'use strict';
const express=require('express');
const fs=require('fs');
const path=require('path');
const{Pool}=require('pg');
require('dotenv').config();

const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});
const ok=(res,data=null,message='OK')=>res.json({success:true,message,data});
const fail=(res,status,message)=>res.status(status).json({success:false,message,data:null});
const requireLogin=(req,res,next)=>req.session?.user?next():fail(res,401,'로그인이 필요합니다.');
const requireAdmin=(req,res,next)=>String(req.session?.user?.role||'').toLowerCase()==='admin'?next():fail(res,403,'관리자 전용 메뉴입니다.');

function installClient(){
  try{
    const file=path.resolve(__dirname,'public','attendance.html');
    if(!fs.existsSync(file))return;
    let html=fs.readFileSync(file,'utf8');
    html=html.replace(/<script src="\/attendance-admin-overview\.js\?v=[^"]+"><\/script>/g,'');
    html=html.replace('</body>','<script src="/attendance-admin-overview.js?v=20260904-adminoverview1"></script></body>');
    fs.writeFileSync(file,html,'utf8');
    console.log('[Attendance admin overview] client installed');
  }catch(e){console.error('[Attendance admin overview] client install failed',e)}
}
installClient();

function validDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):null}
function validMonth(v){return /^\d{4}-\d{2}$/.test(String(v||''))?String(v):null}

function install(app){
  if(app.__namoAttendanceAdminOverviewInstalled)return;
  app.__namoAttendanceAdminOverviewInstalled=true;

  app.get('/api/attendance/admin/overview',requireLogin,requireAdmin,async(req,res)=>{
    try{
      const now=new Date();
      const date=validDate(req.query.date)||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
      const month=validMonth(req.query.month)||date.slice(0,7);
      const employees=await pool.query(`
        SELECT
          u.id,u.name,u.department,u.title,u.role,u.status,
          a.clock_in,a.clock_out,
          EXISTS(
            SELECT 1 FROM leave_requests lr
            WHERE lr.user_id=u.id AND lr.status='APPROVED' AND $1::date BETWEEN lr.start_date AND lr.end_date
          ) AS on_leave,
          COALESCE(ms.month_days,0)::int AS month_days,
          COALESCE(ms.month_minutes,0)::int AS month_minutes,
          COALESCE(ly.used_leave,0)::float AS used_leave
        FROM users u
        LEFT JOIN attendance_logs a ON a.user_id=u.id AND a.work_date=$1::date
        LEFT JOIN LATERAL (
          SELECT COUNT(*) FILTER (WHERE clock_in IS NOT NULL) AS month_days,
                 COALESCE(SUM(EXTRACT(EPOCH FROM (clock_out-clock_in))/60) FILTER (WHERE clock_in IS NOT NULL AND clock_out IS NOT NULL),0) AS month_minutes
          FROM attendance_logs x
          WHERE x.user_id=u.id AND TO_CHAR(x.work_date,'YYYY-MM')=$2
        ) ms ON TRUE
        LEFT JOIN LATERAL (
          SELECT COALESCE(SUM(days),0) AS used_leave
          FROM leave_requests l
          WHERE l.user_id=u.id AND l.status='APPROVED' AND EXTRACT(YEAR FROM l.start_date)=EXTRACT(YEAR FROM $1::date)
        ) ly ON TRUE
        WHERE COALESCE(u.status,'APPROVED') NOT IN ('DELETED','WITHDRAWN')
        ORDER BY COALESCE(u.department,''),u.name
      `,[date,month]);

      const rows=employees.rows.map(r=>{
        let attendanceStatus='ABSENT';
        if(r.on_leave)attendanceStatus='LEAVE';
        else if(r.clock_in&&!r.clock_out)attendanceStatus='WORKING';
        else if(r.clock_in&&r.clock_out)attendanceStatus='DONE';
        return{
          id:r.id,name:r.name||'',department:r.department||'',title:r.title||'',role:r.role||'user',
          attendanceStatus,clockIn:r.clock_in,clockOut:r.clock_out,
          monthDays:Number(r.month_days||0),monthMinutes:Number(r.month_minutes||0),
          leaveGranted:15,leaveUsed:Number(r.used_leave||0),leaveRemaining:Math.max(0,15-Number(r.used_leave||0))
        };
      });
      const summary={total:rows.length,working:rows.filter(x=>x.attendanceStatus==='WORKING').length,done:rows.filter(x=>x.attendanceStatus==='DONE').length,absent:rows.filter(x=>x.attendanceStatus==='ABSENT').length,onLeave:rows.filter(x=>x.attendanceStatus==='LEAVE').length,checkedIn:rows.filter(x=>['WORKING','DONE'].includes(x.attendanceStatus)).length};

      const leaves=await pool.query(`
        SELECT l.*,u.name employee_name,u.department employee_department,u.title employee_title
        FROM leave_requests l JOIN users u ON u.id=l.user_id
        WHERE l.start_date < (TO_DATE($1||'-01','YYYY-MM-DD') + INTERVAL '1 month')::date
          AND l.end_date >= TO_DATE($1||'-01','YYYY-MM-DD')
        ORDER BY l.start_date DESC,l.created_at DESC
        LIMIT 500
      `,[month]);
      const departments=[...new Set(rows.map(x=>x.department).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
      return ok(res,{date,month,summary,departments,employees:rows,leaves:leaves.rows});
    }catch(e){console.error('[Attendance admin overview]',e);return fail(res,500,'전체 직원 근태·연차 현황을 불러오지 못했습니다.')}
  });
}

const originalUse=express.application.use;
express.application.use=function attendanceAdminOverviewUse(...args){
  const result=originalUse.apply(this,args);
  if(!this.__namoAttendanceAdminOverviewInstalled){
    const fns=args.flat().filter(v=>typeof v==='function');
    if(fns.some(fn=>fn.name==='session'||/session/i.test(String(fn.name||'')))){
      install(this);
      console.log('[Attendance admin overview] routes installed');
    }
  }
  return result;
};
module.exports={installAttendanceAdminOverview:install};
