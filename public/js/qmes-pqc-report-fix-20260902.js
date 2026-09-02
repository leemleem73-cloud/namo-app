/* NAMO QMES - PQC certificate final visual alignment - 2026-09-02
   PQC only. IQC/OQC are intentionally untouched. */
(function installPqcReportFix(global){
  "use strict";
  if(global.__QMES_PQC_REPORT_FIX_20260902_V4__) return;
  global.__QMES_PQC_REPORT_FIX_20260902_V4__=true;

  const STYLE_ID="qmes-pqc-report-fix-20260902-v4";
  const DOC_SELECTOR=".qmes-pqc-doc";
  function important(el,prop,value){if(el)el.style.setProperty(prop,value,"important");}
  function installStyle(){if(document.getElementById(STYLE_ID))return;const style=document.createElement("style");style.id=STYLE_ID;style.textContent=`
html body #root .qmes-pqc-doc .qmes-iqc-header-logo{object-fit:contain!important;filter:none!important;opacity:1!important;transform:scale(.98)!important;transform-origin:left center!important;max-width:98%!important;height:auto!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-sec-title{border-bottom:1.5px solid #243b5a!important;border-color:#243b5a!important;text-align:center!important;padding-left:0!important;border-left:0!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-sec-title,html body #root .qmes-pqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th,html body #root .qmes-pqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td,html body #root .qmes-pqc-doc .qmes-iqc2-remarks{font-size:12px!important;line-height:1.25!important;font-family:inherit!important;}
html body #root .qmes-pqc-doc table.qmes-iqc2-table{border-collapse:collapse!important;border-spacing:0!important;}
html body #root .qmes-pqc-doc table.qmes-iqc2-table tr,html body #root .qmes-pqc-doc table.qmes-iqc2-table th,html body #root .qmes-pqc-doc table.qmes-iqc2-table td{height:35px!important;min-height:35px!important;}
html body #root .qmes-pqc-doc table.qmes-iqc2-table th,html body #root .qmes-pqc-doc table.qmes-iqc2-table td{padding-top:3px!important;padding-bottom:3px!important;vertical-align:middle!important;text-align:center!important;border:1px solid #94a3b8!important;box-sizing:border-box!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-remarks{min-height:35px!important;padding-top:3px!important;padding-bottom:3px!important;border-color:#94a3b8!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-first table.qmes-iqc2-table tbody td:first-child{white-space:nowrap!important;word-break:keep-all!important;overflow-wrap:normal!important;font-size:11.5px!important;letter-spacing:-.15px!important;padding-left:2px!important;padding-right:2px!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-auth-row.qmes-pqo-sign-only{display:flex!important;justify-content:flex-end!important;align-items:stretch!important;width:100%!important;box-sizing:border-box!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table{border-collapse:collapse!important;table-layout:fixed!important;flex:0 1 42%!important;width:42%!important;max-width:42%!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table th,html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table td{padding-top:1px!important;padding-bottom:1px!important;vertical-align:middle!important;text-align:center!important;border:1px solid #94a3b8!important;box-sizing:border-box!important;font-size:12px!important;line-height:1.25!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:first-child,html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:first-child th{height:22px!important;min-height:22px!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:nth-child(2),html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:nth-child(2) td{height:50px!important;min-height:50px!important;}
@media print{html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:nth-child(2),html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:nth-child(2) td{height:50px!important;min-height:50px!important;}}
`;document.head.appendChild(style);}
  function fix(doc){
    const logo=doc.querySelector(".qmes-iqc-header-logo");if(logo){important(logo,"transform","scale(.98)");important(logo,"max-width","98%");}
    doc.querySelectorAll("table.qmes-iqc2-table").forEach(t=>{important(t,"border-collapse","collapse");t.querySelectorAll("tr").forEach(r=>{important(r,"height","35px");important(r,"min-height","35px");});t.querySelectorAll("th,td").forEach(c=>{important(c,"height","35px");important(c,"min-height","35px");important(c,"border","1px solid #94a3b8");important(c,"text-align","center");important(c,"vertical-align","middle");});});
    const process=doc.querySelector(".qmes-iqc2-first table.qmes-iqc2-table tbody tr:first-child td:first-child");if(process){important(process,"white-space","nowrap");important(process,"word-break","keep-all");important(process,"font-size","11.5px");}
    doc.querySelectorAll(".qmes-iqc2-remarks").forEach(el=>{const text=String(el.textContent||"").trim();if(text==="-"||text==="작업지시서 발행 후 공정검사")el.textContent="";});
    const table=doc.querySelector(".qmes-iqc2-auth-row.qmes-pqo-sign-only table.qmes-iqc2-sign-table");if(table){important(table,"width","42%");important(table,"max-width","42%");const rows=table.querySelectorAll("tbody tr");if(rows[0]){important(rows[0],"height","22px");important(rows[0],"min-height","22px");rows[0].querySelectorAll("th").forEach(c=>{important(c,"height","22px");important(c,"min-height","22px");});}if(rows[1]){important(rows[1],"height","50px");important(rows[1],"min-height","50px");rows[1].querySelectorAll("td").forEach(c=>{important(c,"height","50px");important(c,"min-height","50px");});}}
  }
  function apply(){installStyle();document.querySelectorAll(DOC_SELECTOR).forEach(fix);}apply();new MutationObserver(apply).observe(document.getElementById("root")||document.body,{childList:true,subtree:true});
})(window);
