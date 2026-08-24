/* QMES IPAD/Field PQC production LOT linked selector - 2026-08-24 v4 */
(function(){
  "use strict";
  if(window.__QMES_IPAD_PQC_LOT_LINKED_SELECTOR_20260824_V4__) return;
  window.__QMES_IPAD_PQC_LOT_LINKED_SELECTOR_20260824_V4__=true;

  const clean=value=>String(value==null?"":value).trim();
  const suffix=/\s*·\s*(?:생산\s*)?(?:완료|미완료)\s*$/i;
  const baseLot=value=>clean(value).replace(suffix,"").trim().toUpperCase();
  const getDB=()=>{
    try{ if(typeof DB!=="undefined"&&DB) return DB; }catch(_error){}
    return window.DB||{};
  };

  const style=document.createElement("style");
  style.id="qmes-ipad-pqc-linked-lot-style-20260824";
  style.textContent=`
    .qmes-ipad-pop .qmes-ipad-form-grid .qmes-pqc-linked-lot-select{
      box-sizing:border-box!important;width:100%!important;min-width:0!important;height:48px!important;
      border:1px solid #cbd5e1!important;border-radius:10px!important;background:#fff!important;color:#0f172a!important;
      padding:0 14px!important;font-size:15px!important;font-weight:700!important;
    }
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-remarks-wide{grid-column:1 / -1!important;width:100%!important;min-width:0!important;}
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-remarks-wide input{width:100%!important;min-width:0!important;box-sizing:border-box!important;}
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function isPqcScreen(){
    const root=document.querySelector(".qmes-ipad-pop");
    const title=clean(root?.querySelector(".qmes-ipad-inspection-head h1")?.textContent);
    return !!root && title.includes("공정검사");
  }

  function isProductionComplete(lot){
    const key=baseLot(lot); if(!key) return false;
    try{if(typeof qmesProductionComplete==="function") return !!qmesProductionComplete(key);}catch(_error){}
    const db=getDB();
    const doc=db.woDocs?.[key]||{};
    const batch=(db.batches||[]).find(row=>baseLot(row?.no)===key)||{};
    const result=doc.productionResult||batch.productionResult||db.lots?.[key]?.productionResult||{};
    return !!(result.completedAt||result.completeAt||result.finishedAt||doc.completedAt||batch.completedAt||clean(doc.status)==="완료"||clean(batch.status)==="완료");
  }

  function lotList(){
    const db=getDB();
    const lots=new Set();
    Object.keys(db.woDocs||{}).forEach(lot=>{const key=baseLot(lot);if(key) lots.add(key);});
    (db.batches||[]).forEach(row=>{const key=baseLot(row?.no);if(key) lots.add(key);});
    Object.keys(db.lots||{}).forEach(lot=>{const key=baseLot(lot);if(key) lots.add(key);});
    return Array.from(lots).sort((a,b)=>b.localeCompare(a,"ko"));
  }

  function productionLotLabel(){
    const grid=document.querySelector(".qmes-ipad-pop .qmes-ipad-section .qmes-ipad-form-grid");
    if(!grid) return null;
    return Array.from(grid.querySelectorAll("label")).find(label=>clean(label.querySelector("span")?.textContent).startsWith("생산 LOT"))||null;
  }

  function remarksWide(){
    if(!isPqcScreen()) return;
    const grid=document.querySelector(".qmes-ipad-pop .qmes-ipad-section .qmes-ipad-form-grid");
    if(!grid) return;
    const remarks=Array.from(grid.querySelectorAll(":scope > label")).find(label=>clean(label.querySelector("span")?.textContent).startsWith("비고"));
    if(remarks) remarks.classList.add("wide","qmes-pqc-remarks-wide");
  }

  function dispatchValue(input,value){
    const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value")?.set;
    if(setter) setter.call(input,value); else input.value=value;
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
  }

  function buildSelector(){
    if(!isPqcScreen()) return;
    const label=productionLotLabel(); if(!label) return;
    const input=label.querySelector("input"); if(!input) return;
    let select=label.querySelector(".qmes-pqc-linked-lot-select");
    if(!select){
      select=document.createElement("select");
      select.className="qmes-pqc-linked-lot-select";
      select.setAttribute("aria-label","생산 LOT 선택");
      input.style.setProperty("display","none","important");
      input.insertAdjacentElement("afterend",select);
      select.addEventListener("change",()=>dispatchValue(input,baseLot(select.value)));
    } else {
      input.style.setProperty("display","none","important");
    }

    const current=baseLot(input.value);
    const lots=lotList();
    const previous=baseLot(select.value);
    select.innerHTML="";
    const placeholder=document.createElement("option");
    placeholder.value=""; placeholder.textContent=lots.length?"생산 LOT 선택":"연동된 생산 LOT 없음";
    select.appendChild(placeholder);
    lots.forEach(lot=>{
      const option=document.createElement("option");
      option.value=lot;
      option.textContent=`${lot}${isProductionComplete(lot)?" · 완료":" · 미완료"}`;
      select.appendChild(option);
    });
    const desired=current||previous||"";
    if(desired&&lots.includes(desired)) select.value=desired;
  }

  function apply(){buildSelector();remarksWide();}
  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener("qmes:shared-sync-complete",schedule);
  window.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("qmes:production-process-updated",schedule);
  window.addEventListener("focus",schedule);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
})();
