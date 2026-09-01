/* NAMO QMES - quality inspection UI stability - 2026-09-01 */
(function installQmesQualityInspectionUi(global){
  "use strict";
  if(global.__QMES_QUALITY_INSPECTION_UI_20260901_V16__) return;
  global.__QMES_QUALITY_INSPECTION_UI_20260901_V16__=true;

  const STYLE_ID="qmes-quality-inspection-ui-style-20260901-v16";

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
      html body #root .qmes-modal-backdrop.qmes-iqc-modal-backdrop,
      html body #root .qmes-inspection-modal-backdrop{position:fixed!important;inset:0!important;z-index:2147483000!important;padding:20px!important;background:#fff!important;background-color:#fff!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;overflow:auto!important;align-items:flex-start!important;justify-content:center!important;}
      html body #root .qmes-iqc-modal,
      html body #root .qmes-inspection-modal{position:relative!important;z-index:1!important;margin:0 auto!important;max-height:calc(100vh - 40px)!important;background:#fff!important;background-color:#fff!important;color:#111827!important;}
      html body #root .qmes-iqc-modal-head,
      html body #root .qmes-inspection-modal-head{position:sticky!important;top:0!important;z-index:20!important;flex:0 0 auto!important;background:#fff!important;background-color:#fff!important;color:#111827!important;border-color:#cbd5e1!important;}
      html body #root .qmes-iqc-modal-head strong,html body #root .qmes-iqc-modal-head span,
      html body #root .qmes-inspection-modal-head strong,html body #root .qmes-inspection-modal-head span{color:#111827!important;}
      html body #root .qmes-iqc-modal-body,
      html body #root .qmes-inspection-modal-body,
      html body #root .qmes-iqc-modal-section,
      html body #root .qmes-iqc-modal-grid,
      html body #root .qmes-pqc-entry-form,
      html body #root .qmes-oqc-entry-form,
      html body #root .qmes-inspection-modal-body .qmes-panel{background:#fff!important;background-color:#fff!important;background-image:none!important;}
      html body #root .qmes-iqc-modal,
      html body #root .qmes-inspection-modal,
      html body #root .qmes-iqc-modal-section,
      html body #root .qmes-inspection-modal-body .qmes-panel,
      html body #root .qmes-inspection-modal-body fieldset,
      html body #root .qmes-inspection-modal-body table,
      html body #root .qmes-inspection-modal-body th,
      html body #root .qmes-inspection-modal-body td,
      html body #root .qmes-iqc-modal table,
      html body #root .qmes-iqc-modal th,
      html body #root .qmes-iqc-modal td{border-color:#cbd5e1!important;}
      html body #root .qmes-iqc-modal input,
      html body #root .qmes-iqc-modal select,
      html body #root .qmes-iqc-modal textarea,
      html body #root .qmes-inspection-modal input,
      html body #root .qmes-inspection-modal select,
      html body #root .qmes-inspection-modal textarea{background-color:#fff!important;color:#111827!important;border-color:#cbd5e1!important;}
      html body #root .qmes-iqc-modal-foot{background:#fff!important;background-color:#fff!important;border-color:#cbd5e1!important;}
      .qmes-inspection-modal-body,.qmes-iqc-modal-body{min-height:0;flex:1 1 auto;background:#fff!important;}

      .qmes-quality-modal-actions{display:flex!important;align-items:center!important;gap:8px!important;margin-left:auto!important;position:relative!important;z-index:21!important;flex:0 0 auto!important;}
      html body #root .qmes-quality-modal-close,
      html body #root .qmes-quality-modal-close:hover,
      html body #root .qmes-quality-modal-close:focus,
      html body #root .qmes-quality-modal-close:active{
        height:34px!important;min-width:58px!important;padding:0 13px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;
        background:#fff!important;background-color:#fff!important;color:#000!important;-webkit-text-fill-color:#000!important;
        font-size:13px!important;font-weight:700!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;
        visibility:visible!important;opacity:1!important;cursor:pointer!important;text-shadow:none!important;
      }
      .qmes-wo-viewer-head{position:sticky;top:0;z-index:5;flex:0 0 auto;background:#0b1728;}
    `;
    document.head.appendChild(style);
  }

  function enhanceModalHead(head){
    if(!head) return;
    const oldClose=Array.from(head.children).find(node=>node instanceof HTMLButtonElement) || head.querySelector('button[aria-label="닫기"],button.qmes-modal-close');
    if(!oldClose) return;
    const existingActions=head.querySelector(":scope > .qmes-quality-modal-actions");
    if(existingActions) return;
    const actions=document.createElement("div");actions.className="qmes-quality-modal-actions";
    oldClose.classList.add("qmes-quality-modal-close");
    oldClose.textContent="닫기";
    oldClose.setAttribute("aria-label","닫기");
    actions.appendChild(oldClose);
    head.appendChild(actions);
  }

  function enhanceOpenModals(){document.querySelectorAll(".qmes-iqc-modal-head,.qmes-inspection-modal-head").forEach(enhanceModalHead);}

  ensureLightSchemeMeta();ensureStyle();enhanceOpenModals();
  const root=document.getElementById("root")||document.body;
  new MutationObserver(enhanceOpenModals).observe(root,{childList:true,subtree:true});
})(window);
