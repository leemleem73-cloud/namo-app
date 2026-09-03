(function(){
  "use strict";
  if(window.__QMES_LEFT_NAV_BEHAVIOR_20260903_V4__) return;
  window.__QMES_LEFT_NAV_BEHAVIOR_20260903_V4__=true;

  const clean=v=>String(v||"").replace(/[›〉▣]/g,"").replace(/\s+/g," ").trim();
  const sections=[
    {label:'WORKSPACE',items:[{label:'통합 대시보드',icon:'D',direct:'대시보드'},{label:'SPC 대시보드',icon:'C',group:'품질검사',sub:'SPC (Cpk)'}]},
    {label:'ERP',items:[{label:'수주 · 납기관리',icon:'S',tab:'erpSales'},{label:'생산계획 · MRP',icon:'P',tab:'erpPlan'},{label:'구매 · 발주관리',icon:'B',tab:'erpPurchase'},{label:'재고현황',icon:'I',inventory:'overview'},{label:'입출고 관리',icon:'↔',inventory:'movement'},{label:'LOT별 재고',icon:'L',inventory:'lot'},{label:'생산투입/완료',icon:'R',inventory:'production'},{label:'재고실사',icon:'C',inventory:'count'},{label:'거래처 현황',icon:'V',direct:'거래처 현황'}]},
    {label:'MES · QMS',items:[{label:'생산 진행',icon:'M',group:'생산관리',sub:'생산 (배치)'},{label:'작업지시서',icon:'W',group:'생산관리',sub:'작업지시서'},{label:'생산공정 관리',icon:'P',tab:'prodProcess',openMenu:'productionMenu'},{label:'수입검사 (IQC)',icon:'Q',group:'품질검사',sub:'수입검사 (IQC)'},{label:'공정검사 (PQC)',icon:'Q',group:'품질검사',sub:'공정검사 (PQC)'},{label:'출하검사 (OQC)',icon:'Q',group:'품질검사',sub:'출하검사 (OQC)'},{label:'SPC (Cpk)',icon:'C',group:'품질검사',sub:'SPC (Cpk)'},{label:'품질 인터락',icon:'!',group:'품질검사',sub:'품질 인터락 (차단)'},{label:'출하성적서',icon:'R',group:'품질검사',sub:'출하성적서'},{label:'LOT 통합추적',icon:'L',direct:'LOT 추적'},{label:'출하 · 납품관리',icon:'O',tab:'erpShipping'},{label:'부적합 (8D)',icon:'8',group:'부적합관리',sub:'부적합 (8D)'},{label:'고객불만 (GQMS)',icon:'G',group:'부적합관리',sub:'고객불만 (GQMS)'},{label:'4M 변경관리',icon:'4',group:'부적합관리',sub:'4M 변경관리'},{label:'현장 입력 (iPad)',icon:'T',direct:'현장입력'},{label:'설비 모니터링',icon:'E',direct:'설비관리'}]}
  ];

  const currentSideId='qmes-sync-sidebar';
  const currentHamburgerId='qmes-sync-hamburger';
  const legacyMenuIds=[
    'qmes-left-menu','qmes-left-native-menu','qmes-context-side-menu',
    'qmes-stable-sidebar','qmes-safe-sidebar'
  ];
  const legacyStyleIds=[
    'qmes-left-nav-runtime-style','qmes-sync-sidebar-style','qmes-left-menu-style',
    'qmes-left-native-menu-style','qmes-context-side-menu-style','qmes-stable-sidebar-style',
    'qmes-safe-sidebar-style','qmes-top-submenu-fix-style','qmes-restore-vertical-dropdown-style'
  ];

  function removeLegacyArtifacts(){
    legacyMenuIds.forEach(id=>document.getElementById(id)?.remove());
    legacyStyleIds.forEach(id=>document.getElementById(id)?.remove());
    document.querySelectorAll('[data-qmes-sidebar-owner]').forEach(node=>{
      if(node.id!==currentSideId) node.remove();
    });
  }

  document.getElementById(currentSideId)?.remove();
  document.getElementById(currentHamburgerId)?.remove();
  removeLegacyArtifacts();

  const side=document.createElement('aside');
  side.id=currentSideId;
  side.dataset.qmesSidebarOwner='shell-core-20260903-v4';
  side.innerHTML='<div class="qmes-side-meta"><div class="qmes-company-pill"><span>㈜나모케미칼</span><b class="qmes-company-status">정상운영</b></div></div><div class="qmes-side-groups"></div>';
  document.body.appendChild(side);

  const hamburger=document.createElement('button');
  hamburger.id=currentHamburgerId;
  hamburger.type='button';
  hamburger.setAttribute('aria-label','왼쪽 메뉴');
  hamburger.textContent='☰';
  document.body.appendChild(hamburger);

  document.body.classList.add('qmes-side-open');
  const wrap=side.querySelector('.qmes-side-groups');
  let activeLabel='통합 대시보드';

  const topButtons=()=>Array.from(document.querySelectorAll('.qmes-top-menu-button'));
  const topLabel=b=>clean(b?.querySelector(':scope > span')?.textContent||b?.querySelector('span')?.textContent||b?.textContent);
  const findTop=label=>topButtons().find(b=>topLabel(b)===clean(label));
  const findSub=label=>Array.from(document.querySelectorAll('.qmes-submenu-button')).find(b=>clean(b.textContent)===clean(label));

  function render(){
    wrap.replaceChildren();
    sections.forEach((section,si)=>{
      const h=document.createElement('div');
      h.className='qmes-side-section-label';
      h.textContent=section.label;
      wrap.appendChild(h);
      section.items.forEach((item,ii)=>{
        const b=document.createElement('button');
        b.type='button';
        b.className='qmes-side-item'+(activeLabel===item.label?' is-active':'');
        b.dataset.s=si;b.dataset.i=ii;
        b.innerHTML='<span class="qmes-side-icon"></span><span class="qmes-side-text"></span>';
        b.querySelector('.qmes-side-icon').textContent=item.icon;
        b.querySelector('.qmes-side-text').textContent=item.label;
        wrap.appendChild(b);
      });
    });
  }

  function navigate(item){
    if(!item)return;
    activeLabel=item.label;
    render();
    if(item.inventory){
      try{sessionStorage.setItem('qmes_inventory_section',item.inventory)}catch(e){}
      window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:'inv',openMenu:null}}));
      window.dispatchEvent(new CustomEvent('qmes:inventory-section',{detail:{section:item.inventory}}));
      return;
    }
    if(item.tab){window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:item.tab,openMenu:item.openMenu||null}}));return;}
    if(item.direct){findTop(item.direct)?.click();return;}
    if(item.sub){
      const sub=findSub(item.sub);
      if(sub){sub.click();return;}
      findTop(item.group)?.click();
      requestAnimationFrame(()=>requestAnimationFrame(()=>findSub(item.sub)?.click()));
    }
  }

  side.addEventListener('click',e=>{
    const b=e.target.closest('.qmes-side-item');
    if(!b)return;
    navigate(sections[+b.dataset.s]?.items?.[+b.dataset.i]);
  });
  hamburger.addEventListener('click',()=>document.body.classList.toggle('qmes-side-open'));

  /* React and legacy patches may mount after this file. Remove only known old shell artifacts
     whenever they are reinserted; the current sidebar and feature-specific module sidebars stay intact. */
  const observer=new MutationObserver(()=>{
    removeLegacyArtifacts();
    const duplicateSides=Array.from(document.querySelectorAll('#'+currentSideId));
    duplicateSides.slice(1).forEach(node=>node.remove());
    const duplicateHamburgers=Array.from(document.querySelectorAll('#'+currentHamburgerId));
    duplicateHamburgers.slice(1).forEach(node=>node.remove());
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  render();
})();