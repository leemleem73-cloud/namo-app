'use strict';
// One-time operator-attested completion of missing historical IQC fields.
// Receipt weight is copied with provenance; existing contrary results and holds remain intact.
const KEY='iqc-missing-checks-operator-request-20261105-v1';
const names=['외관','라벨','중량','COA 확인'];
const text=v=>String(v??'').trim();
const canonical=n=>['COA','COA확인'].includes(text(n).replace(/\s/g,'').toUpperCase())?'COA 확인':text(n);
function unpack(v){if(typeof v==='string')try{v=JSON.parse(v);}catch{return null;}return Array.isArray(v)?v:null;}
function values(x){return [x.judge,x.result,x.status,x.value,...(Array.isArray(x.values)?x.values:[]),...(Array.isArray(x.measurements)?x.measurements:[])].map(text).filter(Boolean);}
function contrary(v){return /불합격|부적합|미확인|확인중|보류/.test(v)||['NG','FAIL','HOLD'].includes(v.toUpperCase());}
function plan(row){
 const original=unpack(row.items_json);if(!original||Number(row.fail)>0||contrary(text(row.judge))||original.filter(x=>x.name!=='비고').some(x=>values(x).some(contrary)))return null;
 const items=original.map(x=>({...x})),changes=[];
 const raw=text(row.incoming_qty).replace(/,/g,''),weight=/^\d+(?:\.\d+)?$/.test(raw)&&Number(raw)>0?raw:'';
 for(const name of names){
  let item=items.find(x=>canonical(x.name)===name),created=false;
  if(!item){item={name,values:[],judge:''};items.push(item);created=true;}
  const current=[...(Array.isArray(item.values)?item.values:[]),item.value,...(Array.isArray(item.measurements)?item.measurements:[])].map(text).find(Boolean)||'',next=current||(name==='중량'?weight:name==='COA 확인'?'확인':'적합');
  const positive=name==='중량'?/^\d+(?:\.\d+)?$/.test(next)&&Number(next)>0:['적합','이상없음','정상','확인','확인완료','합격','OK','PASS'].includes(next);
  if(!positive){if(created)items.splice(items.indexOf(item),1);continue;}
  let changed=false;
  if(!current){item.values=[next];item.value=next;changed=true;}
  if(['','대기','선택'].includes(text(item.judge))){item.judge='합격';changed=true;}
  if(changed){item.completionSource=name==='중량'&&!current?'입고 중량 기본설정 이관 · 사용자 확인':'사용자 요청에 따른 기존 빈 항목 보완';changes.push(name);}
 }
 if(!changes.length)return null;
 const required=names.map(n=>items.find(x=>canonical(x.name)===n));
 const complete=required.every(x=>x&&text(x.values?.[0]??x.value)&&x.judge==='합격');
 if(complete){const master=items.find(x=>/판정/.test(text(x.name)));if(master){master.value='합격';master.judge='합격';}else items.push({name:'종합판정',value:'합격',judge:'합격'});}
 return {items,judge:complete?'합격':text(row.judge),changes};
}
async function run(pool,req){
 const client=await pool.connect();try{
 await client.query('BEGIN');
 await client.query('SELECT pg_advisory_xact_lock(20261021,731)');
 await client.query(`CREATE TABLE IF NOT EXISTS qmes_iqc_completion_runs(key text PRIMARY KEY,completed_at timestamptz NOT NULL DEFAULT clock_timestamp(),actor text NOT NULL,count integer NOT NULL);
 CREATE TABLE IF NOT EXISTS qmes_iqc_completion_audit(id bigserial PRIMARY KEY,run_key text NOT NULL,record_id text NOT NULL,actor text NOT NULL,changed_at timestamptz NOT NULL DEFAULT clock_timestamp(),before_record jsonb NOT NULL,after_record jsonb NOT NULL,reason text NOT NULL);`);
 const done=await client.query('SELECT key FROM qmes_iqc_completion_runs WHERE key=$1',[KEY]);if(done.rows.length){await client.query('COMMIT');return;}
 const rows=await client.query("SELECT * FROM iqc WHERE date<='2026-11-05' ORDER BY id FOR UPDATE"),actor=text(req.session?.user?.name||req.session?.user?.id)||'사용자 요청',reason='2026-11-05 사용자 요청: 기존 빈 검사항목 결과 및 판정을 OK로 보완. 중량은 기본설정 입고 중량에서 이관. 실제 측정·승인 일자를 새로 생성하지 않음.';
 let count=0;
 for(const row of rows.rows){const next=plan(row);if(!next)continue;
 await client.query('UPDATE iqc SET items_json=$2::jsonb,judge=$3 WHERE id=$1',[row.id,JSON.stringify(next.items),next.judge]);
 await client.query('INSERT INTO qmes_iqc_completion_audit(run_key,record_id,actor,before_record,after_record,reason) VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)',[KEY,String(row.id),actor,JSON.stringify(row),JSON.stringify({...row,items_json:next.items,judge:next.judge}),reason]);count++;
 }
 await client.query('INSERT INTO qmes_iqc_completion_runs(key,actor,count) VALUES($1,$2,$3)',[KEY,actor,count]);
 await client.query('COMMIT');
 }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error;}finally{client.release();}
}
module.exports={plan,run,KEY};
