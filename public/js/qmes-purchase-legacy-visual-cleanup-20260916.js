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
    document.querySelectorAll('button,a').forEach(el => {
      if(protectedNode(el,host)) return;
      const t = clean(el.textContent).replace(/^[+＋]\s*/,'');
      if(t === '공용 DB 연동' || t === '신규 구매 발주'){
        hide(el,'duplicate-action',host);
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
    // If React groups the three legacy areas inside one lower wrapper, hide the
    // smallest wrapper that contains the unmistakable legacy markers but never
    // contains the approved target UI.
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
