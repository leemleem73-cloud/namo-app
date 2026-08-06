(function(){
  "use strict";
  if(window.__QMES_SYNC_SIDEBAR_V2__) return;
  window.__QMES_SYNC_SIDEBAR_V2__=true;

  const clean=v=>String(v||"").replace(/[›〉]/g,"").replace(/\s+/g," ").trim();
  const menuMap={
    '대시보드':[{label:'종합 대시보드',direct:'대시보드'},{label:'SPC 대시보드',group:'품질검사',sub:'SPC (Cpk)'}],
    '생산관리':[{label:'생산 진행',group:'생산관리',sub:'생산 (배치)'},{label:'작업지시서',group:'생산관리',sub:'작업지시서'}],
    '품질검사':[{label:'수입검사 (IQC)',group:'품질검사',sub:'수입검사 (IQC)'},{label:'공정검사 (PQC)',group:'품질검사',sub:'공정검사 (PQC)'},{label:'출하검사 (OQC)',group:'품질검사',sub:'출하검사 (OQC)'},{label:'SPC (Cpk)',group:'품질검사',sub:'SPC (Cpk)'},{label:'품질 인터락',group:'품질검사',sub:'품질 인터락 (차단)'},{label:'출하성적서',group:'품질검사',sub:'출하성적서'}],
    '현장입력':[{label:'현장 입력 (iPad)',direct:'현장입력'}],
    '재고관리':[{label:'원재료 재고',direct:'재고관리'}],
    '거래처 현황':[{label:'거래처 현황',direct:'거래처 현황'}],
    '설비관리':[{label:'설비 모니터링',direct:'설비관리'}],
    'LOT 추적':[{label:'LOT 추적',direct:'LOT 추적'}],
    '부적합관리':[{label:'부적합 (8D)',group:'부적합관리',sub:'부적합 (8D)'},{label:'고객불만 (GQMS)',group:'부적합관리',sub:'고객불만 (GQMS)'},{label:'4M 변경관리',group:'부적합관리',sub:'4M 변경관리'}]
  };
  const groups=Object.keys(menuMap);
  const topButtons=()=>Array.from(document.querySelectorAll('.qmes-top-menu-button'));
  const topLabel=button=>clean(button?.querySelector('span')?.textContent||button?.textContent);
  const findTop=label=>topButtons().find(button=>topLabel(button)===label);

  ['qmes-sync-sidebar','qmes-sync-hamburger','qmes-left-menu','qmes-left-native-menu','qmes-context-side-menu','qmes-stable-sidebar','qmes-safe-sidebar'].forEach(id=>document.getElementById(id)?.remove());
  ['qmes-sync-sidebar-style','qmes-left-menu-style','qmes-left-native-menu-style','qmes-context-side-menu-style','qmes-stable-sidebar-style','qmes-safe-sidebar-style','qmes-top-submenu-fix-style','qmes-restore-vertical-dropdown-style'].forEach(id=>document.getElementById(id)?.remove());
  document.body?.classList.remove('qmes-side-open');

  const style=document.createElement('style');
  style.id='qmes-sync-sidebar-style';
  style.textContent=`
    .qmes-submenu-row{display:none!important}
    .qmes-top-menu-button span{display:inline!important;visibility:visible!important;opacity:1!important}
    #qmes-all-menu-dropdown{display:block!important}
    #qmes-all-menu-dropdown:not(.is-open){opacity:0!important;visibility:hidden!important;pointer-events:none!important}
    #qmes-all-menu-dropdown.is-open{opacity:1!important;visibility:visible!important;pointer-events:auto!important}
    #qmes-sync-sidebar{position:fixed;left:0;top:var(--qmes-side-top,72px);bottom:0;width:220px;background:#fff;border-right:1px solid #e4e8ee;box-shadow:3px 0 12px rgba(15,23,42,.05);z-index:11000;transform:translateX(-100%);transition:transform .18s ease;box-sizing:border-box;padding:12px 10px;overflow:auto}
    body.qmes-side-open #qmes-sync-sidebar{transform:translateX(0)}
    #qmes-sync-sidebar .qmes-side-head{display:flex;align-items:center;justify-content:space-between;padding:5px 8px 11px;border-bottom:1px solid #edf0f4;margin-bottom:7px}
    #qmes-sync-sidebar .qmes-side-title{font-size:14px;font-weight:800;color:#172033}
    #qmes-sync-sidebar .qmes-side-close{width:28px;height:28px;border:0;border-radius:6px;background:transparent;color:#64748b;font-size:19px;cursor:pointer}
    #qmes-sync-sidebar .qmes-side-close:hover{background:#f1f5f9;color:#172033}
    #qmes-sync-sidebar .qmes-side-item{position:relative;display:flex;align-items:center;width:100%;min-height:40px;padding:9px 10px 9px 14px;margin:2px 0;border:0;border-radius:7px;background:transparent;color:#475569;font-size:13px;font-weight:700;text-align:left;cursor:pointer}
    #qmes-sync-sidebar .qmes-side-item:hover{background:#f4f7fa;color:#172033}
    #qmes-sync-sidebar .qmes-side-item.is-active{background:#edf4ff;color:#175cd3}
    #qmes-sync-sidebar .qmes-side-item.is-active:before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:3px;background:#2563eb}
    #qmes-sync-hamburger{position:fixed;left:var(--qmes-hamburger-left,12px);top:var(--qmes-hamburger-top,82px);z-index:10990;width:34px;height:34px;padding:0;border:1px solid #dce2e8;border-radius:8px;background:#fff;color:#334155;box-shadow:0 2px 7px rgba(15,23,42,.06);font-size:18px;line-height:32px;text-align:center;cursor:pointer}
    body.qmes-side-open #qmes-sync-hamburger{display:none}
    body.qmes-side-open main,body.qmes-side-open #root>div>main,body.qmes-side-open .qmes-main,body.qmes-side-open .qmes-content{margin-left:220px!important;width:calc(100% - 220px)!important;box-sizing:border-box;transition:margin-left .18s ease,width .18s ease}
    @media(max-width:900px){#qmes-sync-sidebar{width:190px}body.qmes-side-open main,body.qmes-side-open #root>div>main,body.qmes-side-open .qmes-main,body.qmes-side-open .qmes-content{margin-left:190px!important;width:calc(100% - 190px)!important}}
  `;
  document.head.appendChild(style);

  const side=document.createElement('aside');
  side.id='qmes-sync-sidebar';
  side.innerHTML='<div class="qmes-side-head"><div class="qmes-side-title"></div><button class="qmes-side-close" type="button" aria-label="메뉴 접기">×</button></div><div class="qmes-side-items"></div>';
  document.body.appendChild(side);
  const hamburger=document.createElement('button');
  hamburger.id='qmes-sync-hamburger';
  hamburger.type='button';
  hamburger.setAttribute('aria-label','메뉴 열기');
  hamburger.textContent='☰';
  document.body.appendChild(hamburger);

  let currentGroup='';
  let activeLabel='';
  let internal=false;

  function setPositions(){
    const bar=document.querySelector('.qmes-top-menu-bar')||document.querySelector('.qmes-top-menu');
    const bottom=bar?Math.round(bar.getBoundingClientRect().bottom):72;
    document.documentElement.style.setProperty('--qmes-side-top',bottom+'px');
    const dash=findTop('대시보드');
    if(dash){
      const rect=dash.getBoundingClientRect();
      const size=34;
      document.documentElement.style.setProperty('--qmes-hamburger-left',Math.max(6,Math.round(rect.left-size-8))+'px');
      document.documentElement.style.setProperty('--qmes-hamburger-top',Math.round(rect.top+(rect.height-size)/2)+'px');
    }
  }

  function render(group){
    if(!menuMap[group])return;
    currentGroup=group;
    side.querySelector('.qmes-side-title').textContent=group;
    const wrap=side.querySelector('.qmes-side-items');
    wrap.replaceChildren();
    menuMap[group].forEach((item,index)=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='qmes-side-item'+(activeLabel===item.label?' is-active':'');
      button.dataset.index=String(index);
      button.textContent=item.label;
      wrap.appendChild(button);
    });
    setPositions();
  }

  function open(group){
    if(!menuMap[group])return;
    render(group);
    document.body.classList.add('qmes-side-open');
  }

  function close(){
    document.body.classList.remove('qmes-side-open');
    setPositions();
  }

  function findSub(label){
    return Array.from(document.querySelectorAll('.qmes-submenu-button')).find(button=>clean(button.textContent)===clean(label));
  }

  function navigate(item){
    if(!item)return;
    if(item.direct){
      const top=findTop(item.direct);
      if(top){
        internal=true;
        top.click();
        setTimeout(()=>{internal=false;},0);
      }
      activeLabel=item.label;
      render(currentGroup);
      return;
    }
    const existing=findSub(item.sub);
    if(existing){
      activeLabel=item.label;
      render(currentGroup);
      existing.click();
      return;
    }
    const top=findTop(item.group);
    if(!top)return;
    internal=true;
    top.click();
    setTimeout(()=>{internal=false;},0);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const sub=findSub(item.sub);
      if(sub){
        activeLabel=item.label;
        render(currentGroup);
        sub.click();
      }
    }));
  }

  side.addEventListener('click',event=>{
    if(event.target.closest('.qmes-side-close')){close();return;}
    const button=event.target.closest('.qmes-side-item');
    if(!button)return;
    navigate(menuMap[currentGroup]?.[Number(button.dataset.index)]);
  });

  hamburger.addEventListener('click',()=>{
    if(currentGroup) open(currentGroup);
    else open('대시보드');
  });

  document.addEventListener('click',event=>{
    if(internal)return;
    const top=event.target.closest('.qmes-top-menu-button');
    if(!top)return;
    const label=groups.find(group=>topLabel(top)===group);
    if(!label)return;
    open(label);
  },true);

  document.addEventListener('click',event=>{
    const dropdownButton=event.target.closest('#qmes-all-menu-dropdown button');
    if(!dropdownButton)return;
    activeLabel=clean(dropdownButton.textContent);
    if(currentGroup)render(currentGroup);
  },true);

  document.addEventListener('click',event=>{
    const logoButton=event.target.closest('header button');
    if(!logoButton||!logoButton.querySelector('img[alt="NAMO Chemical"]'))return;
    activeLabel='';
    currentGroup='대시보드';
    close();
  },true);

  window.addEventListener('resize',setPositions);
  window.addEventListener('load',setPositions);
  requestAnimationFrame(setPositions);
})();