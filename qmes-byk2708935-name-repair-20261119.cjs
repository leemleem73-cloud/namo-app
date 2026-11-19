'use strict';
const REPAIR_KEY='20261119:WO-20260819-001:2708935';
function correctDocument(before){
 if(before?.fields?.['작업지시번호']!=='WO-20260819-001'||!Array.isArray(before.materials))throw Error('정정 대상 작업지시서가 아닙니다.');
 const indices=before.materials.map((row,index)=>({row,index})).filter(({row})=>String(row.name||'').trim()==='AOH30'&&String(row.lot||'').trim()==='2708935');
 if(indices.length!==1)throw Error('정정할 원료 행을 단일 건으로 확인하지 못했습니다.');
 const after=JSON.parse(JSON.stringify(before)),index=indices[0].index;
 after.materials[index].name='BYK180';after.materials[index].sourceName='BYK180';
 return after;
}
async function run(pool){
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock($1,$2)',[20261119,2708935]);
  const prior=await client.query("SELECT 1 FROM audit_logs WHERE action='REPAIR_MATERIAL_NAME' AND after_data->>'repairKey'=$1 LIMIT 1",[REPAIR_KEY]);
  if(prior.rowCount){await client.query('COMMIT');return {state:'already-applied'};}
  const found=await client.query(`SELECT id,document FROM qmes_work_order_documents d WHERE document#>>'{fields,작업지시번호}'=$1 AND NOT EXISTS(SELECT 1 FROM qmes_work_order_deletions x WHERE x.id=d.id) FOR UPDATE`,['WO-20260819-001']);
  if(found.rowCount!==1)throw Error('정정 대상 작업지시서를 단일 건으로 확인하지 못했습니다.');
  const {id,document:before}=found.rows[0],after=correctDocument(before);
  await client.query("SELECT set_config('qmes.authorized_material_correction',$1,true)",[REPAIR_KEY]);
  const changed=await client.query('UPDATE qmes_work_order_documents SET document=$2::jsonb,updated_at=NOW() WHERE id=$1 AND document=$3::jsonb RETURNING id',[id,JSON.stringify(after),JSON.stringify(before)]);
  if(changed.rowCount!==1)throw Error('정정 중 작업지시서가 변경되었습니다.');
  await client.query(`INSERT INTO audit_logs(user_name,action,target_table,target_id,before_data,after_data)
   VALUES($1,'REPAIR_MATERIAL_NAME','qmes_work_order_documents',$2,$3::jsonb,$4::jsonb)`,['사용자 확인 원료명 정정',id,JSON.stringify(before),JSON.stringify({repairKey:REPAIR_KEY,reason:'사용자 확인: 실제 투입 원료는 분산제(BYK180), LOT 2708935. 기존 투입량과 다른 입력값 유지.',document:after})]);
  await client.query('COMMIT');return {state:'applied',record:id};
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
module.exports={REPAIR_KEY,correctDocument,run};
