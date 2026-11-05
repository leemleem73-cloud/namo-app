const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function element(){return {value:'',textContent:'',disabled:false,open:false,hidden:false,dataset:{},children:[],map:new Map(),events:{},attributes:{},classList:{toggle(){}},setAttribute(k,v){this.attributes[k]=v;},querySelector(s){if(!this.map.has(s))this.map.set(s,element());return this.map.get(s);},querySelectorAll(){return [];},append(...e){this.children.push(...e);},prepend(e){this.children.unshift(e);},replaceChildren(...e){this.children=e;},addEventListener(k,f){this.events[k]=f;},showModal(){this.open=true;},close(){this.open=false;},focus(){}};}
function fixture(){
 const side=element(),body=element(),head=element(),document={body,head,hidden:false,querySelector:()=>side,createElement:()=>element(),addEventListener(){}};
 const pending=[],saved=[],timers=[];let fail=false;
 const fetch=async(path,options={})=>{
  if(!options.method)return {ok:true,status:200,json:async()=>({success:true,data:{ownerId:'alice',notes:[]}})};
  const payload=JSON.parse(options.body);
  if(fail)return {ok:false,status:500,json:async()=>({success:false,message:'저장 실패'})};
  return new Promise(resolve=>pending.push(()=>{saved.push(payload);resolve({ok:true,status:200,json:async()=>({success:true,data:{id:payload.id,title:payload.title,content:payload.content,pinned:payload.pinned,version:payload.version+1,updated_at:'2026-11-05'}})});}));
 };
 const context={document,window:{addEventListener(){}},fetch,AbortSignal,crypto:require('node:crypto').webcrypto,console,setTimeout:f=>{timers.push(f);return timers.length;},clearTimeout(){}};
 let source=fs.readFileSync(__dirname+'/../public/js/qmes-personal-memos-20261105.js','utf8');
 source=source.replace('void load();\n})();','window.__testMemo={load,newNote,flush,dirty,title,content,pin,dialog,status,getActive:()=>active};void load();\n})();');
 vm.runInNewContext(source,context);
 return {api:context.window.__testMemo,pending,saved,setFail:v=>fail=v,timers,body,side};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('autosave retains keystrokes made during an in-flight save and advances the correct version',async()=>{
 const f=fixture();await f.api.load();await f.api.newNote();f.api.title.value='제목';f.api.content.value='처음';f.api.content.events.input();
 const saving=f.api.flush();assert.equal(f.pending.length,1);
 f.api.content.value='최신 입력';f.api.content.events.input();f.pending.shift()();await tick();assert.equal(f.pending.length,1);
 f.pending.shift()();assert.equal(await saving,true);assert.equal(f.saved.length,2);assert.equal(f.saved[0].content,'처음');assert.equal(f.saved[1].content,'최신 입력');assert.equal(f.saved[1].version,1);assert.equal(f.api.getActive().content,'최신 입력');assert.equal(f.api.dirty(),false);assert.equal(f.api.status.textContent,'저장 완료');
});
test('save failure keeps draft text visible and leaves it marked unsaved',async()=>{
 const f=fixture();await f.api.load();await f.api.newNote();f.api.content.value='잃으면 안 되는 메모';f.setFail(true);assert.equal(await f.api.flush(),false);assert.equal(f.api.content.value,'잃으면 안 되는 메모');assert.equal(f.api.dirty(),true);assert.equal(f.api.status.attributes['data-error'],undefined);assert.equal(f.api.status.dataset.error,'1');
});
test('pinning is included in a new private memo save',async()=>{
 const f=fixture();await f.api.load();await f.api.newNote();f.api.content.value='중요한 메모';f.api.pin.onclick();const saving=f.api.flush();f.pending.shift()();await saving;assert.equal(f.saved[0].ownerId,'alice');assert.equal(f.saved[0].pinned,true);
});
