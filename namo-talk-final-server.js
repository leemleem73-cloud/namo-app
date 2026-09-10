'use strict';
const express=require('express');
const {Pool}=require('pg');
const bcrypt=require('bcryptjs');
const crypto=require('crypto');
const multer=require('multer');
const fs=require('fs');
const path=require('path');
require('dotenv').config();

const P='/api/namo-talk-standalone';
const dbUrl=process.env.DATABASE_URL||'';
const pool=new Pool({connectionString:dbUrl,ssl:dbUrl&&!/(localhost|127\.0\.0\.1)/i.test(dbUrl)?{rejectUnauthorized:false}:false});
const SECRET=process.env.NAMO_TALK_TOKEN_SECRET||process.env.SESSION_SECRET||'namo-talk-dev-secret';
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:25*1024*1024}});
let ready=null,cleanupTimer=null;

const ok=(res,data={})=>res.json({success:true,...data});
const fail=(res,status,message,extra={})=>res.status(status).json({success:false,message,...extra});
const directRoom=(a,b)=>[String(a),String(b)].sort((x,y)=>x.localeCompare(y,'ko')).join('::');

function makeToken(user){
  const payload=Buffer.from(JSON.stringify({name:user.name,department:user.department||'',exp:Date.now()+43200000})).toString('base64url');
  const sig=crypto.createHmac('sha256',SECRET).update(payload).digest('base64url');
  return payload+'.'+sig;
}
function verifyToken(req){
  try{
    const raw=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
    const [payload,sig]=raw.split('.');
    if(!payload||!sig)return null;
    const expected=crypto.createHmac('sha256',SECRET).update(payload).digest('base64url');
    if(expected.length!==sig.length||!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(sig)))return null;
    const user=JSON.parse(Buffer.from(payload,'base64url').toString());
    return user.exp>Date.now()?user:null;
  }catch{return null}
}

async function schema(){
  if(ready)return ready;
  ready=pool.query(`
CREATE TABLE IF NOT EXISTS namo_talk_standalone_accounts(
 id BIGSERIAL PRIMARY KEY,name TEXT UNIQUE NOT NULL,department TEXT DEFAULT '',password_hash TEXT NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE namo_talk_standalone_accounts ADD COLUMN IF NOT EXISTS presence TEXT NOT NULL DEFAULT 'offline';
ALTER TABLE namo_talk_standalone_accounts ADD COLUMN IF NOT EXISTS status_message TEXT NOT NULL DEFAULT '';
ALTER TABLE namo_talk_standalone_accounts ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE namo_talk_standalone_accounts ADD COLUMN IF NOT EXISTS avatar_type TEXT NOT NULL DEFAULT 'preset';
ALTER TABLE namo_talk_standalone_accounts ADD COLUMN IF NOT EXISTS avatar_value TEXT NOT NULL DEFAULT 'drop-purple';
ALTER TABLE namo_talk_standalone_accounts ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS namo_talk_standalone_attachments(
 id BIGSERIAL PRIMARY KEY,room_id TEXT NOT NULL,sender_name TEXT NOT NULL,receiver_name TEXT NOT NULL,
 file_name TEXT NOT NULL,mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',file_size BIGINT NOT NULL DEFAULT 0,
 file_data BYTEA NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS namo_talk_standalone_attachment_room_idx ON namo_talk_standalone_attachments(room_id,created_at);

CREATE TABLE IF NOT EXISTS namo_talk_standalone_messages(
 id BIGSERIAL PRIMARY KEY,room_id TEXT NOT NULL,sender_name TEXT NOT NULL,receiver_name TEXT NOT NULL,
 message_text TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE namo_talk_standalone_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE namo_talk_standalone_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE namo_talk_standalone_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE namo_talk_standalone_messages ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE namo_talk_standalone_messages ADD COLUMN IF NOT EXISTS attachment_id BIGINT REFERENCES namo_talk_standalone_attachments(id) ON DELETE SET NULL;
ALTER TABLE namo_talk_standalone_messages ADD COLUMN IF NOT EXISTS client_message_id TEXT;
CREATE INDEX IF NOT EXISTS namo_talk_standalone_msg_room_idx ON namo_talk_standalone_messages(room_id,created_at);
CREATE UNIQUE INDEX IF NOT EXISTS namo_talk_standalone_sender_client_msg_uidx ON namo_talk_standalone_messages(sender_name,client_message_id) WHERE client_message_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS namo_talk_standalone_channel_reads(
 room_id TEXT NOT NULL,user_name TEXT NOT NULL,last_read_id BIGINT NOT NULL DEFAULT 0,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(room_id,user_name)
);
CREATE TABLE IF NOT EXISTS namo_talk_standalone_channels(
 id TEXT PRIMARY KEY,name TEXT NOT NULL,type TEXT NOT NULL DEFAULT 'custom',subtitle TEXT NOT NULL DEFAULT '',
 created_by TEXT NOT NULL,active BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE namo_talk_standalone_channels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE TABLE IF NOT EXISTS namo_talk_standalone_channel_members(
 channel_id TEXT NOT NULL,user_name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(channel_id,user_name)
);
CREATE TABLE IF NOT EXISTS namo_talk_standalone_settings(
 key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO namo_talk_standalone_settings(key,value) VALUES
 ('attachment_auto_cleanup','true'),('attachment_retention_days','365'),('attachment_last_cleanup_at',''),
 ('attachment_last_deleted_count','0'),('attachment_last_deleted_bytes','0')
ON CONFLICT(key) DO NOTHING;
INSERT INTO namo_talk_standalone_channels(id,name,type,subtitle,created_by,active) VALUES
 ('all','전체공지','notice','전 직원 공지','system',TRUE)
ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,subtitle=EXCLUDED.subtitle,active=TRUE,updated_at=NOW();
`).then(async()=>{
    const exists=await pool.query('SELECT 1 FROM namo_talk_standalone_accounts WHERE name=$1',['박현아']);
    if(!exists.rowCount){
      await pool.query('INSERT INTO namo_talk_standalone_accounts(name,department,password_hash,is_admin) VALUES($1,$2,$3,TRUE)',
        ['박현아','품질부',await bcrypt.hash('1234',10)]);
    }else{
      await pool.query('UPDATE namo_talk_standalone_accounts SET is_admin=TRUE WHERE name=$1',['박현아']);
    }
    await seedDepartmentChannels();
  }).catch(e=>{ready=null;throw e});
  return ready;
}

