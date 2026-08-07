(function(){
  "use strict";
  if(window.__QMES_SCROLL_LAYER_GUARD__) return;
  window.__QMES_SCROLL_LAYER_GUARD__=true;

  const style=document.createElement('style');
  style.id='qmes-scroll-layer-guard-style';
  style.textContent=`
    header{z-index:11900!important;isolation:isolate!important;}
    .qmes-top-menu-bar{z-index:11920!important;isolation:isolate!important;}
    .qmes-top-menu{z-index:11930!important;isolation:isolate!important;}
    #qmes-all-menu-dropdown{z-index:12120!important;}
    #qmes-user-dropdown{z-index:12130!important;}
    #qmes-sync-hamburger{z-index:12040!important;}
    #qmes-sync-sidebar{z-index:12050!important;}
    [role="dialog"],dialog{z-index:13000;}
    @media print{header,.qmes-top-menu-bar,.qmes-top-menu{isolation:auto!important;}}
  `;
  document.head.appendChild(style);

  function reinforce(){
    const header=document.querySelector('header');
    const bar=document.querySelector('.qmes-top-menu-bar');
    const menu=document.querySelector('.qmes-top-menu');
    if(header)header.style.setProperty('z-index','11900','important');
    if(bar)bar.style.setProperty('z-index','11920','important');
    if(menu)menu.style.setProperty('z-index','11930','important');
  }

  reinforce();
  requestAnimationFrame(reinforce);
  window.addEventListener('load',reinforce);
  document.addEventListener('qmes:data-updated',reinforce);
})();
