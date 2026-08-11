/* QMES: keep work orders and PQC records in production/inspection date order without post-render reordering. */
(function reconcileWorkOrderPqc(global){
  "use strict";
  if(global.__QMES_PQC_WO_RECONCILE_20260811_V6__) return;
  global.__QMES_PQC_WO_RECONCILE_20260811_V6__=true;

  function sortRowsByDate(rows,dateGetter,idGetter){
    if(!Array.isArray(rows)) return rows;
    return rows.map((row,index)=>({row,index})).sort((a,b)=>{
      const ad=String(dateGetter(a.row)||"").slice(0,10);
      const bd=String(dateGetter(b.row)||"").slice(0,10);
      if(ad!==bd) return ad.localeCompare(bd);
      const ai=String(idGetter(a.row)||"");
      const bi=String(idGetter(b.row)||"");
      if(ai!==bi) return ai.localeCompare(bi);
      return a.index-b.index;
    }).map((entry)=>entry.row);
  }

  function sortWorkOrdersNow(){
    if(typeof DB === "undefined" || !Array.isArray(DB.batches)) return false;
    const sorted=sortRowsByDate(DB.batches,(row)=>row?.due,(row)=>row?.no);
    const before=DB.batches.map((row)=>String(row.no||"")).join("|");
    const after=sorted.map((row)=>String(row.no||"")).join("|");
    if(before===after) return false;
    DB.batches=sorted;
    return true;
  }

  function sortPqcNow(){
    if(typeof DB === "undefined" || !DB.insp || !Array.isArray(DB.insp.PQC)) return false;
    const sorted=sortRowsByDate(DB.insp.PQC,(row)=>row?.date||row?.shipDate,(row)=>row?.groupId||row?.id);
    const before=DB.insp.PQC.map((row)=>String(row.id||row.groupId||"")).join("|");
    const after=sorted.map((row)=>String(row.id||row.groupId||"")).join("|");
    if(before===after) return false;
    DB.insp.PQC=sorted;
    return true;
  }

  function sortAllNow(){
    const workChanged=sortWorkOrdersNow();
    const pqcChanged=sortPqcNow();
    return workChanged||pqcChanged;
  }

  // React 앱이 마운트되기 전에 현재 메모리 데이터를 먼저 정렬한다.
  try{ sortAllNow(); }catch(error){ console.warn("초기 날짜 정렬 실패:",error); }

  // 공용 DB 동기화가 끝난 직후에도 정렬된 배열을 반환해 화면이 다시 뒤집히지 않게 한다.
  if(typeof global.qmesSyncPullWorkOrders==="function" && !global.qmesSyncPullWorkOrders.__qmesDateSorted){
    const originalWorkOrderPull=global.qmesSyncPullWorkOrders;
    const wrapped=async function(){
      const result=await originalWorkOrderPull.apply(this,arguments);
      sortWorkOrdersNow();
      return result;
    };
    wrapped.__qmesDateSorted=true;
    global.qmesSyncPullWorkOrders=wrapped;
  }

  if(typeof global.qmesSyncPullInspection==="function" && !global.qmesSyncPullInspection.__qmesDateSorted){
    const originalInspectionPull=global.qmesSyncPullInspection;
    const wrapped=async function(type,localRows){
      const rows=await originalInspectionPull.apply(this,arguments);
      if(String(type||"").toLowerCase()!=="pqc") return rows;
      return sortRowsByDate(rows,(row)=>row?.date||row?.shipDate,(row)=>row?.groupId||row?.id);
    };
    wrapped.__qmesDateSorted=true;
    global.qmesSyncPullInspection=wrapped;
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

    if(sortAllNow()) changed=true;
    if(changed && typeof dbSave === "function") dbSave();
  }

  function schedule(){ setTimeout(()=>{ reconcile().catch((e)=>console.warn("PQC 자동 보정 실패:",e)); },300); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
  global.addEventListener("focus",schedule);
})(window);
