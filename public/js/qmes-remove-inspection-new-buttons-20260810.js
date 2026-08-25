/* QMES inspection compatibility styles only.
   Keep React in full control of IQC/PQC/OQC edit clicks and modal rendering. */
(function installInspectionCompatibilityStyles(){
  'use strict';
  if(window.__QMES_INSPECTION_COMPAT_STYLE_READY__) return;
  window.__QMES_INSPECTION_COMPAT_STYLE_READY__=true;

  const style=document.createElement('style');
  style.id='qmes-inspection-compat-style';
  style.textContent=`
    body:has(.qmes-preview-dashboard),
    #root:has(.qmes-preview-dashboard),
    main:has(.qmes-preview-dashboard){background:#f5f7fb!important;}
    .qmes-preview-dashboard{background:#f5f7fb!important;}

    .qmes-iqc-page .qmes-iqc-new-btn{
      display:inline-flex!important;
      visibility:visible!important;
      opacity:1!important;
      pointer-events:auto!important;
    }

    .qmes-pqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut]),
    .qmes-oqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut]){
      display:none!important;
      visibility:hidden!important;
    }

    .qmes-pqc-page [data-qmes-field-shortcut],
    .qmes-oqc-page [data-qmes-field-shortcut]{
      display:inline-flex!important;
      visibility:visible!important;
      opacity:1!important;
      pointer-events:auto!important;
    }
  `;
  document.head.appendChild(style);

  /*
   * The native inspection edit controls were created without an explicit type.
   * If an inspection ledger is ever mounted under a form, HTML treats those
   * buttons as submit controls and the submit can immediately wipe the edit
   * state that React just opened.  Change only the edit control's native type;
   * do not prevent/stop/call the click ourselves.
   */
  document.addEventListener('click',function(event){
    const button=event.target && event.target.closest
      ? event.target.closest('button.qmes-iqc-action-edit')
      : null;
    if(!button) return;
    if(!button.closest('.qmes-iqc-page,.qmes-pqc-page,.qmes-oqc-page')) return;
    button.type='button';
  },true);
})(window);
