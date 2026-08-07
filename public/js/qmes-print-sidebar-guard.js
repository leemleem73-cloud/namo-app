(function(){
  "use strict";
  if(window.__QMES_PRINT_SIDEBAR_GUARD__) return;
  window.__QMES_PRINT_SIDEBAR_GUARD__=true;

  const style=document.createElement('style');
  style.id='qmes-print-sidebar-guard-style';
  style.textContent=`
    body.qmes-printing #qmes-sync-sidebar,
    body.qmes-printing #qmes-sync-hamburger,
    body.qmes-printing .qmes-top-menu,
    body.qmes-printing .qmes-top-menu-bar,
    body.qmes-printing #qmes-all-menu-dropdown{
      display:none!important;
      visibility:hidden!important;
      opacity:0!important;
      pointer-events:none!important;
    }
    body.qmes-printing main,
    body.qmes-printing #root>div>main,
    body.qmes-printing .qmes-main,
    body.qmes-printing .qmes-content{
      margin-left:0!important;
      width:100%!important;
      max-width:none!important;
      transform:none!important;
    }
    @media print{
      #qmes-sync-sidebar,
      #qmes-sync-hamburger,
      .qmes-top-menu,
      .qmes-top-menu-bar,
      #qmes-all-menu-dropdown{
        display:none!important;
        visibility:hidden!important;
        opacity:0!important;
        pointer-events:none!important;
      }
      body.qmes-side-open main,
      body.qmes-side-open #root>div>main,
      body.qmes-side-open .qmes-main,
      body.qmes-side-open .qmes-content,
      main,
      #root>div>main,
      .qmes-main,
      .qmes-content{
        margin-left:0!important;
        width:100%!important;
        max-width:none!important;
        transform:none!important;
      }
    }
  `;
  document.head.appendChild(style);

  const startPrint=()=>document.body?.classList.add('qmes-printing');
  const endPrint=()=>document.body?.classList.remove('qmes-printing');

  window.addEventListener('beforeprint',startPrint);
  window.addEventListener('afterprint',endPrint);

  if(window.matchMedia){
    const media=window.matchMedia('print');
    const onChange=e=>e.matches?startPrint():endPrint();
    if(media.addEventListener) media.addEventListener('change',onChange);
    else if(media.addListener) media.addListener(onChange);
  }
})();