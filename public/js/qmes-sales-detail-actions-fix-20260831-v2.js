/* NAMO QMES - Sales detail action bridge V2 - 2026-08-31
 * ADD-ONLY patch. No existing Sales / Work Order / LOT source is overwritten.
 * Fixes both footer actions in every current/legacy Sales detail drawer.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_DETAIL_ACTIONS_FIX_20260831_V2__)return;
  window.__QMES_SALES_DETAIL_ACTIONS_FIX_20260831_V2__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const LINK_KEY="qmes-sales-workorder-link-v1";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const readMap=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};

  function actionOf(button){
    if(!button)return "";
    const text=clean(button.textContent);
    if(button.matches("[data-qsd2-workorder],[data-qsd-workorder]")||(/작업지시/.test(text)&&/보기/.test(text)))return "workorder";
    if(button.matches("[data-qsd2-lot],[data-qsd-lot]")||(/LOT/i.test(text)&&/추적/.test(text)))return "lot";
    return "";
  }

  function drawerRoot(button){
    return button.closest("#qmes-sales-detail-drawer-safe-20260828-v2,#qmes-sales-detail-drawer-20260828-v1,#qmes-sales-order-detail-panel-20260826")
      ||button.closest('[role="dialog"][aria-label="통합 상세 정보"]')?.parentElement
      ||button.closest('[aria-label="통합 상세 정보"]')?.parentElement
      ||null;
  }

  function salesIdFromRoot(root){
    const direct=clean(root?.dataset?.salesId||root?.getAttribute?.("data-sales-id"));
    if(direct)return direct;
    const order=clean(root?.querySelector?.(".qsd2-order,.qsd-order,.qso-sub")?.textContent);
    const m=order.match(/SO-[A-Za-z0-9-]+/i);
    return m?m[0]:"";
  }

  function workOrderFromCards(root){
    if(!root)return "";
    const cards=Array.from(root.querySelectorAll(".qsd2-card,.qsd-card,.qso-item"));
    for(const card of cards){
      const label=clean(card.querySelector("small,b")?.textContent);
      if(!/작업지시/.test(label))continue;
      const value=clean(card.querySelector("strong,span")?.textContent);
      if(value&&value!=="-")return value;
    }
    return "";
  }

  function workOrderFromStorage(salesId){
    const wanted=clean(salesId),sales=read(SALES_KEY,[]),rows=Array.isArray(sales)?sales:[],meta=readMap(META_KEY),links=readMap(LINK_KEY);
    const row=rows.find(item=>{
      const id=clean(item?.id),key=clean(item?.workOrder)||id,m=meta[key]||meta[id]||item?.orderMeta||{},shown=clean(m?.salesOrderIdOverride)||id;
      return wanted&&(wanted===id||wanted===key||wanted===shown);
    })||null;
    if(row){
      const id=clean(row?.id),key=clean(row?.workOrder)||id,m=meta[key]||meta[id]||row?.orderMeta||{};
      return clean(row?.workOrder)||clean(m?.workOrder)||clean(links?.bySales?.[wanted])||clean(links?.bySales?.[id]);
    }
    return clean(links?.bySales?.[wanted]);
  }

  function resolveWorkOrder(root){
    return workOrderFromCards(root)||workOrderFromStorage(salesIdFromRoot(root))||clean(localStorage.getItem("qmes-focus-workorder"));
  }

  function lotForWorkOrder(workOrder){
    const wanted=clean(workOrder);
    try{
      const lots=window.DB?.lots&&typeof window.DB.lots==="object"?window.DB.lots:{};
      if(lots[wanted])return wanted;
      const hit=Object.entries(lots).find(([id,lot])=>clean(id)===wanted||clean(lot?.wo)===wanted||clean(lot?.workOrder)===wanted||clean(lot?.productionLot)===wanted);
      if(hit)return clean(hit[0]);
    }catch(_){ }
    return wanted;
  }

  function closeDrawer(root){
    try{root?.remove();}catch(_){ }
    ["qmes-sales-detail-drawer-safe-20260828-v2","qmes-sales-detail-drawer-20260828-v1","qmes-sales-order-detail-panel-20260826"].forEach(id=>document.getElementById(id)?.remove());
    document.documentElement.style.removeProperty("overflow");
    document.body.style.removeProperty("overflow");
  }

  function dispatchTab(tab,detail){
    try{sessionStorage.setItem("qmes_current_tab",tab);}catch(_){ }
    const fire=()=>window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab,...detail}}));
    fire();
    requestAnimationFrame(fire);
    setTimeout(fire,80);
  }

  function findWorkOrderRow(workOrder){
    const wanted=clean(workOrder);
    return Array.from(document.querySelectorAll("table.qmes-wo-list-table tbody tr")).find(row=>clean(row.querySelector("td:first-child")?.textContent)===wanted)||null;
  }

  function revealWorkOrder(workOrder){
    let attempt=0;
    const tick=()=>{
      attempt++;
      const row=findWorkOrderRow(workOrder);
      if(row){
        const view=Array.from(row.querySelectorAll("button")).find(btn=>clean(btn.textContent)==="보기")||row.querySelector("button");
        view?.click();
        row.scrollIntoView({block:"center",behavior:"auto"});
        setTimeout(()=>document.querySelector(".qmes-wo-cert")?.scrollIntoView({block:"start",behavior:"smooth"}),100);
        return;
      }
      if(attempt===5&&typeof window.qmesSyncPullWorkOrders==="function")try{Promise.resolve(window.qmesSyncPullWorkOrders()).catch(()=>{});}catch(_){ }
      if(attempt<160)setTimeout(tick,50);
      else window.alert(`작업지시서 ${workOrder}를 찾지 못했습니다.`);
    };
    setTimeout(tick,50);
  }

  function revealLot(lotId,workOrder){
    let attempt=0;
    const tick=()=>{
      attempt++;
      const resolved=lotForWorkOrder(workOrder)||lotId;
      const buttons=Array.from(document.querySelectorAll("button"));
      const btn=buttons.find(b=>{
        const text=clean(b.textContent);
        return text===resolved||text.startsWith(resolved+" ")||text.startsWith(resolved+"·");
      });
      if(btn){btn.click();btn.scrollIntoView({block:"center",behavior:"auto"});return;}
      if(attempt<160)setTimeout(tick,50);
      else window.alert(`LOT ${resolved||workOrder}를 LOT 추적 화면에서 찾지 못했습니다.`);
    };
    setTimeout(tick,50);
  }

  function openWorkOrder(workOrder){
    const wo=clean(workOrder);
    if(!wo||wo==="-"){window.alert("연결된 작업지시서가 없습니다.");return;}
    try{localStorage.setItem("qmes-focus-workorder",wo);}catch(_){ }
    dispatchTab("wo",{openMenu:"productionMenu",workOrder:wo,source:"sales-detail-action-v2"});
    try{history.replaceState(history.state,"",`${location.pathname}${location.search}#page-workorder-list`);}catch(_){ }
    revealWorkOrder(wo);
  }

  function openLot(workOrder){
    const wo=clean(workOrder);
    if(!wo||wo==="-"){window.alert("연결된 생산 LOT가 없습니다.");return;}
    const lotId=lotForWorkOrder(wo);
    try{localStorage.setItem("qmes-focus-lot",lotId||wo);}catch(_){ }
    dispatchTab("trace",{lot:lotId||wo,workOrder:wo,source:"sales-detail-action-v2"});
    try{history.replaceState(history.state,"",`${location.pathname}${location.search}#page-lot-trace`);}catch(_){ }
    revealLot(lotId,wo);
  }

  window.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof Element))return;
    const button=target.closest("button");
    const action=actionOf(button);
    if(!action)return;
    const root=drawerRoot(button);
    if(!root)return;
    const workOrder=resolveWorkOrder(root);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    closeDrawer(root);
    if(action==="workorder")openWorkOrder(workOrder);
    else openLot(workOrder);
  },true);
})();
