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
        color:#111827!important;
      }

      /* Registration modal belongs above the fixed QMES shell, not underneath it. */
      html body #root .qmes-modal-backdrop.qmes-iqc-modal-backdrop,
      html body #root .qmes-inspection-modal-backdrop{
        position:fixed!important;
        inset:0!important;
        z-index:2147483000!important;
        padding:20px!important;
        background:transparent!important;
        backdrop-filter:none!important;
        -webkit-backdrop-filter:none!important;
        overflow:auto!important;
        align-items:flex-start!important;
        justify-content:center!important;
      }
      html body #root .qmes-iqc-modal,
      html body #root .qmes-inspection-modal{
        position:relative!important;
        z-index:1!important;
        margin:0 auto!important;
        max-height:calc(100vh - 40px)!important;
        background:#fff!important;
        color:#111827!important;
      }
      html body #root .qmes-iqc-modal-head,
      html body #root .qmes-inspection-modal-head{
        position:sticky!important;
        top:0!important;
        z-index:20!important;
        flex:0 0 auto!important;
        background:#fff!important;
        color:#111827!important;
      }
      html body #root .qmes-iqc-modal-head strong,
      html body #root .qmes-iqc-modal-head span,
      html body #root .qmes-inspection-modal-head strong,
      html body #root .qmes-inspection-modal-head span{color:#111827!important;}
      html body #root .qmes-iqc-modal-head .qmes-modal-close,
      html body #root .qmes-inspection-modal-head .qmes-modal-close{
        display:inline-flex!important;
        visibility:visible!important;
        opacity:1!important;
        position:relative!important;
        z-index:21!important;
      }
      .qmes-inspection-modal-body,.qmes-iqc-modal-body{min-height:0;flex:1 1 auto;background:#fff!important;}
      .qmes-wo-viewer-head{position:sticky;top:0;z-index:5;flex:0 0 auto;background:#0b1728;}
    `;
    document.head.appendChild(style);
  }

  ensureLightSchemeMeta();
  ensureStyle();
})(window);
