'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const { Pool } = require('pg');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || '';
const localDb = /(?:localhost|127\.0\.0\.1):\d+/i.test(dbUrl);
const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl && !localDb ? { rejectUnauthorized: false } : false,
});

const PREFIX = '/api/namo-talk-standalone';
const SECRET = process.env.NAMO_TALK_TOKEN_SECRET || process.env.SESSION_SECRET || 'namo-talk-dev-secret';
let schemaPromise = null;
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:25*1024*1024}});

function ensureSchema() {
  if (schemaPromise) return schemaPromise;
  schemaPromise = pool.query(`
    CREATE TABLE IF NOT EXISTS namo_talk_standalone_accounts(
      id BIGSERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      department TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE namo_talk_standalone_accounts ADD COLUMN IF NOT EXISTS presence TEXT NOT NULL DEFAULT 'offline';
    ALTER TABLE namo_talk_standalone_accounts ADD COLUMN IF NOT EXISTS status_message TEXT NOT NULL DEFAULT '';
    ALTER TABLE namo_talk_standalone_accounts ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
    CREATE TABLE IF NOT EXISTS namo_talk_standalone_messages(
      id BIGSERIAL PRIMARY KEY,
      room_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      receiver_name TEXT NOT NULL,
      message_text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE namo_talk_standalone_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
    ALTER TABLE namo_talk_standalone_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
    ALTER TABLE namo_talk_standalone_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    ALTER TABLE namo_talk_standalone_messages ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE namo_talk_standalone_messages ADD COLUMN IF NOT EXISTS attachment_id BIGINT;
    CREATE TABLE IF NOT EXISTS namo_talk_standalone_attachments(
      id BIGSERIAL PRIMARY KEY,
      room_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      receiver_name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      file_size BIGINT NOT NULL,
      file_data BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS namo_talk_standalone_attachment_room_idx ON namo_talk_standalone_attachments(room_id,created_at);
    CREATE INDEX IF NOT EXISTS namo_talk_standalone_msg_room_idx
      ON namo_talk_standalone_messages(room_id, created_at);
  `).then(async()=>{
    const exists = await pool.query('SELECT 1 FROM namo_talk_standalone_accounts WHERE name=$1',['박현아']);
    if (!exists.rowCount) {
      const hash = await bcrypt.hash('1234',10);
      await pool.query(
        'INSERT INTO namo_talk_standalone_accounts(name,department,password_hash,active) VALUES($1,$2,$3,TRUE)',
        ['박현아','품질부',hash]
      );
    }
  }).catch(error=>{ schemaPromise=null; throw error; });
  return schemaPromise;
}

