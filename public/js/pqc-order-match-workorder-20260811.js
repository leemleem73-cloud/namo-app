/* QMES: keep PQC list order aligned with work-order list order. */
(function alignPqcOrderWithWorkOrders(global){
  "use strict";
  if(global.__QMES_PQC_ORDER_MATCH_WO_20260811__) return;
  global.__QMES_PQC_ORDER_MATCH_WO_20260811__=true;

  function apply(){
    if(typeof DB === "undefined" || !Array.isArray(DB.batches)) return;
    const page=document.querySelector('.qmes-pqc-page');
    if(!page) return;
    const table=page.querySelector('.qmes-pqc-record-table');
    const tbody=table?.querySelector('tbody');
    if(!tbody) return;

    const order=new Map(DB.batches.map((row,index)=>[String(row.no||'').trim(),index]));
    const rows=Array.from(tbody.querySelectorAll('tr')).filter((tr)=>tr.querySelectorAll('td').length>=3);
    if(rows.length<2) return;

    const lotOf=(tr)=>String(tr.querySelectorAll('td')[2]?.textContent||'').trim();
    const sorted=[...rows].sort((a,b)=>{
      const ai=order.has(lotOf(a))?order.get(lotOf(a)):Number.MAX_SAFE_INTEGER;
      const bi=order.has(lotOf(b))?order.get(lotOf(b)):Number.MAX_SAFE_INTEGER;
      return ai-bi;
    });
    sorted.forEach((tr)=>tbody.appendChild(tr));
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    global.requestAnimationFrame(()=>{queued=false;apply();});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  global.addEventListener('qmes-pqc-reconciled',schedule);
})(window);
