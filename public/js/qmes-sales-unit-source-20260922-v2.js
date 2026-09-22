/* QMES Sales unit source display - 2026-09-22
 * DISPLAY ONLY.
 * Keep source unit exactly:
 * - the 7 historical gram rows => g
 * - all kg source rows => kg
 * Does not change quantity, dates, KPI, filters, calendar, resize or calculations.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_UNIT_SOURCE_20260922_V2__) return;
  window.__QMES_SALES_UNIT_SOURCE_20260922_V2__=true;

  const ROOT=".qmes-sales-delivery-dashboard-v2";
  const gramRows=[
    ["2025-05-26","NBA15-HM01"],
    ["2025-05-26","NBA20-HM01"],
    ["2025-06-30","NBA15-HM01"],
    ["2025-06-30","NBA20-HM01"],
    ["2025-07-14","NBA20-HM01"],
    ["2025-08-06","NBA20-P4S6-HM01"],
    ["2025-08-06","NBA20-S5V5-HM01"]
  ];

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim().replace(/\s*\[(?:kg|g)\]\s*$/i,"");
  function apply(){
    const host=document.querySelector(ROOT);
    if(!host) return;
    host.querySelectorAll(".qsd-table tbody tr").forEach(tr=>{
      const cells=tr.children;
      if(!cells||cells.length<7) return;
      const date=(cells[1]?.textContent||"").trim();
      const product=clean(cells[4]?.textContent||"");
      const isGram=gramRows.some(([d,p])=>d===date&&p===product);
      const unitCell=cells[6];
      if(unitCell) unitCell.textContent=isGram?"g":"kg";
    });
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply()});
  }

  function boot(){
    apply();
    const observer=new MutationObserver(schedule);
    observer.observe(document.documentElement,{childList:true,subtree:true});
    ["qmes:navigate-tab","qmes:data-updated","qmes:erp-data-changed","qmes:erp-integrated-ready"]
      .forEach(name=>window.addEventListener(name,schedule));
    [100,350,800,1500].forEach(ms=>setTimeout(apply,ms));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();