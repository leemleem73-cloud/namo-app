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
