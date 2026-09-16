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
   QMES PURCHASE CREATE BUTTON / APPROVED MODAL RECOVERY
   Additive only: no data/save logic replacement.
   Makes the top '+ 신규 구매 발주' button open the existing purchase form,
   then hands that original form to the approved 4-section target layout.
   ========================================================= */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_CREATE_RECOVERY_20260916__) return;
  window.__QMES_PURCHASE_CREATE_RECOVERY_20260916__ = true;

  const clean = v => String(v == null ? '' : v).replace(/\s+/g,' ').trim();
  let opening = false;

  function visible(el){
    if(!el || !el.isConnected) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden';
  }

  function purchaseActive(){
    const host = Array.from(document.querySelectorAll('.qpx-enterprise-host')).find(visible);
    if(!host) return false;
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,[class*="title"]')).some(el =>
      visible(el) && /^구매\s*[·ㆍ]?\s*발주관리$/.test(clean(el.textContent))
    );
  }

  function modalTitle(){
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,strong,[class*="modal-title"],[class*="title"]')).find(el =>
      visible(el) && /^신규\s*구매\s*발주\s*등록$/.test(clean(el.textContent))
    ) || null;
  }

  function approvedModalPresent(){
    return !!document.querySelector('.qpdz-target-modal .qpdz-target-ui') || !!modalTitle();
  }

  function findLegacyCreateTrigger(){
    const nodes = Array.from(document.querySelectorAll('button,a,[role="button"]'));
    let best = null;
    let bestScore = -1;
    for(const el of nodes){
      if(el.closest('.qpx-enterprise-host,.qpdz-target-ui,.qpdz-target-modal')) continue;
      const text = clean(el.textContent);
      const aria = clean(el.getAttribute('aria-label'));
      const title = clean(el.getAttribute('title'));
      const all = (text+' '+aria+' '+title).replace(/\s+/g,' ').trim();
      let score = -1;
      if(/^\+?\s*신규\s*구매\s*발주$/.test(text) || /^＋\s*신규\s*구매\s*발주$/.test(text)) score = 100;
      else if(/구매\s*발주\s*등록/.test(all)) score = 90;
      else if(/신규\s*발주/.test(all)) score = 80;
      else if(/발주서\s*생성/.test(all)) score = 70;
      if(score > bestScore){ best = el; bestScore = score; }
    }
    return best;
  }

  function adoptExistingModal(){
    const title = modalTitle();
    if(!title) return false;

    let card = title.closest('[role="dialog"],.modal-content,.qmes-modal,.modal,.qerp-card,.qpx-form-card');
    if(!card){
      let node = title.parentElement;
      let depth = 0;
      while(node && node !== document.body && depth++ < 9){
        if(node.querySelector('input,select,textarea') && /발주\s*기본\s*정보/.test(clean(node.textContent))){ card = node; break; }
        node = node.parentElement;
      }
    }
    if(!card) return false;

    let form = card.querySelector('form,.qerp-form');
    if(!form){
      const blocks = Array.from(card.querySelectorAll('div,section')).filter(el =>
        el.querySelector('input,select,textarea') && /발주\s*기본\s*정보/.test(clean(el.textContent))
      );
      blocks.sort((a,b)=>clean(a.textContent).length-clean(b.textContent).length);
      form = blocks[0] || null;
    }
    if(!form) return false;

    let host = card.parentElement;
    if(!host || host === document.body || host.id === 'root'){
      host = card.closest('.modal-overlay,.qmes-modal-overlay,.overlay,[role="presentation"]') || card.parentElement;
    }
    if(host && host !== document.body) host.classList.add('qmes-purchase-live');
    card.classList.add('qerp-card','qpx-form-card');
    form.classList.add('qerp-form');
    card.setAttribute('data-qmes-purchase-modal-adopted','create-recovery-20260916');

    // Wake the existing target-layout MutationObserver after classes are in place.
    const ping = document.createElement('span');
    ping.hidden = true;
    ping.setAttribute('data-qmes-purchase-modal-ping','1');
    form.appendChild(ping);
    requestAnimationFrame(()=>ping.remove());
    return true;
  }

  function recoverOpen(){
    if(!purchaseActive()) return;
    if(approvedModalPresent()){
      adoptExistingModal();
      opening = false;
      return;
    }

    const trigger = findLegacyCreateTrigger();
    if(!trigger){
      opening = false;
      console.warn('[QMES purchase] legacy create trigger not found');
      return;
    }

    trigger.click();
    [40,100,180,320,520].forEach(ms=>setTimeout(()=>{
      if(adoptExistingModal()) opening = false;
    },ms));
    setTimeout(()=>{opening=false;},700);
  }

  function onClick(e){
    const target = e.target instanceof Element ? e.target.closest('.qpx-enterprise-host [data-qpx-create]') : null;
    if(!target || !purchaseActive()) return;
    if(opening) return;
    opening = true;
    // The existing enterprise handler runs first and may already open the original form.
    // Give it one render turn, then recover only if the modal is still absent.
    setTimeout(()=>{
      if(approvedModalPresent()){
        adoptExistingModal();
        opening = false;
      }else{
        recoverOpen();
      }
    },70);
  }

  function start(){
    document.addEventListener('click',onClick,true);
    new MutationObserver(()=>{
      if(modalTitle()) adoptExistingModal();
    }).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
