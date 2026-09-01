/* NAMO QMES - IQC report typography/barcode refinement - 2026-09-01 */
(function installIqcReportTypeFix(global){
  "use strict";
  if(global.__QMES_IQC_REPORT_TYPE_FIX_V43__) return;
  global.__QMES_IQC_REPORT_TYPE_FIX_V43__=true;
  const STYLE_ID="qmes-iqc-report-type-fix-v43";
  function installStyle(){if(document.getElementById(STYLE_ID))return;const style=document.createElement("style");style.id=STYLE_ID;style.textContent=`
/* Section labels stay distinct; every table heading/value uses one exact type size. */
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th,
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th *,
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td,
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td *,
html body #root .qmes-iqc-doc .qmes-iqc2-sec .qmes-iqc2-remarks,
html body #root .qmes-iqc-doc .qmes-iqc2-sec .qmes-iqc2-remarks *,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th *,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td *{
  font-size:11px!important;
  line-height:1.3!important;
  font-family:inherit!important;
}
html body #root .qmes-iqc-doc .font-mono,
html body #root .qmes-iqc-doc .font-semibold,
html body #root .qmes-iqc-doc .qmes-iqc2-pass,
html body #root .qmes-iqc-doc .qmes-iqc2-fail{
  font-size:11px!important;
  line-height:1.3!important;
  font-family:inherit!important;
}
/* Keep the barcode outer cell/box; remove only the inner barcode panel frame. */
html body #root .qmes-iqc-doc .qmes-iqc2-code-box > *{
  border:0!important;
  outline:0!important;
  border-radius:0!important;
  box-shadow:none!important;
  background:transparent!important;
}
html body #root .qmes-iqc-doc .qmes-iqc2-code-box > * > *{border-radius:0!important;box-shadow:none!important;}
/* 작성/검토/승인: title row and the three name cells all use solid black 1px borders. */
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table tbody,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table tr,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td{
  border-color:#000!important;
  border-style:solid!important;
  border-width:1px!important;
}
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table{border-collapse:collapse!important;}
@media print{
  /* The preview viewer used fixed viewport height + overflow:hidden, which clipped the barcode/sign row in print. */
  html body #root .qmes-modal-backdrop,
  html body #root .qmes-modal-backdrop > .qmes-wo-viewer,
  html body #root .qmes-output-scroll-body{
    position:static!important;
    inset:auto!important;
    width:auto!important;
    max-width:none!important;
    height:auto!important;
    max-height:none!important;
    min-height:0!important;
    margin:0!important;
    padding:0!important;
    overflow:visible!important;
    display:block!important;
    background:#fff!important;
  }
  html body #root .qmes-iqc-doc{
    position:static!important;
    display:block!important;
    width:190mm!important;
    max-width:190mm!important;
    min-width:190mm!important;
    height:auto!important;
    min-height:0!important;
    overflow:visible!important;
    break-after:auto!important;
  }
  html body #root .qmes-iqc-doc .qmes-iqc2-auth-row{
    display:flex!important;
    visibility:visible!important;
    opacity:1!important;
    width:100%!important;
    overflow:visible!important;
    break-inside:avoid!important;
    page-break-inside:avoid!important;
  }
  html body #root .qmes-iqc-doc .qmes-iqc2-code-box,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table{
    visibility:visible!important;
    opacity:1!important;
    break-inside:avoid!important;
    page-break-inside:avoid!important;
  }
  html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th,
  html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th *,
  html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td,
  html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td *,
  html body #root .qmes-iqc-doc .qmes-iqc2-sec .qmes-iqc2-remarks,
  html body #root .qmes-iqc-doc .qmes-iqc2-sec .qmes-iqc2-remarks *,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th *,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td *{font-size:11px!important;line-height:1.3!important;font-family:inherit!important;}
  html body #root .qmes-iqc-doc .qmes-iqc2-code-box > *{border:0!important;outline:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;}
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table tbody,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table tr,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th,
  html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td{border:1px solid #000!important;}
}
`;document.head.appendChild(style);}
  function restoreOuterBarcodeBox(){const qualityStyle=document.querySelector('style[id^="qmes-quality-inspection-ui-style-20260901-v"]');if(!qualityStyle||qualityStyle.dataset.iqcOuterRestored==="1")return;qualityStyle.textContent=qualityStyle.textContent.replace(/html body #root \.qmes-iqc-doc \.qmes-iqc2-code-box\{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;outline:0!important;\}\n?/g,"").replace(/  html body #root \.qmes-iqc-doc \.qmes-iqc2-code-box\{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;outline:0!important;\}\n?/g,"");qualityStyle.dataset.iqcOuterRestored="1";}
  function apply(){restoreOuterBarcodeBox();installStyle();}
  apply();const root=document.getElementById("root")||document.body;new MutationObserver(apply).observe(root,{childList:true,subtree:true});
})(window);
