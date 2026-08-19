/* QMES inventory auto-link compatibility loader - 2026-08-19
 * Legacy entry point retained. Loads full automatic inventory integration v2.
 */
(function(){
  'use strict';
  if(window.__QMES_INV_AUTO_LINK_V2_LOADER__) return;
  window.__QMES_INV_AUTO_LINK_V2_LOADER__=true;
  var s=document.createElement('script');
  s.type='text/babel';
  s.setAttribute('data-presets','react');
  s.src='./js/inventory-auto-link-all-20260819-v2.jsx?v=20260819-1605';
  document.body.appendChild(s);
})();
