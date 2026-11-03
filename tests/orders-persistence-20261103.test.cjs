const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../public/js/qmes-orders-persistence-20261103.js');
const example={id:'order-a',orderDate:'2026-11-03',customer:'고객사',product:'제품',qty:'160.5',due:'2026-11-10',confirmedDue:'',status:'대기',remarks:'비고'};
test('new order is persisted as one independent DB record and survives reload',async()=>{
 const db=new Map([['erp:sales',{rows:[{id:'legacy',customer:'기존',product:'기존제품',qty:10,due:'2026-11-10',orderDate:'2026-11-01'}]}]]);
 const fetcher=async(url,options)=>{
  if(options.method==='POST'){const body=JSON.parse(options.body);db.set(body.key,body.payload);return {ok:true,json:async()=>({success:true,data:{record_key:body.key,payload:body.payload}})};}
  return {ok:true,json:async()=>({success:true,data:[...db].map(([record_key,payload])=>({record_key,payload}))})};
 };
 const saved=await api.persist(fetcher,example);assert.equal(saved.qty,160.5);assert.equal(db.size,2);
 const records=await api.request(fetcher,'/api/qmes-sync/inventory');const rows=api.recordsFromSync(records);assert.equal(rows.length,2);assert.equal(rows[0].id,'order-a');assert.equal(rows[0].confirmedDue,'');assert.equal(rows[0].remarks,'비고');
 await api.persist(fetcher,{...saved,qty:200});assert.equal(db.size,2);const refreshed=api.recordsFromSync(await api.request(fetcher,'/api/qmes-sync/inventory'));assert.equal(refreshed.find(r=>r.id==='order-a').qty,200);assert.equal(refreshed.find(r=>r.id==='legacy').qty,10);
});
test('save rejects invalid input before sending data; confirmation date is optional',async()=>{
 let requests=0;const fetcher=async()=>{requests++;throw Error('must not send');};
 for(const values of [{customer:''},{product:''},{qty:''},{qty:'0'},{qty:'NaN'},{orderDate:''},{due:'2026-10-01'}])await assert.rejects(api.persist(fetcher,{...example,...values}));
 assert.equal(requests,0);assert.equal(api.validate(example).confirmedDue,'');
});
test('HTTP error, failed JSON, expired login and false success never report a completed save',async()=>{
 for(const response of [
 {ok:false,status:500,json:async()=>({success:false,message:'DB 장애'})},
 {ok:false,status:401,json:async()=>null},
 {ok:true,json:async()=>{throw Error('HTML response');}},
 {ok:true,json:async()=>({success:false,message:'거절'})},
 {ok:true,json:async()=>({success:true,data:{record_key:'wrong'}})}
 ])await assert.rejects(api.persist(async()=>response,example));
});
test('existing legacy sales aliases are read and individual edits override only their matching row',()=>{
 const rows=api.recordsFromSync([
 {record_key:'erp:sales',payload:JSON.stringify({rows:[{id:'L',orderMeta:{orderDate:'2026-11-01',requestedDue:'2026-11-10',customerOverride:'고객',productOverride:'제품'},qty:10}]})},
 {record_key:'erp:purchase',payload:{rows:[{id:'unrelated'}]}},
 {record_key:'sales-order:L',payload:{rows:[{...example,id:'L',qty:22}]}},
 {record_key:'sales-order:deleted',payload:{deleted:true,rows:[example]}}
 ]);assert.equal(rows.length,1);assert.equal(rows[0].qty,22);
});
test('commercial permissions cover individual sales-order keys for both reads and writes',()=>{
 const fs=require('node:fs'),vm=require('node:vm');const source=fs.readFileSync(__dirname+'/../server-legacy-20260903.js','utf8');const start=source.indexOf('function isRestrictedCommercialSync'),end=source.indexOf('\n}',start)+2;const context={};vm.runInNewContext(source.slice(start,end),context);
 for(const key of ['erp:sales','erp:purchase','sales-order:order-a'])assert.equal(context.isRestrictedCommercialSync('inventory',key),true);
 assert.equal(context.isRestrictedCommercialSync('inventory','erp:plan'),false);assert.equal(context.isRestrictedCommercialSync('oqc','sales-order:x'),false);
});
test('real save click blocks demo close, preserves failed input and prevents double submissions',async()=>{
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 const notices=[],listeners={},controls=new Map(),buttons=[{disabled:false},{disabled:false}];let closed=0,completed=0,posts=0,resolvePost;
 const labels={orderDate:'수주일자',customer:'고객사',product:'제품명',qty:'수량',due:'요청납기',confirmedDue:'확정일자',status:'진행상태',remarks:'비고'};
 const cells=Object.entries(labels).map(([key,label])=>{const control={value:example[key]};controls.set(key,control);return {querySelector:selector=>selector==='label'?{textContent:label}:control};});
 const pane={dataset:{},querySelectorAll:()=>cells,querySelector:()=>null,prepend:node=>notices.push(node)};
 const body={innerHTML:'',querySelectorAll:()=>[]};const section={dataset:{},classList:{contains:()=>true},querySelector:selector=>selector.includes('tbody')?body:null,prepend:node=>notices.push(node)};
 const doc={getElementById:()=>section,querySelector:()=>pane,querySelectorAll:()=>buttons,addEventListener:(name,fn)=>listeners[name]=fn,createElement:()=>({dataset:{},style:{},setAttribute(){}})};
 const win={document:doc,crypto:{randomUUID:()=>example.id},toast(){},closeModal(){closed++;},qmesFormDrafts:{beginSave:()=>({}),completeSave:()=>completed++},fetch:async(_url,options)=>{if(options.method==='POST'){posts++;return await new Promise(resolve=>resolvePost=resolve);}return {ok:true,json:async()=>({success:true,data:[]})};}};
 api.install(win);await flush();
 let stopped=0;const click=()=>listeners.click({target:{closest:selector=>selector.includes('data-am-save')?{}:null},preventDefault(){},stopImmediatePropagation(){stopped++;}});
 click();click();await flush();assert.equal(posts,1);assert.equal(closed,0);assert.equal(stopped,2);
 resolvePost({ok:false,status:500,json:async()=>({success:false,message:'DB 실패'})});await flush();
 assert.equal(closed,0);assert.equal(completed,0);assert.equal(controls.get('customer').value,example.customer);assert.ok(notices.some(node=>node.textContent==='DB 실패'));assert.ok(buttons.every(b=>!b.disabled));
 click();await flush();assert.equal(posts,2);resolvePost({ok:true,json:async()=>({success:true,data:{record_key:'sales-order:'+example.id}})});await flush();
 assert.equal(closed,1);assert.equal(completed,1);assert.ok(body.innerHTML.includes(example.product));
});
