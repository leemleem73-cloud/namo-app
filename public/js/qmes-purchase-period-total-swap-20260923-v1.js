/* QMES Purchase: swap 발주기간 <-> 전체 발주 V1 - 2026-09-23
 * ADD-ONLY. Existing purchase owner is not overwritten.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_PERIOD_TOTAL_SWAP_20260923_V1__) return;
  window.__QMES_PURCHASE_PERIOD_TOTAL_SWAP_20260923_V1__=true;

  var busy=false;

  function findByText(parent,selector,text){
    if(!parent) return null;
    return Array.from(parent.querySelectorAll(":scope > "+selector)).find(function(node){
      var label=node.querySelector("label,span");
      return label&&String(label.textContent||"").trim()===text;
    })||null;
  }

  function apply(){
    if(busy) return;
    var host=document.querySelector(".qmes-purchase-ledger-v1");
    if(!host) return;

    var filter=host.querySelector(".qpo-filter");
    var kpis=host.querySelector(".qpo-kpis");
    if(!filter||!kpis) return;

    var period=findByText(filter,".qpo-field","발주기간") ||
               findByText(kpis,".qpo-field","발주기간");
    var total=findByText(kpis,".qpo-kpi","전체 발주") ||
              findByText(filter,".qpo-kpi","전체 발주");
    if(!period||!total) return;

    if(total.parentElement===filter && period.parentElement===kpis &&
       filter.firstElementChild===total && kpis.firstElementChild===period) return;

    busy=true;
    try{
      total.classList.add("qpo-swap-total-top");
      period.classList.add("qpo-swap-period-bottom");
      filter.insertBefore(total,filter.firstElementChild);
      kpis.insertBefore(period,kpis.firstElementChild);
    }finally{
      busy=false;
    }

    if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.scan==="function"){
      try{window.qmesFixedCalendar.scan(period);}catch(_){}
    }
  }

  var scheduled=false;
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){
      scheduled=false;
      apply();
    });
  }

  ["qmes:purchase-db-refresh","qmes:shared-sync-complete","qmes:erp-data-changed","qmes:erp-integrated-ready"]
    .forEach(function(name){window.addEventListener(name,schedule);});

  var observer=new MutationObserver(function(records){
    for(var i=0;i<records.length;i++){
      var record=records[i];
      if(record.type==="childList"){
        schedule();
        break;
      }
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  [0,80,250,700,1500].forEach(function(ms){setTimeout(schedule,ms);});
})();