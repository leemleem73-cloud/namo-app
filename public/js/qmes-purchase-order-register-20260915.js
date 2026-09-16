/* =========================================================
   QMES PURCHASE TARGET ROOT ADOPTER - SAFE ADDITIVE PATCH
   2026-09-16
   Purpose:
   - Adopt only the visible purchase-management page as .qmes-purchase-live
   - Adopt only the visible new-purchase modal when React renders it outside
     the purchase page container
   - Preserve existing purchase data/save logic and all other QMES screens
   ========================================================= */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_ROOT_ADOPTER_20260916__) return;
  window.__QMES_PURCHASE_ROOT_ADOPTER_20260916__ = true;

  const clean = value => String(value == null ? '' : value).replace(/\s+/g,' ').trim();
  const PAGE_TITLE_RE = /^구매\s*[·ㆍ]?\s*발주관리$/;
  const MODAL_TITLE_RE = /^신규\s*구매\s*발주\s*등록$/;
  let queued = false;

  function visible(el){
    if(!el || !el.isConnected) return false;
    const s = window.getComputedStyle ? getComputedStyle(el) : null;
    return !s || (s.display !== 'none' && s.visibility !== 'hidden');
  }

  function createButtonIn(node){
    if(!node) return null;
    return Array.from(node.querySelectorAll('button,a')).find(el =>
      /신규\s*구매\s*발주|구매\s*발주\s*등록|신규\s*발주|발주서\s*생성/.test(clean(el.textContent))
    ) || null;
  }

  function hasGlobalShell(node){
    if(!node) return true;
    if(node === document.body || node.id === 'root') return true;
    return !!node.querySelector(':scope > aside,:scope > nav,#qmes-erp-sidebar,.qmes-sidebar,.sidebar-menu');
  }

  function findPageTitle(){
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,[class*="page-title"],[class*="title"]')).find(el =>
      visible(el) && PAGE_TITLE_RE.test(clean(el.textContent))
    ) || null;
  }

  function findPurchaseRoot(){
    const existing = Array.from(document.querySelectorAll('.qmes-purchase-live')).find(el => {
      const t = clean(el.textContent).slice(0,1800);
      return visible(el) && PAGE_TITLE_RE.test(clean(el.querySelector('h1,h2,h3,h4')?.textContent || '')) && /신규\s*구매\s*발주|구매\s*발주\s*등록/.test(t);
    });
    if(existing) return existing;

    const title = findPageTitle();
    if(!title) return null;

    let node = title.parentElement;
    let steps = 0;
    while(node && node !== document.body && node.id !== 'root' && steps++ < 12){
      const txt = clean(node.textContent).slice(0,5000);
      if(createButtonIn(node) && /발주|구매/.test(txt) && (/구매\s*발주\s*현황|발주번호|협력사|MRP|IQC/.test(txt)) && !hasGlobalShell(node)){
        return node;
      }
      if(hasGlobalShell(node)) break;
      node = node.parentElement;
    }

    const main = title.closest('main,[role="main"],.main-content,.content-area,.page-content');
    if(main && main.id !== 'root' && !hasGlobalShell(main) && createButtonIn(main)) return main;
    return null;
  }

  function markPurchaseHeader(root){
    if(!root) return;
    if(root.querySelector('.qmes-purchase-page-head,.qerp-head')) return;
    const title = Array.from(root.querySelectorAll('h1,h2,h3,h4,[class*="title"]')).find(el => PAGE_TITLE_RE.test(clean(el.textContent)));
    if(!title) return;
    let node = title.parentElement;
    let steps = 0;
    while(node && node !== root && steps++ < 6){
      if(createButtonIn(node)){
        node.classList.add('qmes-purchase-page-head');
        return;
      }
      node = node.parentElement;
    }
    const titleBox = title.parentElement;
    if(titleBox && titleBox !== root) titleBox.classList.add('qmes-purchase-page-head');
  }

  function findModalTitle(){
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,strong,[class*="modal-title"]')).find(el =>
      visible(el) && MODAL_TITLE_RE.test(clean(el.textContent))
    ) || null;
  }

  function adoptModal(mainRoot){
    const title = findModalTitle();
    if(!title) return;

    let card = title.closest('.qpx-form-card,.qerp-card,.modal-content,[role="dialog"],.qmes-modal,.modal');
    if(!card){
      let node = title.parentElement;
      let steps = 0;
      while(node && node !== document.body && steps++ < 7){
        const txt = clean(node.textContent);
        if(/발주\s*기본\s*정보/.test(txt) && node.querySelector('input,select,textarea')){ card = node; break; }
        node = node.parentElement;
      }
    }
    if(!card) return;

    let form = card.querySelector('.qerp-form,form');
    if(!form){
      const submit = Array.from(card.querySelectorAll('button')).find(b => /결재\s*상신|저장|등록/.test(clean(b.textContent)));
      if(submit){
        let node = submit.parentElement;
        let steps = 0;
        while(node && node !== card && steps++ < 6){
          if(/발주\s*기본\s*정보/.test(clean(node.textContent)) && node.querySelector('input,select,textarea')){ form = node; }
          node = node.parentElement;
        }
      }
    }
    if(!form && card.querySelector('input,select,textarea')) form = card;

    if(card === form){
      const inner = Array.from(card.children).find(el => el instanceof Element && /발주\s*기본\s*정보/.test(clean(el.textContent)) && el.querySelector('input,select,textarea'));
      if(inner) form = inner;
    }

    card.classList.add('qerp-card','qpx-form-card');
    card.setAttribute('data-qmes-purchase-modal-adopted','20260916');
    if(form){
      form.classList.add('qerp-form');
      form.setAttribute('data-qmes-purchase-form-adopted','20260916');
    }

    const insideMain = !!(mainRoot && mainRoot.contains(card));
    if(!insideMain){
      let host = card.parentElement;
      if(host === document.body || host?.id === 'root') host = null;
      if(!host){
        const overlay = title.closest('[role="dialog"],.modal-overlay,.qmes-modal-overlay,.overlay');
        if(overlay && overlay !== card) host = overlay;
      }
      if(host){
        host.classList.add('qmes-purchase-live');
        host.setAttribute('data-qmes-purchase-modal-host','20260916');
      }
    }
  }

  function adopt(){
    queued = false;
    const root = findPurchaseRoot();
    if(root){
      root.classList.add('qmes-purchase-live');
      root.setAttribute('data-qmes-purchase-root-adopted','20260916');
      markPurchaseHeader(root);
    }
    adoptModal(root);
  }

  function schedule(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(adopt);
  }

  function start(){
    schedule();
    document.addEventListener('click',function(e){
      const el = e.target instanceof Element ? e.target.closest('button,a,[data-qmes-menu]') : null;
      if(el && /구매|발주/.test(clean(el.textContent))){
        setTimeout(schedule,0);
        setTimeout(schedule,60);
        setTimeout(schedule,180);
      }
    },true);
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

/* The older one-grid modal enhancer is superseded by the approved four-section target layout.
   Keep its file untouched, but prevent it from competing with the approved target UI. */
window.__QMES_PURCHASE_MODAL_DOUZONE_ADDITIVE_20260916__ = true;

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
  script.src='/js/qmes-purchase-enterprise-safe-20260916-v2.js?v=20260916-rootfix1';
  script.defer=true;
  document.head.appendChild(script);
})();

