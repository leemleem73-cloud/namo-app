/* NAMO QMES — sales action column header fix — 2026-08-27
 * Keeps the existing sales table logic intact and labels the Edit/Delete column as "비고".
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ACTION_HEADER_FIX_20260827__) return;
  window.__QMES_SALES_ACTION_HEADER_FIX_20260827__=true;

  function apply(){
    const roots=Array.from(document.querySelectorAll(".qerp"));
    const root=roots.find(el=>String(el.querySelector(".qerp-title")?.textContent||"").replace(/\s+/g," ").trim()==="수주 · 납기관리");
    if(!root) return;
    const table=Array.from(root.querySelectorAll("table.qerp-table")).find(t=>/수주번호/.test(String(t.querySelector("thead")?.textContent||"")));
    if(!table) return;

    const head=table.querySelector('thead tr');
    const actionHead=head?.querySelector('[data-qmes-sales-action-head="1"]');
    if(actionHead){
      if(actionHead.textContent!=="비고") actionHead.textContent="비고";
      actionHead.style.setProperty("text-align","center","important");
      actionHead.style.setProperty("min-width","94px","important");
      actionHead.style.setProperty("width","94px","important");
      actionHead.setAttribute("aria-label","비고");
    }

    table.querySelectorAll('[data-qmes-sales-action-cell="1"]').forEach(cell=>{
      cell.style.setProperty("text-align","center","important");
      cell.style.setProperty("min-width","94px","important");
      cell.style.setProperty("width","94px","important");
      const wrap=cell.querySelector('.qmes-sales-action-wrap');
      if(wrap){
        wrap.style.setProperty("justify-content","center","important");
        wrap.style.setProperty("gap","6px","important");
      }
    });
  }

  let queued=false;
  const schedule=()=>{
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  };

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  ["qmes:erp-runtime-loaded","qmes:erp-data-changed","qmes:mes-master-ready","qmes:enterprise-ui-ready"].forEach(name=>window.addEventListener(name,schedule));
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
})();
