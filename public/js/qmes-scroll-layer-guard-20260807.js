(function(){
  "use strict";
  if(window.__QMES_SCROLL_LAYER_GUARD_V10__) return;
  window.__QMES_SCROLL_LAYER_GUARD_V10__=true;

  const REPORT_BACKDROP='.qmes-modal-backdrop:has(.qmes-iqc2-paper)';
  const REPORT_SELECTOR=`${REPORT_BACKDROP} .qmes-wo-viewer`;

  const style=document.createElement('style');
  style.id='qmes-scroll-layer-guard-style';
  style.textContent=`
    header{z-index:40!important;isolation:isolate!important;}
    .qmes-top-menu-bar{z-index:41!important;isolation:isolate!important;}
    .qmes-top-menu{z-index:42!important;isolation:isolate!important;}
    #qmes-all-menu-dropdown{z-index:120!important;}
    #qmes-user-dropdown{z-index:130!important;}
    #qmes-sync-hamburger{z-index:140!important;}
    #qmes-sync-sidebar{z-index:150!important;}

    html.qmes-preview-scroll-lock,body.qmes-preview-scroll-lock{
      overflow:hidden!important;
      overscroll-behavior:none!important;
      height:100%!important;
    }

    /* Inspection reports only: cover the entire viewport so no outside screen is visible. */
    ${REPORT_BACKDROP}{
      position:fixed!important;
      inset:0!important;
      width:100vw!important;
      height:100dvh!important;
      min-width:100vw!important;
      min-height:100dvh!important;
      margin:0!important;
      padding:0!important;
      overflow-y:auto!important;
      overflow-x:hidden!important;
      overscroll-behavior:contain!important;
      display:block!important;
      background:#0b1728!important;
      opacity:1!important;
      isolation:isolate!important;
      z-index:2147483000!important;
    }

    /* Remove the rounded outer viewer shell/margins for IQC/PQC/OQC preview only. */
    ${REPORT_SELECTOR}{
      position:relative!important;
      width:100vw!important;
      max-width:none!important;
      min-height:100dvh!important;
      margin:0!important;
      padding:20px 28px 28px!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
      overflow:visible!important;
      background:#0b1728!important;
      z-index:2147483001!important;
    }

    /* Fixed inspection report toolbar. The solid background prevents the paper from showing through. */
    ${REPORT_SELECTOR} > .qmes-wo-viewer-head{
      position:sticky!important;
      top:0!important;
      left:0!important;
      right:0!important;
      z-index:2147483640!important;
      margin:-20px -28px 12px!important;
      padding:20px 28px 12px!important;
      background:#0b1728!important;
      background-color:#0b1728!important;
      opacity:1!important;
      isolation:isolate!important;
    }

    /* Quality report paper always stays below the fixed toolbar. */
    ${REPORT_SELECTOR} .qmes-iqc2-paper{
      position:relative!important;
      z-index:1!important;
      margin-top:0!important;
    }

    @media print{
      html,body{overflow:visible!important;height:auto!important;background:#fff!important;}
      body > #root{display:none!important;visibility:hidden!important;}
      body > #qmes-print-root{
        display:block!important;visibility:visible!important;position:static!important;
        inset:auto!important;width:auto!important;height:auto!important;overflow:visible!important;background:#fff!important;
      }
      ${REPORT_SELECTOR} > .qmes-wo-viewer-head{position:static!important;margin:0!important;padding:0!important;}
      header,.qmes-top-menu-bar,.qmes-top-menu{isolation:auto!important;}
    }
  `;
  document.getElementById('qmes-scroll-layer-guard-style')?.remove();
  document.head.appendChild(style);

  function fixLabels(){
    document.querySelectorAll('.qmes-iqc2-table th').forEach((th)=>{
      if((th.textContent||'').trim()==='불합수량') th.textContent='불량수량';
    });
  }

  function reinforce(){
    const header=document.querySelector('header');
    const bar=document.querySelector('.qmes-top-menu-bar');
    const menu=document.querySelector('.qmes-top-menu');
    if(header)header.style.setProperty('z-index','40','important');
    if(bar)bar.style.setProperty('z-index','41','important');
    if(menu)menu.style.setProperty('z-index','42','important');
    fixLabels();
  }

  function syncPreviewScrollLock(){
    const isOpen=!!document.querySelector(REPORT_SELECTOR);
    document.documentElement.classList.toggle('qmes-preview-scroll-lock',isOpen);
    document.body?.classList.toggle('qmes-preview-scroll-lock',isOpen);
  }

  let queued=false;
  function queueSync(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;reinforce();syncPreviewScrollLock();});
  }

  const observer=new MutationObserver(queueSync);
  const startObserver=()=>{if(document.body)observer.observe(document.body,{childList:true,subtree:true});queueSync();};
  reinforce();
  requestAnimationFrame(reinforce);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver,{once:true});else startObserver();
  window.addEventListener('load',queueSync);
  document.addEventListener('qmes:data-updated',queueSync);
  window.addEventListener('beforeprint',()=>{
    fixLabels();
    document.documentElement.classList.remove('qmes-preview-scroll-lock');
    document.body?.classList.remove('qmes-preview-scroll-lock');
  });
  window.addEventListener('afterprint',queueSync);
})();
