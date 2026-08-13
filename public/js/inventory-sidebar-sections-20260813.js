/* QMES inventory left-sidebar sections — safe additive patch */
(function(){
  'use strict';
  if(window.__QMES_INVENTORY_SIDEBAR_SECTIONS_20260813__) return;
  window.__QMES_INVENTORY_SIDEBAR_SECTIONS_20260813__=true;

  const items=[
    {key:'raw',label:'원재료·부자재 재고'},
    {key:'fg',label:'완제품 재고 현황'},
    {key:'ship',label:'완제품 출고관리'},
    {key:'history',label:'완제품 출고내역'}
  ];
  let active='raw';

  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  const side=()=>document.getElementById('qmes-sync-sidebar');
  const isInventory=()=>clean(side()?.querySelector('.qmes-side-title')?.textContent)==='재고관리';

  function dispatchView(key){
    active=key;
    window.dispatchEvent(new CustomEvent('qmes:inventory-view',{detail:{view:key}}));
  }

  function install(){
    const s=side();
    if(!s||!isInventory()) return;
    const wrap=s.querySelector('.qmes-side-items');
    if(!wrap) return;

    const original=Array.from(wrap.children).find(el=>clean(el.textContent)==='원재료 재고');
    if(original) original.remove();

    items.forEach((item,index)=>{
      let button=wrap.querySelector(`[data-inventory-view="${item.key}"]`);
      if(!button){
        button=document.createElement('button');
        button.type='button';
        button.className='qmes-side-item';
        button.dataset.inventoryView=item.key;
        button.dataset.group='__inventory_patch__';
        button.dataset.index=String(index);
        button.textContent=item.label;
        wrap.appendChild(button);
      }
      button.classList.toggle('is-active',active===item.key);
    });
  }

  document.addEventListener('click',function(event){
    const button=event.target.closest?.('[data-inventory-view]');
    if(!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const key=button.dataset.inventoryView;
    if(!items.some(item=>item.key===key)) return;
    dispatchView(key);
    install();
  },true);

  document.addEventListener('click',function(event){
    const top=event.target.closest?.('.qmes-top-menu-button');
    if(top&&clean(top.textContent).includes('재고관리')){
      active='raw';
      setTimeout(install,0);
      setTimeout(install,80);
      setTimeout(install,220);
    }
  },true);

  const observer=new MutationObserver(()=>install());
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener('load',install);
  setTimeout(install,300);
})();
