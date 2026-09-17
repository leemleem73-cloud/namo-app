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
let hireDateReady=false;
async function ensureHireDateColumn(){if(hireDateReady)return;await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE`);hireDateReady=true}
function validDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v).slice(0,10):null}
function validMonth(v){return /^\d{4}-\d{2}$/.test(String(v||''))?String(v):null}
function annualGranted(hireDate,asOf){if(!hireDate)return 15;const h=new Date(`${hireDate}T00:00:00+09:00`),a=new Date(`${asOf}T00:00:00+09:00`);if(Number.isNaN(h.getTime())||Number.isNaN(a.getTime())||a<h)return 0;let years=a.getFullYear()-h.getFullYear();const anniv=new Date(h);anniv.setFullYear(h.getFullYear()+years);if(a<anniv)years--;if(years<1){let months=(a.getFullYear()-h.getFullYear())*12+(a.getMonth()-h.getMonth());if(a.getDate()<h.getDate())months--;return Math.max(0,Math.min(11,months))}return Math.min(25,15+Math.floor(Math.max(0,years-1)/2))}
function installClient(){
  try{
    const file=path.resolve(__dirname,'public','attendance.html');
    if(!fs.existsSync(file))return;
    let html=fs.readFileSync(file,'utf8');
    const hireScript='<script src="/attendance-admin-hire-date-20260917.js?v=20260917-hire4"></script>';
    html=html.replace(/<script src="\/attendance-admin-hire-date-20260917\.js\?v=[^"]+"><\/script>/g,'');
    if(html.includes('data-namo-attendance-full-ui="v4"')){
      html=html.replace('</body>',`${hireScript}</body>`);
      fs.writeFileSync(file,html,'utf8');
      console.log('[Attendance admin overview] v4 hire-date annual leave client installed');
      return;
    }
    html=html
      .replace(/<script src="\/attendance-admin-overview\.js\?v=[^"]+"><\/script>/g,'')
      .replace(/<script src="\/attendance-admin-overview-table-20260907\.js\?v=[^"]+"><\/script>/g,'')
      .replace(/<script src="\/attendance-admin-v2-launcher-20260907\.js\?v=[^"]+"><\/script>/g,'')
      .replace(/<script src="\/attendance-mobile-member-sync\.js\?v=[^"]+"><\/script>/g,'');
    html=html.replace('</body>','<script src="/attendance-admin-v2-launcher-20260907.js?v=20260907-v2-force1"></script><script src="/attendance-mobile-member-sync.js?v=20260907-mobile-delete2"></script>'+hireScript+'</body>');
    fs.writeFileSync(file,html,'utf8');
    console.log('[Attendance admin overview] standalone V2 launcher installed; legacy UI preserved but disabled');
  }catch(e){console.error('[Attendance admin overview] client install failed',e)}
}
installClient();
function install(app){
  if(app.__namoAttendanceAdminOverviewInstalled)return;
  app.__namoAttendanceAdminOverviewInstalled=true;
  app.get('/api/attendance/admin/overview',requireLogin,requireAdmin,async(req,res)=>{
    try{
      await ensureHireDateColumn();
      const now=new Date();
      const date=validDate(req.query.date)||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
      const month=validMonth(req.query.month)||date.slice(0,7);
      const employees=await pool.query(`
        SELECT u.id,u.name,u.department,u.title,u.role,u.status,
          TO_CHAR(u.hire_date,'YYYY-MM-DD') AS hire_date,
          a.clock_in,a.clock_out,
          cl.leave_type AS current_leave_type,
          COALESCE(ms.month_days,0)::int AS month_days,
          COALESCE(ms.month_minutes,0)::int AS month_minutes,
          COALESCE(ly.used_leave,0)::float AS used_leave
        FROM users u
        LEFT JOIN attendance_logs a ON a.user_id=u.id AND a.work_date=$1::date
        LEFT JOIN LATERAL (
          SELECT lr.leave_type
          FROM leave_requests lr
          WHERE lr.user_id=u.id AND lr.status='APPROVED' AND $1::date BETWEEN lr.start_date AND lr.end_date
          ORDER BY lr.created_at DESC LIMIT 1
        ) cl ON TRUE
        LEFT JOIN LATERAL (
          SELECT COUNT(*) FILTER (WHERE clock_in IS NOT NULL) AS month_days,
            COALESCE(SUM(EXTRACT(EPOCH FROM (clock_out-clock_in))/60) FILTER (WHERE clock_in IS NOT NULL AND clock_out IS NOT NULL),0) AS month_minutes
          FROM attendance_logs x WHERE x.user_id=u.id AND TO_CHAR(x.work_date,'YYYY-MM')=$2
        ) ms ON TRUE
        LEFT JOIN LATERAL (
          SELECT COALESCE(SUM(days),0) AS used_leave
          FROM leave_requests l
          WHERE l.user_id=u.id AND l.status='APPROVED'
            AND l.leave_type IN ('annual','am_half','pm_half')
            AND EXTRACT(YEAR FROM l.start_date)=EXTRACT(YEAR FROM $1::date)
        ) ly ON TRUE
        WHERE COALESCE(u.status,'APPROVED') NOT IN ('DELETED','WITHDRAWN')
          AND regexp_replace(lower(COALESCE(u.title,'')),'[[:space:]]+','','g') NOT IN ('대표','대표이사','ceo','chiefexecutiveofficer')
        ORDER BY COALESCE(u.department,''),u.name
      `,[date,month]);
      const rows=employees.rows.map(r=>{
        let attendanceStatus='ABSENT';
        if(r.current_leave_type==='statutory')attendanceStatus='STATUTORY';
        else if(r.current_leave_type)attendanceStatus='LEAVE';
        else if(r.clock_in&&!r.clock_out)attendanceStatus='WORKING';
        else if(r.clock_in&&r.clock_out)attendanceStatus='DONE';
        const hireDate=validDate(r.hire_date)||'';
        const granted=annualGranted(hireDate,date),used=Number(r.used_leave||0);
        return{id:r.id,name:r.name||'',department:r.department||'',title:r.title||'',role:r.role||'user',attendanceStatus,currentLeaveType:r.current_leave_type||'',clockIn:r.clock_in,clockOut:r.clock_out,monthDays:Number(r.month_days||0),monthMinutes:Number(r.month_minutes||0),hireDate,leaveGranted:granted,leaveUsed:used,leaveRemaining:Math.max(0,granted-used)};
      });
      const monthly=await pool.query(`
        SELECT TO_CHAR(a.work_date,'YYYY-MM-DD') AS work_date,
          u.id AS user_id,u.name,u.department,u.title,
          a.clock_in,a.clock_out,
          CASE WHEN a.clock_in IS NOT NULL AND a.clock_out IS NOT NULL
            THEN GREATEST(0,ROUND(EXTRACT(EPOCH FROM (a.clock_out-a.clock_in))/60)::int)
            ELSE 0 END AS work_minutes
        FROM attendance_logs a
        JOIN users u ON u.id=a.user_id
        WHERE TO_CHAR(a.work_date,'YYYY-MM')=$1
          AND COALESCE(u.status,'APPROVED') NOT IN ('DELETED','WITHDRAWN')
          AND regexp_replace(lower(COALESCE(u.title,'')),'[[:space:]]+','','g') NOT IN ('대표','대표이사','ceo','chiefexecutiveofficer')
        ORDER BY a.work_date DESC,COALESCE(u.department,''),u.name
      `,[month]);
      const monthlyLogs=monthly.rows.map(r=>({workDate:r.work_date,userId:r.user_id,name:r.name||'',department:r.department||'',title:r.title||'',clockIn:r.clock_in,clockOut:r.clock_out,workMinutes:Number(r.work_minutes||0),status:r.clock_in?(r.clock_out?'DONE':'WORKING'):'ABSENT'}));
      const summary={total:rows.length,working:rows.filter(x=>x.attendanceStatus==='WORKING').length,done:rows.filter(x=>x.attendanceStatus==='DONE').length,absent:rows.filter(x=>x.attendanceStatus==='ABSENT').length,onLeave:rows.filter(x=>x.attendanceStatus==='LEAVE').length,statutory:rows.filter(x=>x.attendanceStatus==='STATUTORY').length,checkedIn:rows.filter(x=>['WORKING','DONE'].includes(x.attendanceStatus)).length};
      const leaves=await pool.query(`SELECT l.*,u.name employee_name,u.department employee_department,u.title employee_title FROM leave_requests l JOIN users u ON u.id=l.user_id WHERE l.start_date < (TO_DATE($1||'-01','YYYY-MM-DD') + INTERVAL '1 month')::date AND l.end_date >= TO_DATE($1||'-01','YYYY-MM-DD') AND regexp_replace(lower(COALESCE(u.title,'')),'[[:space:]]+','','g') NOT IN ('대표','대표이사','ceo','chiefexecutiveofficer') ORDER BY l.start_date DESC,l.created_at DESC LIMIT 500`,[month]);
      const departments=[...new Set(rows.map(x=>x.department).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
      return ok(res,{date,month,summary,departments,employees:rows,monthlyLogs,leaves:leaves.rows});
    }catch(e){console.error('[Attendance admin overview]',e);return fail(res,500,'전체 직원 근태·연차 현황을 불러오지 못했습니다.');}
  });
  app.put('/api/attendance/admin/users/:id/hire-date',requireLogin,requireAdmin,async(req,res)=>{
    try{
      await ensureHireDateColumn();
      const raw=String(req.body?.hireDate||'').trim();
      const hireDate=raw?validDate(raw):null;
      if(raw&&!hireDate)return fail(res,400,'입사일 형식을 확인해주세요.');
      const asOf=validDate(req.body?.asOfDate)||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
      const q=await pool.query(`UPDATE users SET hire_date=$1::date WHERE id=$2 RETURNING id,name,TO_CHAR(hire_date,'YYYY-MM-DD') AS hire_date`,[hireDate,req.params.id]);
      if(!q.rows[0])return fail(res,404,'직원을 찾을 수 없습니다.');
      const stored=validDate(q.rows[0].hire_date)||'';
      return ok(res,{id:q.rows[0].id,name:q.rows[0].name,hireDate:stored,leaveGranted:annualGranted(stored,asOf)},'입사일이 저장되었습니다.');
    }catch(e){console.error('[Attendance hire date]',e);return fail(res,500,'입사일 저장에 실패했습니다.');}
  });
}
const originalUse=express.application.use;
express.application.use=function attendanceAdminOverviewUse(...args){const result=originalUse.apply(this,args);if(!this.__namoAttendanceAdminOverviewInstalled){const fns=args.flat().filter(v=>typeof v==='function');if(fns.some(fn=>fn.name==='session'||/session/i.test(String(fn.name||'')))){install(this);console.log('[Attendance admin overview] routes installed')}}return result};
module.exports={installAttendanceAdminOverview:install};
