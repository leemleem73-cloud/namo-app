/* QMES legacy sales DOM patch — retired 2026-08-27.
 * No DOM column mutation. This direct-loaded compatibility file only guarantees
 * that the stable Sales edit controller and styles are available even when an
 * older master-loader file is still cached in the browser.
 */
(function retireLegacySalesCompactUi(){
  "use strict";
  window.__QMES_SALES_COMPACT_UI_20260826__=true;

  function ensureCss(){
    const id="qmes-sales-table-stable-direct-20260827";
    if(document.getElementById(id))return;
    const link=document.createElement("link");
    link.id=id;
    link.rel="stylesheet";
    link.href="./css/qmes-sales-table-stable-20260827.css?v=20260827-direct4";
    document.head.appendChild(link);
  }

  function ensureEditController(){
    if(window.qmesSalesFullEdit20260827)return Promise.resolve(window.qmesSalesFullEdit20260827);
    const existing=document.getElementById("qmes-sales-full-edit-direct-loader-20260827");
    if(existing){
      return new Promise(resolve=>{
        if(window.qmesSalesFullEdit20260827){resolve(window.qmesSalesFullEdit20260827);return;}
        existing.addEventListener("load",()=>resolve(window.qmesSalesFullEdit20260827||null),{once:true});
        existing.addEventListener("error",()=>resolve(null),{once:true});
      });
    }
    return new Promise(resolve=>{
      const script=document.createElement("script");
      script.id="qmes-sales-full-edit-direct-loader-20260827";
      script.src="./js/qmes-sales-full-edit-20260827.js?v=20260827-direct4";
      script.async=false;
      script.onload=()=>resolve(window.qmesSalesFullEdit20260827||null);
      script.onerror=()=>resolve(null);
      document.head.appendChild(script);
    });
  }

  function editButton(target){
    return target instanceof Element?target.closest(".qmes-sales-edit-btn"):null;
  }

  function openFromButton(button){
    if(!button)return;
    ensureEditController().then(api=>{
      if(!api)return;
      if(typeof api.openFromButton==="function"){api.openFromButton(button);return;}
      const tr=button.closest("tr");
      const id=String(button.dataset.salesId||button.dataset.qmesSalesEdit||tr?.querySelector("[data-qso-id]")?.getAttribute("data-qso-id")||tr?.children?.[0]?.textContent||"").replace(/\s+/g," ").trim();
      if(id&&typeof api.open==="function")api.open(id,null,tr);
    });
  }

  ensureCss();
  ensureEditController();

  document.addEventListener("click",event=>{
    const button=editButton(event.target);
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openFromButton(button);
  },true);
})();
