/* NAMO QMES - quality inspection UI stability - 2026-09-01 */
(function installQmesQualityInspectionUi(global){
  "use strict";
  if(global.__QMES_QUALITY_INSPECTION_UI_20260901__) return;
  global.__QMES_QUALITY_INSPECTION_UI_20260901__=true;

  const STYLE_ID="qmes-quality-inspection-ui-style-20260901";

  function ensureLightSchemeMeta(){
    let meta=document.querySelector('meta[name="color-scheme"]');
    if(!meta){meta=document.createElement("meta");meta.name="color-scheme";document.head.prepend(meta);}
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
        -webkit-appearance:menulist!important;appearance:auto!important;color-scheme:only light!important;
        background-color:#fff!important;background-image:none!important;color:#111827!important;border-color:#cbd5e1!important;
        box-shadow:none!important;outline:none!important;transition:none!important;box-sizing:border-box!important;
      }
      html body #root .qmes-iqc-record-filter .qmes-oqc-record-filter-field option,
      html body #root .qmes-pqc-record-filter .qmes-oqc-record-filter-field option,
      html body #root .qmes-oqc-record-filter .qmes-oqc-record-filter-field option{color-scheme:only light!important;background:#fff!important;color:#111827!important;}

      html body #root .qmes-modal-backdrop.qmes-iqc-modal-backdrop,
      html body #root .qmes-inspection-modal-backdrop{position:fixed!important;inset:0!important;z-index:2147483000!important;padding:20px!important;background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;overflow:auto!important;align-items:flex-start!important;justify-content:center!important;}
      html body #root .qmes-iqc-modal,
      html body #root .qmes-inspection-modal{position:relative!important;z-index:1!important;margin:0 auto!important;max-height:calc(100vh - 40px)!important;background:#fff!important;color:#111827!important;}
      html body #root .qmes-iqc-modal-head,
      html body #root .qmes-inspection-modal-head{position:sticky!important;top:0!important;z-index:20!important;flex:0 0 auto!important;background:#fff!important;color:#111827!important;}
      html body #root .qmes-iqc-modal-head strong,html body #root .qmes-iqc-modal-head span,
      html body #root .qmes-inspection-modal-head strong,html body #root .qmes-inspection-modal-head span{color:#111827!important;}
      html body #root .qmes-iqc-modal-body,html body #root .qmes-inspection-modal-body,
      html body #root .qmes-iqc-modal-section,html body #root .qmes-pqc-entry-form,html body #root .qmes-oqc-entry-form,
      html body #root .qmes-inspection-modal-body .qmes-panel,html body #root .qmes-inspection-modal-body [class*="bg-slate"]{background:#fff!important;background-color:#fff!important;}
      html body #root .qmes-iqc-modal-foot{background:#fff!important;background-color:#fff!important;}
      .qmes-inspection-modal-body,.qmes-iqc-modal-body{min-height:0;flex:1 1 auto;background:#fff!important;}

      .qmes-quality-modal-actions{display:flex!important;align-items:center!important;gap:8px!important;margin-left:auto!important;position:relative!important;z-index:21!important;}
      .qmes-quality-modal-print,.qmes-quality-modal-close{height:34px!important;padding:0 13px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#111827!important;font-size:13px!important;font-weight:700!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;visibility:visible!important;opacity:1!important;cursor:pointer!important;}
      .qmes-quality-modal-print:hover,.qmes-quality-modal-close:hover{background:#f8fafc!important;}
      .qmes-quality-modal-close{min-width:58px!important;}
      .qmes-wo-viewer-head{position:sticky;top:0;z-index:5;flex:0 0 auto;background:#0b1728;}
    `;
    document.head.appendChild(style);
  }

  function enhanceModalHead(head){
    if(!head||head.dataset.qmesQualityActions==="1") return;
    head.dataset.qmesQualityActions="1";
    const oldClose=head.querySelector("button");
    const actions=document.createElement("div");
    actions.className="qmes-quality-modal-actions";
    const printBtn=document.createElement("button");
    printBtn.type="button";printBtn.className="qmes-quality-modal-print";printBtn.textContent="인쇄";
    printBtn.addEventListener("click",()=>global.print());
    actions.appendChild(printBtn);
    if(oldClose){
      oldClose.classList.add("qmes-quality-modal-close");
      oldClose.textContent="닫기";
      actions.appendChild(oldClose);
    }
    head.appendChild(actions);
  }

  function enhanceOpenModals(){
    document.querySelectorAll(".qmes-iqc-modal-head,.qmes-inspection-modal-head").forEach(enhanceModalHead);
  }

  ensureLightSchemeMeta();
  ensureStyle();
  enhanceOpenModals();
  new MutationObserver(enhanceOpenModals).observe(document.body,{childList:true,subtree:true});
})(window);
