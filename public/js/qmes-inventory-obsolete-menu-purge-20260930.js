(function(){
  'use strict';
  if(window.__QMES_INVENTORY_OBSOLETE_MENU_PURGE_20260930__)return;
  window.__QMES_INVENTORY_OBSOLETE_MENU_PURGE_20260930__=true;

  const removed=new Set(['입출고 관리','LOT별 재고','재고실사']);
  const clean=value=>String(value||'').replace(/[›〉▣]/g,'').replace(/\s+/g,' ').trim();

  function purge(root=document){
    const selectors=[
      '#qmes-erp-sidebar .qmes-erp-item',
      '#qmes-sync-sidebar button',
      '#qmes-sync-sidebar a',
      'aside nav button',
      'aside nav a'
    ];
    root.querySelectorAll(selectors.join(',')).forEach(node=>{
      const label=clean(node.querySelector?.('.qmes-erp-text')?.textContent||node.textContent);
      if(removed.has(label))node.remove();
    });

    try{
      const section=sessionStorage.getItem('qmes_inventory_section');
      if(['movement','lot','count'].includes(section||'')){
        sessionStorage.setItem('qmes_inventory_section','overview');
      }
      const active=clean(sessionStorage.getItem('qmes_erp_active_label'));
      if(removed.has(active))sessionStorage.setItem('qmes_erp_active_label','재고현황');
    }catch(_error){}
  }

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target.closest('button,a'):null;
    if(!target)return;
    const label=clean(target.querySelector?.('.qmes-erp-text')?.textContent||target.textContent);
    if(!removed.has(label))return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    target.remove();
    try{
      sessionStorage.setItem('qmes_inventory_section','overview');
      sessionStorage.setItem('qmes_erp_active_label','재고현황');
    }catch(_error){}
  },true);

  purge();
  const observer=new MutationObserver(()=>purge());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',()=>purge());
  window.addEventListener('focus',()=>purge());
  setInterval(purge,500);
})();