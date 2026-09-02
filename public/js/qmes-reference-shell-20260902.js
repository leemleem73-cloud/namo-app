/* NAMO QMES reference shell adapter — isolated and reversible. */
(function(){
  "use strict";
  if(window.__QMES_REFERENCE_SHELL_20260902_V1__) return;
  window.__QMES_REFERENCE_SHELL_20260902_V1__=true;

  const STORAGE_KEY="qmes-reference-sidebar-state-v1";
  const V2_THEME_ID="qmes-reference-theme-20260903-v2";
  const V2_THEME_HREF="./css/qmes-reference-theme-20260903-v2.css?v=20260903-1";
  let frame=0;

  function getPreference(){
    try{return localStorage.getItem(STORAGE_KEY)||"open";}catch(_error){return "open";}
  }
  function setPreference(value){
    try{localStorage.setItem(STORAGE_KEY,value);}catch(_error){}
  }
  function desktop(){return window.matchMedia("(min-width:821px)").matches;}

  function ensureV2Theme(){
    let link=document.getElementById(V2_THEME_ID);
    if(link) return link;
    link=document.createElement("link");
    link.id=V2_THEME_ID;
    link.rel="stylesheet";
    link.href=V2_THEME_HREF;
    document.head.appendChild(link);
    return link;
  }

  function ensureBrand(header){
    const row=header.firstElementChild;
    const brand=row?.querySelector(":scope > button:first-child");
    if(!row||!brand) return;
    header.classList.add("qmes-ref-topbar");
    row.classList.add("qmes-ref-toprow");
    brand.classList.add("qmes-ref-brand");

    const original=brand.querySelector(':scope > img[alt="NAMO Chemical"]');
    if(original) original.classList.add("qmes-ref-original-logo");
    let copy=brand.querySelector(".qmes-ref-brand-copy");
    if(!copy){
      copy=document.createElement("span");
      copy.className="qmes-ref-brand-copy";
      copy.innerHTML='<span class="qmes-ref-brand-mark">N</span><span class="qmes-ref-brand-text"><span class="qmes-ref-logo-slot"></span><small>ERP · MES INTEGRATED</small></span>';
      brand.appendChild(copy);
    }
    const slot=copy.querySelector(".qmes-ref-logo-slot");
    if(slot&&!slot.firstElementChild&&original){
      const logo=original.cloneNode(true);
      logo.className="qmes-ref-brand-logo";
      logo.removeAttribute("style");
      slot.appendChild(logo);
    }
  }

  function ensureCompanyMeta(sidebar){
    let meta=sidebar.querySelector(".qmes-ref-company-meta");
    if(meta) return;
    meta=document.createElement("div");
    meta.className="qmes-ref-company-meta";
    meta.innerHTML="<span>㈜나모케미칼</span><b>정상운영</b>";
    const groups=sidebar.querySelector(".qmes-side-groups");
    if(groups) sidebar.insertBefore(meta,groups);
    else sidebar.appendChild(meta);
  }

  function syncShell(){
    const host=document.querySelector("#root > div");
    const header=host?.querySelector(":scope > header");
    const main=host?.querySelector(":scope > main");
    const sidebar=document.getElementById("qmes-sync-sidebar");
    if(!header||!main||!sidebar){
      document.body.classList.remove("qmes-reference-theme","qmes-side-open");
      return false;
    }
    ensureV2Theme();
    document.body.classList.add("qmes-reference-theme");
    ensureBrand(header);
    ensureCompanyMeta(sidebar);
    document.documentElement.style.setProperty("--qmes-side-top","64px");
    document.documentElement.style.setProperty("--qmes-header-hamburger-top","16px");
    if(desktop()&&getPreference()!=="closed") document.body.classList.add("qmes-side-open");
    if(!desktop()) document.body.classList.remove("qmes-side-open");
    return true;
  }

  function scheduleSync(){
    if(frame) return;
    frame=requestAnimationFrame(()=>{frame=0;syncShell();});
  }

  document.addEventListener("click",event=>{
    if(event.target.closest?.("#qmes-sync-sidebar .qmes-side-close")) setPreference("closed");
    if(event.target.closest?.("#qmes-sync-hamburger")) setPreference("open");
  });
  window.addEventListener("resize",scheduleSync,{passive:true});
  window.addEventListener("load",scheduleSync,{once:true});
  new MutationObserver(scheduleSync).observe(document.getElementById("root")||document.documentElement,{childList:true,subtree:true});
  scheduleSync();
})();
