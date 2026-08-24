/* QMES IPAD/Field PQC production LOT completion label - 2026-08-24
 * Keeps the actual LOT value unchanged while showing completion status
 * in the browser datalist so inspectors can distinguish completed lots.
 */
(function(){
  "use strict";
  if(window.__QMES_IPAD_PQC_LOT_COMPLETION_LABEL_20260824__) return;
  window.__QMES_IPAD_PQC_LOT_COMPLETION_LABEL_20260824__=true;

  const clean=value=>String(value==null?"":value).trim();
  let scheduled=false;

  function isProductionComplete(lot){
    try{
      if(typeof window.qmesProductionComplete==="function") return !!window.qmesProductionComplete(lot);
      if(typeof qmesProductionComplete==="function") return !!qmesProductionComplete(lot);
    }catch(_error){}
    const doc=window.DB?.woDocs?.[lot]||{};
    const batch=(window.DB?.batches||[]).find(row=>clean(row?.no)===lot)||{};
    const result=doc.productionResult||batch.productionResult||window.DB?.lots?.[lot]?.productionResult||{};
    return !!(result.completedAt||result.completeAt||doc.completedAt||batch.completedAt||clean(doc.status)==="완료"||clean(batch.status)==="완료");
  }

  function isPqcScreen(){
    const active=Array.from(document.querySelectorAll("button,div,span")).find(node=>{
      const text=clean(node.textContent).replace(/\s+/g," ");
      return text==="PQC 공정검사"&&(
        node.getAttribute("aria-selected")==="true"||
        node.classList.contains("active")||
        node.className?.toString().includes("selected")||
        node.closest?.(".qmes-ipad-mode-btn")
      );
    });
    return !!active||clean(document.body?.textContent).includes("PQC 공정검사");
  }

  function decorate(){
    scheduled=false;
    const list=document.getElementById("qmes-ipad-lots");
    if(!list) return;
    const input=document.querySelector('input[list="qmes-ipad-lots"]');
    const pqcVisible=isPqcScreen();
    Array.from(list.querySelectorAll("option")).forEach(option=>{
      const lot=clean(option.value);
      if(!lot) return;
      const complete=isProductionComplete(lot);
      const status=complete?"완료":"미완료";
      option.label=status;
      option.textContent=status;
      option.dataset.productionStatus=status;
    });
    if(input&&pqcVisible){
      const lot=clean(input.value).toUpperCase();
      if(lot){
        input.title=`${lot} · 생산 ${isProductionComplete(lot)?"완료":"미완료"}`;
      }else{
        input.removeAttribute("title");
      }
    }
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(decorate);
  }

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","value"]});
  document.addEventListener("input",event=>{if(event.target?.matches?.('input[list="qmes-ipad-lots"]'))schedule();},true);
  window.addEventListener("qmes:shared-sync-complete",schedule);
  window.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("qmes:production-process-updated",schedule);
  window.addEventListener("focus",schedule);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
})();
