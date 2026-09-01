/* NAMO QMES - quality report refinements - 2026-09-01 */
(function installQualityReportFix(global){
  "use strict";
  if(global.__QMES_QUALITY_REPORT_FIX_V50__) return;
  global.__QMES_QUALITY_REPORT_FIX_V50__=true;
  const STYLE_ID="qmes-quality-report-fix-v50";

  function important(el, prop, value){
    if(el) el.style.setProperty(prop,value,"important");
  }

  function installStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th,
html body #root .qmes-iqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table th,
html body #root .qmes-iqc-doc .qmes-iqc2-sign-table td{font-size:11px!important;line-height:1.3!important;font-family:inherit!important;}
html body #root .qmes-iqc-doc .font-mono,html body #root .qmes-iqc-doc .font-semibold,html body #root .qmes-iqc-doc .qmes-iqc2-pass,html body #root .qmes-iqc-doc .qmes-iqc2-fail{font-size:11px!important;line-height:1.3!important;font-family:inherit!important;}
html body #root .qmes-iqc-doc .qmes-iqc2-code-box > *{border:0!important;outline:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;}

/* OQC logo: use the clean project logo asset instead of the embedded source and render crisply. */
html body #root .qmes-oqc-doc .qmes-iqc-header-logo{
  object-fit:contain!important;
  image-rendering:auto!important;
  filter:none!important;
  opacity:1!important;
  transform:none!important;
  max-width:100%!important;
  height:auto!important;
}

/* OQC section dividers: one consistent navy rule under every section heading. */
html body #root .qmes-oqc-doc .qmes-iqc2-sec-title{
  border-bottom:1.5px solid #243b5a!important;
  border-color:#243b5a!important;
}

/* OQC typography: from 기본정보 through 특이사항, match the shipment-number size exactly. */
html body #root .qmes-oqc-doc .qmes-iqc2-sec-title,
html body #root .qmes-oqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th,
html body #root .qmes-oqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td,
html body #root .qmes-oqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th *,
html body #root .qmes-oqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td *,
html body #root .qmes-oqc-doc .qmes-iqc2-remarks,
html body #root .qmes-oqc-doc .qmes-iqc2-remarks *{
  font-size:11px!important;
  line-height:1.3!important;
  font-family:inherit!important;
}

/* OQC shipment-number value cell */
html body #root .qmes-oqc-doc .qmes-oqc-shipment-value{
  white-space:nowrap!important;
  word-break:normal!important;
  overflow-wrap:normal!important;
  text-align:center!important;
  vertical-align:middle!important;
  font-size:11px!important;
  line-height:1.3!important;
  letter-spacing:-0.1px!important;
  padding-left:2px!important;
  padding-right:2px!important;
}
html body #root .qmes-oqc-doc .qmes-oqc-shipment-value *{
  white-space:nowrap!important;
  word-break:normal!important;
  overflow-wrap:normal!important;
  text-align:center!important;
  font-size:11px!important;
  line-height:1.3!important;
  letter-spacing:-0.1px!important;
}

