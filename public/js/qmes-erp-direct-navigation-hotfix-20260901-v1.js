/* QMES ERP direct navigation owner — 2026-09-01
 * Prevent competing legacy/document click handlers from leaving the ERP shell
 * and its React route out of sync.
 */
(function(){
  "use strict";
  if(window.__QMES_ERP_DIRECT_NAVIGATION_V1__) return;
  window.__QMES_ERP_DIRECT_NAVIGATION_V1__=true;

  const TAB_BY_LABEL={
    "수주·납기":"erpSales",
    "수주납기":"erpSales",
    "수주·납기관리":"erpSales",
    "생산계획·MRP":"erpPlan",
    "생산계획MRP":"erpPlan",
    "생산계획·MRP관리":"erpPlan",
    "구매·발주":"erpPurchase",
    "구매발주":"erpPurchase",
    "구매·발주관리":"erpPurchase",
    "RECIPE/BOM":"erpMaster",
    "출하·납품":"erpShipping",
    "출하납품":"erpShipping",
    "출하·납품관리":"erpShipping",
    "출하·물류":"erpShipping",
    "출하물류":"erpShipping"
  };

  const clean=value=>String(value||"")
    .replace(/[›〉▣]/g,"")
    .replace(/\s+/g,"")
    .trim()
    .toUpperCase();

  function restoreReactScreen(){
    try{sessionStorage.removeItem("qmes_business_extension_tab");}catch(_error){}
    document.getElementById("qmes-business-extension-host")?.remove();
    const main=document.querySelector("#root main")||document.querySelector("main");
    main?.querySelectorAll('[data-qbe-hidden="1"]').forEach(element=>{
      element.style.removeProperty("display");
      delete element.dataset.qbeHidden;
    });
  }

  function closeHoverMenu(){
    document.getElementById("qmes-all-menu-dropdown")?.classList.remove("is-open");
  }

  function tabFromTarget(target){
    const side=target.closest?.("[data-qmes-erp-side-tab]");
    if(side) return String(side.dataset.qmesErpSideTab||"");

    const top=target.closest?.(".qmes-top-menu-button");
    if(top){
      const label=top.querySelector(":scope > span")?.textContent||top.textContent;
      return TAB_BY_LABEL[clean(label)]||"";
    }

    const hoverItem=target.closest?.("#qmes-all-menu-dropdown button");
    return hoverItem?TAB_BY_LABEL[clean(hoverItem.textContent)]||"":"";
  }

  function navigate(tab){
    if(!tab) return;
    restoreReactScreen();
    closeHoverMenu();
    try{sessionStorage.setItem("qmes_current_tab",tab);}catch(_error){}
    window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab,source:"erp-direct-navigation-v1"}}));
  }

  /* Window capture runs before document-level legacy handlers and React's click delegation. */
  window.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof Element)) return;
    const tab=tabFromTarget(target);
    if(!tab) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    navigate(tab);
  },true);

  window.qmesNavigateErpTab=navigate;
})();
