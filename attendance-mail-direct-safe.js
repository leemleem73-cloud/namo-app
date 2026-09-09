'use strict';

const crypto=require('crypto');
const express=require('express');
const nodemailer=require('nodemailer');
const{Pool}=require('pg');
require('dotenv').config();

const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});
let schemaReady=false;

const ok=(res,data=null,message='OK')=>res.json({success:true,message,data});
const fail=(res,status,message,code='')=>res.status(status).json({success:false,message,code,data:null});
const requireLogin=(req,res,next)=>req.session?.user?next():fail(res,401,'로그인이 필요합니다.','LOGIN_REQUIRED');

async function ensureSchema(){
  if(schemaReady)return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_mail_credentials(
      user_id UUID PRIMARY KEY,
      email TEXT NOT NULL,
      iv TEXT NOT NULL,
      auth_tag TEXT NOT NULL,
      cipher_text TEXT NOT NULL,
      linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS attendance_mail_credentials_email_idx ON attendance_mail_credentials(lower(email));
  `);
  schemaReady=true;
}

function encryptionKey(){
  const raw=String(process.env.MAIL_CREDENTIAL_KEY||process.env.SESSION_SECRET||'').trim();
  if(!raw)throw new Error('MAIL_CREDENTIAL_KEY 또는 SESSION_SECRET 설정이 필요합니다.');
  return crypto.createHash('sha256').update(raw,'utf8').digest();
}

function encryptPassword(password){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',encryptionKey(),iv);
  const encrypted=Buffer.concat([cipher.update(String(password),'utf8'),cipher.final()]);
  return{iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:encrypted.toString('base64')};
}

function decryptPassword(row){
  const decipher=crypto.createDecipheriv('aes-256-gcm',encryptionKey(),Buffer.from(row.iv,'base64'));
  decipher.setAuthTag(Buffer.from(row.auth_tag,'base64'));
  return Buffer.concat([decipher.update(Buffer.from(row.cipher_text,'base64')),decipher.final()]).toString('utf8');
}

function smtpConfig(){
  const port=Number(process.env.SMTP_PORT||587);
  return{
    host:String(process.env.SMTP_HOST||'wsmtp.ecount.com'),
    port,
    secure:String(process.env.SMTP_SECURE||'').toLowerCase()==='true'||port===465,
  };
}

async function currentSender(req){
  const id=req.session?.user?.id;
  if(!id)throw new Error('로그인 사용자를 확인할 수 없습니다.');
  const q=await pool.query("SELECT id,name,email,department,title,status FROM users WHERE id=$1 LIMIT 1",[id]);
  const user=q.rows[0];
  if(!user?.email)throw new Error('직원등록현황에 로그인 사용자의 회사메일이 없습니다.');
  return user;
}

async function storedCredential(sender){
  await ensureSchema();
  const q=await pool.query('SELECT * FROM attendance_mail_credentials WHERE user_id=$1 LIMIT 1',[sender.id]);
  const row=q.rows[0];
  if(!row)return null;
  if(String(row.email||'').toLowerCase()!==String(sender.email||'').toLowerCase())return null;
  try{return{user:sender.email,pass:decryptPassword(row)}}catch(e){console.warn('[Attendance mail] credential decrypt failed:',e.message);return null}
}

async function verifyCredential(sender,password){
  const cfg=smtpConfig();
  const transporter=nodemailer.createTransport({host:cfg.host,port:cfg.port,secure:cfg.secure,auth:{user:sender.email,pass:password},requireTLS:cfg.port===587});
  await transporter.verify();
}

function escapePdfText(value){return String(value??'').replace(/[^\x20-\x7E]/g,'?').replace(/([\\()])/g,'\\$1')}
function buildApprovalPdf(payload){
  const req=payload?.request||{};
  const recipients=Array.isArray(payload?.recipients)?payload.recipients:[];
  const lines=[
    'NAMO CHEMICAL ATTENDANCE APPROVAL',
    `Request ID: ${req.id||'-'}`,
    `Leave Type: ${req.leaveName||req.leaveType||'-'}`,
    `Employee: ${req.employeeName||'-'}`,
    `Department: ${req.employeeDepartment||'-'}`,
    `Period: ${req.startDate||'-'} ~ ${req.endDate||'-'}`,
    `Days: ${req.days??'-'}`,
    `Reviewer: ${req.reviewerName||'-'}`,
    'Status: APPROVED',
    `Recipient Department: ${req.recipientDepartment||'-'}`,
    `Recipients: ${recipients.map(x=>x.email).join(', ')||'-'}`
  ];
  const stream=['BT','/F1 13 Tf','50 790 Td',...lines.flatMap((line,i)=>i?['0 -24 Td',`(${escapePdfText(line)}) Tj`]:[`(${escapePdfText(line)}) Tj`]),'ET'].join('\n');
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',`<< /Length ${Buffer.byteLength(stream,'utf8')} >>\nstream\n${stream}\nendstream`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'];
  let pdf='%PDF-1.4\n';const offsets=[0];
  objects.forEach((obj,i)=>{offsets.push(Buffer.byteLength(pdf,'utf8'));pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`});
  const xref=Buffer.byteLength(pdf,'utf8');pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(let i=1;i<=objects.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf,'utf8');
}

