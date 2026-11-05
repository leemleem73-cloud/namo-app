const {test}=require('node:test'),assert=require('node:assert/strict');
const {plan,run,KEY}=require('../qmes-iqc-missing-checks-20261105.cjs');
const {PGlite}=require('@electric-sql/pglite');
const row={id:'1',date:'2026-10-15',incoming_qty:'25.000',judge:'합격',fail:0,items_json:[{name:'포장상태',value:'이상없음',judge:'합격'},{name:'외관',value:'이상없음',judge:'합격'},{name:'비고',value:'원래 비고',inspectionDate:'2026-10-16'}],sign_approver:{name:'기존 승인'}};
test('missing four-check data is completed with received mass and explicit provenance without removing historical checks',()=>{
 const result=plan(row);assert.equal(result.judge,'합격');assert.equal(result.items.find(x=>x.name==='중량').values[0],'25.000');assert.ok(result.items.find(x=>x.name==='중량').completionSource.includes('입고 중량'));assert.equal(result.items.find(x=>x.name==='포장상태').value,'이상없음');assert.equal(result.items.find(x=>x.name==='비고').inspectionDate,'2026-10-16');assert.equal(row.items_json.length,3);
 assert.equal(plan({...row,items_json:result.items,judge:result.judge}),null);
});
test('existing contrary or in-progress evidence is never overwritten',()=>{
 for(const item of [{name:'COA 확인',value:'미확인'},{name:'COA 확인',value:'확인중'},{name:'外観',judge:'불합격'},{name:'외관',values:['적합','부적합']}]){
  assert.equal(plan({...row,items_json:[...row.items_json,item]}),null);
 }
 assert.equal(plan({...row,fail:1}),null);assert.equal(plan({...row,judge:'보류'}),null);assert.equal(plan({...row,items_json:'broken'}),null);
});
test('actual saved weight wins over receipt weight; missing receipt mass cannot fabricate an all-pass result',()=>{
 const next=plan({...row,items_json:[...row.items_json,{name:'중량',values:['24.9'],judge:'합격'}]});assert.equal(next.items.find(x=>x.name==='중량').values[0],'24.9');
 const noWeight=plan({...row,incoming_qty:null,judge:'대기'});assert.equal(noWeight.judge,'대기');assert.ok(!noWeight.items.some(x=>x.name==='중량'));
});
test('one-time database run is audited and idempotent; future records and NG remain unchanged',async()=>{
 const db=new PGlite();try{
 await db.exec('CREATE TABLE iqc(id text PRIMARY KEY,date date,incoming_qty numeric,judge text,fail numeric,items_json jsonb);');
 await db.query('INSERT INTO iqc VALUES($1,$2,$3,$4,$5,$6)',[row.id,row.date,row.incoming_qty,row.judge,row.fail,JSON.stringify(row.items_json)]);
 await db.query("INSERT INTO iqc VALUES('bad','2026-10-15',10,'불합격',1,'[]'),('future','2026-12-01',10,'대기',0,'[]')");
 const pool={connect:async()=>({query:(sql,args)=>args?db.query(sql,args):db.exec(sql).then(results=>({rows:results.at(-1)?.rows||[]})),release(){}})};
 await run(pool,{session:{user:{name:'사용자'}}});await run(pool,{session:{user:{name:'사용자'}}});
 const result=await db.query('SELECT * FROM iqc ORDER BY id');assert.equal(result.rows.find(x=>x.id==='1').judge,'합격');assert.equal(result.rows.find(x=>x.id==='bad').items_json.length,0);assert.equal(result.rows.find(x=>x.id==='future').items_json.length,0);
 const audit=await db.query('SELECT * FROM qmes_iqc_completion_audit');assert.equal(audit.rows.length,1);assert.equal(audit.rows[0].before_record.items_json.length,3);assert.ok(audit.rows[0].reason.includes('사용자 요청'));assert.equal((await db.query('SELECT key FROM qmes_iqc_completion_runs')).rows[0].key,KEY);
 }finally{await db.close();}
});

test('summary lists all saved checks rather than filtering to packaging and appearance',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),src=(()=>{const s=fs.readFileSync(__dirname+'/../public/js/qmes-iqc-pqc-layout-20261021.js','utf8');return s.slice(s.indexOf('/* Summarize actual saved'));})(),ctx={window:{iqcItemSummary(){}}};vm.runInNewContext(src,ctx);
 const s=ctx.window.iqcItemSummary({items_json:[{name:'외관'},{name:'라벨'},{name:'중량'},{name:'COA 확인'},{name:'비고'},{name:'종합판정'}]});assert.equal(s,'외관 / 라벨 / 중량 / COA 확인');
 assert.equal(ctx.window.iqcItemSummary({items_json:[{name:'<bad>'}]}),'&lt;bad&gt;');
});
test('only IQC reads run the correction, before selecting returned rows',async()=>{
 const vm=require('node:vm'),fs=require('node:fs'),src=(()=>{const s=fs.readFileSync(__dirname+'/../server-legacy-20260903.js','utf8'),a=s.indexOf('app.get(`/api/${table}`');return s.slice(a,s.indexOf('  app.post(`/api/${table}`',a));})();
 for(const table of ['iqc','pqc']){let handler;const calls=[];const ctx={table,app:{get(path,...f){handler=f.at(-1);}},requireLogin(){},pool:{},require:()=>({run:async()=>calls.push('complete')}),db:async()=>{calls.push('read');return{rows:[]}},ok(){},fail(){throw Error('route failure')}};vm.runInNewContext(src,ctx);await handler({},{});assert.deepEqual(calls,table==='iqc'?['complete','read']:['read']);}
});
