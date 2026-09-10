'use strict';
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
require('dotenv').config();

const PREFIX = '/api/namo-talk-standalone';
const dbUrl = process.env.DATABASE_URL || '';
const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl && !/(localhost|127\.0\.0\.1)/i.test(dbUrl) ? { rejectUnauthorized: false } : false
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const TOKEN_SECRET = process.env.NAMO_TALK_TOKEN_SECRET || process.env.SESSION_SECRET || 'namo-talk-dev-secret';
let schemaReady;

function ensureSchema() {
  if (schemaReady) return schemaReady;
  schemaReady = pool.query(`
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
    ALTER TABLE namo_talk_standalone_accounts ADD COLUMN IF NOT EXISTS avatar_type TEXT NOT NULL DEFAULT 'preset';
    ALTER TABLE namo_talk_standalone_accounts ADD COLUMN IF NOT EXISTS avatar_value TEXT NOT NULL DEFAULT 'drop-purple';

    CREATE TABLE IF NOT EXISTS namo_talk_standalone_attachments(
      id BIGSERIAL PRIMARY KEY,
      room_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      receiver_name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      file_size BIGINT NOT NULL DEFAULT 0,
      file_data BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS namo_talk_standalone_attachment_room_idx ON namo_talk_standalone_attachments(room_id,created_at);

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
    ALTER TABLE namo_talk_standalone_messages ADD COLUMN IF NOT EXISTS attachment_id BIGINT REFERENCES namo_talk_standalone_attachments(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS namo_talk_standalone_msg_room_idx ON namo_talk_standalone_messages(room_id,created_at);

    CREATE TABLE IF NOT EXISTS namo_talk_standalone_channel_reads(
      room_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      last_read_id BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY(room_id,user_name)
    );
  `).then(async () => {
    const exists = await pool.query('SELECT 1 FROM namo_talk_standalone_accounts WHERE name=$1', ['박현아']);
    if (!exists.rowCount) {
      await pool.query(
        'INSERT INTO namo_talk_standalone_accounts(name,department,password_hash) VALUES($1,$2,$3)',
        ['박현아', '품질부', await bcrypt.hash('1234', 10)]
      );
    }
  }).catch(e => { schemaReady = null; throw e; });
  return schemaReady;
}

const ok = (res, data = {}) => res.json({ success: true, ...data });
const fail = (res, status, message) => res.status(status).json({ success: false, message });
const roomId = (a, b) => [String(a), String(b)].sort((x, y) => x.localeCompare(y, 'ko')).join('::');

