const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const service=fs.readFileSync(path.join(__dirname,'../public/js/qmes-common-dialogs-20261021.js'),'utf8');
function app(){
 let document;
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.events={};this.attrs={};this.isConnected=false;}
  append(...nodes){for(const n of nodes){this.children.push(n);n.parent=this;n.isConnected=this.isConnected;}}
  appendChild(node){this.append(node);}
  get firstElementChild(){return this.children[0];}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){(this.events[k]||=[]).push(fn);}
  emit(k,event={}){for(const f of this.events[k]||[])f(event);}
  click(){this.onclick?.();}
  focus(){document.activeElement=this;}
  select(){this.selected=true;}
  showModal(){this.open=true;}
  close(){this.open=false;this.emit('close');}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.isConnected=false;}
 }
 document={createElement:tag=>new Element(tag),head:new Element('head'),body:new Element('body'),activeElement:new Element('button')};
 document.head.isConnected=document.body.isConnected=document.activeElement.isConnected=true;
 const window={},context=vm.createContext({window,document,queueMicrotask,Promise});
 vm.runInContext(service,context);
 const dialog=()=>document.body.children.find(n=>n.tag==='dialog');
 const button=kind=>dialog().children.find(n=>n.tag==='footer').children.find(n=>kind in n.dataset);
 return {window,context,document,dialog,button};
}
test('confirmation stays pending until explicit acceptance and resolves only once',async()=>{
 const a=app();let resolved=false;
 const answer=a.window.qmesConfirm('삭제하시겠습니까?');answer.then(()=>resolved=true);
 await Promise.resolve();assert.equal(resolved,false);
 const accept=a.button('accept');accept.click();accept.click();
 assert.equal(await answer,true);assert.equal(a.dialog(),undefined);
});
test('cancel and Escape are safe negative decisions and restore focus',async()=>{
 const a=app(),previous=a.document.activeElement;
 const first=a.window.qmesConfirm('삭제');a.button('cancel').click();assert.equal(await first,false);
 const second=a.window.qmesConfirm('다시 삭제');let prevented=false;
 a.dialog().emit('cancel',{preventDefault(){prevented=true;}});
 assert.equal(await second,false);assert.equal(prevented,true);assert.equal(a.document.activeElement,previous);
});
test('prompt cancel is null and Enter accepts text without interpreting it as markup',async()=>{
 const a=app(),message='<script>not executable</script>';
 const first=a.window.qmesPrompt(message,'기본값');assert.equal(a.dialog().children[1].textContent,message);
 a.button('cancel').click();assert.equal(await first,null);
 const second=a.window.qmesPrompt('값','before'),input=a.dialog().children.find(n=>n.tag==='input');
 input.value='after';input.emit('keydown',{key:'Enter',preventDefault(){}});
 assert.equal(await second,'after');
});
test('queued alerts and confirms are shown one at a time',async()=>{
 const a=app();a.window.alert('첫 안내');
 const second=a.window.qmesConfirm('둘째 확인');assert.equal(a.document.body.children.length,1);
 a.button('accept').click();await new Promise(setImmediate);
 assert.equal(a.dialog().children[1].textContent,'둘째 확인');
 a.button('cancel').click();assert.equal(await second,false);
});
test('actual IQC delete handler sends no request until approval and none on cancellation',async()=>{
 const a=app(),html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 const start=html.indexOf('async function deleteIncomingRecord('),end=html.indexOf('function wireIncomingPageRows(',start);
 let writes=0;
 Object.assign(a.context,{fetch:async()=>{writes++;return {ok:true,json:async()=>({success:true})};},loadIncomingFromDb:async()=>{},toast(){}});
 vm.runInContext(html.slice(start,end),a.context);
 const pending=vm.runInContext("deleteIncomingRecord({dataset:{}},{id:'fixture'})",a.context);
 assert.equal(writes,0);a.button('cancel').click();await pending;assert.equal(writes,0);
 const approved=vm.runInContext("deleteIncomingRecord({dataset:{}},{id:'fixture'})",a.context);
 assert.equal(writes,0);a.button('accept').click();await approved;assert.equal(writes,1);
});
