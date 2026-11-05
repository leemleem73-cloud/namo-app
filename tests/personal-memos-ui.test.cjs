const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function element(){return {style:{setProperty(){}},value:'',textContent:'',disabled:false,open:false,hidden:false,dataset:{},children:[],map:new Map(),events:{},attributes:{},classList:{toggle(){}},setAttribute(k,v){this.attributes[k]=v;},querySelector(s){if(!this.map.has(s))this.map.set(s,element());return this.map.get(s);},querySelectorAll(){return [];},append(...e){this.children.push(...e);},prepend(e){this.children.unshift(e);},replaceChildren(...e){this.children=e;},addEventListener(k,f){this.events[k]=f;},showModal(){this.open=true;},close(){this.open=false;},focus(){}};}
function fixture(){
 const side=element(),body=element(),head=element(),document={body,head,hidden:false,querySelector:()=>side,createElement:()=>element(),addEventListener(){}};
 const pending=[],saved=[],timers=[];let fail=false,getFail=false,holdGet=false;const gets=[];
 const fetch=async(path,options={})=>{
  if(!options.method){if(getFail)return {ok:false,status:500,json:async()=>({success:false,message:'조회 실패'})};const response={ok:true,status:200,json:async()=>({success:true,data:{ownerId:'alice',notes:[]}})};if(holdGet)return new Promise(resolve=>gets.push(()=>resolve(response)));return response;}
  const payload=JSON.parse(options.body);
  if(fail)return {ok:false,status:500,json:async()=>({success:false,message:'저장 실패'})};
  return new Promise(resolve=>pending.push(()=>{saved.push(payload);resolve({ok:true,status:200,json:async()=>({success:true,data:{id:payload.id,title:payload.title,content:payload.content,pinned:payload.pinned,appearance:payload.appearance,version:payload.version+1,created_at:'2026-11-04T16:00:00Z',updated_at:'2026-11-05T00:30:00Z'}})});}));
 };
 const context={document,window:{addEventListener(){}},fetch,AbortSignal,crypto:require('node:crypto').webcrypto,console,setTimeout:f=>{timers.push(f);return timers.length;},clearTimeout(){}};
 let source=fs.readFileSync(__dirname+'/../public/js/qmes-personal-memos-20261105.js','utf8');
 source=source.replace('void load();\n})();','window.__testMemo={load,newNote,flush,dirty,title,content,pin,dialog,status,getActive:()=>active};void load();\n})();');
 vm.runInNewContext(source,context);
 return {api:context.window.__testMemo,pending,saved,gets,setGetFail:v=>getFail=v,setHoldGet:v=>holdGet=v,setFail:v=>fail=v,timers,body,side};
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

test('temporary reload failure preserves the current private draft',async()=>{const f=fixture();await f.api.load();await f.api.newNote();f.api.content.value='초안 유지';f.api.content.events.input();f.setGetFail(true);await f.api.load();assert.equal(f.api.content.value,'초안 유지');assert.equal(f.api.dirty(),true);});
test('an older GET response cannot erase a draft typed while it was loading',async()=>{const f=fixture();await f.api.load();await f.api.newNote();f.setHoldGet(true);const loading=f.api.load();f.api.content.value='늦은 조회보다 최신 입력';f.api.content.events.input();f.gets.shift()();await loading;assert.equal(f.api.content.value,'늦은 조회보다 최신 입력');assert.equal(f.api.dirty(),true);});

test('Save closes only after persisted success and exposes the saved note on home',async()=>{
 const f=fixture();await f.api.load();await f.api.newNote();f.api.content.value='메인에 표시할 메모';f.api.content.events.input();
 const saving=f.api.dialog.querySelector('[data-save]').onclick();assert.equal(f.api.dialog.open,true);f.pending.shift()();await saving;assert.equal(f.api.dialog.open,false);assert.equal(f.api.dirty(),false);
 const preview=f.side.children[0].querySelector('.pm-preview');assert.equal(preview.children[0].children[1].textContent,'메인에 표시할 메모');
});
test('failed manual Save leaves editor open and retains all input',async()=>{
 const f=fixture();await f.api.load();await f.api.newNote();f.api.content.value='저장 실패해도 유지';f.setFail(true);await f.api.dialog.querySelector('[data-save]').onclick();assert.equal(f.api.dialog.open,true);assert.equal(f.api.content.value,'저장 실패해도 유지');assert.equal(f.api.status.dataset.error,'1');
});
test('paper, font, size and weight save with the note',async()=>{
 const f=fixture();await f.api.load();await f.api.newNote();f.api.content.value='양식 메모';
 f.api.dialog.querySelector('[data-paper]').value='pink';f.api.dialog.querySelector('[data-font]').value='serif';f.api.dialog.querySelector('[data-size]').value='18';
 f.api.dialog.querySelector('[data-paper]').events.change();f.api.dialog.querySelector('[data-bold]').onclick();
 const saving=f.api.dialog.querySelector('[data-save]').onclick();f.pending.shift()();await saving;
 assert.deepEqual(JSON.parse(JSON.stringify(f.saved[0].appearance)),{paper:'pink',font:'serif',size:18,bold:true,align:'left',shape:'rounded'});assert.equal(f.api.dialog.open,false);
});

test('alignment, shape, extra colors and larger text persist with the note',async()=>{
 const f=fixture();await f.api.load();await f.api.newNote();f.api.content.value='가운데 메모';
 for(const [key,value] of [['paper','lavender'],['size','24'],['align','center'],['shape','square']])f.api.dialog.querySelector('[data-'+key+']').value=value;
 f.api.dialog.querySelector('[data-align]').events.change();const saving=f.api.dialog.querySelector('[data-save]').onclick();f.pending.shift()();await saving;
 assert.deepEqual(JSON.parse(JSON.stringify(f.saved[0].appearance)),{paper:'lavender',font:'default',size:24,bold:false,align:'center',shape:'square'});assert.equal(f.api.dialog.open,false);
 assert(f.api.dialog.querySelector('[data-created]').textContent.includes('01:00'));assert(f.api.dialog.querySelector('[data-updated]').textContent.includes('09:30'));
});
test('today insertion respects cursor selection and the content limit',async()=>{
 const f=fixture();await f.api.load();await f.api.newNote();f.api.content.value='날짜: ';f.api.content.selectionStart=4;f.api.content.selectionEnd=4;
 f.api.dialog.querySelector('[data-today]').onclick();assert.match(f.api.content.value,/^날짜: \d{4}-\d{2}-\d{2}$/);assert.equal(f.api.dirty(),true);
 f.api.content.value='x'.repeat(5000);f.api.content.selectionStart=5000;f.api.content.selectionEnd=5000;f.api.dialog.querySelector('[data-today]').onclick();assert.equal(f.api.content.value.length,5000);assert.equal(f.api.status.dataset.error,'1');
});