/* Exact PQC/OQC approval table used by report.jsx. Header and name row use one identical thin black grid. */
html body #root .qmes-oqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table,
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table,
html body #root .qmes-iqc-doc table.qmes-iqc2-sign-table{
  border-collapse:collapse!important;
  border-spacing:0!important;
}
html body #root .qmes-oqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table th,
html body #root .qmes-oqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table td,
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table th,
html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table td,
html body #root .qmes-iqc-doc table.qmes-iqc2-sign-table th,
html body #root .qmes-iqc-doc table.qmes-iqc2-sign-table td{
  border:1px solid #000!important;
  outline:0!important;
  box-shadow:none!important;
  box-sizing:border-box!important;
}
@media print{
  html body #root .qmes-oqc-doc .qmes-iqc-header-logo{object-fit:contain!important;image-rendering:auto!important;filter:none!important;opacity:1!important;transform:none!important;}
  html body #root .qmes-oqc-doc .qmes-iqc2-sec-title{border-bottom:1.5px solid #243b5a!important;border-color:#243b5a!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
  html body #root .qmes-oqc-doc .qmes-iqc2-sec-title,
  html body #root .qmes-oqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th,
  html body #root .qmes-oqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td,
  html body #root .qmes-oqc-doc .qmes-iqc2-sec table.qmes-iqc2-table th *,
  html body #root .qmes-oqc-doc .qmes-iqc2-sec table.qmes-iqc2-table td *,
  html body #root .qmes-oqc-doc .qmes-iqc2-remarks,
  html body #root .qmes-oqc-doc .qmes-iqc2-remarks *{font-size:11px!important;line-height:1.3!important;font-family:inherit!important;}
  html body #root .qmes-oqc-doc .qmes-oqc-shipment-value,
  html body #root .qmes-oqc-doc .qmes-oqc-shipment-value *{white-space:nowrap!important;text-align:center!important;vertical-align:middle!important;font-size:11px!important;line-height:1.3!important;letter-spacing:-0.1px!important;}
  html body #root .qmes-oqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table th,
  html body #root .qmes-oqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table td,
  html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table th,
  html body #root .qmes-pqc-doc .qmes-pqo-sign-only table.qmes-iqc2-sign-table td,
  html body #root .qmes-iqc-doc table.qmes-iqc2-sign-table th,
  html body #root .qmes-iqc-doc table.qmes-iqc2-sign-table td{border:1px solid #000!important;outline:0!important;box-shadow:none!important;}
}
`;
    document.head.appendChild(style);
  }

  function fixLogo(doc){
    if(!doc || !doc.classList.contains("qmes-oqc-doc")) return;
    const logo=doc.querySelector(".qmes-iqc-header-logo");
    if(!logo) return;
    if(!String(logo.getAttribute("src")||"").includes("logo.png")) logo.setAttribute("src","./logo.png");
    important(logo,"object-fit","contain");
    important(logo,"image-rendering","auto");
    important(logo,"filter","none");
    important(logo,"opacity","1");
    important(logo,"transform","none");
  }

  function fixShipmentCell(doc){
    if(!doc || !doc.classList.contains("qmes-oqc-doc")) return;
    const tables=Array.from(doc.querySelectorAll("table.qmes-iqc2-table"));
    for(const table of tables){
      const headers=Array.from(table.querySelectorAll("thead th"));
      const idx=headers.findIndex(th=>String(th.textContent||"").trim()==="출하번호");
      if(idx<0) continue;
      const cell=table.querySelector(`tbody tr td:nth-child(${idx+1})`);
      if(!cell) continue;
      cell.classList.add("qmes-oqc-shipment-value");
      important(cell,"white-space","nowrap");
      important(cell,"word-break","normal");
      important(cell,"overflow-wrap","normal");
      important(cell,"text-align","center");
      important(cell,"vertical-align","middle");
      important(cell,"font-size","11px");
      important(cell,"line-height","1.3");
      important(cell,"letter-spacing","-0.1px");
      important(cell,"padding-left","2px");
      important(cell,"padding-right","2px");
      Array.from(cell.querySelectorAll("*")).forEach(child=>{
        important(child,"white-space","nowrap");
        important(child,"text-align","center");
        important(child,"font-size","11px");
        important(child,"line-height","1.3");
        important(child,"letter-spacing","-0.1px");
      });
      break;
    }
  }

  function fixOqcTypography(doc){
    if(!doc || !doc.classList.contains("qmes-oqc-doc")) return;
    doc.querySelectorAll(".qmes-iqc2-sec-title,.qmes-iqc2-sec table.qmes-iqc2-table th,.qmes-iqc2-sec table.qmes-iqc2-table td,.qmes-iqc2-sec table.qmes-iqc2-table th *,.qmes-iqc2-sec table.qmes-iqc2-table td *,.qmes-iqc2-remarks,.qmes-iqc2-remarks *").forEach(el=>{
      important(el,"font-size","11px");
      important(el,"line-height","1.3");
      important(el,"font-family","inherit");
    });
  }

  function fixSignTable(doc){
    if(!doc) return;
    const tables=Array.from(doc.querySelectorAll(".qmes-iqc2-auth-row table.qmes-iqc2-sign-table"));
    tables.forEach(table=>{
      important(table,"border-collapse","collapse");
      important(table,"border-spacing","0");
      Array.from(table.querySelectorAll("th,td")).forEach(cell=>{
        important(cell,"border","1px solid #000");
        important(cell,"border-color","#000");
        important(cell,"outline","0");
        important(cell,"box-shadow","none");
        important(cell,"box-sizing","border-box");
      });
    });
  }

  function apply(){
    installStyle();
    document.querySelectorAll(".qmes-oqc-doc").forEach(doc=>{fixLogo(doc);fixShipmentCell(doc);fixOqcTypography(doc);fixSignTable(doc);});
    document.querySelectorAll(".qmes-pqc-doc,.qmes-iqc-doc").forEach(fixSignTable);
  }

  apply();
  const root=document.getElementById("root")||document.body;
  new MutationObserver(apply).observe(root,{childList:true,subtree:true});
})(window);
