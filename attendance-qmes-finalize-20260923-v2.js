'use strict';
const express=require('express');
const {Pool}=require('pg');
require('dotenv').config();

// QMES attendance only: inject the additive bottom-gap fix into attendance.html.
if(!express.response.__NAMO_QMES_ATTENDANCE_FINALIZE_20260917__){
  express.response.__NAMO_QMES_ATTENDANCE_FINALIZE_20260917__=true;
  const originalSend=express.response.send;
  express.response.send=function namoQmesAttendanceFinalizeSend(body){
    try{
      const req=this.req||{};
      const pathname=String(req.path||req.url||'').split('?')[0].toLowerCase();
      if(pathname==='/attendance.html'&&(typeof body==='string'||Buffer.isBuffer(body))){
        let html=Buffer.isBuffer(body)?body.toString('utf8'):String(body||'');
        if(/<\/body>/i.test(html)&&!html.includes('/attendance-corporate-bottom-gap-fix-20260917.js')){
          html=html.replace(/<\/body>/i,'<script src="/attendance-corporate-bottom-gap-fix-20260917.js?v=20260917-gap2"></script>\n</body>');
          this.setHeader('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');
          this.setHeader('Pragma','no-cache');
          this.setHeader('Expires','0');
          body=Buffer.isBuffer(body)?Buffer.from(html,'utf8'):html;
        }
      }
    }catch(error){console.error('[Attendance finalize] response hook failed',error)}
    return originalSend.call(this,body);
  };
  console.log('[Attendance finalize] bottom-gap response hook enabled');
}

// One-time full attendance reset. Guarded by a unique token so restarts do not repeat deletion.
(async()=>{
  const token=String(process.env.NAMO_ATTENDANCE_RESET_TOKEN||'').trim();
  if(!token||!process.env.DATABASE_URL)return;
  const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});
  try{
    await pool.query(`CREATE TABLE IF NOT EXISTS attendance_reset_history(
      token TEXT PRIMARY KEY,
      reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_count INTEGER NOT NULL DEFAULT 0
    )`);
    const seen=await pool.query('SELECT token FROM attendance_reset_history WHERE token=$1 LIMIT 1',[token]);
    if(seen.rowCount)return;
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const deleted=await client.query('DELETE FROM attendance_logs RETURNING id');
      await client.query('INSERT INTO attendance_reset_history(token,deleted_count) VALUES($1,$2)',[token,deleted.rowCount]);
      await client.query('COMMIT');
      console.log(`[Attendance reset] full attendance reset complete: deleted=${deleted.rowCount}`);
    }catch(error){
      await client.query('ROLLBACK');
      throw error;
    }finally{client.release()}
  }catch(error){console.error('[Attendance reset] failed',error)}
  finally{await pool.end().catch(()=>{})}
})();
