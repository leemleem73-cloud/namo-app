(function qmesEquipmentDailyStatusCards(){
  'use strict';
  const STYLE_ID='qmes-equipment-daily-status-cards-style';
  const WRAP_CLASS='qmes-equipment-daily-status-cards';

  function ensureStyle(){
    let style=document.getElementById(STYLE_ID);
    if(!style){style=document.createElement('style');style.id=STYLE_ID;document.head.appendChild(style);}
    style.textContent=`
      .qmes-ipad-equipment .${WRAP_CLASS}{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:0 0 12px 0;width:100%;}
      .qmes-ipad-equipment .qmes-daily-status-card{display:grid;grid-template-columns:66px minmax(0,1fr);align-items:center;gap:15px;min-height:108px;padding:16px 18px;border:1px solid #d9e2ec;border-radius:12px;background:#fff;box-sizing:border-box;box-shadow:0 2px 8px rgba(15,23,42,.05);text-align:left;}
      .qmes-ipad-equipment button.qmes-daily-status-card{width:100%;font:inherit;cursor:pointer;appearance:none;-webkit-appearance:none;}
      .qmes-ipad-equipment button.qmes-daily-status-card:hover{background:#f8fbff;border-color:#b9d7fb;box-shadow:0 4px 12px rgba(37,99,235,.09);transform:translateY(-1px);}
      .qmes-ipad-equipment .qmes-daily-status-icon{display:flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:12px;font-size:31px;font-weight:800;line-height:1;}
      .qmes-ipad-equipment .qmes-daily-status-card.is-progress .qmes-daily-status-icon{background:#ecfdf3;color:#16a34a;}
      .qmes-ipad-equipment .qmes-daily-status-card.is-sync .qmes-daily-status-icon{background:#eff6ff;color:#2563eb;}
      .qmes-ipad-equipment .qmes-daily-status-card.is-pending .qmes-daily-status-icon{background:#fff7ed;color:#f97316;}
      .qmes-ipad-equipment .qmes-daily-status-title{margin:0 0 5px;font-size:15px;font-weight:850;line-height:1.25;color:#111827;white-space:nowrap;}
      .qmes-ipad-equipment .qmes-daily-status-value{margin:0;font-size:25px;font-weight:900;line-height:1.15;letter-spacing:-.3px;white-space:nowrap;}
      .qmes-ipad-equipment .qmes-daily-status-card.is-progress .qmes-daily-status-value{color:#16a34a;}
      .qmes-ipad-equipment .qmes-daily-status-card.is-sync .qmes-daily-status-value{color:#2563eb;}
      .qmes-ipad-equipment .qmes-daily-status-card.is-pending .qmes-daily-status-value{color:#f97316;}
      .qmes-ipad-equipment .qmes-daily-status-sub{margin-top:5px;font-size:12px;font-weight:650;line-height:1.2;color:#64748b;white-space:nowrap;}
      .qmes-ipad-equipment .qmes-equipment-tour-status-row.qmes-daily-guide-only{display:flex!important;align-items:center!important;min-height:54px!important;padding:0 16px!important;border:1px solid #d7e0e8!important;border-radius:10px!important;background:#fff!important;box-sizing:border-box!important;}
      .qmes-ipad-equipment .qmes-equipment-tour-status-row.qmes-daily-guide-only>.qmes-equipment-tour-status-actions,
      .qmes-ipad-equipment .qmes-equipment-tour-status-row.qmes-daily-guide-only>.qmes-equipment-tour-statuses{display:none!important;}
      .qmes-ipad-equipment .qmes-equipment-tour-status-row.qmes-daily-guide-only .qmes-equipment-tour-guide-text{font-size:11px!important;line-height:1.2!important;white-space:nowrap!important;overflow:visible!important;color:#334155!important;}
      @media(max-width:980px){.qmes-ipad-equipment .${WRAP_CLASS}{grid-template-columns:1fr;}.qmes-ipad-equipment .qmes-daily-status-card{min-height:92px;}}
    `;
  }

  function compact(text){return String(text||'').replace(/\s+/g,' ').trim();}
  function extractProgress(text){
    const match=String(text||'').match(/(\d+)\s*\/\s*(\d+)/);
    return match?`${match[1]} / ${match[2]}`:'0 / 5';
  }
  function extractPending(text){
    const match=String(text||'').match(/(\d+)\s*(?:개\s*)?미완료/);
    if(match) return `${match[1]}건`;
    const p=String(text||'').match(/미완료[^0-9]*(\d+)/);
    return p?`${p[1]}건`:'0건';
  }
  function makeCard(kind,icon,title,value,sub,asButton){
    const el=document.createElement(asButton?'button':'div');
    if(asButton) el.type='button';
    el.className=`qmes-daily-status-card is-${kind}`;
    const iconEl=document.createElement('div');iconEl.className='qmes-daily-status-icon';iconEl.textContent=icon;
    const body=document.createElement('div');
    const titleEl=document.createElement('div');titleEl.className='qmes-daily-status-title';titleEl.textContent=title;
    const valueEl=document.createElement('div');valueEl.className='qmes-daily-status-value';valueEl.textContent=value;
    const subEl=document.createElement('div');subEl.className='qmes-daily-status-sub';subEl.textContent=sub;
    body.append(titleEl,valueEl,subEl);el.append(iconEl,body);
    return el;
  }

  function apply(panel){
    ensureStyle();
    const marker=Array.from(panel.querySelectorAll('p')).find(p=>compact(p.textContent).includes('관리계획서 기준 5개 설비 일일 순회점검'));
    if(!marker) return;
    const left=marker.parentElement;
    const row=left&&left.parentElement;
    if(!row) return;
    row.classList.add('qmes-daily-guide-only');

    const existing=row.previousElementSibling;
    if(existing&&existing.classList&&existing.classList.contains(WRAP_CLASS)) existing.remove();

    const rowText=compact(row.textContent);
    const allButtons=Array.from(panel.querySelectorAll('button'));
    const progressSource=allButtons.find(b=>/오늘\s*순회점검/.test(compact(b.textContent))&&/\d+\s*\/\s*\d+/.test(compact(b.textContent)));
    const syncSource=allButtons.find(b=>compact(b.textContent).includes('PC·모바일 동기화')||compact(b.textContent).includes('PC · 모바일 동기화'));
    const progressText=compact(progressSource?progressSource.textContent:rowText);
    const progress=extractProgress(progressText);
    const pending=extractPending(progressText+' '+rowText);

    const wrap=document.createElement('div');wrap.className=WRAP_CLASS;
    const progressCard=makeCard('progress','▣','오늘 순회점검',progress,'진행률',false);
    const syncCard=makeCard('sync','▯','PC · 모바일 동기화','동기화 완료','실시간 연동',true);
    const pendingCard=makeCard('pending','♢','미완료 점검',pending,'조치 필요',false);
    if(syncSource){syncCard.title='PC·모바일 동기화';syncCard.addEventListener('click',()=>syncSource.click());}
    else{syncCard.disabled=true;syncCard.style.cursor='default';}
    wrap.append(progressCard,syncCard,pendingCard);
    row.parentElement.insertBefore(wrap,row);
  }

  let scheduled=false;
  function run(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;document.querySelectorAll('.qmes-ipad-equipment').forEach(apply);});}
  run();
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener('load',run,{once:true});
})();
