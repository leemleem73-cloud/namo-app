(function(){
  'use strict';
  if(window.__QMES_TEST_SCROLL_ADMIN_FIX_20260910__) return;
  window.__QMES_TEST_SCROLL_ADMIN_FIX_20260910__ = true;

  const SESSION_KEY='qmes-current-user-v1';
  const PERMISSION_KEY='qmes-user-menu-permissions-v1';
  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();

  const labelToPermission={
    '수주 · 납기관리':'erpSales','생산계획 · MRP':'erpPlan','구매 · 발주관리':'erpPurchase',
    '재고현황':'invOverview','입출고 관리':'invMovement','LOT별 재고':'invLot','생산투입/완료':'invProduction','재고실사':'invCount','거래처 현황':'partners','출하 · 납품관리':'erpShipping',
    '생산 진행':'prod','작업지시서':'woIssue','생산공정 관리':'prodProcess','수입검사 (IQC)':'iqc','공정검사 (PQC)':'pqc','출하검사 (OQC)':'oqc',
    'SPC (Cpk)':'spc','품질 인터락':'lock','출하성적서':'coa','LOT 통합추적':'trace','부적합 (8D)':'ncr','고객불만 (GQMS)':'cc','4M 변경관리':'4m','현장 입력 (iPad)':'pop','설비 모니터링':'eq'
  };

  function readUser(){
    try{return window.__QMES_CURRENT_USER__ || window.__QMES_USER__ || JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null') || null;}
    catch(_error){return window.__QMES_CURRENT_USER__ || window.__QMES_USER__ || null;}
  }

  function isAdmin(){
    const user=readUser()||{};
    const role=clean(user.role||user.permission||user.userRole).toLowerCase();
    const name=clean(user.name||user.username||user.displayName).replace(/\s+/g,'');
    const uid=clean(user.uid||user.id||user.employeeId||user.employee_id).toUpperCase();
    return user.isAdmin===true || ['admin','administrator','superadmin','관리자'].includes(role) || name==='관리자' || uid==='U-0001';
  }

  function permissionIdentity(user){return clean(user?.name||user?.uid||user?.id).replace(/\s+/g,'');}
  function readPermissionEntry(){
    if(isAdmin()) return {allowed:null};
    try{
      const map=JSON.parse(localStorage.getItem(PERMISSION_KEY)||'{}');
      return map?.[permissionIdentity(readUser())]||null;
    }catch(_error){return null;}
  }
  function canAccessLabel(label){
    if(isAdmin()) return true;
    if(label==='회원등록 현황'||label==='직원 현황') return false;
    const key=labelToPermission[label];
    if(!key) return true;
    const entry=readPermissionEntry();
    if(!entry) return true;
    return Array.isArray(entry.allowed)&&entry.allowed.includes(key);
  }

  function ensureStyle(){
    let style=document.getElementById('qmes-test-scroll-admin-style-20260910');
    if(!style){style=document.createElement('style');style.id='qmes-test-scroll-admin-style-20260910';document.head.appendChild(style);}
    style.textContent=`
      html{height:auto!important;min-height:100%!important;max-height:none!important;overflow-x:hidden!important;overflow-y:auto!important;}
      html body{height:auto!important;min-height:100vh!important;max-height:none!important;overflow-x:hidden!important;overflow-y:auto!important;touch-action:pan-y!important;}
      html body #root,html body #root>div{height:auto!important;min-height:100vh!important;max-height:none!important;overflow:visible!important;}
      html body #root>div>main{height:auto!important;min-height:calc(100vh - 58px)!important;max-height:none!important;overflow:visible!important;touch-action:pan-y!important;}
      html body #qmes-erp-sidebar{display:flex!important;flex-direction:column!important;top:58px!important;bottom:0!important;height:calc(100vh - 58px)!important;min-height:0!important;max-height:calc(100vh - 58px)!important;overflow:hidden!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;scrollbar-width:thin!important;-ms-overflow-style:auto!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar{display:block!important;width:8px!important;height:8px!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar-thumb{background:rgba(73,111,139,.42)!important;border-radius:999px!important;}
      html body #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar-track{background:transparent!important;}
      html body #qmes-erp-sidebar .qmes-erp-item.qmes-permission-denied{display:none!important;}
    `;
  }

  function menuLabel(button){return clean(button?.querySelector?.('.qmes-erp-text')?.textContent||button?.textContent);}

  function applyMenuPermissions(){
    document.querySelectorAll('#qmes-erp-sidebar .qmes-erp-item').forEach(button=>{
      const label=menuLabel(button);
      const allowed=canAccessLabel(label);
      button.classList.toggle('qmes-permission-denied',!allowed);
      button.toggleAttribute('data-qmes-permission-denied',!allowed);
    });
    document.querySelectorAll('#qmes-erp-sidebar .qmes-erp-section').forEach(section=>{
      let node=section.nextElementSibling;
      let hasVisible=false;
      while(node && !node.classList.contains('qmes-erp-section')){
        if(node.classList.contains('qmes-erp-item') && !node.classList.contains('qmes-permission-denied')) hasVisible=true;
        node=node.nextElementSibling;
      }
      section.style.display=hasVisible?'':'none';
    });
  }

  function dispatchMembers(){
    try{sessionStorage.setItem('qmes_current_tab','members');sessionStorage.setItem('qmes_erp_active_label','회원등록 현황');sessionStorage.removeItem('qmes_open_menu');}catch(_error){}
    const detail={tab:'members',openMenu:null,source:'qmes-test-admin-employee-menu'};
    window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail}));
    requestAnimationFrame(()=>window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail})));
  }

  function ensureAdminEmployeeMenu(){
    const nav=document.querySelector('#qmes-erp-sidebar .qmes-erp-nav');
    if(!nav) return;
    const fallback=nav.querySelector('[data-qmes-test-admin-members="1"]');
    const fallbackHeading=nav.querySelector('[data-qmes-test-admin-section="1"]');
    const nativeItems=Array.from(nav.querySelectorAll('.qmes-erp-item:not([data-qmes-test-admin-members="1"])')).filter(button=>['회원등록 현황','직원 현황'].includes(menuLabel(button)));
    if(!isAdmin()){fallback?.remove();fallbackHeading?.remove();nativeItems.forEach(button=>button.remove());return;}
    if(nativeItems.length){nativeItems[0].hidden=false;nativeItems.slice(1).forEach(button=>button.remove());fallback?.remove();fallbackHeading?.remove();return;}
    let heading=fallbackHeading;
    if(!heading){heading=document.createElement('div');heading.className='qmes-erp-section';heading.dataset.qmesTestAdminSection='1';heading.textContent='SYSTEM';nav.appendChild(heading);}
    if(!fallback){const button=document.createElement('button');button.type='button';button.className='qmes-erp-item';button.dataset.qmesTestAdminMembers='1';button.innerHTML='<span class="qmes-erp-icon" aria-hidden="true">U</span><span class="qmes-erp-text">회원등록 현황</span>';nav.appendChild(button);}
  }

  function canScroll(el){return !!el && el.scrollHeight>el.clientHeight+1;}
  function move(el,delta){if(!canScroll(el))return false;const before=el.scrollTop;const max=Math.max(0,el.scrollHeight-el.clientHeight);el.scrollTop=Math.max(0,Math.min(max,before+delta));return el.scrollTop!==before;}

  function nearestScrollable(start){
    let node=start instanceof Element?start:null;
    while(node&&node!==document.body&&node!==document.documentElement){
      const css=getComputedStyle(node);
      if(/auto|scroll|overlay/.test(css.overflowY)&&canScroll(node))return node;
      node=node.parentElement;
    }
    return null;
  }

  function pageScroller(){
    const doc=document.scrollingElement||document.documentElement;
    if(canScroll(doc))return doc;
    return [document.querySelector('#root>div>main'),document.querySelector('#root main'),document.body,document.documentElement].find(canScroll)||null;
  }

  function forceWheel(event){
    if(event.ctrlKey||event.deltaY===0)return;
    const target=event.target instanceof Element?event.target:null;
    if(!target||target.closest('[role="dialog"],#qmes-test-password-modal,#qmes-test-alert-panel'))return;

    const side=target.closest('#qmes-erp-sidebar');
    if(side){
      const nav=side.querySelector('.qmes-erp-nav');
      if(move(nav,event.deltaY)){event.preventDefault();event.stopImmediatePropagation();}
      return;
    }
    if(target.closest('#qmes-erp-header'))return;

    const local=nearestScrollable(target);
    if(local&&move(local,event.deltaY)){event.preventDefault();event.stopImmediatePropagation();return;}
    const page=pageScroller();
    if(page&&move(page,event.deltaY)){event.preventDefault();event.stopImmediatePropagation();}
  }

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    const memberButton=target.closest('[data-qmes-test-admin-members="1"]');
    if(memberButton){event.preventDefault();event.stopImmediatePropagation();dispatchMembers();return;}
    const item=target.closest('#qmes-erp-sidebar .qmes-erp-item');
    if(!item)return;
    const label=menuLabel(item);
    if(canAccessLabel(label))return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  },true);

  window.addEventListener('wheel',forceWheel,{capture:true,passive:false});
  window.addEventListener('qmes:menu-permissions-changed',()=>setTimeout(sync,0));

  function sync(){ensureStyle();ensureAdminEmployeeMenu();applyMenuPermissions();}
  sync();
  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('focus',sync);window.addEventListener('resize',sync);window.addEventListener('storage',sync);
  setInterval(sync,700);
})();