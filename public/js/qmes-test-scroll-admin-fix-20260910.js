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
      html,html body{height:100vh!important;min-height:100vh!important;max-height:100vh!important;overflow:hidden!important;overscroll-behavior:none!important;}
      html body #root{height:100vh!important;min-height:100vh!important;max-height:100vh!important;overflow:hidden!important;}
      html body #root>div{height:100vh!important;min-height:100vh!important;max-height:100vh!important;overflow:hidden!important;}
      html body #root>div>main{height:calc(100vh - 58px)!important;min-height:calc(100vh - 58px)!important;max-height:calc(100vh - 58px)!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:thin!important;}
      html body #root>div>main::-webkit-scrollbar{display:block!important;width:9px!important;height:9px!important;}
      html body #root>div>main::-webkit-scrollbar-thumb{background:rgba(73,111,139,.34)!important;border-radius:999px!important;}
      html body #root>div>main::-webkit-scrollbar-track{background:transparent!important;}
      html body #qmes-erp-sidebar{overflow:hidden!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav{min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;scrollbar-width:thin!important;-ms-overflow-style:auto!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar{display:block!important;width:7px!important;height:7px!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar-thumb{background:rgba(73,111,139,.34)!important;border-radius:999px!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar-track{background:transparent!important;}
      html body .qmes-db-member-btn.delete{display:none!important;visibility:hidden!important;pointer-events:none!important;}
    `;
    document.head.appendChild(style);
  }

  function removeEmployeeDeleteButtons(){
    document.querySelectorAll('.qmes-db-member-btn.delete').forEach(button=>button.remove());
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

  function menuLabel(button){
    return clean(button?.querySelector?.('.qmes-erp-text')?.textContent||button?.textContent);
  }

  function ensureAdminEmployeeMenu(){
    const side=document.getElementById('qmes-erp-sidebar');
    const nav=side?.querySelector('.qmes-erp-nav');
    if(!nav) return;

    const fallback=nav.querySelector('[data-qmes-test-admin-members="1"]');
    const fallbackHeading=nav.querySelector('[data-qmes-test-admin-section="1"]');
    const nativeItems=Array.from(nav.querySelectorAll('.qmes-erp-item:not([data-qmes-test-admin-members="1"])'))
      .filter(button=>['회원등록 현황','직원 현황'].includes(menuLabel(button)));

    if(!isAdmin()){
      fallback?.remove();
      fallbackHeading?.remove();
      return;
    }

    if(nativeItems.length){
      const keep=nativeItems[0];
      keep.hidden=false;
      keep.style.removeProperty('display');
      keep.style.removeProperty('visibility');
      keep.style.removeProperty('opacity');
      keep.removeAttribute('aria-hidden');
      nativeItems.slice(1).forEach(button=>button.remove());
      fallback?.remove();
      fallbackHeading?.remove();
      return;
    }

    let heading=fallbackHeading;
    if(!heading){
      heading=document.createElement('div');
      heading.className='qmes-erp-section';
      heading.dataset.qmesTestAdminSection='1';
      heading.textContent='SYSTEM';
      nav.appendChild(heading);
    }

    if(!fallback){
      const button=document.createElement('button');
      button.type='button';
      button.className='qmes-erp-item';
      button.dataset.qmesTestAdminMembers='1';
      button.setAttribute('aria-current','false');
      button.innerHTML='<span class="qmes-erp-icon" aria-hidden="true">U</span><span class="qmes-erp-text">회원등록 현황</span>';
      nav.appendChild(button);
    }
  }

  function mainScroller(){
    return document.querySelector('#root>div>main');
  }

  function sidebarScroller(){
    return document.querySelector('#qmes-erp-sidebar .qmes-erp-nav');
  }

  function moveScroller(scroller,delta){
    if(!scroller) return false;
    const max=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
    if(max<=0) return false;
    const before=scroller.scrollTop;
    const next=Math.max(0,Math.min(max,before+delta));
    scroller.scrollTop=next;
    return scroller.scrollTop!==before;
  }

  function forceWheel(event){
    if(event.ctrlKey||event.deltaY===0) return;
    const target=event.target instanceof Element?event.target:null;
    if(!target) return;
    if(target.closest('#qmes-test-password-modal,#qmes-test-alert-panel')) return;

    const side=target.closest('#qmes-erp-sidebar');
    if(side){
      if(moveScroller(sidebarScroller(),event.deltaY)){
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return;
    }

    if(target.closest('#qmes-erp-header')) return;
    if(moveScroller(mainScroller(),event.deltaY)){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  window.addEventListener('wheel',forceWheel,{capture:true,passive:false});

  document.addEventListener('click',event=>{
    const button=event.target instanceof Element?event.target.closest('[data-qmes-test-admin-members="1"]'):null;
    if(!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    dispatchMembers();
  },true);

  function sync(){
    ensureStyle();
    ensureAdminEmployeeMenu();
    removeEmployeeDeleteButtons();
  }

  sync();
  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',sync);
  window.addEventListener('resize',sync);
  window.addEventListener('storage',sync);
  setInterval(sync,700);
})();