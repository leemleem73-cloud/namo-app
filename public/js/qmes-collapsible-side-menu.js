(function(){
  "use strict";
  if(window.__QMES_SYNC_SIDEBAR_MASTER_20260903__) return;
  window.__QMES_SYNC_SIDEBAR_MASTER_20260903__=true;
  window.__QMES_SYNC_SIDEBAR_V12_11__=true;

  const clean=v=>String(v||"").replace(/[›〉▣]/g,"").replace(/\s+/g," ").trim();
  const menuMap={
    '대시보드':[{label:'종합 대시보드',direct:'대시보드'},{label:'SPC 대시보드',group:'품질검사',sub:'SPC (Cpk)'}],
    '생산관리':[{label:'생산 진행',group:'생산관리',sub:'생산 (배치)'},{label:'작업지시서',group:'생산관리',sub:'작업지시서'},{label:'생산공정 관리',tab:'prodProcess',openMenu:'productionMenu'}],
    '품질검사':[{label:'수입검사 (IQC)',group:'품질검사',sub:'수입검사 (IQC)'},{label:'공정검사 (PQC)',group:'품질검사',sub:'공정검사 (PQC)'},{label:'출하검사 (OQC)',group:'품질검사',sub:'출하검사 (OQC)'},{label:'SPC (Cpk)',group:'품질검사',sub:'SPC (Cpk)'},{label:'품질 인터락',group:'품질검사',sub:'품질 인터락 (차단)'},{label:'출하성적서',group:'품질검사',sub:'출하성적서'}],
    '재고관리':[{label:'재고현황',inventory:'overview'},{label:'입출고 관리',inventory:'movement'},{label:'LOT별 재고',inventory:'lot'},{label:'생산투입/완료',inventory:'production'},{label:'재고실사',inventory:'count'}],
    '부적합관리':[{label:'부적합 (8D)',group:'부적합관리',sub:'부적합 (8D)'},{label:'고객불만 (GQMS)',group:'부적합관리',sub:'고객불만 (GQMS)'},{label:'4M 변경관리',group:'부적합관리',sub:'4M 변경관리'}],
    '수주납기':[{label:'수주 · 납기관리',tab:'erpSales'}],
    '생산계획':[{label:'생산계획 · MRP',tab:'erpPlan'}],
    '구매발주':[{label:'구매 · 발주관리',tab:'erpPurchase'}],
    '출하물류':[{label:'출하 · 납품관리',tab:'erpShipping'}],
    '현장입력':[{label:'현장 입력 (iPad)',direct:'현장입력'}],
    '거래처 현황':[{label:'거래처 현황',direct:'거래처 현황'}],
    '설비관리':[{label:'설비 모니터링',direct:'설비관리'}],
    'LOT 추적':[{label:'LOT 추적',direct:'LOT 추적'}]
  };
  const sections=[
    {label:'WORKSPACE',groups:['대시보드']},
    {label:'ERP',groups:['수주납기','생산계획','구매발주','재고관리','거래처 현황']},
    {label:'MES · QMS',groups:['생산관리','품질검사','LOT 추적','출하물류','부적합관리','현장입력','설비관리']}
  ];
  const topButtons=()=>Array.from(document.querySelectorAll('.qmes-top-menu-button'));
  const topLabel=b=>clean(b?.querySelector(':scope > span')?.textContent||b?.querySelector('span')?.textContent||b?.textContent);
  const findTop=label=>topButtons().find(b=>topLabel(b)===clean(label));
  const findSub=label=>Array.from(document.querySelectorAll('.qmes-submenu-button')).find(b=>clean(b.textContent)===clean(label));

  ['qmes-sync-sidebar','qmes-sync-hamburger','qmes-left-menu','qmes-left-native-menu','qmes-context-side-menu','qmes-stable-sidebar','qmes-safe-sidebar'].forEach(id=>document.getElementById(id)?.remove());
  ['qmes-sync-sidebar-style','qmes-left-menu-style','qmes-left-native-menu-style','qmes-context-side-menu-style','qmes-stable-sidebar-style','qmes-safe-sidebar-style','qmes-top-submenu-fix-style','qmes-restore-vertical-dropdown-style'].forEach(id=>document.getElementById(id)?.remove());

  const side=document.createElement('aside');
  side.id='qmes-sync-sidebar';
  side.dataset.qmesMenuVersion='master-20260903';
  side.innerHTML='<div class="qmes-side-groups"></div>';
  document.body.appendChild(side);

  const hamburger=document.createElement('button');
  hamburger.id='qmes-sync-hamburger';
  hamburger.type='button';
  hamburger.setAttribute('aria-label','왼쪽 메뉴 열기');
  hamburger.textContent='☰';
  document.body.appendChild(hamburger);

  const groupsWrap=side.querySelector('.qmes-side-groups');
  let activeGroup='',activeLabel='',internal=false,printLayoutActive=false;
  const openGroups=new Set(['대시보드']);

  function clearMainShift(main){
    if(!main||main.dataset.qmesSidebarShift!=='true') return;
    ['margin-left','width','box-sizing','transition'].forEach(p=>main.style.removeProperty(p));
    delete main.dataset.qmesSidebarShift;
  }
  function syncMainLayout(){
    const main=document.querySelector('#root>div>main');
    if(!main) return;
    if(printLayoutActive){clearMainShift(main);return;}
    if(document.body.classList.contains('qmes-side-open')){
      const width=window.matchMedia('(max-width:1180px)').matches?'220px':'248px';
      main.dataset.qmesSidebarShift='true';
      main.style.setProperty('margin-left',width,'important');
      main.style.setProperty('width','calc(100% - '+width+')','important');
      main.style.setProperty('box-sizing','border-box','important');
      main.style.setProperty('transition','none','important');
      return;
    }
    clearMainShift(main);
  }
  function settle(){syncMainLayout();}
  function makeItem(group,item,index){
    const b=document.createElement('button');
    b.type='button';
    b.className='qmes-side-item'+(activeGroup===group&&activeLabel===item.label?' is-active':'');
    b.dataset.group=group;b.dataset.index=String(index);
    if(item.inventory)b.dataset.qmesInvSide=item.inventory;
    if(item.tab)b.dataset.qmesTab=item.tab;
    b.textContent=item.label;
    return b;
  }
  function render(){
    groupsWrap.replaceChildren();
    sections.forEach(sectionInfo=>{
      const label=document.createElement('div');
      label.className='qmes-side-section-label';
      label.textContent=sectionInfo.label;
      groupsWrap.appendChild(label);
      sectionInfo.groups.forEach(group=>{
        const items=menuMap[group]||[];
        const section=document.createElement('section');
        section.className='qmes-side-group';
        section.dataset.group=group;
        const expanded=openGroups.has(group);
        if(expanded)section.classList.add('is-open');
        const toggle=document.createElement('button');
        toggle.type='button';toggle.className='qmes-side-group-toggle';toggle.dataset.group=group;
        toggle.setAttribute('aria-expanded',expanded?'true':'false');
        toggle.innerHTML='<span class="qmes-side-group-title"></span><span class="qmes-side-group-arrow" aria-hidden="true">›</span>';
        toggle.querySelector('.qmes-side-group-title').textContent=group;
        const itemWrap=document.createElement('div');itemWrap.className='qmes-side-group-items';
        items.forEach((item,index)=>itemWrap.appendChild(makeItem(group,item,index)));
        section.append(toggle,itemWrap);groupsWrap.appendChild(section);
      });
    });
  }
  function showSidebar(){document.body.classList.add('qmes-side-open');syncMainLayout();}
  function toggleGroup(group){if(!menuMap[group])return;if(openGroups.has(group))openGroups.delete(group);else openGroups.add(group);render();}
  function markActive(group,item){activeGroup=group;activeLabel=item?.label||'';openGroups.add(group);render();}
  function dispatchTab(tab,openMenu){window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab,openMenu:openMenu||null}}));}
  function navigate(group,item){
    if(!item)return;
    markActive(group,item);
    if(item.inventory){try{sessionStorage.setItem('qmes_inventory_section',item.inventory);}catch(_error){}dispatchTab('inv');window.dispatchEvent(new CustomEvent('qmes:inventory-section',{detail:{section:item.inventory}}));return;}
    if(item.tab){dispatchTab(item.tab,item.openMenu);if(item.tab==='prodProcess')requestAnimationFrame(()=>dispatchTab(item.tab,item.openMenu));return;}
    if(item.direct){const top=findTop(item.direct);if(top){internal=true;top.click();setTimeout(()=>internal=false,0);return;}}
    if(item.sub){const sub=findSub(item.sub);if(sub){sub.click();return;}const top=findTop(item.group);if(top){internal=true;top.click();setTimeout(()=>internal=false,0);requestAnimationFrame(()=>requestAnimationFrame(()=>findSub(item.sub)?.click()));}}
  }

  side.addEventListener('click',event=>{
    const groupButton=event.target.closest('.qmes-side-group-toggle');
    if(groupButton){toggleGroup(groupButton.dataset.group);return;}
    const itemButton=event.target.closest('.qmes-side-item');
    if(!itemButton)return;
    const group=itemButton.dataset.group,item=menuMap[group]?.[Number(itemButton.dataset.index)];
    navigate(group,item);
  });
  hamburger.addEventListener('click',showSidebar);
  window.qmesSetGlobalSidebarGroup=group=>{
    const aliases={'수주·납기':'수주납기','생산계획·MRP':'생산계획','구매·발주':'구매발주','출하·납품':'출하물류'};
    const target=menuMap[group]?group:aliases[group];if(!target||!menuMap[target])return;
    openGroups.add(target);render();showSidebar();
  };
  document.addEventListener('click',event=>{
    if(internal)return;
    const top=event.target.closest?.('.qmes-top-menu-button');if(!top)return;
    const label=topLabel(top),aliases={'수주·납기':'수주납기','생산계획·MRP':'생산계획','구매·발주':'구매발주','출하·납품':'출하물류'};
    const target=menuMap[label]?label:aliases[label];if(target){openGroups.add(target);render();}
  },true);
  const layoutObserver=new MutationObserver(syncMainLayout);
  layoutObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('beforeprint',()=>{printLayoutActive=true;syncMainLayout();});
  window.addEventListener('afterprint',()=>{printLayoutActive=false;syncMainLayout();});
  window.addEventListener('resize',settle,{passive:true});
  render();requestAnimationFrame(settle);
})();