/* NAMO QMES - quality inspection UI stability - 2026-09-01
 * Quality inspection only.
 * - Year/month filters use the original native select behavior again.
 * - No custom floating list, resize/scroll close handler, or select interception.
 * - Inspection/viewer headers remain visible while their body scrolls.
 */
(function installQmesQualityInspectionUi(global){
  "use strict";
  if(global.__QMES_QUALITY_INSPECTION_UI_20260901__) return;
  global.__QMES_QUALITY_INSPECTION_UI_20260901__=true;

  const STYLE_ID="qmes-quality-inspection-ui-style-20260901";

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      /* Keep inspection modal/viewer chrome visible. Only the body scrolls. */
      .qmes-inspection-modal-head,.qmes-iqc-modal-head{flex:0 0 auto;}
      .qmes-inspection-modal-body,.qmes-iqc-modal-body{min-height:0;flex:1 1 auto;}
      .qmes-wo-viewer-head{position:sticky;top:0;z-index:5;flex:0 0 auto;background:#0b1728;}
    `;
    document.head.appendChild(style);
  }

  ensureStyle();
})(window);
