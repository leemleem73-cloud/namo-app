/* QMES Sales new-order single calendar owner - 2026-09-22
 * ADD-ONLY.
 * Removes the old qmesDatePickerStable calendar ONLY inside the integrated
 * 신규 수주 modal and leaves the new fixed QMES calendar as the single owner.
 * Existing new-order/calendar source files are not overwritten.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_NEW_ORDER_SINGLE_CALENDAR_20260922_V1__) return;
  window.__QMES_SALES_NEW_ORDER_SINGLE_CALENDAR_20260922_V1__=true;

  const MODAL_ID="qmes-sales-new-order-integrated-v11";
  const OLD_POP_ID="qmes-date-picker-stable-pop-20260831-v3";
  const NAMES=new Set(["orderDate","due","plannedProductionDate","oqcDate"]);

  function modal(){
    return document.getElementById(MODAL_ID);
  }

  function isTarget(input){
    return input instanceof HTMLInputElement &&
      NAMES.has(input.name) &&
      Boolean(input.closest("#"+MODAL_ID));
  }

  function removeOldPopup(){
    if(!modal()) return;
    document.getElementById(OLD_POP_ID)?.remove();
  }

  function sanitizeInput(input){
    if(!isTarget(input)) return;

    // Remove every marker used by the old stable date-picker owner.
    delete input.dataset.qmesDateStable;
    delete input.dataset.qmesDateField;
    delete input.dataset.qmesDateOriginalType;
    delete input.dataset.qmesDateMin;
    delete input.dataset.qmesDateMax;
    input.removeAttribute("data-qmes-date-stable");
    input.removeAttribute("data-qmes-date-field");
    input.removeAttribute("data-qmes-date-original-type");
    input.removeAttribute("data-qmes-date-min");
    input.removeAttribute("data-qmes-date-max");

    // A text input prevents Chrome/old picker ownership; the new fixed calendar
    // still recognizes these inputs by modal + name.
    if(input.type!=="text"){
      try{input.type="text";}catch(_){input.setAttribute("type","text");}
    }
    input.inputMode="numeric";
    input.placeholder=input.placeholder||"YYYY-MM-DD";
    input.setAttribute("autocomplete","off");

    try{window.qmesFixedCalendar?.patch?.(input);}catch(_){}
  }

  function sanitize(){
    const host=modal();
    if(!host) return;

    host.querySelectorAll("input").forEach(input=>{
      if(isTarget(input)) sanitizeInput(input);
    });

    removeOldPopup();
  }

  function wrapOpen(){
    const api=window.qmesSalesNewOrderIntegratedV11;
    if(!api||typeof api.open!=="function"||api.__qmesSingleCalendarWrapped) return;

    const original=api.open.bind(api);
    api.open=function(){
      const result=original.apply(this,arguments);
      queueMicrotask(sanitize);
      [0,30,100,250].forEach(ms=>setTimeout(sanitize,ms));
      return result;
    };
    api.__qmesSingleCalendarWrapped=true;
  }

  function onDateInteraction(event){
    const input=event.target;
    if(!isTarget(input)) return;

    // Sanitize before the old stable picker can own any subsequent interaction.
    sanitizeInput(input);
    removeOldPopup();

    queueMicrotask(()=>{
      removeOldPopup();
      try{window.qmesFixedCalendar?.open?.(input);}catch(_){}
    });
  }

  function boot(){
    wrapOpen();
    sanitize();

    // The old picker may already have listeners. Keeping its popup removed and
    // its markers stripped guarantees only the fixed calendar remains visible.
    ["pointerdown","mousedown","click","focusin"].forEach(name=>{
      document.addEventListener(name,onDateInteraction,true);
    });

    const observer=new MutationObserver(records=>{
      let needs=false;
      for(const record of records){
        if(record.type==="attributes"){
          const target=record.target;
          if(isTarget(target)){needs=true;break;}
          continue;
        }

        for(const node of record.addedNodes||[]){
          if(!(node instanceof Element)) continue;

          if(node.id===OLD_POP_ID){
            removeOldPopup();
            continue;
          }

          if(node.id===MODAL_ID || node.querySelector?.("#"+MODAL_ID)){
            needs=true;
          }

          if(node instanceof HTMLInputElement && isTarget(node)){
            needs=true;
          }else if(node.querySelector?.('#'+MODAL_ID+' input')){
            needs=true;
          }
        }
        if(needs) break;
      }

      if(needs){
        queueMicrotask(()=>{
          wrapOpen();
          sanitize();
        });
      }
    });

    observer.observe(document.documentElement,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:["type","data-qmes-date-stable","data-qmes-date-field"]
    });

    ["qmes:navigate-tab","qmes:erp-integrated-ready"]
      .forEach(name=>window.addEventListener(name,()=>setTimeout(()=>{
        wrapOpen();
        sanitize();
      },0)));

    [100,300,700,1500,3000].forEach(ms=>setTimeout(()=>{
      wrapOpen();
      sanitize();
    },ms));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();