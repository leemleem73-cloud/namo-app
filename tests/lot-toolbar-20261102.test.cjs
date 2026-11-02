const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const nodes={},windowListeners={},events=[];let nativeMode=null;
class Node{
 constructor(tag='div',id=''){this.tagName=tag;this.id=id;this.dataset={};this.children=[];this.parts={};this.value='';this.textContent='';this.listeners={};this.style={removeProperty(){}};const classes=new Set();this.classList={add:c=>classes.add(c),contains:c=>classes.has(c),toggle(c,on){if(on)classes.add(c);else classes.delete(c);}};if(id)nodes['#'+id]=this;}
 append(...children){for(const child of children){child.remove();child.parentElement=this;this.children.push(child);}}
 prepend(child){child.remove();child.parentElement=this;this.children.unshift(child);}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(c=>c!==this);this.parentElement=null;}
 before(child){if(!this.parentElement)return;child.parentElement=this.parentElement;this.parentElement.children.splice(this.parentElement.children.indexOf(this),0,child);}
 replaceChildren(){this.children=[];}
 setAttribute(key,value){this[key]=value;}
 addEventListener(type,fn){(this.listeners[type]||=[]).push(fn);}
 closest(selector){if(selector==='.lot-field')return rangeField;if(selector==='#lotTrace button')return this.tagName==='button'?this:null;return null;}
 querySelector(selector){if(selector==='select')return this.parts.select||null;return nodes[selector]||null;}
 querySelectorAll(){return [];}
 set innerHTML(value){this.html=value;if(value.includes('lot-mode-native')){nativeMode=new Node('select');this.parts.select=nativeMode;}}
 get innerHTML(){return this.html||'';}
 click(){const event={target:this,preventDefault(){},stopImmediatePropagation(){this.stopped=true;}};for(const fn of windowListeners.click||[]){fn(event);if(event.stopped)break;}if(!event.stopped){this.onclick?.(event);for(const fn of this.listeners.click||[])fn(event);}}
}
const root=new Node(),shell=new Node(),grid=new Node(),search=new Node(),tabs=new Node(),summary=new Node('div','lotSummary'),rangeField=new Node(),queryField=new Node();
const range=new Node('select','lotRange'),input=new Node('input','lotQueryInput'),label=new Node('label','lotQueryLabel'),clear=new Node('button','lotResetBtn'),query=new Node('button','lotSearchBtn'),title=new Node('b','lotResultTitle'),heading=new Node();
const result=new Node('div','lotResultBody');new Node('span','lotResultMeta');new Node('p','lotHelp');const card=new Node();card.append(title,result);
queryField.append(label,input);rangeField.append(range);grid.append(queryField,rangeField,query,clear);search.append(grid);shell.append(tabs,search,summary,card);root.append(shell);
nodes['.lot-shell']=shell;nodes['.lot-mode-tabs']=tabs;nodes['.lot-search-grid']=grid;nodes['.lot-search-card']=search;nodes['.lot-hero-copy h1']=heading;nodes['.lot-hero-status b']=new Node();nodes['.lot-hero-status small']=new Node();
for(const id of ['lotRawMode','lotIntermediateMode','lotFinishedMode']){const button=new Node('button',id);if(id==='lotRawMode')button.classList.add('active');tabs.append(button);}
const originalQuery=root.querySelector.bind(root);root.querySelector=selector=>selector==='.lot-mode-native'?nativeMode:originalQuery(selector);
const document={head:new Node(),querySelector:selector=>selector==='#lotTrace'?root:null,createElement:tag=>new Node(tag),createTextNode:text=>{const node=new Node();node.textContent=text;return node;},dispatchEvent:event=>events.push(event.type)};
const calls=[];const context={document,AbortController,setTimeout,clearTimeout,console,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},toast(){},fetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({success:true,data:[]})};},addEventListener(type,fn){(windowListeners[type]||=[]).push(fn);}};context.window=context;
vm.runInNewContext(fs.readFileSync(require.resolve('../public/js/qmes-lot-trace-linked-20261021.js'),'utf8'),context);
vm.runInNewContext(fs.readFileSync(require.resolve('../public/js/qmes-lot-work-frame-20261016.js'),'utf8'),context);
async function run(){
 assert.equal(grid.children.at(-1).className,'lot-work-buttons');assert.equal(query.parentElement,clear.parentElement);assert.equal(query.parentElement.parentElement,grid);assert.equal(query.textContent,'조회');
 nativeMode.value='finished';nativeMode.onchange();assert.equal(input.placeholder,'완제품 LOT 입력');assert.equal(nativeMode.value,'finished');
 await context.qmesLotTrace.openLot(' mb-101 ','intermediate');assert.equal(nativeMode.value,'intermediate');assert.equal(input.value,'MB-101');assert.equal(label.textContent,'중간재 배치번호');assert.equal(calls.length,9);assert.ok(calls[0].url.includes('keyword=MB-101'));assert.equal(calls.every(c=>!c.options.method),true);
 range.value='출하 이력';clear.click();assert.equal(range.value,'전체 이력');assert.equal(nativeMode.value,'raw');assert.equal(input.value,'');assert.ok(events.includes('qmes-lot-conditions-clear'));
 console.log('PASS: one-row action placement, dropdown changes actual trace mode, date result handoff synchronizes dropdown, search endpoints, complete condition reset');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