/* Preserved loader for the older additive modal enhancer. It is intentionally no-op now
   because the approved target modal is the authoritative layout. */
(function(){
  'use strict';
  const id='qmes-purchase-order-modal-douzone-additive-20260916-loader';
  if(document.getElementById(id)) return;
  const script=document.createElement('script');
  script.id=id;
  script.src='/js/qmes-purchase-order-modal-douzone-additive-20260916.js?v=20260916-rootfix1';
  script.defer=true;
  document.head.appendChild(script);
})();

/* Additive loader: approved purchase-order target modal. Existing code above is preserved unchanged. */
(function(){
  'use strict';
  const id='qmes-purchase-order-target-layout-20260916-v1-loader';
  if(document.getElementById(id)) return;
  const script=document.createElement('script');
  script.id=id;
  script.src='/js/qmes-purchase-order-target-layout-20260916-v1.js?v=20260916-rootfix1';
  script.defer=true;
  document.head.appendChild(script);
})();

/* Additive cleanup: hide only the two duplicate legacy actions marked by the user.
   Keep target toolbar actions visible and keep original legacy buttons in DOM for programmatic reuse. */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_DUPLICATE_ACTION_CLEANUP_20260916__) return;
  window.__QMES_PURCHASE_DUPLICATE_ACTION_CLEANUP_20260916__ = true;
  const clean = v => String(v == null ? '' : v).replace(/\s+/g,' ').trim();
  let queued = false;

  function apply(){
    queued = false;
    document.querySelectorAll('.qmes-purchase-live').forEach(root=>{
      root.querySelectorAll('button,a').forEach(el=>{
        if(el.closest('.qpx-enterprise-host,.qpx-form-card,.qpdz-target-ui')) return;
        const text = clean(el.textContent).replace(/^[+＋]\s*/,'');
        if(text === '공용 DB 연동' || text === '신규 구매 발주'){
          el.setAttribute('data-qmes-purchase-duplicate-hidden','1');
          el.style.setProperty('display','none','important');
        }
      });
    });
  }

  function schedule(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  function start(){
    schedule();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
