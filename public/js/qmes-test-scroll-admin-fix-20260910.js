(function(){
  'use strict';
  if(window.__QMES_TEST_SCROLL_ADMIN_FIX_20260910__) return;
  window.__QMES_TEST_SCROLL_ADMIN_FIX_20260910__ = true;

  const SESSION_KEY='qmes-current-user-v1';
  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();

  function readUser(){
    try{
      return window.__QMES_CURRENT_USER__ || window.__QMES_USER__ || JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null') || null;
    }catch(_error){
      return window.__QMES_CURRENT_USER__ || window.__QMES_USER__ || null;
    }
  }

  function isAdmin(){
    const user=readUser()||{};
    const role=clean(user.role||user.permission||user.userRole).toLowerCase();
    const name=clean(user.name||user.username||user.displayName).replace(/\s+/g,'');
    const uid=clean(user.uid||user.id||user.employeeId||user.employee_id).toUpperCase();
    return user.isAdmin===true || ['admin','administrator','superadmin','관리자'].includes(role) || name==='관리자' || uid==='U-0001';
  }

  function ensureStyle(){
    if(document.getElementById('qmes-test-scroll-admin-style-20260910')) return;
    const style=document.createElement('style');
    style.id='qmes-test-scroll-admin-style-20260910';
    style.textContent=`
      html{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior-y:auto!important;}
      html body{height:auto!important;min-height:100vh!important;max-height:none!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior-y:auto!important;touch-action:pan-y!important;}
      html body #root{height:auto!important;min-height:100vh!important;max-height:none!important;overflow:visible!important;}
      html body #root>div{height:auto!important;min-height:100vh!important;max-height:none!important;overflow:visible!important;}
      html body #root>div>main{height:auto!important;min-height:calc(100vh - 58px)!important;max-height:none!important;overflow:visible!important;overscroll-behavior:auto!important;touch-action:pan-y!important;}
      html body #qmes-erp-sidebar{overflow:hidden!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav{min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;scrollbar-width:thin!important;-ms-overflow-style:auto!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar{display:block!important;width:7px!important;height:7px!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar-thumb{background:rgba(73,111,139,.34)!important;border-radius:999px!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar-track{background:transparent!important;}
    `;
    document.head.appendChild(style);
  }

  function releaseScrollLock(){
    ensureStyle();
    if(document.getElementById('qmes-test-password-modal')) return;
    document.documentElement.style.setProperty('overflow-y','auto','important');
    document.documentElement.style.setProperty('overflow-x','hidden','important');
    document.documentElement.style.setProperty('height','auto','important');
    document.body.style.setProperty('overflow-y','auto','important');
    document.body.style.setProperty('overflow-x','hidden','important');
    document.body.style.setProperty('height','auto','important');
    document.body.style.setProperty('max-height','none','important');
  }

  function dispatchMembers(){
    try{
      sessionStorage.setItem('qmes_current_tab','members');
      sessionStorage.setItem('qmes_erp_active_label','회원등록 현황');
      sessionStorage.removeItem('qmes_open_menu');
    }catch(_error){}
    const detail={tab:'members',openMenu:null,source:'qmes-test-admin-employee-menu'};
    const fire=()=>window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail}));
    fire();
    requestAnimationFrame(fire);
    setTimeout(fire,80);
    setTimeout(fire,250);
  }

  function ensureAdminEmployeeMenu(){
    const side=document.getElementById('qmes-erp-sidebar');
    const nav=side?.querySelector('.qmes-erp-nav');
    if(!nav) return;

    const allItems=Array.from(nav.querySelectorAll('.qmes-erp-item'));
    const existing=allItems.find(button=>{
      const label=clean(button.querySelector('.qmes-erp-text')?.textContent||button.textContent);
      return label==='회원등록 현황'||label==='직원 현황';
    });

    if(!isAdmin()){
      nav.querySelector('[data-qmes-test-admin-members="1"]')?.remove();
      const heading=nav.querySelector('[data-qmes-test-admin-section="1"]');
      if(heading&&!heading.nextElementSibling?.matches('[data-qmes-test-admin-members="1"]')) heading.remove();
      return;
    }

    if(existing){
      existing.hidden=false;
      existing.style.removeProperty('display');
      existing.style.removeProperty('visibility');
      existing.style.removeProperty('opacity');
      existing.removeAttribute('aria-hidden');
      return;
    }

    let heading=nav.querySelector('[data-qmes-test-admin-section="1"]');
    if(!heading){
      heading=document.createElement('div');
      heading.className='qmes-erp-section';
      heading.dataset.qmesTestAdminSection='1';
      heading.textContent='SYSTEM';
      nav.appendChild(heading);
    }

    let button=nav.querySelector('[data-qmes-test-admin-members="1"]');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className='qmes-erp-item';
      button.dataset.qmesTestAdminMembers='1';
      button.setAttribute('aria-current','false');
      button.innerHTML='<span class="qmes-erp-icon" aria-hidden="true">U</span><span class="qmes-erp-text">회원등록 현황</span>';
      nav.appendChild(button);
    }
  }

  function nearestScrollable(start){
    let node=start instanceof Element?start:null;
    while(node&&node!==document.body&&node!==document.documentElement){
      if(node.matches('#qmes-erp-sidebar .qmes-erp-nav')) return node;
      const style=getComputedStyle(node);
      const overflowY=style.overflowY;
      if((overflowY==='auto'||overflowY==='scroll'||overflowY==='overlay')&&node.scrollHeight>node.clientHeight+1) return node;
      node=node.parentElement;
    }
    const page=document.scrollingElement||document.documentElement;
    return page.scrollHeight>page.clientHeight+1?page:null;
  }

  function moveScroller(scroller,delta){
    if(!scroller) return false;
    const before=scroller.scrollTop;
    const max=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
    if(max<=0) return false;
    scroller.scrollTop=Math.max(0,Math.min(max,before+delta));
    return scroller.scrollTop!==before;
  }

  document.addEventListener('wheel',event=>{
    if(event.ctrlKey||event.deltaY===0) return;
    const target=event.target instanceof Element?event.target:null;
    if(!target) return;
    if(target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if(target.closest('#qmes-test-password-modal,#qmes-test-alert-panel')) return;
    const scroller=nearestScrollable(target);
    if(moveScroller(scroller,event.deltaY)){
      event.preventDefault();
      event.stopPropagation();
    }
  },{capture:true,passive:false});

  document.addEventListener('click',event=>{
    const button=event.target instanceof Element?event.target.closest('[data-qmes-test-admin-members="1"]'):null;
    if(!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    dispatchMembers();
  },true);

  function sync(){
    releaseScrollLock();
    ensureAdminEmployeeMenu();
  }

  sync();
  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',sync);
  window.addEventListener('resize',sync);
  window.addEventListener('storage',sync);
  setInterval(sync,700);
})();