/* NAMO QMES - Sales KPI typography match V1 - 2026-08-28
 * APPEND-ONLY UI PATCH.
 * Keeps the compliance KPI visual owner, but copies typography from the normal KPI cards
 * so 납기 준수율 looks identical to 진행 수주 / 7일 이내 납기 / 지연 위험 / 수주량 합계.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_KPI_FONT_MATCH_20260828_V1__)return;
  window.__QMES_SALES_KPI_FONT_MATCH_20260828_V1__=true;

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const isCompliance=v=>clean(v).replace(/\s+/g,"")==="납기준수율"||clean(v).replace(/\s+/g,"")==="납기준율";

  function cardByLabel(root,label){
    return Array.from(root.querySelectorAll(".qerp-kpi")).find(card=>clean(card.querySelector("span")?.textContent)===label)||null;
  }

  function setImportant(node,name,value){
    if(node&&value)node.style.setProperty(name,value,"important");
  }

  function copyTypography(source,target){
    if(!source||!target)return;
    const cs=getComputedStyle(source);
    [
      "font-family","font-size","font-weight","font-style","font-stretch",
      "font-variant","font-variant-numeric","line-height","letter-spacing",
      "text-transform","text-decoration-thickness","text-underline-offset"
    ].forEach(prop=>setImportant(target,prop,cs.getPropertyValue(prop)));
    setImportant(target,"color",cs.color);
  }

  let applying=false;
  function apply(){
    if(applying)return;
    const root=document.querySelector(".qmes-sales-stable");
    if(!root)return;

    const cards=Array.from(root.querySelectorAll(".qerp-kpi"));
    const compliance=cards.find(card=>isCompliance(card.querySelector("span")?.textContent));
    if(!compliance)return;

    const reference=cardByLabel(root,"진행 수주")||cards.find(card=>card!==compliance);
    if(!reference)return;

    const refLabel=reference.querySelector("span");
    const refValue=Array.from(reference.querySelectorAll(":scope > b")).find(node=>!node.classList.contains("qmes-compliance-visual-owner"))||reference.querySelector("b");
    const complianceLabel=compliance.querySelector("span");
    const owner=compliance.querySelector(":scope > b.qmes-compliance-visual-owner");
    if(!owner||!refValue)return;

    applying=true;
    try{
      copyTypography(refLabel,complianceLabel);
      copyTypography(refValue,owner);
      setImportant(owner,"display",getComputedStyle(refValue).display==="inline"?"inline":"block");
      setImportant(owner,"margin",getComputedStyle(refValue).margin);
      setImportant(owner,"padding",getComputedStyle(refValue).padding);
      setImportant(owner,"width",getComputedStyle(refValue).width==="auto"?"auto":"auto");
      setImportant(owner,"height","auto");
      setImportant(owner,"opacity","1");
      setImportant(owner,"visibility","visible");
      setImportant(owner,"text-shadow",getComputedStyle(refValue).textShadow);
    }finally{
      applying=false;
    }
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;apply();});
  }

  function boot(){
    apply();
    [50,120,250,500,900,1500,2500,4000].forEach(ms=>setTimeout(apply,ms));
    const observer=new MutationObserver(mutations=>{
      const hit=mutations.some(m=>{
        const el=m.target?.nodeType===1?m.target:m.target?.parentElement;
        return !!el?.closest?.(".qmes-sales-stable")||Array.from(m.addedNodes||[]).some(n=>n.nodeType===1&&(n.matches?.(".qmes-sales-stable")||n.querySelector?.(".qmes-sales-stable")));
      });
      if(hit)schedule();
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["class","style","data-qmes-compliance-owner"]});
    window.__QMES_SALES_KPI_FONT_MATCH_OBSERVER_20260828_V1__=observer;
  }

  ["qmes:mes-master-ready","qmes:enterprise-ui-ready","qmes:erp-data-changed","qmes:data-updated"].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener("hashchange",schedule);
  window.addEventListener("popstate",schedule);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.qmesSalesKpiFontMatch={apply};
})();
