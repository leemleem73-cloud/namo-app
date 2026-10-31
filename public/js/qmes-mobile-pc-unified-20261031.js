/* Progressive enhancement for the existing PC QMES screen on mobile.
   No menu or API replacement; retains the existing authentication and data flow. */
(function(){
  'use strict';
  if (!window.matchMedia || !window.matchMedia('(max-width: 768px)').matches) return;
  function setupMenu(){
    if(document.getElementById('qmes-mobile-menu-toggle'))return;
    var sidebar=document.querySelector('.sidebar');
    if(!sidebar)return;
    var toggle=document.createElement('button');
    toggle.id='qmes-mobile-menu-toggle';toggle.type='button';
    toggle.textContent='☰';toggle.setAttribute('aria-label','전체 메뉴 열기');
    toggle.setAttribute('aria-expanded','false');
    var backdrop=document.createElement('div');
    backdrop.id='qmes-mobile-backdrop';backdrop.setAttribute('aria-hidden','true');
    document.body.appendChild(backdrop);document.body.appendChild(toggle);
    function setOpen(open){
      document.documentElement.classList.toggle('qmes-mobile-menu-open',open);
      toggle.textContent=open?'×':'☰';
      toggle.setAttribute('aria-expanded',String(open));
      toggle.setAttribute('aria-label',open?'전체 메뉴 닫기':'전체 메뉴 열기');
    }
    toggle.addEventListener('click',function(){setOpen(!document.documentElement.classList.contains('qmes-mobile-menu-open'));});
    backdrop.addEventListener('click',function(){setOpen(false);});
    sidebar.addEventListener('click',function(event){
      if(event.target.closest('a,[role="menuitem"],.menu'))setOpen(false);
    });
    document.addEventListener('keydown',function(event){if(event.key==='Escape')setOpen(false);});
  }
  function enhance(){
    setupMenu();
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
