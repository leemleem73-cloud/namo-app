/* QMES iPad inspection UI visibility fix + IQC packaging field cleanup. */
(function(global){
  "use strict";
  if(global.__QMES_IPAD_IQC_VISIBILITY_FIX_20260811_V5__) return;
  global.__QMES_IPAD_IQC_VISIBILITY_FIX_20260811_V5__=true;

  const STYLE_ID="qmes-ipad-iqc-visibility-fix-style";
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
        if(HIDDEN_IQC_FIELDS.has(cleanText(field.querySelector("span")))) field.style.setProperty("display","none","important");
      });
      Array.from(section.children).forEach(child=>{
        if(!child.classList?.contains("qmes-iqc-modal-grid")&&cleanText(child).includes("중량 확인 필요")) child.style.setProperty("display","none","important");
      });
    });
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-ipad-mode-tabs button.is-active{
        border:3px solid #0284c7!important;
        background:#dff4ff!important;
        color:#0f172a!important;
        box-shadow:0 0 0 3px rgba(2,132,199,.16),0 6px 16px rgba(15,23,42,.14)!important;
        transform:translateY(-1px);
      }
      .qmes-ipad-mode-tabs button.is-active strong,
      .qmes-ipad-mode-tabs button.is-active small{
        color:#075985!important;
        font-weight:950!important;
      }
      .qmes-ipad-mode-tabs button.is-active::before{
        content:"✓";
        display:inline-grid;
        place-items:center;
        width:24px;
        height:24px;
        border-radius:999px;
        background:#0284c7;
        color:#fff;
        font-size:14px;
        font-weight:950;
      }
    `;
    document.head.appendChild(style);
  }

  let scheduled=false;
  function refresh(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;ensureStyle();cleanupIqcPackagingFields();});
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
