'use strict';
const {randomUUID}=require('crypto');
module.exports.install=function(app,{pool,requireLogin,auditLog}){
 let ready;
 function schema(){return ready||(ready=pool.query('CREATE TABLE IF NOT EXISTS qmes_standard_documents (id TEXT PRIMARY KEY,document JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())').then(()=>pool.query('ALTER TABLE qmes_standard_documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ')).catch(e=>{ready=null;throw e;}));}
 const statuses=['대기','진행','완료'];
 const MAX_FILES=10,MAX_BYTES=5*1024*1024;
 function publicDocument(record){
  if(!record)return record;
  return {...record,attachments:(record.attachments||[]).map(({id,name,type,size})=>({id,name,type,size}))};
 }
 function attachmentList(requested,previous=[]){
  if(requested===undefined)return previous;
  if(!Array.isArray(requested)||requested.length>MAX_FILES)throw Object.assign(Error('첨부파일은 최대 10개까지 등록할 수 있습니다.'),{status:400});
  const files=requested.map(file=>{
   if(file.id){const stored=previous.find(old=>old.id===String(file.id));if(!stored)throw Object.assign(Error('기존 첨부파일을 확인할 수 없습니다.'),{status:400});return stored;}
   const name=String(file.name||'').split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,255);
   const data=String(file.data||'');
   if(!name||!data||data.length>7*1024*1024||!/^[A-Za-z0-9+/]+={0,2}$/.test(data))throw Object.assign(Error('첨부파일 데이터를 확인해 주세요.'),{status:400});
   const bytes=Buffer.from(data,'base64');
   if(!bytes.length||bytes.length>MAX_BYTES)throw Object.assign(Error('첨부파일 전체 용량은 5MB 이하여야 합니다.'),{status:400});
   return {id:randomUUID(),name,type:String(file.type||'application/octet-stream').slice(0,120),size:bytes.length,data:bytes.toString('base64')};
  });
  if(files.reduce((sum,file)=>sum+file.size,0)>MAX_BYTES)throw Object.assign(Error('첨부파일 전체 용량은 5MB 이하여야 합니다.'),{status:400});
  return files;
 }

 function normalize(body){
  const record={};
  for(const key of ['documentNo','name','category','revision','revisionDate','department','status','note'])record[key]=String(body?.[key]??'').trim();
  if(!record.documentNo||!record.name)throw Object.assign(Error('문서번호와 문서명을 입력해 주세요.'),{status:400});
  if(!statuses.includes(record.status))throw Object.assign(Error('문서 상태를 선택해 주세요.'),{status:400});
  if(record.revisionDate&&!/^\d{4}-\d{2}-\d{2}$/.test(record.revisionDate))throw Object.assign(Error('개정일을 확인해 주세요.'),{status:400});
  return record;
 }
 app.get('/api/qmes/standard-documents',requireLogin,async(req,res)=>{
  try{await schema();const result=await pool.query('SELECT id,document,updated_at FROM qmes_standard_documents WHERE deleted_at IS NULL ORDER BY updated_at DESC,id');res.json({success:true,data:result.rows.map(r=>({...publicDocument(r.document),id:r.id,updatedAt:r.updated_at}))});}
  catch(e){res.status(500).json({success:false,message:'문서 목록 조회 실패: '+e.message});}
 });

 app.get('/api/qmes/standard-documents/:id/attachments/:attachmentId',requireLogin,async(req,res)=>{
  try{
   await schema();
   const found=await pool.query('SELECT document FROM qmes_standard_documents WHERE id=$1 AND deleted_at IS NULL',[req.params.id]);
   const file=found.rows[0]?.document?.attachments?.find(value=>value.id===req.params.attachmentId);
   if(!file)return res.status(404).json({success:false,message:'첨부파일을 찾을 수 없습니다.'});
   const bytes=Buffer.from(file.data,'base64');
   res.setHeader('Content-Type','application/octet-stream');
   res.setHeader('Content-Disposition',"attachment; filename*=UTF-8''"+encodeURIComponent(file.name));
   res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','private, no-store');
   res.send(bytes);
  }catch(e){res.status(500).json({success:false,message:'첨부파일 다운로드 실패'});}
 });

 async function save(req,res){
  try{
   const record=normalize(req.body);await schema();
   const id=req.params.id||randomUUID();let before=null;
   if(req.params.id){const found=await pool.query('SELECT document FROM qmes_standard_documents WHERE id=$1 AND deleted_at IS NULL',[id]);if(!found.rows.length)return res.status(404).json({success:false,message:'수정할 문서를 찾을 수 없습니다.'});before=found.rows[0].document;}
   record.attachments=attachmentList(req.body?.attachments,before?.attachments||[]);
   const duplicate=await pool.query("SELECT id FROM qmes_standard_documents WHERE document->>'documentNo'=$1 AND document->>'revision'=$2 AND id<>$3 AND deleted_at IS NULL",[record.documentNo,record.revision,id]);
   if(duplicate.rows.length)return res.status(409).json({success:false,message:'같은 문서번호와 Rev.가 이미 등록되어 있습니다.'});
   const saved={...record,id,updatedBy:req.session.user.name||''};
   if(req.params.id)await pool.query('UPDATE qmes_standard_documents SET document=$2::jsonb,updated_at=NOW() WHERE id=$1',[id,JSON.stringify(saved)]);
   else await pool.query('INSERT INTO qmes_standard_documents(id,document) VALUES($1,$2::jsonb)',[id,JSON.stringify(saved)]);
   await auditLog(req,req.params.id?'UPDATE':'CREATE','qmes_standard_documents',id,publicDocument(before),publicDocument(saved));
   res.json({success:true,data:publicDocument(saved)});
  }catch(e){res.status(e.status||500).json({success:false,message:e.message||'문서 저장 실패'});}
 }

 app.post('/api/qmes/standard-documents/delete-selected',requireLogin,async(req,res)=>{
  const ids=[...new Set((Array.isArray(req.body?.ids)?req.body.ids:[]).map(value=>String(value).trim()).filter(Boolean))];
  if(!ids.length||ids.length>500)return res.status(400).json({success:false,message:'삭제할 문서를 선택해 주세요.'});
  try{
   await schema();
   const result=await pool.query('UPDATE qmes_standard_documents SET deleted_at=NOW(),updated_at=NOW() WHERE id=ANY($1::text[]) AND deleted_at IS NULL RETURNING id,document',[ids]);
   for(const row of result.rows)await auditLog(req,'DELETE','qmes_standard_documents',row.id,publicDocument(row.document),{...publicDocument(row.document),deleted:true});
   res.json({success:true,data:{ids:result.rows.map(row=>row.id),count:result.rows.length}});
  }catch(e){res.status(500).json({success:false,message:'문서 삭제 실패: '+e.message});}
 });
 app.post('/api/qmes/standard-documents',requireLogin,save);
 app.put('/api/qmes/standard-documents/:id',requireLogin,save);
};
