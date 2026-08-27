/* Sales edit bootstrap V13 — safe customer PO hide, no DOM column deletion. */
(function(){
  "use strict";
  if(window.__QMES_SALES_EDIT_BOOTSTRAP_V13__)return;
  window.__QMES_SALES_EDIT_BOOTSTRAP_V13__=true;
  window.__QMES_SALES_COMPACT_UI_20260826__=true;
  window.__QMES_SALES_FULL_EDIT_20260827__=true;

  if(typeof window.qmesSyncList==="function"&&!window.__QMES_SALES_SYNC_FILTER_V13__){
    window.__QMES_SALES_SYNC_FILTER_V13__=true;
    const originalList=window.qmesSyncList.bind(window);
    window.qmesSyncList=async function(type){
      const records=await originalList(type);
      if(String(type||"")!=="inventory"||!Array.isArray(records))return records;
      return records.filter(row=>String(row?.record_key||"")!=="erp:sales");
    };
  }

  const script=document.createElement("script");
  script.id="qmes-sales-edit-v13-script";
  script.src="./js/qmes-sales-edit-v13-20260827.js?v=20260827-v13-1";
  script.async=false;
  script.onerror=()=>console.error("[QMES Sales] V13 edit controller load failed");
  document.head.appendChild(script);
})();
