/* NAMO QMES - shared IQC/OQC certificate final refinements - 2026-09-02
   Shared visual baseline for IQC/OQC. IQC-only micro refinements are isolated below. */
(function installQualityReportFix(global){
  "use strict";
  if(global.__QMES_QUALITY_REPORT_FIX_20260902_SHARED6__) return;
  global.__QMES_QUALITY_REPORT_FIX_20260902_SHARED6__=true;

  const STYLE_ID="qmes-quality-report-fix-20260902-shared6";
  const DOC_SELECTOR=".qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)";
  function important(el,prop,value){if(el)el.style.setProperty(prop,value,"important");}

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc-header-logo{object-fit:contain!important;image-rendering:auto!important;filter:none!important;opacity:1!important;transform:scale(.88)!important;transform-origin:left center!important;max-width:88%!important;height:auto!important;}
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc2-sec-title{border-bottom:1.5px solid #243b5a!important;border-color:#243b5a!important;text-align:center!important;padding-left:0!important;border-left:0!important;}
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc2-sec-title,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc2-sec table.qmes-iqc2-table th,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc2-sec table.qmes-iqc2-table td,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc2-sec table.qmes-iqc2-table th *,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc2-sec table.qmes-iqc2-table td *,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc2-remarks,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc2-remarks *{font-size:12px!important;line-height:1.25!important;font-family:inherit!important;}
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-table{border-collapse:collapse!important;border-spacing:0!important;}
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-table tr{height:35px!important;min-height:35px!important;}
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-table th,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-table td{height:35px!important;min-height:35px!important;padding-top:3px!important;padding-bottom:3px!important;vertical-align:middle!important;text-align:center!important;border:1px solid #94a3b8!important;outline:0!important;box-shadow:none!important;box-sizing:border-box!important;}
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc2-item-cell,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc2-spec-cell{text-align:center!important;vertical-align:middle!important;}
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc2-remarks{min-height:35px!important;padding-top:3px!important;padding-bottom:3px!important;border-color:#94a3b8!important;}
html body #root .qmes-oqc-doc .qmes-oqc-shipment-value,html body #root .qmes-oqc-doc .qmes-oqc-shipment-value *{white-space:nowrap!important;word-break:normal!important;overflow-wrap:normal!important;text-align:center!important;vertical-align:middle!important;font-size:12px!important;line-height:1.25!important;letter-spacing:-.2px!important;}
html body #root .qmes-oqc-doc .qmes-oqc-shipment-value{padding-left:1px!important;padding-right:1px!important;}
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-sign-table{border-collapse:collapse!important;border-spacing:0!important;}
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-sign-table th,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-sign-table td{height:35px!important;min-height:35px!important;padding-top:3px!important;padding-bottom:3px!important;vertical-align:middle!important;border:1px solid #94a3b8!important;outline:0!important;box-shadow:none!important;box-sizing:border-box!important;font-size:12px!important;line-height:1.25!important;}
html body #root .qmes-oqc-doc table.qmes-iqc2-sign-table tbody tr:nth-child(2),html body #root .qmes-oqc-doc table.qmes-iqc2-sign-table tbody tr:nth-child(2) td{height:55px!important;min-height:55px!important;}

/* IQC-only fine tuning requested 2026-09-02 */
html body #root .qmes-iqc-doc:not(.qmes-wo-cert) .qmes-iqc-header-logo{transform:scale(.98)!important;max-width:98%!important;}
html body #root .qmes-iqc-doc:not(.qmes-wo-cert) .qmes-iqc2-code-box{border:1px solid #94a3b8!important;min-height:60px!important;padding-top:2px!important;padding-bottom:2px!important;}
html body #root .qmes-iqc-doc:not(.qmes-wo-cert) .qmes-iqc2-code-box .qmes-iqc-code-area{border:none!important;border-radius:0!important;box-shadow:none!important;outline:0!important;}
html body #root .qmes-iqc-doc:not(.qmes-wo-cert) table.qmes-iqc2-sign-table tbody tr:first-child,html body #root .qmes-iqc-doc:not(.qmes-wo-cert) table.qmes-iqc2-sign-table tbody tr:first-child th{height:22px!important;min-height:22px!important;padding-top:1px!important;padding-bottom:1px!important;}
html body #root .qmes-iqc-doc:not(.qmes-wo-cert) table.qmes-iqc2-sign-table tbody tr:nth-child(2),html body #root .qmes-iqc-doc:not(.qmes-wo-cert) table.qmes-iqc2-sign-table tbody tr:nth-child(2) td{height:38px!important;min-height:38px!important;}

@media print{
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-table{border-collapse:collapse!important;border-spacing:0!important;}
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-table tr,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-table th,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-table td,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-sign-table th,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-sign-table td{height:35px!important;min-height:35px!important;padding-top:3px!important;padding-bottom:3px!important;vertical-align:middle!important;}
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-table th,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-table td,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-sign-table th,html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) table.qmes-iqc2-sign-table td{border:1px solid #94a3b8!important;}
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc2-remarks{border-color:#94a3b8!important;}
html body #root .qmes-oqc-doc table.qmes-iqc2-sign-table tbody tr:nth-child(2),html body #root .qmes-oqc-doc table.qmes-iqc2-sign-table tbody tr:nth-child(2) td{height:55px!important;min-height:55px!important;}
html body #root .qmes-iqc-doc:not(.qmes-wo-cert) table.qmes-iqc2-sign-table tbody tr:first-child,html body #root .qmes-iqc-doc:not(.qmes-wo-cert) table.qmes-iqc2-sign-table tbody tr:first-child th{height:22px!important;min-height:22px!important;padding-top:1px!important;padding-bottom:1px!important;}
html body #root .qmes-iqc-doc:not(.qmes-wo-cert) table.qmes-iqc2-sign-table tbody tr:nth-child(2),html body #root .qmes-iqc-doc:not(.qmes-wo-cert) table.qmes-iqc2-sign-table tbody tr:nth-child(2) td{height:38px!important;min-height:38px!important;}
html body #root .qmes-iqc-doc:not(.qmes-wo-cert) .qmes-iqc2-code-box{border-color:#94a3b8!important;min-height:60px!important;padding-top:2px!important;padding-bottom:2px!important;}
html body #root .qmes-iqc-doc:not(.qmes-wo-cert) .qmes-iqc2-code-box .qmes-iqc-code-area{border:none!important;border-radius:0!important;box-shadow:none!important;outline:0!important;}
html body #root :is(.qmes-oqc-doc,.qmes-iqc-doc:not(.qmes-wo-cert)) .qmes-iqc2-sec-title{border-bottom:1.5px solid #243b5a!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
}
`;
    document.head.appendChild(style);
  }

  function fixLogo(doc){
    const logo=doc.querySelector(".qmes-iqc-header-logo");
    if(!logo)return;
    if(!String(logo.getAttribute("src")||"").includes("logo.png"))logo.setAttribute("src","./logo.png");
    const isIqc=doc.classList.contains("qmes-iqc-doc");
    important(logo,"filter","none");important(logo,"opacity","1");
    important(logo,"transform",isIqc?"scale(.98)":"scale(.88)");
    important(logo,"transform-origin","left center");
    important(logo,"max-width",isIqc?"98%":"88%");
    important(logo,"height","auto");
  }

  function fixShipmentCell(doc){
    const tables=Array.from(doc.querySelectorAll("table.qmes-iqc2-table"));
    for(const table of tables){
      const headers=Array.from(table.querySelectorAll("thead th"));
      const idx=headers.findIndex(th=>String(th.textContent||"").trim()==="출하번호");
      if(idx<0)continue;
      const cell=table.querySelector(`tbody tr td:nth-child(${idx+1})`);
      if(!cell)continue;
      cell.classList.add("qmes-oqc-shipment-value");
      [cell,...cell.querySelectorAll("*")].forEach(el=>{important(el,"white-space","nowrap");important(el,"text-align","center");important(el,"font-size","12px");important(el,"line-height","1.25");});
      break;
    }
  }

  function fixTypography(doc){
    doc.querySelectorAll(".qmes-iqc2-sec-title,.qmes-iqc2-sec table.qmes-iqc2-table th,.qmes-iqc2-sec table.qmes-iqc2-table td,.qmes-iqc2-sec table.qmes-iqc2-table th *,.qmes-iqc2-sec table.qmes-iqc2-table td *,.qmes-iqc2-remarks,.qmes-iqc2-remarks *").forEach(el=>{important(el,"font-size","12px");important(el,"line-height","1.25");important(el,"font-family","inherit");});
    doc.querySelectorAll(".qmes-iqc2-sec-title").forEach(el=>{important(el,"text-align","center");important(el,"padding-left","0");important(el,"border-left","0");});
    doc.querySelectorAll("table.qmes-iqc2-table th,table.qmes-iqc2-table td,.qmes-iqc2-item-cell,.qmes-iqc2-spec-cell").forEach(el=>{important(el,"text-align","center");important(el,"vertical-align","middle");});
  }

  function tightenRows(doc){
    doc.querySelectorAll("table.qmes-iqc2-table tr").forEach(row=>{important(row,"height","35px");important(row,"min-height","35px");});
    doc.querySelectorAll("table.qmes-iqc2-table th,table.qmes-iqc2-table td,table.qmes-iqc2-sign-table th,table.qmes-iqc2-sign-table td").forEach(cell=>{important(cell,"height","35px");important(cell,"min-height","35px");important(cell,"padding-top","3px");important(cell,"padding-bottom","3px");important(cell,"vertical-align","middle");});
    const signRows=doc.querySelectorAll("table.qmes-iqc2-sign-table tbody tr");
    if(doc.classList.contains("qmes-iqc-doc")){
      if(signRows[0]){important(signRows[0],"height","22px");important(signRows[0],"min-height","22px");signRows[0].querySelectorAll("th").forEach(cell=>{important(cell,"height","22px");important(cell,"min-height","22px");important(cell,"padding-top","1px");important(cell,"padding-bottom","1px");});}
      if(signRows[1]){important(signRows[1],"height","38px");important(signRows[1],"min-height","38px");signRows[1].querySelectorAll("td").forEach(cell=>{important(cell,"height","38px");important(cell,"min-height","38px");});}
    }else if(signRows[1]){
      important(signRows[1],"height","55px");important(signRows[1],"min-height","55px");signRows[1].querySelectorAll("td").forEach(cell=>{important(cell,"height","55px");important(cell,"min-height","55px");});
    }
  }

  function fixBorders(doc){
    doc.querySelectorAll("table.qmes-iqc2-table").forEach(table=>{important(table,"border-collapse","collapse");table.querySelectorAll("th,td").forEach(cell=>{important(cell,"border","1px solid #94a3b8");important(cell,"box-sizing","border-box");});});
    doc.querySelectorAll(".qmes-iqc2-remarks").forEach(el=>important(el,"border-color","#94a3b8"));
  }

  function fixSignTable(doc){
    doc.querySelectorAll(".qmes-iqc2-auth-row table.qmes-iqc2-sign-table").forEach(table=>{important(table,"border-collapse","collapse");table.querySelectorAll("th,td").forEach(cell=>{important(cell,"border","1px solid #94a3b8");important(cell,"box-sizing","border-box");important(cell,"font-size","12px");important(cell,"line-height","1.25");});});
  }

  function fixSectionHeader(doc){
    doc.querySelectorAll(".qmes-iqc2-sec-title").forEach(el=>{important(el,"border-bottom","1.5px solid #243b5a");important(el,"border-color","#243b5a");important(el,"text-align","center");important(el,"padding-left","0");important(el,"border-left","0");});
  }

  function fixIqcCodeFrame(doc){
    if(!doc.classList.contains("qmes-iqc-doc"))return;
    doc.querySelectorAll(".qmes-iqc2-code-box").forEach(el=>{important(el,"border","1px solid #94a3b8");important(el,"min-height","60px");important(el,"padding-top","2px");important(el,"padding-bottom","2px");});
    doc.querySelectorAll(".qmes-iqc2-code-box .qmes-iqc-code-area").forEach(el=>{important(el,"border","none");important(el,"border-radius","0");important(el,"box-shadow","none");important(el,"outline","0");});
  }

  function applyDoc(doc){fixLogo(doc);fixTypography(doc);tightenRows(doc);fixBorders(doc);fixSignTable(doc);fixSectionHeader(doc);fixIqcCodeFrame(doc);}
  function apply(){installStyle();document.querySelectorAll(DOC_SELECTOR).forEach(doc=>{applyDoc(doc);if(doc.classList.contains("qmes-oqc-doc"))fixShipmentCell(doc);});}
  apply();new MutationObserver(apply).observe(document.getElementById("root")||document.body,{childList:true,subtree:true});
})(window);
