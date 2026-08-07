(function(){
  "use strict";
  if(window.__QMES_SCROLL_LAYER_GUARD_V14__) return;
  window.__QMES_SCROLL_LAYER_GUARD_V14__=true;

  const REPORT_BACKDROP=[
    '.qmes-modal-backdrop:has(.qmes-iqc-doc)',
    '.qmes-modal-backdrop:has(.qmes-pqc-doc)',
    '.qmes-modal-backdrop:has(.qmes-oqc-doc)'
  ].join(',');

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

    /* IQC / PQC / OQC only. Work-order preview remains untouched. */
    ${REPORT_BACKDROP}{
      position:fixed!important;
      inset:0!important;
      width:100vw!important;
      height:100dvh!important;
      margin:0!important;
      padding:0!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      overflow:hidden!important;
      background:#07111f!important;
      z-index:2147483000!important;
    }

    /* Same scroll model as the working work-order preview. */
    ${REPORT_BACKDROP} > .qmes-wo-viewer{
      position:relative!important;
      width:min(1260px,98vw)!important;
      max-width:none!important;
      height:96vh!important;
      max-height:96vh!important;
      margin:0!important;
      padding:14px 20px 24px!important;
      overflow:auto!important;
      overscroll-behavior:contain!important;
      background:#0b1728!important;
      border:1px solid #29415f!important;
      border-radius:14px!important;
      box-shadow:0 28px 80px rgba(0,0,0,.58)!important;
      z-index:2147483001!important;
    }

    /* Copy the work-order sticky header behavior exactly. The divider line stays with this bar. */
    ${REPORT_BACKDROP} > .qmes-wo-viewer > .qmes-wo-viewer-head{
      position:sticky!important;
      top:-14px!important;
      z-index:20!important;
      margin:-14px -20px 10px!important;
      padding:12px 20px!important;
      background:#0b1728!important;
      opacity:1!important;
      border-bottom:1px solid #263b54!important;
    }

    /* Report paper scrolls under the fixed header, just like the work-order paper. */
    ${REPORT_BACKDROP} > .qmes-wo-viewer > .qmes-iqc-doc,
    ${REPORT_BACKDROP} > .qmes-wo-viewer > .qmes-pqc-doc,
    ${REPORT_BACKDROP} > .qmes-wo-viewer > .qmes-oqc-doc{
      position:relative!important;
      z-index:1!important;
      margin:22px auto 32px!important;
    }

    @media print{
      html,body{overflow:visible!important;height:auto!important;background:#fff!important;}
      body > #root{display:none!important;visibility:hidden!important;}
      body > #qmes-print-root{
        display:block!important;
        visibility:visible!important;
        position:static!important;
        inset:auto!important;
        width:auto!important;
        height:auto!important;
        overflow:visible!important;
        background:#fff!important;
      }
      ${REPORT_BACKDROP} > .qmes-wo-viewer > .qmes-wo-viewer-head{
        position:static!important;
        margin:0!important;
        padding:0!important;
        border-bottom:0!important;
      }
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

  function reportIsOpen(){
    return !!document.querySelector('.qmes-modal-backdrop:has(.qmes-iqc-doc),.qmes-modal-backdrop:has(.qmes-pqc-doc),.qmes-modal-backdrop:has(.qmes-oqc-doc)');
  }

  function syncPreviewScrollLock(){
    const isOpen=reportIsOpen();
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
  const startObserver=()=>{
    if(document.body)observer.observe(document.body,{childList:true,subtree:true});
    queueSync();
  };

  reinforce();
  requestAnimationFrame(reinforce);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver,{once:true});
  else startObserver();
  window.addEventListener('load',queueSync);
  document.addEventListener('qmes:data-updated',queueSync);
  window.addEventListener('beforeprint',()=>{
    fixLabels();
    document.documentElement.classList.remove('qmes-preview-scroll-lock');
    document.body?.classList.remove('qmes-preview-scroll-lock');
  });
  window.addEventListener('afterprint',queueSync);
})();
