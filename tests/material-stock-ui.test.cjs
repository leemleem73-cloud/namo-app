const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../public/js/qmes-material-stock-core-20261103.js'),source=fs.readFileSync(__dirname+'/../public/js/qmes-material-stock-ui-20261103.js','utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function harness(){
 const records=[],writes=[],dialogs=[],handlers={};let fail=false;
 const search={addEventListener(){}};
 const root={html:'',classList:{contains:()=>false},set innerHTML(v){this.html=v;},get innerHTML(){return this.html;},querySelector:()=>search,addEventListener:(event,fn)=>handlers[event]=fn};
 const doc={hidden:false,getElementById:()=>root,querySelectorAll:()=>dialogs,head:{append(){}},body:{append(d){dialogs.push(d);}},addEventListener(){},createElement(tag){
  if(tag==='style')return {};
  const controls={},nodes={},values={};for(const name of ['material','lot','supplier','type','date','status','amount','unit','direction','note']){values[name]='';controls[name]={get value(){return values[name];},set value(v){values[name]=v;}};}
  controls.unit.value='kg';
  const submit={disabled:false};const form={elements:controls,values,querySelector:()=>submit};
  const d={listeners:{},innerHTML:'',form,closed:false,querySelector(selector){if(selector==='form')return form;return nodes[selector]??=(selector==='[data-error]'?{hidden:true,textContent:''}:{});},addEventListener(name,fn){this.listeners[name]=fn;},showModal(){},close(){this.closed=true;this.listeners.close?.();},remove(){},};return d;
 }};
 const iqc=[{id:'i1',date:'2026-11-01',item:'NMP',lot:'L',supplier:'S',incoming_qty:100,judge:'합격'}],orders=[{id:'w1',workDate:'2026-11-02',fields:{'생산 LOT NO':'F','진행상태':'완료'},materials:[{name:'NMP',lot:'L',actual:40,plan:50}]}];
 const fixture=JSON.stringify({iqc,orders});
 const fetcher=async(url,options)=>{
  if(options.method==='POST'){writes.push(JSON.parse(options.body));if(fail)return {ok:false,status:500,json:async()=>({success:false,message:'DB 저장 실패'})};const value=JSON.parse(options.body);records.splice(0,records.length,...records.filter(r=>r.record_key!==value.key),{record_key:value.key,payload:value.payload});return {ok:true,json:async()=>({success:true,data:{record_key:value.key}})};}
  const data=url==='/api/iqc'?iqc:url==='/api/qmes/work-orders'?orders:url.includes('/qmes-sync/')?records:url.includes('quality-gate')?{holds:[]}:[];
  return {ok:true,json:async()=>({success:true,data})};
 };
 const win={qmesMaterialStockCore:core,qmesAuthDataReady:{wait:()=>Promise.resolve()},qmesConfirm:async()=>true,toast(){},addEventListener(){}};
 class Data{constructor(form){this.values=form.values;}[Symbol.iterator](){return Object.entries(this.values)[Symbol.iterator]();}}
 vm.runInNewContext(source,{window:win,document:doc,fetch:fetcher,AbortController,setTimeout,clearTimeout,crypto:{randomUUID:()=> 'manual-1'},FormData:Data,MutationObserver:class{observe(){}},Date,console});
 const click=dataset=>handlers.click({target:{closest:()=>({dataset})}});
 return {root,dialogs,writes,records,iqc,orders,fixture,click,setFail:v=>fail=v};
}
test('stock page loads connected IQC/work quantities and saves unknown then confirmed retest without changing sources',async()=>{
 const h=harness();h.click({ms:'refresh'});await flush();assert.ok(h.root.html.includes('NMP'));assert.ok(h.root.html.includes('60'));
 h.click({ms:'new'});const d=h.dialogs.at(-1),e=d.form.elements;e.material.value='NMP';e.lot.value='L';e.supplier.value='S';e.note.value='과거 재검사, 양 미확인';
 await d.form.onsubmit({preventDefault(){}});assert.equal(h.writes.length,1);assert.equal(h.writes[0].payload.entry.quantity,null);assert.equal(h.writes[0].payload.entry.status,'pending');assert.equal(h.writes[0].payload.entry.date,'');assert.equal(h.root.html.includes('수량/연결 확인 필요'),true);
 h.click({ms:'new'});const known=h.dialogs.at(-1),k=known.form.elements;k.material.value='NMP';k.lot.value='L';k.supplier.value='S';k.note.value='재검사 25 g 확인';k.status.value='confirmed';k.date.value='2026-11-02';k.amount.value='25';k.unit.value='g';
 await known.form.onsubmit({preventDefault(){}});assert.equal(h.writes.at(-1).payload.entry.quantity,0.025);assert.ok(h.root.html.includes('59.975'));assert.equal(JSON.stringify({iqc:h.iqc,orders:h.orders}),h.fixture);
 assert.ok(h.writes.every(r=>r.key.startsWith(core.PREFIX)));
});
test('failed shared DB save keeps the entry dialog and typed values available for retry',async()=>{
 const h=harness();h.click({ms:'refresh'});await flush();h.click({ms:'new'});const d=h.dialogs.at(-1),e=d.form.elements;e.material.value='NMP';e.lot.value='L';e.note.value='확인 전 기록';h.setFail(true);
 await d.form.onsubmit({preventDefault(){}});assert.equal(d.closed,false);assert.equal(e.note.value,'확인 전 기록');assert.equal(d.querySelector('[data-error]').textContent,'DB 저장 실패');assert.equal(d.form.querySelector().disabled,false);
});
test('stock UI script compiles',()=>new vm.Script(source));
test('stock pager follows previous-number-next format and disables boundary navigation',()=>{
 const context={};vm.runInNewContext(source.slice(source.indexOf('function pagerMarkup'),source.indexOf('function paint')),context);
 const first=context.pagerMarkup(1,2),last=context.pagerMarkup(2,2),single=context.pagerMarkup(1,1);
 assert.ok(first.includes('data-ms-page="1" disabled>‹'));
 assert.ok(first.includes('data-ms-page="2">›'));
 assert.ok(first.includes('aria-current="page">1'));
 assert.ok(last.includes('data-ms-page="1">‹'));
 assert.ok(last.includes('data-ms-page="2" disabled>›'));
 assert.equal((single.match(/ disabled/g)||[]).length,2);
});
