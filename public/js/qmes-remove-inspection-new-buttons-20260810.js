/* QMES inspection compatibility layer.
   Keep React in control of IQC/PQC/OQC modals and provide a targeted edit-click fallback. */
(function installInspectionCompatibility(){
  'use strict';
  if(window.__QMES_INSPECTION_COMPAT_READY__) return;
  window.__QMES_INSPECTION_COMPAT_READY__=true;

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
   * Some legacy page-level click handlers can swallow table action clicks before
   * React's delegated event listener sees them. For the three inspection edit
   * buttons only, resolve the React-owned onClick callback directly at capture
   * time and invoke it once. No DOM mutation or modal styling is performed here.
   */
  document.addEventListener('click',function(event){
    const button=event.target && event.target.closest
      ? event.target.closest('button.qmes-iqc-action-edit')
      : null;
    if(!button) return;
    if(!button.closest('.qmes-iqc-page,.qmes-pqc-page,.qmes-oqc-page')) return;

    const propKey=Object.keys(button).find((key)=>key.indexOf('__reactProps$')===0);
    const props=propKey ? button[propKey] : null;
    if(!props || typeof props.onClick!=='function') return;

    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation==='function') event.stopImmediatePropagation();
    try{
      props.onClick();
    }catch(error){
      console.error('QMES inspection edit fallback failed:',error);
    }
  },true);
})(window);
