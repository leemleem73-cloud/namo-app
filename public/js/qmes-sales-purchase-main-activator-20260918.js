/* NAMO QMES - production main sales/due late activator
 * 2026-09-18
 * ADD-ONLY. Keeps original Sales modules untouched.
 * Purpose: re-apply the purchase-order-style Sales/Due ledger after late ERP runtime modules finish loading.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_PURCHASE_MAIN_ACTIVATOR_20260918__) return;
  window.__QMES_SALES_PURCHASE_MAIN_ACTIVATOR_20260918__ = true;

  let queued = false;

  function apply(){
    queued = false;
    try{
      const api = window.qmesSalesPurchaseUiMatch20260918;
      if(api && typeof api.ensure === 'function') api.ensure();
    }catch(error){
      console.warn('[QMES sales main activator] apply skipped:', error && error.message ? error.message : error);
    }
  }

  function schedule(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  [
    'qmes:erp-runtime-loaded',
    'qmes:mes-master-ready',
    'qmes:enterprise-ui-ready',
    'qmes:erp-data-changed',
    'qmes:data-updated',
    'qmes:shared-sync-complete',
    'qmes:navigate-tab'
  ].forEach(name => window.addEventListener(name, schedule));

  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);

  function boot(){
    schedule();
    [80,180,350,700,1200,2200,4000,6500].forEach(ms => setTimeout(schedule,ms));
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
