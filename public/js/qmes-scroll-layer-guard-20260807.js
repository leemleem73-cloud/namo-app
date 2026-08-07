(function(){
  "use strict";
  if(window.__QMES_SCROLL_LAYER_GUARD_V3__) return;
  window.__QMES_SCROLL_LAYER_GUARD_V3__=true;

  const PREVIEW_SELECTOR=[
    '.qmes-modal-backdrop .qmes-coa-viewer',
    '.qmes-modal-backdrop .qmes-wo-output-preview',
    '.qmes-modal-backdrop .qmes-label-viewer',
    '[role="dialog"] [class*="preview"]',
    '[class*="print-preview"]'
  ].join(',');

  const style=document.createElement('style');
  style.id='qmes-scroll-layer-guard-style';
  style.textContent=`
    /* Normal page content/sticky rows stay below the application shell. */
    header{z-index:40!important;isolation:isolate!important;}
    .qmes-top-menu-bar{z-index:41!important;isolation:isolate!important;}
    .qmes-top-menu{z-index:42!important;isolation:isolate!important;}

    /* Menus sit above the shell. */
    #qmes-all-menu-dropdown{z-index:120!important;}
    #qmes-user-dropdown{z-index:130!important;}
    #qmes-sync-hamburger{z-index:140!important;}
    #qmes-sync-sidebar{z-index:150!important;}

    /* Preview / print / modal layers must always remain above the shell. */
    [role="dialog"],dialog,
    .fixed.inset-0,
    [class*="modal"],
    [class*="preview"],
    [class*="print-preview"],
    .qmes-modal-backdrop{z-index:500!important;}

    /* The active preview owns the viewport. Background page must never scroll through it. */
    html.qmes-preview-scroll-lock,
    body.qmes-preview-scroll-lock{
      overflow:hidden!important;
      overscroll-behavior:none!important;
      height:100%!important;
    }

    body.qmes-preview-scroll-lock #root{
      overscroll-behavior:none!important;
    }

    .qmes-modal-backdrop{
      position:fixed!important;
      inset:0!important;
      overflow:auto!important;
      overscroll-behavior:contain!important;
      isolation:isolate!important;
      background-clip:padding-box!important;
    }

    .qmes-modal-backdrop .qmes-coa-viewer,
    .qmes-modal-backdrop .qmes-wo-output-preview,
    .qmes-modal-backdrop .qmes-label-viewer{
      max-height:calc(100dvh - 24px)!important;
      overflow-y:auto!important;
      overscroll-behavior:contain!important;
      -webkit-overflow-scrolling:touch;
      position:relative!important;
      z-index:1!important;
    }

    /* If a preview has its own toolbar, keep the action buttons visible while scrolling. */
    [role="dialog"] [class*="toolbar"],
    [class*="preview"] [class*="toolbar"],
    [class*="print-preview"] [class*="toolbar"],
    .qmes-modal-backdrop .qmes-wo-viewer-head{
      position:sticky;
      top:0;
      z-index:3;
    }

    @media print{
      html.qmes-preview-scroll-lock,
      body.qmes-preview-scroll-lock{overflow:visible!important;height:auto!important;}
      header,.qmes-top-menu-bar,.qmes-top-menu{isolation:auto!important;}
    }
  `;
  document.getElementById('qmes-scroll-layer-guard-style')?.remove();
  document.head.appendChild(style);

  function reinforce(){
    const header=document.querySelector('header');
    const bar=document.querySelector('.qmes-top-menu-bar');
    const menu=document.querySelector('.qmes-top-menu');
    if(header)header.style.setProperty('z-index','40','important');
    if(bar)bar.style.setProperty('z-index','41','important');
    if(menu)menu.style.setProperty('z-index','42','important');
  }

  function syncPreviewScrollLock(){
    const isOpen=!!document.querySelector(PREVIEW_SELECTOR);
    document.documentElement.classList.toggle('qmes-preview-scroll-lock',isOpen);
    document.body?.classList.toggle('qmes-preview-scroll-lock',isOpen);
  }

  let queued=false;
  function queueSync(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      reinforce();
      syncPreviewScrollLock();
    });
  }

  const observer=new MutationObserver(queueSync);
  const startObserver=()=>{
    if(document.body) observer.observe(document.body,{childList:true,subtree:true});
    queueSync();
  };

  reinforce();
  requestAnimationFrame(reinforce);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',startObserver,{once:true});
  else startObserver();
  window.addEventListener('load',queueSync);
  document.addEventListener('qmes:data-updated',queueSync);
  window.addEventListener('beforeprint',()=>{
    document.documentElement.classList.remove('qmes-preview-scroll-lock');
    document.body?.classList.remove('qmes-preview-scroll-lock');
  });
  window.addEventListener('afterprint',queueSync);
})();
