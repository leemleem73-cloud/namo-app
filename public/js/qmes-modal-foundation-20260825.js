/* Safe global modal foundation. No click interception, no observers. */
(function(){
  'use strict';
  if(window.__QMES_SAFE_MODAL_FOUNDATION_V2__) return;
  window.__QMES_SAFE_MODAL_FOUNDATION_V2__=true;
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

    .qmes-modal-backdrop,
    .qmes-iqc-modal-backdrop,
    .qmes-inspection-modal-backdrop{
      position:fixed!important;
      inset:0!important;
      z-index:22000!important;
      visibility:visible!important;
      opacity:1!important;
      pointer-events:auto!important;
      align-items:center!important;
      justify-content:center!important;
    }
    .qmes-iqc-modal-backdrop,
    .qmes-inspection-modal-backdrop{display:flex!important;}
    .qmes-iqc-modal,
    .qmes-inspection-modal{
      position:relative!important;
      z-index:22001!important;
      visibility:visible!important;
      opacity:1!important;
      pointer-events:auto!important;
    }
    body:not(.print-doc):not(.print-label) .qmes-modal-backdrop{
      visibility:visible!important;
      opacity:1!important;
      pointer-events:auto!important;
    }
  `;
  document.getElementById('qmes-safe-modal-foundation')?.remove();
  document.head.appendChild(style);
})();
