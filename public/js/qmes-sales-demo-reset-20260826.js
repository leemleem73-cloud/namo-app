/* NAMO QMES — one-time sales demo reset 2026-08-26
 * Clears the current sample Sales/Delivery rows once, before the ERP React module
 * reads local/shared data. New real orders created after this reset are preserved.
 */
(function(){
  "use strict";
  const MARKER="qmes-sales-demo-reset-20260826-v1";
  const LOCAL_KEY="qmes-erp-sales-v1";
  const SYNC_TYPE="inventory";
  const RECORD_KEY="erp:sales";

  try{
    if(localStorage.getItem(MARKER)==="done") return;
  }catch(_error){}

  /* Clear browser-side sample rows synchronously before ERP runtime starts. */
  try{localStorage.setItem(LOCAL_KEY,"[]");}catch(_error){}

  /* During this one-time reset, ensure a stale shared sample cannot repopulate the UI
     while the async DB cleanup is still in flight. */
  const originalList=typeof window.qmesSyncList==="function"?window.qmesSyncList:null;
  if(originalList&&!window.__QMES_SALES_RESET_LIST_WRAPPED__){
    window.__QMES_SALES_RESET_LIST_WRAPPED__=true;
    window.qmesSyncList=async function(type,...args){
      const rows=await originalList.call(this,type,...args);
      if(type!==SYNC_TYPE||!Array.isArray(rows)) return rows;
      return rows.map(row=>{
        if(String(row?.record_key||"")!==RECORD_KEY) return row;
        let payload=row?.payload;
        if(typeof payload==="string"){
          try{payload=JSON.parse(payload);}catch(_error){payload={};}
        }
        return {...row,payload:{...(payload&&typeof payload==="object"?payload:{}),module:"erp",schema:1,kind:"sales",rows:[]}};
      });
    };
  }

  function currentUserName(){
    const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    return String(user?.name||user?.uid||user||"").trim();
  }

  async function commitReset(){
    if(typeof window.qmesSyncUpsert!=="function") return false;
    try{
      await window.qmesSyncUpsert(SYNC_TYPE,RECORD_KEY,{
        module:"erp",
        schema:1,
        kind:"sales",
        rows:[],
        updatedAt:new Date().toISOString(),
        updatedBy:currentUserName(),
        resetReason:"sample sales data initialized"
      });
      try{localStorage.setItem(MARKER,"done");}catch(_error){}
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",reset:true}}));
      return true;
    }catch(error){
      console.warn("[QMES] sample sales reset retry",error);
      return false;
    }
  }

  let attempts=0;
  const retry=async()=>{
    attempts+=1;
    if(await commitReset()) return;
    if(attempts<20) window.setTimeout(retry,250);
  };
  retry();
})();
