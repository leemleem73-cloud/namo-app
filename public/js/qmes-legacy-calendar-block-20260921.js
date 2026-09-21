/* QMES legacy calendar hard block - 2026-09-21
 * ADD-ONLY guard loaded after the global fixed calendar.
 */
(function(){
  "use strict";
  if(window.__QMES_LEGACY_CALENDAR_BLOCK_20260921__) return;
  window.__QMES_LEGACY_CALENDAR_BLOCK_20260921__=true;

  const removeLegacy=()=>{
    document.querySelectorAll('[id^="qmes-date-picker-stable-pop"]').forEach(el=>el.remove());
  };

  try{
    Object.defineProperty(window,"qmesDatePickerStable",{
      configurable:true,
      get(){return undefined;},
      set(){return true;}
    });
  }catch(_){
    try{window.qmesDatePickerStable=undefined;}catch(__){}
  }

  removeLegacy();

  const observer=new MutationObserver(removeLegacy);
  observer.observe(document.documentElement,{childList:true,subtree:true});

  document.addEventListener("pointerdown",event=>{
    const target=event.target;
    if(!(target instanceof HTMLInputElement)) return;
    if(
      target.dataset.qmesGlobalFixedDate==="1" ||
      target.type==="date" ||
      target.dataset.qmesDateField==="1"
    ){
      removeLegacy();
      const picker=window.qmesGlobalFixedCalendar;
      if(picker&&typeof picker.open==="function"){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        picker.patch?.(target);
        picker.open(target);
      }
    }
  },true);
})();