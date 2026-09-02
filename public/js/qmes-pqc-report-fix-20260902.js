/* NAMO QMES - PQC certificate final visual alignment - 2026-09-02
   PQC only. IQC/OQC untouched. */
(function installPqcReportFix(global){
"use strict";if(global.__QMES_PQC_REPORT_FIX_20260902_V5__)return;global.__QMES_PQC_REPORT_FIX_20260902_V5__=true;
const STYLE_ID="qmes-pqc-report-fix-20260902-v5",DOC_SELECTOR=".qmes-pqc-doc";function imp(e,p,v){if(e)e.style.setProperty(p,v,"important");}
function style(){if(document.getElementById(STYLE_ID))return;const s=document.createElement("style");s.id=STYLE_ID;s.textContent=`
html body #root .qmes-pqc-doc .qmes-iqc-header-logo{transform:scale(.98)!important;transform-origin:left center!important;max-width:98%!important;height:auto!important;}
html body #root .qmes-pqc-doc table.qmes-iqc2-table{border-collapse:collapse!important;}
html body #root .qmes-pqc-doc table.qmes-iqc2-table th,html body #root .qmes-pqc-doc table.qmes-iqc2-table td{height:35px!important;min-height:35px!important;border:1px solid #94a3b8!important;box-sizing:border-box!important;text-align:center!important;vertical-align:middle!important;font-size:12px!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-first table.qmes-iqc2-table tbody td:first-child{white-space:nowrap!important;word-break:keep-all!important;overflow-wrap:normal!important;font-size:11.5px!important;padding-left:2px!important;padding-right:2px!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-remarks{min-height:35px!important;border-color:#94a3b8!important;font-size:12px!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-auth-row.qmes-pqo-sign-only{display:flex!important;justify-content:flex-end!important;width:100%!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table{border-collapse:collapse!important;border-spacing:0!important;table-layout:fixed!important;width:42%!important;max-width:42%!important;flex:0 0 42%!important;border:1px solid #94a3b8!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tr,html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table th,html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table td{border:1px solid #94a3b8!important;box-sizing:border-box!important;text-align:center!important;vertical-align:middle!important;font-size:12px!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:first-child,html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:first-child th{height:22px!important;min-height:22px!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:nth-child(2),html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:nth-child(2) td{height:50px!important;min-height:50px!important;border:1px solid #94a3b8!important;}
@media print{html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table,html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tr,html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table th,html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table td{border:1px solid #94a3b8!important;}html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:nth-child(2),html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:nth-child(2) td{height:50px!important;min-height:50px!important;}}
`;document.head.appendChild(s);}
function fix(doc){
 const logo=doc.querySelector(".qmes-iqc-header-logo");if(logo){imp(logo,"transform","scale(.98)");imp(logo,"max-width","98%");}
 doc.querySelectorAll("table.qmes-iqc2-table").forEach(t=>{imp(t,"border-collapse","collapse");t.querySelectorAll("th,td").forEach(c=>{imp(c,"height","35px");imp(c,"min-height","35px");imp(c,"border","1px solid #94a3b8");imp(c,"box-sizing","border-box");imp(c,"text-align","center");imp(c,"vertical-align","middle");});});
 const p=doc.querySelector(".qmes-iqc2-first table.qmes-iqc2-table tbody tr:first-child td:first-child");if(p){imp(p,"white-space","nowrap");imp(p,"word-break","keep-all");imp(p,"font-size","11.5px");}
 doc.querySelectorAll(".qmes-iqc2-remarks").forEach(el=>{const x=String(el.textContent||"").replace(/\s+/g," ").trim();if(x==="-"||x.includes("작업지시서 발행 후 공정검사 성적서 자동 발행"))el.textContent="";});
 const t=doc.querySelector(".qmes-iqc2-auth-row.qmes-pqo-sign-only table.qmes-iqc2-sign-table");if(t){imp(t,"border-collapse","collapse");imp(t,"border","1px solid #94a3b8");imp(t,"width","42%");imp(t,"max-width","42%");t.querySelectorAll("tr,th,td").forEach(c=>{imp(c,"border","1px solid #94a3b8");imp(c,"box-sizing","border-box");});const r=t.querySelectorAll("tbody tr");if(r[0]){imp(r[0],"height","22px");r[0].querySelectorAll("th").forEach(c=>{imp(c,"height","22px");imp(c,"border","1px solid #94a3b8");});}if(r[1]){imp(r[1],"height","50px");imp(r[1],"min-height","50px");r[1].querySelectorAll("td").forEach(c=>{imp(c,"height","50px");imp(c,"min-height","50px");imp(c,"border","1px solid #94a3b8");});}}
}
function apply(){style();document.querySelectorAll(DOC_SELECTOR).forEach(fix);}apply();new MutationObserver(apply).observe(document.getElementById("root")||document.body,{childList:true,subtree:true});
})(window);
