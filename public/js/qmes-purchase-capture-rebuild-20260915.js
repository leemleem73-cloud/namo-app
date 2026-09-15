/* NAMO QMES - purchase safety hotfix (2026-09-16)
 * Purpose:
 * 1) Never inject purchase UI into the dashboard or any non-purchase page.
 * 2) Remove stale purchase overlay/host nodes left by the previous patch.
 * 3) Stop all background purchase DB rebuild/delete/post work from the UI patch.
 * 4) Keep only the existing purchase -> IQC navigation hook when a purchase link exists.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_SAFETY_HOTFIX_20260916__) return;
  window.__QMES_PURCHASE_SAFETY_HOTFIX_20260916__ = true;

  const clean = value => String(value == null ? '' : value).replace(/\s+/g,' ').trim();

  function purchaseRoot(){
    const root = document.querySelector('.qmes-purchase-live');
    if(!root) return null;

    const header = root.querySelector('.qmes-purchase-page-head,.qerp-head');
    const headerText = clean(header && header.textContent);
    const rootText = clean(root.textContent);

    // Strict scope: this patch is valid only inside the actual purchase-management view.
    if(/구매\s*[·ㆍ]?\s*발주관리|구매\s*발주\s*현황|신규\s*구매\s*발주/.test(headerText)) return root;
    if(root.querySelector('.qmes-purchase-page-head') && /구매|발주/.test(rootText)) return root;
    return null;
  }

  function cleanupOutsidePurchase(){
    const activeRoot = purchaseRoot();

    // Remove any stale dashboard injection made by the previous broad selector.
    document.querySelectorAll('.qmes-purchase-capture-host').forEach(node => {
      if(!activeRoot || !activeRoot.contains(node)) node.remove();
    });
    document.querySelectorAll('.qmes-purchase-erp-tabs').forEach(node => {
      if(!activeRoot || !activeRoot.contains(node)) node.remove();
    });

    document.querySelectorAll('.qmes-purchase-capture-mode,.qmes-purchase-erp').forEach(node => {
      if(!activeRoot || node !== activeRoot){
        node.classList.remove('qmes-purchase-capture-mode','qmes-purchase-erp');
      }
    });

    // Remove only the custom styles from the faulty purchase overlay patch.
    if(!activeRoot){
      document.getElementById('qmes-purchase-capture-style-20260915-v3')?.remove();
    }
  }

  function navigateToIqc(button){
    const detail = {
      purchaseNo: clean(button.dataset.purchaseNo),
      orderDate: clean(button.dataset.orderDate),
      item: clean(button.dataset.item),
      supplier: clean(button.dataset.supplier)
    };

    try{
      sessionStorage.setItem('qmes_purchase_iqc_pending','1');
      sessionStorage.setItem('qmes_purchase_iqc_context',JSON.stringify(detail));
      sessionStorage.setItem('qmes_current_tab','iqc');
    }catch(_error){}

    window.dispatchEvent(new CustomEvent('qmes:navigate-tab',{
      detail:{tab:'iqc',openMenu:'qualityMenu',source:'purchase-overview',purchase:detail}
    }));

    requestAnimationFrame(()=>{
      try{ window.qmesSetGlobalSidebarGroup?.('품질검사'); }catch(_error){}
    });
  }

  document.addEventListener('click',event=>{
    const target = event.target instanceof Element ? event.target : null;
    if(!target) return;

    const link = target.closest('.qpc-date-link[data-purchase-no]');
    if(link && purchaseRoot()){
      event.preventDefault();
      event.stopPropagation();
      navigateToIqc(link);
      return;
    }

    if(target.closest('#qmes-erp-sidebar')){
      setTimeout(cleanupOutsidePurchase,0);
      setTimeout(cleanupOutsidePurchase,120);
    }
  },true);

  window.addEventListener('qmes:navigate-tab',()=>{
    setTimeout(cleanupOutsidePurchase,0);
    setTimeout(cleanupOutsidePurchase,120);
  });

  function start(){
    cleanupOutsidePurchase();
    setTimeout(cleanupOutsidePurchase,120);
    setTimeout(cleanupOutsidePurchase,600);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
