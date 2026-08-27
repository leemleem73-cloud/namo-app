/* Sales V14 bootstrap — restore Work Order sales rows, safe PO hide. */
(function(){
  "use strict";
  if(window.__QMES_SALES_BOOTSTRAP_V14__)return;
  window.__QMES_SALES_BOOTSTRAP_V14__=true;
  window.__QMES_SALES_COMPACT_UI_20260826__=true;
  window.__QMES_SALES_FULL_EDIT_20260827__=true;
  const script=document.createElement('script');
  script.id='qmes-sales-v14-script';
  script.src='./js/qmes-sales-edit-v14-20260827.js?v=20260827-v14-1';
  script.async=false;
  script.onerror=()=>console.error('[QMES Sales] V14 load failed');
  document.head.appendChild(script);
})();
