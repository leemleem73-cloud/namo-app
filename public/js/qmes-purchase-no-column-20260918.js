/* NAMO QMES - Purchase sequential No column
 * 2026-09-18
 * ADD-ONLY. Reuses the existing hidden selection column as page-aware No.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_NO_COLUMN_20260918__) return;
  window.__QMES_PURCHASE_NO_COLUMN_20260918__=true;

  let queued=false;
  function apply(){
    queued=false;
    const root=document.querySelector(".qmes-purchase-live.qpx-enterprise-safe-v2");
    const table=root&&root.querySelector(".qpx-enterprise-host .qpx-table");
    if(!table) return;

    const head=table.querySelector("thead th:first-child");
    if(head && head.textContent.trim()!=="No"){
      head.textContent="No";
      head.classList.add("qpx-no-head");
    }

    const active=Array.from(root.querySelectorAll(".qpx-page.active"))
      .map(el=>Number(String(el.textContent||"").trim()))
      .find(Number.isFinite) || 1;
    const sizeEl=root.querySelector(".qpx-page-size");
    const pageSize=Math.max(1,Number(sizeEl&&sizeEl.value)||10);
    const start=(active-1)*pageSize;

    table.querySelectorAll("tbody tr").forEach((tr,index)=>{
      if(tr.querySelector(".qpx-empty")) return;
      const cell=tr.querySelector("td:first-child");
      if(!cell) return;
      const value=String(start+index+1);
      if(cell.textContent.trim()!==value) cell.textContent=value;
      cell.classList.add("qpx-no-cell");
    });
  }
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(apply);
  }
  function start(){
    schedule();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    document.addEventListener("click",event=>{
      const t=event.target instanceof Element?event.target:null;
      if(t&&t.closest(".qmes-purchase-live .qpx-page")) setTimeout(schedule,0);
    },true);
    window.addEventListener("qmes:navigate-tab",()=>setTimeout(schedule,0));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();