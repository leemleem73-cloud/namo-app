(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
function ensureRecordAnchors(){
  const root=$('.page[data-page="records"] .records');
  if(!root)return;
  if(!document.getElementById('todayInRecord')){
    const a=document.createElement('span');a.id='todayInRecord';a.hidden=true;root.appendChild(a);
  }
  if(!document.getElementById('todayOutRecord')){
    const a=document.createElement('span');a.id='todayOutRecord';a.hidden=true;root.appendChild(a);
  }
}
function init(){
  ensureRecordAnchors();
  const root=$('.page[data-page="records"] .records');
  if(root)new MutationObserver(()=>ensureRecordAnchors()).observe(root,{childList:true,subtree:false});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
