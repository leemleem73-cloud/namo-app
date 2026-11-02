const assert=require('node:assert/strict'),core=require('../public/js/qmes-lot-date-search-20261102.js');
assert.equal(core.dayOf('2026-11-02T00:00:00Z'),'2026-11-02');assert.equal(core.dayOf('2026-02-30'),'');
assert.ok(core.rangeError('2026-11-03','2026-11-02'));assert.deepEqual(core.period('week','2026-11-08'),{start:'2026-11-02',end:'2026-11-08'});
const orders=[{id:'W1',workDate:'2026-11-01',productionType:'중간배치',fields:{'생산 LOT NO':'MB-1','작업지시번호':'WO-1','제품명':'중간재','계획수량':'100','진행상태':'완료'}},{id:'W2',workDate:'2026-11-02',fields:{'생산 LOT NO':'FIN-1','작업지시번호':'WO-2','제품명':'완제품','계획수량':'200','진행상태':'진행'}},{id:'W3',workDate:'2026-11-03',fields:{'생산 LOT NO':'FUTURE'}}];
orders.push({id:'W4',workDate:'2026-10-06',fields:{'생산 LOT NO':'OLD-LOT'}});
assert.deepEqual(core.sheetDatesFor(orders),['2026-11-03','2026-11-02','2026-11-01','2026-10-06']);
const rows=core.rowsFor(orders,'2026-11-01','2026-11-02');assert.equal(rows.length,2);assert.equal(rows[0].lot,'FIN-1');assert.equal(rows[0].quantity,'200');assert.equal(rows[0].status,'진행');assert.equal(rows[1].mode,'intermediate');
const extra=[...orders,{id:'missing',fields:{'생산 LOT NO':'NO-DATE'}},{id:'deleted',deleted:true,workDate:'2026-11-02',fields:{'생산 LOT NO':'DELETED'}},{id:'fallback',fields:{'작업일자':'2026-11-02','생산 LOT NO':'FALLBACK','계획수량':'0'}}];
assert.equal(core.rowsFor(extra,'2026-11-01','2026-11-02').length,3);assert.equal(core.rowsFor(extra,'2026-11-02','2026-11-02').find(r=>r.lot==='FALLBACK').quantity,'0');
const marked=core.recordDates(orders);assert.equal(marked.has('2026-11-01'),true);const cells=core.calendarCells('2026-11-01','2026-11-02','2026-11-01',marked);assert.equal(cells.find(c=>c?.day==='2026-11-02').today,true);assert.equal(cells.find(c=>c?.day==='2026-11-02').recorded,true);
class Node{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.listeners={};this.parts={};this.dataset={};this.attrs={};this.value='';this.disabled=false;this.textContent='';this.innerHTML='';this.style={};this.isConnected=true;}
 append(...nodes){for(const node of nodes){node.parentElement=this;node.isConnected=true;this.children.push(node);}}
 after(node){this.inserted=node;}
 before(node){this.beforeNode=node;}
 remove(){this.isConnected=false;if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this);}
 contains(node){return this===node||this.children.some(child=>child.contains?.(node));}
 focus(){}
 getBoundingClientRect(){return {left:100,top:50,bottom:82,width:220,height:250};}
 dispatchEvent(event){for(const fn of this.listeners[event.type]||[])fn(event);}
 querySelector(selector){return this.parts[selector]||(this.parts[selector]=new Node());}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(type,fn){(this.listeners[type]||=[]).push(fn);}
 replaceChildren(){this.children=[];this.innerHTML='';}
 scrollIntoView(){}
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

