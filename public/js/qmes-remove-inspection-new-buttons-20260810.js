/* QMES inspection compatibility styles only.
   IMPORTANT: keep React in control of edit/register modals. */
(function installInspectionCompatibilityStyles(){
  'use strict';
  if(window.__QMES_INSPECTION_COMPAT_STYLE_READY__) return;
  window.__QMES_INSPECTION_COMPAT_STYLE_READY__=true;
  const style=document.createElement('style');
  style.id='qmes-inspection-compat-style';
  style.textContent=`
    body:has(.qmes-preview-dashboard),#root:has(.qmes-preview-dashboard),main:has(.qmes-preview-dashboard){background:#f5f7fb!important;}
    .qmes-preview-dashboard{background:#f5f7fb!important;}
    .qmes-iqc-page .qmes-iqc-new-btn{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;}
    .qmes-pqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut]),.qmes-oqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut]){display:none!important;visibility:hidden!important;}
    .qmes-pqc-page [data-qmes-field-shortcut],.qmes-oqc-page [data-qmes-field-shortcut]{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;}
  `;
  document.head.appendChild(style);
})(window);

/* Edit-button safety only.
   Do not prevent/stop the click: React's original editIqc/editRecord handler must run.
   We only remove stale print state and make sure an edit button cannot submit a form. */
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

/* Do not start shared DB sync until the server-backed login check has completed.
   This prevents startup-time 401 responses from qmes-sync/workorder. */
(function guardSharedSyncUntilAuthenticated(){
  'use strict';
  if(window.__QMES_SHARED_SYNC_AUTH_GUARD__) return;
  window.__QMES_SHARED_SYNC_AUTH_GUARD__=true;

  const guardedNames=[
    'qmesSyncPullWorkOrders',
    'qmesSyncWorkOrder',
    'qmesSyncPullInspection',
    'qmesSyncPushPendingInspections',
    'qmesSyncPullEquipment',
    'qmesSyncPushPendingEquipment'
  ];

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
