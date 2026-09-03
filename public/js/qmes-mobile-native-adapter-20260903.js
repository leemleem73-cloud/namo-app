/* NAMO QMES mobile native adapter — isolates native work-order controller. */
(() => {
  'use strict';

  if (window.__QMES_MOBILE_NATIVE_ADAPTER_V3__) return;
  window.__QMES_MOBILE_NATIVE_ADAPTER_V3__ = true;

  const params = new URLSearchParams(location.search);
  const tab = String(params.get('tab') || '');

  /*
   * IMPORTANT — woIssue must have exactly one controller.
   *
   * mobile-work.html already has a generic inline controller and the server loads
   * several mobile-only overlays. Previously woIssue was handled at the same time
   * by:
   *   - qmes-mobile-production-20260903.js
   *   - qmes-mobile-operation-write-20260903.js
   *   - qmes-mobile-direct-entry-20260903.js
   *   - qmes-mobile-workorder-pc-parity-20260903.js
   *   - an additional PC-screen presentation loader
   *
   * Those scripts were competing for the same .content / editor DOM and could
   * replace each other's markup while the page was opening. On some mobile
   * browsers that left the work-order screen blank or apparently unopened.
   *
   * For woIssue we now disable the older overlapping controllers BEFORE they are
   * loaded. qmes-mobile-workorder-pc-parity-20260903.js remains the single native
   * work-order controller. It keeps PC field/data parity while staying independent
   * from the desktop React UI and PC routing.
   */
  if (tab === 'woIssue') {
    window.__QMES_MOBILE_PRODUCTION_20260903__ = true;
    window.__QMES_MOBILE_OPERATION_WRITE_20260903__ = true;
    window.__QMES_MOBILE_DIRECT_ENTRY_20260903__ = true;

    document.documentElement.dataset.qmesWorkorderController = 'pc-parity-native';
  }
})();