async function seedDepartmentChannels(){
  await pool.query(`INSERT INTO namo_talk_standalone_channels(id,name,type,subtitle,created_by,active)
    SELECT 'dept:'||department,department,'department',department||' 업무 채널','system',TRUE
    FROM (SELECT DISTINCT department FROM namo_talk_standalone_accounts WHERE COALESCE(department,'')<>'') d
    ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,subtitle=EXCLUDED.subtitle,active=TRUE,updated_at=NOW()`);
}
async function account(name){
  await schema();
  const r=await pool.query(`SELECT name,department,active,is_admin,presence,status_message,last_seen_at,password_hash,avatar_type,avatar_value
    FROM namo_talk_standalone_accounts WHERE name=$1 LIMIT 1`,[name]);
  return r.rows[0]||null;
}
async function requireUser(req,res){
  const tokenUser=verifyToken(req);
  if(!tokenUser){fail(res,401,'로그인이 필요합니다.');return null}
  const a=await account(tokenUser.name);
  if(!a||!a.active){fail(res,403,'사용중지된 계정입니다.');return null}
  return a;
}
async function requireAdmin(req,res){
  const a=await requireUser(req,res);
  if(!a)return null;
  if(!a.is_admin){fail(res,403,'관리자 권한이 필요합니다.');return null}
  return a;
}
async function canAccessChannel(a,ch){
  if(!a?.active)return false;
  if(ch==='all')return true;
  if(ch==='dept:'+String(a.department||''))return true;
  if(String(ch).startsWith('custom:')){
    const r=await pool.query(`SELECT 1 FROM namo_talk_standalone_channels c
      JOIN namo_talk_standalone_channel_members m ON m.channel_id=c.id
      WHERE c.id=$1 AND c.active=TRUE AND m.user_name=$2`,[ch,a.name]);
    return !!r.rowCount;
  }
  return false;
}
async function existingMessage(sender,clientId){
  if(!clientId)return null;
  const r=await pool.query(`SELECT m.id,m.sender_name sender,m.receiver_name receiver,m.message_text text,m.created_at AS "createdAt",
    m.read_at AS "readAt",m.edited_at AS "editedAt",m.pinned,m.attachment_id AS "attachmentId",m.client_message_id AS "clientMessageId",
    a.file_name AS "fileName",a.mime_type AS "mimeType",a.file_size AS "fileSize"
    FROM namo_talk_standalone_messages m LEFT JOIN namo_talk_standalone_attachments a ON a.id=m.attachment_id
    WHERE m.sender_name=$1 AND m.client_message_id=$2 LIMIT 1`,[sender,clientId]);
  return r.rows[0]||null;
}

