(function(){
  "use strict";
  if(window.__QMES_PRINT_SIDEBAR_GUARD_V4__) return;
  window.__QMES_PRINT_SIDEBAR_GUARD_V4__=true;

  document.getElementById('qmes-print-sidebar-guard-style')?.remove();

  const style=document.createElement('style');
  style.id='qmes-print-sidebar-guard-style';
  style.textContent=`
    body.qmes-printing #qmes-sync-sidebar,
    body.qmes-printing #qmes-sync-hamburger,
    body.print-doc #qmes-sync-sidebar,
    body.print-doc #qmes-sync-hamburger,
    body.print-label #qmes-sync-sidebar,
    body.print-label #qmes-sync-hamburger,
    body.qmes-screen-exact-print #qmes-sync-sidebar,
    body.qmes-screen-exact-print #qmes-sync-hamburger,
    #qmes-print-root #qmes-sync-sidebar,
    #qmes-print-root #qmes-sync-hamburger{
      display:none!important;
      visibility:hidden!important;
      opacity:0!important;
      pointer-events:none!important;
    }
    body.qmes-printing main,
    body.qmes-printing #root>div>main,
    body.qmes-printing .qmes-main,
    body.qmes-printing .qmes-content,
    body.print-doc main,
    body.print-doc #root>div>main,
    body.print-doc .qmes-main,
    body.print-doc .qmes-content,
    body.print-label main,
    body.print-label #root>div>main,
    body.print-label .qmes-main,
    body.print-label .qmes-content,
    body.qmes-screen-exact-print main,
    body.qmes-screen-exact-print #root>div>main,
    body.qmes-screen-exact-print .qmes-main,
    body.qmes-screen-exact-print .qmes-content{
      margin-left:0!important;
      width:100%!important;
      max-width:none!important;
      transform:none!important;
    }
    @media print{
      #qmes-sync-sidebar,
      #qmes-sync-hamburger{
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

  let printClickActive=false;
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  const printRoot=()=>document.getElementById('qmes-print-root');

  function restoreTopMenus(){
    document.querySelectorAll('.qmes-top-menu,.qmes-top-menu-bar,#qmes-all-menu-dropdown,.qmes-submenu,.qmes-submenu-button').forEach(node=>{
      ['display','visibility','opacity','pointer-events'].forEach(prop=>node.style.removeProperty(prop));
    });
  }

  function scrubPrintRoot(){
    const root=printRoot();
    if(!root) return;
    root.querySelectorAll('#qmes-sync-sidebar,#qmes-sync-hamburger').forEach(node=>node.remove());
  }

  const startPrint=()=>{
    document.body?.classList.add('qmes-printing');
    scrubPrintRoot();
  };
  const endPrint=()=>{
    printClickActive=false;
    document.body?.classList.remove('qmes-printing');
    restoreTopMenus();
  };

  restoreTopMenus();
  requestAnimationFrame(restoreTopMenus);
  setTimeout(restoreTopMenus,80);

  window.addEventListener('beforeprint',startPrint);
  window.addEventListener('afterprint',endPrint);
  window.addEventListener('focus',()=>{
    if(printClickActive) setTimeout(endPrint,250);
    else restoreTopMenus();
  });

  if(window.matchMedia){
    const media=window.matchMedia('print');
    const onChange=e=>e.matches?startPrint():endPrint();
    if(media.addEventListener) media.addEventListener('change',onChange);
    else if(media.addListener) media.addListener(onChange);
  }

  const observer=new MutationObserver(()=>{
    scrubPrintRoot();
    if(!document.body?.classList.contains('qmes-printing')) restoreTopMenus();
    if(document.body?.classList.contains('print-doc')||document.body?.classList.contains('print-label')||document.body?.classList.contains('qmes-screen-exact-print')){
      const side=document.getElementById('qmes-sync-sidebar');
      const hamburger=document.getElementById('qmes-sync-hamburger');
      if(side) side.style.setProperty('display','none','important');
      if(hamburger) hamburger.style.setProperty('display','none','important');
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

  document.addEventListener('click',event=>{
    const target=event.target.closest('button,a,[role="button"]');
    if(!target)return;
    const text=clean(target.textContent||target.getAttribute('aria-label')||target.getAttribute('title'));
    if(/^(인쇄|출력|인쇄하기|출력하기)$/.test(text)||/(^|\s)(인쇄|출력)(\s|$)/.test(text)){
      printClickActive=true;
      startPrint();
      requestAnimationFrame(()=>{startPrint();scrubPrintRoot();});
      setTimeout(()=>{startPrint();scrubPrintRoot();},0);
      setTimeout(scrubPrintRoot,80);
      setTimeout(scrubPrintRoot,220);
      return;
    }
    if(printClickActive&&/^(닫기|취소|돌아가기)$/.test(text)) endPrint();
  },true);
})();