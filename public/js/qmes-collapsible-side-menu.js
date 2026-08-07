(function(){
  "use strict";
  if(window.__QMES_SYNC_SIDEBAR_V8__) return;
  window.__QMES_SYNC_SIDEBAR_V8__=true;

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
    .qmes-top-menu{padding-left:52px!important;box-sizing:border-box!important;transition:transform .18s ease,width .18s ease!important;transform:translateX(0)!important;width:100%!important}
    body.qmes-side-open .qmes-top-menu{transform:translateX(220px)!important;width:calc(100% - 220px)!important}
    .qmes-top-menu .qmes-top-menu-item:first-child{flex-shrink:0!important;min-width:112px!important}
    .qmes-top-menu .qmes-top-menu-item:first-child .qmes-top-menu-button{min-width:112px!important;white-space:nowrap!important;overflow:visible!important}
    .qmes-top-menu-button span{display:inline!important;visibility:visible!important;opacity:1!important;white-space:nowrap!important}
    #qmes-all-menu-dropdown{display:block!important}
    #qmes-all-menu-dropdown:not(.is-open){opacity:0!important;visibility:hidden!important;pointer-events:none!important}
    #qmes-all-menu-dropdown.is-open{opacity:1!important;visibility:visible!important;pointer-events:auto!important}
    #qmes-sync-sidebar{display:block!important;position:fixed!important;left:0!important;top:var(--qmes-side-top,72px)!important;bottom:0!important;width:220px!important;box-sizing:border-box!important;padding:0 10px 12px!important;overflow-y:auto!important;background:#fff!important;border-right:1px solid #e4e8ee!important;box-shadow:3px 0 12px rgba(15,23,42,.08)!important;z-index:12050!important;transform:translate3d(-100%,0,0)!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;transition:transform .18s ease,opacity .12s ease!important}
    body.qmes-side-open #qmes-sync-sidebar{transform:translate3d(0,0,0)!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
    #qmes-sync-sidebar .qmes-side-head{position:relative!important;display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:48px!important;padding:8px 18px 8px 24px!important;margin:0 -10px 8px!important;border:0!important;border-radius:0!important;background:#0f172a!important;box-sizing:border-box!important;overflow:hidden!important}
    #qmes-sync-sidebar .qmes-side-head:before{display:none!important;content:none!important}
    #qmes-sync-sidebar .qmes-side-title{font-size:14px!important;font-weight:800!important;color:#fff!important;line-height:20px!important;padding:0!important;margin:0!important;text-align:left!important}
    #qmes-sync-sidebar .qmes-side-close{width:28px!important;height:28px!important;flex:0 0 28px!important;border:0!important;border-radius:6px!important;background:transparent!important;color:#cbd5e1!important;font-size:19px!important;cursor:pointer!important}
    #qmes-sync-sidebar .qmes-side-close:hover{background:rgba(255,255,255,.1)!important;color:#fff!important}
    #qmes-sync-sidebar .qmes-side-item{position:relative!important;display:flex!important;align-items:center!important;width:100%!important;min-height:40px!important;padding:9px 10px 9px 14px!important;margin:2px 0!important;border:0!important;border-radius:7px!important;background:transparent!important;color:#475569!important;font-size:13px!important;font-weight:700!important;text-align:left!important;cursor:pointer!important}
    #qmes-sync-sidebar .qmes-side-item:hover{background:#f4f7fa!important;color:#172033!important}
    #qmes-sync-sidebar .qmes-side-item.is-active{background:#edf4ff!important;color:#175cd3!important}
    #qmes-sync-sidebar .qmes-side-item.is-active:before{content:''!important;position:absolute!important;left:0!important;top:8px!important;bottom:8px!important;width:3px!important;border-radius:3px!important;background:#2563eb!important}
    #qmes-sync-hamburger{display:flex!important;align-items:center!important;justify-content:center!important;position:fixed!important;left:var(--qmes-hamburger-left,10px)!important;top:var(--qmes-hamburger-top,82px)!important;z-index:12040!important;width:32px!important;height:32px!important;padding:0!important;border:1px solid rgba(148,163,184,.28)!important;border-radius:7px!important;background:#132238!important;color:#cbd5e1!important;box-shadow:none!important;font-size:18px!important;line-height:1!important;cursor:pointer!important}
    #qmes-sync-hamburger:hover{background:#1e3048!important;color:#fff!important;border-color:rgba(148,163,184,.48)!important}
    body.qmes-side-open #qmes-sync-hamburger{display:none!important}
    body.qmes-side-open main,body.qmes-side-open #root>div>main,body.qmes-side-open .qmes-main,body.qmes-side-open .qmes-content{margin-left:220px!important;width:calc(100% - 220px)!important;box-sizing:border-box!important;transition:margin-left .18s ease,width .18s ease!important}
    @media(max-width:900px){#qmes-sync-sidebar{width:190px!important}body.qmes-side-open .qmes-top-menu{transform:translateX(190px)!important;width:calc(100% - 190px)!important}body.qmes-side-open main,body.qmes-side-open #root>div>main,body.qmes-side-open .qmes-main,body.qmes-side-open .qmes-content{margin-left:190px!important;width:calc(100% - 190px)!important}}
  `;
  document.head.appendChild(style);

  const side=document.createElement('aside');
  side.id='qmes-sync-sidebar';
  side.setAttribute('aria-label','현재 메뉴');
  side.innerHTML='<div class="qmes-side-head"><div class="qmes-side-title"></div><button class="qmes-side-close" type="button" aria-label="메뉴 접기">×</button></div><div class="qmes-side-items"></div>';
  document.body.appendChild(side);
  const hamburger=document.createElement('button');
  hamburger.id='qmes-sync-hamburger';hamburger.type='button';hamburger.setAttribute('aria-label','메뉴 열기');hamburger.textContent='☰';document.body.appendChild(hamburger);

  let currentGroup='',activeLabel='',internal=false;
  function positionDropdown(){const menu=document.getElementById('qmes-all-menu-dropdown');if(!menu||!menu.classList.contains('is-open')||!currentGroup)return;const top=findTop(currentGroup);if(!top)return;const rect=top.getBoundingClientRect();const width=Math.max(210,Math.min(280,menu.offsetWidth||230));menu.style.left=Math.max(8,Math.min(window.innerWidth-width-8,rect.left))+'px';menu.style.top=(rect.bottom+4)+'px';}
  function setPositions(){const menuBar=document.querySelector('.qmes-top-menu-bar');const nav=document.querySelector('.qmes-top-menu');if(menuBar){const r=menuBar.getBoundingClientRect();document.documentElement.style.setProperty('--qmes-side-top',Math.round(r.bottom)+'px');}if(nav){const r=nav.getBoundingClientRect(),size=32,slotWidth=52;document.documentElement.style.setProperty('--qmes-hamburger-left',Math.round(r.left+(slotWidth-size)/2)+'px');document.documentElement.style.setProperty('--qmes-hamburger-top',Math.round(r.top+(r.height-size)/2)+'px');}positionDropdown();}
  function settlePositions(){setPositions();requestAnimationFrame(setPositions);setTimeout(setPositions,60);setTimeout(setPositions,190);setTimeout(setPositions,240);}
  function render(group){if(!menuMap[group])return;currentGroup=group;side.querySelector('.qmes-side-title').textContent=group;const wrap=side.querySelector('.qmes-side-items');wrap.replaceChildren();menuMap[group].forEach((item,index)=>{const button=document.createElement('button');button.type='button';button.className='qmes-side-item'+(activeLabel===item.label?' is-active':'');button.dataset.index=String(index);button.textContent=item.label;wrap.appendChild(button);});settlePositions();}
  function open(group){if(!menuMap[group])return;render(group);document.body.classList.add('qmes-side-open');side.style.setProperty('display','block','important');side.style.setProperty('visibility','visible','important');side.style.setProperty('opacity','1','important');side.style.setProperty('pointer-events','auto','important');side.style.setProperty('transform','translate3d(0,0,0)','important');settlePositions();}
  function close(){document.body.classList.remove('qmes-side-open');['display','visibility','opacity','pointer-events','transform'].forEach(p=>side.style.removeProperty(p));settlePositions();}
  function findSub(label){return Array.from(document.querySelectorAll('.qmes-submenu-button')).find(button=>clean(button.textContent)===clean(label));}
  function navigate(item){if(!item)return;if(item.direct){const top=findTop(item.direct);if(top){internal=true;top.click();setTimeout(()=>{internal=false;},0);}activeLabel=item.label;render(currentGroup);return;}const existing=findSub(item.sub);if(existing){activeLabel=item.label;render(currentGroup);existing.click();return;}const top=findTop(item.group);if(!top)return;internal=true;top.click();setTimeout(()=>{internal=false;},0);requestAnimationFrame(()=>requestAnimationFrame(()=>{const sub=findSub(item.sub);if(sub){activeLabel=item.label;render(currentGroup);sub.click();}}));}
  side.addEventListener('click',event=>{if(event.target.closest('.qmes-side-close')){close();return;}const button=event.target.closest('.qmes-side-item');if(!button)return;navigate(menuMap[currentGroup]?.[Number(button.dataset.index)]);});
  hamburger.addEventListener('click',()=>open(currentGroup||'대시보드'));
  document.addEventListener('click',event=>{if(internal)return;const top=event.target.closest('.qmes-top-menu-button');if(!top)return;const label=groups.find(group=>topLabel(top)===group);if(!label)return;activeLabel='';open(label);settlePositions();},true);
  document.addEventListener('mouseover',event=>{const top=event.target.closest('.qmes-top-menu-button');if(top)setTimeout(positionDropdown,0);},true);
  document.addEventListener('click',event=>{const dropdownButton=event.target.closest('#qmes-all-menu-dropdown button');if(!dropdownButton)return;activeLabel=clean(dropdownButton.textContent);if(currentGroup)render(currentGroup);},true);
  document.addEventListener('click',event=>{const logoButton=event.target.closest('header button');if(!logoButton||!logoButton.querySelector('img[alt="NAMO Chemical"]'))return;activeLabel='';currentGroup='대시보드';close();setTimeout(()=>{currentGroup='대시보드';settlePositions();},220);},true);
  window.addEventListener('resize',settlePositions);window.addEventListener('load',settlePositions);document.fonts?.ready?.then(settlePositions).catch(()=>{});requestAnimationFrame(()=>requestAnimationFrame(settlePositions));
})();