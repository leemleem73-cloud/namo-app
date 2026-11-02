const assert=require('node:assert/strict');
const core=require('../public/js/qmes-form-drafts-20261102.js');
class Storage{
 constructor(){this.data=new Map();this.fail=false;}
 getItem(k){return this.data.get(k)||null;}
 setItem(k,v){if(this.fail)throw Error('quota');this.data.set(k,v);}
 removeItem(k){this.data.delete(k);}
}
class Node{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.dataset={};this.style={};this.children=[];this.isConnected=true;this.hidden=false;this.textContent='';}
 append(...nodes){this.children.push(...nodes);}
 prepend(n){this.children.unshift(n);}
 after(){}
 replaceChildren(...nodes){this.children=nodes;}
 setAttribute(k,v){this[k]=v;}
 getAttribute(k){return this[k]||null;}
 hasAttribute(){return false;}
 getClientRects(){return [1];}
 contains(node){return node===this||node.root===this;}
 closest(){return null;}
 querySelector(){return null;}
 querySelectorAll(){return [];}
 remove(){this.isConnected=false;}
}
function input(root,id,value='',type='text',className=''){
 const node=new Node(type==='select-one'?'select':'input');Object.assign(node,{root,id,value,type,name:'',className,disabled:false,readOnly:false,checked:false,options:[]});
 node.matches=selector=>selector==='input,select,textarea';
 node.dispatchEvent=event=>root.env.emit(event.type,{target:node});
 node.add=option=>node.options.push(option);return node;
}
function makeEditor(env,record='new',count=6){
 const root=new Node(),host=new Node();root.env=env;host.dataset={amScreen:'work',amMode:record==='new'?'new':'edit',amRecord:record};
 root.fields=[input(root,'customer'),input(root,'product'),input(root,'date','','date')];
 const password=input(root,'password','never-store','password');root.fields.push(password);
 const readonly=input(root,'workOrderNo','auto');readonly.readOnly=true;root.fields.push(readonly);
 const body={children:[]};
 function addRow(){const row={fields:[input(root,'','NMP','select-one','material-name-select'),input(root,'','','text','material-lot-manual'),input(root,'','','number','plan-input')],querySelector:()=>({click:()=>{const last=body.children.pop();root.fields=root.fields.filter(n=>!last.fields.includes(n));}})};row.fields[0].options=[{value:'NMP'},{value:'SBR'}];body.children.push(row);root.fields.push(...row.fields);}
 for(let i=0;i<count;i++)addRow();
 root.querySelectorAll=selector=>selector==='input,select,textarea'?root.fields:selector==='#workMaterialTable tbody tr'?body.children:[];
 root.querySelector=selector=>selector==='[data-qmes-draft-bar]'?root.children.find(n=>n.dataset.qmesDraftBar):selector==='#workMaterialTable tbody'?body:selector==='#workRowAdd'?{click:addRow}:null;
 host.querySelector=selector=>selector==='.am-detail-pane'?root:null;
 const workspace=new Node();workspace.classList={contains:()=>env.open};workspace.querySelector=()=>host;
 return {root,host,workspace,body,addRow};
}
function environment(storage){
 const listeners={},windowEvents={},env={storage,open:true,fetches:[],response:null,emit:(name,event)=>{for(const fn of listeners[name]||[])fn(event);}};
 env.editor=makeEditor(env);
 const doc={readyState:'complete',head:new Node(),body:new Node(),hidden:false,addEventListener(name,fn){(listeners[name]||=[]).push(fn);},querySelectorAll:()=>[],querySelector:()=>null,getElementById:id=>id==='mainWorkspace'?env.editor.workspace:null,createElement:tag=>new Node(tag)};
 const win={document:doc,localStorage:storage,__QMES_CURRENT_USER__:{id:'user-A'},crypto:{randomUUID:()=>Math.random().toString()},qmesAuthDataReady:{wait:()=>Promise.resolve()},qmesLastView:{isRestoring:()=>false},location:{href:'https://qmes.example/',origin:'https://qmes.example'},getComputedStyle:()=>({display:'block'}),requestAnimationFrame:fn=>setTimeout(fn,0),setTimeout,clearTimeout,confirm:()=>true,addEventListener(name,fn){windowEvents[name]=fn;},fetch(input,options){env.fetches.push({input,options});return env.response?env.response():Promise.resolve({ok:true,clone:()=>({json:async()=>({success:true})})});}};
 env.win=win;env.doc=doc;env.windowEvents=windowEvents;core.install(win);return env;
}
global.MutationObserver=class{observe(){}};
global.Option=class{constructor(text,value){this.text=text;this.value=value;}};
const tick=()=>new Promise(resolve=>setTimeout(resolve,12));
const keys=storage=>[...storage.data.keys()];
function type(env,index,value){const field=env.editor.root.fields[index];field.value=value;env.emit('input',{target:field});env.win.qmesFormDrafts.flush();}
async function run(){
 const storage=new Storage(),repo=core.repository(storage,()=>1000),key=core.keyOf('A','work','new','new');
 repo.write(key,{version:1,actor:'A',fields:[],at:1000,revision:'1'});
 assert.equal(repo.read(key,'B'),null);assert.equal(repo.finish(key,'B','1'),false);assert.ok(storage.getItem(key));
 assert.equal(repo.finish(key,'A','2'),false);assert.equal(repo.finish(key,'A','1'),true);assert.equal(storage.getItem(key),null);
 repo.write(key,{version:1,actor:'A',fields:[],at:1000-core.TTL-1,revision:'1'});assert.equal(repo.read(key,'A'),null);
 assert.equal(core.isRecordWrite('work','/api/qmes/work-orders','POST'),true);
 assert.equal(core.isRecordWrite('work','/api/qmes/work-orders','GET'),false);
 assert.equal(core.isRecordWrite('work','/api/qmes/work-orders/delete-selected','POST'),false);
 assert.equal(core.isRecordWrite('standard','/api/qmes/standard-documents/12/attachments','POST'),false);
 assert.equal(core.successful({ok:false},{success:true}),false);assert.equal(core.successful({ok:true},{success:false}),false);
 const manualStorage=new Storage(),manual=environment(manualStorage);await tick();
 const manualKey=core.keyOf('user-A','work','new','new');
 const saveButton=()=>manual.editor.root.querySelector('[data-qmes-draft-bar]').children.find(n=>n.textContent==='임시저장');
 assert.equal(saveButton().type,'button');
 manual.editor.root.fields[0].value='미완성 고객사';
 let prevented=0,stopped=0;saveButton().onclick({preventDefault(){prevented++;},stopPropagation(){stopped++;}});
 assert.equal(prevented,1);assert.equal(stopped,1);assert.equal(manual.fetches.length,0);
 assert.equal(JSON.parse(manualStorage.getItem(manualKey)).fields.find(f=>f.key.includes('customer')).value,'미완성 고객사');
 assert.equal(manual.editor.root.fields[1].value,'');assert.equal(manual.editor.root.fields[2].value,'');
 assert.match(manual.editor.root.querySelector('[data-qmes-draft-bar]').dataset.message,/임시저장 완료/);
 manual.win.qmesFormDrafts.flush();assert.ok(manualStorage.getItem(manualKey));
 const reopened=environment(manualStorage);await tick();
 const reopenedBar=()=>reopened.editor.root.querySelector('[data-qmes-draft-bar]');
 const reopenedSave=()=>reopenedBar().children.find(n=>n.textContent==='임시저장');
 reopened.win.confirm=()=>false;reopenedSave().onclick();assert.equal(JSON.parse(manualStorage.getItem(manualKey)).fields.find(f=>f.key.includes('customer')).value,'미완성 고객사');
 reopened.win.confirm=()=>true;manualStorage.fail=true;reopenedSave().onclick();
 assert.match(reopenedBar().dataset.message,/임시저장 실패/);assert.ok(reopenedBar().children.some(n=>n.textContent==='복구'));
 manualStorage.fail=false;await reopenedBar().children.find(n=>n.textContent==='복구').onclick();
 assert.equal(reopened.editor.root.fields[0].value,'미완성 고객사');assert.equal(reopened.fetches.length,0);
 reopened.editor.root.fields[0].value='새로운 미완성';reopenedSave().onclick();
 assert.equal(JSON.parse(manualStorage.getItem(manualKey)).fields.find(f=>f.key.includes('customer')).value,'새로운 미완성');
 const env=environment(storage);await tick();type(env,0,'현대자동차');type(env,1,'NBA20HM05');
 const draftKey=core.keyOf('user-A','work','new','new');let saved=JSON.parse(storage.getItem(draftKey));assert.ok(saved);assert.equal(saved.fields.some(f=>f.value==='never-store'||f.value==='auto'),false);assert.equal(env.fetches.length,0);
 env.editor.addRow();type(env,env.editor.root.fields.length-2,'LOT-7');assert.equal(JSON.parse(storage.getItem(draftKey)).rows.work,7);
 env.open=false;env.win.qmesFormDrafts.rescan();await tick();env.editor=makeEditor(env);env.open=true;env.win.qmesFormDrafts.rescan();await tick();
 const banner=env.editor.root.querySelector('[data-qmes-draft-bar]');assert.ok(banner.children.some(n=>n.textContent==='복구'));assert.equal(env.editor.root.fields[0].value,'');
 await banner.children.find(n=>n.textContent==='복구').onclick();assert.equal(env.editor.root.fields[0].value,'현대자동차');assert.equal(env.editor.body.children.length,7);assert.equal(env.editor.root.fields.some(n=>n.value==='LOT-7'),true);assert.equal(env.fetches.length,0);
 env.response=()=>Promise.resolve({ok:false,status:401,clone:()=>({json:async()=>({success:false})})});await env.win.fetch('/api/qmes/work-orders',{method:'POST'});await tick();assert.ok(storage.getItem(draftKey));
 let resolveSave;env.response=()=>new Promise(resolve=>{resolveSave=resolve;});const saving=env.win.fetch('/api/qmes/work-orders',{method:'POST'});type(env,1,'CHANGED DURING SAVE');resolveSave({ok:true,clone:()=>({json:async()=>({success:true})})});await saving;await tick();assert.ok(storage.getItem(draftKey));
 env.response=()=>Promise.resolve({ok:true,clone:()=>({json:async()=>({success:true})})});await env.win.fetch('/api/qmes/work-orders',{method:'POST'});await tick();assert.equal(storage.getItem(draftKey),null);
 type(env,0,'another draft');env.editor=makeEditor(env,'WO-2');env.win.qmesFormDrafts.rescan();await tick();type(env,0,'record two');assert.ok(storage.getItem(core.keyOf('user-A','work','edit','WO-2')));assert.ok(storage.getItem(draftKey));
 env.win.__QMES_CURRENT_USER__={id:'user-B'};env.editor=makeEditor(env);env.windowEvents['qmes-authenticated']();await tick();assert.equal(env.editor.root.querySelector('[data-qmes-draft-bar]').children.some(n=>n.textContent==='복구'),false);type(env,0,'B private');assert.ok(storage.getItem(core.keyOf('user-B','work','new','new')));assert.equal(JSON.parse(storage.getItem(draftKey)).fields.find(f=>f.key.includes('customer')).value,'another draft');
 const fieldBeforeClose=env.editor.root.fields[1];fieldBeforeClose.value='typed right before close';env.emit('input',{target:fieldBeforeClose});env.editor.root.isConnected=false;env.editor.root.fields.forEach(field=>field.isConnected=false);env.open=false;env.win.qmesFormDrafts.rescan();await tick();assert.ok(JSON.parse(storage.getItem(core.keyOf('user-B','work','new','new'))).fields.some(f=>f.value==='typed right before close'));
 env.editor=makeEditor(env);env.open=true;env.win.qmesFormDrafts.rescan();await tick();await env.editor.root.querySelector('[data-qmes-draft-bar]').children.find(n=>n.textContent==='복구').onclick();
 storage.fail=true;type(env,1,'quota input');assert.match(env.editor.root.querySelector('[data-qmes-draft-bar]').dataset.message,/공간이 부족/);storage.fail=false;
 type(env,1,'last input');env.emit('input',{target:env.editor.root.fields[0]});env.windowEvents.pagehide();assert.ok(JSON.parse(storage.getItem(core.keyOf('user-B','work','new','new'))).fields.some(f=>f.value==='last input'));
 env.editor.host.hasAttribute=name=>name==='data-qmes-draft-manual-commit';const ticket=env.win.qmesFormDrafts.beginSave(env.editor.host);await env.win.fetch('/api/qmes/work-orders',{method:'POST'});await tick();assert.ok(storage.getItem(core.keyOf('user-B','work','new','new')));env.win.qmesFormDrafts.completeSave(ticket);assert.equal(storage.getItem(core.keyOf('user-B','work','new','new')),null);
 console.log('PASS: account/document separation, expiry, field filtering, explicit recovery, dynamic material rows, no save during recovery, failed-save retention, in-flight edits retained, successful-save cleanup, quota warning, pagehide flush');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
