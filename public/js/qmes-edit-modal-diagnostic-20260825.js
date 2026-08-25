/* Non-invasive diagnostics for edit modal failures. Does not prevent or modify clicks. */
(function(){
  'use strict';
  if(window.__QMES_EDIT_MODAL_DIAGNOSTIC__) return;
  window.__QMES_EDIT_MODAL_DIAGNOSTIC__=true;

  function snapshot(label,button){
    const dialogs=[...document.querySelectorAll('[role="dialog"]')];
    const backdrops=[...document.querySelectorAll('.qmes-modal-backdrop,.qmes-iqc-modal-backdrop,.qmes-inspection-modal-backdrop')];
    const fixedLayers=[...document.querySelectorAll('.fixed.inset-0')];
    console.warn('[QMES EDIT DIAG]',label,{
      buttonText:(button?.textContent||'').replace(/\s+/g,' ').trim(),
      buttonClass:button?.className||'',
      dialogs:dialogs.length,
      backdrops:backdrops.length,
      fixedLayers:fixedLayers.length,
      bodyClass:document.body?.className||'',
      htmlClass:document.documentElement?.className||'',
      activeElement:document.activeElement?.tagName||''
    });
  }

  document.addEventListener('click',function(event){
    const button=event.target?.closest?.('button');
    if(!button) return;
    const text=(button.textContent||'').replace(/\s+/g,' ').trim();
    if(!text.includes('수정')) return;
    console.warn('[QMES EDIT DIAG] 수정 클릭 감지',text,button);
    setTimeout(()=>snapshot('after 0ms',button),0);
    setTimeout(()=>snapshot('after 120ms',button),120);
  },false);
})();
