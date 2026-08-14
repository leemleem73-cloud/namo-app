/* Inventory sidebar compatibility + stable hierarchy — 2026-08-14
 * Unified Inventory v2 is the single owner of inventory pages/data.
 * This file only arranges the shared top/left inventory navigation.
 */
(function(){
  "use strict";
  if(window.__QMES_INVENTORY_DEDICATED_PAGES__)return;
  window.__QMES_INVENTORY_DEDICATED_PAGES__=true;

  const PRODUCT_VIEWS=new Set(["finished","finished-ship","finished-history"]);
  const VIEW_KEY="qmes_inventory_v2_view";
  let productExpanded=false;
  let scheduled=false;

  const clean=value=>String(value||"").replace(/[›〉]/g,"").replace(/\s+/g," ").trim();
  const pages=()=>Array.isArray(window.qmesInventoryV2CompletePages)?window.qmesInventoryV2CompletePages:[];
  const activeView=()=>{try{return sessionStorage.getItem(VIEW_KEY)||"overview";}catch(_error){return "overview";}};

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;syncAll();});
  }

  function makeParent(top){
    const node=document.createElement("button");
    node.type="button";
    node.setAttribute("aria-expanded","false");
    node.className=top?"qmes-inventory-product-parent-top":"qmes-side-item qmes-inventory-product-parent-side";
    node.innerHTML='<span>완제품</span><span class="qmes-inventory-product-arrow">›</span>';
    return node;
  }

  function toggleProduct(){
    productExpanded=!productExpanded;
    syncAll();
  }

  function syncSidebar(){
    const side=document.getElementById("qmes-sync-sidebar");
    if(!side||clean(side.querySelector(".qmes-side-title")?.textContent)!=="재고관리")return;
    const wrap=side.querySelector(".qmes-side-items");
    const allPages=pages();
    if(!wrap||!allPages.length)return;

    const buttons=new Map(Array.from(wrap.querySelectorAll("button[data-inventory-v2-view]")).map(button=>[button.dataset.inventoryV2View,button]));
    if(allPages.some(page=>!buttons.has(page.view)))return;

    let parent=wrap.querySelector(".qmes-inventory-product-parent-side");
    if(!parent)parent=makeParent(false);
    const current=activeView();
    if(PRODUCT_VIEWS.has(current))productExpanded=true;

    allPages.filter(page=>!PRODUCT_VIEWS.has(page.view)).forEach(page=>{
      const button=buttons.get(page.view);
      button.classList.remove("qmes-inventory-product-child");
      button.hidden=false;
      wrap.appendChild(button);
    });
    wrap.appendChild(parent);
    allPages.filter(page=>PRODUCT_VIEWS.has(page.view)).forEach(page=>{
      const button=buttons.get(page.view);
      button.classList.add("qmes-inventory-product-child");
      button.hidden=!productExpanded;
      wrap.appendChild(button);
    });
    parent.classList.toggle("is-active",PRODUCT_VIEWS.has(current));
    parent.classList.toggle("is-open",productExpanded);
    parent.setAttribute("aria-expanded",String(productExpanded));
  }

  function syncTopDropdown(){
    const menu=document.getElementById("qmes-all-menu-dropdown");
    if(!menu||clean(menu.querySelector(".qmes-hover-title")?.textContent)!=="재고관리")return;
    const allPages=pages();
    if(!allPages.length)return;

    const buttons=new Map(Array.from(menu.querySelectorAll("button[data-inventory-v2-view]")).map(button=>[button.dataset.inventoryV2View,button]));
    if(allPages.some(page=>!buttons.has(page.view)))return;

    let parent=menu.querySelector(".qmes-inventory-product-parent-top");
    if(!parent)parent=makeParent(true);
    const current=activeView();
    if(PRODUCT_VIEWS.has(current))productExpanded=true;

    allPages.filter(page=>!PRODUCT_VIEWS.has(page.view)).forEach(page=>{
      const button=buttons.get(page.view);
      button.classList.remove("qmes-inventory-product-child-top");
      button.hidden=false;
      menu.appendChild(button);
    });
    menu.appendChild(parent);
    allPages.filter(page=>PRODUCT_VIEWS.has(page.view)).forEach(page=>{
      const button=buttons.get(page.view);
      button.classList.add("qmes-inventory-product-child-top");
      button.hidden=!productExpanded;
      menu.appendChild(button);
    });
    parent.classList.toggle("is-active",PRODUCT_VIEWS.has(current));
    parent.classList.toggle("is-open",productExpanded);
    parent.setAttribute("aria-expanded",String(productExpanded));
  }

  function syncAll(){syncSidebar();syncTopDropdown();}

  document.addEventListener("click",event=>{
    const parent=event.target.closest?.(".qmes-inventory-product-parent-side,.qmes-inventory-product-parent-top");
    if(parent){event.preventDefault();event.stopPropagation();toggleProduct();return;}

    const viewButton=event.target.closest?.("[data-inventory-v2-view]");
    if(viewButton&&PRODUCT_VIEWS.has(viewButton.dataset.inventoryV2View))productExpanded=true;

    const top=event.target.closest?.(".qmes-top-menu-button");
    if(top&&clean(top.textContent)==="재고관리")schedule();
  },true);

  window.addEventListener("qmes:inventory-v2-view",event=>{
    const view=String(event?.detail?.view||event?.detail||"");
    if(PRODUCT_VIEWS.has(view))productExpanded=true;
    schedule();
  });
  window.addEventListener("qmes:inventory-stage3-ready",schedule);
  window.addEventListener("qmes:auth-ready",schedule);

  const style=document.createElement("style");
  style.id="qmes-inventory-menu-hierarchy-style-20260814";
  style.textContent=`
    /* Inventory entries use the exact same marker behavior as every other shared sidebar item. */
    #qmes-sync-sidebar .qmes-side-item[data-inventory-v2-view]::before{content:none!important;display:none!important}
    #qmes-sync-sidebar .qmes-side-item[data-inventory-v2-view].is-active::before{content:''!important;display:block!important;position:absolute!important;left:0!important;top:8px!important;bottom:8px!important;width:3px!important;height:auto!important;margin:0!important;border-radius:0!important;background:#2563eb!important;box-shadow:none!important}

    #qmes-sync-sidebar .qmes-inventory-product-parent-side{justify-content:space-between!important}
    #qmes-sync-sidebar .qmes-inventory-product-parent-side>span:first-child{display:inline!important}
    #qmes-sync-sidebar .qmes-inventory-product-parent-side.is-active::before{content:''!important;display:block!important;position:absolute!important;left:0!important;top:8px!important;bottom:8px!important;width:3px!important;height:auto!important;margin:0!important;border-radius:0!important;background:#2563eb!important;box-shadow:none!important}
    #qmes-sync-sidebar .qmes-inventory-product-arrow{margin-left:auto;font-size:17px;line-height:1;transition:transform .14s ease}
    #qmes-sync-sidebar .qmes-inventory-product-parent-side.is-open .qmes-inventory-product-arrow{transform:rotate(90deg)}
    #qmes-sync-sidebar .qmes-side-item.qmes-inventory-product-child{padding-left:29px!important;font-weight:700!important}
    #qmes-sync-sidebar .qmes-side-item.qmes-inventory-product-child[hidden]{display:none!important}

    #qmes-all-menu-dropdown .qmes-inventory-product-parent-top{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:39px;padding:9px 11px;box-sizing:border-box;border:0;border-radius:7px;background:transparent;color:#e2e8f0;font:750 13px Pretendard,'Noto Sans KR',sans-serif;text-align:left;cursor:pointer}
    #qmes-all-menu-dropdown .qmes-inventory-product-parent-top:hover{background:#243a57;color:#fff}
    #qmes-all-menu-dropdown .qmes-inventory-product-parent-top.is-active{background:#eef7ff;color:#0369a1;font-weight:900}
    #qmes-all-menu-dropdown .qmes-inventory-product-parent-top .qmes-inventory-product-arrow{margin-left:auto;font-size:17px;line-height:1;transition:transform .14s ease}
    #qmes-all-menu-dropdown .qmes-inventory-product-parent-top.is-open .qmes-inventory-product-arrow{transform:rotate(90deg)}
    #qmes-all-menu-dropdown button.qmes-inventory-product-child-top{padding-left:26px!important}
    #qmes-all-menu-dropdown button.qmes-inventory-product-child-top[hidden]{display:none!important}
  `;
  document.head.appendChild(style);

  /* Short bounded bootstrap only; no continuous DOM observer or long polling. */
  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    syncAll();
    if(pages().length||attempts>=8)clearInterval(timer);
  },150);
})();