async function validRecipients(input){
  const rows=Array.isArray(input)?input:[];
  const ids=rows.map(x=>String(x?.id||'')).filter(x=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x));
  if(!ids.length)return[];
  const q=await pool.query("SELECT id,name,email,department,title,status FROM users WHERE id=ANY($1::uuid[]) AND email IS NOT NULL AND email<>'' AND COALESCE(status,'APPROVED') NOT IN ('REJECTED','INACTIVE','DISABLED','DELETED','WITHDRAWN')",[ids]);
  return q.rows;
}

function install(app){
  if(app.__namoAttendanceMailDirectInstalled)return;
  app.__namoAttendanceMailDirectInstalled=true;

  app.get('/api/attendance/mail-link/status',requireLogin,async(req,res)=>{
    try{const sender=await currentSender(req);return ok(res,{linked:Boolean(await storedCredential(sender)),sender:{id:sender.id,name:sender.name||'',email:sender.email}})}
    catch(e){return fail(res,401,e.message,'LOGIN_SENDER_NOT_FOUND')}
  });

  app.post('/api/attendance/mail-link',requireLogin,async(req,res)=>{
    const password=String(req.body?.password||'');
    if(!password)return fail(res,400,'최초 메일 연동을 위한 이카운트 웹메일 비밀번호가 필요합니다.','MAIL_LINK_PASSWORD_REQUIRED');
    try{
      const sender=await currentSender(req);
      await verifyCredential(sender,password);
      await ensureSchema();
      const secret=encryptPassword(password);
      await pool.query(`INSERT INTO attendance_mail_credentials(user_id,email,iv,auth_tag,cipher_text,linked_at,updated_at) VALUES($1,$2,$3,$4,$5,NOW(),NOW()) ON CONFLICT(user_id) DO UPDATE SET email=EXCLUDED.email,iv=EXCLUDED.iv,auth_tag=EXCLUDED.auth_tag,cipher_text=EXCLUDED.cipher_text,updated_at=NOW()`,[sender.id,String(sender.email).toLowerCase(),secret.iv,secret.tag,secret.data]);
      return ok(res,{linked:true,sender:{id:sender.id,name:sender.name||'',email:sender.email}},'메일 연동이 완료되었습니다.');
    }catch(e){
      const authFailed=e?.code==='EAUTH'||Number(e?.responseCode)===535;
      return fail(res,502,authFailed?'이카운트 웹메일 비밀번호를 확인해 주세요.':`메일 연동 실패: ${e.message}`,authFailed?'SMTP_AUTH_FAILED':'MAIL_LINK_FAILED');
    }
  });

  app.delete('/api/attendance/mail-link',requireLogin,async(req,res)=>{
    try{const sender=await currentSender(req);await ensureSchema();await pool.query('DELETE FROM attendance_mail_credentials WHERE user_id=$1',[sender.id]);return ok(res,{linked:false},'메일 연동을 해제했습니다.')}catch(e){return fail(res,500,e.message,'MAIL_UNLINK_FAILED')}
  });

  app.post('/api/attendance/direct-mail',requireLogin,async(req,res)=>{
    try{
      const sender=await currentSender(req);
      const credential=await storedCredential(sender);
      if(!credential)return fail(res,503,'로그인 사용자의 메일 발송 계정이 아직 연동되지 않았습니다.','SMTP_SENDER_NOT_CONFIGURED');
      const recipients=await validRecipients(req.body?.recipients);
      if(!recipients.length)return fail(res,400,'수신자를 선택해 주세요.','RECIPIENTS_REQUIRED');
      const cfg=smtpConfig();
      const transporter=nodemailer.createTransport({host:cfg.host,port:cfg.port,secure:cfg.secure,auth:credential,requireTLS:cfg.port===587});
      const request=req.body?.request||{};
      const subject=`[나모케미칼] ${request.leaveName||'휴가'} 승인 완료`;
      const to=recipients.map(x=>x.email).join(', ');
      const html=`<div style="font-family:Arial,'Noto Sans KR',sans-serif;color:#1f2937;line-height:1.65"><h2 style="color:#176dd0">나모케미칼 근태 요청 승인완료</h2><p>검토 완료 후 자동 승인된 근태 요청입니다.</p><p style="color:#64748b">발송자: ${sender.name||'-'} &lt;${sender.email}&gt;</p><table style="border-collapse:collapse;width:100%;max-width:640px"><tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">신청자</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.employeeName||'-'}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">부서</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.employeeDepartment||'-'}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">휴가</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.leaveName||request.leaveType||'-'}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">일정</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.startDate||'-'} ~ ${request.endDate||'-'}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">일수</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.days??'-'}일</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">상태</td><td style="padding:8px;border-bottom:1px solid #ddd">승인완료</td></tr></table><p style="margin-top:18px;color:#64748b">승인 문서는 PDF로 첨부되었습니다.</p></div>`;
      const info=await transporter.sendMail({from:sender.name?`"${String(sender.name).replace(/"/g,'')}" <${sender.email}>`:sender.email,to,subject,html,attachments:[{filename:`NAMO_Attendance_Approval_${String(request.id||'approved').replace(/[^A-Za-z0-9_-]/g,'_')}.pdf`,content:buildApprovalPdf(req.body),contentType:'application/pdf'}]});
      return ok(res,{sent:recipients.length,messageId:info.messageId||null,sender:{id:sender.id,name:sender.name||'',email:sender.email}});
    }catch(e){
      console.error('[Attendance direct mail]',e);
      const authFailed=e?.code==='EAUTH'||Number(e?.responseCode)===535;
      return fail(res,502,authFailed?'로그인 사용자의 이카운트 메일 인증정보를 확인해 주세요.':`메일 발송 실패: ${e.message}`,authFailed?'SMTP_AUTH_FAILED':'SMTP_SEND_FAILED');
    }
  });
}

const originalUse=express.application.use;
express.application.use=function attendanceMailDirectUse(...args){
  const result=originalUse.apply(this,args);
  if(!this.__namoAttendanceMailDirectInstalled){
    const fns=args.flat().filter(v=>typeof v==='function');
    if(fns.some(fn=>fn.name==='session'||/session/i.test(String(fn.name||'')))){install(this);console.log('[Attendance mail] direct-mail routes installed')}
  }
  return result;
};

module.exports={installAttendanceMailDirect:install};
