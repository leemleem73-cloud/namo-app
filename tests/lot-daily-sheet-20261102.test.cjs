const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),daily=require('../public/js/qmes-lot-daily-sheet-20261102.js');
const source=fs.readFileSync(require.resolve('../public/js/qmes-lot-trace-linked-20261021.js'),'utf8');
const context={root:{querySelector(){}},window:{}};vm.runInNewContext(source.slice(source.indexOf('const $='),source.indexOf("let mode='raw'"))+source.slice(source.indexOf('function judgement'),source.indexOf('function table('))+';this.graph=graphData;',context);
const sources=Array.from({length:9},(_,i)=>({label:String(i),rows:[]}));
sources[1].rows=[{id:'W1',workDate:'2026-10-06',fields:{'생산 LOT NO':'LOT-1','작업지시번호':'WO-1','제품명':'제품 A','계획수량':100,'진행상태':'완료'},materials:[{name:'원료 A',lot:'RM-1',plan:100,actual:99}]},{id:'W2',workDate:'2026-10-06',fields:{'생산 LOT NO':'LOT-2','작업지시번호':'WO-2','제품명':'제품 B','계획수량':50},materials:[{name:'원료 A',lot:'RM-1',plan:50}]},{id:'W3',workDate:'2026-10-07',fields:{'생산 LOT NO':'LOT-10','작업지시번호':'WO-3'},materials:[{lot:'RM-1'}]}];
sources[2].rows=[{id:1,date:'2026-10-05',lot:'RM-1',items:[{name:'외관',value:'이상없음',judge:'합격'}]}];
sources[3].rows=[{id:2,date:'2026-10-06',lot:'LOT-1',check:'점도',value:'12',judge:'합격'},{id:3,date:'2026-10-07',lot:'LOT-10'}];
sources[7].rows=[{record_key:'erp:shipping',payload:{rows:[{id:8,lot:'LOT-1',shipDate:'2026-10-08',customer:'고객사',qty:100,status:'출하'}]}}];
sources[8].rows=[{id:4,report_no:'NCR-4',lot:'LOT-2',occurred_on:'2026-10-06',description:'<script>unsafe()</script>',status:'OPEN'}];

assert.equal(daily.formatValue('1498'),'1,498');assert.equal(daily.formatValue('20.126'),'20.126');assert.equal(daily.formatValue('0'),'0');assert.equal(daily.formatValue(['1498','1498','1493']),'1,498 / 1,498 / 1,493');assert.equal(daily.formatValue('Overflow'),'Overflow');
const facts=daily.inspectionFacts({measurements:{viscosity:[1498,1498,1493],solid:[20.126,20.224,20.202]},judge:'합격'});
assert.equal(facts.length,2);assert.equal(facts[0].label,'점도');assert.equal(facts[0].value,'1,498 / 1,498 / 1,493');assert.equal(facts[1].value,'20.126 / 20.224 / 20.202');assert.equal(facts[1].judge,'합격');
assert.equal(daily.inspectionFacts({items:[{name:'원본시트',value:'26년'},{name:'외관',value:'이상없음',judge:'합격'}]}).length,1);

const model=daily.buildDay(sources,'2026-10-06',context.graph);assert.equal(model.orders.length,2);assert.equal(model.lotCount,2);assert.equal(model.inspectionCount,2,'shared raw inspection counted once');assert.equal(model.ncrCount,1);assert.equal(model.shippingCount,1);
assert.equal(model.entries.some(row=>row.lot==='LOT-10'),false);assert.ok(model.entries.some(row=>row.date==='2026-10-05'&&row.type==='수입검사'));assert.ok(model.entries.some(row=>row.date==='2026-10-08'&&row.type==='출하'));assert.ok(model.entries.some(row=>row.type==='원료 투입'&&row.detail.includes('99')));
const html=daily.markup(model);assert.match(html,/WO-1/);assert.match(html,/WO-2/);assert.doesNotMatch(html,/WO-3/);assert.doesNotMatch(html,/<script>|<details/);assert.match(html,/&lt;script&gt;/);assert.match(html,/실제 이력 날짜/);
assert.equal(daily.buildDay(sources,'2026-10-08',context.graph).orders.length,0);assert.throws(()=>daily.buildDay(sources,'2026-02-30',context.graph));
const failed=sources.map(s=>({...s}));failed[2]={label:'수입검사',rows:[],error:'권한 없음'};assert.match(daily.markup(daily.buildDay(failed,'2026-10-06',context.graph)),/일부 자료 조회 실패/);failed[1].error='조회 실패';assert.throws(()=>daily.buildDay(failed,'2026-10-06',context.graph),/작업지시서/);
class Node{constructor(){this.children=[];this.parts={};this.listeners={};this.isConnected=true;this.open=false;this.innerHTML='';this.textContent='';}setAttribute(){}append(node){this.children.push(node);node.parent=this;}querySelector(selector){return this.parts[selector]||(this.parts[selector]=new Node());}addEventListener(type,fn){this.listeners[type]=fn;}showModal(){this.open=true;}close(){this.open=false;this.listeners.close?.();}remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}focus(){}}
async function run(){const events={},requests=[],document={body:new Node(),head:new Node(),activeElement:new Node(),createElement:()=>new Node(),addEventListener(type,fn){(events[type]||=[]).push(fn);}};
 const win={document,setTimeout,clearTimeout,addEventListener(){},qmesLotTrace:{buildGraph:context.graph,readSources(q,signal){assert.equal(q,'');return new Promise(resolve=>requests.push({signal,resolve}));}}};daily.install(win);
 const opening=win.qmesLotDaily.open('2026-10-06');let dialog=document.body.children[0];assert.equal(dialog.open,true);assert.match(dialog.innerHTML,/불러오는 중/);requests[0].resolve(sources);await opening;assert.match(dialog.querySelector('.lot-day-body').innerHTML,/WO-1/);assert.match(dialog.querySelector('.lot-day-body').innerHTML,/WO-2/);
 const stale=win.qmesLotDaily.open('2026-10-06');for(const fn of events['qmes-lot-date-invalidated'])fn();assert.equal(requests[1].signal.aborted,true);requests[1].resolve(sources);await stale;assert.equal(document.body.children.length,0);
 console.log('PASS: all LOTs on exact work date in one sheet, transitive histories and actual event dates, no sibling LOT leakage, shared-record counts, escaped content, partial errors and stale-sheet cancellation');}
run().catch(error=>{console.error(error);process.exitCode=1;});
