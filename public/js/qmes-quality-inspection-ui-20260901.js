/* NAMO QMES - quality inspection UI stability - 2026-09-01 */
(function installQmesQualityInspectionUi(global){
  "use strict";
  if(global.__QMES_QUALITY_INSPECTION_UI_20260901_V14__) return;
  global.__QMES_QUALITY_INSPECTION_UI_20260901_V14__=true;

  const STYLE_ID="qmes-quality-inspection-ui-style-20260901-v14";

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
      html body #root .qmes-inspection-modal-backdrop{
        position:fixed!important;inset:0!important;z-index:2147483000!important;padding:20px!important;
        background:#fff!important;background-color:#fff!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
        overflow:auto!important;align-items:flex-start!important;justify-content:center!important;
      }
      html body #root .qmes-iqc-modal,
      html body #root .qmes-inspection-modal{
        position:relative!important;z-index:1!important;margin:0 auto!important;max-height:calc(100vh - 40px)!important;
        background:#fff!important;background-color:#fff!important;color:#111827!important;
      }
      html body #root .qmes-iqc-modal-head,
      html body #root .qmes-inspection-modal-head{
        position:sticky!important;top:0!important;z-index:20!important;flex:0 0 auto!important;
        background:#fff!important;background-color:#fff!important;color:#111827!important;
        border-color:#cbd5e1!important;
      }
      html body #root .qmes-iqc-modal-head strong,html body #root .qmes-iqc-modal-head span,
      html body #root .qmes-inspection-modal-head strong,html body #root .qmes-inspection-modal-head span{color:#111827!important;}

      html body #root .qmes-iqc-modal-body,
      html body #root .qmes-inspection-modal-body,
      html body #root .qmes-iqc-modal-section,
      html body #root .qmes-iqc-modal-grid,
      html body #root .qmes-pqc-entry-form,
      html body #root .qmes-oqc-entry-form,
      html body #root .qmes-inspection-modal-body .qmes-panel,
      html body #root .qmes-inspection-modal-body [class~="bg-slate-950"],
      html body #root .qmes-inspection-modal-body [class~="bg-slate-900"],
      html body #root .qmes-inspection-modal-body [class~="bg-slate-800"],
      html body #root .qmes-inspection-modal-body [class*="bg-slate-900/"],
      html body #root .qmes-inspection-modal-body [class*="bg-slate-800/"],
      html body #root .qmes-iqc-modal [class~="bg-slate-950"],
      html body #root .qmes-iqc-modal [class~="bg-slate-900"],
      html body #root .qmes-iqc-modal [class~="bg-slate-800"],
      html body #root .qmes-iqc-modal [class*="bg-slate-900/"],
      html body #root .qmes-iqc-modal [class*="bg-slate-800/"]{
        background:#fff!important;background-color:#fff!important;background-image:none!important;
      }

      /* Registration borders: match the light gray print-button border. */
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
      html body #root .qmes-iqc-modal td{
        border-color:#cbd5e1!important;
      }
      html body #root .qmes-iqc-modal input,
      html body #root .qmes-iqc-modal select,
      html body #root .qmes-iqc-modal textarea,
      html body #root .qmes-iqc-modal button:not(.qmes-iqc-modal-save),
      html body #root .qmes-inspection-modal input,
      html body #root .qmes-inspection-modal select,
      html body #root .qmes-inspection-modal textarea,
      html body #root .qmes-inspection-modal button:not(.qmes-inspection-save){
        background-color:#fff!important;color:#111827!important;border-color:#cbd5e1!important;
      }
      html body #root .qmes-iqc-modal [class*="border-slate"],
      html body #root .qmes-inspection-modal [class*="border-slate"],
      html body #root .qmes-iqc-modal [style*="border"],
      html body #root .qmes-inspection-modal [style*="border"]{
        border-color:#cbd5e1!important;
      }
      html body #root .qmes-iqc-modal-foot{background:#fff!important;background-color:#fff!important;border-color:#cbd5e1!important;}
      .qmes-inspection-modal-body,.qmes-iqc-modal-body{min-height:0;flex:1 1 auto;background:#fff!important;}

      .qmes-quality-modal-actions{display:flex!important;align-items:center!important;gap:8px!important;margin-left:auto!important;position:relative!important;z-index:21!important;flex:0 0 auto!important;}
      .qmes-quality-modal-print,.qmes-quality-modal-close{
        height:34px!important;min-width:58px!important;padding:0 13px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;
        background:#fff!important;color:#111827!important;font-size:13px!important;font-weight:700!important;
        display:inline-flex!important;align-items:center!important;justify-content:center!important;visibility:visible!important;opacity:1!important;cursor:pointer!important;
      }
      .qmes-quality-modal-print:hover,.qmes-quality-modal-close:hover{background:#f8fafc!important;}

      @media print{
        body.qmes-print-quality-registration{background:#fff!important;}
        body.qmes-print-quality-registration *{visibility:hidden!important;}
        body.qmes-print-quality-registration .qmes-iqc-modal,
        body.qmes-print-quality-registration .qmes-iqc-modal *,
        body.qmes-print-quality-registration .qmes-inspection-modal,
        body.qmes-print-quality-registration .qmes-inspection-modal *{visibility:visible!important;}
        body.qmes-print-quality-registration .qmes-iqc-modal,
        body.qmes-print-quality-registration .qmes-inspection-modal{
          position:absolute!important;left:0!important;top:0!important;width:100%!important;max-width:none!important;
          max-height:none!important;height:auto!important;overflow:visible!important;margin:0!important;box-shadow:none!important;border:0!important;
        }
        body.qmes-print-quality-registration .qmes-iqc-modal-head,
        body.qmes-print-quality-registration .qmes-inspection-modal-head{position:static!important;}
        body.qmes-print-quality-registration .qmes-quality-modal-actions{display:none!important;}
        body.qmes-print-quality-registration .qmes-iqc-modal-body,
        body.qmes-print-quality-registration .qmes-inspection-modal-body{overflow:visible!important;max-height:none!important;height:auto!important;}
      }

      .qmes-wo-viewer-head{position:sticky;top:0;z-index:5;flex:0 0 auto;background:#0b1728;}
    `;
    document.head.appendChild(style);
  }

  function printRegistrationModal(){
    const modal=document.querySelector(".qmes-iqc-modal,.qmes-inspection-modal");
    if(!modal) return;
    document.body.classList.add("qmes-print-quality-registration");
    const cleanup=()=>document.body.classList.remove("qmes-print-quality-registration");
    global.addEventListener("afterprint",cleanup,{once:true});
    global.setTimeout(()=>{try{global.print();}finally{global.setTimeout(cleanup,300);}},0);
  }

  function enhanceModalHead(head){
    if(!head) return;
    const existingActions=head.querySelector(":scope > .qmes-quality-modal-actions");
    if(existingActions) return;
    const oldClose=Array.from(head.children).find(node=>node instanceof HTMLButtonElement) || head.querySelector('button[aria-label="닫기"],button.qmes-modal-close');
    const actions=document.createElement("div");actions.className="qmes-quality-modal-actions";
    const printBtn=document.createElement("button");
    printBtn.type="button";printBtn.className="qmes-quality-modal-print";printBtn.textContent="인쇄";printBtn.setAttribute("aria-label","신규등록 화면 인쇄");printBtn.addEventListener("click",printRegistrationModal);actions.appendChild(printBtn);
    if(oldClose){oldClose.classList.add("qmes-quality-modal-close");oldClose.textContent="닫기";oldClose.setAttribute("aria-label","닫기");actions.appendChild(oldClose);}
    head.appendChild(actions);
  }

  function enhanceOpenModals(){document.querySelectorAll(".qmes-iqc-modal-head,.qmes-inspection-modal-head").forEach(enhanceModalHead);}

  ensureLightSchemeMeta();ensureStyle();enhanceOpenModals();
  const root=document.getElementById("root")||document.body;
  new MutationObserver(enhanceOpenModals).observe(root,{childList:true,subtree:true});
})(window);
