/* Menu and detail history. DOM snapshots stay in memory; history contains only route identifiers. */
(function(){
'use strict';
if(window.qmesMenuHistory)return;
var replaying=false,sequence=0,adapters=new Map(),snapshots=new Map(),current=null;
var sessionKey=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function menuFor(page){
 if(!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(page||''))return null;
 return document.querySelector('.sidebar .menu[data-page="'+page+'"]');
}
function currentPage(){return document.querySelector('.sidebar .menu.active[data-page]')?.dataset.page||'dashboard';}
function makeState(page,key,adapter){
 return Object.assign({},history.state||{},{qmesMenuPage:page,qmesViewKey:key||'list',qmesAdapter:adapter||'',qmesEntryId:'qmes-view-'+sessionKey+'-'+(++sequence)});
}
function capture(){
 if(replaying||!current)return;
 var adapter=adapters.get(current.qmesAdapter);
 if(adapter)snapshots.set(current.qmesEntryId,adapter.capture());
}
function hideCurrent(){
 var adapter=current&&adapters.get(current.qmesAdapter);
 adapter?.hide?.();
}
function resetPage(page){
 adapters.forEach(function(adapter){if(adapter.page===page)adapter.reset?.();});
}
function visit(page,key,adapter){
 if(replaying||!menuFor(page)||currentPage()!==page)return;
 if(current?.qmesMenuPage===page&&current.qmesViewKey===key&&current.qmesAdapter===(adapter||''))return;
 var state=makeState(page,key,adapter);
 history.pushState(state,'');current=state;
 if(adapter)capture();
}
function record(page){
 if(replaying||!menuFor(page))return;
 // Reset hooks may render their own screen; do not recapture the screen being left after it was cleared.
 replaying=true;
 try{resetPage(page);}finally{replaying=false;}
 visit(page,'list','');
}
function recordView(page,key,adapter){
 if(replaying)return;
 visit(page,key,key==='list'?'':(adapter||page));
}
function register(name,adapter){adapters.set(name,adapter);}
function beforeMenu(){if(!replaying){capture();hideCurrent();}}
function openWorkspace(page){
 if(replaying)return;
 recordView(page,'workspace-'+(++sequence),'workspace');
 // Callers finish installing form handlers after openModal returns.
 queueMicrotask(capture);
}
register('workspace',{
 capture:function(){return window.qmesWorkspaceHistory?.capture();},
 restore:function(snapshot){return window.qmesWorkspaceHistory?.restore(snapshot);}
});
window.qmesMenuHistory={record:record,recordView:recordView,register:register,capture:capture,beforeMenu:beforeMenu,openWorkspace:openWorkspace};
current=makeState(currentPage(),'list','');history.replaceState(current,'');
window.addEventListener('popstate',function(event){
 var target=event.state,page=target?.qmesMenuPage,menu=menuFor(page);
 if(!menu)return;
 capture();hideCurrent();
 replaying=true;
 try{
  menu.click();
  if(currentPage()!==page){current=makeState(currentPage(),'list','');history.replaceState(current,'');return;}
  resetPage(page);
  current=target;
  if(target.qmesAdapter){
   var adapter=adapters.get(target.qmesAdapter),snapshot=snapshots.get(target.qmesEntryId);
   if(!adapter||!snapshot||adapter.restore(snapshot)===false){
    current=makeState(page,'list','');history.replaceState(current,'');
   }
  }
 }finally{replaying=false;}
});

// Inline equipment details and standalone purchase/equipment editors also participate.
var panelIds=new WeakMap(),panelSequence=0;
function trackPanel(page,name,selector,isOpen,hide){
 var cached=null,lastKey='';
 function read(){
  var node=document.querySelector(selector);
  if(!node||!isOpen(node))return null;
  var anchor=node.firstElementChild||node;
  if(!panelIds.has(anchor))panelIds.set(anchor,++panelSequence);
  return {node:node,parent:node.parentNode,nodes:Array.from(node.childNodes),className:node.className,hidden:node.hidden,style:node.getAttribute('style'),key:'panel:'+panelIds.get(anchor)};
 }
 register(name,{
  page:page,capture:function(){return cached;},
  hide:function(){var node=document.querySelector(selector);if(node)hide(node);},
  reset:function(){var node=document.querySelector(selector);if(node)hide(node);},
  restore:function(snapshot){
   var node=snapshot.node;
   if(!node.isConnected)snapshot.parent.appendChild(node);
   node.replaceChildren.apply(node,snapshot.nodes);node.className=snapshot.className;node.hidden=snapshot.hidden;
   if(snapshot.style===null)node.removeAttribute('style');else node.setAttribute('style',snapshot.style);
   cached=snapshot;lastKey=snapshot.key;return true;
  }
 });
 return function(){
  if(replaying||currentPage()!==page)return;
  var next=read();
  if(next){
   if(next.key===lastKey)return;
   capture();cached=next;lastKey=next.key;recordView(page,next.key,name);
  }else{
   lastKey='';
   if(current?.qmesAdapter===name)record(page);
  }
 };
}
if(typeof MutationObserver!=='undefined'&&document.body){
 var checkPanels=[
  trackPanel('equipment','equipment-detail','#eqDetail',function(node){return node.classList.contains('show');},function(node){node.classList.remove('show');}),
  trackPanel('equipment','equipment-editor','.eq-wo-overlay',function(node){return node.isConnected&&!node.hidden;},function(node){node.remove();}),
  trackPanel('purchase','purchase-editor','#namo-purchase-new-enterprise',function(node){return !node.hidden;},function(node){node.hidden=true;})
 ],scheduled=false;
 new MutationObserver(function(){
  if(scheduled)return;scheduled=true;
  queueMicrotask(function(){scheduled=false;checkPanels.forEach(function(check){check();});});
 }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});
}

document.addEventListener('keydown',function(event){
 if(event.defaultPrevented||event.isComposing||event.repeat||event.ctrlKey||event.metaKey||event.altKey)return;
 if(event.target?.closest?.('input,textarea,select,[contenteditable],[role="textbox"]'))return;
 if(event.key==='Backspace'||event.key==='BrowserBack'||event.key==='GoBack'){
  event.preventDefault();history.back();
 }else if(event.key==='BrowserForward'||event.key==='GoForward'){
  event.preventDefault();history.forward();
 }
});
})();
