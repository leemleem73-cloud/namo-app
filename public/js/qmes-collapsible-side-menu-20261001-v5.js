(function(){
  "use strict";
  const hoverSidebarStyle=document.createElement('style');
  hoverSidebarStyle.id='qmes-hover-expand-sidebar-20261001';
  hoverSidebarStyle.textContent=`
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar{
      width:54px!important;
      z-index:14040!important;
      overflow:hidden!important;
      background:#354052!important;
      color:#dce5ec!important;
      border-right:0!important;
      box-shadow:2px 0 8px rgba(24,39,55,.16)!important;
      transition:width .16s ease!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar:hover,
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar:focus-within{
      width:180px!important;
      background:#354052!important;
      box-shadow:6px 0 18px rgba(24,39,55,.22)!important;
    }
    html body #root>div>main{
      margin-left:36px!important;
      width:calc(100% - 36px)!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar .qmes-erp-text,
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar .qmes-erp-foot{
      opacity:0!important;
      visibility:hidden!important;
      pointer-events:none!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar:hover .qmes-erp-text,
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar:hover .qmes-erp-foot,
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar:focus-within .qmes-erp-text,
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar:focus-within .qmes-erp-foot{
      opacity:1!important;
      visibility:visible!important;
      pointer-events:auto!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar .qmes-erp-nav{
      padding:10px 0 10px!important;
      background:#354052!important;
      display:flex!important;
      flex-direction:column!important;
      align-items:stretch!important;
      overflow:hidden!important;
      scrollbar-width:none!important;
      -ms-overflow-style:none!important;
      overscroll-behavior:none!important;
      touch-action:none!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar::-webkit-scrollbar,
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar .qmes-erp-nav::-webkit-scrollbar{
      display:none!important;
      width:0!important;
      height:0!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar .qmes-erp-section{
      height:0!important;
      min-height:0!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      color:transparent!important;
      font-size:0!important;
      line-height:0!important;
      overflow:hidden!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar:hover .qmes-erp-section,
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar:focus-within .qmes-erp-section{
      height:auto!important;
      min-height:22px!important;
      margin:7px 0 2px!important;
      padding:5px 15px 3px!important;
      background:transparent!important;
      color:#9fb2c4!important;
      font-size:9px!important;
      line-height:14px!important;
      font-weight:800!important;
      letter-spacing:.65px!important;
      text-align:left!important;
      box-sizing:border-box!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar .qmes-erp-item{
      width:42px!important;
      height:38px!important;
      min-height:38px!important;
      margin:2px 6px!important;
      padding:0 10px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:flex-start!important;
      gap:10px!important;
      box-sizing:border-box!important;
      border:0!important;
      border-radius:6px!important;
      background:transparent!important;
      color:#c7d2dc!important;
      box-shadow:none!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar:hover .qmes-erp-item,
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar:focus-within .qmes-erp-item{
      width:calc(100% - 12px)!important;
      height:38px!important;
      padding:0 10px!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar .qmes-erp-item:hover{
      background:#414f63!important;
      color:#fff!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar .qmes-erp-item.is-active{
      background:#2d79b3!important;
      color:#fff!important;
      box-shadow:none!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar .qmes-erp-icon{
      width:22px!important;
      height:22px!important;
      min-width:22px!important;
      flex:0 0 22px!important;
      display:grid!important;
      place-items:center!important;
      margin:0!important;
      border:0!important;
      border-radius:5px!important;
      background:transparent!important;
      color:inherit!important;
      font-size:11px!important;
      font-weight:900!important;
      line-height:1!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar .qmes-erp-text{
      min-width:0!important;
      color:inherit!important;
      font-size:12px!important;
      line-height:1!important;
      font-weight:650!important;
      white-space:nowrap!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar .qmes-erp-foot{
      border-top:1px solid rgba(255,255,255,.10)!important;
      background:#354052!important;
      color:#8fa3b6!important;
      font-size:8px!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar.qmes-force-collapsed,
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar.qmes-force-collapsed:hover,
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar.qmes-force-collapsed:focus-within{
      width:54px!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar.qmes-force-collapsed .qmes-erp-text,
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar.qmes-force-collapsed .qmes-erp-foot{
      opacity:0!important;
      visibility:hidden!important;
      pointer-events:none!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar.qmes-force-collapsed .qmes-erp-section{
      height:0!important;
      min-height:0!important;
      margin:0!important;
      padding:0!important;
      font-size:0!important;
      line-height:0!important;
      overflow:hidden!important;
    }
    html body:not(.qmes-erp-menu-closed) #qmes-erp-sidebar.qmes-force-collapsed .qmes-erp-item{
      width:42px!important;
      margin-left:6px!important;
      margin-right:6px!important;
    }
  `;
  document.head.appendChild(hoverSidebarStyle);
  document.getElementById('qmes-sync-sidebar')?.remove();
  document.getElementById('qmes-sync-hamburger')?.remove();
  document.getElementById('qmes-erp-sidebar')?.remove();
  document.getElementById('qmes-erp-header')?.remove();
  document.body.classList.remove('qmes-side-open','qmes-erp-menu-closed');
  const qmesMain=document.querySelector('#root>div>main');
  if(qmesMain){
    qmesMain.style.setProperty('margin-left','36px','important');
    qmesMain.style.setProperty('width','calc(100% - 36px)','important');
  }

  const clean=value=>String(value||'').replace(/[›〉▣]/g,'').replace(/\s+/g,' ').trim();
  const readSessionUser=()=>{try{return JSON.parse(sessionStorage.getItem('qmes-current-user-v1')||'null');}catch(_error){return null;}};
  const currentUser=()=>window.__QMES_CURRENT_USER__||readSessionUser()||null;
  const accountText=()=> '사용자';
  const isAdminUser=()=>{
    const user=currentUser();
    return String(user?.role||'').trim().toLowerCase()==='admin';
  };

  const sections=[
    {label:'WORKSPACE',items:[
      {label:'통합 대시보드',icon:'▦',direct:'대시보드'},
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
  side.innerHTML=`<nav class="qmes-erp-nav" aria-label="업무 메뉴"></nav>`;
  document.body.appendChild(side);

  const stopSidebarScroll=(event)=>{
    if(side.contains(event.target)){
      event.preventDefault();
      event.stopPropagation();
    }
  };
  side.addEventListener("wheel",stopSidebarScroll,{passive:false});
  side.addEventListener("touchmove",stopSidebarScroll,{passive:false});

  const bellSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>';
  const mobileSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10 5h4M11 18.5h2"/></svg>';
  const userSvg='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6"/></svg>';

  const header=document.createElement('header');
  header.id='qmes-erp-header';
  header.dataset.qmesHeaderOwner='enterprise-test-20260910';
  header.setAttribute('aria-label','나모케미칼 상단 헤더');
  header.innerHTML=`
    <button type="button" class="qmes-erp-header-brand" aria-label="통합 대시보드"><img class="qmes-erp-official-logo" src="/assets/namo-header-logo.svg?v=20260903-official-logo4" alt="나모케미칼 로고"></button>
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
  header.querySelectorAll('.qmes-erp-header-menu,.qmes-erp-header-search,.qmes-erp-header-search-icon').forEach(node=>node.remove());
  Array.from(header.querySelectorAll('button')).forEach(button=>{
    const aria=String(button.getAttribute('aria-label')||'');
    if(/왼쪽 메뉴 (닫기|열기)/.test(aria))button.remove();
  });

  const nativeHeader=()=>document.querySelector('#root header:not(#qmes-erp-header)');
  const accountWrap=header.querySelector('.qmes-erp-account-wrap');
  const accountButton=header.querySelector('.qmes-erp-header-account');
  const accountLabel=header.querySelector('.qmes-erp-account-text');
  const accountMenu=header.querySelector('.qmes-erp-account-menu');
  const setAccountOpen=open=>{const visible=Boolean(open);accountWrap.classList.toggle('is-open',visible);accountButton.setAttribute('aria-expanded',String(visible));accountMenu.style.setProperty('display',visible?'block':'none','important');accountMenu.style.setProperty('visibility',visible?'visible':'hidden','important');accountMenu.style.setProperty('opacity',visible?'1':'0','important');accountMenu.style.setProperty('pointer-events',visible?'auto':'none','important');};
  const updateAccountLabel=()=>{accountLabel.textContent=accountText();};
  updateAccountLabel();

  let qmesAccountCloseTimer=null;
  const cancelAccountClose=()=>{if(qmesAccountCloseTimer){clearTimeout(qmesAccountCloseTimer);qmesAccountCloseTimer=null;}};
  const scheduleAccountClose=()=>{cancelAccountClose();qmesAccountCloseTimer=setTimeout(()=>setAccountOpen(false),320);};
  accountWrap.addEventListener('mouseenter',()=>{cancelAccountClose();setAccountOpen(true);});
  accountWrap.addEventListener('mouseleave',scheduleAccountClose);
  accountMenu.addEventListener('mouseenter',()=>{cancelAccountClose();setAccountOpen(true);});
  accountMenu.addEventListener('mouseleave',scheduleAccountClose);
  accountButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();cancelAccountClose();setAccountOpen(!accountWrap.classList.contains('is-open'));});
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
  function removeObsoleteInventoryMovementItem(){
    const removedLabels=new Set(['입출고 관리','LOT별 재고','재고실사']);
    side.querySelectorAll('.qmes-erp-item').forEach(button=>{
      const label=clean(button.querySelector('.qmes-erp-text')?.textContent||button.textContent);
      if(removedLabels.has(label))button.remove();
    });
  }
  const obsoleteMovementObserver=new MutationObserver(removeObsoleteInventoryMovementItem);
  obsoleteMovementObserver.observe(side,{childList:true,subtree:true});

  const tabToLabel={dash:'통합 대시보드',iqc:'수입검사 (IQC)',pqc:'공정검사 (PQC)',oqc:'출하검사 (OQC)',spc:'SPC (Cpk)',lock:'품질 인터락',coa:'출하성적서',prod:'생산 진행',woIssue:'작업지시서',prodProcess:'생산공정 관리',pop:'현장 입력 (iPad)',eq:'설비 모니터링',trace:'LOT 통합추적',members:'회원등록 현황'};
  const savedTab=()=>{try{return sessionStorage.getItem('qmes_current_tab')||'dash';}catch(_error){return 'dash';}};
  let activeLabel=tabToLabel[savedTab()]||'통합 대시보드';
  const topButtons=()=>Array.from(document.querySelectorAll('.qmes-top-menu-button'));
  const topLabel=button=>clean(button?.querySelector(':scope > span')?.textContent||button?.querySelector('span')?.textContent||button?.textContent);
  const findTop=label=>topButtons().find(button=>topLabel(button)===clean(label));
  const findSub=label=>Array.from(document.querySelectorAll('.qmes-submenu-button')).find(button=>clean(button.textContent)===clean(label));

  header.querySelector('.qmes-erp-header-mobile').addEventListener('click',()=>{window.location.assign('/mobile.html?v=20260903-mobile-dedicated1');});

  function render(){

    nav.replaceChildren();
    sections.forEach((section,sectionIndex)=>{
      const matches=section.items.map((item,itemIndex)=>({item,itemIndex})).filter(({item})=>(!item.adminOnly||isAdminUser()));
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
        button.title=item.label;
        button.innerHTML='<span class="qmes-erp-icon" aria-hidden="true"></span><span class="qmes-erp-text"></span>';
        button.querySelector('.qmes-erp-icon').textContent=item.icon;
        button.querySelector('.qmes-erp-text').textContent=item.label;
        nav.appendChild(button);
      });
    });
    removeObsoleteInventoryMovementItem();
  }

  const routeByLabel={
    '통합 대시보드':{tab:'dash'},
    '거래처 현황':{tab:'partners'},
    '생산 진행':{tab:'prod',openMenu:'productionMenu'},
    '작업지시서':{tab:'woIssue',openMenu:'productionMenu'},
    '생산공정 관리':{tab:'prodProcess',openMenu:'productionMenu'},
    '수입검사 (IQC)':{tab:'iqc',openMenu:'qualityMenu'},
    '공정검사 (PQC)':{tab:'pqc',openMenu:'qualityMenu'},
    '출하검사 (OQC)':{tab:'oqc',openMenu:'qualityMenu'},
    'SPC (Cpk)':{tab:'spc',openMenu:'qualityMenu'},
    '품질 인터락':{tab:'lock',openMenu:'qualityMenu'},
    '출하성적서':{tab:'coa',openMenu:'qualityMenu'},
    'LOT 통합추적':{tab:'trace'},
    '부적합 (8D)':{tab:'ncr',openMenu:'nonconformityMenu'},
    '고객불만 (GQMS)':{tab:'cc',openMenu:'nonconformityMenu'},
    '4M 변경관리':{tab:'4m',openMenu:'nonconformityMenu'},
    '현장 입력 (iPad)':{tab:'pop'},
    '설비 모니터링':{tab:'eq'},
    '회원등록 현황':{tab:'members'}
  };
  function dispatchTab(tab,openMenu){
    if(!tab)return;
    try{
      sessionStorage.setItem('qmes_current_tab',tab);
      if(openMenu)sessionStorage.setItem('qmes_open_menu',openMenu);
      else sessionStorage.removeItem('qmes_open_menu');
    }catch(_error){}
    window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:tab,openMenu:openMenu||null}}));
  }
  function navigate(item){
    if(!item||item.adminOnly&&!isAdminUser())return;
    activeLabel=item.label;
    try{sessionStorage.setItem('qmes_erp_active_label',activeLabel);}catch(_error){}
    render();
    if(item.inventory){
      try{sessionStorage.setItem('qmes_inventory_section',item.inventory);}catch(_error){}
      dispatchTab('inv',null);
      window.dispatchEvent(new CustomEvent('qmes:inventory-section',{detail:{section:item.inventory}}));
      return;
    }
    if(item.tab){dispatchTab(item.tab,item.openMenu||null);return;}
    const mapped=routeByLabel[item.label];
    if(mapped){dispatchTab(mapped.tab,mapped.openMenu||null);return;}
    if(item.direct){const top=findTop(item.direct);if(top)top.click();return;}
    if(item.sub){const submenu=findSub(item.sub);if(submenu){submenu.click();return;}const top=findTop(item.group);if(top)top.click();requestAnimationFrame(()=>requestAnimationFrame(()=>{const next=findSub(item.sub);if(next)next.click();}));}
  }

  const alignMainToCollapsedSidebar=()=>{
    const main=document.querySelector('#root>div>main');
    if(!main)return;
    main.style.setProperty('margin-left','36px','important');
    main.style.setProperty('width','calc(100% - 36px)','important');
  };

  side.addEventListener('mouseleave',()=>side.classList.remove('qmes-force-collapsed'));

  // Fallback: if the cursor enters the blank strip next to the collapsed sidebar,
  // align the main content immediately as well.
  document.addEventListener('pointermove',event=>{
    if(event.clientX>54&&event.clientX<=236){
      alignMainToCollapsedSidebar();
    }
  },{passive:true});

  nav.addEventListener('click',event=>{
    const button=event.target.closest('.qmes-erp-item');
    if(!button)return;
    const section=sections[Number(button.dataset.sectionIndex)];
    navigate(section?.items?.[Number(button.dataset.itemIndex)]);
    side.classList.add('qmes-force-collapsed');
    alignMainToCollapsedSidebar();
    requestAnimationFrame(()=>requestAnimationFrame(alignMainToCollapsedSidebar));
  });

  const syncActiveFromRoute=()=>{
    const next=tabToLabel[savedTab()];
    if(next&&next!==activeLabel){
      activeLabel=next;
      try{sessionStorage.setItem('qmes_erp_active_label',activeLabel);}catch(_error){}
      render();
    }
  };
  let lastAdminState=isAdminUser();
  let lastUserSignature='';
  const syncUserAndAdminMenu=()=>{
    const user=currentUser();
    const signature=String(user?.role||'');
    const adminState=isAdminUser();
    if(signature!==lastUserSignature||adminState!==lastAdminState){
      lastUserSignature=signature;
      lastAdminState=adminState;
      updateAccountLabel();
      render();
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