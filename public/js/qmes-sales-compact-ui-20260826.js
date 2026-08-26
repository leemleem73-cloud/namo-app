/* QMES legacy sales DOM patch — retired 2026-08-27.
 * The Sales page now renders its final columns and form directly in React.
 * This compatibility stub intentionally performs no DOM mutation, no observer,
 * no delayed column insertion, and no duplicate sync work.
 */
(function retireLegacySalesCompactUi(){
  "use strict";
  window.__QMES_SALES_COMPACT_UI_20260826__=true;
})();
