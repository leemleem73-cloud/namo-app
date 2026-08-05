(function(){
  "use strict";
  if(window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_20260805__) return;
  window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_20260805__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const elements=()=>Array.from(document.querySelectorAll("div,section,article,span,p,h1,h2,h3,h4,h5"));

  const style=document.createElement("style");
  style.id="qmes-equipment-complaint-summary-refinement-20260805-style";
  style.textContent=`
    .qmes-summary-simple-card{
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      text-align:center!important;
      border-color:#334155!important;
      background:#0f1e32!important;
      box-shadow:none!important;
    }
    .qmes-summary-simple-card::before,
    .qmes-summary-simple-card::after{
      border-color:transparent!important;
      background:none!important;
      box-shadow:none!important;
    }
    .qmes-summary-simple-card,
    .qmes-summary-simple-card *{
      text-align:center!important;
      text-align-last:center!important;
      justify-content:center!important;
    }
    .qmes-summary-simple-card *{
      color:#ffffff!important;
    }
    .qmes-summary-simple-card [class*="border-"]{
      border-color:#334155!important;
    }
  `;
  document.head.appendChild(style);

  function nearestCard(node){
    let current=node;
    while(current&&current!==document.body){
      const rect=current.getBoundingClientRect();
      const css=getComputedStyle(current);
      const rounded=parseFloat(css.borderTopLeftRadius)>=6;
      const bordered=parseFloat(css.borderTopWidth)>0||parseFloat(css.borderBottomWidth)>0;
      if(rounded&&bordered&&rect.width>100&&rect.height>45&&rect.height<240) return current;
      current=current.parentElement;
    }
    return null;
  }

  function mark(labels){
    labels.forEach(label=>{
      elements().filter(el=>clean(el.textContent)===label).forEach(el=>{
        const card=nearestCard(el);
        if(card) card.classList.add("qmes-summary-simple-card");
      });
    });
  }

  function apply(){
    mark(["등록 설비","30일 이내 일정","기한 초과","미완료 수리"]);
    mark(["당월 접수","진행중","진행 중","완료","초동 회신 준수율"]);
  }

  let queued=false;
  const schedule=()=>{
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  };

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("resize",schedule);
  schedule();
})();
