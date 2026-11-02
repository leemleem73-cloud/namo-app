const assert=require('node:assert/strict'),core=require('../public/js/qmes-lot-date-search-20261102.js');
assert.equal(core.dayOf('2026-11-02T00:00:00Z'),'2026-11-02');assert.equal(core.dayOf('2026-02-30'),'');assert.equal(core.dayOf(''),'');
assert.ok(core.rangeError('2026-11-03','2026-11-02'));assert.deepEqual(core.period('week','2026-11-08'),{start:'2026-11-02',end:'2026-11-08'});assert.deepEqual(core.period('month','2026-11-02'),{start:'2026-11-01',end:'2026-11-02'});
const orders=[{id:'W1',workDate:'2026-11-01',productionType:'중간배치',fields:{'생산 LOT NO':'MB-1','작업지시번호':'WO-1','제품명':'중간재','계획수량':'100','진행상태':'완료'}},{id:'W2',workDate:'2026-11-02',fields:{'생산 LOT NO':'FIN-1','작업지시번호':'WO-2','제품명':'완제품','계획수량':'200','진행상태':'대기'}},{id:'W3',workDate:'2026-11-03',fields:{'생산 LOT NO':'FUTURE'}}];
const actual=[{id:1,workDate:'2026-11-01',finishedLot:'MB-1',prodQty:'90'},{id:2,workDate:'2026-11-02',finishedLot:'FIN-1',prodQty:'0'},{id:3,workDate:'2026-11-02',finishedLot:'FIN-1',prodQty:'10'},{id:4,workDate:'2026-10-31',finishedLot:'OLD'},{id:5,workDate:'',finishedLot:'NO-DATE'},{id:6,workDate:'2026-11-02',finishedLot:'-'},{id:7,workDate:'2026-11-02',finishedLot:'DELETED',deleted:true}];
const rows=core.rowsFor(actual,orders,'actual','2026-11-01','2026-11-02');assert.equal(rows.length,3);assert.equal(rows[0].date,'2026-11-02');assert.equal(rows.find(r=>r.id==='1').mode,'intermediate');assert.equal(rows.find(r=>r.id==='2').quantity,'0');assert.equal(rows.find(r=>r.id==='2').status,'실적 등록');assert.equal(rows.some(r=>r.lot==='FUTURE'),false);assert.equal(rows.find(r=>r.id==='3').quantity,'10');
const planned=core.rowsFor(actual,orders,'work','2026-11-01','2026-11-02');assert.equal(planned.length,2);assert.equal(planned[0].quantity,'200');assert.equal(planned[0].status,'대기');
assert.equal(core.rowsFor(actual,orders,'actual','2026-12-01','2026-12-02').length,0);
const ambiguous=core.rowsFor(actual,[orders[1],{...orders[1],id:'other',fields:{...orders[1].fields,'제품명':'다른 제품'}}],'actual','2026-11-02','2026-11-02');assert.equal(ambiguous[0].product,'');
class Node{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.listeners={};this.parts={};this.dataset={};this.attrs={};this.value='';this.disabled=false;this.textContent='';this.innerHTML='';}
 append(node){this.children.push(node);}
 after(node){this.inserted=node;}
 querySelector(selector){return this.parts[selector]||(this.parts[selector]=new Node());}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(type,fn){(this.listeners[type]||=[]).push(fn);}
 replaceChildren(){this.children=[];this.innerHTML='';}
 scrollIntoView(){}
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function run(){
 const root=new Node(),anchor=root.querySelector('.lot-search-card'),docEvents={},requests=[],traceCalls=[];
 const document={head:new Node(),getElementById:id=>id==='lotTrace'?root:id==='lotResultTitle'?new Node():null,createElement:tag=>new Node(tag),addEventListener(type,fn){(docEvents[type]||=[]).push(fn);}};
 const win={document,setTimeout,clearTimeout,addEventListener(){},qmesLotTrace:{openLot(...args){traceCalls.push(args);}},fetch(url,options){return new Promise((resolve,reject)=>requests.push({url,options,resolve(rows){resolve({ok:true,json:async()=>({success:true,data:rows})});},reject}));}};
 core.install(win);const panel=anchor.inserted,$=s=>panel.querySelector(s),start=$('[data-date-start]'),end=$('[data-date-end]'),kind=$('[data-date-kind]');kind.value='actual';
 const click=(key,value)=>{const button=new Node('button');button.hasAttribute=name=>name===key;button.dataset=value||{};for(const fn of panel.listeners.click)fn({target:{closest:()=>button}});};
 start.value='2026-11-03';end.value='2026-11-02';click('data-date-search');assert.equal(requests.length,0);assert.match($('.lot-date-message').textContent,/늦을/);
 start.value='2026-11-01';end.value='2026-11-02';click('data-date-search');assert.equal(requests.length,2);assert.equal(requests[0].url,'/api/worklog');assert.equal($('[data-date-search]').disabled,true);
 requests[0].resolve(actual);requests[1].resolve(orders);await tick();assert.match($('.lot-date-results').innerHTML,/FIN-1/);assert.doesNotMatch($('.lot-date-results').innerHTML,/FUTURE/);assert.match($('.lot-date-message').textContent,/조회 3건/);
 click('',{dateOpen:'2'});assert.deepEqual(traceCalls,[['MB-1','intermediate']]);assert.equal($('[data-date-search]').disabled,false);
 click('data-date-search');const stale=requests[2];start.value='2026-12-01';end.value='2026-12-02';for(const fn of start.listeners.change)fn();assert.equal(stale.options.signal.aborted,true);
 stale.resolve(actual);requests[3].resolve(orders);await tick();assert.equal($('.lot-date-results').innerHTML,'');
 click('data-date-search');requests[4].resolve([]);requests[5].resolve(orders);await tick();assert.match($('.lot-date-results').innerHTML,/생산실적이 없습니다/);
 kind.value='work';for(const fn of kind.listeners.change)fn();start.value='2026-11-01';end.value='2026-11-02';click('data-date-search');assert.equal(requests[6].url,'/api/qmes/work-orders');requests[6].resolve(orders);await tick();assert.match($('.lot-date-results').innerHTML,/200/);assert.match($('.lot-date-results').innerHTML,/계획수량/);
 assert.equal(requests.every(r=>!r.options.method),true);
 console.log('PASS: inclusive production dates, actual versus planned quantities, ambiguous linkage, missing dates, date validation, query results, intermediate LOT handoff, stale request cancellation, empty results');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
