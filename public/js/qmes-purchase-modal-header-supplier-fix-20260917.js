/* NAMO QMES - purchase modal header + new supplier bridge
 * 2026-09-17
 * Additive-only patch. Existing purchase/order/partner logic is preserved.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_HEADER_SUPPLIER_FIX_20260917__) return;
  window.__QMES_PURCHASE_HEADER_SUPPLIER_FIX_20260917__ = true;

  const STYLE_ID='qmes-purchase-header-supplier-fix-20260917-style';

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
.qmes-purchase-live .qpx-form-card.qpdz-target-modal .qpx-modal-head h3{color:#fff!important;opacity:1!important;text-shadow:0 1px 1px rgba(0,0,0,.12)!important}
.qmes-purchase-live .qpx-form-card.qpdz-target-modal .qpx-modal-head p{color:rgba(255,255,255,.92)!important;opacity:1!important}
.qmes-purchase-live .qpx-form-card.qpdz-target-modal .qpx-modal-head .qpx-step{color:rgba(255,255,255,.96)!important;opacity:1!important}
.qmes-purchase-live .qpx-form-card.qpdz-target-modal .qpx-modal-head .qpx-step b{color:#fff!important;opacity:1!important}
.qmes-purchase-live .qpx-form-card.qpdz-target-modal .qpdz-cart{color:#d8efff!important;opacity:1!important}
#qmes-partner-register-modal-v2{z-index:2147483646!important}
`;
    document.head.appendChild(style);
  }

  function openSupplierRegister(){
    /* Reuse the existing partner-registration module without duplicating its DB/save logic.
       That module opens the supplier dialog when a button labelled '공급업체 등록' is clicked. */
    const proxy=document.createElement('button');
    proxy.type='button';
    proxy.textContent='공급업체 등록';
    proxy.setAttribute('aria-hidden','true');
    proxy.tabIndex=-1;
    proxy.style.cssText='position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(proxy);
    proxy.click();
    proxy.remove();

    /* The partner modal itself is provided by partners-register-modal-v2-20260821.js.
       If it is not yet available, do one short retry after scripts finish settling. */
    if(!document.getElementById('qmes-partner-register-modal-v2')){
      setTimeout(()=>{
        if(document.getElementById('qmes-partner-register-modal-v2')) return;
        const retry=document.createElement('button');
        retry.type='button';
        retry.textContent='공급업체 등록';
        retry.setAttribute('aria-hidden','true');
        retry.tabIndex=-1;
        retry.style.cssText='position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;';
        document.body.appendChild(retry);
        retry.click();
        retry.remove();
      },80);
    }
  }

  function handleClick(event){
    const target=event.target instanceof Element ? event.target : null;
    const button=target && target.closest('.qmes-purchase-live .qpdz-target-ui [data-action="new-supplier"]');
    if(!button) return;

    /* Stop the target-layout fallback handler, which only searches for another
       hidden '신규 협력사' button and therefore does nothing on the current screen. */
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openSupplierRegister();
  }

  function start(){
    ensureStyle();
    document.addEventListener('click',handleClick,true);
    new MutationObserver(ensureStyle).observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
