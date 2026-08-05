(function(){
  "use strict";
  if(window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_V9__) return;
  window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_V9__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const all=(root=document)=>Array.from(root.querySelectorAll("div,section,article,span,p,h1,h2,h3,h4,h5,label,th,td"));
  const complaintLabels=["당월 접수","진행중","완료","초동 회신 준수율"];

  const style=document.createElement("style");
  style.id="qmes-equipment-complaint-summary-refinement-v9-style";
  style.textContent=`
    .qmes-equipment-summary-card,
    .qmes-equipment-summary-card *{
      color:#fff!important;
      text-align:center!important;
      text-align-last:center!important;
      justify-content:center!important;
    }
    .qmes-equipment-summary-card{
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
    }

    .qmes-complaint-summary-row-clean{
      width:100%!important;
      display:grid!important;
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      gap:12px!important;
      align-items:stretch!important;
    }

    /* 고객불만 상단 4칸은 글자와 숫자만 남긴다. */
    .qmes-complaint-card-frame,
    .qmes-complaint-card-frame *{
      border-color:transparent!important;
      outline:0!important;
      background:transparent!important;
      background-color:transparent!important;
      background-image:none!important;
      box-shadow:none!important;
      filter:none!important;
      clip-path:none!important;
      mask:none!important;
      -webkit-mask:none!important;
    }
    .qmes-complaint-card-frame{
      width:100%!important;
      min-width:0!important;
      max-width:none!important;
      min-height:68px!important;
      box-sizing:border-box!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      padding:6px 10px!important;
      overflow:visible!important;
    }
    .qmes-complaint-card-frame::before,
    .qmes-complaint-card-frame::after,
    .qmes-complaint-card-frame *::before,
    .qmes-complaint-card-frame *::after{
      content:none!important;
      display:none!important;
      border:0!important;
      background:none!important;
      background-image:none!important;
      box-shadow:none!important;
    }
    .qmes-complaint-card-frame svg,
    .qmes-complaint-card-frame img,
    .qmes-complaint-card-frame [role="img"],
    .qmes-complaint-card-frame [class*="icon" i],
    .qmes-complaint-card-frame [class*="alert" i],
    .qmes-complaint-card-frame .qmes-complaint-decoration-hide{
      display:none!important;
    }
    .qmes-complaint-content-kept,
    .qmes-complaint-content-kept *{
      color:#fff!important;
      text-align:center!important;
      text-align-last:center!important;
      margin-left:auto!important;
      margin-right:auto!important;
    }
    .qmes-complaint-content-kept{
      width:100%!important;
      min-height:56px!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      gap:2px!important;
      padding:0!important;
    }

    .qmes-ncr-content-font,
    .qmes-ncr-content-font *{
      font-size:var(--qmes-ncr-font-size,14px)!important;
      font-weight:var(--qmes-ncr-font-weight,500)!important;
      font-family:var(--qmes-ncr-font-family,inherit)!important;
    }
    @media(max-width:760px){
      .qmes-complaint-summary-row-clean{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
    }
  `;
  document.head.appendChild(style);

  function markEquipment(){
    ["등록 설비","30일 이내 일정","기한 초과","미완료 수리"].forEach(label=>{
      all().filter(element=>clean(element.textContent)===label).forEach(element=>{
        let node=element;
        while(node&&node!==document.body){
          const rect=node.getBoundingClientRect();
          if(rect.width>120&&rect.height>45&&rect.height<220){node.classList.add("qmes-equipment-summary-card");break;}
          node=node.parentElement;
        }
      });
    });
  }

  function labelMatch(text,label){
    if(label==="진행중") return /^진행\s*중(?:\s*\(Open\))?$/.test(text);
    if(label==="완료") return /^완료(?:\s*\(Close\))?$/.test(text);
    return text===label;
  }

  function findLabel(label){
    return all().find(element=>labelMatch(clean(element.textContent),label));
  }

  function isCardLike(element){
    if(!element||element===document.body) return false;
    const classes=String(element.className||"");
    const css=getComputedStyle(element);
    return /rounded|border|card|panel/i.test(classes)||parseFloat(css.borderTopWidth)>0||parseFloat(css.borderRadius)>0;
  }

  function findContent(labelNode){
    let node=labelNode?.parentElement;
    while(node&&node!==document.body){
      const rect=node.getBoundingClientRect();
      const text=clean(node.textContent);
      if(text.length<150&&rect.width>=80&&rect.height>=28&&rect.height<=180&&isCardLike(node)) return node;
      node=node.parentElement;
    }
    return labelNode?.parentElement||null;
  }

  function findFrame(content,label){
    let node=content?.parentElement;
    while(node&&node!==document.body){
      const rect=node.getBoundingClientRect();
      const text=clean(node.textContent);
      const includesOther=complaintLabels.some(other=>other!==label&&text.includes(other));
      if(!includesOther&&text.length<260&&rect.width>=content.getBoundingClientRect().width&&rect.height>=content.getBoundingClientRect().height&&isCardLike(node)) return node;
      node=node.parentElement;
    }
    return content;
  }

  function markComplaintCard(label){
    const labelNode=findLabel(label);
    const content=findContent(labelNode);
    const frame=findFrame(content,label);
    if(!labelNode||!content||!frame) return null;

    frame.classList.add("qmes-complaint-card-frame");
    content.classList.add("qmes-complaint-content-kept");

    frame.querySelectorAll("svg,img,[role='img'],[class*='icon' i],[class*='alert' i]").forEach(element=>{
      element.classList.add("qmes-complaint-decoration-hide");
      element.setAttribute("aria-hidden","true");
    });

    Array.from(frame.children).forEach(child=>{
      if(child===content||child.contains(content)||content.contains(child)) return;
      const text=clean(child.textContent);
      const hasIcon=Boolean(child.querySelector?.("svg,img,[role='img']"));
      if(hasIcon||!text||/^[!⚠❗]+$/.test(text)){
        child.classList.add("qmes-complaint-decoration-hide");
        child.setAttribute("aria-hidden","true");
      }
    });

    return frame;
  }

  function commonParent(cards){
    if(cards.length!==4) return null;
    let node=cards[0].parentElement;
    while(node&&node!==document.body){
      if(cards.every(card=>node.contains(card))) return node;
      node=node.parentElement;
    }
    return null;
  }

  function markComplaint(){
    if(!clean(document.body.textContent).includes("초동 회신 준수율")) return;
    const cards=complaintLabels.map(markComplaintCard).filter(Boolean);
    if(cards.length!==4) return;
    const row=commonParent(cards);
    if(row) row.classList.add("qmes-complaint-summary-row-clean");
  }

  function findIsolationInput(){
    const label=all().find(element=>["격리 위치","격리위치"].includes(clean(element.textContent)));
    if(!label) return null;
    let scope=label.parentElement;
    for(let index=0;scope&&index<5;index+=1,scope=scope.parentElement){
      const control=scope.querySelector("input,textarea,select");
      if(control) return control;
    }
    return null;
  }

  function findNcrScope(){
    const title=all().find(element=>clean(element.textContent)==="부적합 현황");
    let scope=title?.parentElement;
    while(scope&&scope!==document.body){
      if(scope.querySelector("table,tbody,[role='table'],[role='rowgroup']")&&scope.getBoundingClientRect().width>500) return scope;
      scope=scope.parentElement;
    }
    return null;
  }

  function unifyNcrTypography(){
    const reference=findIsolationInput();
    const scope=findNcrScope();
    if(!reference||!scope) return;
    const css=getComputedStyle(reference);
    scope.style.setProperty("--qmes-ncr-font-size",css.fontSize||"14px");
    scope.style.setProperty("--qmes-ncr-font-weight",css.fontWeight||"500");
    scope.style.setProperty("--qmes-ncr-font-family",css.fontFamily||"inherit");
    scope.querySelectorAll("tbody td,[role='rowgroup'] [role='cell'],input,select,textarea,button").forEach(element=>element.classList.add("qmes-ncr-content-font"));
  }

  let queued=false;
  function apply(){queued=false;markEquipment();markComplaint();unifyNcrTypography();}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply);}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("resize",schedule);
  schedule();
})();
