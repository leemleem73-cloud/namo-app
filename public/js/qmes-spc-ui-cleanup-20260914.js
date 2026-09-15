/* NAMO QMES - SPC UI cleanup (safe additive patch)
 * - Hide only the duplicate WORKSPACE > SPC 대시보드 menu item.
 * - Keep MES · QMS > SPC (Cpk).
 * - Force the selected SPC item label/spec to black for readability.
 * - Does not modify QMES data or storage.
 */
(function(){
  'use strict';
  if(window.__QMES_SPC_UI_CLEANUP_20260914__) return;
  window.__QMES_SPC_UI_CLEANUP_20260914__=true;

  const SPC_LABELS=new Set(['입도','점도','고형분','접착력','수분율','절연저항','전해액 팽윤성']);
  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();

  function removeDuplicateWorkspaceSpc(){
    document.querySelectorAll('#qmes-erp-sidebar .qmes-erp-item').forEach(button=>{
      const label=clean(button.querySelector('.qmes-erp-text')?.textContent||button.textContent);
      if(label==='SPC 대시보드') button.remove();
    });
  }

  function spcSelectorButtons(){
    return Array.from(document.querySelectorAll('#root main button')).filter(button=>{
      const strong=button.querySelector(':scope > strong');
      return strong&&SPC_LABELS.has(clean(strong.textContent));
    });
  }

  function setSelectedSpcTextBlack(){
    spcSelectorButtons().forEach(button=>{
      const selected=button.classList.contains('border-sky-400');
      const nodes=[button,...button.querySelectorAll('strong,small,span')];
      nodes.forEach(node=>{
        if(selected){
          node.style.setProperty('color','#111827','important');
          node.style.setProperty('-webkit-text-fill-color','#111827','important');
          node.dataset.qmesSpcSelectedBlack='1';
        }else if(node.dataset.qmesSpcSelectedBlack==='1'){
          node.style.removeProperty('color');
          node.style.removeProperty('-webkit-text-fill-color');
          delete node.dataset.qmesSpcSelectedBlack;
        }
      });
    });
  }

  let scheduled=false;
  function apply(){
    scheduled=false;
    removeDuplicateWorkspaceSpc();
    setSelectedSpcTextBlack();
  }
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      apply();
      setTimeout(apply,40);
    });
  }

  document.addEventListener('click',event=>{
    if(event.target.closest('button')) schedule();
  },true);
  window.addEventListener('qmes:navigate-tab',schedule);

  const startObserver=()=>{
    if(!document.body) return;
    const observer=new MutationObserver(schedule);
    observer.observe(document.body,{childList:true,subtree:true});
    schedule();
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',startObserver,{once:true});
  else startObserver();
})();

/* Load unified field input redesign for IQC/PQC/OQC. */
(function(){
  'use strict';
  const marker='qmes-field-mode-unify-loader-20260915';
  if(document.querySelector(`script[data-qmes-loader="${marker}"]`)) return;
  const script=document.createElement('script');
  script.src='./js/qmes-field-mode-unify-20260915.js?v=20260915-2';
  script.async=false;
  script.dataset.qmesLoader=marker;
  document.head.appendChild(script);
})();

/* Load PQC/OQC inspection item tab alignment fix. */
(function(){
  'use strict';
  const marker='qmes-pqc-oqc-item-tabs-fix-loader-20260915';
  if(document.querySelector(`script[data-qmes-loader="${marker}"]`)) return;
  const script=document.createElement('script');
  script.src='./js/qmes-pqc-oqc-item-tabs-fix-20260915.js?v=20260915-1';
  script.async=false;
  script.dataset.qmesLoader=marker;
  document.head.appendChild(script);
})();

/* Remove duplicate inspector label in IQC/PQC/OQC field headers. */
(function(){
  'use strict';
  const marker='qmes-inspector-label-fix-loader-20260915';
  if(document.querySelector(`script[data-qmes-loader="${marker}"]`)) return;
  const script=document.createElement('script');
  script.src='./js/qmes-inspector-label-fix-20260915.js?v=20260915-2';
  script.async=false;
  script.dataset.qmesLoader=marker;
  document.head.appendChild(script);
})();

/* Restore IQC item labels and prevent number/status overlap. */
(function(){
  'use strict';
  const marker='qmes-iqc-item-tabs-fix-loader-20260915';
  if(document.querySelector(`script[data-qmes-loader="${marker}"]`)) return;
  const script=document.createElement('script');
  script.src='./js/qmes-iqc-item-tabs-fix-20260915.js?v=20260915-1';
  script.async=false;
  script.dataset.qmesLoader=marker;
  document.head.appendChild(script);
})();

/* Prevent IQC raw-material input clicks from opening the native date picker. */
(function(){
  'use strict';
  const marker='qmes-iqc-material-date-click-fix-loader-20260915';
  if(document.querySelector(`script[data-qmes-loader="${marker}"]`)) return;
  const script=document.createElement('script');
  script.src='./js/qmes-iqc-material-date-click-fix-20260915.js?v=20260915-1';
  script.async=false;
  script.dataset.qmesLoader=marker;
  document.head.appendChild(script);
})();

/* Normalize quantity input text size across IQC/OQC. */
(function(){
  'use strict';
  const marker='qmes-field-quantity-font-fix-loader-20260915';
  if(document.querySelector(`script[data-qmes-loader="${marker}"]`)) return;
  const script=document.createElement('script');
  script.src='./js/qmes-field-quantity-font-fix-20260915.js?v=20260915-1';
  script.async=false;
  script.dataset.qmesLoader=marker;
  document.head.appendChild(script);
})();
