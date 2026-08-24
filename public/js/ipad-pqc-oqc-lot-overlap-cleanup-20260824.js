/* QMES PQC/OQC production LOT overlap cleanup - 2026-08-24 */
(function(){
  'use strict';
  if(window.__QMES_PQC_OQC_LOT_OVERLAP_CLEANUP__) return;
  window.__QMES_PQC_OQC_LOT_OVERLAP_CLEANUP__=true;

  const clean=v=>String(v==null?'':v).trim();

  function mode(){
    const root=document.querySelector('.qmes-ipad-pop');
    if(!root) return '';
    const active=root.querySelector('.qmes-ipad-mode-tabs button.is-active');
    const text=clean(active?.textContent).toUpperCase();
    if(text.includes('PQC')) return 'PQC';
    if(text.includes('OQC')) return 'OQC';
    const title=clean(root.querySelector('.qmes-ipad-inspection-head h1')?.textContent);
    if(title.includes('공정검사')) return 'PQC';
    if(title.includes('출하검사')) return 'OQC';
    return '';
  }

  function apply(){
    const current=mode();
    if(current!=='PQC' && current!=='OQC') return;
    const grid=document.querySelector('.qmes-ipad-pop .qmes-ipad-section .qmes-ipad-form-grid');
    if(!grid) return;

    const labels=Array.from(grid.querySelectorAll('label')).filter(label=>
      clean(label.querySelector('span')?.textContent).startsWith('생산 LOT')
    );
    if(!labels.length) return;

    const keep=labels.find(label=>label.querySelector('.qmes-production-lot-linked-select')) || labels[0];
    labels.forEach(label=>{ if(label!==keep) label.remove(); });

    keep.classList.add('qmes-production-lot-linked');
    const input=keep.querySelector('input');
    if(input){
      input.setAttribute('type','hidden');
      input.removeAttribute('list');
      input.classList.remove('lot');
      input.style.setProperty('display','none','important');
    }
    keep.querySelectorAll('datalist').forEach(node=>node.remove());

    const selects=Array.from(keep.querySelectorAll('.qmes-production-lot-linked-select'));
    selects.slice(1).forEach(node=>node.remove());
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      apply();
      setTimeout(apply,30);
      setTimeout(apply,120);
    });
  }

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',schedule,true);
  document.addEventListener('change',schedule,true);
  window.addEventListener('focus',schedule);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule,{once:true}); else schedule();
})();
