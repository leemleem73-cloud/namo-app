/* QMES ERP top-menu -> left-sidebar sync
 * Keeps the five ERP top menus consistent with the existing contextual left menu.
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

  const clean=value=>String(value||"").replace(/[›〉▣]/g,"").replace(/\s+/g," ").trim();
  const topLabel=button=>clean(button?.querySelector(":scope > span")?.textContent||button?.querySelector("span")?.textContent||button?.textContent);

  function sidebar(){return document.getElementById("qmes-sync-sidebar");}

  function showGroup(group){
    const config=ERP_GROUPS[group];
    const side=sidebar();
    if(!config||!side) return;

    side.dataset.qmesErpGroup=group;
    const title=side.querySelector(".qmes-side-title");
    const head=side.querySelector(".qmes-side-head");
    const items=side.querySelector(".qmes-side-items");
    const search=side.querySelector(".qmes-side-search-input");
    if(search) search.value="";
    if(title) title.textContent=group;
    head?.classList.add("is-group-active");

    if(items){
      items.replaceChildren();
      const button=document.createElement("button");
      button.type="button";
      button.className="qmes-side-item is-active qmes-erp-side-item";
      button.dataset.qmesErpSideTab=config.tab;
      button.dataset.qmesErpGroup=group;
      button.textContent=config.label;
      items.appendChild(button);
    }

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
    const haystack=(group+" "+config.label).toLowerCase();
    if(q&&!haystack.includes(q)){
      const empty=document.createElement("div");
      empty.className="qmes-side-empty";
      empty.textContent="검색 결과 없음";
      items.appendChild(empty);
      return true;
    }
    const button=document.createElement("button");
    button.type="button";
    button.className="qmes-side-item is-active qmes-erp-side-item";
    button.dataset.qmesErpSideTab=config.tab;
    button.dataset.qmesErpGroup=group;
    button.textContent=config.label;
    items.appendChild(button);
    return true;
  }

  document.addEventListener("click",event=>{
    const top=event.target.closest?.(".qmes-top-menu-button");
    if(top){
      const label=topLabel(top);
      if(ERP_GROUPS[label]){
        requestAnimationFrame(()=>showGroup(label));
      }else{
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
})();
