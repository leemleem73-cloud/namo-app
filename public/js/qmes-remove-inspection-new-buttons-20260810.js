/* QMES modal foundation + inspection compatibility.
   Keep React in full control of every edit/register action. */
(function installQmesModalFoundation(){
  'use strict';
  if(window.__QMES_MODAL_FOUNDATION_READY__) return;
  window.__QMES_MODAL_FOUNDATION_READY__=true;

  const style=document.createElement('style');
  style.id='qmes-modal-foundation-style';
  style.textContent=`
    /* The extracted Tailwind bundle currently misses these utilities. */
    .fixed{position:fixed!important;}
    .inset-0{top:0!important;right:0!important;bottom:0!important;left:0!important;}
    .z-\\[10000\\]{z-index:10000!important;}
    .z-\\[11000\\]{z-index:11000!important;}
    .z-\\[12000\\]{z-index:12000!important;}
    .z-\\[12500\\]{z-index:12500!important;}
    .z-\\[20000\\]{z-index:20000!important;}
    .z-\\[22000\\]{z-index:22000!important;}

    /* Native QMES modal backdrops used by IQC/PQC/OQC/report screens. */
    .qmes-modal-backdrop,
    .qmes-iqc-modal-backdrop,
    .qmes-inspection-modal-backdrop{
      position:fixed!important;
      inset:0!important;
      z-index:22000!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      box-sizing:border-box!important;
    }

    /* Do not let a stale print class hide normal application dialogs. */
    body:not(.qmes-print-active) .qmes-modal-backdrop,
    body:not(.qmes-print-active) [role="dialog"]{
      visibility:visible;
    }

    body:has(.qmes-preview-dashboard),#root:has(.qmes-preview-dashboard),main:has(.qmes-preview-dashboard){background:#f5f7fb!important;}
    .qmes-preview-dashboard{background:#f5f7fb!important;}

    .qmes-iqc-page .qmes-iqc-new-btn{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;}
    .qmes-pqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut]),
    .qmes-oqc-page .qmes-inspection-new-btn:not([data-qmes-field-shortcut]){display:none!important;visibility:hidden!important;}
    .qmes-pqc-page [data-qmes-field-shortcut],
    .qmes-oqc-page [data-qmes-field-shortcut]{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;}
  `;
  document.head.appendChild(style);
})(window);

/* Do not start shared DB sync until server-backed authentication exists. */
(function guardSharedSyncUntilAuthenticated(){
  'use strict';
  if(window.__QMES_SHARED_SYNC_AUTH_GUARD__) return;
  window.__QMES_SHARED_SYNC_AUTH_GUARD__=true;

  const guardedNames=[
    'qmesSyncPullWorkOrders','qmesSyncWorkOrder','qmesSyncPullInspection',
    'qmesSyncPushPendingInspections','qmesSyncPullEquipment','qmesSyncPushPendingEquipment'
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
