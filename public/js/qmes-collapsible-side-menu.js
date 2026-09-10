(function(){
  "use strict";
  document.getElementById('qmes-sync-sidebar')?.remove();
  document.getElementById('qmes-sync-hamburger')?.remove();
  document.getElementById('qmes-erp-sidebar')?.remove();
  document.getElementById('qmes-erp-header')?.remove();
  document.body.classList.remove('qmes-side-open','qmes-erp-menu-closed');

  const clean=value=>String(value||'').replace(/[›〉▣]/g,'').replace(/\s+/g,' ').trim();
  const readSessionUser=()=>{try{return JSON.parse(sessionStorage.getItem('qmes-current-user-v1')||'null');}catch(_error){return null;}};
  const currentUser=()=>window.__QMES_CURRENT_USER__||readSessionUser()||null;
  const normalizeUserName=value=>/^임+흥배$/.test(String(value||'').replace(/\s+/g,''))?'임흥배':String(value||'').trim();
  const accountText=()=>{
    const user=currentUser()||{};
    const name=normalizeUserName(user.name||user.uid||'사용자');
    const rawDept=String(user.department||user.dept||'').replace(/\s+/g,'').trim();
    const dept=name==='임흥배'?'품질부':rawDept;
    return dept?`${name}(${dept})`:name;
  };
  const isAdminUser=()=>{
    const user=currentUser();
    const role=String(user?.role||'').trim().toLowerCase();
    if(role==='admin')return true;
    return String(user?.name||'').trim()==='관리자'&&String(user?.uid||'').trim().toUpperCase()==='U-0001';
  };
  const canAccessCommercialErp=()=>{
    const user=currentUser()||{};
    const name=String(user?.name||'').replace(/\s+/g,'').trim();
    const dept=String(user?.department||user?.dept||'').replace(/\s+/g,'').trim();
    return dept==='영업부'||['김종혁','김세희','정영기'].includes(name);
  };

  const sections=[
    {label:'WORKSPACE',items:[
      {label:'통합 대시보드',icon:'▦',direct:'대시보드'},
      {label:'SPC 대시보드',icon:'⌁',group:'품질검사',sub:'SPC (Cpk)'}
    ]},
    {label:'ERP',items:[
      {label:'수주 · 납기관리',icon:'▤',tab:'erpSales'},
      {label:'생산계획 · MRP',icon:'▥',tab:'erpPlan'},
      {label:'구매 · 발주관리',icon:'□',tab:'erpPurchase'},
      {label:'재고현황',icon:'▣',inventory:'overview'},
      {label:'입출고 관리',icon:'⇄',inventory:'movement'},
      {label:'LOT별 재고',icon:'L',inventory:'lot'},
      {label:'생산투입/완료',icon:'↳',inventory:'production'},
      {label:'재고실사',icon:'✓',inventory:'count'},
      {label:'거래처 현황',icon:'◇',direct:'거래처 현황'}
    ]},
    {label:'MES · QMS',items:[
      {label:'생산 진행',icon:'▶',group:'생산관리',sub:'생산 (배치)'},
      {label:'작업지시서',icon:'▧',group:'생산관리',sub:'작업지시서'},
      {label:'생산공정 관리',icon:'⚙',tab:'prodProcess',openMenu:'productionMenu'},
      {label:'수입검사 (IQC)',icon:'Q',group:'품질검사',sub:'수입검사 (IQC)'},
      {label:'공정검사 (PQC)',icon:'Q',group:'품질검사',sub:'공정검사 (PQC)'},
      {label:'출하검사 (OQC)',icon:'Q',group:'품질검사',sub:'출하검사 (OQC)'},
      {label:'SPC (Cpk)',icon:'C',group:'품질검사',sub:'SPC (Cpk)'},
      {label:'품질 인터락',icon:'!',group:'품질검사',sub:'품질 인터락 (차단)'},
      {label:'출하성적서',icon:'▤',group:'품질검사',sub:'출하성적서'},
      {label:'LOT 통합추적',icon:'⌕',direct:'LOT 추적'},
      {label:'출하 · 납품관리',icon:'⇢',tab:'erpShipping'},
      {label:'부적합 (8D)',icon:'8',group:'부적합관리',sub:'부적합 (8D)'},
      {label:'고객불만 (GQMS)',icon:'G',group:'부적합관리',sub:'고객불만 (GQMS)'},
      {label:'4M 변경관리',icon:'4',group:'부적합관리',sub:'4M 변경관리'},
      {label:'현장 입력 (iPad)',icon:'▱',direct:'현장입력'},
      {label:'설비 모니터링',icon:'◉',direct:'설비관리'}
    ]},
    {label:'SYSTEM',items:[{label:'회원등록 현황',icon:'U',tab:'members',adminOnly:true}]}
  ];

  const side=document.createElement('aside');
  side.id='qmes-erp-sidebar';
  side.dataset.qmesSidebarOwner='enterprise-test-20260910';
  side.setAttribute('aria-label','QMES 통합 메뉴');
  side.innerHTML=`<div class="qmes-erp-company"><div class="qmes-erp-company-row"><span class="qmes-erp-company-name">㈜나모케미칼</span><span class="qmes-erp-status">정상운영</span></div></div><nav class="qmes-erp-nav" aria-label="업무 메뉴"></nav><div class="qmes-erp-foot">NAMO Chemical Co., Ltd.</div>`;
  document.body.appendChild(side);

  const menuSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  const closeSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const searchSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>';
  const bellSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>';
  const mobileSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10 5h4M11 18.5h2"/></svg>';
  const userSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6"/></svg>';

  const header=document.createElement('header');
  header.id='qmes-erp-header';
  header.dataset.qmesHeaderOwner='enterprise-test-20260910';
  header.setAttribute('aria-label','나모케미칼 상단 헤더');
  header.innerHTML=`
    <button type="button" class="qmes-erp-header-brand" aria-label="통합 대시보드"><img class="qmes-erp-official-logo" src="/assets/namo-header-logo.svg?v=20260903-official-logo4" alt="나모케미칼(주) NAMO Chemical Co., Ltd."></button>
    <button type="button" class="qmes-erp-header-menu" aria-label="왼쪽 메뉴 닫기" aria-expanded="true">${closeSvg}</button>
    <div id="qmes-ref-global-search" class="qmes-erp-header-search"><input type="search" placeholder="메뉴 찾기" aria-label="메뉴 찾기"><button type="button" class="qmes-erp-header-search-icon" aria-label="검색">${searchSvg}</button></div>
    <div class="qmes-erp-header-spacer"></div>
    <div class="qmes-erp-header-clock" aria-label="현재 시각"></div>
    <button type="button" class="qmes-erp-header-mobile" aria-label="모바일 화면">${mobileSvg}<span>모바일</span></button>
    <button type="button" class="qmes-visible-notice-button" aria-label="알림" data-qmes-visible-notice="1">${bellSvg}<span>알림</span></button>
    <div class="qmes-erp-account-wrap">
      <button type="button" class="qmes-erp-header-account" aria-label="사용자 메뉴" aria-haspopup="menu" aria-expanded="false">${userSvg}<span class="qmes-erp-account-text"></span><span class="qmes-erp-account-caret">▾</span></button>
      <div class="qmes-erp-account-menu" role="menu" aria-label="사용자 메뉴">
        <button type="button" role="menuitem" data-qmes-account-action="password">비밀번호 변경</button>
        <button type="button" role="menuitem" data-qmes-account-action="logout">로그아웃</button>
      </div>
    </div>
    <button type="button" class="qmes-erp-header-btn qmes-erp-header-backup">백업</button>
    <button type="button" class="qmes-erp-header-btn qmes-erp-header-restore">복원</button>`;
  document.body.appendChild(header);

  const nativeHeader=()=>document.querySelector('#root header:not(#qmes-erp-header)');
  const accountWrap=header.querySelector('.qmes-erp-account-wrap');
  const accountButton=header.querySelector('.qmes-erp-header-account');
  const accountLabel=header.querySelector('.qmes-erp-account-text');
  const accountMenu=header.querySelector('.qmes-erp-account-menu');
  const setAccountOpen=open=>{accountWrap.classList.toggle('is-open',Boolean(open));accountButton.setAttribute('aria-expanded',String(Boolean(open)));};
  const updateAccountLabel=()=>{accountLabel.textContent=accountText();};
  updateAccountLabel();

  accountWrap.addEventListener('mouseenter',()=>setAccountOpen(true));
  accountWrap.addEventListener('mouseleave',()=>setAccountOpen(false));
  accountButton.addEventListener('click',event=>{event.stopPropagation();setAccountOpen(!accountWrap.classList.contains('is-open'));});
  document.addEventListener('click',event=>{if(!accountWrap.contains(event.target))setAccountOpen(false);});

  function nativeButtons(){const native=nativeHeader();return native?Array.from(native.querySelectorAll('button')):[];}
  function findNativeByText(text){return nativeButtons().find(button=>clean(button.textContent)===clean(text)||clean(button.textContent).includes(clean(text)));}
  function nativeAccountButton(){return nativeButtons().find(button=>button.getAttribute('aria-label')==='사용자 메뉴'||button.getAttribute('aria-label')==='계정 설정 열기'||/\(.+\)/.test(clean(button.textContent)));}
  function triggerNativeAccountAction(label){
    const account=nativeAccountButton();
    if(account)account.click();
    const run=()=>{
      const candidates=Array.from(document.querySelectorAll('#root [role="menuitem"], #root button'));
      const target=candidates.find(button=>clean(button.textContent)===label);
      if(target){target.click();setAccountOpen(false);return true;}
      return false;
    };
    requestAnimationFrame(()=>{if(!run())setTimeout(run,60);});
  }

  accountMenu.querySelector('[data-qmes-account-action="password"]').addEventListener('click',()=>triggerNativeAccountAction('비밀번호 변경'));
  accountMenu.querySelector('[data-qmes-account-action="logout"]').addEventListener('click',()=>triggerNativeAccountAction('로그아웃'));

  function syncHeader(){
    const native=nativeHeader();
    if(native){
      native.dataset.qmesNativeHeader='hidden-by-erp-rebuild';
      const buttons=nativeButtons();
      const byText=text=>buttons.find(button=>clean(button.textContent).includes(text));
      updateAccountLabel();
      header.querySelector('.qmes-erp-header-brand').onclick=()=>buttons[0]?.click();
      header.querySelector('.qmes-visible-notice-button').onclick=()=>{
        const alertButton=buttons.find(button=>button.getAttribute('aria-label')==='알림')||buttons.find(button=>String(button.getAttribute('aria-label')||'').includes('알림'));
        alertButton?.click();
      };
      header.querySelector('.qmes-erp-header-backup').onclick=()=>byText('백업')?.click();
      header.querySelector('.qmes-erp-header-restore').onclick=()=>byText('복원')?.click();
    }else{
      updateAccountLabel();
    }
  }

  function tick(){header.querySelector('.qmes-erp-header-clock').textContent=new Date().toLocaleTimeString('ko-KR',{hour12:false});}
  tick();setInterval(tick,1000);syncHeader();setInterval(syncHeader,1000);

  const nav=side.querySelector('.qmes-erp-nav');
  const tabToLabel={dash:'통합 대시보드',iqc:'수입검사 (IQC)',pqc:'공정검사 (PQC)',oqc:'출하검사 (OQC)',spc:'SPC (Cpk)',lock:'품질 인터락',coa:'출하성적서',prod:'생산 진행',woIssue:'작업지시서',prodProcess:'생산공정 관리',pop:'현장 입력 (iPad)',partners:'거래처 현황',eq:'설비 모니터링',trace:'LOT 통합추적',erpSales:'수주 · 납기관리',erpPlan:'생산계획 · MRP',erpPurchase:'구매 · 발주관리',erpShipping:'출하 · 납품관리',members:'회원등록 현황'};
  const savedTab=()=>{try{return sessionStorage.getItem('qmes_current_tab')||'dash';}catch(_error){return 'dash';}};
  let activeLabel=tabToLabel[savedTab()]||'통합 대시보드';
  const topButtons=()=>Array.from(document.querySelectorAll('.qmes-top-menu-button'));
  const topLabel=button=>clean(button?.querySelector(':scope > span')?.textContent||button?.querySelector('span')?.textContent||button?.textContent);
  const findTop=label=>topButtons().find(button=>topLabel(button)===clean(label));
  const findSub=label=>Array.from(document.querySelectorAll('.qmes-submenu-button')).find(button=>clean(button.textContent)===clean(label));

  header.querySelector('.qmes-erp-header-mobile').addEventListener('click',()=>{
    const mobileTarget=findTop('현장입력')||findTop('현장 입력');
    if(mobileTarget){mobileTarget.click();return;}
    window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:'fieldInput',openMenu:null}}));
  });

  const menuButton=header.querySelector('.qmes-erp-header-menu');
  function setMenu(open){
    document.body.classList.toggle('qmes-erp-menu-closed',!open);
    side.hidden=!open;
    side.setAttribute('aria-hidden',String(!open));
    menuButton.innerHTML=open?closeSvg:menuSvg;
    menuButton.setAttribute('aria-expanded',String(open));
    menuButton.setAttribute('aria-label',open?'왼쪽 메뉴 닫기':'왼쪽 메뉴 열기');
  }
  menuButton.addEventListener('click',()=>setMenu(document.body.classList.contains('qmes-erp-menu-closed')));
  setMenu(true);

  function render(filter=''){
    nav.replaceChildren();
    const needle=clean(filter).toLowerCase();
    sections.forEach((section,sectionIndex)=>{
      const matches=section.items.map((item,itemIndex)=>({item,itemIndex})).filter(({item})=>(!item.adminOnly||isAdminUser())&&(!needle||clean(item.label).toLowerCase().includes(needle)));
      if(!matches.length)return;
      const heading=document.createElement('div');
      heading.className='qmes-erp-section';
      heading.textContent=section.label;
      nav.appendChild(heading);
      matches.forEach(({item,itemIndex})=>{
        const button=document.createElement('button');
        button.type='button';
        button.className='qmes-erp-item'+(activeLabel===item.label?' is-active':'');
        button.dataset.sectionIndex=String(sectionIndex);
        button.dataset.itemIndex=String(itemIndex);
        button.setAttribute('aria-current',activeLabel===item.label?'page':'false');
        button.innerHTML='<span class="qmes-erp-icon" aria-hidden="true"></span><span class="qmes-erp-text"></span>';
        button.querySelector('.qmes-erp-icon').textContent=item.icon;
        button.querySelector('.qmes-erp-text').textContent=item.label;
        nav.appendChild(button);
      });
    });
  }

  function navigate(item){
    if(!item||item.adminOnly&&!isAdminUser())return;
    activeLabel=item.label;
    try{sessionStorage.setItem('qmes_erp_active_label',activeLabel);}catch(_error){}
    searchInput.value='';render();
    if(item.inventory){
      try{sessionStorage.setItem('qmes_inventory_section',item.inventory);}catch(_error){}
      window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:'inv',openMenu:null}}));
      window.dispatchEvent(new CustomEvent('qmes:inventory-section',{detail:{section:item.inventory}}));
      return;
    }
    if(item.tab){window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:item.tab,openMenu:item.openMenu||null}}));return;}
    if(item.direct){findTop(item.direct)?.click();return;}
    if(item.sub){const submenu=findSub(item.sub);if(submenu){submenu.click();return;}findTop(item.group)?.click();requestAnimationFrame(()=>requestAnimationFrame(()=>findSub(item.sub)?.click()));}
  }

  nav.addEventListener('click',event=>{
    const button=event.target.closest('.qmes-erp-item');
    if(!button)return;
    const section=sections[Number(button.dataset.sectionIndex)];
    navigate(section?.items?.[Number(button.dataset.itemIndex)]);
  });

  const searchInput=header.querySelector('.qmes-erp-header-search input');
  const runSearch=()=>{
    const q=clean(searchInput.value);render(q);if(!q)return;
    const exact=sections.flatMap(section=>section.items).find(item=>(!item.adminOnly||isAdminUser())&&clean(item.label).toLowerCase()===q.toLowerCase());
    if(exact)navigate(exact);
  };
  searchInput.addEventListener('input',()=>render(searchInput.value));
  searchInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();runSearch();}});
  header.querySelector('.qmes-erp-header-search-icon').addEventListener('click',runSearch);

  const syncActiveFromRoute=()=>{
    const next=tabToLabel[savedTab()];
    if(next&&next!==activeLabel){
      activeLabel=next;
      try{sessionStorage.setItem('qmes_erp_active_label',activeLabel);}catch(_error){}
      render(searchInput.value);
    }
  };
  let lastAdminState=isAdminUser();
  let lastUserSignature='';
  const syncUserAndAdminMenu=()=>{
    const user=currentUser();
    const signature=[user?.id||'',user?.uid||'',user?.name||'',user?.department||user?.dept||'',user?.role||''].join('|');
    const adminState=isAdminUser();
    if(signature!==lastUserSignature||adminState!==lastAdminState){
      lastUserSignature=signature;
      lastAdminState=adminState;
      updateAccountLabel();
      render(searchInput.value);
    }
  };

  window.addEventListener('qmes:navigate-tab',()=>requestAnimationFrame(syncActiveFromRoute));
  window.addEventListener('storage',()=>{syncActiveFromRoute();syncUserAndAdminMenu();});
  window.addEventListener('focus',syncUserAndAdminMenu);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncUserAndAdminMenu();});
  setTimeout(()=>{
    const hasAuthenticatedUser=()=>{try{return Boolean(sessionStorage.getItem('qmes-current-user-v1'));}catch(_error){return false;}};
    if(!hasAuthenticatedUser())return;
    syncActiveFromRoute();syncUserAndAdminMenu();
  },0);
  setInterval(()=>{syncActiveFromRoute();syncUserAndAdminMenu();},350);
  render();
})();