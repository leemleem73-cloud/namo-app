/* Inventory sidebar + top hover subviews */
(function(){
  "use strict";
  if(window.__QMES_INVENTORY_SIDEBAR_VIEWS_3__)return;
  window.__QMES_INVENTORY_SIDEBAR_VIEWS_3__=true;
  const items=[
    {label:"원재료·부자재 재고",view:"raw"},
    {label:"완제품 재고 현황",view:"fg"},
    {label:"완제품 출고관리",view:"ship"},
    {label:"완제품 출고내역",view:"history"}
  ];
  let active="raw",hideTimer=null;
  const clean=v=>String(v||"").replace(/[›〉]/g,"").replace(/\s+/g," ").trim();
  function activate(view){
    active=view;
    window.dispatchEvent(new CustomEvent("qmes:inventory-view",{detail:{view}}));
    document.querySelectorAll("#qmes-sync-sidebar [data-inventory-view]").forEach(btn=>btn.classList.toggle("is-active",btn.dataset.inventoryView===view));
    hideHover();
  }
  function install(){
    const side=document.getElementById("qmes-sync-sidebar");
    if(!side||clean(side.querySelector(".qmes-side-title")?.textContent)!=="재고관리")return;
    const wrap=side.querySelector(".qmes-side-items");
    if(!wrap)return;
    const current=Array.from(wrap.querySelectorAll(".qmes-side-item"));
    const complete=items.every(item=>current.some(btn=>btn.dataset.inventoryView===item.view));
    if(complete){current.forEach(btn=>btn.classList.toggle("is-active",btn.dataset.inventoryView===active));return;}
    wrap.replaceChildren();
    items.forEach(item=>{
      const btn=document.createElement("button");btn.type="button";btn.className="qmes-side-item"+(item.view===active?" is-active":"");btn.dataset.inventoryView=item.view;btn.textContent=item.label;wrap.appendChild(btn);
    });
  }
  function ensureHover(){
    let box=document.getElementById("qmes-inventory-hover-menu");
    if(box)return box;
    const style=document.createElement("style");style.id="qmes-inventory-hover-style";style.textContent=`#qmes-inventory-hover-menu{position:fixed;z-index:13050;min-width:220px;padding:7px;border:1px solid #d8e1eb;border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.18);display:none}#qmes-inventory-hover-menu.is-open{display:block}#qmes-inventory-hover-menu button{display:block;width:100%;min-height:39px;padding:9px 12px;border:0;border-radius:6px;background:#fff;color:#334155;font:inherit;font-size:13px;font-weight:700;text-align:left;cursor:pointer}#qmes-inventory-hover-menu button:hover,#qmes-inventory-hover-menu button.is-active{background:#edf4ff;color:#175cd3}`;document.head.appendChild(style);
    box=document.createElement("div");box.id="qmes-inventory-hover-menu";
    items.forEach(item=>{const b=document.createElement("button");b.type="button";b.dataset.inventoryHoverView=item.view;b.textContent=item.label;box.appendChild(b);});
    box.addEventListener("mouseenter",()=>{if(hideTimer)clearTimeout(hideTimer)});
    box.addEventListener("mouseleave",scheduleHide);
    document.body.appendChild(box);return box;
  }
  function showHover(top){
    if(hideTimer)clearTimeout(hideTimer);
    const box=ensureHover(),r=top.getBoundingClientRect();
    box.querySelectorAll("button").forEach(b=>b.classList.toggle("is-active",b.dataset.inventoryHoverView===active));
    box.style.left=Math.round(r.left)+"px";box.style.top=Math.round(r.bottom+2)+"px";box.classList.add("is-open");
  }
  function hideHover(){ensureHover().classList.remove("is-open")}
  function scheduleHide(){if(hideTimer)clearTimeout(hideTimer);hideTimer=setTimeout(hideHover,140)}
  document.addEventListener("mouseover",event=>{const top=event.target.closest?.(".qmes-top-menu-button");if(top&&clean(top.textContent)==="재고관리")showHover(top)},true);
  document.addEventListener("mouseout",event=>{const top=event.target.closest?.(".qmes-top-menu-button");if(top&&clean(top.textContent)==="재고관리"&&!top.contains(event.relatedTarget))scheduleHide()},true);
  document.addEventListener("click",event=>{
    const hover=event.target.closest?.("#qmes-inventory-hover-menu [data-inventory-hover-view]");
    if(hover){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();const view=hover.dataset.inventoryHoverView;active=view;const top=Array.from(document.querySelectorAll(".qmes-top-menu-button")).find(b=>clean(b.textContent)==="재고관리");if(top)top.click();setTimeout(()=>{activate(view);install()},80);return;}
    const inv=event.target.closest?.("#qmes-sync-sidebar [data-inventory-view]");
    if(inv){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();activate(inv.dataset.inventoryView);install();return;}
    const top=event.target.closest?.(".qmes-top-menu-button");if(top&&clean(top.textContent)==="재고관리"){active="raw";setTimeout(install,0);setTimeout(install,50);setTimeout(install,180);}
  },true);
  const observer=new MutationObserver(install);observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener("load",install);setTimeout(install,200);
})();
