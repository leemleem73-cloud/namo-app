/* QMES report preview layer — safe scoped version.
   No global header/body mutation and no MutationObserver. */
(function(){
  'use strict';
  if(window.__QMES_SCROLL_LAYER_GUARD_SAFE__) return;
  window.__QMES_SCROLL_LAYER_GUARD_SAFE__=true;

  const REPORT_BACKDROP='.qmes-modal-backdrop:has(.qmes-iqc2-paper)';
  const REPORT_SELECTOR=`${REPORT_BACKDROP} .qmes-wo-viewer`;
  document.getElementById('qmes-scroll-layer-guard-style')?.remove();
  const style=document.createElement('style');
  style.id='qmes-scroll-layer-guard-style';
  style.textContent=`
    ${REPORT_BACKDROP}{
      position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;
      margin:0!important;padding:0!important;overflow:hidden!important;
      display:block!important;background:#0b1728!important;opacity:1!important;
      z-index:2147483000!important;
    }
    ${REPORT_SELECTOR}{
      position:relative!important;width:100vw!important;max-width:none!important;height:100dvh!important;
      min-height:100dvh!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;
      box-shadow:none!important;overflow:hidden!important;background:#0b1728!important;
      display:grid!important;grid-template-rows:auto minmax(0,1fr)!important;
    }
    ${REPORT_SELECTOR}>.qmes-wo-viewer-head{
      position:relative!important;margin:0!important;padding:20px 28px 12px!important;
      min-height:88px!important;box-sizing:border-box!important;background:#0b1728!important;
      border-bottom:1px solid #2c4a72!important;
    }
    ${REPORT_SELECTOR}>.qmes-iqc2-paper{
      position:relative!important;min-height:0!important;height:auto!important;max-height:none!important;
      margin:0!important;padding-top:12px!important;padding-bottom:28px!important;
      overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;
    }
    ${REPORT_SELECTOR}>.qmes-iqc2-paper>*:first-child{margin-left:auto!important;margin-right:auto!important;}
    @media print{
      ${REPORT_SELECTOR}{display:block!important;height:auto!important;min-height:0!important;overflow:visible!important;background:#fff!important;}
      ${REPORT_SELECTOR}>.qmes-wo-viewer-head{position:static!important;min-height:0!important;margin:0!important;padding:0!important;border-bottom:0!important;}
      ${REPORT_SELECTOR}>.qmes-iqc2-paper{position:static!important;overflow:visible!important;padding:0!important;}
    }
  `;
  document.head.appendChild(style);

  function fixLabels(){
    document.querySelectorAll('.qmes-iqc2-table th').forEach(th=>{
      if((th.textContent||'').trim()==='불합수량') th.textContent='불량수량';
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fixLabels,{once:true}); else fixLabels();
  window.addEventListener('beforeprint',fixLabels);
  document.addEventListener('qmes:data-updated',fixLabels);
})();
