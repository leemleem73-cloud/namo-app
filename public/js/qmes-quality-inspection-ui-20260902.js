/* NAMO QMES - quality inspection UI stability - 2026-09-02
   IMPORTANT: this file must not style official IQC/PQC/OQC certificate documents. */
(function installQmesQualityInspectionUi(global){
  "use strict";
  if(global.__QMES_QUALITY_INSPECTION_UI_20260902_FAST2__) return;
  global.__QMES_QUALITY_INSPECTION_UI_20260902_FAST2__=true;

  const STYLE_ID="qmes-quality-inspection-ui-style-20260902-fast2";
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
html body #root .qmes-modal-backdrop.qmes-iqc-modal-backdrop,html body #root .qmes-inspection-modal-backdrop{position:fixed!important;inset:0!important;z-index:2147483000!important;padding:20px!important;background:rgba(15,23,42,.18)!important;overflow:hidden!important;align-items:center!important;justify-content:center!important;}
html body #root .qmes-iqc-modal,html body #root .qmes-inspection-modal{position:relative!important;z-index:1!important;margin:0 auto!important;height:calc(100vh - 40px)!important;max-height:calc(100vh - 40px)!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;background:#fff!important;background-image:none!important;color:#000!important;border-color:#cbd5e1!important;color-scheme:only light!important;}
html body #root .qmes-iqc-modal-head,html body #root .qmes-inspection-modal-head{position:relative!important;z-index:20!important;flex:0 0 auto!important;background:#fff!important;background-image:none!important;color:#000!important;border-color:#cbd5e1!important;}
html body #root .qmes-iqc-modal-body,html body #root .qmes-inspection-modal-body{position:relative!important;min-height:0!important;height:0!important;flex:1 1 0%!important;overflow-x:hidden!important;overflow-y:auto!important;background:#fff!important;background-image:none!important;color:#000!important;}
/* IQC edit screen: white canvas, white cells and black text only. */
html body #root .qmes-iqc-modal .qmes-iqc-modal-section,
html body #root .qmes-iqc-modal .qmes-iqc-modal-grid,
html body #root .qmes-iqc-modal fieldset,
html body #root .qmes-iqc-modal table,
html body #root .qmes-iqc-modal thead,
html body #root .qmes-iqc-modal tbody,
html body #root .qmes-iqc-modal tr,
html body #root .qmes-iqc-modal th,
html body #root .qmes-iqc-modal td,
html body #root .qmes-iqc-modal label,
html body #root .qmes-iqc-modal [class*="field"],
html body #root .qmes-iqc-modal [class*="cell"],
html body #root .qmes-iqc-modal [class*="row"]{background-color:#fff!important;background-image:none!important;color:#000!important;}
html body #root .qmes-iqc-modal input,
html body #root .qmes-iqc-modal textarea,
html body #root .qmes-iqc-modal select,
html body #root .qmes-iqc-modal option,
html body #root .qmes-iqc-modal optgroup{background-color:#fff!important;background-image:none!important;color:#000!important;border-color:#cbd5e1!important;color-scheme:light!important;-webkit-text-fill-color:#000!important;}
html body #root .qmes-iqc-modal input::placeholder,html body #root .qmes-iqc-modal textarea::placeholder{color:#64748b!important;-webkit-text-fill-color:#64748b!important;opacity:1!important;}
html body #root .qmes-iqc-modal th,html body #root .qmes-iqc-modal td,html body #root .qmes-iqc-modal fieldset,html body #root .qmes-iqc-modal [class*="border"]{border-color:#cbd5e1!important;}
html body #root .qmes-iqc-modal .qmes-iqc-modal-foot{flex:0 0 auto!important;background:#fff!important;background-image:none!important;border-color:#cbd5e1!important;color:#000!important;}
html body #root .qmes-iqc-modal-section,html body #root .qmes-inspection-modal-body .qmes-panel,html body #root .qmes-pqc-entry-form,html body #root .qmes-oqc-entry-form{background:#fff!important;background-image:none!important;}
html body #root .qmes-inspection-modal-body .qmes-panel,html body #root .qmes-inspection-modal-body fieldset,html body #root .qmes-inspection-modal-body table,html body #root .qmes-inspection-modal-body th,html body #root .qmes-inspection-modal-body td{border-color:#cbd5e1!important;}
html body #root .qmes-inspection-modal input,html body #root .qmes-inspection-modal textarea,html body #root .qmes-inspection-modal select{background-color:#fff!important;color:#111827!important;border-color:#cbd5e1!important;}
html body #root .qmes-measurement-summary-white,html body #root .qmes-measurement-summary-white *{background-color:#fff!important;background-image:none!important;color:#000!important;}
html body #root .qmes-measurement-summary-white{border-color:#cbd5e1!important;}
html body #root .qmes-measurement-summary-white th,html body #root .qmes-measurement-summary-white td,html body #root .qmes-measurement-summary-white [class*="border"]{border-color:#cbd5e1!important;}
.qmes-quality-modal-actions{display:flex!important;align-items:center!important;gap:8px!important;margin-left:auto!important;position:relative!important;z-index:21!important;}
html body #root .qmes-quality-modal-close,html body #root .qmes-iqc-modal-cancel,html body #root .qmes-inspection-cancel-btn{border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#000!important;}
html body #root .qmes-quality-modal-close{height:34px!important;min-width:58px!important;padding:0 13px!important;font-size:13px!important;font-weight:700!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;}
html body #root .qmes-modal-backdrop:not(.qmes-iqc-modal-backdrop):not(.qmes-inspection-modal-backdrop){position:fixed!important;inset:0!important;z-index:2147483640!important;padding:10px 20px!important;align-items:flex-start!important;overflow:hidden!important;}
html body #root .qmes-modal-backdrop:not(.qmes-iqc-modal-backdrop):not(.qmes-inspection-modal-backdrop) > .qmes-wo-viewer{width:68vw!important;max-width:1060px!important;margin:0 auto!important;height:calc(100vh - 20px)!important;max-height:calc(100vh - 20px)!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}
html body #root .qmes-modal-backdrop:not(.qmes-iqc-modal-backdrop):not(.qmes-inspection-modal-backdrop) .qmes-wo-viewer-head{position:relative!important;z-index:10!important;display:flex!important;visibility:visible!important;opacity:1!important;flex:0 0 auto!important;min-height:68px!important;padding:8px 24px!important;background:#0b1728!important;overflow:hidden!important;}
html body #root .qmes-output-scroll-body{position:relative!important;z-index:1!important;min-height:0!important;flex:1 1 0%!important;overflow-x:auto!important;overflow-y:auto!important;background:#0b1728!important;}
html body #root .qmes-output-scroll-body > *{position:relative!important;z-index:1!important;}
html body #root .qmes-wo-viewer-head button{position:relative!important;z-index:11!important;visibility:visible!important;opacity:1!important;}
.qmes-inspection-period-label{display:inline-flex!important;align-items:center!important;justify-content:center!important;vertical-align:middle!important;position:relative!important;top:2px!important;line-height:1!important;}
`;
    document.head.appendChild(style);
  }
  function enhanceModalHead(head){
    if(!head) return;
    const oldClose=Array.from(head.children).find(node=>node instanceof HTMLButtonElement)||head.querySelector('button[aria-label="닫기"],button.qmes-modal-close');
    if(!oldClose||head.querySelector(":scope > .qmes-quality-modal-actions")) return;
    const actions=document.createElement("div");actions.className="qmes-quality-modal-actions";
    oldClose.classList.add("qmes-quality-modal-close");oldClose.textContent="닫기";oldClose.setAttribute("aria-label","닫기");
    actions.appendChild(oldClose);head.appendChild(actions);
  }
  function enhanceOutputViewer(viewer){
    if(!viewer||viewer.querySelector(":scope > .qmes-output-scroll-body")) return;
    const head=viewer.querySelector(":scope > .qmes-wo-viewer-head");if(!head) return;
    const body=document.createElement("div");body.className="qmes-output-scroll-body";
    Array.from(viewer.children).filter(node=>node!==head).forEach(node=>body.appendChild(node));viewer.appendChild(body);
  }
  function alignInspectionPeriodLabels(scope){
    const base=scope&&scope.querySelectorAll?scope:document;
    base.querySelectorAll(".qmes-iqc-modal label,.qmes-inspection-modal label,.qmes-iqc-modal span,.qmes-inspection-modal span").forEach(el=>{
      if(el.children.length!==0)return;const text=String(el.textContent||"").trim();if(text!=="연도"&&text!=="월")return;
      const nearby=String(el.parentElement?.parentElement?.textContent||el.parentElement?.textContent||"");
      if(!nearby.includes("출하번호")&&!nearby.includes("LOT")&&!nearby.includes("검사자"))return;
      el.classList.add("qmes-inspection-period-label");
    });
  }
  function whitenMeasurementSummary(scope){
    const base=scope&&scope.querySelectorAll?scope:document;
    base.querySelectorAll('.qmes-iqc-modal [class*="measure"],.qmes-inspection-modal [class*="measure"],.qmes-iqc-modal [class*="summary"],.qmes-inspection-modal [class*="summary"]').forEach(el=>{
      const text=String(el.textContent||"");if(!text.includes("출하번호")||!text.includes("최종판정")||text.length>1200)return;
      el.classList.add("qmes-measurement-summary-white");
    });
  }
  function enhanceOpenModals(){
    document.querySelectorAll(".qmes-iqc-modal-head,.qmes-inspection-modal-head").forEach(enhanceModalHead);
    document.querySelectorAll(".qmes-wo-viewer").forEach(enhanceOutputViewer);
    alignInspectionPeriodLabels(document);whitenMeasurementSummary(document);
  }
  let raf=0;
  function scheduleEnhance(){
    if(raf)return;
    raf=global.requestAnimationFrame(()=>{raf=0;enhanceOpenModals();});
  }
  ensureLightSchemeMeta();ensureStyle();enhanceOpenModals();
  const root=document.getElementById("root")||document.body;
  new MutationObserver(mutations=>{
    let relevant=false;
    for(const mutation of mutations){
      if(!mutation.addedNodes||mutation.addedNodes.length===0)continue;
      for(const node of mutation.addedNodes){
        if(!(node instanceof Element))continue;
        if(node.matches?.('.qmes-iqc-modal,.qmes-inspection-modal,.qmes-wo-viewer,.qmes-iqc-modal-head,.qmes-inspection-modal-head')||node.querySelector?.('.qmes-iqc-modal,.qmes-inspection-modal,.qmes-wo-viewer,.qmes-iqc-modal-head,.qmes-inspection-modal-head')){relevant=true;break;}
      }
      if(relevant)break;
    }
    if(relevant)scheduleEnhance();
  }).observe(root,{childList:true,subtree:true});
})(window);
