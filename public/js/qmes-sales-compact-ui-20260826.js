/* Sales V17 bootstrap — reliable edit-button controller. */
(function(){
  "use strict";
  if(window.__QMES_SALES_BOOTSTRAP_V17__)return;
  window.__QMES_SALES_BOOTSTRAP_V17__=true;
  window.__QMES_SALES_COMPACT_UI_20260826__=true;
  window.__QMES_SALES_FULL_EDIT_20260827__=true;
  const script=document.createElement('script');
  script.id='qmes-sales-v17-script';
  script.src='./js/qmes-sales-edit-v17-20260827.js?v=20260827-v17-1';
  script.async=false;
  script.onerror=()=>console.error('[QMES Sales] V17 load failed');
  document.head.appendChild(script);
})();