/* Inventory menu bridge v3: recover inventory menu mounting and keep stock count, 2026-08-21. */
(function(){
  let root=null,host=null,current='overview';
  const sections=[['overview','재고현황'],['movement','입출고 관리'],['lot','LOT별 재고'],['production','생산투입/완료'],['count','재고실사']];
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  function restore(){if(root){try{root.unmount();}catch(e){}root=null;}host?.remove();host=null;const main=document.querySelector('#root>div>main');if(main)Array.from(main.children).forEach(el=>{if(el.dataset.invHidden==='1'){el.style.removeProperty('display');delete el.dataset.invHidden;}});}
  function decorateSidebar(){const side=document.getElementById('qmes-sync-sidebar');if(!side)return;const title=side.querySelector('.qmes-side-title'),wrap=side.querySelector('.qmes-side-items');if(title)title.textContent='재고관리';if(!wrap)return;wrap.replaceChildren();sections.forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.className='qmes-side-item'+(current===id?' is-active':'');b.textContent=label;b.addEventListener('click',event=>{event.stopPropagation();open(id);});wrap.appendChild(b);});}
  function inventoryComponent(){
    if(typeof window.InventoryEnterpriseTab==='function')return window.InventoryEnterpriseTab;
    try{if(typeof InventoryEnterpriseTab==='function')return InventoryEnterpriseTab;}catch(e){}
    return null;
  }
  function open(section='overview'){
    current=sections.some(s=>s[0]===section)?section:'overview';
    const main=document.querySelector('#root>div>main');
    const Component=inventoryComponent();
    if(!main||!Component){console.error('[QMES inventory] InventoryEnterpriseTab is not ready.');return;}
    Array.from(main.children).forEach(el=>{if(el!==host){el.dataset.invHidden='1';el.style.setProperty('display','none','important');}});
    if(!host){host=document.createElement('div');host.id='qmes-inventory-host';main.appendChild(host);}
    if(root)root.unmount();root=ReactDOM.createRoot(host);root.render(React.createElement(Component,{section:current}));
    document.querySelectorAll('.qmes-top-menu-button').forEach(b=>b.classList.toggle('is-active',clean(b.textContent)==='재고관리'));
    try{sessionStorage.setItem('qmes_inventory_section',current);}catch(e){}
    if(typeof window.qmesSetGlobalSidebarGroup==='function')window.qmesSetGlobalSidebarGroup('재고관리');setTimeout(decorateSidebar,20);setTimeout(decorateSidebar,180);
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
