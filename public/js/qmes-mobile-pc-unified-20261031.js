/* Progressive enhancement for the existing PC QMES screen on mobile.
   No menu or API replacement; retains the existing authentication and data flow. */
(function(){
  'use strict';
  if (!window.matchMedia || !window.matchMedia('(max-width: 768px)').matches) return;
  if(window.__qmesMobileEnhancementStarted)return;
  window.__qmesMobileEnhancementStarted=true;
  function setupMenu(){
    if(document.getElementById('qmes-mobile-menu-toggle'))return;
    var sidebar=document.querySelector('.sidebar');
    if(!sidebar)return;
    var toggle=document.createElement('button');
    toggle.id='qmes-mobile-menu-toggle';toggle.type='button';
    toggle.textContent='☰';toggle.setAttribute('aria-label','전체 메뉴 열기');
    toggle.setAttribute('aria-expanded','false');
    sidebar.id=sidebar.id||'qmes-mobile-navigation';
    toggle.setAttribute('aria-controls',sidebar.id);
    var backdrop=document.createElement('div');
    backdrop.id='qmes-mobile-backdrop';backdrop.setAttribute('aria-hidden','true');
    document.body.appendChild(backdrop);document.body.appendChild(toggle);
    function setOpen(open){
      document.documentElement.classList.toggle('qmes-mobile-menu-open',open);
      toggle.textContent=open?'×':'☰';
      toggle.setAttribute('aria-expanded',String(open));
      toggle.setAttribute('aria-label',open?'전체 메뉴 닫기':'전체 메뉴 열기');
      sidebar.setAttribute('aria-hidden',String(!open));
      if('inert' in sidebar)sidebar.inert=!open;
    }
    setOpen(false);
    toggle.addEventListener('click',function(){setOpen(!document.documentElement.classList.contains('qmes-mobile-menu-open'));});
    backdrop.addEventListener('click',function(){setOpen(false);toggle.focus();});
    sidebar.addEventListener('click',function(event){
      var item=event.target.closest('a[href],button[data-tab],[role="menuitem"],.menu[data-tab],.menu[data-page],.menu[data-target]');
      if(item)setTimeout(function(){setOpen(false);},80);
    });
    document.addEventListener('keydown',function(event){
      if(event.key==='Escape'&&document.documentElement.classList.contains('qmes-mobile-menu-open')){
        setOpen(false);toggle.focus();
      }
    });
  }
  function enhance(){
    setupMenu();
    document.querySelectorAll('.workspace-body table,.module-shell table,.content table').forEach(function(table){
      if(table.closest('.qmes-mobile-table-scroll')) return;
      if(table.closest('[contenteditable="true"],.report-sheet,[data-print-root],.print-area,.report-doc-head,.report-basic,.report-inspection')) return;
      if(table.closest('dialog,[role="dialog"]')) return;
      if(!table.parentNode || table.parentNode.tagName==='TABLE')return;
      if(table.closest('form') || table.hasAttribute('data-no-mobile-wrap'))return;
      if(table.closest('[onclick],[data-reactroot]'))return;
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
  var observer=new MutationObserver(function(records){
    var relevant=records.some(function(record){
      return Array.prototype.some.call(record.addedNodes,function(node){
        return node.nodeType===1 && !node.closest?.('.qmes-mobile-table-scroll') &&
          (node.matches?.('.sidebar,.workspace-body,.module-shell,.content,table') ||
           node.querySelector?.('table,.sidebar'));
      });
    });
    if(!relevant)return;
    clearTimeout(timer);timer=setTimeout(enhance,200);
  });
  observer.observe(document.documentElement,{subtree:true,childList:true});
})();
