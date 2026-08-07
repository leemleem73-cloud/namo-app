/* QMES inventory IQC shared-data refresh bridge - 2026-08-07
 * Additive only. Keeps IQC and inventory source files untouched.
 * Pulls shared IQC records into DB.iqc so the existing LOT ledger can use qty/lot/judge.
 */
(function installInventoryIqcSyncRefresh(global){
  "use strict";
  if(global.__QMES_INVENTORY_IQC_SYNC_REFRESH__) return;
  global.__QMES_INVENTORY_IQC_SYNC_REFRESH__=true;

  let running=false;
  let lastRun=0;

  async function refresh(force){
    const now=Date.now();
    if(running || (!force && now-lastRun<3000)) return;
    if(typeof global.qmesSyncPullInspection!=="function" || !global.DB) return;
    running=true;
    try{
      const current=Array.isArray(global.DB.iqc)?global.DB.iqc:[];
      const next=await global.qmesSyncPullInspection("iqc",current);
      if(Array.isArray(next)){
        global.DB.iqc=next;
        if(typeof global.dbSave==="function") global.dbSave();
        global.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{source:"inventory-iqc-sync",count:next.length}}));
        global.dispatchEvent(new CustomEvent("qmes:inventory-iqc-refreshed",{detail:{count:next.length}}));
        console.info(`[QMES] 재고 IQC 공용이력 반영 ${next.length}건`);
      }
      lastRun=Date.now();
    }catch(error){
      console.warn("[QMES] 재고 IQC 공용이력 갱신 실패",error?.message||error);
    }finally{
      running=false;
    }
  }

  global.qmesRefreshInventoryIqc=()=>refresh(true);
  global.addEventListener("focus",()=>refresh(false));
  global.addEventListener("qmes:inventory-stage3-ready",()=>refresh(true));
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>refresh(true),0),{once:true});
  else setTimeout(()=>refresh(true),0);
})(window);
