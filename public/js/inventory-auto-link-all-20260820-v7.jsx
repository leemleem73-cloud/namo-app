/* Compatibility loader: inventory auto-link v8, 2026-08-21 */
(function(){
  'use strict';
  if(window.__QMES_INV_AUTO_LINK_V8_LOADER__)return;
  window.__QMES_INV_AUTO_LINK_V8_LOADER__=true;
  const script=document.createElement('script');
  script.src='./js/inventory-auto-link-all-20260821-v8.jsx?v=20260821-1';
  script.type='text/babel';
  script.setAttribute('data-presets','react');
  script.onerror=()=>console.error('[QMES inventory] auto-link v8 로드 실패');
  document.head.appendChild(script);
})();