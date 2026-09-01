/* NAMO QMES - quality report refinements - 2026-09-01 */
(function installQualityReportFix(global){
  "use strict";
  if(global.__QMES_QUALITY_REPORT_FIX_V48__) return;
  global.__QMES_QUALITY_REPORT_FIX_V48__=true;
  const STYLE_ID="qmes-quality-report-fix-v48";

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

/* OQC shipment-number value cell */
html body #root .qmes-oqc-doc .qmes-oqc-shipment-value{
  white-space:nowrap!important;
  word-break:normal!important;
  overflow-wrap:normal!important;
  text-align:center!important;
  vertical-align:middle!important;
  font-size:10px!important;
  letter-spacing:-0.15px!important;
  padding-left:3px!important;
  padding-right:3px!important;
}
html body #root .qmes-oqc-doc .qmes-oqc-shipment-value *{
  white-space:nowrap!important;
  word-break:normal!important;
  overflow-wrap:normal!important;
  text-align:center!important;
  font-size:10px!important;
  letter-spacing:-0.15px!important;
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
  html body #root .qmes-oqc-doc .qmes-oqc-shipment-value,
  html body #root .qmes-oqc-doc .qmes-oqc-shipment-value *{white-space:nowrap!important;text-align:center!important;vertical-align:middle!important;font-size:10px!important;letter-spacing:-0.15px!important;}
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
      important(cell,"font-size","10px");
      important(cell,"letter-spacing","-0.15px");
      important(cell,"padding-left","3px");
      important(cell,"padding-right","3px");
      Array.from(cell.querySelectorAll("*")).forEach(child=>{
        important(child,"white-space","nowrap");
        important(child,"text-align","center");
        important(child,"font-size","10px");
        important(child,"letter-spacing","-0.15px");
      });
      break;
    }
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
    document.querySelectorAll(".qmes-oqc-doc").forEach(doc=>{fixShipmentCell(doc);fixSignTable(doc);});
    document.querySelectorAll(".qmes-pqc-doc,.qmes-iqc-doc").forEach(fixSignTable);
  }

  apply();
  const root=document.getElementById("root")||document.body;
  new MutationObserver(apply).observe(root,{childList:true,subtree:true});
})(window);
