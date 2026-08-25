/* QMES compatibility styles + global modal layer repair.
   React remains in control of every modal; this file only restores missing CSS utilities. */
(function installQmesCompatibilityStyles(){
  'use strict';
  if(window.__QMES_COMPAT_STYLE_READY__) return;
  window.__QMES_COMPAT_STYLE_READY__=true;
  const style=document.createElement('style');
  style.id='qmes-compat-style';
  style.textContent=`
    body:has(.qmes-preview-dashboard),#root:has(.qmes-preview-dashboard),main:has(.qmes-preview-dashboard){background:#f5f7fb!important;}
    .qmes-preview-dashboard{background:#f5f7fb!important;}

    .qmes-iqc-page .qmes-iqc-new-btn{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;}
    .qmes-pqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut]),.qmes-oqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut]){display:none!important;visibility:hidden!important;}
    .qmes-pqc-page [data-qmes-field-shortcut],.qmes-oqc-page [data-qmes-field-shortcut]{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;}

    /* common.css currently misses Tailwind's fixed/inset utilities used by several
       management edit/register dialogs. Restore only full-screen dialog layers. */
    .fixed.inset-0:has([role="dialog"]),
    .fixed.inset-0[role="dialog"]{
      position:fixed!important;
      top:0!important;
      right:0!important;
      bottom:0!important;
      left:0!important;
      z-index:30000!important;
    }

    /* Legacy inspection/report viewers use their own backdrop class. Keep every
       normal application modal above the sticky header/menu and inside viewport. */
    .qmes-modal-backdrop,
    .qmes-iqc-modal-backdrop,
    .qmes-inspection-modal-backdrop{
      position:fixed!important;
      inset:0!important;
      z-index:30000!important;
      visibility:visible!important;
      opacity:1!important;
      pointer-events:auto!important;
    }

    body:not(.print-doc):not(.print-label) .qmes-modal-backdrop,
    body:not(.print-doc):not(.print-label) .qmes-iqc-modal-backdrop,
    body:not(.print-doc):not(.print-label) .qmes-inspection-modal-backdrop{
      display:flex!important;
    }
  `;
  document.head.appendChild(style);
})(window);

/* Edit-button safety only.
   Do not prevent or stop the click. React's own edit handlers must run. */
(function installInspectionEditClickSafety(){
  'use strict';
  if(window.__QMES_INSPECTION_EDIT_CLICK_SAFETY__) return;
  window.__QMES_INSPECTION_EDIT_CLICK_SAFETY__=true;
  document.addEventListener('click',function(event){
    const button=event.target && event.target.closest ? event.target.closest('button.qmes-iqc-action-edit') : null;
    if(!button) return;
    if(!button.closest('.qmes-iqc-page,.qmes-pqc-page,.qmes-oqc-page')) return;
    button.setAttribute('type','button');
    document.body.classList.remove('print-doc','print-label','qmes-printing');
    document.documentElement.classList.remove('print-doc','print-label','qmes-printing');
    const printRoot=document.getElementById('qmes-print-root');
    if(printRoot){
      printRoot.setAttribute('aria-hidden','true');
      printRoot.style.removeProperty('display');
    }
  },true);
})(window);

/* Do not start shared DB sync until the server-backed login check has completed. */
(function guardSharedSyncUntilAuthenticated(){
  'use strict';
  if(window.__QMES_SHARED_SYNC_AUTH_GUARD__) return;
  window.__QMES_SHARED_SYNC_AUTH_GUARD__=true;
  const guardedNames=['qmesSyncPullWorkOrders','qmesSyncWorkOrder','qmesSyncPullInspection','qmesSyncPushPendingInspections','qmesSyncPullEquipment','qmesSyncPushPendingEquipment'];
  function hasAuthenticatedUser(){
    const user=window.__QMES_CURRENT_USER__;
    return !!(user && typeof user==='object' && (user.id || user.uid || user.name));
  }
  function install(){
    guardedNames.forEach((name)=>{
      const original=window[name];
      if(typeof original!=='function' || original.__qmesAuthGuarded) return;
      const wrapped=async function(...args){
        if(!hasAuthenticatedUser()){
          if(name==='qmesSyncPullWorkOrders') return 0;
          if(name==='qmesSyncPullInspection') return Array.isArray(args[1]) ? args[1] : [];
          if(name==='qmesSyncPullEquipment') return {readings:window.DB?.eqReadings||{},logs:window.DB?.eqLogs||[],alarms:window.DB?.eqAlarms||[]};
          return 0;
        }
        return original.apply(this,args);
      };
      wrapped.__qmesAuthGuarded=true;
      wrapped.__qmesOriginal=original;
      window[name]=wrapped;
    });
  }
  install();
  window.addEventListener('qmes:mes-master-ready',install);
  window.setTimeout(install,250);
  window.setTimeout(install,1000);
})(window);