function tokenFor(user) {
  const payload = Buffer.from(JSON.stringify({
    name:user.name,
    department:user.department||'',
    exp:Date.now()+12*60*60*1000,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256',SECRET).update(payload).digest('base64url');
  return payload+'.'+sig;
}

function auth(req) {
  try {
    const raw = String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
    const [payload,sig] = raw.split('.');
    if (!payload || !sig) return null;
    const expected = crypto.createHmac('sha256',SECRET).update(payload).digest('base64url');
    if (expected.length !== sig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(sig))) return null;
    const user = JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
    if (!user.exp || user.exp < Date.now()) return null;
    return user;
  } catch (_) { return null; }
}

const roomId = (a,b)=>[String(a),String(b)].sort((x,y)=>x.localeCompare(y,'ko')).join('::');
const fail = (res,status,message)=>res.status(status).json({success:false,message});
const ok = (res,data={})=>res.json({success:true,...data});

function install(app) {
  if (app.__namoTalkStandaloneInstalled) return;
  app.__namoTalkStandaloneInstalled = true;
  ensureSchema().catch(e=>console.error('[NAMO Talk standalone] schema:',e));

  app.get(PREFIX+'/health', async(_req,res)=>{
    try { await ensureSchema(); ok(res,{service:'NAMO Talk Standalone',version:'6.0.0-dev'}); }
    catch (e) { fail(res,500,'NAMO Talk DB를 준비하지 못했습니다.'); }
  });

  app.post(PREFIX+'/login', async(req,res)=>{
    try {
      await ensureSchema();
      const name=String(req.body?.name||'').trim();
      const password=String(req.body?.password||'');
      const r=await pool.query(
        'SELECT name,department,password_hash,active,presence,status_message FROM namo_talk_standalone_accounts WHERE name=$1 LIMIT 1',
        [name]
      );
      const user=r.rows[0];
      if(!user || !user.active || !(await bcrypt.compare(password,user.password_hash))) {
        return fail(res,401,'이름 또는 비밀번호를 확인해 주세요.');
      }
      await pool.query("UPDATE namo_talk_standalone_accounts SET presence='online',last_seen_at=NOW(),updated_at=NOW() WHERE name=$1",[user.name]);
      ok(res,{token:tokenFor(user),user:{name:user.name,department:user.department||'',presence:'online',statusMessage:user.status_message||''}});
    } catch(e) {
      console.error('[NAMO Talk standalone] login:',e);
      fail(res,500,'로그인 처리 중 오류가 발생했습니다.');
    }
  });

  app.post(PREFIX+'/signup', async(req,res)=>{
    const me=auth(req); if(!me) return fail(res,401,'로그인이 필요합니다.');
    try {
      await ensureSchema();
      const name=String(req.body?.name||'').trim();
      const department=String(req.body?.department||'').trim();
      const password=String(req.body?.password||'1234');
      if(!name) return fail(res,400,'이름을 입력해 주세요.');
      if(password.length<4) return fail(res,400,'비밀번호는 4자 이상이어야 합니다.');
      const existing=await pool.query('SELECT active FROM namo_talk_standalone_accounts WHERE name=$1',[name]);
      const hash=await bcrypt.hash(password,10);
      if(existing.rowCount){
        if(existing.rows[0].active) return fail(res,409,'이미 등록된 이름입니다.');
        await pool.query(
          "UPDATE namo_talk_standalone_accounts SET department=$1,password_hash=$2,active=TRUE,presence='offline',status_message='',updated_at=NOW() WHERE name=$3",
          [department,hash,name]
        );
        return ok(res,{user:{name,department},reactivated:true});
      }
      await pool.query(
        'INSERT INTO namo_talk_standalone_accounts(name,department,password_hash,active) VALUES($1,$2,$3,TRUE)',
        [name,department,hash]
      );
      ok(res,{user:{name,department}});
    } catch(e) {
      if(e?.code==='23505') return fail(res,409,'이미 등록된 이름입니다.');
      console.error('[NAMO Talk standalone] signup:',e);
      fail(res,500,'직원 등록에 실패했습니다.');
    }
  });

  app.put(PREFIX+'/password', async(req,res)=>{
    const me=auth(req); if(!me) return fail(res,401,'로그인이 필요합니다.');
    try {
      const current=String(req.body?.currentPassword||'');
      const next=String(req.body?.newPassword||'');
      if(next.length<4) return fail(res,400,'새 비밀번호는 4자 이상이어야 합니다.');
      const r=await pool.query('SELECT password_hash FROM namo_talk_standalone_accounts WHERE name=$1',[me.name]);
      if(!r.rowCount || !(await bcrypt.compare(current,r.rows[0].password_hash))) return fail(res,400,'현재 비밀번호가 올바르지 않습니다.');
      await pool.query('UPDATE namo_talk_standalone_accounts SET password_hash=$1,updated_at=NOW() WHERE name=$2',[await bcrypt.hash(next,10),me.name]);
      ok(res);
    } catch(e) { fail(res,500,'비밀번호 변경에 실패했습니다.'); }
  });

  app.get(PREFIX+'/users', async(req,res)=>{
    const me=auth(req); if(!me) return fail(res,401,'로그인이 필요합니다.');
    try {
      await pool.query('UPDATE namo_talk_standalone_accounts SET last_seen_at=NOW() WHERE name=$1',[me.name]);
      const r=await pool.query('SELECT name,department,presence,status_message AS "statusMessage",last_seen_at AS "lastSeenAt" FROM namo_talk_standalone_accounts WHERE active IS DISTINCT FROM FALSE ORDER BY department,name');
      ok(res,{users:r.rows});
    } catch(e) { fail(res,500,'직원 목록을 불러오지 못했습니다.'); }
  });

  app.put(PREFIX+'/presence', async(req,res)=>{
    const me=auth(req); if(!me) return fail(res,401,'로그인이 필요합니다.');
    try {
      const presence=['online','away','offline'].includes(req.body?.presence)?req.body.presence:'online';
      const statusMessage=String(req.body?.statusMessage||'').slice(0,120);
      await pool.query('UPDATE namo_talk_standalone_accounts SET presence=$1,status_message=$2,last_seen_at=NOW(),updated_at=NOW() WHERE name=$3',[presence,statusMessage,me.name]);
      ok(res,{presence,statusMessage});
    } catch(e){ fail(res,500,'상태 변경에 실패했습니다.'); }
  });

  app.post(PREFIX+'/logout', async(req,res)=>{
    const me=auth(req); if(!me) return ok(res);
    try { await pool.query("UPDATE namo_talk_standalone_accounts SET presence='offline',last_seen_at=NOW(),updated_at=NOW() WHERE name=$1",[me.name]); ok(res); }
    catch(e){ fail(res,500,'로그아웃 처리에 실패했습니다.'); }
  });

  app.get(PREFIX+'/messages', async(req,res)=>{
    const me=auth(req); if(!me) return fail(res,401,'로그인이 필요합니다.');
    try {
      const peer=String(req.query.peer||'').trim();
      if(!peer) return fail(res,400,'대화 상대가 필요합니다.');
      const r=await pool.query(
        `SELECT m.id,m.sender_name AS sender,m.receiver_name AS receiver,m.message_text AS text,m.created_at AS "createdAt",m.read_at AS "readAt",m.edited_at AS "editedAt",m.deleted_at AS "deletedAt",m.pinned,m.attachment_id AS "attachmentId",a.file_name AS "fileName",a.mime_type AS "mimeType",a.file_size AS "fileSize" FROM namo_talk_standalone_messages m LEFT JOIN namo_talk_standalone_attachments a ON a.id=m.attachment_id WHERE m.room_id=$1 AND m.deleted_at IS NULL ORDER BY m.created_at ASC LIMIT 1000`,
        [roomId(me.name,peer)]
      );
      await pool.query('UPDATE namo_talk_standalone_messages SET read_at=COALESCE(read_at,NOW()) WHERE room_id=$1 AND receiver_name=$2 AND read_at IS NULL',[roomId(me.name,peer),me.name]);
      ok(res,{messages:r.rows});
    } catch(e) { fail(res,500,'메시지를 불러오지 못했습니다.'); }
  });

  app.post(PREFIX+'/messages', async(req,res)=>{
    const me=auth(req); if(!me) return fail(res,401,'로그인이 필요합니다.');
    try {
      const peer=String(req.body?.peer||'').trim();
      const text=String(req.body?.text||'').trim();
      if(!peer || !text) return fail(res,400,'메시지를 입력해 주세요.');
      const r=await pool.query(
        'INSERT INTO namo_talk_standalone_messages(room_id,sender_name,receiver_name,message_text) VALUES($1,$2,$3,$4) RETURNING id,sender_name AS sender,receiver_name AS receiver,message_text AS text,created_at AS "createdAt"',
        [roomId(me.name,peer),me.name,peer,text]
      );
      ok(res,{message:r.rows[0]});
    } catch(e) { fail(res,500,'메시지 전송에 실패했습니다.'); }
  });

  app.post(PREFIX+'/attachments', upload.single('file'), async(req,res)=>{
    const me=auth(req); if(!me) return fail(res,401,'로그인이 필요합니다.');
    const peer=String(req.body?.peer||'').trim();
    const text=String(req.body?.text||'').trim();
    const file=req.file;
    if(!peer || !file) return fail(res,400,'첨부할 파일과 대화 상대가 필요합니다.');
    const rid=roomId(me.name,peer);
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const ar=await client.query(
        'INSERT INTO namo_talk_standalone_attachments(room_id,sender_name,receiver_name,file_name,mime_type,file_size,file_data) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [rid,me.name,peer,file.originalname,file.mimetype||'application/octet-stream',file.size,file.buffer]
      );
      const mr=await client.query(
        'INSERT INTO namo_talk_standalone_messages(room_id,sender_name,receiver_name,message_text,attachment_id) VALUES($1,$2,$3,$4,$5) RETURNING id,sender_name AS sender,receiver_name AS receiver,message_text AS text,created_at AS "createdAt",attachment_id AS "attachmentId"',
        [rid,me.name,peer,text,ar.rows[0].id]
      );
      await client.query('COMMIT');
      ok(res,{message:{...mr.rows[0],fileName:file.originalname,mimeType:file.mimetype||'application/octet-stream',fileSize:file.size}});
    }catch(e){await client.query('ROLLBACK');console.error('[NAMO Talk standalone] attachment:',e);fail(res,500,'파일 전송에 실패했습니다.');}
    finally{client.release();}
  });

  app.get(PREFIX+'/attachments/:id', async(req,res)=>{
    const me=auth(req); if(!me) return fail(res,401,'로그인이 필요합니다.');
    try{
      const r=await pool.query('SELECT room_id,file_name,mime_type,file_size,file_data FROM namo_talk_standalone_attachments WHERE id=$1',[Number(req.params.id)]);
      if(!r.rowCount) return fail(res,404,'첨부파일을 찾을 수 없습니다.');
      const a=r.rows[0];
      if(!String(a.room_id).split('::').includes(me.name)) return fail(res,403,'첨부파일에 접근할 수 없습니다.');
      res.setHeader('Content-Type',a.mime_type||'application/octet-stream');
      res.setHeader('Content-Length',String(a.file_size));
      res.setHeader('Content-Disposition',"attachment; filename*=UTF-8''"+encodeURIComponent(a.file_name));
      res.send(a.file_data);
    }catch(e){fail(res,500,'첨부파일을 불러오지 못했습니다.');}
  });

  app.put(PREFIX+'/messages/:id', async(req,res)=>{
    const me=auth(req); if(!me) return fail(res,401,'로그인이 필요합니다.');
    try {
      const id=Number(req.params.id), action=String(req.body?.action||'');
      if(action==='edit'){
        const text=String(req.body?.text||'').trim();
        if(!text) return fail(res,400,'메시지를 입력해 주세요.');
        const r=await pool.query('UPDATE namo_talk_standalone_messages SET message_text=$1,edited_at=NOW() WHERE id=$2 AND sender_name=$3 AND deleted_at IS NULL RETURNING id',[text,id,me.name]);
        if(!r.rowCount) return fail(res,404,'수정할 메시지를 찾을 수 없습니다.');
      } else if(action==='delete'){
        const r=await pool.query('UPDATE namo_talk_standalone_messages SET deleted_at=NOW() WHERE id=$1 AND sender_name=$2 AND deleted_at IS NULL RETURNING id',[id,me.name]);
        if(!r.rowCount) return fail(res,404,'삭제할 메시지를 찾을 수 없습니다.');
      } else if(action==='pin' || action==='unpin'){
        const r=await pool.query('UPDATE namo_talk_standalone_messages SET pinned=$1 WHERE id=$2 AND room_id=$3 AND deleted_at IS NULL RETURNING id',[action==='pin',id,String(req.body?.roomId||'')||roomId(me.name,String(req.body?.peer||''))]);
        if(!r.rowCount) return fail(res,404,'메시지를 찾을 수 없습니다.');
      } else return fail(res,400,'지원하지 않는 작업입니다.');
      ok(res);
    } catch(e){ fail(res,500,'메시지 작업에 실패했습니다.'); }
  });
}

const originalListen=express.application.listen;
express.application.listen=function(...args){
  install(this);
  return originalListen.apply(this,args);
};

module.exports={installNamoTalkStandaloneRoutes:install};
