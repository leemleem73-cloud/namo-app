/* QMES IPAD/Field PQC/OQC production LOT linked selector - 2026-08-24 v7 */
(function(){
  "use strict";
  if(window.__QMES_IPAD_PQC_OQC_LOT_LINKED_SELECTOR_20260824_V7__) return;
  window.__QMES_IPAD_PQC_OQC_LOT_LINKED_SELECTOR_20260824_V7__=true;

  const clean=value=>String(value==null?"":value).trim();
  const suffix=/\s*·\s*(?:생산\s*)?(?:완료|미완료)\s*$/i;
  const baseLot=value=>clean(value).replace(suffix,"").trim().toUpperCase();
  const getDB=()=>{try{if(typeof DB!=="undefined"&&DB)return DB;}catch(_error){}return window.DB||{};};

  const style=document.createElement("style");
  style.id="qmes-ipad-pqc-oqc-linked-lot-style-20260824";
  style.textContent=`
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-production-lot-linked{grid-column:1 / -1!important;width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;}
    .qmes-ipad-pop .qmes-ipad-form-grid .qmes-production-lot-linked-select{
      box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;height:48px!important;
      border:1px solid #cbd5e1!important;border-radius:10px!important;background:#fff!important;color:#0f172a!important;
      padding:0 14px!important;font-size:15px!important;font-weight:700!important;
    }
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-remarks-wide{
      grid-column:1 / -1!important;grid-row:auto!important;width:100%!important;min-width:0!important;max-width:none!important;
      display:block!important;box-sizing:border-box!important;
    }
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-remarks-wide input,
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-remarks-wide textarea{
      display:block!important;width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;
    }
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function currentMode(){
    const root=document.querySelector(".qmes-ipad-pop");
    if(!root)return "";
    const active=root.querySelector('.qmes-ipad-mode-tabs button.is-active');
    const text=clean(active?.textContent).toUpperCase();
    if(text.includes('PQC'))return 'PQC';
    if(text.includes('OQC'))return 'OQC';
    const title=clean(root.querySelector('.qmes-ipad-inspection-head h1')?.textContent);
    if(title.includes('공정검사'))return 'PQC';
    if(title.includes('출하검사'))return 'OQC';
    return "";
  }
  function isProductionComplete(lot){
    const key=baseLot(lot);if(!key)return false;
    try{if(typeof qmesProductionComplete==="function")return !!qmesProductionComplete(key);}catch(_error){}
    const db=getDB();const doc=db.woDocs?.[key]||{};
    const batch=(db.batches||[]).find(row=>baseLot(row?.no)===key)||{};
    const result=doc.productionResult||batch.productionResult||db.lots?.[key]?.productionResult||{};
    return !!(result.completedAt||result.completeAt||result.finishedAt||doc.completedAt||batch.completedAt||clean(doc.status)==="완료"||clean(batch.status)==="완료");
  }
  function lotList(mode){
    const db=getDB();const lots=new Set();
    Object.keys(db.woDocs||{}).forEach(lot=>{const key=baseLot(lot);if(key)lots.add(key);});
    (db.batches||[]).forEach(row=>{const key=baseLot(row?.no||row?.lot||row?.lotNo||row?.workOrder);if(key)lots.add(key);});
    Object.entries(db.lots||{}).forEach(([lot,row])=>{const key=baseLot(row?.lot||row?.lotNo||row?.no||lot);if(key)lots.add(key);});
    if(mode==="OQC"){
      const passed=new Set((Array.isArray(db.insp?.OQC)?db.insp.OQC:[])
        .filter(row=>clean(row?.judge)==="합격")
        .map(row=>baseLot(row?.lot||row?.lotNo))
        .filter(Boolean));
      passed.forEach(lot=>lots.delete(lot));
    }
    return Array.from(lots).sort((a,b)=>b.localeCompare(a,"ko"));
  }
  function productionLotLabel(){
    const grid=document.querySelector(".qmes-ipad-pop .qmes-ipad-section .qmes-ipad-form-grid");
    if(!grid)return null;
    return Array.from(grid.querySelectorAll("label")).find(label=>clean(label.querySelector("span")?.textContent).startsWith("생산 LOT"))||null;
  }
  function remarksWide(){
    if(currentMode()!=="PQC")return;
    const grid=document.querySelector(".qmes-ipad-pop .qmes-ipad-section .qmes-ipad-form-grid");if(!grid)return;
    const remarks=Array.from(grid.querySelectorAll("label")).find(label=>clean(label.querySelector("span")?.textContent).startsWith("비고"));
    if(!remarks)return;
    remarks.classList.add("wide","qmes-pqc-remarks-wide");
    remarks.style.setProperty("grid-column","1 / -1","important");
    remarks.style.setProperty("width","100%","important");
    remarks.style.setProperty("max-width","none","important");
  }
  function dispatchValue(input,value){
    const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value")?.set;
    if(setter)setter.call(input,value);else input.value=value;
    input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));
  }
  function buildSelector(){
    const mode=currentMode();if(mode!=="PQC"&&mode!=="OQC")return;
    const label=productionLotLabel();if(!label)return;
    label.classList.add('qmes-production-lot-linked');
    const input=label.querySelector("input");if(!input)return;
    input.style.setProperty("display","none","important");
    input.removeAttribute('list');
    const datalist=label.querySelector('datalist');if(datalist)datalist.remove();
    let select=label.querySelector(".qmes-production-lot-linked-select");
    if(!select){
      select=document.createElement("select");select.className="qmes-production-lot-linked-select";select.setAttribute("aria-label","생산 LOT 선택");
      input.insertAdjacentElement("afterend",select);
      select.addEventListener("change",()=>dispatchValue(input,baseLot(select.value)));
    }
    const current=baseLot(input.value),lots=lotList(mode),previous=baseLot(select.value);select.innerHTML="";
    const placeholder=document.createElement("option");placeholder.value="";
    placeholder.textContent=mode==="OQC"
      ? (lots.length?"출하검사 대기 LOT 선택":"출하검사 대기 LOT 없음")
      : (lots.length?"생산 LOT 선택":"연동된 생산 LOT 없음");
    select.appendChild(placeholder);
    lots.forEach(lot=>{
      const option=document.createElement("option");option.value=lot;
      const status=mode==="OQC"?"출하검사 대기중":(isProductionComplete(lot)?"완료":"미완료");
      option.textContent=`${lot} · ${status}`;
      select.appendChild(option);
    });
    const desired=current||previous||"";if(desired&&lots.includes(desired))select.value=desired;
  }
  function apply(){buildSelector();remarksWide();}
  let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();[0,30,80,160].forEach(ms=>setTimeout(apply,ms));});}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true});
  document.addEventListener('click',schedule,true);
  window.addEventListener("qmes:shared-sync-complete",schedule);window.addEventListener("qmes:data-updated",schedule);window.addEventListener("qmes:production-process-updated",schedule);window.addEventListener("focus",schedule);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
})();