async function run(){
 const root=new Node(),anchor=root.querySelector('.lot-search-card'),range=new Node('select'),rangeField=new Node(),docEvents={},requests=[],traceCalls=[],sheetCalls=[];
 rangeField.append(range);
 const document={dispatchEvent(event){for(const fn of docEvents[event.type]||[])fn(event);},body:new Node(),head:new Node(),getElementById:id=>id==='lotRange'?range:id==='lotTrace'?root:id==='lotResultTitle'?new Node():null,createElement:tag=>new Node(tag),addEventListener(type,fn){(docEvents[type]||=[]).push(fn);}};
 const win={CustomEvent:class{constructor(type){this.type=type;}},qmesLotDaily:{open(date){sheetCalls.push(date);}},document,innerWidth:1280,innerHeight:720,Event:class{constructor(type){this.type=type;}},setTimeout,clearTimeout,addEventListener(){},qmesLotTrace:{openLot(...args){traceCalls.push(args);}},fetch(url,options){return new Promise((resolve,reject)=>requests.push({url,options,resolve(rows){resolve({ok:true,json:async()=>({success:true,data:rows})});},reject}));}};
 core.install(win);const panel=anchor.inserted,$=s=>panel.querySelector(s),start=$('[data-date-start]'),end=$('[data-date-end]'),kind=$('[data-date-kind]');assert.equal(kind.value,'work');
 const toggle=range.beforeNode.children.find(node=>node.className?.includes('lot-date-toggle'));for(const fn of toggle.listeners.click)fn();
 assert.equal(requests.length,1);requests[0].resolve(orders);await tick();assert.match($('.lot-date-daily').innerHTML,/2026-10-06/);
 const click=(key,value)=>{const button=new Node('button');button.hasAttribute=name=>name===key;button.dataset=value||{};for(const fn of panel.listeners.click)fn({target:{closest:()=>button}});};
 start.value='2026-11-03';end.value='2026-11-02';click('data-date-search');assert.equal(requests.length,1);
 start.value='2026-11-01';end.value='2026-11-02';click('data-date-search');assert.equal(requests.length,2);assert.equal(requests[1].url,'/api/qmes/work-orders');requests[1].resolve(orders);await tick();
 $('[data-sheet-date]').value='2026-11-01';click('data-date-sheet');assert.deepEqual(sheetCalls,['2026-11-01']);
 assert.match($('.lot-date-daily').innerHTML,/2026-10-06/);assert.match($('.lot-date-daily').innerHTML,/2026-11-03/);
 assert.match($('.lot-date-results').innerHTML,/FIN-1/);assert.doesNotMatch($('.lot-date-results').innerHTML,/FUTURE/);assert.match($('.lot-date-message').textContent,/조회 2건/);assert.match($('.lot-date-results').innerHTML,/계획수량/);
 for(const fn of panel.listeners.click)fn({target:start});const calendar=document.body.children.find(node=>node.className==='lot-date-calendar');assert.ok(calendar);assert.equal(calendar.style.width,'220px');assert.match(calendar.innerHTML,/has-record/);
 const dayButton=new Node('button');dayButton.dataset.calDay='2026-11-01';dayButton.hasAttribute=()=>false;for(const fn of calendar.listeners.click)fn({preventDefault(){},target:{closest:()=>dayButton}});
 click('data-date-search');requests[2].resolve(orders);await tick();click('',{dateOpen:'1'});assert.deepEqual(traceCalls,[['MB-1','intermediate']]);
 click('data-date-search');const stale=requests[3];start.value='2026-12-01';end.value='2026-12-02';for(const fn of start.listeners.change)fn();assert.equal(stale.options.signal.aborted,true);stale.resolve(orders);await tick();assert.equal($('.lot-date-results').innerHTML,'');
 click('data-date-search');requests[4].resolve(orders);await tick();assert.match($('.lot-date-results').innerHTML,/생산기록이 없습니다/);assert.match($('.lot-date-daily').innerHTML,/2026-10-06/);
 for(const fn of docEvents['qmes-lot-conditions-clear'])fn();assert.equal(kind.value,'work');assert.equal(panel.hidden,true);
 assert.equal(requests.every(r=>r.url==='/api/qmes/work-orders'&&!r.options.method),true);
 console.log('PASS: work orders as single production source, date boundaries, saved quantities, same-source calendar markers, LOT handoff, empty results, stale cancellation and reset');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
