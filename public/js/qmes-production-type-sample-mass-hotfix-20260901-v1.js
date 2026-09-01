/* NAMO QMES production type owner — Sample / Mass Production only. */
(function(){
  "use strict";
  if(window.__QMES_PRODUCTION_TYPE_SAMPLE_MASS_V1__) return;
  window.__QMES_PRODUCTION_TYPE_SAMPLE_MASS_V1__=true;

  const HOST_ID="qmes-live-production-mrp-v3";
  let queued=false;

  function apply(){
    queued=false;
    const host=document.getElementById(HOST_ID);
    if(!host) return;

    const select=host.querySelector("[data-type]");
    if(select){
      const wasDevelopment=select.value==="개발";
      select.querySelector('option[value="개발"]')?.remove();
      if(wasDevelopment){
        select.value="샘플";
        select.dispatchEvent(new Event("change",{bubbles:true}));
      }
      select.setAttribute("aria-label","생산구분: 샘플 또는 양산");
    }

    const subtitle=host.querySelector(".mrp-sub");
    if(subtitle?.innerHTML.includes("샘플 / 개발 / 양산")){
      subtitle.innerHTML=subtitle.innerHTML.replace("샘플 / 개발 / 양산","샘플 / 양산");
    }
  }

  function schedule(){
    if(queued) return;
    queued=true;
    queueMicrotask(apply);
  }

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  [0,100,350,800,1600].forEach(delay=>setTimeout(schedule,delay));
  window.addEventListener("qmes:mes-master-ready",schedule);
  window.addEventListener("qmes:erp-runtime-loaded",schedule);
})();
