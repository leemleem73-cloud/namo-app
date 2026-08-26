/* QMES IQC packaging cleanup only.
 * Visual styling belongs to the field-input CSS; this module must not restyle tabs after render.
 */
(function(global){
  "use strict";
  if(global.__QMES_IPAD_IQC_VISIBILITY_FIX_20260811_V6__) return;
  global.__QMES_IPAD_IQC_VISIBILITY_FIX_20260811_V6__=true;

  const HIDDEN_IQC_FIELDS=new Set(["용기당 중량","계산중량","바코드 발행수량"]);

  function cleanText(node){return String(node?.textContent||"").replace(/\s+/g," ").trim();}

  function setReactInputValue(input,value){
    if(!input) return;
    const next=String(value??"");
    if(String(input.value||"")===next) return;
    const descriptor=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");
    if(descriptor?.set) descriptor.set.call(input,next); else input.value=next;
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
  }

  function fieldByLabel(section,label){
    return Array.from(section.querySelectorAll(".qmes-iqc-field")).find(field=>cleanText(field.querySelector("span"))===label)||null;
  }

  function numericValue(input){
    const match=String(input?.value||"").replace(/,/g,"").match(/-?\d+(?:\.\d+)?/);
    return match?Number(match[0]):0;
  }

  function syncHiddenUnitWeight(section){
    const modal=section.closest(".qmes-iqc-modal");
    if(!modal) return;
    const qtySection=Array.from(modal.querySelectorAll(".qmes-iqc-modal-section")).find(sec=>cleanText(sec.querySelector("h4"))==="수량");
    const qtyField=qtySection?fieldByLabel(qtySection,"입고수량"):null;
    const packageField=fieldByLabel(section,"입고 포장수량");
    const unitField=fieldByLabel(section,"용기당 중량");
    const qty=numericValue(qtyField?.querySelector("input"));
    const packages=Math.trunc(numericValue(packageField?.querySelector("input")));
    if(qty>0&&packages>0&&unitField){
      const unit=String(Number((qty/packages).toFixed(6)));
      setReactInputValue(unitField.querySelector("input"),unit);
    }
  }

  function cleanupIqcPackagingFields(){
    document.querySelectorAll(".qmes-iqc-modal-section").forEach(section=>{
      if(cleanText(section.querySelector("h4"))!=="포장·바코드 정보") return;
      syncHiddenUnitWeight(section);
      section.querySelectorAll(".qmes-iqc-field").forEach(field=>{
        if(HIDDEN_IQC_FIELDS.has(cleanText(field.querySelector("span")))) field.hidden=true;
      });
      Array.from(section.children).forEach(child=>{
        if(!child.classList?.contains("qmes-iqc-modal-grid")&&cleanText(child).includes("중량 확인 필요")) child.hidden=true;
      });
    });
  }

  let scheduled=false;
  function refresh(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;cleanupIqcPackagingFields();});
  }

  function start(){
    refresh();
    new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});
    document.addEventListener("input",event=>{
      const label=cleanText(event.target?.closest?.(".qmes-iqc-field")?.querySelector("span"));
      if(label==="입고수량"||label==="입고 포장수량") refresh();
    },true);
    document.addEventListener("change",event=>{
      const label=cleanText(event.target?.closest?.(".qmes-iqc-field")?.querySelector("span"));
      if(label==="입고수량"||label==="입고 포장수량") refresh();
    },true);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})(window);
