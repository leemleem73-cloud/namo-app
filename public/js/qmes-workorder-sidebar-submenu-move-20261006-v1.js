(function(){
"use strict";
if(window.__QMES_WORKORDER_SIDEBAR_SUBMENU_MOVE_20261006_V1__)return;
window.__QMES_WORKORDER_SIDEBAR_SUBMENU_MOVE_20261006_V1__=true;
function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim()}
function apply(){
  var side=document.getElementById("qmes-erp-sidebar");
  if(side){
    [].slice.call(side.querySelectorAll(".qside-item")).forEach(function(btn){
      var textEl=btn.querySelector(".qside-text");
      if(!textEl)return;
      if(clean(textEl.textContent)==="작업지시서"){
        textEl.textContent="생산관리";
        btn.setAttribute("aria-label","생산관리");
        btn.setAttribute("title","생산관리");
      }
    });
  }
  var panel=document.getElementById("qmes-erp-fixed-production-menu");
  if(panel){
    var woBtn=panel.querySelector('[data-fixed-tab="woIssue"]');
    if(woBtn){
      var spans=woBtn.querySelectorAll("span");
      if(spans.length)spans[spans.length-1].textContent="작업지시서";
    }
  }
}
function boot(){
  apply();
  requestAnimationFrame(apply);
  [40,120,260,500,900,1400].forEach(function(ms){setTimeout(apply,ms)});
  var root=document.body||document.documentElement;
  if(root)new MutationObserver(apply).observe(root,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();