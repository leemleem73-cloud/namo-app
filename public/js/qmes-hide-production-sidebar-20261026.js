(function(){
'use strict';
if(window.__NAMO_HIDE_PRODUCTION_SIDEBAR_20261026__)return;
window.__NAMO_HIDE_PRODUCTION_SIDEBAR_20261026__=true;

function removeProductionMenu(){
  document.querySelectorAll(
    '#namo-production-final-menu,#namo-production-status-menu,#namo-production-result-menu,'+
    '#sidebar .menu[data-page="namo-production-final-panel"],'+
    '#sidebar .menu[data-page="namo-production-status-panel"]'
  ).forEach(function(el){el.remove();});
}
removeProductionMenu();
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',removeProductionMenu,{once:true});
}
new MutationObserver(removeProductionMenu).observe(document.documentElement,{childList:true,subtree:true});
})();