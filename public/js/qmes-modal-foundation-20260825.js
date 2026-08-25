/* Shared QMES modal foundation. Keeps native React dialogs visible and edit actions non-submit. */
(function(){
  'use strict';
  if(window.__QMES_SAFE_MODAL_FOUNDATION_V3__) return;
  window.__QMES_SAFE_MODAL_FOUNDATION_V3__=true;

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

    body:has(.qmes-modal-backdrop) #root>div>main,
    body:has([role="dialog"][aria-modal="true"]) #root>div>main{
      overflow:visible!important;
      transform:none!important;
      filter:none!important;
      contain:none!important;
      isolation:auto!important;
    }
  `;
  document.getElementById('qmes-safe-modal-foundation')?.remove();
  document.head.appendChild(style);

  function isEditButton(button){
    if(!button || button.tagName!=='BUTTON') return false;
    const text=String(button.textContent||'').replace(/\s+/g,' ').trim();
    const title=String(button.getAttribute('title')||'').trim();
    return text==='수정' || text.endsWith(' 수정') || title==='수정' ||
      button.classList.contains('qmes-iqc-action-edit') ||
      button.classList.contains('qmes-coa-edit-btn');
  }

  function prepareEdit(event){
    const button=event.target?.closest?.('button');
    if(!isEditButton(button)) return;
    button.type='button';
    if(!document.getElementById('qmes-print-root')?.children.length){
      document.body?.classList.remove('print-doc','print-label','qmes-preview-scroll-lock');
      document.documentElement.classList.remove('qmes-preview-scroll-lock');
    }
  }

  // Runs before the browser's default button action, but never prevents or stops the native React click.
  document.addEventListener('pointerdown',prepareEdit,true);
  document.addEventListener('mousedown',prepareEdit,true);
  document.addEventListener('click',prepareEdit,true);
})();
