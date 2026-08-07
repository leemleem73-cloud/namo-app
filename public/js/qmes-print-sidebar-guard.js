(function(){
  "use strict";
  if(window.__QMES_PRINT_SIDEBAR_GUARD_V5__) return;
  window.__QMES_PRINT_SIDEBAR_GUARD_V5__=true;

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

    html.qmes-preview-scroll-lock,
    body.qmes-preview-scroll-lock{
      overflow:hidden!important;
      overscroll-behavior:none!important;
    }
    body.qmes-preview-open::before{
      content:'';
      position:fixed;
      inset:0;
      z-index:13200;
      background:rgba(15,23,42,.18);
      pointer-events:none;
    }
    body.qmes-preview-open [role="dialog"],
    body.qmes-preview-open dialog,
    body.qmes-preview-open #qmes-print-root,
    body.qmes-preview-open [class*="preview"],
    body.qmes-preview-open [class*="print-preview"]{
      overscroll-behavior:contain!important;
    }
    body.qmes-preview-open [role="dialog"],
    body.qmes-preview-open dialog,
    body.qmes-preview-open #qmes-print-root{
      z-index:14000!important;
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
      body.qmes-preview-open::before{display:none!important;}
    }
  `;
  document.head.appendChild(style);

  let printClickActive=false;
  let previewActive=false;
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

  function rememberSidebar(){
    if(!previewActive&&!printClickActive) sideWasOpen=document.body?.classList.contains('qmes-side-open')||false;
  }

  function restoreSidebar(){
    const side=document.getElementById('qmes-sync-sidebar');
    const hamburger=document.getElementById('qmes-sync-hamburger');
    if(side){
      ['display','visibility','opacity','pointer-events','transform'].forEach(prop=>side.style.removeProperty(prop));
    }
    if(hamburger){
      ['display','visibility','opacity','pointer-events'].forEach(prop=>hamburger.style.removeProperty(prop));
    }
    if(sideWasOpen) document.body?.classList.add('qmes-side-open');
  }

  function startPreview(){
    if(!previewActive) rememberSidebar();
    previewActive=true;
    document.documentElement?.classList.add('qmes-preview-scroll-lock');
    document.body?.classList.add('qmes-preview-scroll-lock','qmes-preview-open');
  }

  function endPreview(){
    previewActive=false;
    document.documentElement?.classList.remove('qmes-preview-scroll-lock');
    document.body?.classList.remove('qmes-preview-scroll-lock','qmes-preview-open');
    restoreSidebar();
    restoreTopMenus();
  }

  const startPrint=()=>{
    if(!printClickActive) rememberSidebar();
    document.body?.classList.add('qmes-printing');
    scrubPrintRoot();
  };

  const endPrint=()=>{
    printClickActive=false;
    document.body?.classList.remove('qmes-printing');
    restoreSidebar();
    restoreTopMenus();
  };

  restoreTopMenus();
  requestAnimationFrame(restoreTopMenus);
  setTimeout(restoreTopMenus,80);

  window.addEventListener('beforeprint',startPrint);
  window.addEventListener('afterprint',()=>{
    endPrint();
    setTimeout(()=>{
      if(!document.querySelector('[role="dialog"],dialog,#qmes-print-root')) endPreview();
    },80);
  });
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
    } else if(!document.body?.classList.contains('qmes-printing')){
      restoreSidebar();
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

  document.addEventListener('click',event=>{
    const target=event.target.closest('button,a,[role="button"]');
    if(!target)return;
    const text=clean(target.textContent||target.getAttribute('aria-label')||target.getAttribute('title'));

    if(/^(미리보기|출력|출력보기|인쇄 미리보기)$/.test(text)||/(^|\s)(미리보기|출력보기)(\s|$)/.test(text)){
      startPreview();
      return;
    }

    if(/^(인쇄|인쇄하기|출력하기)$/.test(text)||/(^|\s)인쇄(\s|$)/.test(text)){
      if(!previewActive) startPreview();
      printClickActive=true;
      startPrint();
      requestAnimationFrame(()=>{startPrint();scrubPrintRoot();});
      setTimeout(()=>{startPrint();scrubPrintRoot();},0);
      setTimeout(scrubPrintRoot,80);
      setTimeout(scrubPrintRoot,220);
      return;
    }

    if(/^(닫기|취소|돌아가기|확인)$/.test(text)){
      if(printClickActive) endPrint();
      if(previewActive) setTimeout(endPreview,0);
    }
  },true);

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&previewActive) setTimeout(endPreview,0);
  },true);
})();