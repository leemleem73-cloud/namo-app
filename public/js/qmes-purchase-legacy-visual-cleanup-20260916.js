/* NAMO QMES - purchase legacy visual cleanup (additive only)
 * 2026-09-16
 * Scope: purchase-management screen only.
 * Keeps legacy DOM/data/functions intact and hides duplicated legacy visuals.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_LEGACY_VISUAL_CLEANUP_20260916__) return;
  window.__QMES_PURCHASE_LEGACY_VISUAL_CLEANUP_20260916__ = true;

  const clean = v => String(v == null ? '' : v).replace(/\s+/g,' ').trim();
  let queued = false;

  function visible(el){
    if(!el || !el.isConnected) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden';
  }

  function targetHost(){
    return Array.from(document.querySelectorAll('.qpx-enterprise-host')).find(visible) || null;
  }

  function purchasePageActive(){
    const host = targetHost();
    if(!host) return false;
    const title = host.querySelector('.qpx-title');
    if(title && /^구매\s*[·ㆍ]?\s*발주관리$/.test(clean(title.textContent))) return true;
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,[class*="title"]')).some(el =>
      visible(el) && /^구매\s*[·ㆍ]?\s*발주관리$/.test(clean(el.textContent))
    );
  }

  function protectedNode(el,host){
    if(!el || !host) return true;
    if(el === document.body || el.id === 'root') return true;
    if(el === host || el.contains(host) || host.contains(el)) return true;
    if(el.closest('.qpx-enterprise-host,.qpx-form-card,.qpdz-target-ui')) return true;
    return false;
  }

  function hide(el,label,host){
    if(protectedNode(el,host)) return false;
    el.setAttribute('data-qmes-purchase-legacy-hidden',label || '1');
    el.style.setProperty('display','none','important');
    return true;
  }

  function candidates(){
    return Array.from(document.querySelectorAll('section,article,fieldset,div'));
  }

  function smallest(match,host){
    const list = candidates().filter(el => {
      if(protectedNode(el,host)) return false;
      const t = clean(el.textContent);
      if(!t || t.length > 12000) return false;
      return match(t,el);
    });
    list.sort((a,b)=>{
      const ta = clean(a.textContent).length;
      const tb = clean(b.textContent).length;
      if(ta !== tb) return ta - tb;
      const aa = a.getBoundingClientRect();
      const bb = b.getBoundingClientRect();
      return (aa.width*aa.height) - (bb.width*bb.height);
    });
    return list[0] || null;
  }

  function hideDuplicateActions(host){
    document.querySelectorAll('button,a,[role="button"],span').forEach(el => {
      if(protectedNode(el,host)) return;
      const compact = clean(el.textContent).replace(/^[+＋]\s*/,'').replace(/\s+/g,'');
      if(compact === '공용DB연동' || compact === '신규구매발주'){
        const r = el.getBoundingClientRect();
        if(r.width > 0 && r.width < 320 && r.height > 0 && r.height < 90) hide(el,'duplicate-action',host);
      }
    });
  }

  function hideLegacyProcess(host){
    const node = smallest(t =>
      /구매요청\s*[·ㆍ]?\s*MRP/.test(t) &&
      /견적\s*[·ㆍ]?\s*협력사/.test(t) &&
      /전자결재/.test(t) &&
      /발주\s*[·ㆍ]?\s*납기/.test(t) &&
      /입고\s*[·ㆍ]?\s*IQC/.test(t), host);
    if(node) hide(node,'legacy-process',host);
  }

  function hideLegacyKpi(host){
    const node = smallest(t =>
      /이번\s*달\s*발주금액/.test(t) &&
      /결재\s*대기/.test(t) &&
      /납기\s*위험/.test(t) &&
      /미입고\s*수량/.test(t), host);
    if(node) hide(node,'legacy-kpi',host);
  }

  function hideLegacyStatus(host){
    const node = smallest(t => {
      const title = /구매요청\s*및\s*발주\s*현황/.test(t) || /구매\s*발주\s*현황/.test(t);
      const columns = /발주번호/.test(t) && /협력사/.test(t) && (/입고/.test(t) || /IQC/.test(t));
      return title && columns;
    },host);
    if(node) hide(node,'legacy-purchase-status',host);
  }

  function hideLegacyBlockFallback(host){
    const node = smallest(t =>
      /구매요청\s*[·ㆍ]?\s*MRP/.test(t) &&
      /이번\s*달\s*발주금액/.test(t) &&
      (/구매요청\s*및\s*발주\s*현황/.test(t) || /구매\s*발주\s*현황/.test(t)) &&
      /납기\s*위험/.test(t), host);
    if(node) hide(node,'legacy-lower-block',host);
  }

  function apply(){
    queued = false;
    if(!purchasePageActive()) return;
    const host = targetHost();
    if(!host) return;
    hideDuplicateActions(host);
    hideLegacyBlockFallback(host);
    hideLegacyProcess(host);
    hideLegacyKpi(host);
    hideLegacyStatus(host);
  }

  function schedule(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  function start(){
    schedule();
    window.addEventListener('qmes:navigate-tab',()=>{setTimeout(schedule,0);setTimeout(schedule,120);});
    window.addEventListener('focus',schedule);
    document.addEventListener('click',e=>{
      const el = e.target instanceof Element ? e.target.closest('button,a,[data-qmes-menu]') : null;
      if(el && /구매|발주/.test(clean(el.textContent))){
        setTimeout(schedule,0);
        setTimeout(schedule,80);
        setTimeout(schedule,220);
      }
    },true);
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

/* =========================================================
   QMES PURCHASE CREATE SAFE BRIDGE
   2026-09-16
   Fixes the freeze caused by the previous recursive modal observer.
   - No recursive MutationObserver.
   - Reuses the real React purchase form and its save logic.
   - Adapts the modal once, then lets the approved target-layout script render it.
   ========================================================= */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_CREATE_SAFE_BRIDGE_20260916__) return;
  window.__QMES_PURCHASE_CREATE_SAFE_BRIDGE_20260916__ = true;

  /* Prevent the superseded recursive bridge from ever starting if an older cached
     copy of this file is mixed with newer loaders. */
  window.__QMES_PURCHASE_CREATE_DIRECT_BRIDGE_20260916__ = true;
  window.__QMES_PURCHASE_CREATE_RECOVERY_20260916__ = true;

  const clean = v => String(v == null ? '' : v).replace(/\s+/g,' ').trim();
  let triggerPatchTimer = 0;
  let modalPollTimer = 0;

  function coreTrigger(){
    const buttons = Array.from(document.querySelectorAll('.qp-root .qerp-head button,.qp-root button.qerp-btn,.qp-root button'));
    return buttons.find(btn=>{
      if(btn.closest('.qpx-enterprise-host,.qpdz-target-ui')) return false;
      const text = clean(btn.textContent).replace(/^[+＋]\s*/,'');
      return /^(신규\s*구매\s*발주|구매\s*발주\s*등록|신규\s*발주)$/.test(text);
    }) || null;
  }

  function patchCoreTrigger(){
    const button = coreTrigger();
    if(!button) return false;
    button.setAttribute('data-qmes-core-purchase-create','1');
    /* qmes-purchase-enterprise-safe-v2 finds this exact wording. The original
       button is hidden by the approved view, so this does not change the visible UI. */
    button.textContent = '+ 구매 발주 등록';
    button.setAttribute('aria-label','구매 발주 등록');
    return true;
  }

  function patchTriggerForAWhile(){
    clearInterval(triggerPatchTimer);
    let tries = 0;
    if(patchCoreTrigger()) return;
    triggerPatchTimer = setInterval(()=>{
      tries += 1;
      if(patchCoreTrigger() || tries >= 40){
        clearInterval(triggerPatchTimer);
        triggerPatchTimer = 0;
      }
    },250);
  }

  function findCoreModalBg(){
    const bgs = Array.from(document.querySelectorAll('.qp-modal-bg'));
    return bgs.find(bg=>{
      const title = clean(bg.querySelector('.qp-modal-head h1,.qp-modal-head h2,.qp-modal-head h3,.qp-modal h1,.qp-modal h2,.qp-modal h3')?.textContent);
      const text = clean(bg.textContent).slice(0,2500);
      return /신규\s*구매\s*발주\s*등록/.test(title) || (/발주\s*기본\s*정보/.test(text) && /요청납기/.test(text));
    }) || null;
  }

  function addProxyButtons(modal,body){
    if(body.querySelector('[data-qmes-safe-submit-proxy]')) return;

    const submitProxy = document.createElement('button');
    submitProxy.type = 'button';
    submitProxy.hidden = true;
    submitProxy.textContent = '결재상신';
    submitProxy.setAttribute('data-qmes-safe-submit-proxy','1');
    submitProxy.addEventListener('click',()=>{
      const real = Array.from(modal.querySelectorAll('button')).find(btn=>
        btn !== submitProxy && !btn.closest('.qpdz-target-ui') &&
        (btn.type === 'submit' || /결재\s*상신|저장|등록/.test(clean(btn.textContent)))
      );
      if(real) real.click();
      else if(typeof modal.requestSubmit === 'function') modal.requestSubmit();
    });

    const cancelProxy = document.createElement('button');
    cancelProxy.type = 'button';
    cancelProxy.hidden = true;
    cancelProxy.textContent = '취소';
    cancelProxy.setAttribute('data-qmes-safe-cancel-proxy','1');
    cancelProxy.addEventListener('click',()=>{
      const close = modal.querySelector('.qp-close,[aria-label="닫기"]');
      if(close) close.click();
    });

    body.appendChild(submitProxy);
    body.appendChild(cancelProxy);
  }

  function prepareModalOnce(){
    const bg = findCoreModalBg();
    if(!bg) return false;

    const modal = bg.querySelector('form.qp-modal,.qp-modal');
    const body = modal && modal.querySelector('.qp-body');
    if(!modal || !body) return false;

    if(modal.dataset.qmesSafePurchasePrepared === '1'){
      bg.removeAttribute('data-qpx-hidden-original');
      return true;
    }

    modal.dataset.qmesSafePurchasePrepared = '1';
    bg.classList.add('qmes-purchase-live');
    bg.removeAttribute('data-qpx-hidden-original');
    modal.removeAttribute('data-qpx-hidden-original');

    /* These two classes make the existing enterprise layer recognize the real
       React modal as the active original form, so it is not hidden as legacy UI. */
    modal.classList.add('qerp-card','qpx-form-card');
    body.classList.add('qerp-form');

    const head = modal.querySelector('.qp-modal-head');
    if(head){
      head.classList.add('qpx-modal-head');
      const title = head.querySelector('h1,h2,h3');
      if(title) title.textContent = '신규 구매 발주 등록';
      const close = head.querySelector('.qp-close,[aria-label="닫기"]');
      if(close) close.classList.add('qpx-modal-close');
      if(!head.querySelector('.qpx-steps')){
        const steps = document.createElement('div');
        steps.className = 'qpx-steps';
        steps.innerHTML = '<span class="qpx-step"><b>1</b>기본정보</span><span class="qpx-step"><b>2</b>품목등록</span><span class="qpx-step"><b>3</b>품질요구사항</span><span class="qpx-step"><b>4</b>결재상신</span>';
        if(close) head.insertBefore(steps,close); else head.appendChild(steps);
      }
    }

    addProxyButtons(modal,body);

    /* One single child mutation wakes qmes-purchase-order-target-layout.
       No observer here, so this cannot recurse/freeze the page. */
    const ping = document.createElement('span');
    ping.hidden = true;
    ping.setAttribute('data-qmes-safe-modal-ping','1');
    body.appendChild(ping);
    setTimeout(()=>{ if(ping.isConnected) ping.remove(); },80);
    return true;
  }

  function pollForModal(){
    clearInterval(modalPollTimer);
    let tries = 0;
    if(prepareModalOnce()) return;
    modalPollTimer = setInterval(()=>{
      tries += 1;
      if(prepareModalOnce() || tries >= 30){
        clearInterval(modalPollTimer);
        modalPollTimer = 0;
      }
    },60);
  }

  function onClick(event){
    const target = event.target instanceof Element ? event.target : null;
    if(!target) return;

    if(target.closest('.qpx-enterprise-host [data-qpx-create]')){
      /* The enterprise layer still owns the click and opens the real React form.
         We only make sure its hidden core trigger is discoverable, then adapt
         the resulting modal with bounded polling. */
      patchCoreTrigger();
      setTimeout(pollForModal,0);
      setTimeout(pollForModal,120);
      return;
    }

    if(target.closest('[data-qmes-core-purchase-create]')){
      setTimeout(pollForModal,0);
      setTimeout(pollForModal,80);
    }
  }

  function start(){
    patchTriggerForAWhile();
    document.addEventListener('click',onClick,true);
    window.addEventListener('qmes:navigate-tab',()=>{
      setTimeout(patchTriggerForAWhile,0);
      setTimeout(patchTriggerForAWhile,180);
    });
    window.addEventListener('focus',patchCoreTrigger);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
