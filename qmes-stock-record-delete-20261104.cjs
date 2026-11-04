'use strict';
const kinds={raw:{prefix:'material-stock:v1:',module:'materialStock'},finished:{prefix:'finished-stock:v1:',module:'finishedStock'}};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const stable=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(stable).join(',')+']':'{'+Object.keys(v).filter(k=>!['updatedAt','updatedBy'].includes(k)).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
const endpoint='/api/qmes-sync/inventory/delete-entry';
function createHandler({pool,auditLog}={}){
 if(!pool?.connect)throw TypeError('Inventory deletion requires a database pool.');
 return async function deleteStockEntry(req,res){
  const fail=(status,message)=>res.status(status).json({success:false,message}),user=req.session?.user;
  if(!user?.id)return fail(401,'로그인이 필요합니다.');
  const {kind,id,expectedEntry}=req.body||{},config=typeof kind==='string'&&Object.hasOwn(kinds,kind)?kinds[kind]:null;
  if(!config||typeof id!=='string'||!id.trim()||id.length>200||!object(expectedEntry)||expectedEntry.id!==id)return fail(400,'삭제할 사용 기록을 확인해주세요.');
  const recordKey=config.prefix+id;let client,transaction=false;
  try{
   client=await pool.connect();await client.query('BEGIN');transaction=true;
   await client.query("SET LOCAL lock_timeout = '5s'");await client.query("SET LOCAL statement_timeout = '10s'");
   const found=await client.query("SELECT payload FROM qmes_sync_records WHERE record_type='inventory' AND record_key=$1 FOR UPDATE",[recordKey]);
   if(!found.rows.length)throw Object.assign(Error('사용 기록을 찾지 못했습니다. 새로고침 후 확인해주세요.'),{status:404});
   let payload=found.rows[0].payload;if(typeof payload==='string')payload=JSON.parse(payload);
   const entry=payload?.entry;if(!object(payload)||payload.module!==config.module||!object(entry)||entry.id!==id)throw Object.assign(Error('선택한 사용 기록의 원본을 확인할 수 없습니다.'),{status:409});
   if(entry.deletedAt){await client.query('COMMIT');transaction=false;return res.json({success:true,data:{recordKey,deleted:false,alreadyDeleted:true}});}
   if(stable(entry)!==stable(expectedEntry))throw Object.assign(Error('다른 화면에서 사용 기록이 변경되었습니다. 새로고침 후 다시 삭제해주세요.'),{status:409});
   const now=new Date().toISOString(),name=String(user.name||user.email||user.id),next={...payload,entry:{...entry,status:'cancelled',previousStatus:entry.status,deletedAt:now,deletedBy:name,deletedByUserId:String(user.id),updatedAt:now}};
   await client.query("UPDATE qmes_sync_records SET payload=$2::jsonb,updated_by=$3,updated_at=NOW() WHERE record_type='inventory' AND record_key=$1",[recordKey,JSON.stringify(next),name]);
   await client.query('COMMIT');transaction=false;
   if(typeof auditLog==='function')try{await auditLog(req,'DELETE','qmes_sync_records','inventory:'+recordKey,payload,next);}catch(error){console.warn('[Stock record deletion audit]',error.message);}
   return res.json({success:true,data:{recordKey,deleted:true},message:'사용 기록을 삭제했습니다.'});
  }catch(error){if(transaction)await client.query('ROLLBACK').catch(()=>{});return fail(error.status||500,error.status?error.message:'삭제 결과를 확인하지 못했습니다. 새로고침 후 기록을 확인해주세요.');}
  finally{client?.release();}
 };
}
function install(app,options){if(app.__qmesStockRecordDelete20261104)return;app.__qmesStockRecordDelete20261104=true;const handler=createHandler(options);app.post(endpoint,...(typeof options.requireLogin==='function'?[options.requireLogin,handler]:[handler]));}
module.exports={endpoint,kinds,createHandler,install};
