(function(){
  const style=document.createElement('style');
  style.id='qmes-ipad-lot-firstpaint-guard';
  style.textContent=`
    .qmes-ipad-pop .qmes-ipad-form-grid input.lot[list="qmes-ipad-lots"]{display:none!important;}
  `;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);
})();

(function(){
  function evaluateInput(input){
    if(!input || !input.closest('.qmes-ipad-pop')) return;
    const wrap=input.closest('.qmes-ipad-triple,.qmes-ipad-repeat-choice');
    if(!wrap) return;
    const card=input.closest('.qmes-ipad-measure-card');
    const key=card&&card.querySelector('.qmes-ipad-measure-head span')?.textContent?.trim();
    const value=String(input.value||'').trim();
    input.classList.remove('is-spec-ng');
    if(!key||!value||value.toLowerCase()==='overflow'||typeof window.autoJudge!=='function') return;
    try{
      if(window.autoJudge(key,value)==='불합격') input.classList.add('is-spec-ng');
    }catch(error){}
  }
  function refresh(root){
    (root||document).querySelectorAll('.qmes-ipad-triple input,.qmes-ipad-repeat-choice input').forEach(evaluateInput);
  }
  document.addEventListener('input',function(event){evaluateInput(event.target);},true);
  document.addEventListener('change',function(event){evaluateInput(event.target);},true);
  const observer=new MutationObserver(function(){refresh(document);});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){refresh(document);});
  else refresh(document);
})();

/* Direct IQC/PQC/OQC entry + first-paint LOT selector guard. */
(function installFieldShortcutModeConsumer(){
  'use strict';
  if(window.__QMES_FIELD_SHORTCUT_MODE_CONSUMER__ || typeof FieldInputTab !== 'function') return;
  window.__QMES_FIELD_SHORTCUT_MODE_CONSUMER__=true;
  const OriginalFieldInputTab=FieldInputTab;

  function clean(v){return String(v==null?'':v).trim();}
  function lotRows(){
    const db=(typeof DB!=='undefined'&&DB)||window.DB||{};
    const set=new Set();
    (db.batches||[]).forEach(row=>{const lot=clean(row&& (row.no||row.lot||row.lotNo||row.workOrder)).toUpperCase();if(lot)set.add(lot);});
    Object.keys(db.woDocs||{}).forEach(lot=>{lot=clean(lot).toUpperCase();if(lot)set.add(lot);});
    Object.entries(db.lots||{}).forEach(([key,row])=>{const lot=clean((row&&(row.lot||row.lotNo||row.no))||key).toUpperCase();if(lot)set.add(lot);});
    return Array.from(set).sort((a,b)=>b.localeCompare(a,'ko'));
  }
  function setReactInput(input,value){
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
    if(setter)setter.call(input,value);else input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function ensureLotSelectorBeforePaint(){
    const root=document.querySelector('.qmes-ipad-pop');
    if(!root)return;
    const active=root.querySelector('.qmes-ipad-mode-tabs button.is-active');
    const txt=clean(active&&active.textContent).toUpperCase();
    if(!txt.includes('PQC')&&!txt.includes('OQC'))return;
    const labels=Array.from(root.querySelectorAll('.qmes-ipad-form-grid label'));
    const label=labels.find(node=>clean(node.querySelector('span')?.textContent).startsWith('생산 LOT'));
    if(!label)return;
    const input=label.querySelector('input.lot,input[list="qmes-ipad-lots"]');
    if(!input)return;
    input.style.setProperty('display','none','important');
    input.removeAttribute('list');
    label.querySelector('datalist')?.remove();
    label.classList.add('qmes-production-lot-linked');
    let select=label.querySelector('.qmes-production-lot-linked-select');
    if(!select){
      select=document.createElement('select');
      select.className='qmes-production-lot-linked-select';
      select.setAttribute('aria-label','생산 LOT 선택');
      select.style.cssText='width:100%;min-height:54px;box-sizing:border-box;padding:0 14px;border:1px solid #b8c4d0;border-radius:10px;background:#fff;color:#111827;font-size:16px;font-weight:700;';
      input.insertAdjacentElement('afterend',select);
      select.addEventListener('change',()=>setReactInput(input,clean(select.value).toUpperCase()));
    }
    const current=clean(input.value).toUpperCase();
    const lots=lotRows();
    select.innerHTML='';
    const first=document.createElement('option');
    first.value='';
    first.textContent=txt.includes('OQC')?(lots.length?'출하검사 대기 LOT 선택':'출하검사 대기 LOT 없음'):(lots.length?'생산 LOT 선택':'연동된 생산 LOT 없음');
    select.appendChild(first);
    lots.forEach(lot=>{const option=document.createElement('option');option.value=lot;option.textContent=lot;select.appendChild(option);});
    if(current&&lots.includes(current))select.value=current;
  }

  FieldInputTab=function QmesFieldInputTabWithDirectMode(){
    React.useLayoutEffect(function(){
      ensureLotSelectorBeforePaint();
    });
    React.useEffect(function(){
      let mode='';
      try{mode=String(sessionStorage.getItem('qmes_field_shortcut_mode')||'').toUpperCase();}catch(error){}
      if(!['IQC','PQC','OQC'].includes(mode)) return;
      const card=document.querySelector('.qmes-ipad-home-card.is-'+mode.toLowerCase());
      if(!card) return;
      try{sessionStorage.removeItem('qmes_field_shortcut_mode');}catch(error){}
      card.click();
    },[]);
    return React.createElement(OriginalFieldInputTab);
  };
})();
