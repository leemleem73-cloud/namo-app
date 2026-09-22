/* QMES Sales OTIF label patch - 2026-09-22
 * ADD-ONLY. Does not overwrite the Sales dashboard source.
 * Changes the KPI label from "OTIF" to "OTIF (On Time In Full)".
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_OTIF_LABEL_20260922_V1__) return;
  window.__QMES_SALES_OTIF_LABEL_20260922_V1__=true;

  function apply(){
    const root=document.querySelector(".qmes-sales-delivery-dashboard-v1");
    if(!root) return;
    root.querySelectorAll(".qsd-kpi > span").forEach(label=>{
      if(String(label.textContent||"").trim()==="OTIF"){
        label.textContent="OTIF (On Time In Full)";
      }
    });
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  }

  function boot(){
    apply();
    const observer=new MutationObserver(schedule);
    observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    ["qmes:navigate-tab","qmes:erp-integrated-ready","qmes:erp-data-changed","qmes:data-updated"]
      .forEach(name=>window.addEventListener(name,()=>setTimeout(schedule,0)));
    [100,300,700,1500].forEach(ms=>setTimeout(schedule,ms));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();