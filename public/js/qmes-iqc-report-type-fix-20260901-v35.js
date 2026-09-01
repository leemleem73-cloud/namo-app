/* NAMO QMES - IQC report typography/barcode refinement - 2026-09-01 */
(function installIqcReportTypeFix(global){
  "use strict";
  if(global.__QMES_IQC_REPORT_TYPE_FIX_V35__) return;
  global.__QMES_IQC_REPORT_TYPE_FIX_V35__=true;

  const STYLE_ID="qmes-iqc-report-type-fix-v35";
  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
html body #root .qmes-iqc-doc .qmes-iqc2-sec-title,
html body #root .qmes-iqc-doc .qmes-iqc2-table th,
html body #root .qmes-iqc-doc .qmes-iqc2-table td,
html body #root .qmes-iqc-doc .qmes-iqc2-remarks,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td,
html body #root .qmes-iqc-doc .qmes-iqc2-code-box *{
  font-size:var(--qmes-iqc-ref-font-size,inherit)!important;
  line-height:var(--qmes-iqc-ref-line-height,inherit)!important;
}
/* Keep the original outer barcode box size/border. Remove only the rounded inner barcode panel. */
html body #root .qmes-iqc-doc .qmes-iqc2-code-box > *,
html body #root .qmes-iqc-doc .qmes-iqc2-code-box [class*="rounded"]{
  border-radius:0!important;
  box-shadow:none!important;
}
@media print{
  html body #root .qmes-iqc-doc .qmes-iqc2-sec-title,
  html body #root .qmes-iqc-doc .qmes-iqc2-table th,
  html body #root .qmes-iqc-doc .qmes-iqc2-table td,
  html body #root .qmes-iqc-doc .qmes-iqc2-remarks,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td,
  html body #root .qmes-iqc-doc .qmes-iqc2-code-box *{
    font-size:var(--qmes-iqc-ref-font-size,inherit)!important;
    line-height:var(--qmes-iqc-ref-line-height,inherit)!important;
  }
}
`;
    document.head.appendChild(style);
  }

  function restoreOuterBarcodeBox(){
    const v34=document.getElementById("qmes-quality-inspection-ui-style-20260901-v34");
    if(!v34 || v34.dataset.iqcOuterRestored==="1") return;
    v34.textContent=v34.textContent
      .replace(/html body #root \.qmes-iqc-doc \.qmes-iqc2-code-box\{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;outline:0!important;\}\n?/g,"")
      .replace(/  html body #root \.qmes-iqc-doc \.qmes-iqc2-code-box\{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;outline:0!important;\}\n?/g,"");
    v34.dataset.iqcOuterRestored="1";
  }

  function syncReferenceType(doc){
    if(!doc) return;
    const ref=Array.from(doc.querySelectorAll(".qmes-iqc2-table th")).find(el=>String(el.textContent||"").trim()==="입고번호") || doc.querySelector(".qmes-iqc2-table th");
    if(!ref) return;
    const cs=global.getComputedStyle(ref);
    doc.style.setProperty("--qmes-iqc-ref-font-size",cs.fontSize);
    doc.style.setProperty("--qmes-iqc-ref-line-height",cs.lineHeight);
  }

  function apply(){
    restoreOuterBarcodeBox();
    installStyle();
    document.querySelectorAll(".qmes-iqc-doc").forEach(syncReferenceType);
  }
  apply();
  const root=document.getElementById("root")||document.body;
  new MutationObserver(apply).observe(root,{childList:true,subtree:true});
})(window);
