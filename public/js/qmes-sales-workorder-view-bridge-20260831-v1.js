/* NAMO QMES - Sales drawer -> Work Order view bridge - 2026-08-31
 * ADD-ONLY patch. Existing Sales / Work Order modules are not replaced.
 *
 * Root cause:
 * The Sales detail drawer used location.hash="#page-workorder-list", but the live
 * React router is state/event based (qmes:navigate-tab). If the hash was already
 * #page-workorder-list, clicking "작업지시 보기" did nothing at all.
 *
 * Fix:
 * 1) intercept both current/legacy drawer Work Order buttons in capture phase
 * 2) route through qmes:navigate-tab -> tab "wo"
 * 3) wait for WoDocTab, select the matching LOT/work order row and scroll the
 *    actual work-order document into view
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_WORKORDER_VIEW_BRIDGE_20260831_V1__) return;
  window.__QMES_SALES_WORKORDER_VIEW_BRIDGE_20260831_V1__=true;

  const FOCUS_KEY="qmes-focus-workorder";
  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const LINK_KEY="qmes-sales-workorder-link-v1";
  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_){return fallback;}};
  const readMap=key=>{const value=read(key,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{};};

  function workOrderFromCards(root){
    if(!root) return "";
    const cards=Array.from(root.querySelectorAll(".qsd2-card,.qsd-card,.qso-item"));
    for(const card of cards){
      const label=clean(card.querySelector("small,b")?.textContent);
      if(!/^작업지시(?:\s*\/|$)/.test(label)) continue;
      const value=clean(card.querySelector("strong,span")?.textContent);
      if(value&&value!=="-") return value;
    }
    return "";
  }

  function workOrderFromStorage(salesId){
    const wanted=clean(salesId);
    const sales=read(SALES_KEY,[]);
    const rows=Array.isArray(sales)?sales:[];
    const meta=readMap(META_KEY);
    const links=readMap(LINK_KEY);
    const row=rows.find(item=>{
      const id=clean(item?.id),key=clean(item?.workOrder)||id;
      const m=meta[key]||meta[id]||item?.orderMeta||{};
      const shown=clean(m?.salesOrderIdOverride)||id;
      return wanted&&(wanted===id||wanted===key||wanted===shown);
    })||null;
    if(row){
      const id=clean(row?.id),key=clean(row?.workOrder)||id,m=meta[key]||meta[id]||row?.orderMeta||{};
      return clean(row?.workOrder)||clean(m?.workOrder)||clean(links?.bySales?.[wanted])||clean(links?.bySales?.[id]);
    }
    return clean(links?.bySales?.[wanted]);
  }

  function resolveWorkOrder(button,root){
    const cardValue=workOrderFromCards(root);
    if(cardValue) return cardValue;
    const salesId=clean(root?.dataset?.salesId)||clean(root?.getAttribute?.("data-sales-id"));
    const stored=workOrderFromStorage(salesId);
    if(stored) return stored;
    try{return clean(localStorage.getItem(FOCUS_KEY));}catch(_){return "";}
  }

  function closeSalesDrawer(root){
    try{root?.remove();}catch(_){ }
    document.getElementById("qmes-sales-detail-drawer-safe-20260828-v2")?.remove();
    document.getElementById("qmes-sales-detail-drawer-20260828-v1")?.remove();
    document.getElementById("qmes-sales-order-detail-panel-20260826")?.remove();
    document.documentElement.style.removeProperty("overflow");
    document.body.style.removeProperty("overflow");
  }

  function rowForWorkOrder(workOrder){
    const wanted=clean(workOrder);
    if(!wanted) return null;
    const rows=Array.from(document.querySelectorAll("table.qmes-wo-list-table tbody tr"));
    return rows.find(row=>{
      const first=clean(row.querySelector("td:first-child button")?.textContent||row.querySelector("td:first-child")?.textContent);
      return first===wanted;
    })||null;
  }

  function selectAndReveal(workOrder){
    const row=rowForWorkOrder(workOrder);
    if(!row) return false;
    const buttons=Array.from(row.querySelectorAll("button"));
    const view=buttons.find(button=>clean(button.textContent)==="보기")||buttons[0];
    if(!view) return false;
    view.click();
    row.scrollIntoView({block:"center",behavior:"auto"});
    setTimeout(()=>{
      const cert=document.querySelector(".qmes-wo-cert");
      if(cert) cert.scrollIntoView({block:"start",behavior:"smooth"});
    },90);
    try{localStorage.removeItem(FOCUS_KEY);}catch(_){ }
    return true;
  }

  function waitAndOpen(workOrder){
    let attempt=0;
    const maxAttempts=140; // ~7 seconds, including shared DB refresh
    const tick=()=>{
      attempt+=1;
      if(selectAndReveal(workOrder)) return;
      if(attempt===4&&typeof window.qmesSyncPullWorkOrders==="function"){
        try{Promise.resolve(window.qmesSyncPullWorkOrders()).catch(()=>{});}catch(_){ }
      }
      if(attempt<maxAttempts){setTimeout(tick,50);return;}
      console.warn("[QMES Sales->WorkOrder] 작업지시 행을 찾지 못했습니다:",workOrder);
      window.alert(`작업지시서 ${workOrder}를 작업지시 현황에서 찾지 못했습니다.`);
    };
    setTimeout(tick,40);
  }

  function navigateToWorkOrder(workOrder){
    const wo=clean(workOrder);
    if(!wo||wo==="-"){
      window.alert("연결된 작업지시서가 없습니다.");
      return false;
    }
    try{localStorage.setItem(FOCUS_KEY,wo);}catch(_){ }
    try{sessionStorage.setItem("qmes_current_tab","wo");}catch(_){ }

    /* This is the actual QMES router API. Hash-only navigation is intentionally
       not used because the React router does not consume #page-workorder-list. */
    window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{
      detail:{tab:"wo",openMenu:"productionMenu",workOrder:wo,source:"sales-workorder-view"}
    }));

    try{
      const next=`${location.pathname}${location.search}#page-workorder-list`;
      history.replaceState(history.state,"",next);
    }catch(_){ }

    waitAndOpen(wo);
    return true;
  }

  document.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof Element)) return;
    const button=target.closest("[data-qsd2-workorder],[data-qsd-workorder]");
    if(!button) return;
    const root=button.closest("#qmes-sales-detail-drawer-safe-20260828-v2,#qmes-sales-detail-drawer-20260828-v1,#qmes-sales-order-detail-panel-20260826");
    const workOrder=resolveWorkOrder(button,root);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    closeSalesDrawer(root);
    navigateToWorkOrder(workOrder);
  },true);

  /* Legacy detail owner emits this event. Support it as well so both drawer paths
     have the same behavior. */
  window.addEventListener("qmes:open-workorder",event=>{
    const workOrder=clean(event?.detail?.workOrder);
    if(!workOrder) return;
    navigateToWorkOrder(workOrder);
  });
})();
