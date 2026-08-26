(function(){
  "use strict";
  if(window.__QMES_SCROLL_LAYER_GUARD_V15__) return;
  window.__QMES_SCROLL_LAYER_GUARD_V15__=true;

  const REPORT_BACKDROP='.qmes-modal-backdrop:has(.qmes-iqc2-paper)';
  const REPORT_SELECTOR=`${REPORT_BACKDROP} .qmes-wo-viewer`;

  /* Preview-only rules. Global header/menu/scrollbar layout is owned by the main CSS. */
  const style=document.createElement('style');
  style.id='qmes-scroll-layer-guard-style';
  style.textContent=`
    html.qmes-preview-scroll-lock,body.qmes-preview-scroll-lock{
      overflow:hidden!important;overscroll-behavior:none!important;height:100%!important;
    }
    ${REPORT_BACKDROP}{
      position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;
      margin:0!important;padding:0!important;overflow:hidden!important;
      display:block!important;background:#0b1728!important;opacity:1!important;
      isolation:isolate!important;z-index:2147483000!important;
    }
    ${REPORT_SELECTOR}{
      position:relative!important;width:100vw!important;max-width:none!important;height:100dvh!important;
      min-height:100dvh!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;
      box-shadow:none!important;overflow:hidden!important;background:#0b1728!important;z-index:2147483001!important;
      display:grid!important;grid-template-rows:auto minmax(0,1fr)!important;
    }
    ${REPORT_SELECTOR} > .qmes-wo-viewer-head{
      position:relative!important;z-index:2147483640!important;margin:0!important;padding:20px 28px 12px!important;
      min-height:88px!important;box-sizing:border-box!important;background:#0b1728!important;opacity:1!important;
      isolation:isolate!important;flex-shrink:0!important;border-bottom:1px solid #2c4a72!important;
    }
    ${REPORT_SELECTOR} > .qmes-iqc2-paper{
      position:relative!important;z-index:1!important;min-height:0!important;height:auto!important;max-height:none!important;
      margin:0!important;padding-top:12px!important;padding-bottom:28px!important;overflow-y:auto!important;overflow-x:hidden!important;
      overscroll-behavior:contain!important;scrollbar-gutter:stable!important;
    }
    ${REPORT_SELECTOR} > .qmes-iqc2-paper > *:first-child{margin-left:auto!important;margin-right:auto!important;}
    @media print{
      html,body{overflow:visible!important;height:auto!important;background:#fff!important;}
      body > #root{display:none!important;visibility:hidden!important;}
      body > #qmes-print-root{display:block!important;visibility:visible!important;position:static!important;inset:auto!important;width:auto!important;height:auto!important;overflow:visible!important;background:#fff!important;}
      ${REPORT_SELECTOR}{display:block!important;height:auto!important;min-height:0!important;}
      ${REPORT_SELECTOR} > .qmes-wo-viewer-head{position:static!important;min-height:0!important;margin:0!important;padding:0!important;border-bottom:0!important;}
      ${REPORT_SELECTOR} > .qmes-iqc2-paper{position:static!important;overflow:visible!important;padding:0!important;}
    }
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function fixLabels(){
    document.querySelectorAll('.qmes-iqc2-table th').forEach(th=>{
      if((th.textContent||'').trim()==='불합수량') th.textContent='불량수량';
    });
  }

  function syncPreviewScrollLock(){
    const isOpen=!!document.querySelector(REPORT_SELECTOR);
    document.documentElement.classList.toggle('qmes-preview-scroll-lock',isOpen);
    document.body?.classList.toggle('qmes-preview-scroll-lock',isOpen);
    fixLabels();
  }

  let queued=false;
  function queueSync(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;syncPreviewScrollLock();});
  }

  const observer=new MutationObserver(queueSync);
  const startObserver=()=>{if(document.body)observer.observe(document.body,{childList:true,subtree:true});queueSync();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver,{once:true});else startObserver();
  window.addEventListener('load',queueSync);
  document.addEventListener('qmes:data-updated',queueSync);
  window.addEventListener('beforeprint',()=>{fixLabels();document.documentElement.classList.remove('qmes-preview-scroll-lock');document.body?.classList.remove('qmes-preview-scroll-lock');});
  window.addEventListener('afterprint',queueSync);
})();
