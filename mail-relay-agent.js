'use strict';

const nodemailer=require('nodemailer');
const path=require('path');
const fs=require('fs');

const envPath=process.env.MAIL_RELAY_ENV||path.join(__dirname,'.env.mail-relay');
if(fs.existsSync(envPath))require('dotenv').config({path:envPath});
else require('dotenv').config();

const cfg={
  baseUrl:String(process.env.QMES_BASE_URL||'').replace(/\/$/,''),
  relayToken:String(process.env.MAIL_RELAY_TOKEN||'').trim(),
  smtpHost:String(process.env.SMTP_HOST||'wsmtp.ecount.com').trim(),
  smtpPort:Number(process.env.SMTP_PORT||587),
  smtpUser:String(process.env.SMTP_USER||'').trim(),
  smtpPass:String(process.env.SMTP_PASS||''),
  smtpSecurity:String(process.env.SMTP_SECURITY||'auto').trim().toLowerCase(),
  pollMs:Math.max(5000,Number(process.env.MAIL_RELAY_POLL_MS||15000)),
};

function assertConfig(){
  const missing=[];
  if(!cfg.baseUrl)missing.push('QMES_BASE_URL');
  if(!cfg.relayToken)missing.push('MAIL_RELAY_TOKEN');
  if(!cfg.smtpUser)missing.push('SMTP_USER');
  if(!cfg.smtpPass)missing.push('SMTP_PASS');
  if(!['auto','tls','none'].includes(cfg.smtpSecurity))throw new Error('SMTP_SECURITY 값은 auto, tls, none 중 하나여야 합니다.');
  if(missing.length)throw new Error('필수 설정 누락: '+missing.join(', '));
}

function apiHeaders(){
  return {'Content-Type':'application/json','x-mail-relay-token':cfg.relayToken};
}

async function fetchNext(){
  const r=await fetch(cfg.baseUrl+'/api/mail-relay/jobs/next',{headers:apiHeaders()});
  const p=await r.json().catch(()=>({}));
  if(!r.ok||p?.success===false)throw new Error(p?.message||('HTTP '+r.status));
  return p?.data?.job||null;
}

async function reportResult(id,payload){
  const r=await fetch(cfg.baseUrl+'/api/mail-relay/jobs/'+encodeURIComponent(id)+'/result',{
    method:'POST',
    headers:apiHeaders(),
    body:JSON.stringify(payload)
  });
  const p=await r.json().catch(()=>({}));
  if(!r.ok||p?.success===false)throw new Error(p?.message||('HTTP '+r.status));
  return p?.data||p;
}

function transporter(){
  const secure=cfg.smtpPort===465;
  const options={
    host:cfg.smtpHost,
    port:cfg.smtpPort,
    secure,
    auth:{user:cfg.smtpUser,pass:cfg.smtpPass},
    connectionTimeout:15000,
    greetingTimeout:10000,
    socketTimeout:30000
  };

  if(cfg.smtpSecurity==='tls'){
    options.requireTLS=!secure;
  }else if(cfg.smtpSecurity==='none'){
    options.ignoreTLS=!secure;
  }

  return nodemailer.createTransport(options);
}

async function sendJob(job){
  const to=(Array.isArray(job.recipients)?job.recipients:[]).map(x=>x?.email).filter(Boolean);
  if(!to.length)throw new Error('수신자 이메일이 없습니다.');
  const attachments=[];
  if(job.attachmentBase64){
    const buf=Buffer.from(job.attachmentBase64,'base64');
    if(buf.length)attachments.push({
      filename:String(job.attachmentName||'approval.pdf'),
      content:buf,
      contentType:'application/pdf'
    });
  }
  const tx=transporter();
  const fromName=String(job.senderName||'나모케미칼').replace(/"/g,'');
  const info=await tx.sendMail({
    from:`"${fromName}" <${cfg.smtpUser}>`,
    replyTo:job.senderEmail||cfg.smtpUser,
    to,
    subject:String(job.subject||'[나모케미칼] QMES 알림'),
    html:String(job.html||''),
    attachments
  });
  return info?.messageId||'';
}

let working=false;
async function tick(){
  if(working)return;
  working=true;
  try{
    const job=await fetchNext();
    if(!job)return;
    console.log(new Date().toISOString(),'메일 작업 수신',job.id,'시도',job.attempt);
    try{
      const messageId=await sendJob(job);
      await reportResult(job.id,{success:true,messageId});
      console.log(new Date().toISOString(),'메일 발송 완료',job.id,messageId);
    }catch(error){
      console.error(new Date().toISOString(),'메일 발송 실패',job.id,error?.message||error);
      await reportResult(job.id,{success:false,error:String(error?.message||error)});
    }
  }catch(error){
    console.error(new Date().toISOString(),'릴레이 확인 실패',error?.message||error);
  }finally{
    working=false;
  }
}

async function main(){
  try{
    assertConfig();
    const tx=transporter();
    await tx.verify();
    console.log('QMES PC 메일 릴레이 시작');
    console.log('QMES:',cfg.baseUrl);
    console.log('SMTP:',cfg.smtpHost+':'+cfg.smtpPort,'계정:',cfg.smtpUser,'보안:',cfg.smtpSecurity);
    console.log('확인주기:',cfg.pollMs+'ms');
    await tick();
    setInterval(tick,cfg.pollMs);
  }catch(error){
    console.error('메일 릴레이 시작 실패:',error?.message||error);
    process.exit(1);
  }
}
main();
