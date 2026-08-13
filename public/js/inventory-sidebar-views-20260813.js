/* Inventory sidebar subviews - safe integration with existing sidebar */
(function(){
  "use strict";
  const items=[
    {label:"원재료·부자재 재고",view:"raw"},
    {label:"완제품 재고 현황",view:"fg"},
    {label:"완제품 출고관리",view:"ship"},
    {label:"완제품 출고내역",view:"history"}
  ];
  const clean=v=>String(v||"").replace(/\s+/g," ").trim();

  function activate(view){
    window.dispatchEvent(new CustomEvent("qmes:inventory-view",{detail:{view}}));
    document.querySelectorAll("#qmes-sync-sidebar .qmes-side-item").forEach(btn=>{
      btn.classList.toggle("is-active",btn.dataset.inventoryView===view);
    });
  }

  function install(){
    const side=document.getElementById("qmes-sync-sidebar");
    if(!side)return;
    const title=clean(side.querySelector(".qmes-side-title")?.textContent);
    if(title!=="재고관리")return;
    const wrap=side.querySelector(".qmes-side-items");
    if(!wrap)return;
    if(wrap.dataset.inventoryViewsInstalled==="1")return;
    wrap.dataset.inventoryViewsInstalled="1";
    wrap.innerHTML="";
    items.forEach((item,index)=>{
      const btn=document.createElement("button");
      btn.type="button";
      btn.className="qmes-side-item"+(index===0?" is-active":"");
      btn.dataset.inventoryView=item.view;
      btn.textContent=item.label;
      btn.addEventListener("click",event=>{
        event.preventDefault();event.stopPropagation();activate(item.view);
      });
      wrap.appendChild(btn);
    });
    activate("raw");
  }

  const observer=new MutationObserver(install);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("click",event=>{
    const top=event.target.closest?.(".qmes-top-menu-button");
    if(top&&clean(top.textContent).includes("재고관리"))setTimeout(install,0);
  },true);
  window.addEventListener("load",install);
  setTimeout(install,300);
})();
