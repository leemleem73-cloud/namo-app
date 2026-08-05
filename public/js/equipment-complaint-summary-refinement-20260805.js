(function(){
  "use strict";
  if(window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_20260805_V2__) return;
  window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_20260805_V2__=true;

  const clean=v=>String(v||"").replace(/\s+/g," ").trim();
  const all=(root=document)=>Array.from(root.querySelectorAll("div,section,article,span,p,h1,h2,h3,h4,h5"));
  const labels=["당월 접수","진행중","완료","초동 회신 준수율"];

  const style=document.createElement("style");
  style.id="qmes-equipment-complaint-summary-refinement-20260805-style-v2";
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

    .qmes-complaint-plain-card{
      position:relative!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:center!important;
      justify-content:center!important;
      gap:3px!important;
      height:72px!important;
      min-height:72px!important;
      padding:7px 12px!important;
      box-sizing:border-box!important;
      border:1px solid #2c4058!important;
      border-radius:8px!important;
      outline:0!important;
      background:#111f33!important;
      background-image:none!important;
      box-shadow:none!important;
      clip-path:none!important;
      filter:none!important;
      overflow:hidden!important;
    }
    .qmes-complaint-plain-card::before,
    .qmes-complaint-plain-card::after{
      display:none!important;
      content:none!important;
      border:0!important;
      background:none!important;
      box-shadow:none!important;
      clip-path:none!important;
    }
    .qmes-complaint-plain-label{
      margin:0!important;
      padding:0!important;
      color:#dbe5f1!important;
      background:transparent!important;
      border:0!important;
      font-size:13px!important;
      line-height:1.2!important;
      text-align:center!important;
      white-space:nowrap!important;
    }
    .qmes-complaint-plain-value{
      margin:0!important;
      padding:0!important;
      color:#fff!important;
      background:transparent!important;
      border:0!important;
      font-size:19px!important;
      font-weight:700!important;
      line-height:1.15!important;
      text-align:center!important;
      white-space:nowrap!important;
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

  function findLabel(label){
    return all().find(el=>labelMatch(clean(el.textContent),label));
  }

  function findCard(labelNode,label){
    if(!labelNode) return null;
    let node=labelNode;
    while(node&&node!==document.body){
      const r=node.getBoundingClientRect();
      const text=clean(node.textContent);
      const otherLabels=labels.filter(x=>x!==label).filter(x=>text.includes(x));
      if(r.width>=220&&r.width<=650&&r.height>=60&&r.height<=260&&otherLabels.length===0) return node;
      node=node.parentElement;
    }
    return null;
  }

  function extractValue(card,label){
    const text=clean(card.textContent)
      .replace(/진행\s*중\s*\(Open\)/g,"")
      .replace(/완료\s*\(Close\)/g,"")
      .replace(label,"")
      .trim();
    const percent=text.match(/\d+(?:\.\d+)?\s*%/);
    if(percent) return percent[0].replace(/\s+/g,"");
    const number=text.match(/-?\d+(?:\.\d+)?/);
    return number?number[0]:"0";
  }

  function displayLabel(label){
    if(label==="진행중") return "진행중 (Open)";
    if(label==="완료") return "완료 (Close)";
    return label;
  }

  function rebuildCard(card,label){
    if(card.dataset.qmesPlainComplaintCard===label) return;
    const value=extractValue(card,label);

    while(card.firstChild) card.removeChild(card.firstChild);

    const labelEl=document.createElement("div");
    labelEl.className="qmes-complaint-plain-label";
    labelEl.textContent=displayLabel(label);

    const valueEl=document.createElement("div");
    valueEl.className="qmes-complaint-plain-value";
    valueEl.textContent=value;

    card.append(labelEl,valueEl);
    card.className="qmes-complaint-plain-card";
    card.dataset.qmesPlainComplaintCard=label;

    card.removeAttribute("style");
    card.style.setProperty("height","72px","important");
    card.style.setProperty("min-height","72px","important");
    card.style.setProperty("border","1px solid #2c4058","important");
    card.style.setProperty("background","#111f33","important");
    card.style.setProperty("background-image","none","important");
    card.style.setProperty("box-shadow","none","important");
    card.style.setProperty("clip-path","none","important");
  }

  function markComplaint(){
    const bodyText=clean(document.body.textContent);
    if(!bodyText.includes("고객불만 접수")||!bodyText.includes("초동 회신 준수율")) return;

    const pairs=labels.map(label=>({label,card:findCard(findLabel(label),label)}));
    if(pairs.some(item=>!item.card)||new Set(pairs.map(item=>item.card)).size!==4) return;
    pairs.forEach(item=>rebuildCard(item.card,item.label));
  }

  let queued=false;
  function apply(){queued=false;markEquipment();markComplaint();}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply);}

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",schedule,true);
  document.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("resize",schedule);
  schedule();
})();
