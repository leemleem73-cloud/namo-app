/* Sales V15 bootstrap — persistent visible sales number */
(function(){
  "use strict";
  if(window.__QMES_SALES_BOOTSTRAP_V15__)return;
  window.__QMES_SALES_BOOTSTRAP_V15__=true;
  window.__QMES_SALES_COMPACT_UI_20260826__=true;
  window.__QMES_SALES_FULL_EDIT_20260827__=true;
  const script=document.createElement('script');
  script.id='qmes-sales-v15-script';
  script.src='./js/qmes-sales-edit-v15-20260827.js?v=20260827-v15-1';
  script.async=false;
  script.onerror=()=>console.error('[QMES Sales] V15 load failed');
  document.head.appendChild(script);
})();