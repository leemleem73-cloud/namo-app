/* QMES top-menu hover bar synced with left sidebar */
(function(){
  'use strict';
  if(window.__QMES_TOP_HOVER_BAR_20260813__) return;
  window.__QMES_TOP_HOVER_BAR_20260813__=true;

  const menuMap={
    '대시보드':['종합 대시보드','SPC 대시보드'],
    '생산관리':['생산 진행','작업지시서'],
    '품질검사':['수입검사 (IQC)','공정검사 (PQC)','출하검사 (OQC)','SPC (Cpk)','품질 인터락','출하성적서'],
    '현장입력':['현장 입력 (iPad)'],
    '재고관리':['원재료·부자재 재고','완제품 재고 현황','완제품 출고관리','완제품 출고내역'],
    '거래처 현황':['거래처 현황'],
    '설비관리':['설비 모니터링'],
    'LOT 추적':['LOT 추적'],
    '부적합관리':['부적합 (8D)','고객불만 (GQMS)','4M 변경관리']
  };

  const clean=v=>String(v||'').replace(/[›〉]/g,'').replace(/\s+/g,' ').trim();
  let hideTimer=null,currentGroup='';

  function ensureStyle(){
    if(document.getElementById('qmes-top-hover-bar-style'))return;
    const style=document.createElement('style');
    style.id='qmes-top-hover-bar-style';
    style.textContent=`
      #qmes-top-hover-bar{position:fixed;left:0;right:0;z-index:12030;min-height:44px;padding:6px 14px 6px var(--qmes-hover-left,0px);box-sizing:border-box;background:#08182a;border-top:1px solid #18334f;border-bottom:1px solid #31506d;display:none;align-items:center;gap:7px;overflow-x:auto;box-shadow:0 3px 8px rgba(0,0,0,.18)}
      #qmes-top-hover-bar.is-open{display:flex}
      #qmes-top-hover-bar button{flex:0 0 auto;min-height:32px;padding:6px 12px;border:1px solid #31506d;border-radius:7px;background:#10253d;color:#cbd8e6;font:inherit;font-size:12px;font-weight:700;white-space:nowrap;cursor:pointer}
      #qmes-top-hover-bar button:hover,#qmes-top-hover-bar button.is-active{background:#173652;border-color:#4a7598;color:#fff}
      body.qmes-side-open #qmes-top-hover-bar{padding-left:234px}
      @media(max-width:900px){body.qmes-side-open #qmes-top-hover-bar{padding-left:204px}}
    `;
    document.head.appendChild(style);
  }

  function ensureBar(){
    ensureStyle();
    let bar=document.getElementById('qmes-top-hover-bar');
    if(bar)return bar;
    bar=document.createElement('div');bar.id='qmes-top-hover-bar';
    bar.addEventListener('mouseenter',()=>{if(hideTimer)clearTimeout(hideTimer)});
    bar.addEventListener('mouseleave',scheduleHide);
    document.body.appendChild(bar);
    return bar;
  }

  function getTopBarBottom(){
    const menu=document.querySelector('.qmes-top-menu-bar')||document.querySelector('.qmes-top-menu');
    if(menu){const r=menu.getBoundingClientRect();return Math.round(r.bottom);}
    return 84;
  }

  function show(group){
    const items=menuMap[group];if(!items?.length)return;
    currentGroup=group;
    if(hideTimer)clearTimeout(hideTimer);
    const bar=ensureBar();
    bar.replaceChildren();
    items.forEach(label=>{
      const btn=document.createElement('button');btn.type='button';btn.dataset.group=group;btn.dataset.label=label;btn.textContent=label;bar.appendChild(btn);
    });
    bar.style.top=getTopBarBottom()+'px';
    bar.classList.add('is-open');
  }

  function hide(){const bar=ensureBar();bar.classList.remove('is-open');currentGroup='';}
  function scheduleHide(){if(hideTimer)clearTimeout(hideTimer);hideTimer=setTimeout(hide,180)}
  function findTop(group){return Array.from(document.querySelectorAll('.qmes-top-menu-button')).find(btn=>clean(btn.textContent)===group)}

  function clickSidebarItem(group,label){
    try{window.qmesSetGlobalSidebarGroup?.(group)}catch(_e){}
    const tryClick=()=>{
      const side=document.getElementById('qmes-sync-sidebar');if(!side)return false;
      const exact=Array.from(side.querySelectorAll('.qmes-side-item')).find(btn=>clean(btn.textContent)===label);
      if(exact){exact.click();return true}return false;
    };
    if(tryClick())return;setTimeout(tryClick,60);setTimeout(tryClick,160);
  }

  document.addEventListener('mouseover',event=>{
    const top=event.target.closest?.('.qmes-top-menu-button');if(!top)return;
    const group=clean(top.textContent);if(menuMap[group])show(group);
  },true);

  document.addEventListener('mouseout',event=>{
    const top=event.target.closest?.('.qmes-top-menu-button');if(!top)return;
    const group=clean(top.textContent);
    if(menuMap[group]&&!top.contains(event.relatedTarget))scheduleHide();
  },true);

  document.addEventListener('click',event=>{
    const item=event.target.closest?.('#qmes-top-hover-bar button[data-group][data-label]');if(!item)return;
    event.preventDefault();event.stopPropagation();
    const group=item.dataset.group,label=item.dataset.label;
    const top=findTop(group);if(top)top.click();
    setTimeout(()=>clickSidebarItem(group,label),60);
    hide();
  },true);

  window.addEventListener('resize',()=>{if(currentGroup)ensureBar().style.top=getTopBarBottom()+'px'});
})();
