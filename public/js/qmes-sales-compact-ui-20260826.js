/* Sales V16 bootstrap — stable edit modal and visible sales-number sync. */
(function(){
  "use strict";
  if(window.__QMES_SALES_BOOTSTRAP_V16__)return;
  window.__QMES_SALES_BOOTSTRAP_V16__=true;
  window.__QMES_SALES_COMPACT_UI_20260826__=true;
  window.__QMES_SALES_FULL_EDIT_20260827__=true;
  const script=document.createElement('script');
  script.id='qmes-sales-v16-script';
  script.src='./js/qmes-sales-edit-v16-20260827.js?v=20260827-v16-1';
  script.async=false;
  script.onerror=()=>console.error('[QMES Sales] V16 load failed');
  document.head.appendChild(script);
})();
