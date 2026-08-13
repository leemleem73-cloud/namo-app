/* Inventory sidebar views — top submenu is handled by the common QMES top menu. */
(function(){
  "use strict";
  if(window.__QMES_INVENTORY_SIDEBAR_VIEWS_4__)return;
  window.__QMES_INVENTORY_SIDEBAR_VIEWS_4__=true;

  const items=[
    {label:"원재료·부자재 재고",view:"raw"},
    {label:"완제품 재고 현황",view:"fg"},
    {label:"완제품 출고관리",view:"ship"},
    {label:"완제품 출고내역",view:"history"}
  ];
  let active="raw";
  const clean=v=>String(v||"").replace(/[›〉]/g,"").replace(/\s+/g," ").trim();

  function activate(view){
    active=view;
    window.dispatchEvent(new CustomEvent("qmes:inventory-view",{detail:{view}}));
    document.querySelectorAll("#qmes-sync-sidebar [data-inventory-view]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.inventoryView===view));
  }

  function install(){
    const side=document.getElementById("qmes-sync-sidebar");
    if(!side||clean(side.querySelector(".qmes-side-title")?.textContent)!=="재고관리")return;
    const wrap=side.querySelector(".qmes-side-items");
    if(!wrap)return;
    const current=Array.from(wrap.querySelectorAll(".qmes-side-item"));
    const complete=items.every(item=>current.some(btn=>btn.dataset.inventoryView===item.view));
    if(complete){
      current.forEach(btn=>btn.classList.toggle("is-active",btn.dataset.inventoryView===active));
      return;
    }
    wrap.replaceChildren();
    items.forEach(item=>{
      const btn=document.createElement("button");
      btn.type="button";
      btn.className="qmes-side-item"+(item.view===active?" is-active":"");
      btn.dataset.inventoryView=item.view;
      btn.textContent=item.label;
      wrap.appendChild(btn);
    });
  }

  /* Remove the old inventory-only hover menu so 재고관리 uses the same white
     common top submenu (#qmes-all-menu-dropdown) as every other top menu. */
  function removeLegacyInventoryHover(){
    document.getElementById("qmes-inventory-hover-menu")?.remove();
    document.getElementById("qmes-inventory-hover-style")?.remove();
  }

  document.addEventListener("click",event=>{
    const inv=event.target.closest?.("#qmes-sync-sidebar [data-inventory-view]");
    if(inv){
      event.preventDefault();
      event.stopPropagation();
      activate(inv.dataset.inventoryView);
      install();
      return;
    }
    const top=event.target.closest?.(".qmes-top-menu-button");
    if(top&&clean(top.textContent)==="재고관리"){
      active="raw";
      setTimeout(install,0);
      setTimeout(install,50);
      setTimeout(install,180);
    }
  },true);

  removeLegacyInventoryHover();
  const observer=new MutationObserver(()=>{removeLegacyInventoryHover();install();});
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener("load",()=>{removeLegacyInventoryHover();install();});
  setTimeout(()=>{removeLegacyInventoryHover();install();},200);
})();
