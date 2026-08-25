/* Safe global modal foundation. No click interception, no observers. */
(function(){
  'use strict';
  if(window.__QMES_SAFE_MODAL_FOUNDATION__) return;
  window.__QMES_SAFE_MODAL_FOUNDATION__=true;
  const style=document.createElement('style');
  style.id='qmes-safe-modal-foundation';
  style.textContent=`
    .fixed{position:fixed!important;}
    .inset-0{top:0!important;right:0!important;bottom:0!important;left:0!important;}
    .z-\\[10000\\]{z-index:10000!important;}
    .z-\\[11000\\]{z-index:11000!important;}
    .z-\\[12000\\]{z-index:12000!important;}
    .z-\\[12500\\]{z-index:12500!important;}
    .z-\\[20000\\]{z-index:20000!important;}
    .z-\\[22000\\]{z-index:22000!important;}
    .qmes-modal-backdrop,.qmes-iqc-modal-backdrop,.qmes-inspection-modal-backdrop{
      position:fixed!important;
      inset:0!important;
      z-index:22000!important;
    }
  `;
  document.head.appendChild(style);
})();
