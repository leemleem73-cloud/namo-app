/* NAMO QMES - quality inspection UI stability - 2026-09-01 */
(function installQmesQualityInspectionUi(global){
  "use strict";
  if(global.__QMES_QUALITY_INSPECTION_UI_20260901__) return;
  global.__QMES_QUALITY_INSPECTION_UI_20260901__=true;

  const STYLE_ID="qmes-quality-inspection-ui-style-20260901";
  const activeNative=new WeakSet();

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
      .qmes-quality-native-open{
        -webkit-appearance:menulist!important;
        appearance:auto!important;
        background-image:none!important;
        color-scheme:only light!important;
      }
      .qmes-quality-native-open option{
        background:#fff!important;
        background-color:#fff!important;
        color:#111827!important;
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

  function prepare(select){
    ensureLightSchemeMeta();
    document.documentElement.style.setProperty("color-scheme","only light","important");
    document.body?.style.setProperty("color-scheme","only light","important");
    select.style.setProperty("color-scheme","only light","important");
    select.classList.add("qmes-quality-native-open");
    activeNative.add(select);
  }

  function restore(select){
    if(!(select instanceof HTMLSelectElement)||!activeNative.has(select)) return;
    select.classList.remove("qmes-quality-native-open");
    activeNative.delete(select);
  }

  document.addEventListener("pointerdown",event=>{
    const select=event.target instanceof HTMLSelectElement?event.target:null;
    if(select&&isQualityDateSelect(select)&&!select.disabled) prepare(select);
  },true);

  document.addEventListener("change",event=>restore(event.target),true);
  document.addEventListener("focusout",event=>restore(event.target),true);
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape") restore(event.target);
  },true);

  ensureLightSchemeMeta();
  ensureStyle();
})(window);
