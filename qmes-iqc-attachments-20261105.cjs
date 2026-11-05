'use strict';
const {randomUUID}=require('node:crypto');
const {validate}=require('./qmes-oqc-attachments-20261104.cjs');
async function ensure(db){await db.query('CREATE TABLE IF NOT EXISTS qmes_iqc_attachments(id text PRIMARY KEY,iqc_id uuid NOT NULL REFERENCES iqc(id) ON DELETE CASCADE,name text NOT NULL,mime text NOT NULL,content bytea NOT NULL,sha256 text NOT NULL,created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp())');}
async function write(pool,{data,id,attachment,user}){
 const file=validate(attachment),keys=Object.keys(data),vals=Object.values(data);
 const client=await pool.connect();try{
  await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(20261021,731)');
  const result=id?await client.query('UPDATE iqc SET '+keys.map((k,i)=>k+'=$'+(i+1)).join(',')+' WHERE id=$'+(keys.length+1)+' RETURNING *',[...vals,id]):await client.query('INSERT INTO iqc ('+keys.join(',')+') VALUES ('+keys.map((_,i)=>'$'+(i+1)).join(',')+') RETURNING *',vals);
  if(!result.rows[0])throw Object.assign(Error('수입검사 기록이 없습니다.'),{status:404});
  if(file){await ensure(client);await client.query('INSERT INTO qmes_iqc_attachments(id,iqc_id,name,mime,content,sha256,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),result.rows[0].id,file.name,file.mime,file.bytes,file.hash,String(user||'')]);}
  await client.query('COMMIT');return result;
 }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
}
function install(app,{pool,requireLogin}){
 app.get('/api/qmes/iqc/attachments',requireLogin,async(req,res)=>{try{await ensure(pool);const r=await pool.query('SELECT a.id,a.iqc_id,a.name,a.created_at FROM qmes_iqc_attachments a JOIN iqc i ON i.id=a.iqc_id ORDER BY a.created_at DESC,a.id DESC');res.json({success:true,data:r.rows});}catch(e){res.status(500).json({success:false,message:'수입검사 COA 조회 실패'});}});
 app.get('/api/qmes/iqc/attachments/:id',requireLogin,async(req,res)=>{try{
  await ensure(pool);const r=await pool.query('SELECT a.* FROM qmes_iqc_attachments a JOIN iqc i ON i.id=a.iqc_id WHERE a.id=$1',[req.params.id]),f=r.rows[0];if(!f)return res.status(404).json({success:false,message:'COA 첨부파일이 없습니다.'});
  res.setHeader('Content-Type',f.mime);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','private, no-store');res.setHeader('Content-Security-Policy',"default-src 'none'; sandbox");res.setHeader('Content-Disposition',"inline; filename=COA."+({'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg'}[f.mime]||'bin')+"; filename*=UTF-8''"+encodeURIComponent(f.name));res.send(f.content);
 }catch(e){res.status(500).json({success:false,message:'COA 파일을 열지 못했습니다.'});}});
}
module.exports={write,install};
