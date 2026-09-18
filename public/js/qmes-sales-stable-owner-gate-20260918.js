/* NAMO QMES - Sales/Due stable owner gate
 * 2026-09-18
 * ADD-ONLY.
 * Disables the competing enterprise Sales renderer and the older observer-based
 * purchase UI patch. A single stable purchase-style owner is loaded next.
 */
(function(){
  'use strict';
  window.__QMES_SALES_ENTERPRISE_MODULE_20260828_V2__ = true;
  window.__QMES_SALES_ENTERPRISE_MODULE_20260828_V1__ = true;
  window.__QMES_SALES_PURCHASE_UI_MATCH_20260918__ = true;

  function cleanup(){
    const root=document.querySelector('.qmes-sales-stable');
    if(root) root.classList.remove('nse-active');
    document.getElementById('qmes-sales-enterprise-module-v2')?.remove();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',cleanup,{once:true});
  else cleanup();
  ['qmes:erp-runtime-loaded','qmes:mes-master-ready','qmes:enterprise-ui-ready'].forEach(name=>window.addEventListener(name,cleanup));
})();
