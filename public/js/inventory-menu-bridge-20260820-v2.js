/* Inventory menu bridge v5.3: stable menu/sidebar host only. Detail modal stays React-owned. */
(function(){
  'use strict';
  if(window.__QMES_INV_MENU_BRIDGE_V53__)return;
  window.__QMES_INV_MENU_BRIDGE_V53__=true;

  let root=null,host=null,current='overview';
  let restoreScheduled=false;
  const SURFACE_KEY='qmes_current_surface';
  const SECTION_KEY='qmes_inventory_section';
  const sections=[['overview','재고현황'],['movement','입출고 관리'],['lot','LOT별 재고'],['production','생산투입/완료'],['count','재고실사']];
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();

  function setSurface(value){
    try{sessionStorage.setItem(SURFACE_KEY,value);}catch(error){}
  }

  function savedSurface(){
    try{
      const saved=sessionStorage.getItem(SURFACE_KEY);
      if(saved)return saved;
      // Migrate sessions opened before screen persistence was added.
      return sessionStorage.getItem(SECTION_KEY)?'inventory':'native';
    }catch(error){return 'native';}
  }

  function syncTopMenuActive(){
    document.querySelectorAll('.qmes-top-menu-button').forEach(button=>{
      const selected=Boolean(button.closest('[data-qmes-inventory-menu]'));
      button.classList.toggle('is-active',selected);
      if(selected)button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
  }

  function clearInventoryTopMenuActive(){
    const button=document.querySelector('[data-qmes-inventory-menu] .qmes-top-menu-button');
    if(!button)return;
    button.classList.remove('is-active');
    button.removeAttribute('aria-current');
  }

  function activateNativeTopMenu(button,label){
    const buttons=Array.from(document.querySelectorAll('.qmes-top-menu-button'));
    const current=button?.isConnected?button:buttons.find(item=>!item.closest('[data-qmes-inventory-menu]')&&clean(item.textContent)===label);
    buttons.forEach(item=>{
      const selected=item===current;
      item.classList.toggle('is-active',selected);
      if(selected)item.setAttribute('aria-current','page');
      else item.removeAttribute('aria-current');
    });
  }

  function restore(){
    clearInventoryTopMenuActive();
    if(root){try{root.unmount();}catch(error){}root=null;}
    if(host){host.remove();host=null;}
    const main=document.querySelector('#root>div>main');
    if(main)Array.from(main.children).forEach(node=>{
      if(node.dataset.invHidden==='1'){
        node.style.removeProperty('display');
        delete node.dataset.invHidden;
      }
    });
    requestAnimationFrame(clearInventoryTopMenuActive);
    setTimeout(clearInventoryTopMenuActive,80);
  }

  function sidebar(){
    const side=document.getElementById('qmes-sync-sidebar');
    const wrap=side?.querySelector('.qmes-side-items');
    if(!wrap)return;
    const title=side.querySelector('.qmes-side-title');
    if(title)title.textContent='재고관리';
    const existing=Array.from(wrap.querySelectorAll('[data-qmes-inv-side]'));
    if(existing.length===sections.length){
      existing.forEach(button=>button.classList.toggle('is-active',button.dataset.qmesInvSide===current));
      return;
    }
    wrap.replaceChildren();
    sections.forEach(([id,label])=>{
      const button=document.createElement('button');
      button.type='button';
      button.dataset.qmesInvSide=id;
      button.className=`qmes-side-item${current===id?' is-active':''}`;
      button.textContent=label;
      button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openInventory(id);});
      wrap.appendChild(button);
    });
  }

  function component(){
    if(typeof window.InventoryEnterpriseTab==='function')return window.InventoryEnterpriseTab;
    try{if(typeof InventoryEnterpriseTab==='function')return InventoryEnterpriseTab;}catch(error){}
    return null;
  }

  function openInventory(section='overview'){
    current=sections.some(item=>item[0]===section)?section:'overview';
    const main=document.querySelector('#root>div>main');
    const Component=component();
    if(!main||!Component){console.warn('[QMES inventory] 재고 화면 컴포넌트를 아직 불러오지 못했습니다.');return;}
    Array.from(main.children).forEach(node=>{
      if(node!==host){node.dataset.invHidden='1';node.style.setProperty('display','none','important');}
    });
    if(!host){host=document.createElement('div');host.id='qmes-inventory-host';main.appendChild(host);}
    if(root){try{root.unmount();}catch(error){}}
    host.replaceChildren();
    root=ReactDOM.createRoot(host);
    root.render(React.createElement(Component,{section:current}));
    syncTopMenuActive();
    requestAnimationFrame(syncTopMenuActive);
    setTimeout(syncTopMenuActive,120);
    try{sessionStorage.setItem(SECTION_KEY,current);}catch(error){}
    setSurface('inventory');
    if(typeof window.qmesSetGlobalSidebarGroup==='function')window.qmesSetGlobalSidebarGroup('재고관리');
    sidebar();
    requestAnimationFrame(sidebar);
  }

  function restoreSavedInventory(){
    if(restoreScheduled||savedSurface()!=='inventory')return;
    restoreScheduled=true;
    let attempts=0;
    const reopen=()=>{
      if(savedSurface()!=='inventory')return;
      let saved='overview';
      try{saved=sessionStorage.getItem(SECTION_KEY)||saved;}catch(error){}
      if(document.querySelector('#root>div>main')&&component()){
        openInventory(saved);
        return;
      }
      attempts+=1;
      if(attempts<80)setTimeout(reopen,50);
    };
    requestAnimationFrame(reopen);
  }

  function install(){
    const nav=document.querySelector('.qmes-top-menu');
    if(!nav)return false;
    let item=nav.querySelector('[data-qmes-inventory-menu]');
    if(!item){
      item=document.createElement('div');
      item.className='qmes-top-menu-item';
      item.dataset.qmesInventoryMenu='1';
      const button=document.createElement('button');
      button.type='button';
      button.className='qmes-top-menu-button';
      button.innerHTML='<span>▣</span><span>재고관리</span><span>›</span>';
      button.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        let saved='overview';
        try{saved=sessionStorage.getItem(SECTION_KEY)||saved;}catch(error){}
        openInventory(saved);
      });
      item.appendChild(button);
      const trace=Array.from(nav.children).find(node=>clean(node.textContent).includes('LOT 추적'));
      trace?trace.after(item):nav.appendChild(item);
    }
    window.qmesOpenInventorySection=openInventory;
    restoreSavedInventory();
    return true;
  }

  document.addEventListener('click',event=>{
    const target=event.target.closest?.('.qmes-top-menu-button');
    if(target&&!target.closest('[data-qmes-inventory-menu]')){
      const label=clean(target.textContent);
      setSurface('native');
      clearInventoryTopMenuActive();
      if(host)restore();
      const activate=()=>activateNativeTopMenu(target,label);
      activate();
      requestAnimationFrame(activate);
      setTimeout(activate,180);
    }
  },false);

  // Observe only until the top menu exists. Do not rewrite sidebar on every DOM mutation.
  if(!install()){
    const observer=new MutationObserver(()=>{if(install())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();