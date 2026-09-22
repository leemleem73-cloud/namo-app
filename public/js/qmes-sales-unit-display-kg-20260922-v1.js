/* QMES Sales/Due unit display fix - 2026-09-22
 * DISPLAY ONLY.
 * User-approved QMES unit column standard: kg.
 * Does not change stored quantity/sourceQty/sourceUnit or any calculations.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_UNIT_DISPLAY_KG_20260922_V1__) return;
  window.__QMES_SALES_UNIT_DISPLAY_KG_20260922_V1__=true;

  const ROOT=".qmes-sales-delivery-dashboard-v2";
  const CELL=".qsd-table tbody tr td:nth-child(7)";

  function apply(root=document){
    const host=root instanceof Element && root.matches(ROOT) ? root : document.querySelector(ROOT);
    if(!host) return;
    host.querySelectorAll(CELL).forEach(td=>{
      if(td.textContent!=="kg") td.textContent="kg";
    });
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      apply();
    });
  }

  function boot(){
    apply();

    const observer=new MutationObserver(records=>{
      for(const record of records){
        if(record.type==="childList" && record.addedNodes && record.addedNodes.length){
          schedule();
          break;
        }
        if(record.type==="characterData"){
          schedule();
          break;
        }
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});

    ["qmes:navigate-tab","qmes:data-updated","qmes:erp-data-changed","qmes:erp-integrated-ready"]
      .forEach(name=>window.addEventListener(name,schedule));

    [100,350,800,1500].forEach(ms=>setTimeout(apply,ms));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();