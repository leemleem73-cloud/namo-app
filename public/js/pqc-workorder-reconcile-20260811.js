/* QMES: ensure one PQC draft exists for every issued work order and sort by inspection date. */
(function reconcileWorkOrderPqc(global){
  "use strict";
  if(global.__QMES_PQC_WO_RECONCILE_20260811_V5__) return;
  global.__QMES_PQC_WO_RECONCILE_20260811_V5__=true;

  function sortPqcDataByInspectionDate(){
    if(typeof DB === "undefined" || !DB.insp || !Array.isArray(DB.insp.PQC)) return false;
    const rows=DB.insp.PQC.map((row,index)=>({row,index}));
    rows.sort((a,b)=>{
      const ad=String(a.row.date||a.row.shipDate||"").slice(0,10);
      const bd=String(b.row.date||b.row.shipDate||"").slice(0,10);
      if(ad!==bd) return ad.localeCompare(bd);
      const ag=String(a.row.groupId||a.row.id||"");
      const bg=String(b.row.groupId||b.row.id||"");
      if(ag!==bg) return ag.localeCompare(bg);
      return a.index-b.index;
    });
    const sorted=rows.map((entry)=>entry.row);
    const before=DB.insp.PQC.map((row)=>String(row.id||row.groupId||"")).join("|");
    const after=sorted.map((row)=>String(row.id||row.groupId||"")).join("|");
    if(before===after) return false;
    DB.insp.PQC=sorted;
    return true;
  }

  async function reconcile(){
    if(typeof DB === "undefined" || !DB.woDocs || !DB.insp) return;
    DB.insp.PQC = Array.isArray(DB.insp.PQC) ? DB.insp.PQC : [];
    const lotNos = Object.keys(DB.woDocs || {}).filter(Boolean);
    let changed = false;

    for(const lotNo of lotNos){
      const exists = DB.insp.PQC.some((row)=>String(row.lot||"").trim()===String(lotNo).trim());
      if(exists) continue;

      let created = null;
      if(typeof qmesCreatePqcDraftForIssuedWorkOrder === "function") created = qmesCreatePqcDraftForIssuedWorkOrder(lotNo);
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

    if(sortPqcDataByInspectionDate()) changed=true;

    if(changed && typeof dbSave === "function") {
      dbSave();
      global.dispatchEvent(new Event("qmes-pqc-reconciled"));
      console.info("[QMES] 공정검사 성적서 검사일자 순서 보정 완료");
    }
  }

  function schedule(){
    setTimeout(()=>{ reconcile().catch((e)=>console.warn("PQC 자동 보정 실패:",e)); },300);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
  global.addEventListener("focus",schedule);
})(window);
