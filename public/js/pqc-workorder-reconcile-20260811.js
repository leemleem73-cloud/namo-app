/* QMES: ensure one PQC draft exists for every issued work order and align list order. */
(function reconcileWorkOrderPqc(global){
  "use strict";
  if(global.__QMES_PQC_WO_RECONCILE_20260811_V2__) return;
  global.__QMES_PQC_WO_RECONCILE_20260811_V2__=true;

  async function reconcile(){
    if(typeof DB === "undefined" || !DB.woDocs || !DB.insp) return;
    DB.insp.PQC = Array.isArray(DB.insp.PQC) ? DB.insp.PQC : [];
    const lotNos = Object.keys(DB.woDocs || {}).filter(Boolean);
    let changed = false;

    for(const lotNo of lotNos){
      const exists = DB.insp.PQC.some((row)=>String(row.lot||"").trim()===String(lotNo).trim());
      if(exists) continue;

      let created = null;
      if(typeof qmesCreatePqcDraftForIssuedWorkOrder === "function") {
        created = qmesCreatePqcDraftForIssuedWorkOrder(lotNo);
      }
      if(!created) continue;
      changed = true;

      try {
        if(typeof qmesSyncUpsert === "function") {
          await qmesSyncUpsert(created.type, created.key, created.payload);
          created.rows.forEach((row)=>{ row.sharedSync = true; });
        }
      } catch(error) {
        console.warn("작업지시 공정검사 자동 보정 공용 DB 동기화 실패:", lotNo, error.message);
      }
    }

    if(changed && typeof dbSave === "function") {
      dbSave();
      global.dispatchEvent(new Event("qmes-pqc-reconciled"));
      console.info("[QMES] 작업지시별 공정검사 성적서 누락 보정 완료");
    }
  }

  function alignPqcList(){
    if(typeof DB === "undefined" || !Array.isArray(DB.batches)) return;
    const table=document.querySelector('.qmes-pqc-page .qmes-pqc-record-table');
    const tbody=table?.querySelector('tbody');
    if(!tbody) return;

    const order=new Map(DB.batches.map((row,index)=>[String(row.no||'').trim(),index]));
    const rows=Array.from(tbody.querySelectorAll(':scope > tr')).filter((tr)=>tr.querySelectorAll('td').length>=3);
    if(rows.length<2) return;

    const lotOf=(tr)=>String(tr.querySelectorAll('td')[2]?.textContent||'').trim();
    const sorted=[...rows].sort((a,b)=>{
      const ai=order.has(lotOf(a))?order.get(lotOf(a)):Number.MAX_SAFE_INTEGER;
      const bi=order.has(lotOf(b))?order.get(lotOf(b)):Number.MAX_SAFE_INTEGER;
      return ai-bi;
    });
    const current=rows.map(lotOf).join('|');
    const target=sorted.map(lotOf).join('|');
    if(current===target) return;
    const frag=document.createDocumentFragment();
    sorted.forEach((tr)=>frag.appendChild(tr));
    tbody.appendChild(frag);
  }

  let alignTimer=null;
  function scheduleAlign(){
    clearTimeout(alignTimer);
    alignTimer=setTimeout(alignPqcList,80);
  }

  function schedule(){
    setTimeout(()=>{
      reconcile()
        .then(()=>scheduleAlign())
        .catch((e)=>console.warn("PQC 자동 보정 실패:",e));
    },300);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
  global.addEventListener("focus",schedule);
  global.addEventListener("qmes-pqc-reconciled",scheduleAlign);
  new MutationObserver(scheduleAlign).observe(document.documentElement,{childList:true,subtree:true});
})(window);
