const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../public/js/qmes-quality-gate-20261021.js'),'utf8');
class Node {
 constructor(tag='div'){this.tagName=tag;this.children=[];this.listeners={};this.attrs={};this.value='';this.hidden=false;this.disabled=false;this.open=false;this.textContent='';this.innerHTML='';}
 appendChild(node){this.children.push(node);return node;}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(key,value){this.attrs[key]=value;}
 addEventListener(name,fn){this.listeners[name]=fn;}
 focus(){this.focused=true;}
 showModal(){this.open=true;}
 close(){this.open=false;this.listeners.close?.();}
 querySelector(selector){return this.parts?.[selector]||null;}
}
function environment(){
 const requests=[],timers=new Map();let timerId=0,dialog;
 const selectors=['.qgate-error','tbody','.qgate-history','.qgate-permission','.qgate-count','.qgate-scroll','.qgate-release','.qgate-release-title','.qgate-close','[data-load]','[name="lot"]','[data-cancel]','[data-hold]','[data-submit]','[name="reason"]','[name="kind"]'];
 const doc={head:new Node(),body:new Node(),getElementById(){return null;},querySelector(){return null;},createTextNode:text=>({textContent:text}),createElement(tag){const node=new Node(tag);if(tag==='dialog'){dialog=node;node.parts=Object.fromEntries(selectors.map(s=>[s,new Node()]));node.parts['[name="kind"]'].parentElement=new Node();}return node;}};
 const context={document:doc,AbortController,MutationObserver:class{observe(){}},queueMicrotask,console,
 setTimeout(fn){const id=++timerId;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);},
 fetch(url,options){return new Promise((resolve,reject)=>requests.push({url,options,resolve(data){resolve({ok:true,status:200,json:async()=>({success:true,data})});},fail(message){resolve({ok:false,status:500,json:async()=>({success:false,message})});},reject}));}};
 context.window=context;vm.runInNewContext(source,context);
 return {context,doc,requests,timers,get dialog(){return dialog;}};
}
const data=lot=>({holds:[{id:83,lot,reason:'품질 확인',created_at:'2026-11-02T00:00:00Z'}],events:[],canRelease:true});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function run(){
 const e=environment();assert.ok(e.dialog,'dialog should be prepared before first click');assert.equal(e.dialog.open,false);assert.equal(e.requests.length,0);
 e.context.qmesOpenQualityGate();
 assert.equal(e.dialog.open,true,'dialog opens before network resolves');
 assert.match(e.dialog.querySelector('tbody').innerHTML,/불러오는 중/);assert.equal(e.dialog.querySelector('.qgate-scroll').attrs['aria-busy'],'true');
 assert.equal(e.dialog.querySelector('[name="lot"]').focused,true);
 const first=e.requests[0];assert.ok(first.url.endsWith('/holds?lot='));
 e.dialog.querySelector('[name="lot"]').value='LOT-B';const next=e.dialog.querySelector('[data-load]').onclick();
 assert.equal(first.options.signal.aborted,true,'previous request is cancelled');
 const ordered=data('LOT-B');ordered.holds.push({...ordered.holds[0],id:901,lot:'LOT-C'});e.requests[1].resolve(ordered);await next;assert.match(e.dialog.querySelector('tbody').innerHTML,/LOT-B/);assert.equal(e.dialog.querySelector('.qgate-count').textContent,'조회 2건');
 assert.match(e.dialog.querySelector('tbody').innerHTML,/<tr><td>1<\/td>/);assert.doesNotMatch(e.dialog.querySelector('tbody').innerHTML,/<tr><td>83<\/td>/);
 assert.match(e.dialog.querySelector('tbody').innerHTML,/<tr><td>2<\/td>/);assert.match(e.dialog.querySelector('tbody').innerHTML,/data-release="901"/);
 first.resolve(data('STALE-LOT'));await tick();assert.doesNotMatch(e.dialog.querySelector('tbody').innerHTML,/STALE-LOT/);
 assert.equal(e.dialog.querySelector('.qgate-scroll').attrs['aria-busy'],'false');
 const failure=e.dialog.querySelector('[data-load]').onclick();e.requests[2].fail('조회 오류');await failure;
 assert.equal(e.dialog.querySelector('.qgate-error').textContent,'조회 오류');assert.match(e.dialog.querySelector('tbody').innerHTML,/다시 조회/);
 const retry=e.dialog.querySelector('[data-load]').onclick();e.requests[3].resolve({holds:[],events:[],canRelease:false});await retry;
 assert.match(e.dialog.querySelector('tbody').innerHTML,/보류 내역이 없습니다/);assert.equal(e.dialog.querySelector('.qgate-error').textContent,'');
 e.context.qmesOpenQualityGate();const closing=e.requests[4];e.dialog.querySelector('.qgate-close').onclick();assert.equal(closing.options.signal.aborted,true);
 closing.resolve(data('CLOSED'));await tick();assert.equal(e.dialog.open,false);assert.doesNotMatch(e.dialog.querySelector('tbody').innerHTML,/CLOSED/);
 e.context.qmesOpenQualityGate();const timeout=e.requests[5];const onTimeout=[...e.timers.values()][0];onTimeout();assert.equal(timeout.options.signal.aborted,true);timeout.reject(Error('aborted'));await tick();
 assert.match(e.dialog.querySelector('.qgate-error').textContent,/조회가 지연/);assert.equal(e.timers.size,0);
 // Opening, filtering, retrying, and closing must never hold or release a LOT.
 assert.equal(e.requests.every(r=>!r.options.method),true);
 e.dialog.querySelector('[name="lot"]').value='LOT-M';e.dialog.querySelector('[data-hold]').onclick();
 e.dialog.querySelector('[name="reason"]').value='검토 필요';
 const post=e.dialog.querySelector('[data-submit]').onclick();
 assert.ok(e.requests[6].url.endsWith('/hold'));assert.equal(e.requests[6].options.method,'POST');assert.equal(JSON.parse(e.requests[6].options.body).lot,'LOT-M');
 e.requests[6].resolve({id:9});await tick();e.requests[7].resolve({holds:[],events:[],canRelease:false});await post;
 assert.equal(e.dialog.querySelector('[data-submit]').disabled,false);
 console.log('PASS: sequential row numbering, centered cells, dialog-level scrolling, prepared dialog, immediate loading, stale response isolation, close cancellation, timeout/retry, unchanged explicit hold submission');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
