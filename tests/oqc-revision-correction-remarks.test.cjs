const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const correction=require('../qmes-oqc-revision-correction-20261105.cjs'),rules=require('../public/js/qmes-oqc-rules-20261019.js'),core=require('../public/js/qmes-oqc-revision-core-20261104.js');
const clone=v=>JSON.parse(JSON.stringify(v));
function fixture(fail=false){
 const row=(lot,date,revision)=>({id:lot,lot,date,product:'NBA20HM05',revision,modifiedAt:'2026-11-05T00:51:00Z',modifiedBy:'담당자',measurements:['1140','1500','1500'],remarks:'승인하 출하'});
 let db={records:{a:{rows:[row('DBJ1501','2026-10-15',3),row('DBJ2101','2026-10-21',1),row('DBJ0601','2026-10-06',1)]}},markers:{}},working,queries=0;
 const client={release(){},async query(sql,args=[]){queries++;
 if(sql==='BEGIN'){working=clone(db);return {rows:[]};}if(sql==='COMMIT'){db=working;return {rows:[]};}if(sql==='ROLLBACK'){working=null;return {rows:[]};}
 if(sql.startsWith('SET ')||sql.startsWith('CREATE TABLE')||sql.includes('pg_advisory'))return {rows:[]};
 if(sql.startsWith('SELECT 1'))return {rows:working.markers[args[0]]?[{}]:[]};
 if(sql.startsWith('SELECT record_key'))return {rows:Object.entries(working.records).filter(([k,p])=>JSON.stringify(p).includes(args[0].replace(/%/g,''))).map(([k,p])=>({record_key:k,payload:clone(p)}))};
 if(sql.startsWith('UPDATE qmes_sync_records')){working.records[args[0]]=JSON.parse(args[1]);return {rows:[]};}
 if(sql.startsWith('INSERT INTO qmes_oqc_revision_corrections')){if(fail&&args[0].includes('2101'))throw Error('write failed');working.markers[args[0]]={before:JSON.parse(args[2]),after:JSON.parse(args[3])};return {rows:[]};}
 throw Error('Unexpected SQL '+sql);
 }};
 const pool={connect:async()=>client};return {pool,get:()=>db,count:()=>queries};
}
test('corrects requested counters once and preserves measured evidence and unrelated records',async()=>{
 const f=fixture(),before=clone(f.get()),audits=[];
 assert.equal(await correction.ensure(f.pool,{session:{user:{name:'담당자'}}},async(...args)=>audits.push(args)),2);
 const rows=f.get().records.a.rows;assert.equal(rows[0].revision,1);assert.equal(rows[0].modifiedAt,before.records.a.rows[0].modifiedAt);
 assert.equal(rows[1].revision,0);assert.equal(rows[1].modifiedAt,null);assert.equal(rows[1].modifiedBy,'');
 assert.deepEqual(rows.map(r=>r.measurements),before.records.a.rows.map(r=>r.measurements));assert.deepEqual(rows[2],before.records.a.rows[2]);
 assert.equal(audits.length,2);assert.equal(Object.keys(f.get().markers).length,2);
 const count=f.count();assert.equal(await correction.ensure(f.pool,{},async()=>{}),0);assert.equal(f.count(),count);
 const today=core.applyGroup([rows[1]],[{...rows[1],remarks:'당일 수정'}],'담당자','2026-11-05T03:00:00Z');assert.equal(today.revision,0);
});
test('revision correction rolls back both records if its history cannot be written',async()=>{const f=fixture(true),before=clone(f.get());await assert.rejects(()=>correction.ensure(f.pool,{},async()=>{}),/write failed/);assert.deepEqual(f.get(),before);});
test('correction never matches a different date, product or LOT',()=>{
 const rule=correction.corrections[0],row={lot:'DBJ1501',date:'2026-10-15',product:'NBA20-HM05',revision:3};
 assert.equal(correction.patch(row,rule).revision,1);
 for(const change of [{lot:'OTHER'},{date:'2025-10-15'},{product:'OTHER'}])assert.equal(correction.patch({...row,...change},rule),null);
});
test('outgoing list includes escaped saved remarks next to Edit and allocates a separate note width',async()=>{
 const source=fs.readFileSync(__dirname+'/../public/index.html','utf8'),start=source.indexOf('async function loadHistoricalInspectionRows('),end=source.indexOf('/* Selected certificate batch print:',start);
 const vals=['이상없음','7','1500','200','20','500','Overflow','미탈리'],rows=rules.items.map((check,i)=>({id:'r'+i,lot:'DBJ1501',date:'2026-10-15',product:'NBA20HM05',check,measurements:Array(3).fill(vals[i]),remarks:i===2?'승인하 출하 <확인>':''}));
 const body={innerHTML:'',querySelectorAll:()=>[]},section={isConnected:true,querySelector:s=>s==='tbody'?body:null,querySelectorAll:()=>[]};
 const context={window:{qmesAuthDataReady:{wait:async()=>{}},qmesOqcRules:rules,qmesOqcRevision:core},pageInfo:{outgoing:['출하검사','',['검사일자','최종 수정일','리비전','고객사','제품명','완제품 LOT','검사항목','검사합부','검사자','출하상태','성적서','첨부파일','비고']]},fetch:async()=>({ok:true,json:async()=>({success:true,data:[{record_key:'a',payload:{rows}}]})}),AbortSignal,console,Date};
 vm.runInNewContext(source.slice(start,end),context);await context.loadHistoricalInspectionRows(section,'outgoing');
 assert(body.innerHTML.includes('oqc-remarks-edit'));assert(body.innerHTML.includes('oqc-remarks-text'));assert(body.innerHTML.includes('승인하 출하 &lt;확인&gt;'));assert(!body.innerHTML.includes('승인하 출하 <확인>'));assert(source.includes('remarksIndex=labels.indexOf'));assert(source.includes('border-left:1px solid #d5dce5'));
});
