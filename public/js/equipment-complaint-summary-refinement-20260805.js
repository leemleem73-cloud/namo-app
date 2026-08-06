(function(){
  "use strict";
  if(window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_V13__) return;
  window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_V13__=true;

  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const all=(root=document)=>Array.from(root.querySelectorAll("div,section,article,span,p,h1,h2,h3,h4,h5,label,th,td"));
  const complaintLabels=["당월 접수","진행중","완료","초동 회신 준수율"];

  const style=document.createElement("style");
  style.id="qmes-equipment-complaint-summary-refinement-v13-style";
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

    /* 네 칸을 하나의 연결된 둥근 박스로 표시 */
    .qmes-complaint-summary-row-clean{
      width:100%!important;
      display:grid!important;
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      gap:0!important;
      align-items:stretch!important;
      padding:0!important;
      margin:0!important;
      overflow:hidden!important;
      border:1px solid #475569!important;
      border-radius:10px!important;
      background:transparent!important;
      box-shadow:none!important;
    }

    .qmes-complaint-card-frame,
    .qmes-complaint-card-frame:hover,
    .qmes-complaint-card-frame:active,
    .qmes-complaint-card-frame:focus,
    .qmes-complaint-card-frame:focus-visible,
    .qmes-complaint-card-frame:focus-within{
      box-sizing:border-box!important;
      width:100%!important;
      min-width:0!important;
      height:88px!important;
      min-height:88px!important;
      max-height:88px!important;
      margin:0!important;
      padding:10px!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      overflow:visible!important;
      border:0!important;
      border-right:1px solid #475569!important;
      border-radius:0!important;
      outline:0!important;
      background:transparent!important;
      background-color:transparent!important;
      background-image:none!important;
      box-shadow:none!important;
      filter:none!important;
      transform:none!important;
      transition:none!important;
      animation:none!important;
      color:#fff!important;
      cursor:default!important;
    }
    .qmes-complaint-card-frame:last-child{
      border-right:0!important;
    }

    .qmes-complaint-card-frame *,
    .qmes-complaint-card-frame *:hover,
    .qmes-complaint-card-frame *:active,
    .qmes-complaint-card-frame *:focus{
      background:transparent!important;
      background-color:transparent!important;
      background-image:none!important;
      border-color:transparent!important;
      box-shadow:none!important;
      filter:none!important;
      transform:none!important;
      transition:none!important;
      animation:none!important;
      color:#fff!important;
    }

    .qmes-complaint-card-frame::before,
    .qmes-complaint-card-frame::after,
    .qmes-complaint-card-frame *::before,
    .qmes-complaint-card-frame *::after{
      content:none!important;
      display:none!important;
    }

    .qmes-complaint-card-frame svg,
    .qmes-complaint-card-frame img,
    .qmes-complaint-card-frame [role="img"],
    .qmes-complaint-card-frame [class*="icon" i],
    .qmes-complaint-card-frame [class*="alert" i],
    .qmes-complaint-decoration-hide{
      display:none!important;
    }

    .qmes-complaint-content-kept{
      width:100%!important;
      min-width:0!important;
      min-height:64px!important;
      margin:0!important;
      padding:0!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      gap:5px!important;
      overflow:visible!important;
      text-align:center!important;
      text-align-last:center!important;
    }

    .qmes-complaint-label{
      width:100%!important;
      min-height:20px!important;
      margin:0!important;
      padding:0!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      text-align:center!important;
      font-size:12px!important;
      font-weight:600!important;
      line-height:20px!important;
      white-space:nowrap!important;
    }

    .qmes-complaint-value-row{
      width:100%!important;
      min-height:28px!important;
      margin:0!important;
      padding:0!important;
      display:flex!important;
      flex-direction:row!important;
      align-items:baseline!important;
      justify-content:center!important;
      gap:3px!important;
      text-align:center!important;
      font-size:20px!important;
      font-weight:800!important;
      line-height:28px!important;
      white-space:nowrap!important;
    }
    .qmes-complaint-value-row *{
      display:inline!important;
      width:auto!important;
      min-width:0!important;
      min-height:0!important;
      margin:0!important;
      padding:0!important;
      font-size:inherit!important;
      line-height:inherit!important;
      white-space:nowrap!important;
    }
    .qmes-complaint-value-row span:last-child{
      font-size:12px!important;
      font-weight:500!important;
      line-height:18px!important;
    }

    .qmes-ncr-content-font,
    .qmes-ncr-content-font *{
      font-size:var(--qmes-ncr-font-size,14px)!important;
      font-weight:var(--qmes-ncr-font-weight,500)!important;
      font-family:var(--qmes-ncr-font-family,inherit)!important;
    }

    @media(max-width:760px){
      .qmes-complaint-summary-row-clean{
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
      }
      .qmes-complaint-card-frame:nth-child(2){border-right:0!important;}
      .qmes-complaint-card-frame:nth-child(-n+2){border-bottom:1px solid #475569!important;}
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

  function findLabel(label){return all().find(element=>labelMatch(clean(element.textContent),label));}

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
    labelNode.classList.add("qmes-complaint-label");

    const valueCandidates=Array.from(content.children).filter(child=>child!==labelNode&&!child.contains(labelNode));
    const valueRow=valueCandidates.find(child=>/\d|—/.test(clean(child.textContent)))||valueCandidates[valueCandidates.length-1];
    if(valueRow) valueRow.classList.add("qmes-complaint-value-row");

    frame.querySelectorAll("svg,img,[role='img'],[class*='icon' i],[class*='alert' i]").forEach(element=>{
      element.classList.add("qmes-complaint-decoration-hide");
      element.setAttribute("aria-hidden","true");
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
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply));}

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("resize",schedule);
  window.addEventListener("load",schedule);
  schedule();
})();
