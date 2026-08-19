/* Inventory menu bridge: adds enterprise inventory to the current QMES shell without rewriting router.jsx. */
(function(){
  let root=null,host=null;
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  function restore(){if(root){try{root.unmount();}catch(e){}root=null;}host?.remove();host=null;const main=document.querySelector('#root>div>main');if(main)Array.from(main.children).forEach(el=>{if(el.dataset.invHidden==='1'){el.style.removeProperty('display');delete el.dataset.invHidden;}});}
  function open(section='overview'){
    const main=document.querySelector('#root>div>main');if(!main||typeof InventoryEnterpriseTab!=='function')return;
    Array.from(main.children).forEach(el=>{if(el!==host){el.dataset.invHidden='1';el.style.setProperty('display','none','important');}});
    if(!host){host=document.createElement('div');host.id='qmes-inventory-host';main.appendChild(host);}
    if(root)root.unmount();root=ReactDOM.createRoot(host);root.render(React.createElement(InventoryEnterpriseTab,{section}));
    document.querySelectorAll('.qmes-top-menu-button').forEach(b=>b.classList.toggle('is-active',clean(b.textContent)==='재고관리'));
    try{sessionStorage.setItem('qmes_inventory_section',section);}catch(e){}
    setTimeout(()=>window.qmesSetGlobalSidebarGroup?.('재고관리'),0);
  }
  function install(){
    const nav=document.querySelector('.qmes-top-menu');if(!nav||nav.querySelector('[data-qmes-inventory-menu]'))return false;
    const item=document.createElement('div');item.className='qmes-top-menu-item';item.dataset.qmesInventoryMenu='1';
    const button=document.createElement('button');button.type='button';button.className='qmes-top-menu-button';button.innerHTML='<span aria-hidden="true" style="font-size:15px">▣</span><span>재고관리</span><span style="font-size:11px">›</span>';
    button.addEventListener('click',()=>{let saved='overview';try{saved=sessionStorage.getItem('qmes_inventory_section')||'overview';}catch(e){}open(saved);});item.appendChild(button);
    const trace=Array.from(nav.children).find(el=>clean(el.textContent).includes('LOT 추적'));if(trace)trace.after(item);else nav.appendChild(item);
    document.addEventListener('click',event=>{const b=event.target.closest('.qmes-top-menu-button');if(b&&b!==button&&!b.closest('[data-qmes-inventory-menu]')&&host)restore();},true);
    window.qmesOpenInventorySection=open;return true;
  }
  const timer=setInterval(()=>{if(install())clearInterval(timer);},250);setTimeout(()=>clearInterval(timer),15000);
})();
