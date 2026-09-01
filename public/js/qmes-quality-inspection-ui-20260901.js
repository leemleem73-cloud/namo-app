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

      /* Quality year/month use one stable native rendering mode at all times.
         Do not switch appearance on click: that was causing the text to jump. */
      html body #root .qmes-iqc-record-filter .qmes-oqc-record-filter-field select,
      html body #root .qmes-pqc-record-filter .qmes-oqc-record-filter-field select,
      html body #root .qmes-oqc-record-filter .qmes-oqc-record-filter-field select,
      html body #root .qmes-iqc-record-filter .qmes-oqc-record-filter-field select:hover,
      html body #root .qmes-pqc-record-filter .qmes-oqc-record-filter-field select:hover,
      html body #root .qmes-oqc-record-filter .qmes-oqc-record-filter-field select:hover,
      html body #root .qmes-iqc-record-filter .qmes-oqc-record-filter-field select:focus,
      html body #root .qmes-pqc-record-filter .qmes-oqc-record-filter-field select:focus,
      html body #root .qmes-oqc-record-filter .qmes-oqc-record-filter-field select:focus,
      html body #root .qmes-iqc-record-filter .qmes-oqc-record-filter-field select:active,
      html body #root .qmes-pqc-record-filter .qmes-oqc-record-filter-field select:active,
      html body #root .qmes-oqc-record-filter .qmes-oqc-record-filter-field select:active{
        -webkit-appearance:menulist!important;
        appearance:auto!important;
        color-scheme:only light!important;
        background-color:#fff!important;
        background-image:none!important;
        color:#111827!important;
        border-color:#cbd5e1!important;
        box-shadow:none!important;
        outline:none!important;
        transition:none!important;
        box-sizing:border-box!important;
      }
      html body #root .qmes-iqc-record-filter .qmes-oqc-record-filter-field option,
      html body #root .qmes-pqc-record-filter .qmes-oqc-record-filter-field option,
      html body #root .qmes-oqc-record-filter .qmes-oqc-record-filter-field option{
        color-scheme:only light!important;
        background:#fff!important;
        background-color:#fff!important;
        color:#111827!important;
      }

      .qmes-inspection-modal-head,.qmes-iqc-modal-head{flex:0 0 auto;}
      .qmes-inspection-modal-body,.qmes-iqc-modal-body{min-height:0;flex:1 1 auto;}
      .qmes-wo-viewer-head{position:sticky;top:0;z-index:5;flex:0 0 auto;background:#0b1728;}
    `;
    document.head.appendChild(style);
  }

  ensureLightSchemeMeta();
  ensureStyle();
})(window);
