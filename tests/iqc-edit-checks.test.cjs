const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/../public/js/qmes-iqc-pqc-layout-20261021.js','utf8'),addon=source.slice(source.indexOf('/* IQC edit checks parity:'));
function fixture(row){
 let box;const summary={value:'합격'},frame={after(v){box=v;}},pane={querySelector:s=>s==='.iqc-edit-settings-frame'?frame:s==='#iqcEditResult'?summary:null};
 const document={querySelector:s=>s.includes('.iqc-edit-checks')?box:pane,createElement:tag=>({tagName:tag.toUpperCase(),dataset:{},listeners:{},addEventListener(name,fn){this.listeners[name]=fn;}}),head:{append(){}}};
 const originalItems=(r,note,date,result)=>[...(typeof r.items_json==='string'?JSON.parse(r.items_json):r.items_json||[]).filter(x=>x.name!=='비고'&&x.name!=='종합판정'),{name:'비고',value:note,inspectionDate:date},{name:'종합판정',judge:result,value:result}];
 const window={editIncomingRecord(){},updateIqcRemarkItems:originalItems};vm.runInNewContext(addon,{window,document});window.editIncomingRecord({},row);return {api:window.qmesIqcEditChecks,window,get box(){return box;},summary};
}
const row={id:'i1',items_json:JSON.stringify([{name:'외관',values:['적합'],judge:'합격'},{name:'라벨',values:['적합'],judge:'합격'},{name:'중량',values:['25'],judge:'합격'},{name:'COA 확인',values:['확인'],judge:'합격'},{name:'비고',value:'원래 비고',inspectionDate:'2026-10-15'},{name:'관리대장 판정',value:'합격',custom:'보존'}])};
test('edit screen displays all four checks and reads the saved single results',()=>{
 const f=fixture(row);assert.ok(f.box.innerHTML.includes('확인 결과'));assert.equal((f.box.innerHTML.match(/data-iqc-check=/g)||[]).length,4);assert.ok(f.box.innerHTML.includes('value="25"'));assert.ok(f.box.innerHTML.includes('value="확인" selected'));assert.equal(f.summary.disabled,true);
});
test('unchanged edit preserves inspection results and unrelated metadata',()=>{
 const f=fixture(row),result=f.window.updateIqcRemarkItems(row,'새 비고','2026-10-16','합격');
 assert.deepEqual(JSON.parse(JSON.stringify(result.filter(x=>x.name!=='비고'&&x.name!=='종합판정'))),JSON.parse(row.items_json).filter(x=>x.name!=='비고'&&x.name!=='종합판정'));
});
test('changed checks are persisted with remarks, pending COA is never reported as pass',()=>{
 const f=fixture(row);f.box._dirty=true;f.box._checks[3]={name:'COA 확인',value:'확인중',judge:'합격'};
 const result=f.window.updateIqcRemarkItems(row,'추가 확인','2026-11-05','합격');assert.equal(result.find(x=>x.name==='COA 확인').values[0],'확인중');assert.equal(result.find(x=>x.name==='종합판정').judge,'대기');assert.equal(result.find(x=>x.name==='비고').inspectionDate,'2026-11-05');assert.equal(result.find(x=>x.name==='관리대장 판정').custom,'보존');assert.equal(JSON.parse(row.items_json)[3].values[0],'확인');
 f.box._checks[0].value='부적합';assert.equal(f.api.overall(f.box._checks),'불합격');
});
test('missing legacy results stay empty and cannot fabricate pass; old multi-read data is retained as legacy evidence',()=>{
 const f=fixture({id:'old',items_json:'[]'});assert.ok(f.box._checks.every(x=>x.value===''&&x.judge===''));assert.equal(f.api.overall(f.box._checks),'대기');
 const r={items_json:JSON.stringify([{name:'COA',values:['미확인','확인','확인'],judge:'대기',source:'원본'}])},checks=f.api.read(r);assert.equal(checks[3].value,'미확인');checks[3].value='확인';checks[3].judge='합격';const merged=f.api.merge(r,checks),coa=merged.find(x=>x.name==='COA 확인');assert.equal(coa.source,'원본');assert.deepEqual(Array.from(coa.legacyValues),['미확인','확인','확인']);assert.deepEqual(Array.from(coa.values),['확인']);
});
