/* QMES inventory shared-data sync - 2026-08-07
 * Keeps the inventory screen current even when IQC / work-order tabs were not opened first.
 */
(function installInventorySharedSync(global){
  "use strict";
  if(global.__QMES_INVENTORY_SHARED_SYNC_20260807__) return;
  global.__QMES_INVENTORY_SHARED_SYNC_20260807__=true;

  let running=false;
  let lastRun=0;

  function emit(){
    try{global.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{source:"inventory-shared-sync"}}));}catch(_error){}
    try{document.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{source:"inventory-shared-sync"}}));}catch(_error){}
  }

  async function sync(force){
    const now=Date.now();
    if(running) return;
    if(!force && now-lastRun<4000) return;
    if(typeof global.qmesSyncPullInspection!=="function" && typeof global.qmesSyncPullWorkOrders!=="function") return;
    running=true;
    try{
      if(typeof global.qmesSyncPullInspection==="function"){
        const local=Array.isArray(global.DB?.iqc)?global.DB.iqc:[];
        const rows=await global.qmesSyncPullInspection("iqc",local);
        if(global.DB && Array.isArray(rows)) global.DB.iqc=rows;
      }
      if(typeof global.qmesSyncPullWorkOrders==="function") await global.qmesSyncPullWorkOrders();
      try{if(typeof global.dbSave==="function") global.dbSave();}catch(_error){}
      lastRun=Date.now();
      emit();
      console.info("[QMES] 재고 공용 IQC/작업지시 동기화 완료",{
        iqc:Array.isArray(global.DB?.iqc)?global.DB.iqc.length:0,
        workOrders:global.DB?.woDocs?Object.keys(global.DB.woDocs).length:0
      });
    }catch(error){
      console.warn("[QMES] 재고 공용 데이터 동기화 실패",error?.message||error);
    }finally{
      running=false;
    }
  }

  global.qmesSyncInventorySourceData=()=>sync(true);
  global.addEventListener("focus",()=>sync(false));
  global.addEventListener("qmes:inventory-stage3-ready",()=>sync(true));
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>sync(true),{once:true});
  else setTimeout(()=>sync(true),0);
})(window);