async function getStorageSettings(){
  await schema();
  const r=await pool.query("SELECT key,value FROM namo_talk_standalone_settings WHERE key LIKE 'attachment_%'");
  return Object.fromEntries(r.rows.map(x=>[x.key,x.value]));
}
async function saveCleanupHistory(result){
  await pool.query(`INSERT INTO namo_talk_standalone_settings(key,value) VALUES
    ('attachment_last_cleanup_at',$1),('attachment_last_deleted_count',$2),('attachment_last_deleted_bytes',$3)
    ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,
    [new Date().toISOString(),String(result.deletedAttachments),String(result.freedBytes)]);
}
async function cleanupAttachments(days){
  days=[90,180,365,730].includes(Number(days))?Number(days):365;
  const r=await pool.query(`WITH old AS(
      SELECT id,file_size FROM namo_talk_standalone_attachments WHERE created_at<NOW()-($1::int*INTERVAL '1 day')
    ),u AS(
      UPDATE namo_talk_standalone_messages SET attachment_id=NULL WHERE attachment_id IN(SELECT id FROM old)
    ),d AS(
      DELETE FROM namo_talk_standalone_attachments WHERE id IN(SELECT id FROM old) RETURNING file_size
    ) SELECT COUNT(*)::int count,COALESCE(SUM(file_size),0)::bigint bytes FROM d`,[days]);
  const out={deletedAttachments:Number(r.rows[0].count||0),freedBytes:Number(r.rows[0].bytes||0),days,textMessagesDeleted:0,textPreserved:true};
  await saveCleanupHistory(out);
  return out;
}
async function automaticCleanup(){
  try{const s=await getStorageSettings();if(s.attachment_auto_cleanup==='true')await cleanupAttachments(s.attachment_retention_days)}
  catch(e){console.error('[NAMO Talk automatic cleanup]',e)}
}
function scheduleCleanup(){
  if(cleanupTimer)return;
  const run=()=>automaticCleanup().finally(()=>{cleanupTimer=setTimeout(run,24*60*60*1000);cleanupTimer.unref?.()});
  cleanupTimer=setTimeout(run,24*60*60*1000);
  cleanupTimer.unref?.();
}

function install(app){
  if(app.__namoTalkFinalInstalled)return;
  app.__namoTalkFinalInstalled=true;
  schema().then(scheduleCleanup).catch(e=>console.error('[NAMO Talk schema]',e));

  app.get(P+'/health',async(req,res)=>{
    try{await schema();ok(res,{service:'NAMO Talk Standalone',version:'7.0.0',serverTime:new Date().toISOString(),features:{centralServer:true,idempotentSend:true,channelUnread:true,employeeLifecycle:true,storageRetention:true,managedChannels:true}})}
    catch(e){fail(res,500,'NAMO Talk DB를 준비하지 못했습니다.')}
  });

  app.post(P+'/login',async(req,res)=>{
    try{
      const name=String(req.body?.name||'').trim(),pw=String(req.body?.password||'');
      const a=await account(name);
      if(!a||!a.active||!(await bcrypt.compare(pw,a.password_hash)))return fail(res,401,'이름 또는 비밀번호를 확인해 주세요.');
      await pool.query("UPDATE namo_talk_standalone_accounts SET presence='online',last_seen_at=NOW(),updated_at=NOW() WHERE name=$1",[name]);
      ok(res,{token:makeToken(a),user:{name:a.name,department:a.department||'',presence:'online',statusMessage:a.status_message||'',isAdmin:!!a.is_admin},permissions:{admin:!!a.is_admin,manageEmployees:!!a.is_admin,manageStorage:!!a.is_admin,manageChannels:!!a.is_admin,postAllNotice:!!a.is_admin,pinNotices:!!a.is_admin}});
    }catch(e){console.error('[NAMO Talk login]',e);fail(res,500,'로그인 처리 중 오류가 발생했습니다.')}
  });

  app.get(P+'/users',async(req,res)=>{
    try{
      const me=await requireUser(req,res);if(!me)return;
      await pool.query('UPDATE namo_talk_standalone_accounts SET last_seen_at=NOW() WHERE name=$1',[me.name]);
      const r=await pool.query(`SELECT name,department,active,is_admin AS "isAdmin",
        CASE WHEN active=FALSE THEN 'offline' WHEN presence='offline' OR last_seen_at IS NULL OR last_seen_at<NOW()-INTERVAL '90 seconds' THEN 'offline' ELSE presence END presence,
        status_message AS "statusMessage",last_seen_at AS "lastSeenAt" FROM namo_talk_standalone_accounts ORDER BY active DESC,department,name`);
      ok(res,{users:r.rows,permissions:{admin:!!me.is_admin}});
    }catch(e){fail(res,500,'직원 목록을 불러오지 못했습니다.')}
  });

  app.post(P+'/signup',async(req,res)=>{
    try{
      const me=await requireAdmin(req,res);if(!me)return;
      const name=String(req.body?.name||'').trim(),department=String(req.body?.department||'').trim(),pw=String(req.body?.password||'1234');
      if(!name||pw.length<4)return fail(res,400,'직원명과 4자 이상 비밀번호가 필요합니다.');
      await pool.query(`INSERT INTO namo_talk_standalone_accounts(name,department,password_hash,active)
        VALUES($1,$2,$3,TRUE) ON CONFLICT(name) DO UPDATE SET department=EXCLUDED.department,password_hash=EXCLUDED.password_hash,active=TRUE,updated_at=NOW()`,
        [name,department,await bcrypt.hash(pw,10)]);
      await seedDepartmentChannels();
      ok(res,{user:{name,department,active:true},conversationPreserved:true});
    }catch(e){fail(res,500,'직원 등록에 실패했습니다.')}
  });

  app.put(P+'/users/:name',async(req,res)=>{
    try{
      const me=await requireAdmin(req,res);if(!me)return;
      const name=decodeURIComponent(req.params.name),department=req.body?.department,active=req.body?.active;
      if(department===undefined&&active===undefined)return fail(res,400,'변경할 정보가 없습니다.');
      if(name===me.name&&active===false)return fail(res,400,'현재 로그인한 관리자 계정은 직접 사용중지할 수 없습니다.');
      const r=await pool.query(`UPDATE namo_talk_standalone_accounts SET department=COALESCE($1,department),active=COALESCE($2,active),
        presence=CASE WHEN $2=FALSE THEN 'offline' ELSE presence END,updated_at=NOW() WHERE name=$3 RETURNING name,department,active,is_admin AS "isAdmin"`,
        [department===undefined?null:String(department),active===undefined?null:Boolean(active),name]);
      if(!r.rowCount)return fail(res,404,'직원을 찾을 수 없습니다.');
      await seedDepartmentChannels();
      ok(res,{user:r.rows[0],conversationPreserved:true});
    }catch(e){fail(res,500,'직원 정보를 변경하지 못했습니다.')}
  });

  app.get(P+'/admin/me',async(req,res)=>{
    try{const me=await requireUser(req,res);if(!me)return;ok(res,{isAdmin:!!me.is_admin,active:!!me.active,department:me.department||''})}
    catch(e){fail(res,500,'권한 정보를 확인하지 못했습니다.')}
  });
  app.get(P+'/admin/users',async(req,res)=>{
    try{const me=await requireAdmin(req,res);if(!me)return;const r=await pool.query('SELECT name,department,active,is_admin AS "isAdmin",created_at AS "createdAt",updated_at AS "updatedAt" FROM namo_talk_standalone_accounts ORDER BY active DESC,department,name');ok(res,{users:r.rows})}
    catch(e){fail(res,500,'직원 관리 정보를 불러오지 못했습니다.')}
  });
  app.put(P+'/admin/users/:name/role',async(req,res)=>{
    try{const me=await requireAdmin(req,res);if(!me)return;const name=decodeURIComponent(req.params.name);if(name===me.name&&req.body?.isAdmin===false)return fail(res,400,'현재 로그인한 관리자의 권한은 직접 해제할 수 없습니다.');const r=await pool.query('UPDATE namo_talk_standalone_accounts SET is_admin=$1,updated_at=NOW() WHERE name=$2 RETURNING name,is_admin AS "isAdmin"',[!!req.body?.isAdmin,name]);if(!r.rowCount)return fail(res,404,'직원을 찾을 수 없습니다.');ok(res,{user:r.rows[0]})}
    catch(e){fail(res,500,'관리자 권한을 변경하지 못했습니다.')}
  });

  app.put(P+'/password',async(req,res)=>{
    try{const me=await requireUser(req,res);if(!me)return;const current=String(req.body?.currentPassword||''),next=String(req.body?.newPassword||'');if(next.length<4)return fail(res,400,'새 비밀번호는 4자 이상이어야 합니다.');if(!(await bcrypt.compare(current,me.password_hash)))return fail(res,400,'현재 비밀번호가 올바르지 않습니다.');await pool.query('UPDATE namo_talk_standalone_accounts SET password_hash=$1,updated_at=NOW() WHERE name=$2',[await bcrypt.hash(next,10),me.name]);ok(res)}
    catch(e){fail(res,500,'비밀번호 변경에 실패했습니다.')}
  });

  app.get(P+'/profiles',async(req,res)=>{
    try{const me=await requireUser(req,res);if(!me)return;const r=await pool.query(`SELECT name,department,avatar_type type,avatar_value value,updated_at AS "updatedAt" FROM namo_talk_standalone_accounts WHERE active=TRUE ORDER BY department,name`);ok(res,{profiles:r.rows})}
    catch(e){fail(res,500,'프로필 정보를 불러오지 못했습니다.')}
  });
  app.put(P+'/profile',async(req,res)=>{
    try{const me=await requireUser(req,res);if(!me)return;const type=String(req.body?.type||'preset'),value=String(req.body?.value||'');await pool.query('UPDATE namo_talk_standalone_accounts SET avatar_type=$1,avatar_value=$2,updated_at=NOW() WHERE name=$3',[type,value,me.name]);ok(res,{profile:{name:me.name,type,value}})}
    catch(e){fail(res,500,'프로필을 저장하지 못했습니다.')}
  });
  app.put(P+'/presence',async(req,res)=>{
    try{const me=await requireUser(req,res);if(!me)return;const presence=['online','away','offline','busy'].includes(req.body?.presence)?req.body.presence:'online',statusMessage=String(req.body?.statusMessage||'').slice(0,120);await pool.query('UPDATE namo_talk_standalone_accounts SET presence=$1,status_message=$2,last_seen_at=NOW(),updated_at=NOW() WHERE name=$3',[presence,statusMessage,me.name]);ok(res,{presence,statusMessage})}
    catch(e){fail(res,500,'상태 변경에 실패했습니다.')}
  });
  app.post(P+'/logout',async(req,res)=>{
    const t=verifyToken(req);if(!t)return ok(res);
    try{await pool.query("UPDATE namo_talk_standalone_accounts SET presence='offline',last_seen_at=NOW() WHERE name=$1",[t.name]);ok(res)}
    catch(e){fail(res,500,'로그아웃 처리에 실패했습니다.')}
  });

  app.get(P+'/messages',async(req,res)=>{
    try{
      const me=await requireUser(req,res);if(!me)return;
      const peer=String(req.query.peer||'').trim(),rid=directRoom(me.name,peer);
      const r=await pool.query(`SELECT m.id,m.sender_name sender,m.receiver_name receiver,m.message_text text,m.created_at AS "createdAt",m.read_at AS "readAt",m.edited_at AS "editedAt",m.pinned,m.attachment_id AS "attachmentId",m.client_message_id AS "clientMessageId",a.file_name AS "fileName",a.mime_type AS "mimeType",a.file_size AS "fileSize" FROM namo_talk_standalone_messages m LEFT JOIN namo_talk_standalone_attachments a ON a.id=m.attachment_id WHERE m.room_id=$1 AND m.deleted_at IS NULL ORDER BY m.created_at ASC,m.id ASC LIMIT 1000`,[rid]);
      await pool.query('UPDATE namo_talk_standalone_messages SET read_at=COALESCE(read_at,NOW()) WHERE room_id=$1 AND receiver_name=$2 AND read_at IS NULL',[rid,me.name]);
      ok(res,{messages:r.rows,data:r.rows});
    }catch(e){fail(res,500,'메시지를 불러오지 못했습니다.')}
  });

  app.post(P+'/messages',async(req,res)=>{
    try{
      const me=await requireUser(req,res);if(!me)return;
      const peer=String(req.body?.peer||'').trim(),text=String(req.body?.text||'').trim(),clientId=String(req.body?.clientMessageId||'').trim()||null;
      if(!peer||!text)return fail(res,400,'메시지를 입력해 주세요.');
      const target=await account(peer);if(!target?.active)return fail(res,400,'현재 사용할 수 없는 직원입니다.');
      const old=await existingMessage(me.name,clientId);if(old)return ok(res,{message:old,data:old,duplicate:true,delivered:true,serverTime:new Date().toISOString()});
      try{
        const r=await pool.query(`INSERT INTO namo_talk_standalone_messages(room_id,sender_name,receiver_name,message_text,client_message_id) VALUES($1,$2,$3,$4,$5) RETURNING id,sender_name sender,receiver_name receiver,message_text text,created_at AS "createdAt",client_message_id AS "clientMessageId"`,[directRoom(me.name,peer),me.name,peer,text,clientId]);
        ok(res,{message:r.rows[0],data:r.rows[0],duplicate:false,delivered:true,serverTime:new Date().toISOString()});
      }catch(e){if(e.code==='23505'&&clientId){const m=await existingMessage(me.name,clientId);if(m)return ok(res,{message:m,data:m,duplicate:true,delivered:true,serverTime:new Date().toISOString()})}throw e}
    }catch(e){console.error('[NAMO Talk direct send]',e);fail(res,500,'메시지 전송에 실패했습니다.')}
  });

  app.get(P+'/unread',async(req,res)=>{
    try{const me=await requireUser(req,res);if(!me)return;const r=await pool.query(`SELECT sender_name sender,COUNT(*)::int count,MAX(id)::bigint AS "latestId" FROM namo_talk_standalone_messages WHERE receiver_name=$1 AND read_at IS NULL AND deleted_at IS NULL GROUP BY sender_name`,[me.name]);ok(res,{unread:r.rows,total:r.rows.reduce((s,x)=>s+Number(x.count||0),0)})}
    catch(e){fail(res,500,'안 읽은 메시지를 확인하지 못했습니다.')}
  });

  app.get(P+'/channels',async(req,res)=>{
    try{
      const me=await requireUser(req,res);if(!me)return;await seedDepartmentChannels();
      const r=await pool.query(`SELECT DISTINCT c.id,c.name,c.type,c.subtitle,c.active FROM namo_talk_standalone_channels c LEFT JOIN namo_talk_standalone_channel_members m ON m.channel_id=c.id WHERE c.active=TRUE AND (c.id='all' OR c.id=$2 OR (c.type='custom' AND m.user_name=$1)) ORDER BY CASE WHEN c.id='all' THEN 0 WHEN c.type='department' THEN 1 ELSE 2 END,c.name`,[me.name,'dept:'+String(me.department||'')]);
      ok(res,{channels:r.rows.map(c=>({...c,canPost:c.id==='all'?!!me.is_admin:true,canPin:!!me.is_admin,canManage:!!me.is_admin}))});
    }catch(e){fail(res,500,'업무채널을 불러오지 못했습니다.')}
  });
  app.post(P+'/channels',async(req,res)=>{
    try{const me=await requireAdmin(req,res);if(!me)return;const name=String(req.body?.name||'').trim();if(!name)return fail(res,400,'채널명을 입력해 주세요.');const id='custom:'+crypto.randomUUID(),subtitle=String(req.body?.subtitle||'').slice(0,120);await pool.query('INSERT INTO namo_talk_standalone_channels(id,name,type,subtitle,created_by) VALUES($1,$2,$3,$4,$5)',[id,name,'custom',subtitle,me.name]);await pool.query('INSERT INTO namo_talk_standalone_channel_members(channel_id,user_name,role) VALUES($1,$2,$3)',[id,me.name,'owner']);ok(res,{channel:{id,name,type:'custom',subtitle,active:true}})}
    catch(e){fail(res,500,'업무채널을 만들지 못했습니다.')}
  });
  app.put(P+'/channels/:id',async(req,res)=>{
    try{const me=await requireAdmin(req,res);if(!me)return;const id=decodeURIComponent(req.params.id);if(!id.startsWith('custom:'))return fail(res,400,'기본 업무채널은 변경할 수 없습니다.');const r=await pool.query('UPDATE namo_talk_standalone_channels SET name=COALESCE($1,name),subtitle=COALESCE($2,subtitle),active=COALESCE($3,active),updated_at=NOW() WHERE id=$4 RETURNING id,name,type,subtitle,active',[req.body?.name===undefined?null:String(req.body.name).trim(),req.body?.subtitle===undefined?null:String(req.body.subtitle).slice(0,120),req.body?.active===undefined?null:!!req.body.active,id]);if(!r.rowCount)return fail(res,404,'채널을 찾을 수 없습니다.');ok(res,{channel:r.rows[0]})}
    catch(e){fail(res,500,'업무채널을 변경하지 못했습니다.')}
  });
  app.put(P+'/channels/:id/members',async(req,res)=>{
    try{const me=await requireAdmin(req,res);if(!me)return;const id=decodeURIComponent(req.params.id);if(!id.startsWith('custom:'))return fail(res,400,'기본 업무채널의 참여자는 변경할 수 없습니다.');const exists=await pool.query('SELECT 1 FROM namo_talk_standalone_channels WHERE id=$1',[id]);if(!exists.rowCount)return fail(res,404,'채널을 찾을 수 없습니다.');const members=[...new Set([me.name,...(Array.isArray(req.body?.members)?req.body.members.map(String).filter(Boolean):[])])];const c=await pool.connect();try{await c.query('BEGIN');await c.query('DELETE FROM namo_talk_standalone_channel_members WHERE channel_id=$1',[id]);for(const n of members)await c.query(`INSERT INTO namo_talk_standalone_channel_members(channel_id,user_name,role) SELECT $1,$2,$3 WHERE EXISTS(SELECT 1 FROM namo_talk_standalone_accounts WHERE name=$2 AND active=TRUE)`,[id,n,n===me.name?'owner':'member']);await c.query('COMMIT')}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}ok(res,{channelId:id,members})}
    catch(e){fail(res,500,'채널 참여자를 변경하지 못했습니다.')}
  });
  app.get(P+'/managed-channels',async(req,res)=>{
    try{const me=await requireUser(req,res);if(!me)return;const r=await pool.query(`SELECT c.id,c.name,c.type,c.subtitle,c.active,m.role FROM namo_talk_standalone_channels c JOIN namo_talk_standalone_channel_members m ON m.channel_id=c.id WHERE c.active=TRUE AND m.user_name=$1 ORDER BY c.name`,[me.name]);ok(res,{channels:r.rows,isAdmin:!!me.is_admin})}
    catch(e){fail(res,500,'관리 채널을 불러오지 못했습니다.')}
  });

  app.get(P+'/channel-messages',async(req,res)=>{
    try{
      const me=await requireUser(req,res);if(!me)return;const ch=String(req.query.channel||'');if(!(await canAccessChannel(me,ch)))return fail(res,403,'이 업무채널을 볼 수 없습니다.');const rid='channel:'+ch;
      const r=await pool.query(`SELECT m.id,m.sender_name sender,m.message_text text,m.created_at AS "createdAt",m.edited_at AS "editedAt",m.pinned,m.attachment_id AS "attachmentId",m.client_message_id AS "clientMessageId",a.file_name AS "fileName",a.mime_type AS "mimeType",a.file_size AS "fileSize" FROM namo_talk_standalone_messages m LEFT JOIN namo_talk_standalone_attachments a ON a.id=m.attachment_id WHERE m.room_id=$1 AND m.deleted_at IS NULL ORDER BY m.created_at ASC,m.id ASC LIMIT 1000`,[rid]);
      const last=r.rows.length?Number(r.rows[r.rows.length-1].id):0;
      await pool.query(`INSERT INTO namo_talk_standalone_channel_reads(room_id,user_name,last_read_id) VALUES($1,$2,$3) ON CONFLICT(room_id,user_name) DO UPDATE SET last_read_id=EXCLUDED.last_read_id,updated_at=NOW()`,[rid,me.name,last]);
      ok(res,{messages:r.rows});
    }catch(e){fail(res,500,'업무채널 메시지를 불러오지 못했습니다.')}
  });

  app.post(P+'/channel-messages',async(req,res)=>{
    try{
      const me=await requireUser(req,res);if(!me)return;const ch=String(req.body?.channel||''),text=String(req.body?.text||'').trim(),clientId=String(req.body?.clientMessageId||'').trim()||null;
      if(!ch||!text)return fail(res,400,'메시지를 입력해 주세요.');if(!(await canAccessChannel(me,ch)))return fail(res,403,'이 업무채널에 메시지를 보낼 수 없습니다.');if(ch==='all'&&!me.is_admin)return fail(res,403,'전체공지는 관리자만 작성할 수 있습니다.');
      const old=await existingMessage(me.name,clientId);if(old)return ok(res,{message:old,duplicate:true,delivered:true,serverTime:new Date().toISOString()});
      try{const r=await pool.query(`INSERT INTO namo_talk_standalone_messages(room_id,sender_name,receiver_name,message_text,client_message_id) VALUES($1,$2,$3,$4,$5) RETURNING id,sender_name sender,message_text text,created_at AS "createdAt",client_message_id AS "clientMessageId"`,['channel:'+ch,me.name,'@'+ch,text,clientId]);ok(res,{message:r.rows[0],duplicate:false,delivered:true,serverTime:new Date().toISOString()})}
      catch(e){if(e.code==='23505'&&clientId){const m=await existingMessage(me.name,clientId);if(m)return ok(res,{message:m,duplicate:true,delivered:true,serverTime:new Date().toISOString()})}throw e}
    }catch(e){fail(res,500,'업무채널 메시지 전송에 실패했습니다.')}
  });

  app.get(P+'/channel-unread',async(req,res)=>{
    try{
      const me=await requireUser(req,res);if(!me)return;await seedDepartmentChannels();
      const cr=await pool.query(`SELECT DISTINCT c.id FROM namo_talk_standalone_channels c LEFT JOIN namo_talk_standalone_channel_members m ON m.channel_id=c.id WHERE c.active=TRUE AND (c.id='all' OR c.id=$2 OR (c.type='custom' AND m.user_name=$1))`,[me.name,'dept:'+String(me.department||'')]);
      const ids=cr.rows.map(x=>'channel:'+x.id);if(!ids.length)return ok(res,{unread:[],total:0});
      const r=await pool.query(`SELECT substring(m.room_id from 9) channel,COUNT(*)::int count,MAX(m.id)::bigint AS "latestId" FROM namo_talk_standalone_messages m LEFT JOIN namo_talk_standalone_channel_reads rd ON rd.room_id=m.room_id AND rd.user_name=$1 WHERE m.room_id=ANY($2::text[]) AND m.deleted_at IS NULL AND m.sender_name<>$1 AND m.id>COALESCE(rd.last_read_id,0) GROUP BY m.room_id ORDER BY MAX(m.id) DESC`,[me.name,ids]);
      ok(res,{unread:r.rows,total:r.rows.reduce((s,x)=>s+Number(x.count||0),0)});
    }catch(e){fail(res,500,'업무채널 안 읽은 메시지를 확인하지 못했습니다.')}
  });

  app.get(P+'/conversations',async(req,res)=>{
    try{const me=await requireUser(req,res);if(!me)return;const r=await pool.query(`WITH mine AS(SELECT m.*,CASE WHEN sender_name=$1 THEN receiver_name ELSE sender_name END peer,ROW_NUMBER() OVER(PARTITION BY room_id ORDER BY created_at DESC,id DESC) rn FROM namo_talk_standalone_messages m WHERE deleted_at IS NULL AND room_id NOT LIKE 'channel:%' AND(sender_name=$1 OR receiver_name=$1)) SELECT room_id AS "roomId",'direct'::text type,peer,peer title,message_text AS "latestText",created_at AS "latestAt",(SELECT COUNT(*)::int FROM namo_talk_standalone_messages u WHERE u.room_id=mine.room_id AND u.receiver_name=$1 AND u.read_at IS NULL AND u.deleted_at IS NULL) unread FROM mine WHERE rn=1 ORDER BY created_at DESC`,[me.name]);ok(res,{conversations:r.rows})}
    catch(e){fail(res,500,'대화 목록을 불러오지 못했습니다.')}
  });

  app.post(P+'/attachments',upload.single('file'),async(req,res)=>{
    const file=req.file;if(!file)return fail(res,400,'첨부파일이 필요합니다.');
    try{
      const me=await requireUser(req,res);if(!me)return;const peer=String(req.body?.peer||''),ch=String(req.body?.channel||''),clientId=String(req.body?.clientMessageId||'').trim()||null;
      if(ch){if(!(await canAccessChannel(me,ch)))return fail(res,403,'이 업무채널에 파일을 보낼 수 없습니다.');if(ch==='all'&&!me.is_admin)return fail(res,403,'전체공지는 관리자만 작성할 수 있습니다.')}else{const target=await account(peer);if(!peer||!target?.active)return fail(res,400,'현재 사용할 수 없는 직원입니다.')}
      const old=await existingMessage(me.name,clientId);if(old)return ok(res,{message:old,duplicate:true,delivered:true});
      const rid=ch?'channel:'+ch:directRoom(me.name,peer),target=ch?'@'+ch:peer,c=await pool.connect();
      try{await c.query('BEGIN');const a=await c.query('INSERT INTO namo_talk_standalone_attachments(room_id,sender_name,receiver_name,file_name,mime_type,file_size,file_data) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',[rid,me.name,target,file.originalname,file.mimetype||'application/octet-stream',file.size,file.buffer]);const m=await c.query(`INSERT INTO namo_talk_standalone_messages(room_id,sender_name,receiver_name,message_text,attachment_id,client_message_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,sender_name sender,receiver_name receiver,message_text text,created_at AS "createdAt",attachment_id AS "attachmentId",client_message_id AS "clientMessageId"`,[rid,me.name,target,'📎 '+file.originalname,a.rows[0].id,clientId]);await c.query('COMMIT');ok(res,{message:{...m.rows[0],fileName:file.originalname,mimeType:file.mimetype,fileSize:file.size},duplicate:false,delivered:true})}
      catch(e){await c.query('ROLLBACK');if(e.code==='23505'&&clientId){const m=await existingMessage(me.name,clientId);if(m)return ok(res,{message:m,duplicate:true,delivered:true})}throw e}finally{c.release()}
    }catch(e){console.error('[NAMO Talk attachment send]',e);fail(res,500,'첨부파일 전송에 실패했습니다.')}
  });

  app.get(P+'/attachments/:id',async(req,res)=>{
    try{const me=await requireUser(req,res);if(!me)return;const r=await pool.query('SELECT room_id,file_name,mime_type,file_data FROM namo_talk_standalone_attachments WHERE id=$1',[Number(req.params.id)]);if(!r.rowCount)return fail(res,404,'첨부파일을 찾을 수 없습니다.');const f=r.rows[0];if(f.room_id.startsWith('channel:')){if(!(await canAccessChannel(me,f.room_id.slice(8))))return fail(res,403,'첨부파일 접근 권한이 없습니다.')}else if(!f.room_id.split('::').includes(me.name))return fail(res,403,'첨부파일 접근 권한이 없습니다.');res.setHeader('Content-Type',f.mime_type||'application/octet-stream');res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(f.file_name)}`);res.end(f.file_data)}
    catch(e){fail(res,500,'첨부파일을 불러오지 못했습니다.')}
  });

  app.get(P+'/storage-stats',async(req,res)=>{
    try{const me=await requireAdmin(req,res);if(!me)return;const [m,a,s]=await Promise.all([pool.query(`SELECT COUNT(*)::int count,COALESCE(SUM(octet_length(message_text)),0)::bigint bytes FROM namo_talk_standalone_messages WHERE deleted_at IS NULL`),pool.query(`SELECT COUNT(*)::int count,COALESCE(SUM(file_size),0)::bigint bytes,COALESCE(SUM(CASE WHEN mime_type LIKE 'image/%' THEN file_size ELSE 0 END),0)::bigint image_bytes FROM namo_talk_standalone_attachments`),getStorageSettings()]);const messages=Number(m.rows[0].count||0),messageBytes=Number(m.rows[0].bytes||0),attachments=Number(a.rows[0].count||0),attachmentBytes=Number(a.rows[0].bytes||0);ok(res,{messages,messageCount:messages,messageBytes,attachments,attachmentCount:attachments,attachmentBytes,imageBytes:Number(a.rows[0].image_bytes||0),totalBytes:messageBytes+attachmentBytes,textPreserved:true,textAutoDelete:false,autoCleanup:s.attachment_auto_cleanup==='true',retentionDays:Number(s.attachment_retention_days||365),lastCleanupAt:s.attachment_last_cleanup_at||null,lastDeletedCount:Number(s.attachment_last_deleted_count||0),lastDeletedBytes:Number(s.attachment_last_deleted_bytes||0)})}
    catch(e){fail(res,500,'저장공간 정보를 불러오지 못했습니다.')}
  });
  app.put(P+'/storage-settings',async(req,res)=>{
    try{const me=await requireAdmin(req,res);if(!me)return;const enabled=req.body?.autoCleanup!==false,days=[90,180,365,730].includes(Number(req.body?.retentionDays))?Number(req.body.retentionDays):365;await pool.query(`INSERT INTO namo_talk_standalone_settings(key,value) VALUES('attachment_auto_cleanup',$1),('attachment_retention_days',$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,[String(enabled),String(days)]);ok(res,{autoCleanup:enabled,retentionDays:days,textAutoDelete:false})}
    catch(e){fail(res,500,'보관 설정을 저장하지 못했습니다.')}
  });
  app.post(P+'/storage-cleanup',async(req,res)=>{
    try{const me=await requireAdmin(req,res);if(!me)return;ok(res,await cleanupAttachments(req.body?.days))}
    catch(e){fail(res,500,'첨부파일 정리에 실패했습니다.')}
  });

  app.put(P+'/messages/:id',async(req,res)=>{
    try{
      const me=await requireUser(req,res);if(!me)return;const id=Number(req.params.id),action=String(req.body?.action||'');
      if(action==='edit'){const r=await pool.query('UPDATE namo_talk_standalone_messages SET message_text=$1,edited_at=NOW() WHERE id=$2 AND sender_name=$3 AND deleted_at IS NULL',[String(req.body?.text||''),id,me.name]);if(!r.rowCount)return fail(res,403,'수정할 수 없는 메시지입니다.')}
      else if(action==='delete'){const r=await pool.query('UPDATE namo_talk_standalone_messages SET deleted_at=NOW() WHERE id=$1 AND sender_name=$2 AND deleted_at IS NULL',[id,me.name]);if(!r.rowCount)return fail(res,403,'삭제할 수 없는 메시지입니다.')}
      else if(action==='pin'||action==='unpin'){if(!me.is_admin)return fail(res,403,'공지 고정은 관리자만 할 수 있습니다.');const r=await pool.query("UPDATE namo_talk_standalone_messages SET pinned=$1 WHERE id=$2 AND room_id LIKE 'channel:%' AND deleted_at IS NULL",[action==='pin',id]);if(!r.rowCount)return fail(res,404,'업무채널 메시지를 찾을 수 없습니다.')}
      else return fail(res,400,'지원하지 않는 작업입니다.');
      ok(res);
    }catch(e){fail(res,500,'메시지 작업에 실패했습니다.')}
  });

  app.get(P+'/sticker-sheet',(req,res)=>{
    const candidates=['public/assets/namo-emoticons-gel-20260731.webp','public/assets/namo-emoticons-gel.webp','public/assets/namo-sticker-sheet.webp'];
    const found=candidates.map(x=>path.resolve(process.cwd(),x)).find(fs.existsSync);
    if(!found)return fail(res,404,'NAMO 스티커 시트가 서버에 없습니다.');
    res.setHeader('Cache-Control','public,max-age=86400');res.sendFile(found);
  });
}

function autoInstall(){
  const proto=express.application;
  if(proto.__namoTalkFinalAuto)return;
  proto.__namoTalkFinalAuto=true;
  const listen=proto.listen;
  proto.listen=function(...args){if(!this.__namoTalkFinalInstalled)install(this);return listen.apply(this,args)};
}
autoInstall();
module.exports={installNamoTalkFinalRoutes:install};
