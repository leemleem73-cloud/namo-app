/* QMES ERP top-menu -> shared left-sidebar sync
 * ERP routes use the exact same top-nav/sidebar shell as the normal QMES routes.
 */
(function(){
  "use strict";
  if(window.__QMES_ERP_SIDEBAR_SYNC_20260826__) return;
  window.__QMES_ERP_SIDEBAR_SYNC_20260826__=true;

  const ERP_GROUPS={
    "수주·납기":{label:"수주 · 납기관리",tab:"erpSales"},
    "생산계획·MRP":{label:"생산계획 · MRP",tab:"erpPlan"},
    "구매·발주":{label:"구매 · 발주관리",tab:"erpPurchase"},
    "Recipe/BOM":{label:"Recipe / BOM",tab:"erpMaster"},
    "출하·납품":{label:"출하 · 납품관리",tab:"erpShipping"}
  };

  const SHARED_SHELL_STYLES=[
    ["qmes-shell-offset-fix-20260826","./css/qmes-shell-offset-fix-20260826.css?v=20260826-shell1"],
    ["qmes-shell-readable-size-20260827","./css/qmes-shell-readable-size-20260827.css?v=20260827-2"],
    ["qmes-sidebar-line-align-20260826","./css/qmes-sidebar-line-align-20260826.css?v=20260826-line2"],
    ["qmes-shared-shell-final-20260827","./css/qmes-shared-shell-final-20260827.css?v=20260827-1"],
    ["qmes-responsive-main-layout-20260827","./css/qmes-responsive-main-layout-20260827.css?v=20260827-1"]
  ];

  const clean=value=>String(value||"").replace(/[›〉▣]/g,"").replace(/\s+/g," ").trim();
  const topLabel=button=>clean(button?.querySelector(":scope > span")?.textContent||button?.querySelector("span")?.textContent||button?.textContent);
  const sidebar=()=>document.getElementById("qmes-sync-sidebar");

  function ensureSharedShell(){
    SHARED_SHELL_STYLES.forEach(([id,href])=>{
      let link=document.getElementById(id);
      if(!link){
        link=document.createElement("link");
        link.id=id;
        link.rel="stylesheet";
        link.href=href;
        document.head.appendChild(link);
      }else if(String(link.getAttribute("href")||"")!==href){
        link.href=href;
      }
      link.media="all";
      link.disabled=false;
    });
  }

  function syncTopActive(group){
    document.querySelectorAll(".qmes-top-menu-button").forEach(button=>{
      const active=topLabel(button)===group;
      button.classList.toggle("is-active",active);
      if(active) button.setAttribute("aria-current","page");
      else button.removeAttribute("aria-current");
    });
  }

  function makeSideButton(group,config){
    const button=document.createElement("button");
    button.type="button";
    button.className="qmes-side-item is-active qmes-erp-side-item";
    button.dataset.qmesErpSideTab=config.tab;
    button.dataset.qmesErpGroup=group;
    button.textContent=config.label;
    return button;
  }

  function showGroup(group){
    const config=ERP_GROUPS[group];
    const side=sidebar();
    if(!config||!side) return;

    ensureSharedShell();
    syncTopActive(group);
    side.dataset.qmesErpGroup=group;

    const title=side.querySelector(".qmes-side-title");
    const head=side.querySelector(".qmes-side-head");
    const items=side.querySelector(".qmes-side-items");
    const search=side.querySelector(".qmes-side-search-input");
    if(search) search.value="";
    if(title) title.textContent=group;
    head?.classList.add("is-group-active");
    if(items) items.replaceChildren(makeSideButton(group,config));

    ["display","visibility","opacity","pointer-events","transform"].forEach(prop=>side.style.removeProperty(prop));
    document.body.classList.add("qmes-side-open");
    window.dispatchEvent(new CustomEvent("qmes:erp-sidebar-open",{detail:{group,tab:config.tab}}));
  }

  function filterCurrentGroup(query){
    const side=sidebar();
    const group=side?.dataset.qmesErpGroup;
    const config=ERP_GROUPS[group];
    if(!side||!config) return false;
    const title=side.querySelector(".qmes-side-title");
    const head=side.querySelector(".qmes-side-head");
    const items=side.querySelector(".qmes-side-items");
    if(!items) return true;
    const q=clean(query).toLowerCase();
    if(title) title.textContent=q?"찾기":group;
    head?.classList.toggle("is-group-active",!q);
    items.replaceChildren();
    if(q&&!(group+" "+config.label).toLowerCase().includes(q)){
      const empty=document.createElement("div");
      empty.className="qmes-side-empty";
      empty.textContent="검색 결과 없음";
      items.appendChild(empty);
      return true;
    }
    items.appendChild(makeSideButton(group,config));
    return true;
  }

  document.addEventListener("click",event=>{
    const top=event.target.closest?.(".qmes-top-menu-button");
    if(top){
      const label=topLabel(top);
      if(ERP_GROUPS[label]) requestAnimationFrame(()=>showGroup(label));
      else{
        const side=sidebar();
        if(side) delete side.dataset.qmesErpGroup;
      }
      return;
    }

    const item=event.target.closest?.("[data-qmes-erp-side-tab]");
    if(!item) return;
    event.preventDefault();
    event.stopPropagation();
    const tab=String(item.dataset.qmesErpSideTab||"");
    if(!tab) return;
    item.parentElement?.querySelectorAll(".qmes-side-item").forEach(button=>button.classList.toggle("is-active",button===item));
    window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab}}));
  },true);

  document.addEventListener("input",event=>{
    const input=event.target.closest?.("#qmes-sync-sidebar .qmes-side-search-input");
    if(!input) return;
    const side=sidebar();
    if(!side?.dataset.qmesErpGroup) return;
    event.stopImmediatePropagation();
    filterCurrentGroup(input.value||"");
  },true);

  window.addEventListener("qmes:navigate-tab",event=>{
    const tab=String(event?.detail?.tab||"");
    const entry=Object.entries(ERP_GROUPS).find(([,config])=>config.tab===tab);
    if(!entry) return;
    requestAnimationFrame(()=>showGroup(entry[0]));
  });

  ensureSharedShell();
})();
