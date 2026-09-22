/* QMES Purchase layout match Sales/Delivery V1 - 2026-09-23
 * ADD-ONLY. Matches the Purchase ledger section order to Sales/Delivery:
 * title/actions -> KPI row -> filter row -> summary -> table.
 * Existing Purchase owner source is not overwritten.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_LAYOUT_MATCH_SALES_20260923_V1__) return;
  window.__QMES_PURCHASE_LAYOUT_MATCH_SALES_20260923_V1__=true;

  var applying=false;
  var scheduled=false;

  function apply(){
    if(applying) return;
    var host=document.querySelector(".qmes-purchase-ledger-v1");
    if(!host) return;

    var title=host.querySelector(".qpo-title-row");
    var kpis=host.querySelector(".qpo-kpis");
    var filter=host.querySelector(".qpo-filter");
    if(!title||!kpis||!filter) return;

    if(title.nextElementSibling===kpis && kpis.nextElementSibling===filter) return;

    applying=true;
    try{
      host.insertBefore(kpis,title.nextElementSibling);
      host.insertBefore(filter,kpis.nextElementSibling);
    }finally{
      applying=false;
    }

    if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.scan==="function"){
      try{window.qmesFixedCalendar.scan(filter);}catch(_){}
    }
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){
      scheduled=false;
      apply();
    });
  }

  var observer=new MutationObserver(function(records){
    if(applying) return;
    for(var i=0;i<records.length;i++){
      if(records[i].type==="childList"){schedule();break;}
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  ["qmes:purchase-db-refresh","qmes:shared-sync-complete","qmes:erp-data-changed","qmes:erp-integrated-ready"]
    .forEach(function(name){window.addEventListener(name,schedule);});

  [0,80,250,700,1500].forEach(function(ms){setTimeout(schedule,ms);});
})();