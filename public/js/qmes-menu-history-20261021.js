/* Keep menu navigation in browser history while existing menus and tabs own rendering. */
(function(){
'use strict';
if(window.qmesMenuHistory)return;
var replaying=false;
function menuFor(page){
 if(!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(page||''))return null;
 return document.querySelector('.sidebar .menu[data-page="'+page+'"]');
}
function currentPage(){
 return document.querySelector('.sidebar .menu.active[data-page]')?.dataset.page||'dashboard';
}
function stateFor(page){return Object.assign({},history.state||{},{qmesMenuPage:page});}
function record(page){
 if(replaying||!menuFor(page)||history.state?.qmesMenuPage===page)return;
 history.pushState(stateFor(page),'');
}
window.qmesMenuHistory={record:record};
history.replaceState(stateFor(currentPage()),'');
window.addEventListener('popstate',function(event){
 var page=event.state?.qmesMenuPage,menu=menuFor(page);
 if(!menu)return;
 replaying=true;
 try{menu.click();}finally{replaying=false;}
 // Existing menu permissions remain authoritative if access has changed.
 if(currentPage()!==page)history.replaceState(stateFor(currentPage()),'');
});
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
