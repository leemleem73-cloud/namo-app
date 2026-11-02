const assert=require('node:assert/strict'),core=require('../public/js/qmes-lot-date-search-20261102.js');
assert.equal(core.dayOf('2026-11-02T00:00:00Z'),'2026-11-02');assert.equal(core.dayOf('2026-02-30'),'');assert.equal(core.dayOf(''),'');
assert.ok(core.rangeError('2026-11-03','2026-11-02'));assert.deepEqual(core.period('week','2026-11-08'),{start:'2026-11-02',end:'2026-11-08'});assert.deepEqual(core.period('month','2026-11-02'),{start:'2026-11-01',end:'2026-11-02'});
const orders=[{id:'W1',workDate:'2026-11-01',productionType:'중간배치',fields:{'생산 LOT NO':'MB-1','작업지시번호':'WO-1','제품명':'중간재','계획수량':'100','진행상태':'완료'}},{id:'W2',workDate:'2026-11-02',fields:{'생산 LOT NO':'FIN-1','작업지시번호':'WO-2','제품명':'완제품','계획수량':'200','진행상태':'대기'}},{id:'W3',workDate:'2026-11-03',fields:{'생산 LOT NO':'FUTURE'}}];
const actual=[{id:1,workDate:'2026-11-01',finishedLot:'MB-1',prodQty:'90'},{id:2,workDate:'2026-11-02',finishedLot:'FIN-1',prodQty:'0'},{id:3,workDate:'2026-11-02',finishedLot:'FIN-1',prodQty:'10'},{id:4,workDate:'2026-10-31',finishedLot:'OLD'},{id:5,workDate:'',finishedLot:'NO-DATE'},{id:6,workDate:'2026-11-02',finishedLot:'-'},{id:7,workDate:'2026-11-02',finishedLot:'DELETED',deleted:true}];
const rows=core.rowsFor(actual,orders,'actual','2026-11-01','2026-11-02');assert.equal(rows.length,3);assert.equal(rows[0].date,'2026-11-02');assert.equal(rows.find(r=>r.id==='1').mode,'intermediate');assert.equal(rows.find(r=>r.id==='2').quantity,'0');assert.equal(rows.find(r=>r.id==='2').status,'실적 등록');assert.equal(rows.some(r=>r.lot==='FUTURE'),false);assert.equal(rows.find(r=>r.id==='3').quantity,'10');
const planned=core.rowsFor(actual,orders,'work','2026-11-01','2026-11-02');assert.equal(planned.length,2);assert.equal(planned[0].quantity,'200');assert.equal(planned[0].status,'대기');
assert.equal(core.rowsFor(actual,orders,'actual','2026-12-01','2026-12-02').length,0);
const ambiguous=core.rowsFor(actual,[orders[1],{...orders[1],id:'other',fields:{...orders[1].fields,'제품명':'다른 제품'}}],'actual','2026-11-02','2026-11-02');assert.equal(ambiguous[0].product,'');
const marked=core.recordDates(actual,'actual');assert.equal(marked.has('2026-11-01'),true);assert.equal(marked.has('2026-11-02'),true);
const cells=core.calendarCells('2026-11-01','2026-11-02','2026-11-01',marked);
assert.equal(cells.find(c=>c?.day==='2026-11-02').today,true);assert.equal(cells.find(c=>c?.day==='2026-11-02').recorded,true);assert.equal(cells.find(c=>c?.day==='2026-11-01').selected,true);assert.equal(cells.find(c=>c?.day==='2026-11-03').recorded,false);
class Node{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.listeners={};this.parts={};this.dataset={};this.attrs={};this.value='';this.disabled=false;this.textContent='';this.innerHTML='';this.style={};this.isConnected=true;}
 append(...nodes){for(const node of nodes){node.parentElement=this;node.isConnected=true;this.children.push(node);}}
 after(node){this.inserted=node;}
 before(node){this.beforeNode=node;}
 remove(){this.isConnected=false;if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this);}
 contains(node){return this===node||this.children.some(child=>child.contains?.(node));}
 focus(){}
 getBoundingClientRect(){return {left:100,top:50,bottom:82,width:155,height:250};}
 dispatchEvent(event){for(const fn of this.listeners[event.type]||[])fn(event);}
 querySelector(selector){return this.parts[selector]||(this.parts[selector]=new Node());}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(type,fn){(this.listeners[type]||=[]).push(fn);}
 replaceChildren(){this.children=[];this.innerHTML='';}
 scrollIntoView(){}
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function run(){
 const root=new Node(),anchor=root.querySelector('.lot-search-card'),range=new Node('select'),rangeField=new Node(),docEvents={},requests=[],traceCalls=[];
 rangeField.append(range);
 const document={body:new Node(),head:new Node(),getElementById:id=>id==='lotRange'?range:id==='lotTrace'?root:id==='lotResultTitle'?new Node():null,createElement:tag=>new Node(tag),addEventListener(type,fn){(docEvents[type]||=[]).push(fn);}};
 const win={document,innerWidth:1280,innerHeight:720,Event:class{constructor(type){this.type=type;}},setTimeout,clearTimeout,addEventListener(){},qmesLotTrace:{openLot(...args){traceCalls.push(args);}},fetch(url,options){return new Promise((resolve,reject)=>requests.push({url,options,resolve(rows){resolve({ok:true,json:async()=>({success:true,data:rows})});},reject}));}};
 core.install(win);const panel=anchor.inserted,$=s=>panel.querySelector(s),start=$('[data-date-start]'),end=$('[data-date-end]'),kind=$('[data-date-kind]');kind.value='actual';
 const toggle=range.beforeNode.children.find(node=>node.className?.includes('lot-date-toggle'));assert.ok(toggle);assert.equal(panel.hidden,true);for(const fn of toggle.listeners.click)fn();assert.equal(panel.hidden,false);assert.equal(toggle.attrs['aria-expanded'],'true');
 const click=(key,value)=>{const button=new Node('button');button.hasAttribute=name=>name===key;button.dataset=value||{};for(const fn of panel.listeners.click)fn({target:{closest:()=>button}});};
 start.value='2026-11-03';end.value='2026-11-02';click('data-date-search');assert.equal(requests.length,0);assert.match($('.lot-date-message').textContent,/늦을/);
 start.value='2026-11-01';end.value='2026-11-02';click('data-date-search');assert.equal(requests.length,2);assert.equal(requests[0].url,'/api/worklog');assert.equal($('[data-date-search]').disabled,true);
 requests[0].resolve(actual);requests[1].resolve(orders);await tick();assert.match($('.lot-date-results').innerHTML,/FIN-1/);assert.doesNotMatch($('.lot-date-results').innerHTML,/FUTURE/);assert.match($('.lot-date-message').textContent,/조회 3건/);
 for(const fn of panel.listeners.click)fn({target:start});const calendar=document.body.children.find(node=>node.className==='lot-date-calendar');assert.ok(calendar);assert.equal(calendar.style.width,'155px');assert.match(calendar.innerHTML,/has-record/);assert.equal(start.attrs['aria-expanded'],'true');
 const dayButton=new Node('button');dayButton.dataset.calDay='2026-11-01';dayButton.hasAttribute=()=>false;for(const fn of calendar.listeners.click)fn({preventDefault(){},target:{closest:()=>dayButton}});assert.equal(start.value,'2026-11-01');assert.equal(start.attrs['aria-expanded'],'false');
 // Selecting a date invalidates prior results; query again before the trace handoff.
 click('data-date-search');requests[2].resolve(actual);requests[3].resolve(orders);await tick();
 click('',{dateOpen:'2'});assert.deepEqual(traceCalls,[['MB-1','intermediate']]);assert.equal($('[data-date-search]').disabled,false);
 click('data-date-search');const stale=requests[4];start.value='2026-12-01';end.value='2026-12-02';for(const fn of start.listeners.change)fn();assert.equal(stale.options.signal.aborted,true);
 stale.resolve(actual);requests[5].resolve(orders);await tick();assert.equal($('.lot-date-results').innerHTML,'');
 click('data-date-search');requests[6].resolve([]);requests[7].resolve(orders);await tick();assert.match($('.lot-date-results').innerHTML,/생산실적이 없습니다/);
 kind.value='work';for(const fn of kind.listeners.change)fn();start.value='2026-11-01';end.value='2026-11-02';click('data-date-search');assert.equal(requests[8].url,'/api/qmes/work-orders');requests[8].resolve(orders);await tick();assert.match($('.lot-date-results').innerHTML,/200/);assert.match($('.lot-date-results').innerHTML,/계획수량/);
 assert.equal(requests.every(r=>!r.options.method),true);
 console.log('PASS: inclusive production dates, actual versus planned quantities, ambiguous linkage, missing dates, date validation, query results, intermediate LOT handoff, stale request cancellation, empty results');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
