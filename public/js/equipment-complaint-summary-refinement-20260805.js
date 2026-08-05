(function(){
  "use strict";
  if(window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_20260805_V6__) return;
  window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_20260805_V6__=true;

  const clean=v=>String(v||"").replace(/\s+/g," ").trim();
  const all=(root=document)=>Array.from(root.querySelectorAll("div,section,article,span,p,h1,h2,h3,h4,h5,label,th,td"));
  const labels=["당월 접수","진행중","완료","초동 회신 준수율"];

  const style=document.createElement("style");
  style.id="qmes-equipment-complaint-summary-refinement-20260805-style-v6";
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

    .qmes-complaint-summary-row-wide{
      width:100%!important;
      display:grid!important;
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      gap:12px!important;
      align-items:stretch!important;
    }
    .qmes-complaint-outer-clean{
      position:relative!important;
      width:100%!important;
      max-width:none!important;
      min-width:0!important;
      height:68px!important;
      min-height:68px!important;
      padding:0!important;
      margin:0!important;
      border:0!important;
      outline:0!important;
      background:transparent!important;
      background-image:none!important;
      box-shadow:none!important;
      clip-path:none!important;
      filter:none!important;
      overflow:visible!important;
    }
    .qmes-complaint-outer-clean::before,
    .qmes-complaint-outer-clean::after{
      display:none!important;
      content:none!important;
      border:0!important;
      background:none!important;
      box-shadow:none!important;
      clip-path:none!important;
    }
    .qmes-complaint-inner-large{
      position:relative!important;
      inset:auto!important;
      width:100%!important;
      max-width:none!important;
      min-width:0!important;
      height:68px!important;
      min-height:68px!important;
      margin:0!important;
      padding:6px 16px!important;
      box-sizing:border-box!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      gap:2px!important;
      border:1px solid #2c4058!important;
      border-radius:8px!important;
      background:#111f33!important;
      background-image:none!important;
      box-shadow:none!important;
      clip-path:none!important;
      transform:none!important;
      overflow:hidden!important;
    }
    .qmes-complaint-inner-large::before,
    .qmes-complaint-inner-large::after{
      display:none!important;
      content:none!important;
      border:0!important;
      background:none!important;
      box-shadow:none!important;
      clip-path:none!important;
    }
    .qmes-complaint-inner-large,
    .qmes-complaint-inner-large *{
      color:#fff!important;
      text-align:center!important;
      text-align-last:center!important;
      justify-content:center!important;
      align-items:center!important;
      margin-left:auto!important;
      margin-right:auto!important;
      transform:none!important;
    }
    .qmes-complaint-inner-large svg,
    .qmes-complaint-inner-large img,
    .qmes-complaint-inner-large [role="img"],
    .qmes-complaint-inner-large [class*="icon"],
    .qmes-complaint-inner-large [class*="Icon"],
    .qmes-complaint-hide{
      display:none!important;
    }

    .qmes-ncr-content-font,
    .qmes-ncr-content-font *{
      font-size:var(--qmes-ncr-font-size,14px)!important;
      font-weight:var(--qmes-ncr-font-weight,500)!important;
      font-family:var(--qmes-ncr-font-family,inherit)!important;
    }
  `;
  document.head.appendChild(style);

  function markEquipment(){
    ["등록 설비","30일 이내 일정","기한 초과","미완료 수리"].forEach(label=>{
      all().filter(el=>clean(el.textContent)===label).forEach(el=>{
        let node=el;
        while(node&&node!==document.body){
          const r=node.getBoundingClientRect();
          if(r.width>120&&r.height>45&&r.height<220){
            node.classList.add("qmes-equipment-summary-card");
            break;
          }
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

  function findLabel(label){return all().find(el=>labelMatch(clean(el.textContent),label));}

  function findOuterCard(labelNode,label){
    if(!labelNode) return null;
    let node=labelNode;
    while(node&&node!==document.body){
      const r=node.getBoundingClientRect();
      const text=clean(node.textContent);
      const otherLabels=labels.filter(x=>x!==label).filter(x=>text.includes(x));
      if(r.width>=180&&r.width<=800&&r.height>=60&&r.height<=300&&otherLabels.length===0) return node;
      node=node.parentElement;
    }
    return null;
  }

  function findInnerCard(outer,labelNode){
    let node=labelNode;
    let candidate=null;
    while(node&&node!==outer){
      const r=node.getBoundingClientRect();
      const text=clean(node.textContent);
      if(text&&r.width>=80&&r.height>=24&&r.height<=180) candidate=node;
      node=node.parentElement;
    }
    return candidate||labelNode.parentElement||labelNode;
  }

  function simplifyComplaintCard(label){
    const labelNode=findLabel(label);
    const outer=findOuterCard(labelNode,label);
    if(!labelNode||!outer) return null;
    const inner=findInnerCard(outer,labelNode);
    if(!inner) return null;

    outer.classList.add("qmes-complaint-outer-clean");
    inner.classList.add("qmes-complaint-inner-large");
    outer.style.setProperty("width","100%","important");
    outer.style.setProperty("max-width","none","important");
    inner.style.setProperty("width","100%","important");
    inner.style.setProperty("max-width","none","important");
    inner.style.setProperty("display","flex","important");
    inner.style.setProperty("flex-direction","column","important");
    inner.style.setProperty("align-items","center","important");
    inner.style.setProperty("justify-content","center","important");
    inner.style.setProperty("text-align","center","important");
    return outer;
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
    const bodyText=clean(document.body.textContent);
    if(!bodyText.includes("고객불만 접수")||!bodyText.includes("초동 회신 준수율")) return;
    const cards=labels.map(simplifyComplaintCard).filter(Boolean);
    if(cards.length!==4) return;
    const row=commonParent(cards);
    if(row){
      row.classList.add("qmes-complaint-summary-row-wide");
      row.style.setProperty("width","100%","important");
      row.style.setProperty("display","grid","important");
      row.style.setProperty("grid-template-columns","repeat(4,minmax(0,1fr))","important");
      row.style.setProperty("gap","12px","important");
    }
  }

  function findIsolationInput(){
    const label=all().find(el=>clean(el.textContent)==="격리 위치"||clean(el.textContent)==="격리위치");
    if(!label) return null;
    let scope=label.parentElement;
    for(let i=0;scope&&i<5;i++,scope=scope.parentElement){
      const control=scope.querySelector("input,textarea,select");
      if(control) return control;
    }
    return null;
  }

  function findNcrStatusScope(){
    const title=all().find(el=>clean(el.textContent)==="부적합 현황");
    if(!title) return null;
    let scope=title.parentElement;
    while(scope&&scope!==document.body){
      const rect=scope.getBoundingClientRect();
      const hasRows=Boolean(scope.querySelector("table,tbody,[role='table'],[role='rowgroup']"));
      if(hasRows&&rect.width>500) return scope;
      scope=scope.parentElement;
    }
    return null;
  }

  function unifyNcrTypography(){
    const reference=findIsolationInput();
    const scope=findNcrStatusScope();
    if(!reference||!scope) return;
    const css=getComputedStyle(reference);
    const size=css.fontSize||"14px";
    const weight=css.fontWeight||"500";
    const family=css.fontFamily||"inherit";
    scope.style.setProperty("--qmes-ncr-font-size",size);
    scope.style.setProperty("--qmes-ncr-font-weight",weight);
    scope.style.setProperty("--qmes-ncr-font-family",family);
    scope.querySelectorAll("tbody td,[role='rowgroup'] [role='cell'],input,select,textarea,button").forEach(el=>{
      el.classList.add("qmes-ncr-content-font");
      el.style.setProperty("font-size",size,"important");
      el.style.setProperty("font-weight",weight,"important");
      el.style.setProperty("font-family",family,"important");
    });
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
