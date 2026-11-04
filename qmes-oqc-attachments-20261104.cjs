'use strict';
const {randomUUID,createHash}=require('node:crypto');
const invalid=m=>Object.assign(Error(m),{status:400});
function validate(file){
 if(file===undefined||file===null)return null;
 if(!file||typeof file.name!=='string'||file.name.length>200||!file.name.trim()||typeof file.base64!=='string'||file.base64.length>7000000)throw invalid('COA 파일을 확인해 주세요.');
 if(!/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64))throw invalid('COA 파일 형식이 올바르지 않습니다.');
 const bytes=Buffer.from(file.base64,'base64');
 if(!bytes.length||bytes.length>5*1024*1024||bytes.toString('base64')!==file.base64)throw invalid('COA 파일은 5MB 이하로 첨부해 주세요.');
 let mime,ext;
 if(bytes.subarray(0,5).toString()==='%PDF-'){mime='application/pdf';ext='pdf';}
 else if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){mime='image/png';ext='png';}
 else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255){mime='image/jpeg';ext='jpg';}
 else throw invalid('COA는 PDF, JPG, PNG 파일로 첨부해 주세요.');
 if(!new RegExp('\\.'+(ext==='jpg'?'jpe?g':ext)+'$','i').test(file.name))throw invalid('COA 파일 확장자와 내용을 확인해 주세요.');
 return {name:file.name.replace(/[\\/\r\n\x00-\x1f]/g,'_').trim(),mime,bytes,hash:createHash('sha256').update(bytes).digest('hex')};
}
async function ensure(db){await db.query(`CREATE TABLE IF NOT EXISTS qmes_oqc_attachments(id text PRIMARY KEY,sources jsonb NOT NULL,name text NOT NULL,mime text NOT NULL,content bytea NOT NULL,sha256 text NOT NULL,created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`);}
async function save(db,sources,input,user){
 const file=validate(input);if(!file)return null;
 await ensure(db);
 const id=randomUUID();
 await db.query('INSERT INTO qmes_oqc_attachments(id,sources,name,mime,content,sha256,created_by) VALUES($1,$2::jsonb,$3,$4,$5,$6,$7)',[id,JSON.stringify(sources.map(t=>({recordKey:t.recordKey,rowId:t.rowId}))),file.name,file.mime,file.bytes,file.hash,String(user||'')]);
 return {id,name:file.name};
}
function install(app,{pool,requireLogin}){
 app.get('/api/qmes/oqc/attachments',requireLogin,async(req,res)=>{
  try{await ensure(pool);const r=await pool.query('SELECT id,sources,name,created_at FROM qmes_oqc_attachments ORDER BY created_at DESC,id DESC');res.json({success:true,data:r.rows});}
  catch(e){res.status(500).json({success:false,message:'COA 첨부파일을 불러오지 못했습니다.'});}
 });
 app.get('/api/qmes/oqc/attachments/:id',requireLogin,async(req,res)=>{
  try{
   await ensure(pool);
   const r=await pool.query(`SELECT a.* FROM qmes_oqc_attachments a WHERE id=$1 AND EXISTS(SELECT 1 FROM jsonb_array_elements(a.sources) s JOIN qmes_sync_records r ON r.record_type='oqc' AND r.record_key=s->>'recordKey' CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(r.payload->'rows')='array' THEN r.payload->'rows' ELSE '[]'::jsonb END) item WHERE coalesce(r.payload->>'deleted','false')<>'true' AND item->>'id'=s->>'rowId')`,[req.params.id]);
   const file=r.rows[0];if(!file)return res.status(404).json({success:false,message:'COA 첨부파일이 없습니다.'});
   res.setHeader('Content-Type',file.mime);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','private, no-store');
   res.setHeader('Content-Security-Policy',"default-src 'none'; sandbox");
   res.setHeader('Content-Disposition',"inline; filename=COA."+({ 'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg'}[file.mime]||'bin')+"; filename*=UTF-8''"+encodeURIComponent(file.name));
   res.send(file.content);
  }catch(e){res.status(500).json({success:false,message:'COA 파일을 열지 못했습니다.'});}
 });
}
module.exports={validate,save,install};
