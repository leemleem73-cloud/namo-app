/* One-time cleanup: remove duplicate/manual sales order SO-260826-01 only. */
(function(){
  "use strict";
  const TARGET="SO-260826-01";
  const DONE="qmes-cleanup-so-260826-01-v1";
  const KEY="qmes-erp-sales-v1";
  if(localStorage.getItem(DONE)==="1") return;

  function readRows(){
    try{const rows=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(rows)?rows:[];}catch(_error){return [];}
  }
  function writeRows(rows){try{localStorage.setItem(KEY,JSON.stringify(rows));}catch(_error){}}
  async function run(){
    const rows=readRows();
    const next=rows.filter(row=>String(row?.id||"").trim()!==TARGET);
    if(next.length!==rows.length){
      writeRows(next);
      try{
        if(typeof window.qmesSyncUpsert==="function"){
          const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
          await window.qmesSyncUpsert("inventory","erp:sales",{
            module:"erp",schema:2,kind:"sales",rows:next,source:"ONE_TIME_CLEANUP",
            updatedAt:new Date().toISOString(),updatedBy:String(user?.name||user?.uid||user||"").trim()
          });
        }
      }catch(error){console.warn("[QMES] duplicate sales cleanup shared sync failed",error);}
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",source:"ONE_TIME_CLEANUP",id:TARGET}}));
    }
    localStorage.setItem(DONE,"1");
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(run,300),{once:true});
  else setTimeout(run,300);
})();
