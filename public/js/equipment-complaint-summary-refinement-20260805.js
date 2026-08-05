(function(){
  "use strict";
  if(window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_20260805__) return;
  window.__QMES_EQUIPMENT_COMPLAINT_SUMMARY_REFINEMENT_20260805__=true;

  const clean=v=>String(v||"").replace(/\s+/g," ").trim();
  const all=(root=document)=>Array.from(root.querySelectorAll("div,section,article,span,p,h1,h2,h3,h4,h5"));
  const labels=["당월 접수","진행중","완료","초동 회신 준수율"];

  const style=document.createElement("style");
  style.id="qmes-equipment-complaint-summary-refinement-20260805-style";
  style.textContent=`
    .qmes-equipment-summary-card,.qmes-equipment-summary-card *{
      color:#fff!important;text-align:center!important;text-align-last:center!important;justify-content:center!important;
    }
    .qmes-equipment-summary-card{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;}

    .qmes-complaint-iqc-card{
      position:relative!important;display:flex!important;flex-direction:column!important;
      align-items:center!important;justify-content:center!important;gap:2px!important;
      min-height:72px!important;height:72px!important;padding:6px 12px!important;box-sizing:border-box!important;
      border:1px solid #24364d!important;border-left:1px solid #24364d!important;
      border-right:1px solid #24364d!important;border-top:1px solid #24364d!important;border-bottom:1px solid #24364d!important;
      border-radius:8px!important;outline:0!important;
      background:#0f1e32!important;background-color:#0f1e32!important;background-image:none!important;
      box-shadow:none!important;clip-path:none!important;filter:none!important;overflow:hidden!important;
    }
    .qmes-complaint-iqc-card::before,.qmes-complaint-iqc-card::after,
    .qmes-complaint-iqc-card *::before,.qmes-complaint-iqc-card *::after{
      display:none!important;content:none!important;border:0!important;outline:0!important;
      background:none!important;background-image:none!important;box-shadow:none!important;
      clip-path:none!important;filter:none!important;
    }
    .qmes-complaint-iqc-card,.qmes-complaint-iqc-card *{
      color:#fff!important;text-align:center!important;text-align-last:center!important;justify-content:center!important;
      border-color:transparent!important;background-image:none!important;box-shadow:none!important;clip-path:none!important;filter:none!important;
    }
    .qmes-complaint-iqc-card{
      border:1px solid #24364d!important;background:#0f1e32!important;
    }
    .qmes-complaint-iqc-card> *{
      position:static!important;margin-left:auto!important;margin-right:auto!important;transform:none!important;
      background:transparent!important;background-color:transparent!important;background-image:none!important;
    }
    .qmes-complaint-iqc-card svg,.qmes-complaint-iqc-card img,.qmes-complaint-iqc-card [role="img"],
    .qmes-complaint-iqc-card [class*="icon"],.qmes-complaint-iqc-card [class*="Icon"],
    .qmes-complaint-iqc-card .qmes-complaint-hide{display:none!important;}
  `;
  document.head.appendChild(style);

  function markEquipment(){
    ["등록 설비","30일 이내 일정","기한 초과","미완료 수리"].forEach(label=>{
      all().filter(el=>clean(el.textContent)===label).forEach(el=>{
        let node=el;
        while(node&&node!==document.body){
          const r=node.getBoundingClientRect();
          if(r.width>120&&r.height>45&&r.height<220){node.classList.add("qmes-equipment-summary-card");break;}
          node=node.parentElement;
        }
      });
    });
  }

  function labelMatch(text,label){
    if(label==="진행중") return /^진행중(?:\s*\(Open\))?$/.test(text)||/^진행 중(?:\s*\(Open\))?$/.test(text);
    if(label==="완료") return /^완료(?:\s*\(Close\))?$/.test(text);
    return text===label;
  }

  function findLabel(label){return all().find(el=>labelMatch(clean(el.textContent),label));}

  function findCard(labelNode,label){
    if(!labelNode) return null;
    let node=labelNode;
    while(node&&node!==document.body){
      const r=node.getBoundingClientRect();
      const text=clean(node.textContent);
      const otherLabels=labels.filter(x=>x!==label).filter(x=>text.includes(x));
      if(r.width>=240&&r.width<=600&&r.height>=70&&r.height<=240&&otherLabels.length===0) return node;
      node=node.parentElement;
    }
    return null;
  }

  function simplify(card){
    card.querySelectorAll("svg,img,[role='img'],[class*='icon'],[class*='Icon']").forEach(el=>el.classList.add("qmes-complaint-hide"));

    Array.from(card.querySelectorAll("div,span,i,b,small")).forEach(el=>{
      if(el===card) return;
      const r=el.getBoundingClientRect();
      const css=getComputedStyle(el);
      const text=clean(el.textContent);
      const absolute=css.position==="absolute"||css.position==="fixed";
      const decorative=!text&&(
        absolute||r.width<=150||r.height<=18||css.clipPath!=="none"||css.backgroundImage!=="none"||
        parseFloat(css.borderTopWidth)>0||parseFloat(css.borderRightWidth)>0||
        parseFloat(css.borderBottomWidth)>0||parseFloat(css.borderLeftWidth)>0
      );
      if(decorative) el.classList.add("qmes-complaint-hide");
      else {
        el.style.setProperty("background","transparent","important");
        el.style.setProperty("background-image","none","important");
        el.style.setProperty("box-shadow","none","important");
        el.style.setProperty("clip-path","none","important");
        el.style.setProperty("border-color","transparent","important");
      }
    });

    card.classList.add("qmes-complaint-iqc-card");
    card.style.setProperty("height","72px","important");
    card.style.setProperty("min-height","72px","important");
    card.style.setProperty("padding","6px 12px","important");
    card.style.setProperty("border","1px solid #24364d","important");
    card.style.setProperty("background","#0f1e32","important");
    card.style.setProperty("background-image","none","important");
    card.style.setProperty("clip-path","none","important");
    card.style.setProperty("box-shadow","none","important");
  }

  function markComplaint(){
    const bodyText=clean(document.body.textContent);
    if(!bodyText.includes("고객불만 접수")||!bodyText.includes("초동 회신 준수율")) return;

    const cards=labels.map(label=>findCard(findLabel(label),label));
    if(cards.some(card=>!card)||new Set(cards).size!==4) return;
    cards.forEach(simplify);
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
