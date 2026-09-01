/* NAMO QMES - quality inspection UI stability - 2026-09-01
 * Quality inspection only.
 * - Year/month filters keep the original native select UI and native drag behavior.
 * - Before Chromium opens the native picker, force the document/control into the
 *   light color scheme and open the picker through showPicker when supported.
 *   This targets the dark first paint without replacing the select with a custom list.
 * - Inspection/viewer headers remain visible while their body scrolls.
 */
(function installQmesQualityInspectionUi(global){
  "use strict";
  if(global.__QMES_QUALITY_INSPECTION_UI_20260901__) return;
  global.__QMES_QUALITY_INSPECTION_UI_20260901__=true;

  const STYLE_ID="qmes-quality-inspection-ui-style-20260901";

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      /* Keep the native quality year/month picker in the light UI scheme. */
      .qmes-iqc-record-filter .qmes-oqc-record-filter-field select,
      .qmes-pqc-record-filter .qmes-oqc-record-filter-field select,
      .qmes-oqc-record-filter .qmes-oqc-record-filter-field select{
        color-scheme:light!important;
      }

      /* Keep inspection modal/viewer chrome visible. Only the body scrolls. */
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

  function prepareLightNativePicker(select){
    document.documentElement.style.setProperty("color-scheme","light","important");
    document.body?.style.setProperty("color-scheme","light","important");
    select.style.setProperty("color-scheme","light","important");
    Array.from(select.options).forEach(option=>{
      option.style.setProperty("color-scheme","light","important");
      option.style.setProperty("background-color","#ffffff","important");
      option.style.setProperty("color","#111827","important");
    });
  }

  document.addEventListener("pointerdown",event=>{
    const select=event.target instanceof HTMLSelectElement?event.target:null;
    if(!select||!isQualityDateSelect(select)||select.disabled) return;

    prepareLightNativePicker(select);

    /* showPicker keeps the real browser/OS select. We only replace Chromium's
       default activation path so it cannot paint one stale dark frame first. */
    if(typeof select.showPicker==="function"){
      try{
        event.preventDefault();
        select.focus({preventScroll:true});
        select.showPicker();
      }catch(_error){
        /* If the browser rejects showPicker, allow normal native behavior on the
           next interaction; the light scheme prepared above still remains. */
      }
    }
  },true);

  ensureStyle();
})(window);
