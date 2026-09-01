/* NAMO QMES - quality inspection UI stability - 2026-09-01 */
(function installQmesQualityInspectionUi(global){
  "use strict";
  if(global.__QMES_QUALITY_INSPECTION_UI_20260901__) return;
  global.__QMES_QUALITY_INSPECTION_UI_20260901__=true;

  const STYLE_ID="qmes-quality-inspection-ui-style-20260901";

  function ensureLightSchemeMeta(){
    let meta=document.querySelector('meta[name="color-scheme"]');
    if(!meta){
      meta=document.createElement("meta");
      meta.name="color-scheme";
      document.head.prepend(meta);
    }
    meta.content="only light";
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      html,body,#root{color-scheme:only light!important;}
      .qmes-iqc-record-filter .qmes-oqc-record-filter-field select,
      .qmes-pqc-record-filter .qmes-oqc-record-filter-field select,
      .qmes-oqc-record-filter .qmes-oqc-record-filter-field select,
      .qmes-iqc-record-filter .qmes-oqc-record-filter-field option,
      .qmes-pqc-record-filter .qmes-oqc-record-filter-field option,
      .qmes-oqc-record-filter .qmes-oqc-record-filter-field option{
        color-scheme:only light!important;
      }
      .qmes-inspection-modal-head,.qmes-iqc-modal-head{flex:0 0 auto;}
      .qmes-inspection-modal-body,.qmes-iqc-modal-body{min-height:0;flex:1 1 auto;}
      .qmes-wo-viewer-head{position:sticky;top:0;z-index:5;flex:0 0 auto;background:#0b1728;}
    `;
    document.head.appendChild(style);
  }

  function isQualityDateSelect(select){
    if(!(select instanceof HTMLSelectElement)) return false;
    const filter=select.closest(".qmes-iqc-record-filter,.qmes-pqc-record-filter,.qmes-oqc-record-filter");
    if(!filter) return false;
    const field=select.closest(".qmes-oqc-record-filter-field");
    const label=String(field?.querySelector("span")?.textContent||"").trim();
    return label==="연도"||label==="월";
  }

  function prepareNativeLightPicker(select){
    ensureLightSchemeMeta();
    document.documentElement.style.setProperty("color-scheme","only light","important");
    document.body?.style.setProperty("color-scheme","only light","important");
    select.style.setProperty("color-scheme","only light","important");
    Array.from(select.options).forEach(option=>option.style.setProperty("color-scheme","only light","important"));
  }

  /* Preserve the original native select exactly. Do not prevent default, replace
     the dropdown, move it, or close it on scroll/resize. Only lock UA scheme light
     before Chromium/Windows paints the native picker. */
  document.addEventListener("pointerdown",event=>{
    const select=event.target instanceof HTMLSelectElement?event.target:null;
    if(select&&isQualityDateSelect(select)&&!select.disabled) prepareNativeLightPicker(select);
  },true);

  ensureLightSchemeMeta();
  ensureStyle();
})(window);
