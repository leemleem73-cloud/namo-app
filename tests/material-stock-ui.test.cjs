const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../public/js/qmes-material-stock-core-20261103.js'),source=fs.readFileSync(__dirname+'/../public/js/qmes-material-stock-ui-20261103.js','utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function harness(withGrid=false){
 const records=[],writes=[],dialogs=[],handlers={},authEvents={};let fail=false,gridOptions;
 const search={addEventListener(){}};
 const root={append(){},html:'',classList:{contains:()=>false},set innerHTML(v){this.html=v;},get innerHTML(){return this.html;},querySelector:()=>search,addEventListener:(event,fn)=>handlers[event]=fn};
 const doc={hidden:false,getElementById:()=>root,querySelectorAll:()=>dialogs,head:{append(){}},body:{append(d){dialogs.push(d);}},addEventListener(){},createElement(tag){
  if(tag==='style')return {};if(tag==='div')return root;
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
 const win={qmesMaterialStockCore:core,qmesAuthDataReady:{wait:()=>Promise.resolve()},qmesConfirm:async()=>true,toast(){},addEventListener:(name,fn)=>authEvents[name]=fn};
 if(withGrid)win.qmesStockGrid={...require('../public/js/qmes-stock-grid-20261104.js'),capture(){},clear(){},mount(_root,options){gridOptions=options;}};
 class Data{constructor(form){this.values=form.values;}[Symbol.iterator](){return Object.entries(this.values)[Symbol.iterator]();}}
 vm.runInNewContext(source,{window:win,document:doc,fetch:fetcher,AbortController,setTimeout,clearTimeout,crypto:{randomUUID:()=> 'manual-1'},FormData:Data,MutationObserver:class{observe(){}},Date,console});
 const click=dataset=>handlers.click({target:{closest:()=>({dataset})}});
 return {getGrid:()=>gridOptions,authEvents,win,root,dialogs,writes,records,iqc,orders,fixture,click,setFail:v=>fail=v};
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
test('simplified raw stock table keeps the same balance and aligns ten visible columns',async()=>{const h=harness(true);h.click({ms:'refresh'});await flush();const g=h.getGrid();assert.equal(g.grid.columns.length,10);assert.equal(g.grid.columns.find(c=>c.id==='balance').label,'재고(kg)');assert.ok(!g.grid.columns.some(c=>['adjust','reserved','available'].includes(c.id)));const html=h.root.html.match(/<tr data-sg-row="[^"]*">([\s\S]*?)<\/tr>/)[1],cells=[...html.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(m=>m[1].replace(/<[^>]*>/g,''));assert.equal(cells.length,10);assert.equal(cells[4],'100');assert.equal(cells[5],'40');assert.equal(cells[7],'60');assert.ok(!h.root.html.includes('장부재고'));assert.ok(!h.root.html.includes('투입 예정(kg)'));assert.ok(!h.root.html.includes('계산 가용량'));});
test('raw table quick input persists an audited additive movement and reloads balance',async()=>{
 const h=harness(true);h.click({ms:'refresh'});await flush();const g=h.getGrid(),row=g.rows[0];assert.ok(h.root.html.includes('data-sg-filter="material"'));assert.ok(h.root.html.includes('빠른 입력'));
 assert.equal(await g.onSave(row,{type:'retest',date:'2026-11-04',amount:'25',unit:'g',status:'confirmed',note:'표에서 재검사 사용',direction:'decrease'},'inline-raw'),true);
 assert.equal(h.writes[0].key,core.PREFIX+'inline-raw');assert.equal(h.writes[0].payload.entry.quantity,.025);assert.equal(h.writes[0].payload.entry.recordedFrom,'inventory-grid');assert.equal(h.writes[0].payload.entry.beforeBalance,60);await g.onSaved();assert.ok(h.root.html.includes('59.975'));assert.equal(JSON.stringify({iqc:h.iqc,orders:h.orders}),h.fixture);
});
test('raw quick input cancellation, failed saves and account changes do not fabricate movements',async()=>{
 const h=harness(true);h.click({ms:'refresh'});await flush();const g=h.getGrid(),row=g.rows[0],values={type:'adjustment',date:'2026-11-04',amount:'5',unit:'kg',status:'confirmed',note:'실사 차이',direction:'increase'};
 h.win.qmesConfirm=async()=>false;assert.equal(await g.onSave(row,values,'cancel'),false);assert.equal(h.writes.length,0);
 h.win.qmesConfirm=async()=>true;h.setFail(true);await assert.rejects(()=>g.onSave(row,values,'retry-id'),/DB 저장 실패/);h.setFail(false);assert.equal(await g.onSave(row,values,'retry-id'),true);assert.equal(h.records.length,1);assert.equal(h.writes[0].key,h.writes[1].key);
 const prior=h.writes.length;h.win.qmesConfirm=async()=>{h.authEvents['qmes-authenticated']();return true;};await assert.rejects(()=>g.onSave(row,values,'old-account'),/계정이 변경/);assert.equal(h.writes.length,prior);
});
test('raw record target selector opens finished record without saving or carrying raw identity',async()=>{
 const h=harness();h.click({ms:'new'});const d=h.dialogs.at(-1),select=d.querySelector('[data-stock-kind]');let called=0;
 h.win.qmesFinishedStock={openRecord:async(...args)=>{called++;assert.equal(args.length,0);return true;}};
 select.value='finished';await select.onchange();assert.equal(called,1);assert.equal(d.closed,true);assert.equal(h.writes.length,0);
 assert.ok(d.innerHTML.includes('재고 대상'));assert.ok(d.innerHTML.includes('value="finished">완제품'));
});
test('unavailable finished module keeps raw dialog open with a readable retry message',async()=>{
 const h=harness();h.click({ms:'new'});const d=h.dialogs.at(-1),select=d.querySelector('[data-stock-kind]');select.value='finished';await select.onchange();
 assert.equal(d.closed,false);assert.equal(select.value,'raw');assert.equal(select.disabled,false);assert.ok(d.querySelector('[data-error]').textContent.includes('완제품 기록 화면'));assert.equal(h.writes.length,0);
});
test('ledger explanations identify real receipt and work documents instead of showing internal UUIDs',()=>{
 const ctx={fmt:value=>String(value)};vm.runInNewContext(source.slice(source.indexOf('function sourceInfo'),source.indexOf('function usageOrder')),ctx);
 const receipt=ctx.sourceInfo({source:'수입검사',date:'2025-11-10',id:'3457cab5-c80a-489e-bb06-7ddedec1c540',qty:90000000,judge:'대기'});
 assert.equal(receipt.title,'수입검사 · 2025-11-10');assert.ok(receipt.detail.includes('90 kg'));assert.ok(!JSON.stringify(receipt).includes('3457cab5'));
 const work=ctx.sourceInfo({source:'작업지시',id:'internal',documentNo:'WO-20261103-001',output:'FIN-1',product:'제품'});assert.ok(work.title.includes('WO-20261103-001'));assert.ok(work.detail.includes('FIN-1'));
 const manual=ctx.sourceInfo({source:'수불기록',kind:'재검사 사용',note:'재검사 25 g'});assert.equal(manual.detail,'재검사 25 g');
});
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

function summaryFixture(over={}){
 const iqc=[{id:'i1',item:'NMP',lot:'L',supplier:'공급업체A',date:'2026-11-01',incoming_qty:100,inspector:'검사담당',judge:'합격'}];
 const orders=[{id:'w1',workDate:'2026-11-02',fields:{'생산 LOT NO':'F1','작업지시번호':'WO-20261102-001','제품명':'제품A','작업자':'생산담당','진행상태':'완료'},materials:[{name:'NMP',lot:'L',plan:50,actual:40}]}];
 const snapshot={iqc,orders,actuals:[],entries:[{id:'e1',material:'NMP',lot:'L',supplier:'공급업체A',type:'retest',quantity:null,status:'pending',date:'',note:'재검사량 확인 중'}],...over};
 const model=core.build(snapshot),row=model.rows[0],ctx={core,snapshot,model,entries:snapshot.entries,selected:'',fmt:v=>v==null?'미확인':String(v),esc:v=>String(v??'').replace(/</g,'&lt;').replace(/>/g,'&gt;'),typeLabel:{retest:'재검사 사용'}};
 vm.runInNewContext(source.slice(source.indexOf('function sourceInfo'),source.indexOf('function editEntry')),ctx);
 return {ctx,row,html:ctx.ledgerSections(row)};
}
test('inline usage summary shows IQC receipt and work-order input separately without document navigation',()=>{
 const {html}=summaryFixture(),receipt=html.slice(html.indexOf('data-ledger-section="receipts"'),html.indexOf('data-ledger-section="production"')),use=html.slice(html.indexOf('data-ledger-section="production"'));
 assert.ok(html.indexOf('입고·사용 기록')<html.indexOf('<h3>사용 내역</h3>'));
 for(const value of ['공급업체A','검사담당','100','합격'])assert.ok(receipt.includes(value));
 for(const value of ['WO-20261102-001','제품A','F1','50','40','생산담당','완료'])assert.ok(use.includes(value));
 assert.ok(!html.includes('data-source-index'));assert.ok(!html.includes('<button'));assert.ok(!html.includes('openSource'));
 assert.ok(!use.includes('재검사량 확인 중'));assert.ok(use.includes('합계 40 kg'));
});
test('usage summary resolves legacy actuals only to a unique matching work order and retains measured quantity',()=>{
 const {ctx,row}=summaryFixture();const legacy={source:'작업실적',output:'F1',qty:35000000,date:'2026-11-02',delta:-35000000};row.ledger=[legacy];row.used=35;
 let html=ctx.ledgerSections(row);assert.ok(html.includes('WO-20261102-001'));assert.ok(html.includes('<td>35</td>'));assert.ok(html.includes('저장된 작업실적 기준'));
 ctx.snapshot.orders.push({...ctx.snapshot.orders[0],id:'another'});html=ctx.ledgerSections(row);assert.ok(!html.includes('WO-20261102-001'));assert.ok(html.includes('<td>미확인</td>'));
});
test('dialog keeps both summaries above separate manual-use entry controls and handles no production use',()=>{
 const {ctx,row}=summaryFixture({orders:[]});let d;
 ctx.document={createElement(){return d={innerHTML:'',querySelector:()=>({}),querySelectorAll:()=>[],addEventListener(){},showModal(){},remove(){}};},body:{append(){}}};ctx.editEntry=()=>{};
 ctx.showDetails(row.key);
 assert.ok(d.innerHTML.includes('연결된 생산 투입 내역이 없습니다.'));assert.ok(d.innerHTML.includes('data-new>+ 사용 기록 추가'));
 assert.ok(d.innerHTML.indexOf('<h3>사용 내역</h3>')<d.innerHTML.indexOf('재검사·샘플 사용 / 재고 조정'));
 assert.ok(d.innerHTML.includes('재검사량 확인 중'));assert.ok(d.innerHTML.includes('data-edit="e1"'));assert.ok(!d.innerHTML.includes('data-source-index'));
});
