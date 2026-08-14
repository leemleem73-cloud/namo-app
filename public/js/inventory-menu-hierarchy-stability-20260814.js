/* QMES inventory menu hierarchy + stability — 2026-08-14 */
(function(){
  "use strict";
  if(window.__QMES_INVENTORY_MENU_HIERARCHY_20260814__)return;
  window.__QMES_INVENTORY_MENU_HIERARCHY_20260814__=true;

  const PRODUCT_VIEWS=new Set(["finished","finished-ship","finished-history"]);
  const VIEW_KEY="qmes_inventory_v2_view";
  let productExpanded=false;
  let scheduled=false;

  const clean=value=>String(value||"").replace(/[›〉]/g,"").replace(/\s+/g," ").trim();
  const pages=()=>Array.isArray(window.qmesInventoryV2CompletePages)?window.qmesInventoryV2CompletePages:[];
  const activeView=()=>{try{return sessionStorage.getItem(VIEW_KEY)||"overview";}catch(_error){return "overview";}};

  function schedule(delay=0){
    if(delay){setTimeout(()=>schedule(0),delay);return;}
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;syncAll();});
  }

  function styleParent(node,top=false){
    node.setAttribute("role","button");
    node.tabIndex=0;
    node.className=top?"qmes-inventory-product-parent-top":"qmes-inventory-product-parent-side";
    node.innerHTML='<span>완제품</span><span class="qmes-inventory-product-arrow">›</span>';
  }

  function toggleProduct(force){
    productExpanded=typeof force==="boolean"?force:!productExpanded;
    syncAll();
  }

  function syncSidebar(){
    const side=document.getElementById("qmes-sync-sidebar");
    if(!side||clean(side.querySelector(".qmes-side-title")?.textContent)!=="재고관리")return;
    const wrap=side.querySelector(".qmes-side-items");
    if(!wrap)return;
    const allPages=pages();
    if(!allPages.length)return;
    const buttons=new Map(Array.from(wrap.querySelectorAll("[data-inventory-v2-view]")).map(button=>[button.dataset.inventoryV2View,button]));
    if(allPages.some(page=>!buttons.has(page.view)))return;

    let parent=wrap.querySelector(".qmes-inventory-product-parent-side");
    if(!parent){parent=document.createElement("div");styleParent(parent,false);}
    const current=activeView();
    if(PRODUCT_VIEWS.has(current))productExpanded=true;

    allPages.filter(page=>!PRODUCT_VIEWS.has(page.view)).forEach(page=>wrap.appendChild(buttons.get(page.view)));
    wrap.appendChild(parent);
    allPages.filter(page=>PRODUCT_VIEWS.has(page.view)).forEach(page=>{
      const button=buttons.get(page.view);
      button.classList.add("qmes-inventory-product-child");
      button.hidden=!productExpanded;
      wrap.appendChild(button);
    });
    parent.classList.toggle("is-active",PRODUCT_VIEWS.has(current));
    parent.classList.toggle("is-open",productExpanded);
  }

  function syncTopDropdown(){
    const menu=document.getElementById("qmes-all-menu-dropdown");
    if(!menu||clean(menu.querySelector(".qmes-hover-title")?.textContent)!=="재고관리")return;
    const allPages=pages();
    if(!allPages.length)return;
    const buttons=new Map(Array.from(menu.querySelectorAll("button[data-inventory-v2-view]")).map(button=>[button.dataset.inventoryV2View,button]));
    if(allPages.some(page=>!buttons.has(page.view)))return;

    let parent=menu.querySelector(".qmes-inventory-product-parent-top");
    if(!parent){parent=document.createElement("div");styleParent(parent,true);}
    const current=activeView();
    if(PRODUCT_VIEWS.has(current))productExpanded=true;

    allPages.filter(page=>!PRODUCT_VIEWS.has(page.view)).forEach(page=>menu.appendChild(buttons.get(page.view)));
    menu.appendChild(parent);
    allPages.filter(page=>PRODUCT_VIEWS.has(page.view)).forEach(page=>{
      const button=buttons.get(page.view);
      button.classList.add("qmes-inventory-product-child-top");
      button.hidden=!productExpanded;
      menu.appendChild(button);
    });
    parent.classList.toggle("is-active",PRODUCT_VIEWS.has(current));
    parent.classList.toggle("is-open",productExpanded);
  }

  function syncAll(){syncSidebar();syncTopDropdown();}

  document.addEventListener("click",event=>{
    const sideParent=event.target.closest?.(".qmes-inventory-product-parent-side");
    const topParent=event.target.closest?.(".qmes-inventory-product-parent-top");
    if(sideParent||topParent){
      event.preventDefault();event.stopPropagation();toggleProduct();return;
    }
    const viewButton=event.target.closest?.("[data-inventory-v2-view]");
    if(viewButton&&PRODUCT_VIEWS.has(viewButton.dataset.inventoryV2View))productExpanded=true;
    const top=event.target.closest?.(".qmes-top-menu-button");
    if(top&&clean(top.textContent)==="재고관리"){schedule(0);schedule(70);}
  },true);

  document.addEventListener("keydown",event=>{
    const parent=event.target.closest?.(".qmes-inventory-product-parent-side,.qmes-inventory-product-parent-top");
    if(parent&&(event.key==="Enter"||event.key===" ")){event.preventDefault();toggleProduct();}
  },true);

  document.addEventListener("pointerover",event=>{
    const top=event.target.closest?.(".qmes-top-menu-button");
    if(top&&clean(top.textContent)==="재고관리"&&!top.contains(event.relatedTarget)){schedule(0);schedule(80);}
  },true);

  window.addEventListener("qmes:inventory-v2-view",event=>{
    const view=String(event?.detail?.view||event?.detail||"");
    if(PRODUCT_VIEWS.has(view))productExpanded=true;
    schedule();
  });
  window.addEventListener("qmes:inventory-stage3-ready",()=>schedule(80));
  window.addEventListener("qmes:auth-ready",()=>schedule(120));

  const style=document.createElement("style");
  style.id="qmes-inventory-menu-hierarchy-style-20260814";
  style.textContent=`
    #qmes-sync-sidebar .qmes-inventory-product-parent-side{position:relative;display:flex;align-items:center;justify-content:space-between;width:100%;min-height:40px;padding:9px 10px 9px 14px;margin:2px 0;box-sizing:border-box;border:0;border-radius:7px;background:transparent;color:#475569;font-size:13px;font-weight:700;text-align:left;cursor:pointer}
    #qmes-sync-sidebar .qmes-inventory-product-parent-side:hover{background:#f4f7fa;color:#172033}
    #qmes-sync-sidebar .qmes-inventory-product-parent-side.is-active{background:#edf4ff;color:#175cd3}
    #qmes-sync-sidebar .qmes-inventory-product-parent-side.is-active:before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:3px;background:#2563eb}
    #qmes-sync-sidebar .qmes-inventory-product-arrow{font-size:18px;line-height:1;transition:transform .14s ease}
    #qmes-sync-sidebar .qmes-inventory-product-parent-side.is-open .qmes-inventory-product-arrow{transform:rotate(90deg)}
    #qmes-sync-sidebar .qmes-side-item.qmes-inventory-product-child{padding-left:29px!important;font-weight:650!important}
    #qmes-sync-sidebar .qmes-side-item.qmes-inventory-product-child[hidden]{display:none!important}

    #qmes-all-menu-dropdown .qmes-inventory-product-parent-top{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:39px;padding:9px 11px;box-sizing:border-box;border:0;border-radius:7px;background:transparent;color:#e2e8f0;font-size:13px;font-weight:750;text-align:left;cursor:pointer}
    #qmes-all-menu-dropdown .qmes-inventory-product-parent-top:hover{background:#243a57;color:#fff}
    #qmes-all-menu-dropdown .qmes-inventory-product-parent-top.is-active{background:#eef7ff;color:#0369a1;font-weight:900}
    #qmes-all-menu-dropdown .qmes-inventory-product-parent-top .qmes-inventory-product-arrow{font-size:18px;line-height:1;transition:transform .14s ease}
    #qmes-all-menu-dropdown .qmes-inventory-product-parent-top.is-open .qmes-inventory-product-arrow{transform:rotate(90deg)}
    #qmes-all-menu-dropdown button.qmes-inventory-product-child-top{padding-left:26px!important}
    #qmes-all-menu-dropdown button.qmes-inventory-product-child-top[hidden]{display:none!important}
  `;
  document.head.appendChild(style);

  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;syncAll();
    if((window.qmesInventoryV2CompletePages||[]).length&&attempts>=12)clearInterval(timer);
    else if(attempts>=40)clearInterval(timer);
  },120);
})();
