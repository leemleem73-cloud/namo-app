/* Field input recovery helper.
 * Keep only the remarks-width repair here.
 * IMPORTANT: do not inject the old 2026-08-12 equipment stylesheet; the live page already carries the newer 2026-08-24 equipment design. */
(function(){
  'use strict';
  if(window.__QMES_FIELD_INPUT_UI_FINAL_RESTORE_20260814__) return;
  window.__QMES_FIELD_INPUT_UI_FINAL_RESTORE_20260814__=true;

  /* Remove the legacy recovery sheet if a cached page injected it earlier. */
  document.querySelectorAll('link[data-qmes-equipment-known-good]').forEach(node=>node.remove());

  function mode(){
    const active=document.querySelector('.qmes-ipad-mode-tabs button.is-active');
    const text=String(active?.textContent||'').toUpperCase();
    if(text.includes('PQC')) return 'PQC';
    if(text.includes('OQC')) return 'OQC';
    if(text.includes('IQC')) return 'IQC';
    return '';
  }
  function applyRemarks(){
    document.querySelectorAll('.qmes-pqc-oqc-remarks-wide').forEach(node=>node.classList.remove('qmes-pqc-oqc-remarks-wide'));
    if(!['PQC','OQC'].includes(mode())) return;
    document.querySelectorAll('.qmes-ipad-pop .qmes-ipad-form-grid label').forEach(label=>{
      const caption=String(label.querySelector('span')?.textContent||'').replace(/\s+/g,' ').trim();
      if(caption==='비고') label.classList.add('qmes-pqc-oqc-remarks-wide');
    });
  }
  const style=document.createElement('style');
  style.id='qmes-field-remarks-wide-restore';
  style.textContent=`
    html body .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-oqc-remarks-wide{grid-column:1/-1!important;width:100%!important;min-width:0!important;max-width:none!important;}
    html body .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-oqc-remarks-wide input{width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;}
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);
  applyRemarks();
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyRemarks();});}).observe(document.documentElement,{childList:true,subtree:true});
})();