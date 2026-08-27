/* Sales edit bootstrap only — previous DOM patch deleted 2026-08-27. */
(function(){
  "use strict";
  if(window.__QMES_SALES_EDIT_BOOTSTRAP_V10__)return;
  window.__QMES_SALES_EDIT_BOOTSTRAP_V10__=true;
  window.__QMES_SALES_COMPACT_UI_20260826__=true;
  window.__QMES_SALES_FULL_EDIT_20260827__=true;

  /* Derived Sales rows come from Work Orders. Ignore stale shared erp:sales snapshots
     so they cannot overwrite the freshly derived local row after a page reload. */
  if(typeof window.qmesSyncList==="function"&&!window.__QMES_SALES_SYNC_FILTER_V10__){
    window.__QMES_SALES_SYNC_FILTER_V10__=true;
    const originalList=window.qmesSyncList.bind(window);
    window.qmesSyncList=async function(type){
      const records=await originalList(type);
      if(String(type||"")!=="inventory"||!Array.isArray(records))return records;
      return records.filter(row=>String(row?.record_key||"")!=="erp:sales");
    };
  }

  if(document.getElementById("qmes-sales-edit-v10-script"))return;
  const script=document.createElement("script");
  script.id="qmes-sales-edit-v10-script";
  script.src="./js/qmes-sales-edit-v10-20260827.js?v=20260827-v10-1";
  script.async=false;
  document.head.appendChild(script);
})();
