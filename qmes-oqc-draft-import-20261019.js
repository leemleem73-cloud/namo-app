'use strict';
// Explicitly user-requested, idempotent OQC drafts from monthly measurement DATA.
// Never claim shipment, pass judgement, or overwrite existing inspection records.
const {Pool}=require('pg');
const source=[["DBJ0601","2026-10-06",[[7.44,7.449,7.432],[1555,1548,1558],[19.96,19.93,19.95]]],["DBJ1501","2026-10-15",[[9.378,9.404,9.707],[1162,1178,1169],[20.98,20.94,21.04]]],["DBH1901","2026-08-19",[[7.49,7.485,7.496],[1498,1498,1493],[20.1259118617,20.2242691229,20.2017175954]]],["DBF2401","2026-06-24",[[7.366,7.386,7.384],[1164,1145,null],[19.75,19.65,19.64]]],["DBF2501","2026-06-25",[[7.386,7.362,7.389],[1318,1267,1300],[20.12012,20.1,20.1]]],["DBE0601","2026-05-06",[[7.005,7.046,7.012],[1500,1490,1490],[19.44417,19.57217,19.4511]]],["DBE0801","2026-05-08",[[7.233,7.234,7.235],[1482,1537,1504],[19.903,20.134,19.742]]],["DBE1201","2026-05-12",[[7.266,7.267,7.269],[1517,1490,1543],[19.834,20.142,19.951]]],["DBE2001","2026-05-20",[[7.297,7.298,7.3],[1494,1514,1536],[20.036,19.869,20.311]]],["DBE2101","2026-05-21",[[7.328,7.329,7.33],[1483,1510,1542],[19.907,20.131,19.748]]],["DBE2201","2026-05-22",[[7.358,7.359,7.36],[1518,1492,1540],[19.841,20.156,19.972]]],["DBE2601","2026-05-26",[[7.327,7.339,7.339],[1490,1519,1544],[20.028,19.874,20.319]]],["DBD0201","2026-04-02",[[7.338,7.322,7.317],[1470,1470,1445],[19.99207,20.02391,19.99006]]],["DBD0801","2026-04-08",[[7.312,7.345,7.388],[1487,1512,1498],[20.053,20.187,19.915]]],["DBD1001","2026-04-10",[[7.257,7.254,7.289],[1494,1527,1483],[20.031,19.917,19.986]]],["DBD1401","2026-04-14",[[7.202,7.208,7.201],[1469,1484,1492],[19.914,19.967,19.835]]],["DBD1501","2026-04-15",[[7.203,7.208,7.214],[1500,1480,1490],[20.157,19.947,19.818]]],["DBD1701","2026-04-17",[[7.313,7.396,7.369],[1502,1498,1511],[20.337,20.258,19.936]]],["DBD2001","2026-04-20",[[7.381,7.382,7.375],[1540,1520,1520],[20.16706,20.22663,20.26085]]],["DBD2101","2026-04-21",[[7.201,7.202,7.204],[1506,1513,1496],[19.942,19.927,20.333]]],["DBD3001","2026-04-30",[[7.515,7.521,7.535],[1410,1410,1430],[19.70635,19.66967,19.69015]]]];
async function importDrafts(){
 if(!process.env.DATABASE_URL)return;
 const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:1});let c;
 try{
  c=await pool.connect();await c.query('BEGIN');
  const tables=await c.query("SELECT to_regclass('public.qmes_sync_records') AS sync,to_regclass('public.qmes_work_order_documents') AS wo");
  if(!tables.rows[0].sync||!tables.rows[0].wo){await c.query('ROLLBACK');return;}
  let added=0,skipped=0;
  for(const [lot,date,sets] of source){
   const wo=await c.query("SELECT document FROM qmes_work_order_documents WHERE document->'fields'->>'생산 LOT NO'=$1 LIMIT 1",[lot]);
   if(!wo.rowCount){skipped++;continue;}
   const existing=await c.query("SELECT 1 FROM qmes_sync_records WHERE record_type='oqc' AND (record_key=$1 OR payload::text LIKE $2) LIMIT 1",['draft-monthly-'+lot,'%\"lot\": \"'+lot+'\"%']);
   if(existing.rowCount){skipped++;continue;}
   const f=wo.rows[0].document.fields||{};
   const product=String(f['제품명']||'').trim();
   if(product!=='NBA20HM05'){skipped++;continue;}
   const groupId='OQC-DRAFT-'+lot;
   const names=['외관','입도(Dmax)','점도','고형분','접착력','절연저항','수분','전해액 안정성'];
   const values=[[],sets[0],sets[1],sets[2],[],[],[],[]];
   const rows=names.map((check,i)=>{
    const measurements=(values[i]||[]).filter(v=>v!==null&&v!==undefined).map(String);
    return {id:groupId+'-'+(i+1),groupId,date,shipDate:'',time:'',lot,product,check,
      customer:String(f['고객사']||''),shipQty:'',destination:'',value:measurements.join(' / '),
      measurements,average:measurements.length===3?measurements.reduce((a,b)=>a+Number(b),0)/3:null,
      judge:'검토필요',note:'공정검사 월간 측정 DATA 참조 / 출하검사 미확정',remarks:'임시기록: 출하일자·수량·검사자·판정 확인 필요',inspector:''};
   });
   const payload={mode:'OQC',lotNo:lot,rows,savedAt:new Date().toISOString(),savedBy:'QMES 측정 DATA 임시등록',draft:true,source:'월간 측정DATA_26.10.15'};
   const inserted=await c.query("INSERT INTO qmes_sync_records(record_type,record_key,payload,updated_by) VALUES('oqc',$1,$2::jsonb,$3) ON CONFLICT DO NOTHING",['draft-monthly-'+lot,JSON.stringify(payload),'QMES draft import']);
   added+=inserted.rowCount;
  }
  await c.query('COMMIT');console.log('[QMES OQC DRAFT] inserted',added,'skipped',skipped);
 }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});console.error('[QMES OQC DRAFT]',e.message);}finally{if(c)c.release();await pool.end().catch(()=>{});}
}
setTimeout(importDrafts,18000);
