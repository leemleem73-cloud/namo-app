/* QMES top-menu hover dropdowns synced with left sidebar */
(function(){
  'use strict';
  if(window.__QMES_TOP_HOVER_SYNC_20260813__) return;
  window.__QMES_TOP_HOVER_SYNC_20260813__=true;

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
  let hideTimer=null;

  function ensureStyle(){
    if(document.getElementById('qmes-top-hover-sync-style')) return;
    const style=document.createElement('style');
    style.id='qmes-top-hover-sync-style';
    style.textContent=`
      #qmes-top-hover-sync{position:fixed;z-index:13060;min-width:220px;padding:7px;border:1px solid #d8e1eb;border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.18);display:none}
      #qmes-top-hover-sync.is-open{display:block}
      #qmes-top-hover-sync .qmes-hover-title{padding:8px 11px 7px;color:#175cd3;font-size:12px;font-weight:900;border-bottom:1px solid #e2e8f0;margin-bottom:4px}
      #qmes-top-hover-sync button{display:block;width:100%;min-height:39px;padding:9px 12px;border:0;border-radius:6px;background:#fff;color:#334155;font:inherit;font-size:13px;font-weight:700;text-align:left;cursor:pointer}
      #qmes-top-hover-sync button:hover{background:#edf4ff;color:#175cd3}
    `;
    document.head.appendChild(style);
  }

  function ensureBox(){
    ensureStyle();
    let box=document.getElementById('qmes-top-hover-sync');
    if(box) return box;
    box=document.createElement('div');
    box.id='qmes-top-hover-sync';
    box.addEventListener('mouseenter',()=>{if(hideTimer)clearTimeout(hideTimer)});
    box.addEventListener('mouseleave',scheduleHide);
    document.body.appendChild(box);
    return box;
  }

  function show(group,topButton){
    const items=menuMap[group];
    if(!items?.length) return;
    if(hideTimer) clearTimeout(hideTimer);
    const box=ensureBox();
    box.replaceChildren();
    const title=document.createElement('div');
    title.className='qmes-hover-title';
    title.textContent=group;
    box.appendChild(title);
    items.forEach(label=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.dataset.group=group;
      btn.dataset.label=label;
      btn.textContent=label;
      box.appendChild(btn);
    });
    const r=topButton.getBoundingClientRect();
    box.style.left=Math.round(r.left)+'px';
    box.style.top=Math.round(r.bottom+2)+'px';
    box.classList.add('is-open');
  }

  function hide(){ensureBox().classList.remove('is-open')}
  function scheduleHide(){if(hideTimer)clearTimeout(hideTimer);hideTimer=setTimeout(hide,140)}

  function findTop(group){
    return Array.from(document.querySelectorAll('.qmes-top-menu-button')).find(btn=>clean(btn.textContent)===group);
  }

  function clickSidebarItem(group,label){
    try{window.qmesSetGlobalSidebarGroup?.(group);}catch(_e){}
    const tryClick=()=>{
      const side=document.getElementById('qmes-sync-sidebar');
      if(!side) return false;
      const buttons=Array.from(side.querySelectorAll('.qmes-side-item'));
      const exact=buttons.find(btn=>clean(btn.textContent)===label);
      if(exact){exact.click();return true;}
      return false;
    };
    if(tryClick()) return;
    setTimeout(tryClick,50);
    setTimeout(tryClick,140);
  }

  document.addEventListener('mouseover',event=>{
    const top=event.target.closest?.('.qmes-top-menu-button');
    if(!top) return;
    const group=clean(top.textContent);
    if(menuMap[group]) show(group,top);
  },true);

  document.addEventListener('mouseout',event=>{
    const top=event.target.closest?.('.qmes-top-menu-button');
    if(!top) return;
    const group=clean(top.textContent);
    if(menuMap[group]&&!top.contains(event.relatedTarget)) scheduleHide();
  },true);

  document.addEventListener('click',event=>{
    const item=event.target.closest?.('#qmes-top-hover-sync button[data-group][data-label]');
    if(!item) return;
    event.preventDefault();
    event.stopPropagation();
    const group=item.dataset.group;
    const label=item.dataset.label;
    const top=findTop(group);
    if(top) top.click();
    setTimeout(()=>clickSidebarItem(group,label),50);
    hide();
  },true);
})();
