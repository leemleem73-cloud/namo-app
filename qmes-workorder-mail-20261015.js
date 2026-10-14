'use strict';
const express=require('express');
const {Pool}=require('pg');
const crypto=require('crypto');
const db=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});
function install(app){
 if(app.__qmesWoMailInstalled)return;app.__qmesWoMailInstalled=true;
 app.post('/api/qmes/workorder-mail',async(req,res)=>{
  if(!req.session?.user?.id)return res.status(401).json({success:false,message:'로그인이 필요합니다.'});
  try{
   const recipients=Array.isArray(req.body?.recipients)?req.body.recipients:[];
   const ids=Array.isArray(req.body?.orderIds)?req.body.orderIds:[];
   if(!recipients.length||!ids.length)return res.status(400).json({success:false,message:'수신자와 작업지시서를 선택하세요.'});
   const sender=(await db.query('SELECT id,name,email FROM users WHERE id=$1',[req.session.user.id])).rows[0];
   if(!sender?.email)return res.status(400).json({success:false,message:'발신자 회사메일을 등록하세요.'});
   const people=(await db.query('SELECT id,name,email FROM users WHERE id=ANY($1::uuid[]) AND email IS NOT NULL',[recipients])).rows;
   if(!people.length)return res.status(400).json({success:false,message:'이메일이 있는 담당자를 선택하세요.'});
   const lines=ids.slice(0,30).map(x=>String(x).slice(0,100));
   const subject='[QMES] 작업지시서 '+lines.length+'건';
   const html='<h2>작업지시서 전달</h2><p>'+lines.join('<br>')+'</p>';
   const id=crypto.randomUUID();
   await db.query("INSERT INTO attendance_mail_queue(id,sender_user_id,sender_name,sender_email,recipients,subject,html,status,attempts,next_attempt_at,created_at,updated_at) VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,'PENDING',0,NOW(),NOW(),NOW())",[id,sender.id,sender.name,sender.email,JSON.stringify(people),subject,html]);
   res.json({success:true,data:{queued:true,id}});
  }catch(e){res.status(500).json({success:false,message:e.message})}
 });
}
module.exports={install};
