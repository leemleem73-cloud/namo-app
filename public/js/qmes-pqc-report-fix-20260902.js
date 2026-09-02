/* NAMO QMES - PQC certificate final visual alignment - 2026-09-02
   PQC only. IQC/OQC are intentionally untouched. */
(function installPqcReportFix(global){
  "use strict";
  if(global.__QMES_PQC_REPORT_FIX_20260902_V1__) return;
  global.__QMES_PQC_REPORT_FIX_20260902_V1__=true;

  const STYLE_ID="qmes-pqc-report-fix-20260902-v1";
  const DOC_SELECTOR=".qmes-pqc-doc";
  function important(el,prop,value){if(el)el.style.setProperty(prop,value,"important");}

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
html body #root .qmes-pqc-doc .qmes-iqc-header-logo{object-fit:contain!important;image-rendering:auto!important;filter:none!important;opacity:1!important;transform:scale(.88)!important;transform-origin:left center!important;max-width:88%!important;height:auto!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-sec-title{border-bottom:1.5px solid #243b5a!important;border-color:#243b5a!important;text-align:center!important;padding-left:0!important;border-left:0!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-sec-title,html body #root .qmes-pqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th,html body #root .qmes-pqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td,html body #root .qmes-pqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th *,html body #root .qmes-pqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td *,html body #root .qmes-pqc-doc .qmes-iqc2-remarks,html body #root .qmes-pqc-doc .qmes-iqc2-remarks *{font-size:12px!important;line-height:1.25!important;font-family:inherit!important;}
html body #root .qmes-pqc-doc table.qmes-iqc2-table{border-collapse:collapse!important;border-spacing:0!important;}
html body #root .qmes-pqc-doc table.qmes-iqc2-table tr{height:35px!important;min-height:35px!important;}
html body #root .qmes-pqc-doc table.qmes-iqc2-table th,html body #root .qmes-pqc-doc table.qmes-iqc2-table td{height:35px!important;min-height:35px!important;padding-top:3px!important;padding-bottom:3px!important;vertical-align:middle!important;text-align:center!important;border:1px solid #94a3b8!important;outline:0!important;box-shadow:none!important;box-sizing:border-box!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-item-cell,html body #root .qmes-pqc-doc .qmes-iqc2-spec-cell{text-align:center!important;vertical-align:middle!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-remarks{min-height:35px!important;padding-top:3px!important;padding-bottom:3px!important;border-color:#94a3b8!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-auth-row.qmes-pqo-sign-only{display:flex!important;justify-content:flex-end!important;align-items:stretch!important;width:100%!important;box-sizing:border-box!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table{border-collapse:collapse!important;border-spacing:0!important;table-layout:fixed!important;flex:0 1 42%!important;width:42%!important;max-width:42%!important;min-width:0!important;box-sizing:border-box!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table th,html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table td{padding-top:3px!important;padding-bottom:3px!important;vertical-align:middle!important;text-align:center!important;border:1px solid #94a3b8!important;outline:0!important;box-shadow:none!important;box-sizing:border-box!important;font-size:12px!important;line-height:1.25!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:first-child,html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:first-child th{height:35px!important;min-height:35px!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:nth-child(2),html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:nth-child(2) td{height:55px!important;min-height:55px!important;}
@media print{
html body #root .qmes-pqc-doc table.qmes-iqc2-table{border-collapse:collapse!important;border-spacing:0!important;}
html body #root .qmes-pqc-doc table.qmes-iqc2-table tr,html body #root .qmes-pqc-doc table.qmes-iqc2-table th,html body #root .qmes-pqc-doc table.qmes-iqc2-table td{height:35px!important;min-height:35px!important;padding-top:3px!important;padding-bottom:3px!important;vertical-align:middle!important;}
html body #root .qmes-pqc-doc table.qmes-iqc2-table th,html body #root .qmes-pqc-doc table.qmes-iqc2-table td,html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table th,html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table td{border:1px solid #94a3b8!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-remarks{border-color:#94a3b8!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:first-child,html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:first-child th{height:35px!important;min-height:35px!important;}
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:nth-child(2),html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table tbody tr:nth-child(2) td{height:55px!important;min-height:55px!important;}
html body #root .qmes-pqc-doc .qmes-iqc2-sec-title{border-bottom:1.5px solid #243b5a!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
}
`;
    document.head.appendChild(style);
  }

  function fixLogo(doc){
    const logo=doc.querySelector(".qmes-iqc-header-logo");
    if(!logo)return;
    if(!String(logo.getAttribute("src")||"").includes("logo.png")) logo.setAttribute("src","./logo.png");
    important(logo,"filter","none");
    important(logo,"opacity","1");
    important(logo,"transform","scale(.88)");
    important(logo,"transform-origin","left center");
    important(logo,"max-width","88%");
    important(logo,"height","auto");
  }

  function fixTypography(doc){
    doc.querySelectorAll(".qmes-iqc2-sec-title,.qmes-iqc2-sec table.qmes-iqc2-table th,.qmes-iqc2-sec table.qmes-iqc2-table td,.qmes-iqc2-sec table.qmes-iqc2-table th *,.qmes-iqc2-sec table.qmes-iqc2-table td *,.qmes-iqc2-remarks,.qmes-iqc2-remarks *").forEach(el=>{
      important(el,"font-size","12px");important(el,"line-height","1.25");important(el,"font-family","inherit");
    });
    doc.querySelectorAll(".qmes-iqc2-sec-title").forEach(el=>{important(el,"text-align","center");important(el,"padding-left","0");important(el,"border-left","0");});
    doc.querySelectorAll("table.qmes-iqc2-table th,table.qmes-iqc2-table td,.qmes-iqc2-item-cell,.qmes-iqc2-spec-cell").forEach(el=>{important(el,"text-align","center");important(el,"vertical-align","middle");});
  }

  function fixRowsAndBorders(doc){
    doc.querySelectorAll("table.qmes-iqc2-table").forEach(table=>{
      important(table,"border-collapse","collapse");
      table.querySelectorAll("tr").forEach(row=>{important(row,"height","35px");important(row,"min-height","35px");});
      table.querySelectorAll("th,td").forEach(cell=>{important(cell,"height","35px");important(cell,"min-height","35px");important(cell,"padding-top","3px");important(cell,"padding-bottom","3px");important(cell,"border","1px solid #94a3b8");important(cell,"box-sizing","border-box");important(cell,"text-align","center");important(cell,"vertical-align","middle");});
    });
    doc.querySelectorAll(".qmes-iqc2-remarks").forEach(el=>{important(el,"min-height","35px");important(el,"padding-top","3px");important(el,"padding-bottom","3px");important(el,"border-color","#94a3b8");});
  }

  function fixApproval(doc){
    const row=doc.querySelector(".qmes-iqc2-auth-row.qmes-pqo-sign-only");
    if(!row)return;
    important(row,"display","flex");important(row,"justify-content","flex-end");important(row,"align-items","stretch");important(row,"width","100%");
    const table=row.querySelector("table.qmes-iqc2-sign-table");
    if(!table)return;
    important(table,"border-collapse","collapse");important(table,"table-layout","fixed");important(table,"flex","0 1 42%");important(table,"width","42%");important(table,"max-width","42%");important(table,"min-width","0");
    table.querySelectorAll("th,td").forEach(cell=>{important(cell,"border","1px solid #94a3b8");important(cell,"box-sizing","border-box");important(cell,"font-size","12px");important(cell,"line-height","1.25");important(cell,"text-align","center");important(cell,"vertical-align","middle");important(cell,"padding-top","3px");important(cell,"padding-bottom","3px");});
    const rows=table.querySelectorAll("tbody tr");
    if(rows[0]){important(rows[0],"height","35px");important(rows[0],"min-height","35px");rows[0].querySelectorAll("th").forEach(cell=>{important(cell,"height","35px");important(cell,"min-height","35px");});}
    if(rows[1]){important(rows[1],"height","55px");important(rows[1],"min-height","55px");rows[1].querySelectorAll("td").forEach(cell=>{important(cell,"height","55px");important(cell,"min-height","55px");});}
  }

  function fixSectionHeader(doc){doc.querySelectorAll(".qmes-iqc2-sec-title").forEach(el=>{important(el,"border-bottom","1.5px solid #243b5a");important(el,"border-color","#243b5a");important(el,"text-align","center");important(el,"padding-left","0");important(el,"border-left","0");});}
  function apply(){installStyle();document.querySelectorAll(DOC_SELECTOR).forEach(doc=>{fixLogo(doc);fixTypography(doc);fixRowsAndBorders(doc);fixApproval(doc);fixSectionHeader(doc);});}
  apply();
  new MutationObserver(apply).observe(document.getElementById("root")||document.body,{childList:true,subtree:true});
})(window);
