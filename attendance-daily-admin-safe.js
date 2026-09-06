'use strict';
const express=require('express');
const{Pool}=require('pg');
require('dotenv').config();

const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});
let schemaPromise=null;
const ok=(res,data=null,message='OK')=>res.json({success:true,message,data});
const fail=(res,status,message)=>res.status(status).json({success:false,message,data:null});
const requireLogin=(req,res,next)=>req.session?.user?next():fail(res,401,'로그인이 필요합니다.');
const requireAdmin=(req,res,next)=>String(req.session?.user?.role||'').toLowerCase()==='admin'?next():fail(res,403,'관리자 권한이 필요합니다.');
const dateOk=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''));
const timeOk=v=>v===''||/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v||''));
const isCeoTitle=v=>/^(대표|대표이사|ceo|chiefexecutiveofficer)$/i.test(String(v||'').replace(/\s+/g,''));

async function ensureSchema(){
  if(schemaPromise)return schemaPromise;
  schemaPromise=pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_admin_adjustments(
      id BIGSERIAL PRIMARY KEY,
      user_id UUID NOT NULL,
      work_date DATE NOT NULL,
      original_clock_in TIMESTAMPTZ,
      original_clock_out TIMESTAMPTZ,
      new_clock_in TIMESTAMPTZ,
      new_clock_out TIMESTAMPTZ,
      reason TEXT NOT NULL,
      editor_id UUID,
      editor_name TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS attendance_admin_adjustments_user_date_idx
      ON attendance_admin_adjustments(user_id,work_date,created_at DESC);
  `).finally(()=>{schemaPromise=null});
  return schemaPromise;
}

function install(app){
  if(app.__namoDailyAttendanceAdminInstalled)return;
  app.__namoDailyAttendanceAdminInstalled=true;

  app.get('/api/attendance/admin/daily',requireLogin,requireAdmin,async(req,res)=>{
    try{
      await ensureSchema();
      const date=dateOk(req.query.date)?String(req.query.date):new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
      const q=await pool.query(`
        SELECT
          u.id,u.name,u.department,u.title,u.role,u.status,
          a.clock_in,a.clock_out,a.updated_at AS attendance_updated_at,
          l.leave_type,l.days AS leave_days,l.status AS leave_status,
          COALESCE(c.pending_count,0)::int AS correction_pending,
          COALESCE(m.month_days,0)::int AS month_days,
          COALESCE(m.month_minutes,0)::int AS month_minutes
        FROM users u
        LEFT JOIN attendance_logs a ON a.user_id=u.id AND a.work_date=$1::date
        LEFT JOIN LATERAL (
          SELECT lr.leave_type,lr.days,lr.status
          FROM leave_requests lr
          WHERE lr.user_id=u.id AND lr.status='APPROVED'
            AND $1::date BETWEEN lr.start_date AND lr.end_date
          ORDER BY lr.created_at DESC LIMIT 1
        ) l ON TRUE
        LEFT JOIN LATERAL (
          SELECT COUNT(*) AS pending_count
          FROM attendance_corrections ac
          WHERE ac.user_id=u.id AND ac.work_date=$1::date AND ac.status='PENDING'
        ) c ON TRUE
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*) FILTER(WHERE x.clock_in IS NOT NULL) AS month_days,
            COALESCE(SUM(EXTRACT(EPOCH FROM (x.clock_out-x.clock_in))/60)
              FILTER(WHERE x.clock_in IS NOT NULL AND x.clock_out IS NOT NULL),0) AS month_minutes
          FROM attendance_logs x
          WHERE x.user_id=u.id AND TO_CHAR(x.work_date,'YYYY-MM')=LEFT($1,7)
        ) m ON TRUE
        WHERE COALESCE(u.status,'APPROVED') NOT IN ('DELETED','WITHDRAWN')
          AND regexp_replace(lower(COALESCE(u.title,'')),'[[:space:]]+','','g')
            NOT IN ('대표','대표이사','ceo','chiefexecutiveofficer')
        ORDER BY COALESCE(u.department,''),u.name
      `,[date]);
      const rows=q.rows.map(r=>({
        id:r.id,name:r.name||'',department:r.department||'',title:r.title||'',role:r.role||'user',
        clockIn:r.clock_in,clockOut:r.clock_out,attendanceUpdatedAt:r.attendance_updated_at,
        leaveType:r.leave_type||'',leaveDays:Number(r.leave_days||0),leaveStatus:r.leave_status||'',
        correctionPending:Number(r.correction_pending||0),monthDays:Number(r.month_days||0),monthMinutes:Number(r.month_minutes||0)
      }));
      return ok(res,{date,rows});
    }catch(e){console.error('[Daily attendance admin] list',e);return fail(res,500,'일 근무관리 현황을 불러오지 못했습니다.');}
  });

  app.get('/api/attendance/admin/daily/:userId/:date/history',requireLogin,requireAdmin,async(req,res)=>{
    try{
      await ensureSchema();
      if(!dateOk(req.params.date))return fail(res,400,'근무일을 확인해주세요.');
      const q=await pool.query(`SELECT id,original_clock_in,original_clock_out,new_clock_in,new_clock_out,reason,editor_name,created_at
        FROM attendance_admin_adjustments WHERE user_id=$1 AND work_date=$2::date ORDER BY created_at DESC LIMIT 50`,[req.params.userId,req.params.date]);
      return ok(res,q.rows);
    }catch(e){console.error('[Daily attendance admin] history',e);return fail(res,500,'수정 이력을 불러오지 못했습니다.');}
  });

  app.put('/api/attendance/admin/daily/:userId/:date',requireLogin,requireAdmin,async(req,res)=>{
    const client=await pool.connect();
    try{
      await ensureSchema();
      const userId=String(req.params.userId||'');
      const date=String(req.params.date||'');
      const clockIn=String(req.body?.clockIn??'').trim();
      const clockOut=String(req.body?.clockOut??'').trim();
      const reason=String(req.body?.reason||'').trim();
      if(!dateOk(date))return fail(res,400,'근무일을 확인해주세요.');
      if(!timeOk(clockIn)||!timeOk(clockOut))return fail(res,400,'시간 형식을 확인해주세요.');
      if(!reason)return fail(res,400,'수정 사유를 입력해주세요.');
      if(clockIn&&clockOut&&clockOut<clockIn)return fail(res,400,'퇴근시간은 출근시간보다 빠를 수 없습니다.');
      const user=await client.query('SELECT id,name,title FROM users WHERE id=$1 LIMIT 1',[userId]);
      if(!user.rowCount)return fail(res,404,'직원을 찾을 수 없습니다.');
      if(isCeoTitle(user.rows[0].title))return fail(res,403,'대표이사는 근태관리 대상에서 제외됩니다.');

      await client.query('BEGIN');
      const current=await client.query('SELECT * FROM attendance_logs WHERE user_id=$1 AND work_date=$2::date FOR UPDATE',[userId,date]);
      const before=current.rows[0]||null;
      if(!before&&!clockIn&&!clockOut){await client.query('ROLLBACK');return fail(res,400,'등록할 출퇴근 시간을 입력해주세요.');}

      let saved;
      if(before){
        saved=await client.query(`UPDATE attendance_logs SET
          clock_in=CASE WHEN $3='' THEN NULL ELSE ($2::date+$3::time) AT TIME ZONE 'Asia/Seoul' END,
          clock_out=CASE WHEN $4='' THEN NULL ELSE ($2::date+$4::time) AT TIME ZONE 'Asia/Seoul' END,
          updated_at=NOW()
          WHERE user_id=$1 AND work_date=$2::date RETURNING *`,[userId,date,clockIn,clockOut]);
      }else{
        saved=await client.query(`INSERT INTO attendance_logs(user_id,work_date,clock_in,clock_out,gps_in,gps_out,device_info)
          VALUES($1,$2::date,
            CASE WHEN $3='' THEN NULL ELSE ($2::date+$3::time) AT TIME ZONE 'Asia/Seoul' END,
            CASE WHEN $4='' THEN NULL ELSE ($2::date+$4::time) AT TIME ZONE 'Asia/Seoul' END,
            '{}'::jsonb,'{}'::jsonb,'PC 관리자 수기등록') RETURNING *`,[userId,date,clockIn,clockOut]);
      }
      const after=saved.rows[0];
      const editor=req.session.user||{};
      await client.query(`INSERT INTO attendance_admin_adjustments
        (user_id,work_date,original_clock_in,original_clock_out,new_clock_in,new_clock_out,reason,editor_id,editor_name)
        VALUES($1,$2::date,$3,$4,$5,$6,$7,$8,$9)`,[
          userId,date,before?.clock_in||null,before?.clock_out||null,after.clock_in||null,after.clock_out||null,
          reason.slice(0,1000),editor.id||null,String(editor.name||'관리자').slice(0,100)
        ]);
      await client.query('COMMIT');
      return ok(res,{clockIn:after.clock_in,clockOut:after.clock_out},'근태 시간이 수정되었습니다. 수정 이력에 기록했습니다.');
    }catch(e){try{await client.query('ROLLBACK')}catch(_e){}console.error('[Daily attendance admin] edit',e);return fail(res,500,'근태 시간 수정에 실패했습니다.');}
    finally{client.release();}
  });
}

const originalUse=express.application.use;
express.application.use=function namoDailyAttendanceAdminUse(...args){
  const result=originalUse.apply(this,args);
  if(!this.__namoDailyAttendanceAdminInstalled){
    const fns=args.flat().filter(v=>typeof v==='function');
    if(fns.some(fn=>fn.name==='session'||/session/i.test(String(fn.name||'')))){
      install(this);console.log('[Daily attendance admin] routes installed');
    }
  }
  return result;
};
module.exports={installDailyAttendanceAdmin:install};
