const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),rules=require('../public/js/qmes-oqc-rules-20261019.js');
test('PQC NG keeps subsequent input enabled, restores old owned locks and preserves other disabled controls',()=>{
 const names=['외관','입도(Dmax)','점도','고형분'],values=['이상없음','11','1500','20'];
 const rows=names.map((name,index)=>{const inputs=Array.from({length:3},(_,i)=>({value:values[index],dataset:{pqcMeasure:name,measureIndex:String(i)},disabled:false,setAttribute(){},removeAttribute(){}}));const row={classList:{toggle(c,value){assert.equal(value,false);}},querySelectorAll:()=>inputs};const cell={dataset:{pqcItemJudge:name},textContent:'후속 공정 차단',closest:s=>s==='tr'?row:table};return {row,cell,inputs};});
 rows[2].inputs[0].disabled=true;rows[2].inputs[0].dataset.pqcSequentialLock='owned';
 rows[3].inputs[0].disabled=true;rows[3].inputs[0].dataset.pqcSequentialLock='previously-disabled';
 let warning=null;const table={parentNode:{insertBefore(w){warning=w;}}},pane={querySelectorAll:s=>s==='[data-pqc-item-judge]'?rows.map(r=>r.cell):rows.flatMap(r=>r.inputs),querySelector:()=>warning};
 const document={head:{appendChild(){}},body:{},querySelectorAll:()=>[pane],createElement:()=>({setAttribute(){},lastElementChild:{textContent:''}}),addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/../public/js/qmes-pqc-sequential-block-20261021.js','utf8'),{document,window:{qmesOqcRules:rules},MutationObserver:class{observe(){}},requestAnimationFrame(){}});
 assert.equal(rows[1].cell.textContent,'불합격');assert.equal(rows[2].cell.textContent,'합격');assert.equal(rows[2].inputs[0].disabled,false);assert.equal(rows[3].inputs[0].disabled,true);
 assert(warning.lastElementChild.textContent.includes('모두 입력하고 저장'));assert(warning.lastElementChild.textContent.includes('후속 공정은 차단'));
});
test('actual PQC save route persists NG and all subsequent evidence, and creates NCR',async()=>{
 const source=fs.readFileSync(__dirname+'/../server.js','utf8'),start=source.indexOf('function evaluatePqcMeasurements('),end=source.indexOf('// Update an existing OQC inspection group',start);
 let handler,saved,ncr;
 const client={release(){},async query(sql,args){if(sql.startsWith('SELECT payload'))return {rows:[]};if(sql.startsWith('INSERT INTO'))saved=JSON.parse(args[1]);return {rows:[]};}};
 const ctx={app:{get(){},post(p,...h){handler=h.at(-1);}},requireLogin(){},pool:{connect:async()=>client},txt:v=>String(v??'').trim(),jsonObj:v=>v,ok:(res,data)=>res.json({success:true,data}),fail:(res,status,message)=>res.status(status).json({success:false,message}),autoCreateNcr:async data=>ncr=data,console,Date};
 vm.runInNewContext(source.slice(start,end),ctx);
 const measurements={'외관':['이상없음','이상없음','이상없음'],'입도(Dmax)':['11','7','7'],'점도':['1500','1501','1502'],'고형분':['20','20.1','20.2']};
 const res={statusCode:200,status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;}};
 await handler({session:{user:{id:'u1',name:'담당자'}},body:{key:'PQC-test',record:{id:'r1',date:'2026-11-05',lot:'PQC-NG',measurements}}},res);
 assert.equal(res.statusCode,200);assert.equal(res.body.success,true);assert.equal(saved.rows[0].judge,'불합격');assert.deepEqual(saved.rows[0].measurements,measurements);assert.equal(ncr.source,'PQC');assert(ncr.containment.includes('후속 공정 차단'));
});
