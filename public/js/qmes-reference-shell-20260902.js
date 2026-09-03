/* NAMO QMES reference shell adapter — isolated and reversible. */
(function(){
  "use strict";
  if(window.__QMES_REFERENCE_SHELL_20260902_V2__) return;
  window.__QMES_REFERENCE_SHELL_20260902_V2__=true;

  const STORAGE_KEY="qmes-reference-sidebar-state-v1";
  const V2_THEME_ID="qmes-reference-theme-20260903-v2";
  const V2_THEME_HREF="./css/qmes-reference-theme-20260903-v2.css?v=20260903-2";
  const MOBILE_HOME="/mobile.html?v=20260903-ipad-mobile1";
  let frame=0;

  function safeSessionGet(key){try{return sessionStorage.getItem(key);}catch(_error){return null;}}
  function safeSessionRemove(key){try{sessionStorage.removeItem(key);}catch(_error){}}
  function mobileDevice(){
    const ua=navigator.userAgent||"";
    const iPadOS=(navigator.platform==="MacIntel"&&Number(navigator.maxTouchPoints||0)>1);
    const touchTablet=Number(navigator.maxTouchPoints||0)>1&&window.matchMedia("(max-width:1180px)").matches;
    return window.matchMedia("(max-width:820px)").matches || /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || iPadOS || touchTablet;
  }
  function mobileRootRoute(){
    if(!mobileDevice()) return;
    if(location.pathname!=="/"&&location.pathname!=="/index.html") return;
    const params=new URLSearchParams(location.search||"");
    if(params.get("desktop")==="1"||params.get("view")==="desktop") return;
    if(safeSessionGet("qmes_mobile_open_tab_once")==="1"){safeSessionRemove("qmes_mobile_open_tab_once");return;}
    let stopped=false,attempts=0;
    const check=()=>{
      if(stopped||location.pathname!=="/"&&location.pathname!=="/index.html") return;
      attempts+=1;
      fetch("/api/auth/me",{credentials:"same-origin",cache:"no-store"}).then(response=>{
        if(response.ok){stopped=true;location.replace(MOBILE_HOME);return;}
        if(attempts<40) setTimeout(check,1200);
      }).catch(()=>{if(attempts<40)setTimeout(check,1200);});
    };
    check();
  }
  mobileRootRoute();

  function getPreference(){try{return localStorage.getItem(STORAGE_KEY)||"open";}catch(_error){return "open";}}
  function setPreference(value){try{localStorage.setItem(STORAGE_KEY,value);}catch(_error){}}
  function desktop(){return window.matchMedia("(min-width:821px)").matches;}

  function ensureV2Theme(){
    let link=document.getElementById(V2_THEME_ID);
    if(link) return link;
    link=document.createElement("link");link.id=V2_THEME_ID;link.rel="stylesheet";link.href=V2_THEME_HREF;document.head.appendChild(link);return link;
  }

  /* Header ownership is intentionally left to qmes-header-reference-structure. */
  function markHeader(header){
    const row=header.firstElementChild;
    const brand=row?.querySelector(":scope > button:first-child");
    if(!row||!brand) return;
    header.classList.add("qmes-ref-topbar");
    row.classList.add("qmes-ref-toprow");
    brand.classList.add("qmes-ref-brand");
  }

  function lockCompanyMetaSize(meta){
    if(!meta) return;
    const set=(name,value)=>meta.style.setProperty(name,value,"important");
    set("margin","14px 16px 16px");set("padding","13px 14px");set("min-height","42px");set("box-sizing","border-box");set("display","flex");set("align-items","center");set("justify-content","space-between");set("gap","8px");set("border","1px solid #c7d9e6");set("border-radius","10px");set("background","#fff");set("box-shadow","none");set("color","#36556d");set("font-size","12px");set("font-weight","700");set("transition","none");
    const badge=meta.querySelector("b");
    if(badge){const setBadge=(name,value)=>badge.style.setProperty(name,value,"important");setBadge("padding","4px 8px");setBadge("border","1px solid #cbe4c5");setBadge("border-radius","14px");setBadge("background","#f1faee");setBadge("color","#4f9847");setBadge("font-size","10px");setBadge("white-space","nowrap");setBadge("transition","none");}
  }

  function ensureCompanyMeta(sidebar){
    let meta=sidebar.querySelector(".qmes-ref-company-meta");
    if(meta){lockCompanyMetaSize(meta);return;}
    meta=document.createElement("div");meta.className="qmes-ref-company-meta";meta.innerHTML="<span>㈜나모케미칼</span><b>정상운영</b>";lockCompanyMetaSize(meta);
    const groups=sidebar.querySelector(".qmes-side-groups");if(groups) sidebar.insertBefore(meta,groups); else sidebar.appendChild(meta);
  }

  function syncShell(){
    const host=document.querySelector("#root > div");const header=host?.querySelector(":scope > header");const main=host?.querySelector(":scope > main");const sidebar=document.getElementById("qmes-sync-sidebar");
    if(!header||!main||!sidebar){document.body.classList.remove("qmes-reference-theme","qmes-side-open");return false;}
    ensureV2Theme();document.body.classList.add("qmes-reference-theme");markHeader(header);ensureCompanyMeta(sidebar);document.documentElement.style.setProperty("--qmes-side-top","64px");document.documentElement.style.setProperty("--qmes-header-hamburger-top","16px");
    if(desktop()&&getPreference()!=="closed") document.body.classList.add("qmes-side-open");if(!desktop()) document.body.classList.remove("qmes-side-open");return true;
  }

  function scheduleSync(){if(frame) return;frame=requestAnimationFrame(()=>{frame=0;syncShell();});}
  document.addEventListener("click",event=>{if(event.target.closest?.("#qmes-sync-sidebar .qmes-side-close")) setPreference("closed");if(event.target.closest?.("#qmes-sync-hamburger")) setPreference("open");});
  window.addEventListener("resize",scheduleSync,{passive:true});window.addEventListener("load",scheduleSync,{once:true});new MutationObserver(scheduleSync).observe(document.getElementById("root")||document.documentElement,{childList:true,subtree:true});scheduleSync();
})();