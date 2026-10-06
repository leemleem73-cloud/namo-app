(function(){
"use strict";
if(window.__QMES_WORKORDER_SIDEBAR_SUBMENU_MOVE_20261006_V1__)return;
window.__QMES_WORKORDER_SIDEBAR_SUBMENU_MOVE_20261006_V1__=true;

function apply(){
  var panel=document.getElementById("qmes-erp-fixed-production-menu");
  if(!panel)return;

  var section=panel.querySelector(".qfixed-section");
  if(!section)return;

  var woBtn=section.querySelector('[data-fixed-tab="woIssue"]');
  if(woBtn){
    var spans=woBtn.querySelectorAll("span");
    if(spans.length)spans[spans.length-1].textContent="작업지시서";
  }
}

function boot(){
  apply();
  requestAnimationFrame(apply);
  [40,120,260,500,900,1400].forEach(function(ms){setTimeout(apply,ms)});
  var root=document.body||document.documentElement;
  if(root)new MutationObserver(function(){apply()}).observe(root,{childList:true,subtree:true});
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
})();