function makeToken(user) {
  const payload = Buffer.from(JSON.stringify({ name: user.name, department: user.department || '', exp: Date.now() + 12 * 60 * 60 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}
function auth(req) {
  try {
    const raw = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const [payload, sig] = raw.split('.');
    if (!payload || !sig) return null;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
    if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return user.exp > Date.now() ? user : null;
  } catch (_) { return null; }
}

function install(app) {
  if (app.__namoTalkStandaloneInstalled) return;
  app.__namoTalkStandaloneInstalled = true;
  ensureSchema().catch(e => console.error('[NAMO Talk] schema', e));

  app.get(PREFIX + '/health', async (req, res) => {
    try { await ensureSchema(); ok(res, { service: 'NAMO Talk Standalone', version: '6.0.0' }); }
    catch (_) { fail(res, 500, 'NAMO Talk DB를 준비하지 못했습니다.'); }
  });

  app.post(PREFIX + '/login', async (req, res) => {
    try {
      await ensureSchema();
      const name = String(req.body?.name || '').trim();
      const password = String(req.body?.password || '');
      const r = await pool.query('SELECT name,department,password_hash,active,presence,status_message FROM namo_talk_standalone_accounts WHERE name=$1 LIMIT 1', [name]);
      const user = r.rows[0];
      if (!user || !user.active || !(await bcrypt.compare(password, user.password_hash))) return fail(res, 401, '이름 또는 비밀번호를 확인해 주세요.');
      await pool.query("UPDATE namo_talk_standalone_accounts SET presence='online',last_seen_at=NOW(),updated_at=NOW() WHERE name=$1", [user.name]);
      ok(res, { token: makeToken(user), user: { name: user.name, department: user.department || '', presence: 'online', statusMessage: user.status_message || '' } });
    } catch (e) { console.error('[NAMO Talk] login', e); fail(res, 500, '로그인 처리 중 오류가 발생했습니다.'); }
  });

  app.get(PREFIX + '/users', async (req, res) => {
    const me = auth(req); if (!me) return fail(res, 401, '로그인이 필요합니다.');
    try {
      await ensureSchema();
      await pool.query('UPDATE namo_talk_standalone_accounts SET last_seen_at=NOW() WHERE name=$1', [me.name]);
      const r = await pool.query(`SELECT name,department,active,
        CASE WHEN presence='offline' OR last_seen_at IS NULL OR last_seen_at < NOW()-INTERVAL '90 seconds' THEN 'offline' ELSE presence END AS presence,
        status_message AS "statusMessage",last_seen_at AS "lastSeenAt" FROM namo_talk_standalone_accounts ORDER BY department,name`);
      ok(res, { users: r.rows });
    } catch (_) { fail(res, 500, '직원 목록을 불러오지 못했습니다.'); }
  });

  app.post(PREFIX + '/signup', async (req, res) => {
    const me = auth(req); if (!me) return fail(res, 401, '로그인이 필요합니다.');
    try {
      const name = String(req.body?.name || '').trim(), department = String(req.body?.department || '').trim(), password = String(req.body?.password || '1234');
      if (!name || password.length < 4) return fail(res, 400, '직원명과 4자 이상 비밀번호가 필요합니다.');
      const hash = await bcrypt.hash(password, 10);
      await pool.query(`INSERT INTO namo_talk_standalone_accounts(name,department,password_hash,active)
        VALUES($1,$2,$3,TRUE) ON CONFLICT(name) DO UPDATE SET department=EXCLUDED.department,password_hash=EXCLUDED.password_hash,active=TRUE,updated_at=NOW()`, [name, department, hash]);
      ok(res, { user: { name, department } });
    } catch (_) { fail(res, 500, '직원 등록에 실패했습니다.'); }
  });

  app.put(PREFIX + '/password', async (req, res) => {
    const me = auth(req); if (!me) return fail(res, 401, '로그인이 필요합니다.');
    try {
      const currentPassword = String(req.body?.currentPassword || ''), newPassword = String(req.body?.newPassword || '');
      if (newPassword.length < 4) return fail(res, 400, '새 비밀번호는 4자 이상이어야 합니다.');
      const r = await pool.query('SELECT password_hash FROM namo_talk_standalone_accounts WHERE name=$1', [me.name]);
      if (!r.rowCount || !(await bcrypt.compare(currentPassword, r.rows[0].password_hash))) return fail(res, 400, '현재 비밀번호가 올바르지 않습니다.');
      await pool.query('UPDATE namo_talk_standalone_accounts SET password_hash=$1,updated_at=NOW() WHERE name=$2', [await bcrypt.hash(newPassword, 10), me.name]);
      ok(res);
    } catch (_) { fail(res, 500, '비밀번호 변경에 실패했습니다.'); }
  });

  app.get(PREFIX + '/profiles', async (req, res) => {
    const me = auth(req); if (!me) return fail(res, 401, '로그인이 필요합니다.');
    try {
      const r = await pool.query(`SELECT name,department,avatar_type AS type,avatar_value AS value,updated_at AS "updatedAt"
        FROM namo_talk_standalone_accounts WHERE active=TRUE ORDER BY department,name`);
      ok(res, { profiles: r.rows });
    } catch (_) { fail(res, 500, '프로필 정보를 불러오지 못했습니다.'); }
  });

  app.put(PREFIX + '/profile', async (req, res) => {
    const me = auth(req); if (!me) return fail(res, 401, '로그인이 필요합니다.');
    try {
      const type = String(req.body?.type || 'preset'), value = String(req.body?.value || '');
      await pool.query('UPDATE namo_talk_standalone_accounts SET avatar_type=$1,avatar_value=$2,updated_at=NOW() WHERE name=$3', [type, value, me.name]);
      ok(res, { profile: { name: me.name, type, value } });
    } catch (_) { fail(res, 500, '프로필을 저장하지 못했습니다.'); }
  });

  app.put(PREFIX + '/presence', async (req, res) => {
    const me = auth(req); if (!me) return fail(res, 401, '로그인이 필요합니다.');
    try {
      const presence = ['online','away','offline','busy'].includes(req.body?.presence) ? req.body.presence : 'online';
      const statusMessage = String(req.body?.statusMessage || '').slice(0,120);
      await pool.query('UPDATE namo_talk_standalone_accounts SET presence=$1,status_message=$2,last_seen_at=NOW(),updated_at=NOW() WHERE name=$3', [presence, statusMessage, me.name]);
      ok(res, { presence, statusMessage });
    } catch (_) { fail(res, 500, '상태 변경에 실패했습니다.'); }
  });

  app.post(PREFIX + '/logout', async (req, res) => {
    const me = auth(req); if (!me) return ok(res);
    try { await pool.query("UPDATE namo_talk_standalone_accounts SET presence='offline',last_seen_at=NOW() WHERE name=$1", [me.name]); ok(res); }
    catch (_) { fail(res, 500, '로그아웃 처리에 실패했습니다.'); }
  });

  app.get(PREFIX + '/messages', async (req, res) => {
    const me = auth(req); if (!me) return fail(res, 401, '로그인이 필요합니다.');
    try {
      const peer = String(req.query.peer || '').trim(); if (!peer) return fail(res, 400, '대화 상대가 필요합니다.');
      const rid = roomId(me.name, peer);
      const r = await pool.query(`SELECT m.id,m.sender_name AS sender,m.receiver_name AS receiver,m.message_text AS text,
        m.created_at AS "createdAt",m.read_at AS "readAt",m.edited_at AS "editedAt",m.pinned,m.attachment_id AS "attachmentId",
        a.file_name AS "fileName",a.mime_type AS "mimeType",a.file_size AS "fileSize"
        FROM namo_talk_standalone_messages m LEFT JOIN namo_talk_standalone_attachments a ON a.id=m.attachment_id
        WHERE m.room_id=$1 AND m.deleted_at IS NULL ORDER BY m.created_at ASC LIMIT 1000`, [rid]);
      await pool.query('UPDATE namo_talk_standalone_messages SET read_at=COALESCE(read_at,NOW()) WHERE room_id=$1 AND receiver_name=$2 AND read_at IS NULL', [rid, me.name]);
      ok(res, { messages: r.rows });
    } catch (_) { fail(res, 500, '메시지를 불러오지 못했습니다.'); }
  });

  app.post(PREFIX + '/messages', async (req, res) => {
    const me = auth(req); if (!me) return fail(res, 401, '로그인이 필요합니다.');
    try {
      const peer = String(req.body?.peer || '').trim(), text = String(req.body?.text || '').trim();
      if (!peer || !text) return fail(res, 400, '메시지를 입력해 주세요.');
      const r = await pool.query(`INSERT INTO namo_talk_standalone_messages(room_id,sender_name,receiver_name,message_text)
        VALUES($1,$2,$3,$4) RETURNING id,sender_name AS sender,receiver_name AS receiver,message_text AS text,created_at AS "createdAt"`, [roomId(me.name, peer), me.name, peer, text]);
      ok(res, { message: r.rows[0] });
    } catch (_) { fail(res, 500, '메시지 전송에 실패했습니다.'); }
  });

  app.get(PREFIX + '/unread', async (req, res) => {
    const me = auth(req); if (!me) return fail(res, 401, '로그인이 필요합니다.');
    try {
      const r = await pool.query(`SELECT sender_name AS sender,COUNT(*)::int AS count,MAX(id)::bigint AS "latestId"
        FROM namo_talk_standalone_messages WHERE receiver_name=$1 AND read_at IS NULL AND deleted_at IS NULL GROUP BY sender_name`, [me.name]);
      ok(res, { unread: r.rows, total: r.rows.reduce((s,x)=>s+Number(x.count||0),0) });
    } catch (_) { fail(res, 500, '안 읽은 메시지를 확인하지 못했습니다.'); }
  });

  app.get(PREFIX + '/channels', (req, res) => {
    const me = auth(req); if (!me) return fail(res, 401, '로그인이 필요합니다.');
    const channels = [{ id:'all',name:'전체공지',type:'notice',subtitle:'전 직원 공지' }];
    const dept = String(me.department || '').trim();
    if (dept) channels.push({ id:'dept:'+dept,name:dept,type:'department',subtitle:dept+' 업무 채널' });
    ok(res, { channels });
  });

  app.get(PREFIX + '/channel-messages', async (req, res) => {
    const me = auth(req); if (!me) return fail(res, 401, '로그인이 필요합니다.');
    try {
      const channel = String(req.query.channel || '').trim(), rid='channel:'+channel;
      const r = await pool.query(`SELECT m.id,m.sender_name AS sender,m.message_text AS text,m.created_at AS "createdAt",
        m.edited_at AS "editedAt",m.pinned,m.attachment_id AS "attachmentId",a.file_name AS "fileName",a.mime_type AS "mimeType",a.file_size AS "fileSize"
        FROM namo_talk_standalone_messages m LEFT JOIN namo_talk_standalone_attachments a ON a.id=m.attachment_id
        WHERE m.room_id=$1 AND m.deleted_at IS NULL ORDER BY m.created_at ASC LIMIT 1000`, [rid]);
      const last = r.rows.length ? Number(r.rows[r.rows.length-1].id) : 0;
      await pool.query(`INSERT INTO namo_talk_standalone_channel_reads(room_id,user_name,last_read_id) VALUES($1,$2,$3)
        ON CONFLICT(room_id,user_name) DO UPDATE SET last_read_id=EXCLUDED.last_read_id,updated_at=NOW()`, [rid,me.name,last]);
      ok(res,{messages:r.rows});
    } catch (_) { fail(res,500,'업무채널 메시지를 불러오지 못했습니다.'); }
  });

  app.post(PREFIX + '/channel-messages', async (req,res) => {
    const me=auth(req); if(!me)return fail(res,401,'로그인이 필요합니다.');
    try{
      const channel=String(req.body?.channel||'').trim(), text=String(req.body?.text||'').trim();
      if(!channel||!text)return fail(res,400,'메시지를 입력해 주세요.');
      const r=await pool.query(`INSERT INTO namo_talk_standalone_messages(room_id,sender_name,receiver_name,message_text)
        VALUES($1,$2,$3,$4) RETURNING id,sender_name AS sender,message_text AS text,created_at AS "createdAt"`, ['channel:'+channel,me.name,'@'+channel,text]);
      ok(res,{message:r.rows[0]});
    }catch(_){fail(res,500,'업무채널 메시지 전송에 실패했습니다.');}
  });

  app.get(PREFIX+'/channel-unread', async(req,res)=>{
    const me=auth(req); if(!me) return fail(res,401,'로그인이 필요합니다.');
    try{
      const channels=['all']; const dept=String(me.department||'').trim(); if(dept)channels.push('dept:'+dept);
      const rows=[];
      for(const channel of channels){
        const rid='channel:'+channel;
        const rr=await pool.query('SELECT COALESCE(last_read_id,0) AS last FROM namo_talk_standalone_channel_reads WHERE room_id=$1 AND user_name=$2',[rid,me.name]);
        const last=Number(rr.rows[0]?.last||0);
        const cr=await pool.query(`SELECT COUNT(*)::int AS count,COALESCE(MAX(id),0)::bigint AS "latestId"
          FROM namo_talk_standalone_messages WHERE room_id=$1 AND id>$2 AND sender_name<>$3 AND deleted_at IS NULL`,[rid,last,me.name]);
        rows.push({channel,count:Number(cr.rows[0]?.count||0),latestId:Number(cr.rows[0]?.latestId||0)});
      }
      ok(res,{unread:rows,total:rows.reduce((s,r)=>s+r.count,0)});
    }catch(_){fail(res,500,'업무채널 알림을 확인하지 못했습니다.');}
  });

  app.get(PREFIX+'/conversations', async(req,res)=>{
    const me=auth(req); if(!me) return fail(res,401,'로그인이 필요합니다.');
    try{
      const direct=await pool.query(`WITH mine AS (
        SELECT m.*,CASE WHEN m.sender_name=$1 THEN m.receiver_name ELSE m.sender_name END AS peer_name,
        ROW_NUMBER() OVER(PARTITION BY m.room_id ORDER BY m.created_at DESC,m.id DESC) AS rn
        FROM namo_talk_standalone_messages m WHERE m.deleted_at IS NULL AND m.room_id NOT LIKE 'channel:%'
        AND(m.sender_name=$1 OR m.receiver_name=$1))
        SELECT room_id AS "roomId",'direct'::text AS type,peer_name AS peer,peer_name AS title,''::text AS subtitle,
        message_text AS "latestText",created_at AS "latestAt",attachment_id AS "attachmentId",
        (SELECT COUNT(*)::int FROM namo_talk_standalone_messages u WHERE u.room_id=mine.room_id AND u.receiver_name=$1
        AND u.read_at IS NULL AND u.deleted_at IS NULL) AS unread FROM mine WHERE rn=1 ORDER BY created_at DESC`,[me.name]);
      ok(res,{conversations:direct.rows});
    }catch(_){fail(res,500,'대화 목록을 불러오지 못했습니다.');}
  });

  app.post(PREFIX+'/attachments',upload.single('file'),async(req,res)=>{
    const me=auth(req); if(!me)return fail(res,401,'로그인이 필요합니다.');
    const file=req.file;if(!file)return fail(res,400,'첨부파일이 필요합니다.');
    const peer=String(req.body?.peer||'').trim(),channel=String(req.body?.channel||'').trim(),text=String(req.body?.text||'').trim();
    if(!peer&&!channel)return fail(res,400,'대화 상대 또는 채널이 필요합니다.');
    const rid=channel?'channel:'+channel:roomId(me.name,peer),target=channel?'@'+channel:peer;
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const ar=await client.query('INSERT INTO namo_talk_standalone_attachments(room_id,sender_name,receiver_name,file_name,mime_type,file_size,file_data) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',[rid,me.name,target,file.originalname,file.mimetype||'application/octet-stream',file.size,file.buffer]);
      const mr=await client.query(`INSERT INTO namo_talk_standalone_messages(room_id,sender_name,receiver_name,message_text,attachment_id)
        VALUES($1,$2,$3,$4,$5) RETURNING id,sender_name AS sender,receiver_name AS receiver,message_text AS text,created_at AS "createdAt",attachment_id AS "attachmentId"`,[rid,me.name,target,text||('📎 '+file.originalname),ar.rows[0].id]);
      await client.query('COMMIT');ok(res,{message:{...mr.rows[0],fileName:file.originalname,mimeType:file.mimetype||'application/octet-stream',fileSize:file.size}});
    }catch(e){await client.query('ROLLBACK');fail(res,500,'첨부파일 전송에 실패했습니다.');}finally{client.release();}
  });

  app.get(PREFIX+'/attachments/:id',async(req,res)=>{
    const me=auth(req);if(!me)return fail(res,401,'로그인이 필요합니다.');
    try{
      const r=await pool.query('SELECT room_id,file_name,mime_type,file_size,file_data FROM namo_talk_standalone_attachments WHERE id=$1',[Number(req.params.id)]);
      if(!r.rowCount)return fail(res,404,'첨부파일을 찾을 수 없습니다.');
      const a=r.rows[0];
      if(a.room_id.startsWith('channel:')){
        const ch=a.room_id.slice(8);if(ch!=='all'&&ch!=='dept:'+me.department)return fail(res,403,'첨부파일 접근 권한이 없습니다.');
      }else if(!a.room_id.split('::').includes(me.name)) return fail(res,403,'첨부파일 접근 권한이 없습니다.');
      res.setHeader('Content-Type',a.mime_type||'application/octet-stream');res.setHeader('Content-Length',a.file_size||a.file_data.length);
      res.setHeader('Content-Disposition',`attachment; filename*=UTF-8''${encodeURIComponent(a.file_name)}`);res.end(a.file_data);
    }catch(_){fail(res,500,'첨부파일을 불러오지 못했습니다.');}
  });

  app.put(PREFIX+'/messages/:id',async(req,res)=>{
    const me=auth(req);if(!me)return fail(res,401,'로그인이 필요합니다.');
    try{
      const id=Number(req.params.id),action=String(req.body?.action||'');
      if(action==='edit')await pool.query('UPDATE namo_talk_standalone_messages SET message_text=$1,edited_at=NOW() WHERE id=$2 AND sender_name=$3',[String(req.body?.text||''),id,me.name]);
      else if(action==='delete')await pool.query('UPDATE namo_talk_standalone_messages SET deleted_at=NOW() WHERE id=$1 AND sender_name=$2',[id,me.name]);
      else if(action==='pin'||action==='unpin')await pool.query('UPDATE namo_talk_standalone_messages SET pinned=$1 WHERE id=$2',[action==='pin',id]);
      else return fail(res,400,'지원하지 않는 작업입니다.');
      ok(res);
    }catch(_){fail(res,500,'메시지 작업에 실패했습니다.');}
  });
}

function autoInstall(){
  const proto=express.application;
  if(proto.__namoTalkStandaloneAutoInstall)return;
  proto.__namoTalkStandaloneAutoInstall=true;
  const originalGet=proto.get;
  const originalListen=proto.listen;
  proto.get=function(...args){
    if(args[0]==='*'&&!this.__namoTalkStandaloneInstalled)install(this);
    return originalGet.apply(this,args);
  };
  proto.listen=function(...args){
    if(!this.__namoTalkStandaloneInstalled)install(this);
    return originalListen.apply(this,args);
  };
}
autoInstall();
module.exports={installNamoTalkStandaloneRoutes:install};
