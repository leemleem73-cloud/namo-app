/* NAMO QMES - IQC report typography/barcode refinement - 2026-09-01 */
(function installIqcReportTypeFix(global){
  "use strict";
  if(global.__QMES_IQC_REPORT_TYPE_FIX_V41__) return;
  global.__QMES_IQC_REPORT_TYPE_FIX_V41__=true;
  const STYLE_ID="qmes-iqc-report-type-fix-v41";
  function installStyle(){if(document.getElementById(STYLE_ID))return;const style=document.createElement("style");style.id=STYLE_ID;style.textContent=`
/* Keep section titles (기본정보~특이사항) and column headers untouched. Unify every actual value area. */
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table tbody td,
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table tbody td *,
html body #root .qmes-iqc-doc .qmes-iqc2-sec .qmes-iqc2-remarks,
html body #root .qmes-iqc-doc .qmes-iqc2-sec .qmes-iqc2-remarks *,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table tbody td,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table tbody td *{
  font-size:11px!important;
  line-height:1.3!important;
  font-family:inherit!important;
}
/* Neutralize utility classes that made some values look larger/different. */
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table tbody td.font-mono,
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table tbody td.font-semibold,
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table tbody td.qmes-iqc2-pass,
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table tbody td.qmes-iqc2-fail{
  font-size:11px!important;
  line-height:1.3!important;
  font-family:inherit!important;
}
html body #root .qmes-iqc-doc .qmes-iqc2-code-box > *{border:0!important;outline:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;}
html body #root .qmes-iqc-doc .qmes-iqc2-code-box > * > *{border-radius:0!important;box-shadow:none!important;}
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table,html body #root .qmes-iqc-doc .qmes-iqc2-sign-table tr,html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th,html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td{border-color:#000!important;border-style:solid!important;}
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table{border-width:1px!important;border-collapse:collapse!important;}html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th,html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td{border-width:1px!important;}
@media print{
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table tbody td,
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table tbody td *,
html body #root .qmes-iqc-doc .qmes-iqc2-sec .qmes-iqc2-remarks,
html body #root .qmes-iqc-doc .qmes-iqc2-sec .qmes-iqc2-remarks *,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table tbody td,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table tbody td *{font-size:11px!important;line-height:1.3!important;font-family:inherit!important;}
html body #root .qmes-iqc-doc .qmes-iqc2-code-box > *{border:0!important;outline:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;}
}
`;document.head.appendChild(style);}
  function restoreOuterBarcodeBox(){const qualityStyle=document.querySelector('style[id^="qmes-quality-inspection-ui-style-20260901-v"]');if(!qualityStyle||qualityStyle.dataset.iqcOuterRestored==="1")return;qualityStyle.textContent=qualityStyle.textContent.replace(/html body #root \.qmes-iqc-doc \.qmes-iqc2-code-box\{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;outline:0!important;\}\n?/g,"").replace(/  html body #root \.qmes-iqc-doc \.qmes-iqc2-code-box\{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;outline:0!important;\}\n?/g,"");qualityStyle.dataset.iqcOuterRestored="1";}
  function apply(){restoreOuterBarcodeBox();installStyle();}
  apply();const root=document.getElementById("root")||document.body;new MutationObserver(apply).observe(root,{childList:true,subtree:true});
})(window);
