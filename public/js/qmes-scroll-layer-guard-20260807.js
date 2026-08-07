(function(){
  "use strict";
  if(window.__QMES_SCROLL_LAYER_GUARD_V2__) return;
  window.__QMES_SCROLL_LAYER_GUARD_V2__=true;

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
    [class*="print-preview"]{z-index:500!important;}

    /* If a preview has its own toolbar, keep the action buttons visible while scrolling. */
    [role="dialog"] [class*="toolbar"],
    [class*="preview"] [class*="toolbar"],
    [class*="print-preview"] [class*="toolbar"]{
      position:sticky;
      top:0;
      z-index:2;
    }

    @media print{
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

  reinforce();
  requestAnimationFrame(reinforce);
  window.addEventListener('load',reinforce);
  document.addEventListener('qmes:data-updated',reinforce);
})();
