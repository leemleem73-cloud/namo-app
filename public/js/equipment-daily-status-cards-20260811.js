(function qmesEquipmentDailyStatusCards(){
  'use strict';
  const STYLE_ID='qmes-equipment-daily-status-cards-style';
  const WRAP_CLASS='qmes-equipment-daily-status-cards';

  function ensureStyle(){
    let style=document.getElementById(STYLE_ID);
    if(!style){style=document.createElement('style');style.id=STYLE_ID;document.head.appendChild(style);}
    style.textContent=`
      html body .qmes-ipad-equipment .${WRAP_CLASS}{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;margin:0 0 12px 0!important;width:100%!important;}
      html body .qmes-ipad-equipment .qmes-daily-status-card{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:0!important;min-height:86px!important;padding:12px 14px!important;border:1px solid #d9e2ec!important;border-radius:10px!important;background:#fff!important;background-color:#fff!important;box-sizing:border-box!important;box-shadow:0 2px 7px rgba(15,23,42,.05)!important;text-align:center!important;overflow:hidden!important;}
      html body .qmes-ipad-equipment .qmes-daily-status-card *{box-sizing:border-box!important;background-image:none!important;}
      html body .qmes-ipad-equipment button.qmes-daily-status-card{width:100%!important;margin:0!important;font:inherit!important;cursor:pointer!important;appearance:none!important;-webkit-appearance:none!important;outline:0!important;}
      html body .qmes-ipad-equipment button.qmes-daily-status-card:hover{background:#f8fbff!important;background-color:#f8fbff!important;border-color:#b9d7fb!important;box-shadow:0 4px 11px rgba(37,99,235,.08)!important;transform:translateY(-1px)!important;}
      html body .qmes-ipad-equipment .qmes-daily-status-icon{display:none!important;}
      html body .qmes-ipad-equipment .qmes-daily-status-body{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;width:100%!important;min-width:0!important;background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important;text-align:center!important;}
      html body .qmes-ipad-equipment .qmes-daily-status-title{width:100%!important;margin:0 0 3px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;font-size:13px!important;font-weight:800!important;line-height:1.2!important;color:#111827!important;-webkit-text-fill-color:#111827!important;white-space:nowrap!important;text-align:center!important;}
      html body .qmes-ipad-equipment .qmes-daily-status-value{width:100%!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;font-size:20px!important;font-weight:900!important;line-height:1.12!important;letter-spacing:-.3px!important;white-space:nowrap!important;text-align:center!important;}
      html body .qmes-ipad-equipment .qmes-daily-status-card.is-progress .qmes-daily-status-value{color:#16a34a!important;-webkit-text-fill-color:#16a34a!important;}
      html body .qmes-ipad-equipment .qmes-daily-status-card.is-sync .qmes-daily-status-value{color:#2563eb!important;-webkit-text-fill-color:#2563eb!important;}
      html body .qmes-ipad-equipment .qmes-daily-status-card.is-pending .qmes-daily-status-value{color:#f97316!important;-webkit-text-fill-color:#f97316!important;}
      html body .qmes-ipad-equipment .qmes-daily-status-sub{width:100%!important;margin:3px 0 0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;font-size:11px!important;font-weight:650!important;line-height:1.2!important;color:#64748b!important;-webkit-text-fill-color:#64748b!important;white-space:nowrap!important;text-align:center!important;}

      html body .qmes-ipad-equipment .qmes-equipment-tour-status-row.qmes-daily-guide-only{display:flex!important;align-items:center!important;justify-content:flex-start!important;width:100%!important;min-height:54px!important;margin:0!important;padding:0 18px!important;border:1px solid #dbe5ee!important;border-radius:10px!important;background:#f8fafc!important;background-color:#f8fafc!important;box-sizing:border-box!important;box-shadow:0 1px 3px rgba(15,23,42,.025)!important;overflow:hidden!important;}
      html body .qmes-ipad-equipment .qmes-equipment-tour-status-row.qmes-daily-guide-only>div:first-child{display:flex!important;align-items:center!important;flex:1 1 100%!important;width:100%!important;min-width:0!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;}
      html body .qmes-ipad-equipment .qmes-equipment-tour-status-row.qmes-daily-guide-only>.qmes-equipment-tour-status-actions,
      html body .qmes-ipad-equipment .qmes-equipment-tour-status-row.qmes-daily-guide-only>.qmes-equipment-tour-statuses{display:none!important;width:0!important;min-width:0!important;max-width:0!important;margin:0!important;padding:0!important;overflow:hidden!important;}
      html body .qmes-ipad-equipment .qmes-equipment-tour-status-row.qmes-daily-guide-only .qmes-equipment-tour-guide-text{margin:0!important;font-size:10px!important;line-height:1.25!important;font-weight:650!important;white-space:nowrap!important;overflow:visible!important;color:#475569!important;-webkit-text-fill-color:#475569!important;background:transparent!important;border:0!important;box-shadow:none!important;}
      html body .qmes-ipad-equipment .qmes-equipment-tour-status-row.qmes-daily-guide-only svg{color:#f59e0b!important;stroke:#f59e0b!important;fill:none!important;flex:0 0 auto!important;}
      @media(max-width:980px){html body .qmes-ipad-equipment .${WRAP_CLASS}{grid-template-columns:1fr!important;}html body .qmes-ipad-equipment .qmes-daily-status-card{min-height:78px!important;}}
    `;
  }

  function compact(text){return String(text||'').replace(/\s+/g,' ').trim();}
  function extractProgress(text){const match=String(text||'').match(/(\d+)\s*\/\s*(\d+)/);return match?`${match[1]} / ${match[2]}`:'0 / 5';}
  function extractPending(text){const match=String(text||'').match(/(\d+)\s*(?:개\s*)?미완료/);if(match)return `${match[1]}건`;const p=String(text||'').match(/미완료[^0-9]*(\d+)/);return p?`${p[1]}건`:'0건';}

  function makeCard(kind,title,value,sub,asButton){
    const el=document.createElement(asButton?'button':'div');if(asButton)el.type='button';el.className=`qmes-daily-status-card is-${kind}`;
    const body=document.createElement('div');body.className='qmes-daily-status-body';
    const titleEl=document.createElement('div');titleEl.className='qmes-daily-status-title';titleEl.textContent=title;
    const valueEl=document.createElement('div');valueEl.className='qmes-daily-status-value';valueEl.textContent=value;
    const subEl=document.createElement('div');subEl.className='qmes-daily-status-sub';subEl.textContent=sub;
    body.append(titleEl,valueEl,subEl);el.append(body);return el;
  }

  function apply(panel){
    ensureStyle();
    const marker=Array.from(panel.querySelectorAll('p')).find(p=>compact(p.textContent).includes('관리계획서 기준 5개 설비 일일 순회점검'));
    if(!marker)return;
    const left=marker.parentElement;const row=left&&left.parentElement;if(!row)return;row.classList.add('qmes-daily-guide-only');
    const existing=row.previousElementSibling;if(existing&&existing.classList&&existing.classList.contains(WRAP_CLASS))existing.remove();
    const rowText=compact(row.textContent);const allButtons=Array.from(panel.querySelectorAll('button'));
    const progressSource=allButtons.find(b=>/오늘\s*순회점검/.test(compact(b.textContent))&&/\d+\s*\/\s*\d+/.test(compact(b.textContent)));
    const syncSource=allButtons.find(b=>compact(b.textContent).includes('PC·모바일 동기화')||compact(b.textContent).includes('PC · 모바일 동기화'));
    const progressText=compact(progressSource?progressSource.textContent:rowText);const progress=extractProgress(progressText);const pending=extractPending(progressText+' '+rowText);
    const wrap=document.createElement('div');wrap.className=WRAP_CLASS;
    const progressCard=makeCard('progress','오늘 순회점검',progress,'진행률',false);
    const syncCard=makeCard('sync','PC · 모바일 동기화','동기화 완료','실시간 연동',true);
    const pendingCard=makeCard('pending','미완료 점검',pending,'조치 필요',false);
    if(syncSource){syncCard.title='PC·모바일 동기화';syncCard.addEventListener('click',()=>syncSource.click());}else{syncCard.disabled=true;syncCard.style.cursor='default';}
    wrap.append(progressCard,syncCard,pendingCard);row.parentElement.insertBefore(wrap,row);
  }

  let scheduled=false;function run(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;document.querySelectorAll('.qmes-ipad-equipment').forEach(apply);});}
  run();new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true,characterData:true});window.addEventListener('load',run,{once:true});
})();
