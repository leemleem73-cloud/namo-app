/* NAMO QMES - Sales/Due runtime restore guard
 * 2026-09-18
 * ADD-ONLY. Keeps the confirmed Sales/Due ledger when legacy ERP runtime announces ready.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_RUNTIME_RESTORE_GUARD_20260918__) return;
  const stable=window.QMESErpSalesTab;
  if(typeof stable!=="function") return;

  window.__QMES_SALES_RUNTIME_RESTORE_GUARD_20260918__=true;
  window.__QMES_SALES_STABLE_COMPONENT_20260918__=stable;

  const restore=function(){
    if(window.QMESErpSalesTab!==stable){
      window.__QMES_SALES_LATE_COMPONENT_IGNORED_20260918__=window.QMESErpSalesTab;
      window.QMESErpSalesTab=stable;
    }
  };

  window.addEventListener("qmes:erp-integrated-ready",restore);
  window.addEventListener("qmes:erp-runtime-loaded",restore);
})();