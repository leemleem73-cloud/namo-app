/* QMES inspection compatibility styles only.
   Keep React in full control of IQC/PQC/OQC edit/register modals.
   PQC/OQC 신규등록 is hidden; field shortcuts are handled by the native inspection UI. */
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

    /* IQC keeps its native 신규등록 button. */
    .qmes-iqc-page .qmes-iqc-new-btn{
      display:inline-flex!important;
      visibility:visible!important;
      opacity:1!important;
      pointer-events:auto!important;
    }

    /* PQC/OQC use field registration instead of the native 신규등록 action. */
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
})(window);
