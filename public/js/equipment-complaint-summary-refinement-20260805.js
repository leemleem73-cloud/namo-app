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
      position:relative!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      gap:6px!important;
      min-height:138px!important;
      padding:16px!important;
      text-align:center!important;
      border:0!important;
      border-radius:10px!important;
      outline:0!important;
      background:#0f1e32!important;
      background-image:none!important;
      box-shadow:none!important;
      clip-path:none!important;
      overflow:hidden!important;
    }
    .qmes-complaint-summary-card::before,
    .qmes-complaint-summary-card::after{
      display:none!important;
      content:none!important;
      border:0!important;
      outline:0!important;
      background:none!important;
      box-shadow:none!important;
      clip-path:none!important;
    }
    .qmes-complaint-summary-card,
    .qmes-complaint-summary-card *{
      text-align:center!important;
      text-align-last:center!important;
      justify-content:center!important;
    }
    .qmes-complaint-summary-card *{color:#ffffff!important;}
    .qmes-complaint-summary-card > *{
      position:static!important;
      margin-left:auto!important;
      margin-right:auto!important;
      transform:none!important;
    }
    .qmes-complaint-summary-card svg,
    .qmes-complaint-summary-card img,
    .qmes-complaint-summary-card [role="img"],
    .qmes-complaint-summary-card [class*="icon"],
    .qmes-complaint-summary-card [class*="Icon"],
    .qmes-complaint-summary-card .qmes-complaint-decoration{
      display:none!important;
    }
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

  function complaintLabelNode(prefix){
    return elements(document).find(el=>{
      const text=clean(el.textContent);
      return text===prefix||text.startsWith(prefix+" ")||text.startsWith(prefix+"(")||text.startsWith(prefix+" (");
    });
  }

  function findComplaintCard(labelNode){
    let current=labelNode;
    while(current&&current!==document.body){
      const rect=current.getBoundingClientRect();
      const css=getComputedStyle(current);
      const text=clean(current.textContent);
      const visualCard=css.backgroundColor!=="rgba(0, 0, 0, 0)"||css.clipPath!=="none"||parseFloat(css.borderTopWidth)>0;
      if(text&&visualCard&&rect.width>=220&&rect.width<=520&&rect.height>=100&&rect.height<=230) return current;
      current=current.parentElement;
    }
    return null;
  }

  function hideComplaintDecorations(card){
    card.querySelectorAll("svg,img,[role='img'],[class*='icon'],[class*='Icon']").forEach(node=>node.classList.add("qmes-complaint-decoration"));
    Array.from(card.querySelectorAll("div,span")).forEach(child=>{
      if(child===card) return;
      const text=clean(child.textContent);
      const css=getComputedStyle(child);
      const rect=child.getBoundingClientRect();
      const smallDecoration=!text&&rect.width<=130&&rect.height<=130&&(
        css.position==="absolute"||css.clipPath!=="none"||
        parseFloat(css.borderLeftWidth)>0||parseFloat(css.borderRightWidth)>0||
        parseFloat(css.borderTopWidth)>0||parseFloat(css.borderBottomWidth)>0||
        css.backgroundImage!=="none"
      );
      if(smallDecoration) child.classList.add("qmes-complaint-decoration");
    });
  }

  function markComplaintOnly(){
    document.querySelectorAll(".qmes-complaint-summary-card").forEach(card=>card.classList.remove("qmes-complaint-summary-card"));

    const labels=["당월 접수","진행중","완료","초동 회신 준수율"];
    const nodes=labels.map(complaintLabelNode);
    if(nodes.some(node=>!node)) return;

    const cards=nodes.map(findComplaintCard);
    if(cards.some(card=>!card)) return;

    const unique=[...new Set(cards)];
    if(unique.length!==4) return;

    unique.forEach(card=>{
      card.classList.add("qmes-complaint-summary-card");
      hideComplaintDecorations(card);
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
