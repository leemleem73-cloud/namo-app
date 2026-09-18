/* NAMO QMES - Sales/Due recovery unlock
 * 2026-09-18
 * ADD-ONLY RECOVERY.
 * Keeps the old prelock file in place, but re-enables only the stable
 * purchase-style Sales/Due UI owner.
 * Legacy duplicate ledger, repeat activator, and final observer patch stay locked.
 */
(function(){
  'use strict';
  window.__QMES_SALES_DUE_LEDGER_20260918__ = true;
  window.__QMES_SALES_PURCHASE_MAIN_ACTIVATOR_20260918__ = true;
  window.__QMES_SALES_PURCHASE_FINAL_UI_20260918__ = true;
  window.__QMES_SALES_PURCHASE_UI_MATCH_20260918__ = false;
})();
