/* Progressive enhancement for the existing PC QMES screen on mobile.
   No menu or API replacement; retains the existing authentication and data flow. */
(function(){
  'use strict';
  if (!window.matchMedia || !window.matchMedia('(max-width: 768px)').matches) return;
  function enhance(){
    document.querySelectorAll('table').forEach(function(table){
      if(table.closest('.qmes-mobile-table-scroll')) return;
      if(table.closest('[contenteditable="true"]')) return;
      var wrapper=document.createElement('div');
      wrapper.className='qmes-mobile-table-scroll';
      wrapper.setAttribute('role','region');
      wrapper.setAttribute('aria-label','표 좌우 스크롤');
      wrapper.tabIndex=0;
      table.parentNode.insertBefore(wrapper,table);
      wrapper.appendChild(table);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',enhance);
  else enhance();
  var timer;
  new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(enhance,150);})
    .observe(document.documentElement,{subtree:true,childList:true});
})();
