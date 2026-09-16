/* NAMO QMES - purchase legacy visual cleanup (additive only)
 * 2026-09-16
 * Scope: only while the approved purchase-management target UI is active.
 * Keeps legacy DOM/data/functions intact and hides only duplicated legacy visuals.
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
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,[class*="title"]')).some(el => {
      const t = clean(el.textContent);
      return visible(el) && /^구매\s*[·ㆍ]?\s*발주관리$/.test(t);
    });
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
      const raw = clean(el.textContent);
      const t = raw.replace(/^[+＋]\s*/,'');
      const compact = t.replace(/\s+/g,'');
      if(compact === '공용DB연동' || compact === '신규구매발주'){
        const r = el.getBoundingClientRect();
        if(r.width > 0 && r.width < 320 && r.height > 0 && r.height < 90){
          hide(el,'duplicate-action',host);
        }
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
      const columns = /발주번호/.test(t) && /협력사/.test(t) && /입고\s*[·ㆍ]?\s*IQC|입고|IQC/.test(t);
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
   QMES PURCHASE CREATE DIRECT BRIDGE
   2026-09-16
   - The approved top button opens the real React purchase form directly.
   - The real form is adapted in-place for the approved 4-section target layout.
   - No purchase save/data logic is replaced.
   ========================================================= */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_CREATE_DIRECT_BRIDGE_20260916__) return;
  window.__QMES_PURCHASE_CREATE_DIRECT_BRIDGE_20260916__ = true;

  const clean = v => String(v == null ? '' : v).replace(/\s+/g,' ').trim();
  let opening = false;

  function ensureStyle(){
    if(document.getElementById('qmes-purchase-create-direct-style-20260916')) return;
    const style = document.createElement('style');
    style.id = 'qmes-purchase-create-direct-style-20260916';
    style.textContent = `
      .qmes-purchase-live.qpx-enterprise-safe-v2 > .qp-modal-bg[data-qmes-direct-purchase-modal="1"],
      .qmes-purchase-live .qp-modal-bg[data-qmes-direct-purchase-modal="1"]{
        display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;
      }
      .qmes-purchase-live .qp-modal.qpx-form-card.qpdz-target-modal{display:block!important}
      .qmes-purchase-live .qp-modal.qpx-form-card.qpdz-target-modal .qpx-modal-head h2{
        margin:0!important;font-size:21px!important;line-height:1.15!important;font-weight:950!important;color:#fff!important;
      }
      .qmes-purchase-live .qp-modal.qpx-form-card.qpdz-target-modal .qpx-modal-head{
        border-radius:10px 10px 0 0!important;
      }
      .qmes-purchase-live .qp-modal.qpx-form-card.qpdz-target-modal .qp-body.qerp-form.qpdz-target-form{
        padding:4px 2px 68px!important;
      }
      .qmes-purchase-live .qp-modal.qpx-form-card.qpdz-target-modal .qpx-steps{margin-left:auto!important}
      .qmes-purchase-live .qp-modal.qpx-form-card.qpdz-target-modal .qp-close{flex:none!important}
    `;
    document.head.appendChild(style);
  }

  function purchaseActive(){
    const host = document.querySelector('.qpx-enterprise-host');
    if(!host) return false;
    const title = host.querySelector('.qpx-title');
    return !!title && /^구매\s*[·ㆍ]?\s*발주관리$/.test(clean(title.textContent));
  }

  function findCoreCreateTrigger(){
    const candidates = Array.from(document.querySelectorAll('.qp-root .qerp-head button,.qp-root button.qerp-btn'));
    return candidates.find(btn=>{
      if(btn.closest('.qpx-enterprise-host')) return false;
      const text = clean(btn.textContent).replace(/^[+＋]\s*/,'');
      return text === '신규 구매 발주' || text === '구매 발주 등록';
    }) || null;
  }

  function findCoreModal(){
    return Array.from(document.querySelectorAll('.qp-modal-bg')).find(bg=>{
      const title = bg.querySelector('.qp-modal-head h2,.qp-modal h2');
      return title && /^신규\s*구매\s*발주\s*등록$/.test(clean(title.textContent));
    }) || null;
  }

  function addProxyButtons(modal,body){
    if(body.querySelector('[data-qmes-target-submit-proxy]')) return;

    const submitProxy = document.createElement('button');
    submitProxy.type = 'button';
    submitProxy.textContent = '결재상신';
    submitProxy.hidden = true;
    submitProxy.setAttribute('data-qmes-target-submit-proxy','1');
    submitProxy.addEventListener('click',()=>{
      if(typeof modal.requestSubmit === 'function') modal.requestSubmit();
      else modal.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    });

    const cancelProxy = document.createElement('button');
    cancelProxy.type = 'button';
    cancelProxy.textContent = '취소';
    cancelProxy.hidden = true;
    cancelProxy.setAttribute('data-qmes-target-cancel-proxy','1');
    cancelProxy.addEventListener('click',()=>{
      const close = modal.querySelector('.qp-close');
      if(close) close.click();
    });

    body.appendChild(submitProxy);
    body.appendChild(cancelProxy);
  }

  function prepareCoreModal(){
    const bg = findCoreModal();
    if(!bg) return false;

    ensureStyle();
    bg.setAttribute('data-qmes-direct-purchase-modal','1');
    bg.removeAttribute('data-qpx-hidden-original');
    bg.style.removeProperty('display');

    const modal = bg.querySelector('form.qp-modal,.qp-modal');
    if(!modal) return false;
    modal.removeAttribute('data-qpx-hidden-original');
    modal.classList.add('qpx-form-card');

    const body = modal.querySelector('.qp-body');
    if(!body) return false;
    body.classList.add('qerp-form');
    addProxyButtons(modal,body);

    const head = modal.querySelector('.qp-modal-head');
    if(head){
      head.classList.add('qpx-modal-head');
      const title = head.querySelector('h2');
      if(title) title.textContent = '신규 구매 발주 등록';
      const sub = head.querySelector('p');
      if(sub) sub.textContent = 'MRP·작업지시·협력사·IQC를 하나의 발주번호로 연결합니다.';
      const close = head.querySelector('.qp-close');
      if(close) close.classList.add('qpx-modal-close');
      if(!head.querySelector('.qpx-steps')){
        const steps = document.createElement('div');
        steps.className = 'qpx-steps';
        steps.innerHTML = '<span class="qpx-step"><b>1</b>기본정보</span><span class="qpx-step"><b>2</b>품목등록</span><span class="qpx-step"><b>3</b>품질요구사항</span><span class="qpx-step"><b>4</b>결재상신</span>';
        if(close) head.insertBefore(steps,close); else head.appendChild(steps);
      }
    }

    // Wake the existing approved target-layout observer.
    const ping = document.createElement('span');
    ping.hidden = true;
    ping.setAttribute('data-qmes-purchase-modal-ping','direct-20260916');
    body.appendChild(ping);
    requestAnimationFrame(()=>ping.remove());

    return true;
  }

  function keepModalVisible(){
    const bg = findCoreModal();
    if(!bg) return;
    bg.setAttribute('data-qmes-direct-purchase-modal','1');
    bg.removeAttribute('data-qpx-hidden-original');
  }

  function openCorePurchase(){
    const trigger = findCoreCreateTrigger();
    if(!trigger){
      opening = false;
      console.error('[QMES purchase] core React create trigger not found');
      return;
    }

    trigger.click();
    [0,25,60,110,180,280,420,650].forEach(ms=>setTimeout(()=>{
      if(prepareCoreModal()) opening = false;
      keepModalVisible();
    },ms));
    setTimeout(()=>{opening=false;},800);
  }

  function onCreateClick(event){
    const target = event.target instanceof Element ? event.target.closest('.qpx-enterprise-host [data-qpx-create]') : null;
    if(!target || !purchaseActive()) return;

    // This bridge owns the approved create button. Prevent the older fallback
    // handler from displaying "기존 구매 발주 등록 화면을 찾지 못했습니다."
    event.preventDefault();
    event.stopImmediatePropagation();
    if(opening) return;
    opening = true;
    openCorePurchase();
  }

  function start(){
    ensureStyle();
    document.addEventListener('click',onCreateClick,true);
    new MutationObserver(()=>{
      if(findCoreModal()){
        prepareCoreModal();
        keepModalVisible();
      }
    }).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
