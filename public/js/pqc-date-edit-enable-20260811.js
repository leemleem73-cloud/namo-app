/* QMES PQC inspection-date edit enable patch, 2026-08-11 */
(function enablePqcInspectionDateEdit(global){
  "use strict";
  if(global.__QMES_PQC_DATE_EDIT_ENABLE_20260811__) return;
  global.__QMES_PQC_DATE_EDIT_ENABLE_20260811__=true;

  function apply(){
    document.querySelectorAll('.qmes-inspection-modal.is-pqc input[type="date"]').forEach((input)=>{
      const wrapper=input.parentElement;
      const label=wrapper&&wrapper.querySelector('label');
      if(!label||String(label.textContent||'').trim()!=="검사일자") return;
      input.readOnly=false;
      input.removeAttribute('readonly');
      input.removeAttribute('title');
    });
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    global.requestAnimationFrame(()=>{queued=false;apply();});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
})(window);
