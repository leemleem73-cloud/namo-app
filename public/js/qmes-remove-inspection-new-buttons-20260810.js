/* QMES inspection compatibility styles only.
   IMPORTANT: do not intercept edit clicks here. The standalone editor experiment
   caused the inspection screen to freeze, so edit handling is left to React. */
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
