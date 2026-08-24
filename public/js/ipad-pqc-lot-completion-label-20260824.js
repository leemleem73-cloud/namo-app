/* QMES IPAD/Field PQC production LOT completion label - 2026-08-24 v2
 * Chrome datalist mainly displays option.value, so completed status is added
 * to the visible option value. Before React receives the selection event the
 * suffix is stripped again, preserving the real LOT value for save/trace.
 */
(function(){
  "use strict";
  if(window.__QMES_IPAD_PQC_LOT_COMPLETION_LABEL_20260824_V2__) return;
  window.__QMES_IPAD_PQC_LOT_COMPLETION_LABEL_20260824_V2__=true;

  const clean=value=>String(value==null?"":value).trim();
  const suffix=/\s*·\s*(?:생산\s*)?(?:완료|미완료)\s*$/i;
  const baseLot=value=>clean(value).replace(suffix,"").trim().toUpperCase();

  function isProductionComplete(lot){
    const key=baseLot(lot);
    if(!key) return false;
    try{
      if(typeof window.qmesProductionComplete==="function") return !!window.qmesProductionComplete(key);
      if(typeof qmesProductionComplete==="function") return !!qmesProductionComplete(key);
    }catch(_error){}
    const doc=window.DB?.woDocs?.[key]||{};
    const batch=(window.DB?.batches||[]).find(row=>baseLot(row?.no)===key)||{};
    const result=doc.productionResult||batch.productionResult||window.DB?.lots?.[key]?.productionResult||{};
    return !!(
      result.completedAt||result.completeAt||result.finishedAt||
      doc.completedAt||batch.completedAt||
      clean(doc.status)==="완료"||clean(batch.status)==="완료"
    );
  }

  function decorate(){
    const list=document.getElementById("qmes-ipad-lots");
    if(!list) return;
    Array.from(list.querySelectorAll("option")).forEach(option=>{
      const lot=baseLot(option.dataset.qmesLot||option.value);
      if(!lot) return;
      option.dataset.qmesLot=lot;
      const completed=isProductionComplete(lot);
      option.value=completed?`${lot} · 완료`:lot;
      option.label=completed?"완료":"";
      option.textContent=completed?`${lot} · 완료`:lot;
      option.dataset.productionStatus=completed?"완료":"미완료";
    });
  }

  function canonicalizeInput(input){
    if(!input?.matches?.('input[list="qmes-ipad-lots"]')) return;
    const raw=clean(input.value);
    const lot=baseLot(raw);
    if(raw!==lot&&lot) input.value=lot;
    if(lot) input.title=`${lot} · 생산 ${isProductionComplete(lot)?"완료":"미완료"}`;
    else input.removeAttribute("title");
  }

  // Run before the native datalist opens so Chrome shows "LOT · 완료".
  document.addEventListener("pointerdown",event=>{
    if(event.target?.matches?.('input[list="qmes-ipad-lots"]')) decorate();
  },true);
  document.addEventListener("focusin",event=>{
    if(event.target?.matches?.('input[list="qmes-ipad-lots"]')) decorate();
  },true);

  // Capture phase runs before React's delegated onChange handler. This keeps
  // form.lot canonical even when the user picks a visible "LOT · 완료" option.
  document.addEventListener("input",event=>{
    if(!event.target?.matches?.('input[list="qmes-ipad-lots"]')) return;
    canonicalizeInput(event.target);
    setTimeout(decorate,0);
  },true);
  document.addEventListener("change",event=>{
    if(!event.target?.matches?.('input[list="qmes-ipad-lots"]')) return;
    canonicalizeInput(event.target);
    setTimeout(decorate,0);
  },true);

  const schedule=()=>setTimeout(decorate,0);
  window.addEventListener("qmes:shared-sync-complete",schedule);
  window.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("qmes:production-process-updated",schedule);
  window.addEventListener("focus",schedule);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
})();
