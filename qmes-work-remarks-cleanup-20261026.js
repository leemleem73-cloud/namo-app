'use strict';
// Clear only complete auto-generated import notes; preserve user remarks and operational records.
const {Pool}=require('pg');
const patterns=[
 '^2026년 [45]월 원본 작업지시서 이력 등록( · 절연슬러리 제조| [(]원료 투입 자료 확인 필요[)])?$',
 '^원본 작업지시서 이력 등록: [0-9]{4}-[0-9]{2}-[0-9]{2} / (실적 미기재|생산실적 [0-9.]+kg)$'
];
async function clean(){
 if(!process.env.DATABASE_URL)return;
 const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:1});
 try{
  const result=await pool.query(`UPDATE qmes_work_order_documents SET document=jsonb_set(document,'{note}','""'::jsonb,true),updated_at=NOW() WHERE document->>'note' ~ ANY($1::text[])`,[patterns]);
  console.log('[QMES work remarks] removed import boilerplate:',result.rowCount);
 }catch(error){console.error('[QMES work remarks]',error.message);}
 finally{await pool.end().catch(()=>{});}
}
setTimeout(clean,12000);
