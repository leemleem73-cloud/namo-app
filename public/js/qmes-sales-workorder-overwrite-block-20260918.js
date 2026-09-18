/* NAMO QMES - Prevent destructive Sales rows overwrite from Work Order derivation
 * 2026-09-18
 * ADD-ONLY.
 *
 * The legacy qmes-sales-demo-reset module rewrites qmes-erp-sales-v1 from Work Orders.
 * When the Work Order DB is temporarily empty/not ready, it writes [] and makes the
 * Sales/Due ledger appear and then disappear. The current Sales/Due ledger is now
 * Sales-owned, so the legacy writer must not own this storage key.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_WORKORDER_OVERWRITE_BLOCK_20260918__) return;
  window.__QMES_SALES_WORKORDER_OVERWRITE_BLOCK_20260918__=true;

  if(!window.__QMES_SALES_FROM_WORKORDER_READY__){
    window.__QMES_SALES_FROM_WORKORDER_READY__=Promise.resolve({
      rows:null,
      status:'disabled-sales-owned-ledger'
    });
  }
})();