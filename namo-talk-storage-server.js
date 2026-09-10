'use strict';
const express=require('express');
const crypto=require('crypto');
const {Pool}=require('pg');
require('dotenv').config();
const P='/api/namo-talk-standalone';
const dbUrl=process.env.DATABASE_URL||'';
const pool=new Pool({connectionString:dbUrl,ssl:dbUrl&&!/(localhost|127\.0\.0\.1)/i.test(dbUrl)?{rejectUnauthorized:false}:false});
const SECRET=process.env.NAMO_TALK_TOKEN_SECRET||process.env.SESSION_SECRET||'namo-talk-dev-secret';
const ok=(r,d={})=>r.json({success:true,...d});
const fail=(r,s,m)=>r.status(s).json({success:false,message:m});
function auth(req){try{const raw=String(req.headers.authorization||'').replace(/^Bearer\s+/i,''),[p,s]=raw.split('.');if(!p||!s)return null;const e=crypto.createHmac('sha256',SECRET).update(p).digest('base64url');if(e.length!==s.length||!crypto.timingSafeEqual(Buffer.from(e),Buffer.from(s)))return null;const u=JSON.parse(Buffer.from(p,'base64url').toString());return u.exp>Date.now()?u:null}catch{return null}}
function install(app){if(app.__namoTalkStorageInstalled)return;app.__namoTalkStorageInstalled=true;
 app.get(P+'/storage-stats',async(req,res)=>{const me=auth(req);if(!me)return fail(res,401,'로그인이 필요합니다.');try{
  const [m,a]=await Promise.all([
   pool.query(`SELECT COUNT(*)::int AS count,COALESCE(SUM(octet_length(message_text)),0)::bigint AS bytes FROM namo_talk_standalone_messages WHERE deleted_at IS NULL`),
   pool.query(`SELECT COUNT(*)::int AS count,COALESCE(SUM(file_size),0)::bigint AS bytes,COALESCE(SUM(CASE WHEN mime_type LIKE 'image/%' THEN file_size ELSE 0 END),0)::bigint AS image_bytes FROM namo_talk_standalone_attachments`)
  ]);
  const messages=Number(m.rows[0]?.count||0),messageBytes=Number(m.rows[0]?.bytes||0),attachments=Number(a.rows[0]?.count||0),attachmentBytes=Number(a.rows[0]?.bytes||0),imageBytes=Number(a.rows[0]?.image_bytes||0);
  ok(res,{messages,messageBytes,attachments,attachmentBytes,imageBytes,totalBytes:messageBytes+attachmentBytes,textPreserved:true});
 }catch(e){console.error('[NAMO Talk storage stats]',e);fail(res,500,'저장공간 정보를 불러오지 못했습니다.')}});
 app.post(P+'/storage-cleanup',async(req,res)=>{const me=auth(req);if(!me)return fail(res,401,'로그인이 필요합니다.');try{
  const days=Number(req.body?.days);if(![90,180,365,730].includes(days))return fail(res,400,'정리 기간을 확인해 주세요.');
  const r=await pool.query(`DELETE FROM namo_talk_standalone_attachments WHERE created_at < NOW()-($1::int * INTERVAL '1 day') RETURNING file_size`,[days]);
  const freedBytes=r.rows.reduce((s,x)=>s+Number(x.file_size||0),0);
  ok(res,{deletedAttachments:r.rowCount,freedBytes,textPreserved:true,days});
 }catch(e){console.error('[NAMO Talk storage cleanup]',e);fail(res,500,'첨부파일 정리에 실패했습니다.')}});
}
function auto(){const p=express.application;if(p.__namoTalkStorageAutoInstall)return;p.__namoTalkStorageAutoInstall=true;const g=p.get,l=p.listen;p.get=function(...a){if(a[0]==='*'&&!this.__namoTalkStorageInstalled)install(this);return g.apply(this,a)};p.listen=function(...a){if(!this.__namoTalkStorageInstalled)install(this);return l.apply(this,a)}}
auto();module.exports={installNamoTalkStorageRoutes:install};
