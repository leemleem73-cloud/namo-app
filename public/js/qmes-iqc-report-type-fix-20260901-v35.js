/* NAMO QMES - quality report refinements - 2026-09-01 */
(function installQualityReportFix(global){
  "use strict";
  if(global.__QMES_QUALITY_REPORT_FIX_V47__) return;
  global.__QMES_QUALITY_REPORT_FIX_V47__=true;
  const STYLE_ID="qmes-quality-report-fix-v47";
  function installStyle(){if(document.getElementById(STYLE_ID))return;const style=document.createElement("style");style.id=STYLE_ID;style.textContent=`
/* IQC table typography */
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th,html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th *,html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td,html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td *,html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th,html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td{font-size:11px!important;line-height:1.3!important;font-family:inherit!important;}
html body #root .qmes-iqc-doc .font-mono,html body #root .qmes-iqc-doc .font-semibold,html body #root .qmes-iqc-doc .qmes-iqc2-pass,html body #root .qmes-iqc-doc .qmes-iqc2-fail{font-size:11px!important;line-height:1.3!important;font-family:inherit!important;}
html body #root .qmes-iqc-doc .qmes-iqc2-code-box > *{border:0!important;outline:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;}
/* IQC/OQC approval tables: same thin black grid for header and name row. */
html body #root table.qmes-iqc2-sign-table,html body #root table.qmes-oqc-sign-table,html body #root .qmes-oqc-doc table[class*="sign"]{border-collapse:collapse!important;border-spacing:0!important;border:0!important;}
html body #root table.qmes-iqc2-sign-table th,html body #root table.qmes-iqc2-sign-table td,html body #root table.qmes-oqc-sign-table th,html body #root table.qmes-oqc-sign-table td,html body #root .qmes-oqc-doc table[class*="sign"] th,html body #root .qmes-oqc-doc table[class*="sign"] td{border:0!important;border-right:1px solid #000!important;border-bottom:1px solid #000!important;outline:0!important;box-shadow:none!important;}
html body #root table.qmes-iqc2-sign-table tr:first-child th,html body #root table.qmes-oqc-sign-table tr:first-child th,html body #root .qmes-oqc-doc table[class*="sign"] tr:first-child th{border-top:1px solid #000!important;}
html body #root table.qmes-iqc2-sign-table tr > :first-child,html body #root table.qmes-oqc-sign-table tr > :first-child,html body #root .qmes-oqc-doc table[class*="sign"] tr > :first-child{border-left:1px solid #000!important;}
/* OQC shipment number: keep IDs such as OQC-260421-0001-1 on one horizontal line. */
html body #root .qmes-oqc-doc td,html body #root .qmes-oqc-doc td *,html body #root .qmes-oqc-doc .font-mono{overflow-wrap:normal!important;word-break:keep-all!important;}
html body #root .qmes-oqc-doc .font-mono{white-space:nowrap!important;font-size:11px!important;letter-spacing:0!important;}
@media print{html body #root .qmes-oqc-doc .font-mono{white-space:nowrap!important;font-size:11px!important;}html body #root table.qmes-iqc2-sign-table th,html body #root table.qmes-iqc2-sign-table td,html body #root table.qmes-oqc-sign-table th,html body #root table.qmes-oqc-sign-table td,html body #root .qmes-oqc-doc table[class*="sign"] th,html body #root .qmes-oqc-doc table[class*="sign"] td{border:0!important;border-right:1px solid #000!important;border-bottom:1px solid #000!important;outline:0!important;box-shadow:none!important;}html body #root table.qmes-iqc2-sign-table tr:first-child th,html body #root table.qmes-oqc-sign-table tr:first-child th,html body #root .qmes-oqc-doc table[class*="sign"] tr:first-child th{border-top:1px solid #000!important;}html body #root table.qmes-iqc2-sign-table tr > :first-child,html body #root table.qmes-oqc-sign-table tr > :first-child,html body #root .qmes-oqc-doc table[class*="sign"] tr > :first-child{border-left:1px solid #000!important;}}
`;document.head.appendChild(style);}
  installStyle();
})(window);
