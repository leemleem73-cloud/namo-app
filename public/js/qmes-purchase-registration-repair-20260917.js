/* NAMO QMES - purchase registration repair
 * 2026-09-17
 * Additive only:
 * - keep the visually hidden legacy create trigger callable from the enterprise UI
 * - submit the approved target form through the original native save path
 * - refresh canonical purchase rows after save
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_REGISTRATION_REPAIR_20260917__) return;
  window.__QMES_PURCHASE_REGISTRATION_REPAIR_20260917__ = true;

  const clean = v => String(v == null ? '' : v).replace(/\s+/g,' ').trim();
  const number = v => {
    const n = Number(String(v == null ? '' : v).replace(/[^0-9.-]/g,''));
    return Number.isFinite(n) ? n : 0;
  };

  let toastTimer = 0;
  function toast(message){
    document.getElementById('qmes-purchase-register-repair-toast')?.remove();
    const el = document.createElement('div');
    el.id = 'qmes-purchase-register-repair-toast';
    el.textContent = message;
    Object.assign(el.style,{
      position:'fixed',left:'50%',bottom:'24px',transform:'translateX(-50%)',
      zIndex:'2147483647',background:'#16324f',color:'#fff',padding:'10px 16px',
      borderRadius:'8px',fontSize:'12px',fontWeight:'800',
      boxShadow:'0 8px 24px rgba(0,0,0,.18)'
    });
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>el.remove(),2600);
  }

  function purchaseRoot(){
    return Array.from(document.querySelectorAll('.qmes-purchase-live')).find(root=>{
      const txt = clean(root.textContent).slice(0,1800);
      return /구매/.test(txt) && /발주/.test(txt);
    }) || null;
  }

  function legacyCreate(root){
    if(!root) return null;
    const candidates = Array.from(root.querySelectorAll('.qmes-purchase-page-head button,.qerp-head button,button,a'));
    return candidates.find(el=>{
      if(el.closest('.qpx-enterprise-host,.qpx-form-card,.qpdz-target-ui')) return false;
      const text = clean(el.textContent).replace(/^[+＋]\s*/,'');
      return /^(신규\s*발주|발주서\s*생성|구매\s*발주\s*등록|등록\s*닫기|입력\s*닫기)$/.test(text);
    }) || null;
  }

  function keepLegacyCreateCallable(){
    const root = purchaseRoot();
    const button = legacyCreate(root);
    if(!button) return null;

    /* Keep it out of sight, but not display:none. The enterprise blue button
       delegates to this existing handler, so it must remain programmatically usable. */
    button.setAttribute('data-qmes-purchase-bridge','1');
    button.style.setProperty('display','inline-flex','important');
    button.style.setProperty('position','fixed','important');
    button.style.setProperty('left','-10000px','important');
    button.style.setProperty('top','0','important');
    button.style.setProperty('width','1px','important');
    button.style.setProperty('height','1px','important');
    button.style.setProperty('min-width','0','important');
    button.style.setProperty('min-height','0','important');
    button.style.setProperty('padding','0','important');
    button.style.setProperty('margin','0','important');
    button.style.setProperty('opacity','0','important');
    button.style.setProperty('pointer-events','none','important');
    button.style.setProperty('overflow','hidden','important');
    return button;
  }

  function targetForm(ui){
    if(!ui) return null;
    const direct = ui.closest('form');
    if(direct) return direct;
    const card = ui.closest('.qpx-form-card,.qerp-card,.modal-content,[role="dialog"]');
    if(card){
      const form = card.querySelector('form');
      if(form) return form;
      const legacy = card.querySelector('.qerp-form');
      if(legacy) return legacy;
    }
    return document.querySelector('.qmes-purchase-live .qpx-form-card form') ||
      document.querySelector('.qmes-purchase-live .qpx-form-card .qerp-form');
  }

  function originalSubmit(form){
    if(!form) return null;
    return Array.from(form.querySelectorAll('button,input[type="submit"]')).find(el=>{
      if(el.closest('.qpdz-target-ui')) return false;
      const text = clean(el.textContent || el.value);
      return String(el.type).toLowerCase()==='submit' || /저장|등록|생성|결재|상신/.test(text);
    }) || null;
  }

  function validateTarget(ui){
    const rows = Array.from(ui?.querySelectorAll('.qpdz-items tbody tr') || []);
    if(!rows.length) return {ok:false,message:'발주 품목을 입력해 주세요.'};

    for(let i=0;i<rows.length;i++){
      const row = rows[i];
      const item = clean(row.querySelector('[data-col="item"]')?.value);
      const qty = number(row.querySelector('[data-col="qty"]')?.value);
      const priceRaw = row.querySelector('[data-col="price"]')?.value;
      const price = number(priceRaw);
      const hasAny = item || qty || clean(row.querySelector('[data-col="code"]')?.value) || clean(priceRaw);
      if(!hasAny) continue;
      if(!item) return {ok:false,message:(i+1)+'번째 품목명을 입력해 주세요.'};
      if(!(qty > 0)) return {ok:false,message:(i+1)+'번째 발주수량을 입력해 주세요.'};
      if(price < 0) return {ok:false,message:(i+1)+'번째 단가는 0원 이상으로 입력해 주세요.'};
    }
    const activeRows = rows.filter(row=>{
      return clean(row.querySelector('[data-col="item"]')?.value) || number(row.querySelector('[data-col="qty"]')?.value) > 0;
    });
    if(!activeRows.length) return {ok:false,message:'발주 품목을 입력해 주세요.'};
    return {ok:true};
  }

  async function refreshCanonical(){
    try{
      const response = await fetch('/api/purchase-orders',{
        method:'GET',credentials:'same-origin',cache:'no-store',
        headers:{'Accept':'application/json'}
      });
      if(!response.ok) return false;
      const payload = await response.json();
      const rows = Array.isArray(payload) ? payload :
        (Array.isArray(payload?.data) ? payload.data :
        (Array.isArray(payload?.rows) ? payload.rows : []));

      try{ localStorage.setItem('qmes-erp-purchase-v1',JSON.stringify(rows)); }catch(_){}
      window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__ = rows;
      window.dispatchEvent(new CustomEvent('qmes:purchase-db-refresh',{detail:{rows}}));
      window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{
        detail:{id:'erpPurchase',source:'purchase-registration-repair'}
      }));
      return true;
    }catch(_){
      return false;
    }
  }

  function submitOriginal(ui){
    const check = validateTarget(ui);
    if(!check.ok){ toast(check.message); return false; }

    const form = targetForm(ui);
    const submit = originalSubmit(form);
    if(!form || !submit){
      toast('기존 구매 발주 저장 기능을 찾지 못했습니다.');
      return false;
    }

    try{
      if(form.tagName === 'FORM' && String(submit.type).toLowerCase()==='submit' && typeof form.requestSubmit === 'function'){
        form.requestSubmit(submit);
      }else{
        submit.click();
      }
    }catch(_){
      try{ submit.click(); }
      catch(__){ toast('구매 발주 등록 처리 중 오류가 발생했습니다.'); return false; }
    }

    /* Existing qmesSyncUpsert + create DB bridge remains authoritative.
       These reads only refresh the list after that save path has completed. */
    setTimeout(refreshCanonical,700);
    setTimeout(refreshCanonical,1600);
    setTimeout(refreshCanonical,2800);
    return true;
  }

  function handleClick(event){
    const target = event.target instanceof Element ? event.target : null;
    if(!target) return;

    if(target.closest('[data-qpx-create]')){
      keepLegacyCreateCallable();
      return; // existing enterprise handler performs the delegated click
    }

    const submit = target.closest('.qpdz-target-ui [data-action="submit"]');
    if(submit){
      const ui = submit.closest('.qpdz-target-ui');
      event.preventDefault();
      event.stopImmediatePropagation();
      submitOriginal(ui);
    }
  }

  let queued = false;
  function schedule(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(()=>{
      queued = false;
      keepLegacyCreateCallable();
    });
  }

  function start(){
    document.addEventListener('click',handleClick,true);
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('qmes:navigate-tab',schedule);
    schedule();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();