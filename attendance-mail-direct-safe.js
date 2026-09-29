'use strict';

const crypto=require('crypto');
const express=require('express');
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
    CREATE TABLE IF NOT EXISTS attendance_mail_queue(
      id UUID PRIMARY KEY,
      sender_user_id UUID,
      sender_name TEXT,
      sender_email TEXT,
      recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
      subject TEXT NOT NULL,
      html TEXT NOT NULL,
      attachment_name TEXT,
      attachment_base64 TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attempts INTEGER NOT NULL DEFAULT 0,
      locked_at TIMESTAMPTZ,
      next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at TIMESTAMPTZ,
      message_id TEXT,
      last_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS attendance_mail_queue_status_idx
      ON attendance_mail_queue(status,next_attempt_at,created_at);
  `);
  schemaReady=true;
}

function relayToken(){
  return String(process.env.MAIL_RELAY_TOKEN||'').trim();
}

function relayAuthorized(req){
  const expected=relayToken();
  const actual=String(req.get('x-mail-relay-token')||'').trim();
  if(!expected||!actual)return false;
  const a=Buffer.from(expected,'utf8');
  const b=Buffer.from(actual,'utf8');
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}

function requireRelay(req,res,next){
  if(!relayToken())return fail(res,503,'MAIL_RELAY_TOKEN 설정이 필요합니다.','MAIL_RELAY_NOT_CONFIGURED');
  if(!relayAuthorized(req))return fail(res,401,'메일 릴레이 인증에 실패했습니다.','MAIL_RELAY_UNAUTHORIZED');
  next();
}

async function currentSender(req){
  const id=req.session?.user?.id;
  if(!id)throw new Error('로그인 사용자를 확인할 수 없습니다.');
  const q=await pool.query("SELECT id,name,email,department,title,status FROM users WHERE id=$1 LIMIT 1",[id]);
  const user=q.rows[0];
  if(!user?.email)throw new Error('직원등록현황에 로그인 사용자의 회사메일이 없습니다.');
  return user;
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

function resendConfigured(){
  return Boolean(String(process.env.RESEND_API_KEY||'').trim()&&String(process.env.RESEND_FROM_EMAIL||'').trim());
}

async function sendViaResend({sender,recipients,subject,html,pdfFilename,pdfContent}){
  const apiKey=String(process.env.RESEND_API_KEY||'').trim();
  const fromEmail=String(process.env.RESEND_FROM_EMAIL||'').trim();
  if(!apiKey||!fromEmail)throw new Error('Resend API 설정이 없습니다.');
  const fromName=String(sender?.name||'나모케미칼').replace(/["<>]/g,'').trim()||'나모케미칼';
  const response=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{'Authorization':'Bearer '+apiKey,'Content-Type':'application/json'},
    body:JSON.stringify({
      from:fromName+' <'+fromEmail+'>',
      reply_to:sender?.email||undefined,
      to:recipients.map(x=>x.email),
      subject,
      html,
      attachments:pdfContent?[{filename:pdfFilename||'approval.pdf',content:pdfContent.toString('base64')}]:[]
    })
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload?.message||payload?.name||('Resend HTTP '+response.status));
  return String(payload?.id||'');
}

async function enqueueMail({sender,recipients,subject,html,pdfFilename,pdfContent}){
  await ensureSchema();
  const id=crypto.randomUUID();
  await pool.query(
    `INSERT INTO attendance_mail_queue(
      id,sender_user_id,sender_name,sender_email,recipients,subject,html,
      attachment_name,attachment_base64,status,attempts,next_attempt_at,created_at,updated_at
    ) VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,'PENDING',0,NOW(),NOW(),NOW())`,
    [id,sender.id,sender.name||'',sender.email,JSON.stringify(recipients.map(x=>({id:x.id,name:x.name||'',email:x.email}))),subject,html,pdfFilename,pdfContent.toString('base64')]
  );
  return id;
}

function install(app){
  if(app.__namoAttendanceMailDirectInstalled)return;
  app.__namoAttendanceMailDirectInstalled=true;

  app.get('/api/attendance/mail-link/status',requireLogin,async(req,res)=>{
    try{
      const sender=await currentSender(req);
      return ok(res,{linked:true,mode:resendConfigured()?'resend':'pc_relay',sender:{id:sender.id,name:sender.name||'',email:sender.email}});
    }catch(e){return fail(res,401,e.message,'LOGIN_SENDER_NOT_FOUND')}
  });

  app.post('/api/attendance/direct-mail',requireLogin,async(req,res)=>{
    try{
      const sender=await currentSender(req);
      const recipients=await validRecipients(req.body?.recipients);
      if(!recipients.length)return fail(res,400,'수신자를 선택해 주세요.','RECIPIENTS_REQUIRED');
      const request=req.body?.request||{};
      const subject=`[나모케미칼] ${request.leaveName||'휴가'} 승인 완료`;
      const html=`<div style="font-family:Arial,'Noto Sans KR',sans-serif;color:#1f2937;line-height:1.65"><h2 style="color:#176dd0">나모케미칼 근태 요청 승인완료</h2><p>검토 완료 후 자동 승인된 근태 요청입니다.</p><p style="color:#64748b">요청자: ${sender.name||'-'} &lt;${sender.email}&gt;</p><table style="border-collapse:collapse;width:100%;max-width:640px"><tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">신청자</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.employeeName||'-'}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">부서</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.employeeDepartment||'-'}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">휴가</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.leaveName||request.leaveType||'-'}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">일정</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.startDate||'-'} ~ ${request.endDate||'-'}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">일수</td><td style="padding:8px;border-bottom:1px solid #ddd">${request.days??'-'}일</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:700">상태</td><td style="padding:8px;border-bottom:1px solid #ddd">승인완료</td></tr></table><p style="margin-top:18px;color:#64748b">승인 문서는 PDF로 첨부되었습니다.</p></div>`;
      let pdfContent=null;
      let pdfFilename=String(req.body?.pdfName||'').trim().slice(0,160);
      const pdfBase64=String(req.body?.pdfBase64||'').trim();
      if(pdfBase64){
        try{
          const candidate=Buffer.from(pdfBase64,'base64');
          if(candidate.length&&candidate.length<=5*1024*1024&&candidate.slice(0,5).toString('ascii')==='%PDF-')pdfContent=candidate;
        }catch(_e){}
      }
      if(!pdfContent)pdfContent=buildApprovalPdf(req.body);
      if(!pdfFilename)pdfFilename=`NAMO_Attendance_Approval_${String(request.id||'approved').replace(/[^A-Za-z0-9_-]/g,'_')}.pdf`;
      if(resendConfigured()){
        const messageId=await sendViaResend({sender,recipients,subject,html,pdfFilename,pdfContent});
        return ok(res,{queued:false,sentDirect:true,messageId,sent:recipients.length,mode:'resend',sender:{id:sender.id,name:sender.name||'',email:sender.email}},'메일 발송이 완료되었습니다.');
      }
      const queueId=await enqueueMail({sender,recipients,subject,html,pdfFilename,pdfContent});
      return ok(res,{queued:true,queueId,sentDirect:false,sent:recipients.length,mode:'pc_relay',sender:{id:sender.id,name:sender.name||'',email:sender.email}},'메일 발송 대기열에 등록했습니다.');
    }catch(e){
      console.error('[Attendance mail queue]',e);
      return fail(res,500,`메일 발송 대기 등록 실패: ${e.message}`,'MAIL_QUEUE_FAILED');
    }
  });

  app.get('/api/mail-relay/jobs/next',requireRelay,async(req,res)=>{
    try{
      await ensureSchema();
      const client=await pool.connect();
      try{
        await client.query('BEGIN');
        const q=await client.query(`
          SELECT *
          FROM attendance_mail_queue
          WHERE (
            status='PENDING'
            OR (status='SENDING' AND locked_at < NOW() - INTERVAL '5 minutes')
          )
          AND next_attempt_at <= NOW()
          AND attempts < 5
          ORDER BY created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        `);
        const row=q.rows[0];
        if(!row){
          await client.query('COMMIT');
          return ok(res,{job:null});
        }
        await client.query(
          `UPDATE attendance_mail_queue
           SET status='SENDING',attempts=attempts+1,locked_at=NOW(),updated_at=NOW()
           WHERE id=$1`,
          [row.id]
        );
        await client.query('COMMIT');
        return ok(res,{job:{
          id:row.id,
          senderName:row.sender_name||'',
          senderEmail:row.sender_email||'',
          recipients:Array.isArray(row.recipients)?row.recipients:[],
          subject:row.subject,
          html:row.html,
          attachmentName:row.attachment_name||'approval.pdf',
          attachmentBase64:row.attachment_base64||'',
          attempt:Number(row.attempts||0)+1
        }});
      }catch(e){
        await client.query('ROLLBACK').catch(()=>{});
        throw e;
      }finally{client.release()}
    }catch(e){
      console.error('[Mail relay next]',e);
      return fail(res,500,e.message,'MAIL_RELAY_NEXT_FAILED');
    }
  });

  app.post('/api/mail-relay/jobs/:id/result',requireRelay,async(req,res)=>{
    try{
      await ensureSchema();
      const id=String(req.params.id||'');
      if(!/^[0-9a-f-]{36}$/i.test(id))return fail(res,400,'잘못된 작업 ID입니다.','MAIL_RELAY_BAD_ID');
      const success=Boolean(req.body?.success);
      const messageId=String(req.body?.messageId||'').slice(0,500);
      const error=String(req.body?.error||'').slice(0,2000);
      if(success){
        await pool.query(
          `UPDATE attendance_mail_queue
           SET status='SENT',sent_at=NOW(),message_id=$2,last_error=NULL,locked_at=NULL,updated_at=NOW()
           WHERE id=$1`,
          [id,messageId]
        );
        return ok(res,{id,status:'SENT'});
      }
      const q=await pool.query('SELECT attempts FROM attendance_mail_queue WHERE id=$1 LIMIT 1',[id]);
      if(!q.rowCount)return fail(res,404,'메일 작업을 찾을 수 없습니다.','MAIL_RELAY_JOB_NOT_FOUND');
      const attempts=Number(q.rows[0].attempts||0);
      const terminal=attempts>=5;
      await pool.query(
        `UPDATE attendance_mail_queue
         SET status=$2,last_error=$3,locked_at=NULL,
             next_attempt_at=CASE WHEN $2='FAILED' THEN next_attempt_at ELSE NOW()+INTERVAL '1 minute' END,
             updated_at=NOW()
         WHERE id=$1`,
        [id,terminal?'FAILED':'PENDING',error||'메일 발송 실패']
      );
      return ok(res,{id,status:terminal?'FAILED':'PENDING'});
    }catch(e){
      console.error('[Mail relay result]',e);
      return fail(res,500,e.message,'MAIL_RELAY_RESULT_FAILED');
    }
  });
}

const originalUse=express.application.use;
express.application.use=function attendanceMailDirectUse(...args){
  const result=originalUse.apply(this,args);
  if(!this.__namoAttendanceMailDirectInstalled){
    const fns=args.flat().filter(v=>typeof v==='function');
    if(fns.some(fn=>fn.name==='session'||/session/i.test(String(fn.name||'')))){install(this);console.log('[Attendance mail] PC relay routes installed')}
  }
  return result;
};

module.exports={installAttendanceMailDirect:install};
