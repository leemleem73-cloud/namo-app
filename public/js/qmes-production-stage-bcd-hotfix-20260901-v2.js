/* NAMO QMES production-stage labels aligned with work orders.
 * Internal values stay compatible with the existing MRP rules:
 * 샘플 -> B-Lab, 개발 -> C-Pilot, 양산 -> D-양산.
 */
(function(){
  "use strict";
  if(window.__QMES_PRODUCTION_STAGE_BCD_V2__) return;
  window.__QMES_PRODUCTION_STAGE_BCD_V2__=true;

  const HOST_ID="qmes-live-production-mrp-v3";
  const LABELS={"샘플":"B-Lab","개발":"C-Pilot","양산":"D-양산"};
  const ORDER=["양산","개발","샘플"];
  let queued=false;

  function apply(){
    queued=false;
    const host=document.getElementById(HOST_ID);
    if(!host) return;

    const select=host.querySelector("[data-type]");
    if(select){
      Object.entries(LABELS).forEach(([value,label])=>{
        const option=select.querySelector(`option[value="${value}"]`);
        if(option&&option.textContent!==label) option.textContent=label;
      });
      const currentOrder=Array.from(select.options).map(option=>option.value).join("|");
      if(currentOrder!==ORDER.join("|")){
        ORDER.forEach(value=>{
          const option=select.querySelector(`option[value="${value}"]`);
          if(option) select.appendChild(option);
        });
      }
      select.setAttribute("aria-label","생산구분: D-양산, C-Pilot 또는 B-Lab");
    }

    const subtitle=host.querySelector(".mrp-sub");
    if(subtitle?.innerHTML.includes("샘플 / 개발 / 양산")){
      subtitle.innerHTML=subtitle.innerHTML.replace("샘플 / 개발 / 양산","D-양산 / C-Pilot / B-Lab");
    }

    const summary=host.querySelector(".table-head .muted");
    if(summary){
      const next=summary.textContent.replace(/^(샘플|개발|양산)(\s*·)/,(_,value,divider)=>`${LABELS[value]}${divider}`);
      if(next!==summary.textContent) summary.textContent=next;
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
