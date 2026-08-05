(function(){
  "use strict";
  if(window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_20260805__) return;
  window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_20260805__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const elements=(root=document)=>Array.from(root.querySelectorAll("div,section,article,span,p,h1,h2,h3,h4,h5"));

  const style=document.createElement("style");
  style.id="qmes-equipment-complaint-summary-refinement-20260805-style";
  style.textContent=`
    .qmes-equipment-summary-card,
    .qmes-equipment-summary-card *{
      text-align:center!important;
      text-align-last:center!important;
      justify-content:center!important;
      color:#ffffff!important;
    }
    .qmes-equipment-summary-card{
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
    }

    .qmes-complaint-summary-card{
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      text-align:center!important;
      border-color:#334155!important;
      background:#0f1e32!important;
      box-shadow:none!important;
    }
    .qmes-complaint-summary-card::before,
    .qmes-complaint-summary-card::after{
      border-color:transparent!important;
      background:none!important;
      box-shadow:none!important;
    }
    .qmes-complaint-summary-card,
    .qmes-complaint-summary-card *{
      text-align:center!important;
      text-align-last:center!important;
      justify-content:center!important;
    }
    .qmes-complaint-summary-card *{color:#ffffff!important;}
    .qmes-complaint-summary-card [class*="border-"]{border-color:#334155!important;}
  `;
  document.head.appendChild(style);

  function nearestCard(node,limit=document.body){
    let current=node;
    while(current&&current!==limit&&current!==document.body){
      const rect=current.getBoundingClientRect();
      const css=getComputedStyle(current);
      const rounded=parseFloat(css.borderTopLeftRadius)>=6;
      const bordered=parseFloat(css.borderTopWidth)>0||parseFloat(css.borderBottomWidth)>0;
      if(rounded&&bordered&&rect.width>100&&rect.height>45&&rect.height<240) return current;
      current=current.parentElement;
    }
    return null;
  }

  function exactNodes(root,label){
    return elements(root).filter(el=>clean(el.textContent)===label);
  }

  function markEquipment(){
    ["등록 설비","30일 이내 일정","기한 초과","미완료 수리"].forEach(label=>{
      exactNodes(document,label).forEach(el=>{
        const card=nearestCard(el);
        if(card) card.classList.add("qmes-equipment-summary-card");
      });
    });
  }

  function complaintSummaryScope(){
    const anchor=exactNodes(document,"초동 회신 준수율")[0];
    if(!anchor) return null;
    let scope=anchor.parentElement;
    while(scope&&scope!==document.body){
      const text=clean(scope.textContent);
      const hasReceived=text.includes("당월 접수");
      const hasProgress=text.includes("진행중")||text.includes("진행 중");
      const hasDone=text.includes("완료");
      const hasReply=text.includes("초동 회신 준수율");
      const rect=scope.getBoundingClientRect();
      if(hasReceived&&hasProgress&&hasDone&&hasReply&&rect.height<500) return scope;
      scope=scope.parentElement;
    }
    return null;
  }

  function markComplaintOnly(){
    document.querySelectorAll(".qmes-complaint-summary-card,.qmes-summary-simple-card").forEach(card=>{
      card.classList.remove("qmes-complaint-summary-card","qmes-summary-simple-card");
    });

    const scope=complaintSummaryScope();
    if(!scope) return;
    ["당월 접수","진행중","진행 중","완료","초동 회신 준수율"].forEach(label=>{
      exactNodes(scope,label).forEach(el=>{
        const card=nearestCard(el,scope.parentElement||document.body);
        if(card&&scope.contains(card)) card.classList.add("qmes-complaint-summary-card");
      });
    });
  }

  function apply(){
    markEquipment();
    markComplaintOnly();
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
