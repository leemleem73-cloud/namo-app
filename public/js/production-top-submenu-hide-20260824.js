/* Hide duplicate production sub-menu row; left sidebar remains the production navigation. */
(function(){
  "use strict";
  if(window.__QMES_HIDE_PRODUCTION_TOP_SUBMENU_20260824__) return;
  window.__QMES_HIDE_PRODUCTION_TOP_SUBMENU_20260824__=true;
  const style=document.createElement('style');
  style.id='qmes-hide-production-top-submenu-20260824';
  style.textContent=`
    .qmes-submenu-productionMenu{
      display:none!important;
      height:0!important;
      min-height:0!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      overflow:hidden!important;
    }
  `;
  document.head.appendChild(style);
})();
