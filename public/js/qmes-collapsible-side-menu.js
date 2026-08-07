(function(){
  "use strict";
  if(window.__QMES_SYNC_SIDEBAR_V13__) return;
  window.__QMES_SYNC_SIDEBAR_V13__=true;

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
  const topLabel=b=>clean(b?.querySelector('span')?.textContent||b?.textContent);
  const findTop=label=>topButtons().find(b=>topLabel(b)===label);

  ['qmes-sync-sidebar','qmes-sync-hamburger','qmes-left-menu','qmes-left-native-menu','qmes-context-side-menu','qmes-stable-sidebar','qmes-safe-sidebar'].forEach(id=>document.getElementById(id)?.remove());
  ['qmes-sync-sidebar-style','qmes-left-menu-style','qmes-left-native-menu-style','qmes-context-side-menu-style','qmes-stable-sidebar-style','qmes-safe-sidebar-style','qmes-top-submenu-fix-style','qmes-restore-vertical-dropdown-style'].forEach(id=>document.getElementById(id)?.remove());
  document.body?.classList.remove('qmes-side-open');

  const style=document.createElement('style');style.id='qmes-sync-sidebar-style';style.textContent=`
    .qmes-top-menu{padding-left:52px!important;box-sizing:border-box!important;transition:transform .18s ease,width .18s ease!important;transform:translateX(0)!important;width:100%!important}
    body.qmes-side-open .qmes-top-menu{transform:translateX(220px)!important;width:calc(100% - 220px)!important}
    .qmes-top-menu .qmes-top-menu-item:first-child{flex-shrink:0!important;min-width:112px!important}.qmes-top-menu .qmes-top-menu-item:first-child .qmes-top-menu-button{min-width:112px!important;white-space:nowrap!important;overflow:visible!important}.qmes-top-menu-button span{display:inline!important;visibility:visible!important;opacity:1!important;white-space:nowrap!important}
    #qmes-sync-sidebar{display:block!important;position:fixed!important;left:0!important;top:var(--qmes-side-top,72px)!important;bottom:0!important;width:220px!important;box-sizing:border-box!important;padding:0 10px 12px!important;overflow-y:auto!important;background:#fff!important;border-right:1px solid #e4e8ee!important;box-shadow:3px 0 12px rgba(15,23,42,.08)!important;z-index:12050!important;transform:translate3d(-100%,0,0)!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;transition:transform .18s ease,opacity .12s ease!important}
    body.qmes-side-open #qmes-sync-sidebar{display:block!important;transform:translate3d(0,0,0)!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
    #qmes-sync-sidebar .qmes-side-head{position:relative!important;display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:48px!important;padding:8px 18px 8px 24px!important;margin:0 -10px 8px!important;background:#eaf4ff!important;border-bottom:1px solid #d8e8f8!important;box-sizing:border-box!important}
    #qmes-sync-sidebar .qmes-side-head.is-group-active{background:#dcecff!important}#qmes-sync-sidebar .qmes-side-head.is-group-active:before{content:''!important;position:absolute!important;left:0!important;top:9px!important;bottom:9px!important;width:4px!important;background:#2563eb!important}
    #qmes-sync-sidebar .qmes-side-title{font-size:14px!important;font-weight:800!important;color:#315f8c!important;line-height:20px!important;margin:0!important}#qmes-sync-sidebar .qmes-side-head.is-group-active .qmes-side-title{color:#175cd3!important}
    #qmes-sync-sidebar .qmes-side-close{width:28px!important;height:28px!important;border:0!important;border-radius:6px!important;background:transparent!important;color:#6b7f93!important;font-size:19px!important;cursor:pointer!important}#qmes-sync-sidebar .qmes-side-head.is-group-active .qmes-side-close{color:#64748b!important}
    #qmes-sync-sidebar .qmes-side-item{position:relative!important;display:flex!important;align-items:center!important;width:100%!important;min-height:40px!important;padding:9px 10px 9px 14px!important;margin:2px 0!important;border:0!important;border-radius:7px!important;background:transparent!important;color:#475569!important;font-size:13px!important;font-weight:700!important;text-align:left!important;cursor:pointer!important}#qmes-sync-sidebar .qmes-side-item:hover{background:#f4f7fa!important;color:#172033!important}#qmes-sync-sidebar .qmes-side-item.is-active{background:#edf4ff!important;color:#175cd3!important}#qmes-sync-sidebar .qmes-side-item.is-active:before{content:''!important;position:absolute!important;left:0!important;top:8px!important;bottom:8px!important;width:3px!important;background:#2563eb!important}
    #qmes-sync-hamburger{display:flex!important;align-items:center!important;justify-content:center!important;position:fixed!important;left:var(--qmes-hamburger-left,10px)!important;top:var(--qmes-hamburger-top,0px)!important;z-index:12040!important;width:32px!important;height:32px!important;padding:0!important;border:1px solid rgba(148,163,184,.28)!important;border-radius:7px!important;background:#132238!important;color:#cbd5e1!important;box-shadow:none!important;font-size:18px!important;line-height:1!important;cursor:pointer!important;visibility:hidden!important;opacity:0!important}#qmes-sync-hamburger.is-ready{visibility:visible!important;opacity:1!important}body.qmes-side-open #qmes-sync-hamburger{display:none!important}
    body.qmes-side-open main,body.qmes-side-open #root>div>main,body.qmes-side-open .qmes-main,body.qmes-side-open .qmes-content{margin-left:220px!important;width:calc(100% - 220px)!important;box-sizing:border-box!important;transition:margin-left .18s ease,width .18s ease!important}
    @media(max-width:900px){#qmes-sync-sidebar{width:190px!important}body.qmes-side-open .qmes-top-menu{transform:translateX(190px)!important;width:calc(100% - 190px)!important}body.qmes-side-open main,body.qmes-side-open #root>div>main,body.qmes-side-open .qmes-main,body.qmes-side-open .qmes-content{margin-left:190px!important;width:calc(100% - 190px)!important}}
  `;document.head.appendChild(style);

  const side=document.createElement('aside');side.id='qmes-sync-sidebar';side.innerHTML='<div class="qmes-side-head"><div class="qmes-side-title"></div><button class="qmes-side-close" type="button">×</button></div><div class="qmes-side-items"></div>';document.body.appendChild(side);
  const hamburger=document.createElement('button');hamburger.id='qmes-sync-hamburger';hamburger.type='button';hamburger.textContent='☰';document.body.appendChild(hamburger);
  let currentGroup='',activeLabel='',groupHighlight=false,internal=false,topMenuPinned=false;const head=()=>side.querySelector('.qmes-side-head');
  const topDropdown=()=>document.getElementById('qmes-all-menu-dropdown');
  function setPositions(){const bar=document.querySelector('.qmes-top-menu-bar'),nav=document.querySelector('.qmes-top-menu'),dash=findTop('대시보드');if(bar)document.documentElement.style.setProperty('--qmes-side-top',Math.round(bar.getBoundingClientRect().bottom)+'px');if(nav&&dash){const nr=nav.getBoundingClientRect(),dr=dash.getBoundingClientRect(),size=32,slot=52;document.documentElement.style.setProperty('--qmes-hamburger-left',Math.round(nr.left+(slot-size)/2)+'px');document.documentElement.style.setProperty('--qmes-hamburger-top',Math.round(dr.top+(dr.height-size)/2)+'px');hamburger.classList.add('is-ready')}}
  function settle(){setPositions();requestAnimationFrame(setPositions);setTimeout(setPositions,80);setTimeout(setPositions,220)}
  function render(group){if(!menuMap[group])return;currentGroup=group;side.querySelector('.qmes-side-title').textContent=group;head().classList.toggle('is-group-active',groupHighlight);const wrap=side.querySelector('.qmes-side-items');wrap.replaceChildren();menuMap[group].forEach((item,index)=>{const b=document.createElement('button');b.type='button';b.className='qmes-side-item'+(activeLabel===item.label?' is-active':'');b.dataset.index=index;b.textContent=item.label;wrap.appendChild(b)})}
  function open(group,{titleHighlight=true}={}){if(!menuMap[group])return;groupHighlight=titleHighlight;render(group);document.body.classList.add('qmes-side-open');side.style.setProperty('display','block','important');side.style.setProperty('visibility','visible','important');side.style.setProperty('opacity','1','important');side.style.setProperty('pointer-events','auto','important');side.style.setProperty('transform','translate3d(0,0,0)','important');settle()}
  function close(){document.body.classList.remove('qmes-side-open');['display','visibility','opacity','pointer-events','transform'].forEach(p=>side.style.removeProperty(p));settle()}
  function keepTopMenuOpen(){if(!topMenuPinned)return;const menu=topDropdown();if(!menu)return;menu.classList.add('is-open');menu.style.removeProperty('visibility');menu.style.removeProperty('opacity');menu.style.removeProperty('pointer-events')}
  function findSub(label){return Array.from(document.querySelectorAll('.qmes-submenu-button')).find(b=>clean(b.textContent)===clean(label))}
  function selectItem(item){groupHighlight=false;activeLabel=item.label;render(currentGroup)}
  function navigate(item){if(!item)return;selectItem(item);if(item.direct){const top=findTop(item.direct);if(top){internal=true;top.click();setTimeout(()=>internal=false,0)}return}const sub=findSub(item.sub);if(sub){sub.click();return}const top=findTop(item.group);if(!top)return;internal=true;top.click();setTimeout(()=>internal=false,0);requestAnimationFrame(()=>requestAnimationFrame(()=>findSub(item.sub)?.click()))}
  side.addEventListener('click',e=>{if(e.target.closest('.qmes-side-close')){close();return}const b=e.target.closest('.qmes-side-item');if(b)navigate(menuMap[currentGroup]?.[Number(b.dataset.index)])});hamburger.addEventListener('click',()=>{activeLabel='';open(currentGroup||'대시보드',{titleHighlight:true})});

  document.addEventListener('click',e=>{if(internal)return;const top=e.target.closest('.qmes-top-menu-button');if(!top)return;const group=groups.find(g=>topLabel(top)===g);if(!group)return;topMenuPinned=true;activeLabel='';open(group,{titleHighlight:true});setTimeout(keepTopMenuOpen,0);setTimeout(keepTopMenuOpen,80)},true);
  document.addEventListener('click',e=>{const b=e.target.closest('#qmes-all-menu-dropdown button');if(!b)return;topMenuPinned=true;groupHighlight=false;activeLabel=clean(b.textContent);if(currentGroup)render(currentGroup);setTimeout(keepTopMenuOpen,0);setTimeout(keepTopMenuOpen,80);setTimeout(keepTopMenuOpen,180)},true);
  document.addEventListener('click',e=>{if(e.target.closest('.qmes-top-menu-button')||e.target.closest('#qmes-all-menu-dropdown')||e.target.closest('#qmes-sync-sidebar'))return;topMenuPinned=false;topDropdown()?.classList.remove('is-open')},false);
  document.addEventListener('click',e=>{const logo=e.target.closest('header button');if(!logo||!logo.querySelector('img[alt="NAMO Chemical"]'))return;topMenuPinned=false;topDropdown()?.classList.remove('is-open');currentGroup='대시보드';activeLabel='';groupHighlight=false;close()},true);

  const boot=()=>{setPositions();if(!hamburger.classList.contains('is-ready'))requestAnimationFrame(boot)};window.addEventListener('resize',settle);window.addEventListener('load',settle);document.fonts?.ready?.then(settle).catch(()=>{});requestAnimationFrame(boot);
})();