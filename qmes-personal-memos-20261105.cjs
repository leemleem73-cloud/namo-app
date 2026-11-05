'use strict';
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const palettes=['yellow','white','blue','pink','green'],fonts=['default','gothic','serif'],sizes=[12,14,16,18];
function appearance(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Object.assign(Error('메모 양식을 확인해 주세요.'),{status:400});
 const result={paper:value.paper||'white',font:value.font||'default',size:value.size??14,bold:value.bold??false};
 if(!palettes.includes(result.paper)||!fonts.includes(result.font)||!sizes.includes(result.size)||typeof result.bold!=='boolean')throw Object.assign(Error('메모 색상과 글자 양식을 확인해 주세요.'),{status:400});
 return result;
}
function parse(body){
 if(!body||!uuid.test(body.id||'')||typeof body.title!=='string'||body.title.length>100||typeof body.content!=='string'||body.content.length>5000||typeof body.pinned!=='boolean'||!Number.isSafeInteger(body.version)||body.version<0)throw Object.assign(Error('메모 내용을 확인해 주세요. 제목 100자, 내용 5,000자까지 입력할 수 있습니다.'),{status:400});
 return {id:body.id.toLowerCase(),title:body.title.trim(),content:body.content,pinned:body.pinned,version:body.version,appearance:body.appearance==null?null:appearance(body.appearance)};
}
function install(app,{pool,requireLogin}){
 let schema;
 const ready=()=>schema||(schema=pool.query(`CREATE TABLE IF NOT EXISTS qmes_personal_memos(user_id text NOT NULL,id text NOT NULL,title text NOT NULL DEFAULT '',content text NOT NULL DEFAULT '',pinned boolean NOT NULL DEFAULT false,appearance jsonb NOT NULL DEFAULT '{}',version integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),deleted_at timestamptz,PRIMARY KEY(user_id,id))`).then(()=>pool.query("ALTER TABLE qmes_personal_memos ADD COLUMN IF NOT EXISTS appearance jsonb NOT NULL DEFAULT '{}'::jsonb")).catch(e=>{schema=null;throw e;}));
 const columns='id,title,content,pinned,appearance,version,created_at,updated_at';
 const owner=req=>String(req.session?.user?.id||'');
 const guard=(req,res)=>{const id=owner(req);if(!id){res.status(401).json({success:false,message:'로그인이 필요합니다.'});return null;}return id;};
 const fail=(res,error)=>{if(!error.status)console.error('[personal memo]',error.code||'storage error');res.status(error.status||500).json({success:false,message:error.status?error.message:'메모를 저장하지 못했습니다. 내용을 유지한 채 다시 시도해 주세요.'});};
 app.get('/api/personal-memos',requireLogin,async(req,res)=>{
  const userId=guard(req,res);if(!userId)return;
  try{await ready();const result=await pool.query('SELECT '+columns+' FROM qmes_personal_memos WHERE user_id=$1 AND deleted_at IS NULL ORDER BY pinned DESC,updated_at DESC',[userId]);res.setHeader('Cache-Control','private, no-store');res.json({success:true,data:{ownerId:userId,notes:result.rows}});}catch(e){fail(res,e);}
 });
 app.post('/api/personal-memos',requireLogin,async(req,res)=>{
  const userId=guard(req,res);if(!userId)return;
  try{
   if(String(req.body?.ownerId||'')!==userId)throw Object.assign(Error('로그인 계정이 변경되었습니다. 메모를 다시 열어 주세요.'),{status:403});
   const memo=parse(req.body);await ready();
   let result;
   if(memo.version===0)result=await pool.query(`INSERT INTO qmes_personal_memos(user_id,id,title,content,pinned,appearance) VALUES($1,$2,$3,$4,$5,$6::jsonb) ON CONFLICT(user_id,id) DO NOTHING RETURNING `+columns,[userId,memo.id,memo.title,memo.content,memo.pinned,JSON.stringify(memo.appearance||appearance())]);
   else result=await pool.query(`UPDATE qmes_personal_memos SET title=$3,content=$4,pinned=$5,appearance=coalesce($7::jsonb,appearance),version=version+1,updated_at=now() WHERE user_id=$1 AND id=$2 AND version=$6 AND deleted_at IS NULL RETURNING `+columns,[userId,memo.id,memo.title,memo.content,memo.pinned,memo.version,memo.appearance?JSON.stringify(memo.appearance):null]);
   let saved=result.rows[0];
   if(!saved){
    const current=await pool.query('SELECT '+columns+',deleted_at FROM qmes_personal_memos WHERE user_id=$1 AND id=$2',[userId,memo.id]);const row=current.rows[0];
    if(row&&!row.deleted_at&&row.title===memo.title&&row.content===memo.content&&row.pinned===memo.pinned&&(!memo.appearance||JSON.stringify(appearance(row.appearance||{}))===JSON.stringify(memo.appearance)))saved=row;
    else throw Object.assign(Error('다른 창에서 변경되거나 삭제된 메모입니다. 현재 내용을 복사한 뒤 메모를 다시 열어 주세요.'),{status:409});
   }
   res.setHeader('Cache-Control','private, no-store');res.json({success:true,data:saved});
  }catch(e){fail(res,e);}
 });
 app.post('/api/personal-memos/delete',requireLogin,async(req,res)=>{
  const userId=guard(req,res);if(!userId)return;
  try{
   if(String(req.body?.ownerId||'')!==userId)throw Object.assign(Error('로그인 계정이 변경되었습니다. 메모를 다시 열어 주세요.'),{status:403});
   const id=String(req.body?.id||'').toLowerCase(),version=req.body?.version;
   if(!uuid.test(id)||!Number.isSafeInteger(version)||version<1)throw Object.assign(Error('삭제할 메모를 확인해 주세요.'),{status:400});
   await ready();
   const result=await pool.query('UPDATE qmes_personal_memos SET deleted_at=now(),updated_at=now(),version=version+1 WHERE user_id=$1 AND id=$2 AND version=$3 AND deleted_at IS NULL RETURNING id',[userId,id,version]);
   if(!result.rows.length){const existing=await pool.query('SELECT deleted_at FROM qmes_personal_memos WHERE user_id=$1 AND id=$2',[userId,id]);if(!existing.rows[0]?.deleted_at)throw Object.assign(Error('메모가 변경되었거나 없습니다. 다시 불러온 뒤 삭제해 주세요.'),{status:409});}
   res.json({success:true});
  }catch(e){fail(res,e);}
 });
}
module.exports={parse,appearance,install};
