/* NAMO QMES - purchase bootstrap compatibility loader
 * 2026-09-17
 * The older modal enhancer was already disabled by qmes-purchase-order-register.
 * Reuse this existing loaded path only to bootstrap the purchase registration repair.
 */
(function(){
  'use strict';
  const id='qmes-purchase-registration-repair-20260917-loader';
  if(document.getElementById(id) || window.__QMES_PURCHASE_REGISTRATION_REPAIR_20260917__) return;
  const script=document.createElement('script');
  script.id=id;
  script.src='/js/qmes-purchase-registration-repair-20260917.js?v=20260917-registerfix2';
  script.async=false;
  document.head.appendChild(script);
})();
