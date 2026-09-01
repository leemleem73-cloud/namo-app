/* NAMO QMES - IQC report typography/barcode refinement - 2026-09-01 */
(function installIqcReportTypeFix(global){
  "use strict";
  if(global.__QMES_IQC_REPORT_TYPE_FIX_V37__) return;
  global.__QMES_IQC_REPORT_TYPE_FIX_V37__=true;

  const STYLE_ID="qmes-iqc-report-type-fix-v37";
  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
html body #root .qmes-iqc-doc .qmes-iqc2-sec-title,
html body #root .qmes-iqc-doc .qmes-iqc2-table,
html body #root .qmes-iqc-doc .qmes-iqc2-table *,
html body #root .qmes-iqc-doc .qmes-iqc2-remarks,
html body #root .qmes-iqc-doc .qmes-iqc2-remarks *,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table *,
html body #root .qmes-iqc-doc .qmes-iqc2-code-box *{
  font-size:var(--qmes-iqc-ref-font-size,inherit)!important;
  line-height:var(--qmes-iqc-ref-line-height,inherit)!important;
}
/* Outer barcode box remains unchanged. Only inner barcode frame is removed. */
html body #root .qmes-iqc-doc .qmes-iqc2-code-box > *{
  border:0!important;
  outline:0!important;
  border-radius:0!important;
  box-shadow:none!important;
  background:transparent!important;
}
html body #root .qmes-iqc-doc .qmes-iqc2-code-box > * > *{
  border-radius:0!important;
  box-shadow:none!important;
}
/* Approval table: 작성/검토/승인 and all three name cells use the same solid black border. */
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table tr,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td{
  border-color:#000!important;
  border-style:solid!important;
}
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table{border-width:1px!important;border-collapse:collapse!important;}
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td{border-width:1px!important;}
@media print{
  html body #root .qmes-iqc-doc .qmes-iqc2-sec-title,
  html body #root .qmes-iqc-doc .qmes-iqc2-table,
  html body #root .qmes-iqc-doc .qmes-iqc2-table *,
  html body #root .qmes-iqc-doc .qmes-iqc2-remarks,
  html body #root .qmes-iqc-doc .qmes-iqc2-remarks *,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table *,
  html body #root .qmes-iqc-doc .qmes-iqc2-code-box *{
    font-size:var(--qmes-iqc-ref-font-size,inherit)!important;
    line-height:var(--qmes-iqc-ref-line-height,inherit)!important;
  }
  html body #root .qmes-iqc-doc .qmes-iqc2-code-box > *{border:0!important;outline:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;}
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table tr,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td{border-color:#000!important;border-style:solid!important;}
}
`;
    document.head.appendChild(style);
  }

  function restoreOuterBarcodeBox(){
    const qualityStyle=document.querySelector('style[id^="qmes-quality-inspection-ui-style-20260901-v"]');
    if(!qualityStyle || qualityStyle.dataset.iqcOuterRestored==="1") return;
    qualityStyle.textContent=qualityStyle.textContent
      .replace(/html body #root \.qmes-iqc-doc \.qmes-iqc2-code-box\{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;outline:0!important;\}\n?/g,"")
      .replace(/  html body #root \.qmes-iqc-doc \.qmes-iqc2-code-box\{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;outline:0!important;\}\n?/g,"");
    qualityStyle.dataset.iqcOuterRestored="1";
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
