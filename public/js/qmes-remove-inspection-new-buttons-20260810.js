/* QMES inspection compatibility layer.
   Keep React in control of IQC/PQC/OQC edit state and only ensure edit modals are visible. */
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

  function clearStalePrintState(){
    document.body.classList.remove('print-doc','print-label','print-wo','qmes-printing');
    document.documentElement.classList.remove('print-doc','print-label','print-wo','qmes-printing');
    const printRoot=document.getElementById('qmes-print-root');
    if(printRoot){
      printRoot.setAttribute('aria-hidden','true');
      printRoot.style.removeProperty('display');
    }
  }

  function forceVisibleEditModal(){
    const backdrops=document.querySelectorAll('.qmes-modal-backdrop');
    backdrops.forEach((backdrop)=>{
      const dialog=backdrop.querySelector('[role="dialog"],.qmes-iqc-modal,.qmes-inspection-modal');
      if(!dialog) return;
      backdrop.style.setProperty('display','flex','important');
      backdrop.style.setProperty('position','fixed','important');
      backdrop.style.setProperty('inset','0','important');
      backdrop.style.setProperty('width','100vw','important');
      backdrop.style.setProperty('height','100vh','important');
      backdrop.style.setProperty('align-items','center','important');
      backdrop.style.setProperty('justify-content','center','important');
      backdrop.style.setProperty('visibility','visible','important');
      backdrop.style.setProperty('opacity','1','important');
      backdrop.style.setProperty('pointer-events','auto','important');
      backdrop.style.setProperty('z-index','2147483000','important');
      dialog.style.setProperty('display','block','important');
      dialog.style.setProperty('visibility','visible','important');
      dialog.style.setProperty('opacity','1','important');
      dialog.style.setProperty('pointer-events','auto','important');
      dialog.style.setProperty('position','relative','important');
      dialog.style.setProperty('z-index','2147483001','important');
    });
  }

  document.addEventListener('click',function(event){
    const button=event.target && event.target.closest
      ? event.target.closest('button.qmes-iqc-action-edit')
      : null;
    if(!button) return;
    if(!button.closest('.qmes-iqc-page,.qmes-pqc-page,.qmes-oqc-page')) return;

    clearStalePrintState();

    /* Let the original React onClick run normally. Then reveal only the modal it creates. */
    requestAnimationFrame(()=>{
      forceVisibleEditModal();
      setTimeout(forceVisibleEditModal,30);
      setTimeout(forceVisibleEditModal,120);
    });
  },true);
})(window);
