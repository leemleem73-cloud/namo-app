/* QMES UI cleanup — removes stale global patch side-effects without intercepting React clicks. */
(function(global){
  'use strict';
  if(global.__QMES_UI_CLEANUP_20260825__) return;
  global.__QMES_UI_CLEANUP_20260825__=true;

  function restoreElementRemove(){
    try{
      Element.prototype.remove=function(){
        if(this.parentNode) this.parentNode.removeChild(this);
      };
    }catch(error){console.warn('[QMES] Element.remove 복구 실패',error);}
  }

  function clearStaleRuntimeState(){
    document.documentElement.classList.remove('qmes-preview-scroll-lock');
    document.body?.classList.remove('qmes-preview-scroll-lock');
    if(!document.getElementById('qmes-print-root')?.children.length){
      document.body?.classList.remove('print-doc','print-label');
    }
    document.getElementById('qmes-standalone-edit')?.remove();
    document.getElementById('qmes-edit-diagnostic-overlay')?.remove();
    document.getElementById('qmes-inspection-control-recovery-style')?.remove();
  }

  function normalizeActionButtons(){
    const selectors=[
      '.qmes-iqc-action-edit',
      '.qmes-iqc-action-print',
      '.qmes-iqc-action-label',
      '.qmes-iqc-action-delete',
      '.qmes-manage-btn',
      '.qmes-pqc-value-preview-btn'
    ].join(',');
    document.querySelectorAll(selectors).forEach(button=>{
      if(button.tagName==='BUTTON') button.type='button';
      button.style.removeProperty('pointer-events');
    });
  }

  function run(){
    restoreElementRemove();
    clearStaleRuntimeState();
    normalizeActionButtons();
  }

  function schedule(){
    requestAnimationFrame(run);
    setTimeout(run,80);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
  window.addEventListener('load',run,{once:true});
  window.addEventListener('qmes:navigate-tab',schedule);
  window.addEventListener('qmes:mes-master-ready',schedule);
  window.addEventListener('qmes:open-field-inspection',schedule);
  document.addEventListener('click',event=>{
    if(event.target?.closest?.('.qmes-top-menu-button,.qmes-submenu-button')) schedule();
  },false);

  global.qmesRunUiCleanup=run;
})(window);
