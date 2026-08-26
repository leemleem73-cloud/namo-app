/* OQC field input: basic-information order only. No IQC/PQC or sizing overrides. */
(function(){
  'use strict';
  if(window.__QMES_OQC_BASIC_INFO_ORDER_20260826__) return;
  window.__QMES_OQC_BASIC_INFO_ORDER_20260826__=true;

  function text(label){
    return String(label?.querySelector('span')?.textContent||'').replace(/\s+/g,' ').replace(/\*/g,'').trim();
  }
  function oqcActive(){
    const tabs=document.querySelectorAll('.qmes-ipad-mode-tabs button');
    return !!(tabs[2]&&tabs[2].classList.contains('is-active'));
  }
  function apply(){
    if(!oqcActive()) return;
    const grid=document.querySelector('.qmes-ipad-pop .qmes-ipad-form-grid');
    if(!grid) return;
    const labels=Array.from(grid.querySelectorAll(':scope > label'));
    const by=(name)=>labels.find(label=>text(label)===name);
    const inspectDate=by('검사일자');
    const lot=by('생산 LOT');
    const product=by('제품명');
    const customer=by('고객사');
    const shipQty=by('출하수량 (kg)');
    const shipDate=by('출하일자');
    const destination=by('납품처');
    const remarks=by('비고');
    if(!inspectDate||!lot||!product||!customer||!shipQty||!shipDate||!remarks) return;

    /* OQC first row is three equal fields, so LOT must not span two columns here. */
    lot.classList.remove('wide');
    if(destination) destination.remove();

    [inspectDate,lot,product,customer,shipQty,shipDate,remarks].forEach(node=>grid.appendChild(node));
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply();});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
  new MutationObserver(schedule).observe(document.getElementById('root')||document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();
