/* QMES IPAD/Field PQC/OQC basic-info stabilizer - 2026-08-24 v7 */
(function(){
  "use strict";
  if(window.__QMES_IPAD_PQC_OQC_BASIC_STABILIZER_20260824_V7__) return;
  window.__QMES_IPAD_PQC_OQC_BASIC_STABILIZER_20260824_V7__=true;

  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
  const suffix=/\s*·\s*(?:생산\s*)?(?:완료|미완료)\s*$/i;
  const baseLot=value=>clean(value).replace(suffix,"").trim().toUpperCase();
  const getDB=()=>{try{if(typeof DB!=="undefined"&&DB)return DB;}catch(_error){}return window.DB||{};};

  const style=document.createElement("style");
  style.id="qmes-ipad-pqc-oqc-basic-stabilizer-style-20260824";
  style.textContent=`
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-production-lot-linked{
      grid-column:1 / -1!important;width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;
    }
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-production-lot-linked > input.lot,
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-production-lot-linked > datalist{display:none!important;}
    .qmes-ipad-pop .qmes-ipad-form-grid .qmes-production-lot-linked-select{
      display:block!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;height:48px!important;min-height:48px!important;
      border:1px solid #cbd5e1!important;border-radius:10px!important;background:#fff!important;color:#0f172a!important;
      padding:0 14px!important;margin:0!important;font-size:15px!important;font-weight:700!important;line-height:48px!important;
    }
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-remarks-wide,
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-oqc-remarks-wide{
      grid-column:1 / -1!important;grid-row:auto!important;width:100%!important;min-width:0!important;max-width:none!important;display:block!important;box-sizing:border-box!important;
    }
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-remarks-wide input,
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-oqc-remarks-wide input,
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-pqc-remarks-wide textarea,
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-oqc-remarks-wide textarea{
      display:block!important;width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;
    }
    /* 검사일자에 잘못 붙는 '추가' 표시/가상요소 차단 */
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-inspection-date-clean::before,
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-inspection-date-clean::after,
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-inspection-date-clean input::before,
    .qmes-ipad-pop .qmes-ipad-form-grid label.qmes-inspection-date-clean input::after{content:none!important;display:none!important;}
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function root(){return document.querySelector('.qmes-ipad-pop');}
  function currentMode(){
    const r=root();if(!r)return "";
    const active=r.querySelector('.qmes-ipad-mode-tabs button.is-active');
    const text=clean(active?.textContent).toUpperCase();
    if(text.includes('PQC'))return 'PQC';
    if(text.includes('OQC'))return 'OQC';
    const title=clean(r.querySelector('.qmes-ipad-inspection-head h1')?.textContent);
    if(title.includes('공정검사'))return 'PQC';
    if(title.includes('출하검사'))return 'OQC';
    return "";
  }
  function basicGrid(){
    const r=root();if(!r)return null;
    const sections=Array.from(r.querySelectorAll('.qmes-ipad-section'));
    const basic=sections.find(section=>clean(section.querySelector('.qmes-ipad-section-title h2')?.textContent)==='검사 기본정보')||sections[0];
    return basic?.querySelector('.qmes-ipad-form-grid')||null;
  }
  function labelByCaption(caption){
    const grid=basicGrid();if(!grid)return null;
    return Array.from(grid.querySelectorAll('label')).find(label=>clean(label.querySelector(':scope > span')?.textContent||label.querySelector('span')?.textContent).startsWith(caption))||null;
  }
  function isProductionComplete(lot){
    const key=baseLot(lot);if(!key)return false;
    try{if(typeof qmesProductionComplete==='function')return !!qmesProductionComplete(key);}catch(_error){}
    const db=getDB(),doc=db.woDocs?.[key]||{},batch=(db.batches||[]).find(row=>baseLot(row?.no)===key)||{};
    const result=doc.productionResult||batch.productionResult||db.lots?.[key]?.productionResult||{};
    return !!(result.completedAt||result.completeAt||result.finishedAt||doc.completedAt||batch.completedAt||clean(doc.status)==='완료'||clean(batch.status)==='완료');
  }
  function lotList(){
    const db=getDB(),lots=new Set();
    Object.keys(db.woDocs||{}).forEach(lot=>{const key=baseLot(lot);if(key)lots.add(key);});
    (db.batches||[]).forEach(row=>{const key=baseLot(row?.no);if(key)lots.add(key);});
    Object.keys(db.lots||{}).forEach(lot=>{const key=baseLot(lot);if(key)lots.add(key);});
    return Array.from(lots).sort((a,b)=>b.localeCompare(a,'ko'));
  }
  function dispatchValue(input,value){
    const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value')?.set;
    if(setter)setter.call(input,value);else input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function buildSelector(){
    const mode=currentMode();if(mode!=='PQC'&&mode!=='OQC')return;
    const label=labelByCaption('생산 LOT');if(!label)return;
    label.classList.add('qmes-production-lot-linked');
    const input=label.querySelector('input.lot, input');if(!input)return;
    input.removeAttribute('list');
    input.style.setProperty('display','none','important');
    label.querySelectorAll('datalist').forEach(node=>node.remove());

    let select=label.querySelector(':scope > .qmes-production-lot-linked-select');
    label.querySelectorAll('.qmes-production-lot-linked-select').forEach((node,index)=>{if(index>0)node.remove();});
    if(!select){
      select=document.createElement('select');
      select.className='qmes-production-lot-linked-select';
      select.setAttribute('aria-label','생산 LOT 선택');
      input.insertAdjacentElement('afterend',select);
      select.addEventListener('change',()=>dispatchValue(input,baseLot(select.value)));
    }
    const current=baseLot(input.value),previous=baseLot(select.value),lots=lotList();
    select.innerHTML='';
    const placeholder=document.createElement('option');
    placeholder.value='';placeholder.textContent=lots.length?'생산 LOT 선택':'연동된 생산 LOT 없음';select.appendChild(placeholder);
    lots.forEach(lot=>{const option=document.createElement('option');option.value=lot;option.textContent=`${lot}${isProductionComplete(lot)?' · 완료':' · 미완료'}`;select.appendChild(option);});
    const desired=current||previous||'';if(desired&&lots.includes(desired))select.value=desired;
  }
  function cleanInspectionDate(){
    const mode=currentMode();if(mode!=='PQC'&&mode!=='OQC')return;
    const grid=basicGrid();if(!grid)return;
    const label=labelByCaption('검사일자');if(!label)return;
    label.classList.add('qmes-inspection-date-clean');

    /* 검사일자 라벨 내부에서 '추가'라고 표시되는 실제 요소를 완전히 삭제 */
    label.querySelectorAll('button,[role="button"],a,span,div,i,b,small').forEach(node=>{
      if(node===label.querySelector(':scope > span'))return;
      const text=clean(node.textContent),aria=clean(node.getAttribute?.('aria-label')),title=clean(node.getAttribute?.('title'));
      if(text==='추가'||aria==='추가'||title==='추가')node.remove();
    });

    /* 검사일자 바로 옆에 잘못 생성된 추가 컨트롤도 제거 */
    [label.previousElementSibling,label.nextElementSibling].filter(Boolean).forEach(node=>{
      const text=node.tagName==='INPUT'?clean(node.value):clean(node.textContent);
      const aria=clean(node.getAttribute?.('aria-label')),title=clean(node.getAttribute?.('title'));
      if(text==='추가'||aria==='추가'||title==='추가')node.remove();
    });
  }
  function remarksWide(){
    const mode=currentMode();if(mode!=='PQC'&&mode!=='OQC')return;
    const remarks=labelByCaption('비고');if(!remarks)return;
    remarks.classList.add('wide',mode==='PQC'?'qmes-pqc-remarks-wide':'qmes-oqc-remarks-wide');
  }
  function normalize(){buildSelector();cleanInspectionDate();remarksWide();}

  let queued=false;
  function schedule(){
    if(queued)return;queued=true;
    queueMicrotask(()=>{
      queued=false;
      normalize();
      requestAnimationFrame(normalize);
    });
  }
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',schedule,true);
  document.addEventListener('change',schedule,true);
  window.addEventListener('qmes:shared-sync-complete',schedule);
  window.addEventListener('qmes:data-updated',schedule);
  window.addEventListener('qmes:production-process-updated',schedule);
  window.addEventListener('focus',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
