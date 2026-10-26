(function(){
'use strict';
if(window.__NAMO_PRODUCTION_STATUS_MENU_GUARD_20261026__)return;
window.__NAMO_PRODUCTION_STATUS_MENU_GUARD_20261026__=true;

function ensure(){
  var panel=document.getElementById('namo-production-final-panel');
  var menu=document.getElementById('namo-production-final-menu');
  var work=document.querySelector('#sidebar .menu[data-page="work"]');
  if(!panel||!work)return;
  if(!menu){
    menu=document.createElement('div');
    menu.id='namo-production-final-menu';
    menu.className='menu';
    menu.dataset.page='namo-production-final-panel';
    menu.innerHTML='<div class="ico">📊</div><div class="label">생산현황</div>';
    work.insertAdjacentElement('beforebegin',menu);
    menu.addEventListener('click',function(e){
      e.stopPropagation();
      document.querySelectorAll('.menu').forEach(function(x){x.classList.remove('active');});
      document.querySelectorAll('.module-page').forEach(function(x){x.classList.remove('active');});
      panel.classList.add('active');
      menu.classList.add('active');
    });
  }
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){ensure();setTimeout(ensure,300);setTimeout(ensure,1000);});
}else{
  ensure();setTimeout(ensure,300);setTimeout(ensure,1000);
}
new MutationObserver(function(){ensure();}).observe(document.documentElement,{childList:true,subtree:true});
})();