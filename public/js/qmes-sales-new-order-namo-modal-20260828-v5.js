/* NAMO QMES - Sales new-order V5 compatibility bridge - 2026-08-31
 * The original V5 implementation is preserved in Git history.
 * Purpose: even when an older MES master loader still requests the V5 filename,
 * load the current V6 sales-order modal (order type / sample / development fields).
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_NEW_ORDER_V5_TO_V6_BRIDGE_20260831__)return;
  window.__QMES_SALES_NEW_ORDER_V5_TO_V6_BRIDGE_20260831__=true;

  const TARGET="./js/qmes-sales-new-order-namo-modal-20260831-v6.js?v=20260831-force3";

  function bindAliases(){
    const api=window.qmesSalesNewOrderNamoV6;
    if(!api||typeof api.open!=="function")return false;
    window.qmesSalesNewOrderNamoV5=api;
    window.qmesSalesNewOrderNamoV4=api;
    window.qmesSalesNewOrderNamoV3=api;
    window.qmesSalesNewOrderNamo=api;
    window.qmesSalesNewOrderEnterprise=api;
    return true;
  }

  if(bindAliases())return;

  const existing=Array.from(document.scripts).find(script=>{
    const src=String(script.getAttribute("src")||"").split("?")[0];
    return /qmes-sales-new-order-namo-modal-20260831-v6\.js$/.test(src);
  });

  if(existing){
    existing.addEventListener("load",()=>bindAliases(),{once:true});
    [40,120,300,700].forEach(ms=>setTimeout(bindAliases,ms));
    return;
  }

  const script=document.createElement("script");
  script.src=TARGET;
  script.async=false;
  script.dataset.qmesSalesV5Bridge="v6";
  script.onload=()=>{
    if(!bindAliases())console.warn("[QMES Sales V5 bridge] V6 loaded but API is not ready");
  };
  script.onerror=()=>console.error("[QMES Sales V5 bridge] failed to load V6 modal",TARGET);
  document.head.appendChild(script);
})();
