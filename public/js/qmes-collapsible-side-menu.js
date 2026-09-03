(function(){
  "use strict";
  if(window.__QMES_SIDEBAR_FLAT_REFERENCE_20260903__) return;
  window.__QMES_SIDEBAR_FLAT_REFERENCE_20260903__=true;
  window.__QMES_SYNC_SIDEBAR_V18_ERP_THEME__=true;
  window.__QMES_SYNC_SIDEBAR_V12_11__=true;

  const clean=v=>String(v||"").replace(/[›〉▣]/g,"").replace(/\s+/g," ").trim();
  const sections=[
    {label:'WORKSPACE',items:[
      {label:'통합 대시보드',icon:'D',direct:'대시보드'},
      {label:'SPC 대시보드',icon:'C',group:'품질검사',sub:'SPC (Cpk)'}
    ]},
    {label:'ERP',items:[
      {label:'수주 · 납기관리',icon:'S',tab:'erpSales'},
      {label:'생산계획 · MRP',icon:'P',tab:'erpPlan'},
      {label:'구매 · 발주관리',icon:'B',tab:'erpPurchase'},
      {label:'재고현황',icon:'I',inventory:'overview'},
      {label:'입출고 관리',icon:'↔',inventory:'movement'},
      {label:'LOT별 재고',icon:'L',inventory:'lot'},
      {label:'생산투입/완료',icon:'R',inventory:'production'},
      {label:'재고실사',icon:'C',inventory:'count'},
      {label:'거래처 현황',icon:'V',direct:'거래처 현황'}
    ]},
    {label:'MES · QMS',items:[
      {label:'생산 진행',icon:'M',group:'생산관리',sub:'생산 (배치)'},
      {label:'작업지시서',icon:'W',group:'생산관리',sub:'작업지시서'},
      {label:'생산공정 관리',icon:'P',tab:'prodProcess',openMenu:'productionMenu'},
      {label:'수입검사 (IQC)',icon:'Q',group:'품질검사',sub:'수입검사 (IQC)'},
      {label:'공정검사 (PQC)',icon:'Q',group:'품질검사',sub:'공정검사 (PQC)'},
      {label:'출하검사 (OQC)',icon:'Q',group:'품질검사',sub:'출하검사 (OQC)'},
      {label:'SPC (Cpk)',icon:'C',group:'품질검사',sub:'SPC (Cpk)'},
      {label:'품질 인터락',icon:'!',group:'품질검사',sub:'품질 인터락 (차단)'},
      {label:'출하성적서',icon:'R',group:'품질검사',sub:'출하성적서'},
      {label:'LOT 통합추적',icon:'L',direct:'LOT 추적'},
      {label:'출하 · 납품관리',icon:'O',tab:'erpShipping'},
      {label:'부적합 (8D)',icon:'8',group:'부적합관리',sub:'부적합 (8D)'},
      {label:'고객불만 (GQMS)',icon:'G',group:'부적합관리',sub:'고객불만 (GQMS)'},
      {label:'4M 변경관리',icon:'4',group:'부적합관리',sub:'4M 변경관리'},
      {label:'현장 입력 (iPad)',icon:'T',direct:'현장입력'},
      {label:'설비 모니터링',icon:'E',direct:'설비관리'}
    ]}
  ];

  const topButtons=()=>Array.from(document.querySelectorAll('.qmes-top-menu-button'));
  const topLabel=b=>clean(b?.querySelector(':scope > span')?.textContent||b?.querySelector('span')?.textContent||b?.textContent);
  const findTop=label=>topButtons().find(b=>topLabel(b)===clean(label));
  const findSub=label=>Array.from(document.querySelectorAll('.qmes-submenu-button')).find(b=>clean(b.textContent)===clean(label));

  ['qmes-sync-sidebar','qmes-sync-hamburger','qmes-left-menu','qmes-left-native-menu','qmes-context-side-menu','qmes-stable-sidebar','qmes-safe-sidebar'].forEach(id=>document.getElementById(id)?.remove());
  ['qmes-sync-sidebar-style','qmes-left-menu-style','qmes-left-native-menu-style','qmes-context-side-menu-style','qmes-stable-sidebar-style','qmes-safe-sidebar-style','qmes-top-submenu-fix-style','qmes-restore-vertical-dropdown-style'].forEach(id=>document.getElementById(id)?.remove());

  const side=document.createElement('aside');
  side.id='qmes-sync-sidebar';
  side.dataset.qmesMenuVersion='flat-reference-20260903';
  side.innerHTML='<div class="qmes-side-groups"></div>';
  document.body.appendChild(side);

  const hamburger=document.createElement('button');
  hamburger.id='qmes-sync-hamburger';
  hamburger.type='button';
  hamburger.setAttribute('aria-label','왼쪽 메뉴 열기');
  hamburger.textContent='☰';
  document.body.appendChild(hamburger);

  const wrap=side.querySelector('.qmes-side-groups');
  let activeLabel='',internal=false,printLayoutActive=false;

  function clearMainShift(main){if(!main||main.dataset.qmesSidebarShift!=='true')return;['margin-left','width','box-sizing','transition'].forEach(p=>main.style.removeProperty(p));delete main.dataset.qmesSidebarShift;}
  function syncMainLayout(){const main=document.querySelector('#root>div>main');if(!main)return;if(printLayoutActive){clearMainShift(main);return;}if(document.body.classList.contains('qmes-side-open')){const width=window.matchMedia('(max-width:1180px)').matches?'220px':'248px';main.dataset.qmesSidebarShift='true';main.style.setProperty('margin-left',width,'important');main.style.setProperty('width','calc(100% - '+width+')','important');main.style.setProperty('box-sizing','border-box','important');main.style.setProperty('transition','none','important');return;}clearMainShift(main);}

  function render(){
    wrap.replaceChildren();
    sections.forEach((section,sectionIndex)=>{
      const label=document.createElement('div');label.className='qmes-side-section-label';label.textContent=section.label;wrap.appendChild(label);
      section.items.forEach((item,itemIndex)=>{
        const b=document.createElement('button');b.type='button';b.className='qmes-side-item'+(activeLabel===item.label?' is-active':'');b.dataset.section=String(sectionIndex);b.dataset.index=String(itemIndex);
        b.innerHTML='<span class="qmes-side-icon"></span><span class="qmes-side-text"></span>';
        b.querySelector('.qmes-side-icon').textContent=item.icon||'•';
        b.querySelector('.qmes-side-text').textContent=item.label;
        wrap.appendChild(b);
      });
    });
  }
  function showSidebar(){document.body.classList.add('qmes-side-open');syncMainLayout();}
  function navigate(item){
    if(!item)return;activeLabel=item.label;render();
    if(item.inventory){try{sessionStorage.setItem('qmes_inventory_section',item.inventory);}catch(_error){}window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:'inv',openMenu:null}}));window.dispatchEvent(new CustomEvent('qmes:inventory-section',{detail:{section:item.inventory}}));return;}
    if(item.tab){window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:item.tab,openMenu:item.openMenu||null}}));if(item.tab==='prodProcess')requestAnimationFrame(()=>window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{detail:{tab:item.tab,openMenu:item.openMenu||null}})));return;}
    if(item.direct){const top=findTop(item.direct);if(top){internal=true;top.click();setTimeout(()=>internal=false,0);}return;}
    if(item.sub){const sub=findSub(item.sub);if(sub){sub.click();return;}const top=findTop(item.group);if(top){internal=true;top.click();setTimeout(()=>internal=false,0);requestAnimationFrame(()=>requestAnimationFrame(()=>findSub(item.sub)?.click()));}}
  }

  side.addEventListener('click',event=>{const b=event.target.closest('.qmes-side-item');if(!b)return;const section=sections[Number(b.dataset.section)],item=section?.items?.[Number(b.dataset.index)];navigate(item);});
  hamburger.addEventListener('click',showSidebar);
  window.qmesSetGlobalSidebarGroup=()=>showSidebar();

  document.addEventListener('click',event=>{if(internal)return;const top=event.target.closest?.('.qmes-top-menu-button');if(!top)return;const label=topLabel(top);for(const section of sections){const item=section.items.find(x=>clean(x.direct||x.group||x.label)===label||clean(x.label)===label);if(item){activeLabel=item.label;render();break;}}},true);

  const layoutObserver=new MutationObserver(syncMainLayout);layoutObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('beforeprint',()=>{printLayoutActive=true;syncMainLayout();});
  window.addEventListener('afterprint',()=>{printLayoutActive=false;syncMainLayout();});
  window.addEventListener('resize',syncMainLayout,{passive:true});
  render();requestAnimationFrame(syncMainLayout);
})();