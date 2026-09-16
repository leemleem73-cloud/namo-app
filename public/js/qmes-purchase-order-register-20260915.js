/* NAMO QMES - purchase register/edit safe bridge (2026-09-16)
 * Scoped strictly to the real purchase-management page.
 * No dashboard styling, no KPI injection, no global ERP layout override.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_REGISTER_SAFE_20260916__) return;
  window.__QMES_PURCHASE_REGISTER_SAFE_20260916__ = true;

  const clean = value => String(value == null ? '' : value).replace(/\s+/g,' ').trim();
  let scheduled = false;

  function purchaseRoot(){
    const root = document.querySelector('.qmes-purchase-live');
    if(!root) return null;

    const header = root.querySelector('.qmes-purchase-page-head,.qerp-head');
    const headerText = clean(header && header.textContent);
    const rootText = clean(root.textContent);

    if(/구매\s*[·ㆍ]?\s*발주관리|구매\s*발주\s*현황|신규\s*구매\s*발주/.test(headerText)) return root;
    if(root.querySelector('.qmes-purchase-page-head') && /구매|발주/.test(rootText)) return root;
    return null;
  }

  function cleanup(){
    const active = purchaseRoot();
    document.querySelectorAll('.qmes-purchase-erp').forEach(node=>{
      if(!active || node !== active) node.classList.remove('qmes-purchase-erp');
    });
    document.querySelectorAll('.qmes-purchase-erp-tabs').forEach(node=>{
      if(!active || !active.contains(node)) node.remove();
    });
    document.querySelectorAll('.qmes-purchase-legacy-hide').forEach(node=>{
      if(!active || !active.contains(node)) node.classList.remove('qmes-purchase-legacy-hide');
    });

    // Remove the previous ERP override stylesheet completely.
    document.getElementById('qmes-purchase-order-register-style-20260915')?.remove();
  }

  function patchHeader(root){
    const actions = root.querySelector('.qmes-purchase-page-head .qerp-head-actions,.qerp-head .qerp-head-actions');
    if(!actions) return;

    const button = Array.from(actions.querySelectorAll('button')).find(btn=>
      /신규\s*발주|발주서\s*생성|구매\s*발주\s*등록|입력\s*닫기|등록\s*닫기/.test(clean(btn.textContent))
    );
    if(!button) return;

    const formVisible = !!root.querySelector('.qerp-card .qerp-form');
    button.textContent = formVisible ? '등록 닫기' : '+ 구매 발주 등록';
    button.setAttribute('aria-label',formVisible ? '구매 발주 등록 닫기' : '구매 발주 등록');
  }

  function patchForm(root){
    const form = root.querySelector('.qerp-card .qerp-form');
    if(!form) return;

    const submit = form.querySelector('button[type="submit"]');
    if(submit && /저장|등록|생성/.test(clean(submit.textContent))){
      submit.textContent = '구매 발주 등록';
    }
  }

  function openOriginalEdit(root,purchaseNo){
    let link = Array.from(root.querySelectorAll('.qp-po-link')).find(node=>clean(node.textContent)===purchaseNo);
    if(link){ link.click(); return true; }

    const search = Array.from(root.querySelectorAll('.qp-toolbar input[type="search"]')).find(input=>
      /발주번호|협력사|품목|MRP/.test(clean(input.placeholder))
    ) || root.querySelector('.qp-toolbar input[type="search"]');
    if(!search) return false;

    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
    descriptor?.set ? descriptor.set.call(search,purchaseNo) : (search.value = purchaseNo);
    search.dispatchEvent(new Event('input',{bubbles:true}));
    search.dispatchEvent(new Event('change',{bubbles:true}));

    let attempts = 0;
    const timer = setInterval(()=>{
      attempts += 1;
      link = Array.from(root.querySelectorAll('.qp-po-link')).find(node=>clean(node.textContent)===purchaseNo);
      if(link){ clearInterval(timer); link.click(); }
      else if(attempts >= 12) clearInterval(timer);
    },50);
    return true;
  }

  function handleClick(event){
    const target = event.target instanceof Element ? event.target : null;
    if(!target) return;

    const editButton = target.closest('.qpc-edit-btn[data-no],.qpc-edit-btn[data-purchase-no]');
    if(editButton){
      const root = purchaseRoot();
      if(!root || !root.contains(editButton)) return;
      const purchaseNo = clean(editButton.dataset.no || editButton.dataset.purchaseNo);
      if(!purchaseNo) return;
      event.preventDefault();
      event.stopPropagation();
      openOriginalEdit(root,purchaseNo);
      return;
    }

    if(target.closest('#qmes-erp-sidebar')){
      setTimeout(schedule,0);
      setTimeout(schedule,120);
    }
  }

  function apply(){
    scheduled = false;
    cleanup();
    const root = purchaseRoot();
    if(!root) return;
    patchHeader(root);
    patchForm(root);
  }

  function schedule(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(apply);
  }

  function start(){
    cleanup();
    document.addEventListener('click',handleClick,true);
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
    new MutationObserver(()=>schedule()).observe(document.body,{childList:true,subtree:true});
    schedule();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

/* Additive loader: purchase page only. Existing bridge above is preserved unchanged. */
(function(){
  'use strict';
  const id='qmes-purchase-enterprise-safe-v2-loader';
  if(document.getElementById(id)) return;
  const script=document.createElement('script');
  script.id=id;
  script.src='/js/qmes-purchase-enterprise-safe-20260916-v2.js?v=20260916b';
  script.defer=true;
  document.head.appendChild(script);
})();
