(function(){
  "use strict";
  if(window.__QMES_PRINT_SIDEBAR_GUARD_V6__) return;
  window.__QMES_PRINT_SIDEBAR_GUARD_V6__=true;

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
  let sideWasOpen=false;
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

  function clearPrintInlineStyles(){
    const side=document.getElementById('qmes-sync-sidebar');
    const hamburger=document.getElementById('qmes-sync-hamburger');
    [side,hamburger].filter(Boolean).forEach(node=>{
      ['display','visibility','opacity','pointer-events','transform','width','margin-left'].forEach(prop=>node.style.removeProperty(prop));
    });
    document.querySelectorAll('main,#root>div>main,.qmes-main,.qmes-content,.qmes-top-menu').forEach(node=>{
      ['display','visibility','opacity','pointer-events','margin-left','width','max-width','transform'].forEach(prop=>node.style.removeProperty(prop));
    });
  }

  function restoreSidebarLayout(){
    clearPrintInlineStyles();
    if(sideWasOpen) document.body?.classList.add('qmes-side-open');
    const side=document.getElementById('qmes-sync-sidebar');
    if(sideWasOpen && side){
      side.style.setProperty('display','block','important');
      side.style.setProperty('visibility','visible','important');
      side.style.setProperty('opacity','1','important');
      side.style.setProperty('pointer-events','auto','important');
      side.style.setProperty('transform','translate3d(0,0,0)','important');
    }
    window.dispatchEvent(new Event('resize'));
    document.dispatchEvent(new CustomEvent('qmes:sidebar-restored'));
  }

  const startPrint=()=>{
    if(!document.body?.classList.contains('qmes-printing')){
      sideWasOpen=document.body?.classList.contains('qmes-side-open') || false;
    }
    document.body?.classList.add('qmes-printing');
    scrubPrintRoot();
  };

  const endPrint=()=>{
    printClickActive=false;
    document.body?.classList.remove('qmes-printing','print-doc','print-label','qmes-screen-exact-print');
    document.documentElement?.classList.remove('qmes-printing','print-doc','print-label','qmes-screen-exact-print','qmes-printing-now');
    restoreTopMenus();
    restoreSidebarLayout();
    requestAnimationFrame(restoreSidebarLayout);
    setTimeout(restoreSidebarLayout,80);
    setTimeout(restoreSidebarLayout,250);
  };

  restoreTopMenus();
  requestAnimationFrame(restoreTopMenus);
  setTimeout(restoreTopMenus,80);

  window.addEventListener('beforeprint',startPrint);
  window.addEventListener('afterprint',endPrint);
  window.addEventListener('focus',()=>{
    restoreTopMenus();
    if(!window.matchMedia?.('print')?.matches){
      if(document.body?.classList.contains('qmes-printing')) setTimeout(endPrint,80);
      else restoreSidebarLayout();
    }
  });

  if(window.matchMedia){
    const media=window.matchMedia('print');
    const onChange=e=>e.matches?startPrint():endPrint();
    if(media.addEventListener) media.addEventListener('change',onChange);
    else if(media.addListener) media.addListener(onChange);
  }

  const observer=new MutationObserver(()=>{
    scrubPrintRoot();
    const inPrint=document.body?.classList.contains('qmes-printing') || window.matchMedia?.('print')?.matches;
    if(!inPrint) restoreTopMenus();
    if(inPrint && (document.body?.classList.contains('print-doc')||document.body?.classList.contains('print-label')||document.body?.classList.contains('qmes-screen-exact-print'))){
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
    const isPrintControl=/^(인쇄|출력|인쇄하기|출력하기)$/.test(text)||/(^|\s)(인쇄|출력)(\s|$)/.test(text);
    const isCloseControl=/^(닫기|취소|돌아가기|×|X)$/.test(text);
    if(isPrintControl){
      /*
       * 출력/인쇄 문구만으로 인쇄 상태를 시작하지 않는다.
       * 많은 버튼은 먼저 화면 미리보기를 열기 때문에 실제 beforeprint가
       * 발생할 때만 startPrint가 실행되어야 한다.
       */
      requestAnimationFrame(()=>{
        if(!window.matchMedia?.('print')?.matches&&document.body?.classList.contains('qmes-printing')) endPrint();
      });
      return;
    }
    if(isCloseControl&&!window.matchMedia?.('print')?.matches&&document.body?.classList.contains('qmes-printing')) endPrint();
  },true);
})();