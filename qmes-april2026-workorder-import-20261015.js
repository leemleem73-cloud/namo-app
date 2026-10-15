'use strict';
const {Pool}=require('pg');
const rows=[["0402","",150],["0408","DBD0801",140],["0410","DBD1001",150],["0414","DBD1401",20],["0415","DBD1501",42],["0415","DBD1501",62],["0417","DBD1701",20],["0420","DBD2001",20],["0421","DBD2101",80],["0421","DBD2102",20],["0430","DBD3001",20]];
const quantities={"0402":[34.67704571428574,0.6233142857142856,21.816,24.14304,35.2086,33.532],"0408":[29.875,0.571,19.979,23.283,33.954,32.338],"0410":[28.769,0.603,21.105,25.869,37.725,35.929],"0414":[3.836,0.08,2.814,3.449,5.03,4.791],"0415-42":[9.35,0.078,5.98,6.91,10.08,9.6],"0415-62":[13.14,0.114,8.76,10.39,15.16,14.43],"0417":[3.836,0.08,2.814,3.449,5.03,4.791],"0420":[3.836,0.08,2.814,3.449,5.03,4.791],"0421-80":[16.96,0.147,11.3,13.41,19.56,18.62],"0421-20":[3.836,0.08,2.814,3.449,5.03,4.791],"0430":[3.836,0.08,2.814,3.449,5.03,4.791]};
const actuals={"0415-42":[9.4,0.079,6,6.9,10.1,9.6],"0415-62":[13.1,0.114,8.8,10.4,15.2,14.4],"0421-80":[17,0.147,11.3,13.4,19.6,18.6]};
const materialNames=['NMP','BYK180','AOH30','SBS','PVdF','SBR'];
const db=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:1});
async function run(){
 if(!process.env.DATABASE_URL)return;
 let c;try{
 c=await db.connect();await c.query('BEGIN');
 await c.query('CREATE TABLE IF NOT EXISTS qmes_work_order_documents(id TEXT PRIMARY KEY,document JSONB NOT NULL,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW())');
 await c.query('CREATE TABLE IF NOT EXISTS qmes_work_order_deletions(id TEXT PRIMARY KEY,deleted_at TIMESTAMPTZ DEFAULT NOW())');
 let count=0;
 for(const [day,lot,qty] of rows){
  const date='2026-'+day.slice(0,2)+'-'+day.slice(2);
  const seq=day==='0415'&&qty===62?'002':day==='0421'&&lot==='DBD2102'?'002':'001';
  const id='WO-2026'+day+'-'+seq;
  const doc={id,workDate:date,productionType:'일반',fields:{'작업지시번호':id,'고객사':'현대자동차','제품명':'NBA20HM05','생산 LOT NO':lot,'설비명':'HSM','작업자':'대리 박도훈, 주임 문지훈','계획수량':String(qty),'작업기간':date+' ~ '+date,'진행상태':'완료'},materials:(quantities[day+'-'+qty]||quantities[day]||[]).map((v,i)=>({name:materialNames[i],lot:'',plan:String(v),actual:actuals[day+'-'+qty]?.[i]==null?'':String(actuals[day+'-'+qty][i])})),note:'2026년 4월 원본 작업지시서 이력 등록 (원료 투입 자료 확인 필요)'};
  await c.query("UPDATE qmes_work_order_documents SET document=jsonb_set(document,'{materials}',$2::jsonb,true),updated_at=NOW() WHERE id=$1 AND document->>'note' LIKE '2026년 4월 원본%' AND jsonb_typeof(document->'materials')='array' AND jsonb_array_length(document->'materials')=0",[id,JSON.stringify(doc.materials)]);
  await c.query("UPDATE qmes_work_order_documents SET document=jsonb_set(jsonb_set(document,'{fields,작업자}',to_jsonb($2::text),true),'{fields,진행상태}',to_jsonb($3::text),true),updated_at=NOW() WHERE id=$1 AND document->>'note' LIKE '2026년 4월 원본%' AND NOT EXISTS(SELECT 1 FROM qmes_work_order_deletions WHERE id=$1)",[id,'대리 박도훈, 주임 문지훈','완료']);
  const result=await c.query("INSERT INTO qmes_work_order_documents(id,document) SELECT $1,$2::jsonb WHERE NOT EXISTS(SELECT 1 FROM qmes_work_order_deletions WHERE id=$1) AND NOT EXISTS(SELECT 1 FROM qmes_work_order_documents WHERE document->>'workDate'=$3 AND document->'fields'->>'생산 LOT NO'=$4 AND document->'fields'->>'계획수량'=$5) ON CONFLICT(id) DO NOTHING",[id,JSON.stringify(doc),date,lot,String(qty)]);
  count+=result.rowCount||0;
 }
 await c.query('COMMIT');console.log('[QMES APRIL] inserted '+count);
 }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});console.error('[QMES APRIL]',e.message)}
 finally{if(c)c.release();await db.end().catch(()=>{})}
}
setTimeout(run,4000);
