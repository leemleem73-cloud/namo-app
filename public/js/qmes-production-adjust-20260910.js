(function(){
  'use strict';
  if(window.__QMES_PRODUCTION_ADJUST_20260910__)return;
  window.__QMES_PRODUCTION_ADJUST_20260910__=true;

  const sessionKey='qmes-current-user-v1';
  const readUser=()=>{
    try{return window.__QMES_CURRENT_USER__||JSON.parse(sessionStorage.getItem(sessionKey)||'null');}
    catch(_error){return window.__QMES_CURRENT_USER__||null;}
  };
  const loggedIn=()=>Boolean(readUser());
  const isAdmin=()=>{
    const user=readUser()||{};
    const role=String(user.role||'').trim().toLowerCase();
    const name=String(user.name||'').replace(/\s+/g,'').trim();
    const uid=String(user.uid||'').trim().toUpperCase();
    return role==='admin'||name==='관리자'||uid==='U-0001';
  };

  function ensureScrollStyle(){
    if(document.getElementById('qmes-production-scroll-fix-20260910'))return;
    const style=document.createElement('style');
    style.id='qmes-production-scroll-fix-20260910';
    style.textContent=`
      html{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior-y:auto!important;}
      html body{height:auto!important;min-height:100vh!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior-y:auto!important;touch-action:pan-y!important;}
      html body #root{height:auto!important;min-height:100vh!important;overflow:visible!important;}
      html body #root>div{height:auto!important;min-height:100vh!important;overflow:visible!important;}
      html body #root>div>main{height:auto!important;min-height:calc(100vh - 58px)!important;max-height:none!important;overflow:visible!important;overscroll-behavior:auto!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav{overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;scrollbar-width:thin!important;-ms-overflow-style:auto!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar{display:block!important;width:7px!important;height:7px!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar-thumb{background:rgba(73,111,139,.34)!important;border-radius:999px!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar-track{background:transparent!important;}
    `;
    document.head.appendChild(style);
  }

  function ensureAdminEmployeeMenu(){
    const side=document.getElementById('qmes-erp-sidebar');
    const nav=side?.querySelector('.qmes-erp-nav');
    if(!nav)return;

    const current=Array.from(nav.querySelectorAll('.qmes-erp-item')).find(button=>{
      const text=String(button.textContent||'').replace(/\s+/g,' ').trim();
      return text.includes('회원등록 현황')||text.includes('직원 현황');
    });

    if(!isAdmin()){
      nav.querySelector('[data-qmes-admin-members-fallback="1"]')?.remove();
      nav.querySelector('[data-qmes-admin-section-fallback="1"]')?.remove();
      return;
    }

    if(current){
      current.style.removeProperty('display');
      current.style.removeProperty('visibility');
      current.removeAttribute('hidden');
      return;
    }

    let heading=nav.querySelector('[data-qmes-admin-section-fallback="1"]');
    if(!heading){
      heading=document.createElement('div');
      heading.className='qmes-erp-section';
      heading.dataset.qmesAdminSectionFallback='1';
      heading.textContent='SYSTEM';
      nav.appendChild(heading);
    }

    const button=document.createElement('button');
    button.type='button';
    button.className='qmes-erp-item';
    button.dataset.qmesAdminMembersFallback='1';
    button.setAttribute('aria-current','false');
    button.innerHTML='<span class="qmes-erp-icon" aria-hidden="true">U</span><span class="qmes-erp-text">직원 현황</span>';
    nav.appendChild(button);
  }

  function navigateMembers(){
    try{
      sessionStorage.setItem('qmes_current_tab','members');
      sessionStorage.setItem('qmes_erp_active_label','회원등록 현황');
      sessionStorage.removeItem('qmes_open_menu');
    }catch(_error){}
    const fire=()=>window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:'members',openMenu:null,source:'admin-employee-status-fallback-20260910'}}));
    fire();
    requestAnimationFrame(fire);
    setTimeout(fire,80);
  }

  function sync(){
    ensureScrollStyle();
    const visible=loggedIn();
    const header=document.getElementById('qmes-erp-header');
    const side=document.getElementById('qmes-erp-sidebar');
    if(header)header.style.setProperty('display',visible?'flex':'none','important');
    if(side)side.style.setProperty('display',visible?'flex':'none','important');

    if(visible){
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('pointer-events');
      document.body.style.removeProperty('pointer-events');
    }

    ensureAdminEmployeeMenu();

    const note=document.querySelector('#qmes-test-password-modal .qmes-test-password-note');
    if(note)note.textContent='현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.';
  }

  document.addEventListener('click',event=>{
    const button=event.target instanceof Element?event.target.closest('[data-qmes-admin-members-fallback="1"]'):null;
    if(!button)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    navigateMembers();
  },true);

  document.addEventListener('wheel',event=>{
    if(!loggedIn()||event.ctrlKey)return;
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    if(target.closest('select,input,textarea,[contenteditable="true"]'))return;

    const nav=target.closest('#qmes-erp-sidebar .qmes-erp-nav');
    if(nav){
      const before=nav.scrollTop;
      nav.scrollTop+=event.deltaY;
      if(nav.scrollTop!==before){event.preventDefault();event.stopPropagation();}
      return;
    }

    const scroller=document.scrollingElement||document.documentElement;
    if(!scroller)return;
    const max=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
    if(max<=0)return;
    const before=scroller.scrollTop;
    scroller.scrollTop=Math.max(0,Math.min(max,before+event.deltaY));
    if(scroller.scrollTop!==before){event.preventDefault();event.stopPropagation();}
  },{capture:true,passive:false});

  sync();
  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',sync);
  window.addEventListener('storage',sync);
  window.addEventListener('resize',sync);
  setInterval(sync,500);
})();