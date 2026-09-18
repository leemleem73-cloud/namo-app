/* NAMO QMES - Sales/Due final single-owner prelock
 * 2026-09-18
 * ADD-ONLY. Prevents legacy/experimental Sales UI observers from starting.
 */
(function(){
  'use strict';

  /* Disable older experimental Sales/Due renderers. */
  window.__QMES_SALES_PURCHASE_STABLE_OWNER_20260918__ = true;
  window.__QMES_SALES_CONTENT_SEED_20260918_V2__ = true;
  window.__QMES_SALES_HISTORY_SEED_20260918_V1__ = true;

  /* Disable old KPI MutationObserver/overlay owners; the final ledger has no KPI cards. */
  window.__QMES_SALES_KPI_VISUAL_LOCK_20260828_V1__ = true;
  window.__QMES_SALES_COMPLIANCE_VISUAL_OWNER_20260828_V2__ = true;
  window.__QMES_SALES_KPI_FONT_MATCH_20260828_V1__ = true;
  window.__QMES_SALES_COMPLIANCE_OVERLAY_20260828_V2__ = true;
  window.__QMES_SALES_COMPLIANCE_MODAL_GUARD_20260828_V3__ = true;

  /* Keep already-disabled legacy visual owners disabled. */
  window.__QMES_SALES_DUE_LEDGER_20260918__ = true;
  window.__QMES_SALES_PURCHASE_UI_MATCH_20260918__ = true;
  window.__QMES_SALES_PURCHASE_MAIN_ACTIVATOR_20260918__ = true;
  window.__QMES_SALES_PURCHASE_FINAL_UI_20260918__ = true;

  /* Prevent a white-table flash before the final owner mounts. */
  const STYLE_ID='qmes-sales-final-prelock-style-20260918';
  if(!document.getElementById(STYLE_ID)){
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=
      '.qmes-sales-stable>.qerp-kpis,.qmes-sales-stable>.qerp-card{display:none!important}' +
      '.qmes-sales-stable #qmes-sales-enterprise-module-v2{display:none!important}';
    document.head.appendChild(style);
  }
})();
