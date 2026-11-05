const test=require('node:test'),assert=require('node:assert/strict');
const {install,parse,appearance}=require('../qmes-personal-memos-20261105.cjs');
const id='12345678-1234-1234-1234-123456789abc';
function fixture(){
 const rows=new Map(),routes={};let failWrite=false,queries=0;
 const pool={async query(sql,args=[]){
  queries++;if(sql.startsWith('CREATE TABLE')||sql.startsWith('ALTER TABLE'))return {rows:[]};
  const key=args[0]+'|'+args[1],old=rows.get(key);
  if(sql.startsWith('INSERT INTO')){if(failWrite)throw Error('offline');if(old)return {rows:[]};const saved={id:args[1],title:args[2],content:args[3],pinned:args[4],appearance:JSON.parse(args[5]||'{}'),version:1,created_at:'2026-11-05',updated_at:'2026-11-05',user_id:args[0]};rows.set(key,saved);return {rows:[{...saved}]};}
  if(sql.startsWith('UPDATE')&&sql.includes('SET deleted_at')){if(old&&!old.deleted_at&&old.version===args[2]){old.deleted_at='2026-11-05';old.version++;return {rows:[{id:old.id}]};}return {rows:[]};}
  if(sql.startsWith('UPDATE')){if(failWrite)throw Error('offline');if(!old||old.deleted_at||old.version!==args[5])return {rows:[]};Object.assign(old,{title:args[2],content:args[3],pinned:args[4],appearance:args[6]?JSON.parse(args[6]):old.appearance,version:old.version+1});return {rows:[{...old}]};}
  if(sql.startsWith('SELECT')&&sql.includes('AND id=$2'))return {rows:old?[{...old}]:[]};
  if(sql.startsWith('SELECT'))return {rows:[...rows.values()].filter(r=>r.user_id===args[0]&&!r.deleted_at).map(r=>({...r}))};
  throw Error(sql);
 }};
 const login=()=>{};install({get:(p,...h)=>routes['GET '+p]=h,post:(p,...h)=>routes['POST '+p]=h},{pool,requireLogin:login});
 async function call(method,path,body,user='alice'){const req={body,session:user?{user:{id:user}}:{}};const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;}};await routes[method+' '+path].at(-1)(req,res);return res;}
 return {call,rows,routes,login,setFail:v=>failWrite=v,count:()=>queries};
}
const memo=(change={})=>({ownerId:'alice',id,title:'메모',content:'개인 내용',pinned:false,version:0,...change});
test('all memo routes require login and reject missing identity before querying',async()=>{const f=fixture();assert(Object.values(f.routes).every(h=>h[0]===f.login));const r=await f.call('GET','/api/personal-memos',null,null);assert.equal(r.statusCode,401);assert.equal(f.count(),0);});
test('one account cannot list, update or delete another account memo',async()=>{const f=fixture();assert.equal((await f.call('POST','/api/personal-memos',memo())).statusCode,200);const bob=await f.call('GET','/api/personal-memos',null,'bob');assert.deepEqual(bob.body.data.notes,[]);assert.equal(bob.headers['Cache-Control'],'private, no-store');assert.equal((await f.call('POST','/api/personal-memos',memo({version:1}),'bob')).statusCode,403);assert.equal((await f.call('POST','/api/personal-memos',memo({ownerId:'bob',version:1,content:'tamper'}),'bob')).statusCode,409);assert.equal((await f.call('POST','/api/personal-memos/delete',{ownerId:'bob',id,version:1},'bob')).statusCode,409);assert.equal(f.rows.get('alice|'+id).content,'개인 내용');});
test('updates are versioned; retry is idempotent and stale changes cannot overwrite newer text',async()=>{const f=fixture();await f.call('POST','/api/personal-memos',memo());const next=memo({version:1,content:'수정',pinned:true});const saved=await f.call('POST','/api/personal-memos',next);assert.equal(saved.body.data.version,2);assert.equal((await f.call('POST','/api/personal-memos',next)).body.data.version,2);assert.equal((await f.call('POST','/api/personal-memos',memo({version:1,content:'stale'}))).statusCode,409);assert.equal(f.rows.get('alice|'+id).content,'수정');});
test('deletion is private, repeatable and cannot be undone by an old autosave',async()=>{const f=fixture();await f.call('POST','/api/personal-memos',memo());const body={ownerId:'alice',id,version:1};assert.equal((await f.call('POST','/api/personal-memos/delete',body)).statusCode,200);assert.equal((await f.call('POST','/api/personal-memos/delete',body)).statusCode,200);assert.equal((await f.call('POST','/api/personal-memos',memo())).statusCode,409);assert.deepEqual((await f.call('GET','/api/personal-memos')).body.data.notes,[]);});
test('invalid and failed saves never report success',async()=>{assert.throws(()=>parse(memo({content:'x'.repeat(5001)})));assert.throws(()=>parse(memo({version:-1})));const f=fixture();f.setFail(true);const r=await f.call('POST','/api/personal-memos',memo());assert.equal(r.statusCode,500);assert.equal(r.body.success,false);assert.equal(f.rows.size,0);});

test('note appearance persists with content, survives old-client updates and is validated',async()=>{
 const f=fixture(),style={paper:'pink',font:'serif',size:18,bold:true};
 const created=await f.call('POST','/api/personal-memos',memo({appearance:style}));assert.equal(created.statusCode,200);assert.deepEqual(created.body.data.appearance,style);
 assert.deepEqual((await f.call('GET','/api/personal-memos')).body.data.notes[0].appearance,style);
 const updated=await f.call('POST','/api/personal-memos',memo({version:1,content:'양식 유지'}));assert.deepEqual(updated.body.data.appearance,style);
 assert.throws(()=>appearance({font:'injected'}));assert.throws(()=>appearance({size:999}));assert.throws(()=>appearance({paper:'invalid'}));
});

test('extended appearance options round-trip while legacy appearance remains compatible',async()=>{
 const f=fixture(),style={paper:'mint',font:'gothic',size:24,bold:true,align:'right',shape:'square'};
 const saved=await f.call('POST','/api/personal-memos',memo({appearance:style}));assert.deepEqual(saved.body.data.appearance,style);assert.deepEqual((await f.call('GET','/api/personal-memos')).body.data.notes[0].appearance,style);
 for(const paper of ['yellow','white','blue','pink','green','lavender','peach','mint','teal','lilac','gray','sand'])assert.equal(appearance({paper}).paper,paper);
 assert.throws(()=>appearance({align:'invalid'}));assert.throws(()=>appearance({shape:'invalid'}));assert(!Object.hasOwn(appearance({paper:'white',font:'default',size:14,bold:false}),'align'));
});
