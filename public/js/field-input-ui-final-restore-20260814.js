/* Load the known-good 2026-08-12 field/equipment styling without extra runtime overrides. */
(function(){
  'use strict';
  if(window.__QMES_FIELD_INPUT_UI_FINAL_RESTORE_20260814__) return;
  window.__QMES_FIELD_INPUT_UI_FINAL_RESTORE_20260814__=true;

  if(!document.querySelector('link[data-qmes-equipment-known-good]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='./css/equipment-management-restored-20260812.css?v=20260814-restore2';
    link.dataset.qmesEquipmentKnownGood='1';
    document.head.appendChild(link);
  }

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
  document.head.appendChild(style);
  applyRemarks();
  let queued=false;
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyRemarks();});}).observe(document.documentElement,{childList:true,subtree:true});
})();