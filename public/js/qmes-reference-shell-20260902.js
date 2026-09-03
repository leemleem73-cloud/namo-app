/* NAMO QMES shell adapter — master design version */
(function(){
  "use strict";
  if(window.__QMES_REFERENCE_SHELL_MASTER_20260903__) return;
  window.__QMES_REFERENCE_SHELL_MASTER_20260903__=true;

  const STORAGE_KEY="qmes-reference-sidebar-state-v1";
  const MOBILE_HOME="/mobile.html?v=20260903-0845";
  let frame=0;

  function safeSessionGet(key){try{return sessionStorage.getItem(key);}catch(_error){return null;}}
  function safeSessionRemove(key){try{sessionStorage.removeItem(key);}catch(_error){}}
  function mobileDevice(){return window.matchMedia("(max-width:820px)").matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||"");}
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
  function desktop(){return window.matchMedia("(min-width:821px)").matches;}

  function markHeader(header){
    const row=header.firstElementChild;
    const brand=row?.querySelector(":scope > button:first-child");
    if(!row||!brand) return;
    header.classList.add("qmes-ref-topbar");
    row.classList.add("qmes-ref-toprow");
    brand.classList.add("qmes-ref-brand");
  }

  function ensureCompanyMeta(sidebar){
    let meta=sidebar.querySelector(".qmes-ref-company-meta");
    if(meta) return;
    meta=document.createElement("div");
    meta.className="qmes-ref-company-meta";
    meta.innerHTML="<span>㈜나모케미칼</span><b>정상운영</b>";
    const groups=sidebar.querySelector(".qmes-side-groups");
    if(groups) sidebar.insertBefore(meta,groups); else sidebar.appendChild(meta);
  }

  function syncShell(){
    const host=document.querySelector("#root > div");
    const header=host?.querySelector(":scope > header");
    const main=host?.querySelector(":scope > main");
    const sidebar=document.getElementById("qmes-sync-sidebar");
    if(!header||!main||!sidebar){document.body.classList.remove("qmes-side-open");return false;}
    markHeader(header);
    ensureCompanyMeta(sidebar);
    document.documentElement.style.setProperty("--qmes-side-top","64px");
    document.documentElement.style.setProperty("--qmes-header-hamburger-top","16px");
    if(desktop()&&getPreference()!=="closed") document.body.classList.add("qmes-side-open");
    if(!desktop()) document.body.classList.remove("qmes-side-open");
    return true;
  }

  function scheduleSync(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;syncShell();});}
  window.addEventListener("resize",scheduleSync,{passive:true});
  window.addEventListener("load",scheduleSync,{once:true});
  new MutationObserver(scheduleSync).observe(document.getElementById("root")||document.documentElement,{childList:true,subtree:true});
  scheduleSync();
})();