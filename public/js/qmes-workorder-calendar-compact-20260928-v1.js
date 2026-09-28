/* QMES Workorder compact calendar bridge V1 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * Reuses the approved compact fixed calendar already used by sales/purchase.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_CALENDAR_COMPACT_20260928_V1__) return;
  window.__QMES_WORKORDER_CALENDAR_COMPACT_20260928_V1__=true;

  var scheduled=false;

  function patch(){
    scheduled=false;
    var root=document.querySelector(".qwo1");
    if(!root)return;

    /* Make workorder date fields eligible for the existing approved fixed calendar. */
    root.classList.add("qmes-sales-ledger-v4");

    root.querySelectorAll('.qwo1-filter input[type="date"], .qwo1-modal input[type="date"], .qwo1 input[data-qwo-calendar="1"]').forEach(function(input){
      var field=input.closest(".qwo1-field,.qwo1-form-field")||input.parentElement;
      if(field)field.classList.add("qrl-date");
      input.setAttribute("data-qwo-calendar","1");

      try{
        if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.patch==="function"){
          window.qmesFixedCalendar.patch(input);
        }
      }catch(_){}
    });

    try{
      if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.scan==="function"){
        window.qmesFixedCalendar.scan(root);
      }
    }catch(_){}
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(patch);
  }

  var observer=new MutationObserver(function(records){
    for(var i=0;i<records.length;i++){
      var nodes=records[i].addedNodes||[];
      for(var j=0;j<nodes.length;j++){
        var node=nodes[j];
        if(!(node instanceof Element))continue;
        if(node.matches(".qwo1,.qwo1-modal,.qwo1-modal-bg")||node.querySelector(".qwo1,.qwo1-modal,input[type='date']")){
          schedule();
          return;
        }
      }
    }
  });

  function boot(){
    patch();
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener("qmes:navigate-tab",schedule);
    window.addEventListener("qmes:workorder-owner-ready",schedule);
    [50,180,500,1200].forEach(function(ms){setTimeout(schedule,ms);});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();