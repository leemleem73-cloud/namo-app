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

/* APPEND-ONLY V2 - dedicated compliance overlay.
 * Do not change existing KPI/runtime logic. The normal React value stays hidden in the
 * compliance card while a body-level overlay renders the final percentage with the
 * exact typography and vertical position of the normal KPI value.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_COMPLIANCE_OVERLAY_20260828_V2__)return;
  window.__QMES_SALES_COMPLIANCE_OVERLAY_20260828_V2__=true;

  const STYLE_ID="qmes-sales-compliance-overlay-style-20260828-v2";
  const OVERLAY_ID="qmes-sales-compliance-overlay-20260828-v2";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const isCompliance=v=>{const x=clean(v).replace(/\s+/g,"");return x==="납기준수율"||x==="납기준율";};

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-sales-stable .qerp-kpis > .qerp-kpi:nth-child(3) > b{
        visibility:hidden!important;
        opacity:0!important;
      }
      #${OVERLAY_ID}{
        position:fixed!important;
        z-index:2147483000!important;
        display:none;
        margin:0!important;
        padding:0!important;
        border:0!important;
        background:transparent!important;
        pointer-events:none!important;
        white-space:nowrap!important;
        color:#0f172a!important;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay(){
    let node=document.getElementById(OVERLAY_ID);
    if(!node){
      node=document.createElement("div");
      node.id=OVERLAY_ID;
      node.setAttribute("aria-hidden","true");
      document.body.appendChild(node);
    }
    return node;
  }

  function getValue(){
    try{
      const v=clean(window.qmesSalesKpiVisualLock?.values?.()?.["납기 준수율"]);
      if(/^\d+(?:\.\d+)?%$/.test(v))return v;
    }catch(_error){}
    try{
      const v=clean(sessionStorage.getItem("qmes-sales-compliance-last-good-v2")||"");
      if(/^\d+(?:\.\d+)?%$/.test(v))return v;
    }catch(_error){}
    return "";
  }

  function apply(){
    ensureStyle();
    const overlay=ensureOverlay();
    const root=document.querySelector(".qmes-sales-stable");
    if(!root){overlay.style.display="none";return;}

    const cards=Array.from(root.querySelectorAll(".qerp-kpi"));
    const compliance=cards.find(card=>isCompliance(card.querySelector("span")?.textContent));
    const reference=cards.find(card=>clean(card.querySelector("span")?.textContent)==="진행 수주")||cards.find(card=>card!==compliance);
    const refValue=reference?.querySelector(":scope > b");
    if(!compliance||!reference||!refValue){return;}

    const value=getValue();
    if(!value)return;

    const refCardRect=reference.getBoundingClientRect();
    const refValueRect=refValue.getBoundingClientRect();
    const compRect=compliance.getBoundingClientRect();
    if(!refCardRect.width||!compRect.width)return;

    const cs=getComputedStyle(refValue);
    const left=compRect.left+(refValueRect.left-refCardRect.left);
    const top=compRect.top+(refValueRect.top-refCardRect.top);

    overlay.textContent=value;
    overlay.style.setProperty("display","block","important");
    overlay.style.setProperty("left",left+"px","important");
    overlay.style.setProperty("top",top+"px","important");
    overlay.style.setProperty("font-family",cs.fontFamily,"important");
    overlay.style.setProperty("font-size",cs.fontSize,"important");
    overlay.style.setProperty("font-weight",cs.fontWeight,"important");
    overlay.style.setProperty("font-style",cs.fontStyle,"important");
    overlay.style.setProperty("font-stretch",cs.fontStretch,"important");
    overlay.style.setProperty("font-variant",cs.fontVariant,"important");
    overlay.style.setProperty("font-variant-numeric",cs.fontVariantNumeric,"important");
    overlay.style.setProperty("line-height",cs.lineHeight,"important");
    overlay.style.setProperty("letter-spacing",cs.letterSpacing,"important");
    overlay.style.setProperty("text-transform",cs.textTransform,"important");
    overlay.style.setProperty("text-align",cs.textAlign,"important");
    overlay.style.setProperty("color","#0f172a","important");
    overlay.style.setProperty("opacity","1","important");
    overlay.style.setProperty("visibility","visible","important");
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  }

  function boot(){
    apply();
    [30,80,150,300,600,1000,1800,3000,5000].forEach(ms=>setTimeout(apply,ms));
    const observer=new MutationObserver(schedule);
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    window.__QMES_SALES_COMPLIANCE_OVERLAY_OBSERVER_20260828_V2__=observer;
    window.addEventListener("resize",schedule,{passive:true});
    window.addEventListener("scroll",schedule,{passive:true,capture:true});
  }

  ["qmes:mes-master-ready","qmes:enterprise-ui-ready","qmes:erp-data-changed","qmes:data-updated","qmes:shared-sync-complete"].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener("hashchange",schedule);
  window.addEventListener("popstate",schedule);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.qmesSalesComplianceOverlay={apply};
})();

/* APPEND-ONLY V3 - detail/modal guard for compliance overlay.
 * Existing KPI and detail logic stays untouched. The body-level percentage overlay is
 * forced behind normal content and hidden whenever the Sales detail panel or another
 * visible modal/dialog is open. It is restored after the modal closes.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_COMPLIANCE_MODAL_GUARD_20260828_V3__)return;
  window.__QMES_SALES_COMPLIANCE_MODAL_GUARD_20260828_V3__=true;

  const OVERLAY_ID="qmes-sales-compliance-overlay-20260828-v2";
  const SALES_DETAIL_ID="qmes-sales-order-detail-panel-20260826";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();

  function visible(el){
    if(!(el instanceof Element))return false;
    const style=getComputedStyle(el);
    const rect=el.getBoundingClientRect();
    return style.display!=="none"&&style.visibility!=="hidden"&&Number(style.opacity)!==0&&rect.width>0&&rect.height>0;
  }

  function modalOpen(){
    const detail=document.getElementById(SALES_DETAIL_ID);
    if(detail&&visible(detail))return true;
    if(Array.from(document.querySelectorAll('[role="dialog"],[aria-modal="true"],dialog[open]')).some(visible))return true;
    return Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,[role='heading']")).some(node=>{
      if(!visible(node))return false;
      return /수주\s*상세\s*[·ㆍ•-]?\s*진행현황/.test(clean(node.textContent));
    });
  }

  let enforcing=false;
  function enforce(){
    if(enforcing)return;
    const overlay=document.getElementById(OVERLAY_ID);
    if(!overlay)return;
    enforcing=true;
    try{
      /* Never allow the KPI overlay to sit above application dialogs. */
      overlay.style.setProperty("z-index","80","important");

      if(modalOpen()){
        overlay.style.setProperty("display","none","important");
        overlay.style.setProperty("visibility","hidden","important");
        overlay.style.setProperty("opacity","0","important");
        overlay.setAttribute("data-qmes-modal-hidden","1");
        return;
      }

      if(overlay.getAttribute("data-qmes-modal-hidden")==="1"){
        overlay.removeAttribute("data-qmes-modal-hidden");
        try{window.qmesSalesComplianceOverlay?.apply?.();}catch(_error){}
        overlay.style.setProperty("z-index","80","important");
      }
    }finally{
      enforcing=false;
    }
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;enforce();});
  }

  function boot(){
    enforce();
    [30,80,150,300,600,1000,1800].forEach(ms=>setTimeout(enforce,ms));
    const observer=new MutationObserver(schedule);
    observer.observe(document.body,{
      childList:true,
      subtree:true,
      characterData:true,
      attributes:true,
      attributeFilter:["style","class","aria-modal","open","hidden"]
    });
    window.__QMES_SALES_COMPLIANCE_MODAL_GUARD_OBSERVER_20260828_V3__=observer;
  }

  document.addEventListener("click",schedule,true);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")schedule();},true);
  window.addEventListener("resize",schedule,{passive:true});
  window.addEventListener("hashchange",schedule);
  window.addEventListener("popstate",schedule);
  ["qmes:mes-master-ready","qmes:enterprise-ui-ready","qmes:erp-data-changed","qmes:data-updated","qmes:shared-sync-complete"].forEach(name=>window.addEventListener(name,schedule));

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.qmesSalesComplianceModalGuard={enforce,schedule};
})();
