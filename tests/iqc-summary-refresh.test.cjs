const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/../public/js/qmes-iqc-pqc-layout-20261021.js','utf8'),addon=source.slice(source.indexOf('/* Summarize actual saved inspection items and refresh'));
test('pre-rendered old rows refresh immediately and audited native reload happens once',async()=>{
 const td={textContent:'외관'},tr={dataset:{iqcId:'1'},children:[{},td]},table={querySelectorAll:s=>s==='thead th'?[{textContent:'No.'},{textContent:'검사항목'}]:[tr]};
 const root={_iqcRows:[{id:'1',items_json:[{name:'외관'}]}],_iqcPage:2,querySelectorAll:()=>[table]};
 let observer,calls=0;
 const ctx={window:{iqcItemSummary:()=> '외관',loadIncomingFromDb:async(r,p)=>{calls++;assert.equal(p,2);r._iqcRows=[{id:'1',items_json:['외관','라벨','중량','COA 확인','종합판정','비고'].map(name=>({name}))}];}},document:{getElementById:()=>root},queueMicrotask,console,MutationObserver:class{constructor(fn){observer=fn;}observe(){}}};
 vm.runInNewContext(addon,ctx);await new Promise(setImmediate);await new Promise(setImmediate);
 assert.equal(td.textContent,'외관 / 라벨 / 중량 / COA 확인');assert.equal(calls,1);
 observer();observer();await new Promise(setImmediate);assert.equal(calls,1);
 root._iqcRows=[{id:'1',items_json:[{name:'포장상태'},{name:'외관'},{name:'라벨'}]}];observer();await new Promise(setImmediate);assert.equal(td.textContent,'포장상태 / 외관 / 라벨');
});
test('summary installs even when prior function is absent and escapes HTML without faking missing items',()=>{
 const ctx={window:{}};vm.runInNewContext(addon,ctx);
 assert.equal(ctx.window.iqcItemSummary({items_json:[{name:'<外観>'}]}),'&lt;外観&gt;');
 assert.equal(ctx.window.iqcItemSummary({items_json:[{name:'외관'}]}),'외관');
 assert.equal(ctx.window.iqcItemSummary({items_json:'broken'}),'미등록');
});
