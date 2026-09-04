'use strict';
const express=require('express');
const{Pool}=require('pg');
require('dotenv').config();
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});
const ok=(res,data=null,message='OK')=>res.json({success:true,message,data});
const fail=(res,status,message)=>res.status(status).json({success:false,message,data:null});
const requireLogin=(req,res,next)=>req.session?.user?next():fail(res,401,'로그인이 필요합니다.');
function install(app){
 if(app.__namoLeaveCancelInstalled)return;
 app.__namoLeaveCancelInstalled=true;
 app.post('/api/attendance/leave/:id/cancel',requireLogin,async(req,res)=>{
  try{
   const q=await pool.query("UPDATE leave_requests SET status='CANCELLED',updated_at=NOW() WHERE id=$1 AND user_id=$2 AND status IN ('PENDING_1','PENDING_2') RETURNING *",[req.params.id,req.session.user.id]);
   if(!q.rowCount)return fail(res,409,'승인 완료·반려·이미 취소된 연차는 취소할 수 없습니다.');
   return ok(res,q.rows[0],'연차 신청이 취소되었습니다.');
  }catch(e){console.error('[Attendance leave cancel]',e);return fail(res,500,'연차 신청 취소에 실패했습니다.');}
 });
}
const originalUse=express.application.use;
express.application.use=function leaveCancelUse(...args){const result=originalUse.apply(this,args);if(!this.__namoLeaveCancelInstalled){const fns=args.flat().filter(v=>typeof v==='function');if(fns.some(fn=>fn.name==='session'||/session/i.test(String(fn.name||'')))){install(this);console.log('[Attendance leave cancel] route installed')}}return result};
module.exports={installAttendanceLeaveCancel:install};
