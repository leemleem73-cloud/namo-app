/* QMES Sales edit date picker front-layer fix - 2026-09-21
 * ADD-ONLY patch.
 * Reuses the existing QMES stable date picker used by the Sales period filters.
 * Ensures the calendar opens above the Sales edit modal instead of behind it.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_EDIT_DATE_PICKER_FRONT_20260921__) return;
  window.__QMES_SALES_EDIT_DATE_PICKER_FRONT_20260921__=true;

  const MODAL_ID="qmes-sales-edit-force-v2";
  const POP_ID="qmes-date-picker-stable-pop-20260831-v3";
  const STYLE_ID="qmes-sales-edit-date-picker-front-20260921-style";

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      /* Keep the sales edit modal below the common QMES date picker. */
      #${MODAL_ID}{
        z-index:2147483600!important;
      }

      /* The same calendar used by the Sales period filter must always be topmost. */
      #${POP_ID}{
        z-index:2147483647!important;
      }

      /* Match the edit due-date field to the same stable date-field behavior. */
      #${MODAL_ID} input[name="due"][data-qmes-date-stable="1"]{
        cursor:pointer!important;
      }
    `;
    document.head.appendChild(style);
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
    ensureStyle();
    patchDueInput();
  }

  function boot(){
    sync();

    const observer=new MutationObserver(records=>{
      let needed=false;
      for(const record of records){
        for(const node of record.addedNodes||[]){
          if(node.nodeType!==1) continue;
          if(node.id===MODAL_ID||node.id===POP_ID||node.querySelector?.("#"+MODAL_ID)||node.querySelector?.("#"+POP_ID)){
            needed=true;
            break;
          }
        }
        if(needed) break;
      }
      if(needed){
        queueMicrotask(sync);
        setTimeout(sync,30);
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});

    document.addEventListener("click",event=>{
      const input=event.target instanceof Element?event.target.closest('#'+MODAL_ID+' input[name="due"]'):null;
      if(!input) return;
      const picker=window.qmesDatePickerStable;
      if(picker&&typeof picker.open==="function"){
        setTimeout(()=>{
          try{picker.patch?.(input);picker.open(input);}catch(_){}
        },0);
      }
    },true);

    [200,700,1500,3000].forEach(ms=>setTimeout(sync,ms));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();