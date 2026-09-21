/* QMES Sales edit date picker front-layer fix V2 - 2026-09-21
 * ADD-ONLY.
 * Forces the shared QMES calendar above the Sales edit modal with inline !important
 * z-index so dynamically injected modal styles cannot cover the calendar.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_EDIT_DATE_PICKER_FRONT_20260921_V2__) return;
  window.__QMES_SALES_EDIT_DATE_PICKER_FRONT_20260921_V2__=true;

  const MODAL_ID="qmes-sales-edit-force-v2";
  const POP_ID="qmes-date-picker-stable-pop-20260831-v3";
  const MODAL_Z="2147483600";
  const POP_Z="2147483647";

  function forceLayers(){
    const modal=document.getElementById(MODAL_ID);
    const pop=document.getElementById(POP_ID);

    if(modal){
      modal.style.setProperty("z-index",MODAL_Z,"important");
      modal.style.setProperty("isolation","auto","important");
    }

    if(pop){
      pop.style.setProperty("z-index",POP_Z,"important");
      pop.style.setProperty("pointer-events","auto","important");
      pop.style.setProperty("isolation","isolate","important");
    }
  }

  function patchDueInput(){
    const modal=document.getElementById(MODAL_ID);
    const input=modal&&modal.querySelector('input[name="due"]');
    if(!input) return;

    const picker=window.qmesDatePickerStable;
    if(picker&&typeof picker.patch==="function"){
      try{picker.patch(input);}catch(_){}
    }
  }

  function sync(){
    patchDueInput();
    forceLayers();
  }

  function boot(){
    sync();

    const observer=new MutationObserver(records=>{
      let relevant=false;
      for(const record of records){
        if(record.type==="attributes"){
          const el=record.target;
          if(el instanceof Element&&(el.id===MODAL_ID||el.id===POP_ID)){
            relevant=true;
            break;
          }
        }
        for(const node of record.addedNodes||[]){
          if(node.nodeType!==1) continue;
          if(
            node.id===MODAL_ID||
            node.id===POP_ID||
            node.querySelector?.("#"+MODAL_ID)||
            node.querySelector?.("#"+POP_ID)
          ){
            relevant=true;
            break;
          }
        }
        if(relevant) break;
      }
      if(relevant){
        queueMicrotask(sync);
        setTimeout(sync,0);
        setTimeout(sync,30);
        setTimeout(sync,120);
      }
    });

    observer.observe(document.documentElement,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:["style","class"]
    });

    document.addEventListener("pointerdown",event=>{
      const target=event.target instanceof Element?event.target:null;
      if(target?.closest('#'+MODAL_ID+' input[name="due"]')||target?.closest('#'+POP_ID)){
        queueMicrotask(sync);
        setTimeout(sync,0);
      }
    },true);

    document.addEventListener("click",event=>{
      const target=event.target instanceof Element?event.target:null;
      if(target?.closest('#'+MODAL_ID+' input[name="due"]')||target?.closest('#'+POP_ID)){
        queueMicrotask(sync);
        setTimeout(sync,0);
      }
    },true);

    [100,300,700,1500,3000].forEach(ms=>setTimeout(sync,ms));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();