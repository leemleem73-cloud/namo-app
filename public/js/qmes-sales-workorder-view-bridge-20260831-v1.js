/* NAMO QMES - Sales drawer action bridge - 2026-08-31
 * Recovery patch for both footer actions:
 *   - 작업지시 보기 -> React tab "wo" + matching work order selection
 *   - LOT 추적       -> React tab "trace" + matching LOT selection
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_WORKORDER_VIEW_BRIDGE_20260831_V2__) return;
  window.__QMES_SALES_WORKORDER_VIEW_BRIDGE_20260831_V2__=true;

  try{
    if(!window.__QMES_DATE_PICKER_STABLE_20260831_V2__&&!document.querySelector('script[data-qmes-date-picker-stable="1"]')){
      const script=document.createElement("script");
      script.src="./js/qmes-date-picker-stable-20260831-v1.js?v=20260831-calendar2";
      script.async=false;
      script.dataset.qmesDatePickerStable="1";
      document.head.appendChild(script);
    }
  }catch(_){ }

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
      ||null;
  }

  function salesId(root){
    const direct=clean(root?.dataset?.salesId||root?.getAttribute?.("data-sales-id"));
    if(direct)return direct;
    const text=clean(root?.querySelector?.(".qsd2-order,.qsd-order,.qso-sub")?.textContent);
    return text.match(/SO-[A-Za-z0-9-]+/i)?.[0]||"";
  }

  function workOrderFromCards(root){
    for(const card of Array.from(root?.querySelectorAll?.(".qsd2-card,.qsd-card,.qso-item")||[])){
      const label=clean(card.querySelector("small,b")?.textContent);
      if(!/작업지시/.test(label))continue;
      const value=clean(card.querySelector("strong,span")?.textContent);
      if(value&&value!=="-")return value;
    }
    return "";
  }

  function workOrderFromStorage(id){
    const wanted=clean(id),sales=read(SALES_KEY,[]),rows=Array.isArray(sales)?sales:[],meta=readMap(META_KEY),links=readMap(LINK_KEY);
    const row=rows.find(item=>{
      const raw=clean(item?.id),key=clean(item?.workOrder)||raw,m=meta[key]||meta[raw]||item?.orderMeta||{},shown=clean(m?.salesOrderIdOverride)||raw;
      return wanted&&(wanted===raw||wanted===key||wanted===shown);
    });
    if(!row)return clean(links?.bySales?.[wanted]);
    const raw=clean(row.id),key=clean(row.workOrder)||raw,m=meta[key]||meta[raw]||row.orderMeta||{};
    return clean(row.workOrder)||clean(m.workOrder)||clean(links?.bySales?.[wanted])||clean(links?.bySales?.[raw]);
  }

  function resolveWorkOrder(root){
    return workOrderFromCards(root)||workOrderFromStorage(salesId(root));
  }

  function resolveLot(workOrder){
    const wo=clean(workOrder);
    try{
      const lots=window.DB?.lots&&typeof window.DB.lots==="object"?window.DB.lots:{};
      if(lots[wo])return wo;
      const found=Object.entries(lots).find(([id,lot])=>clean(lot?.wo)===wo||clean(lot?.workOrder)===wo||clean(lot?.productionLot)===wo);
      if(found)return clean(found[0]);
    }catch(_){ }
    return wo;
  }

  function closeDrawer(root){
    try{root?.remove();}catch(_){ }
    ["qmes-sales-detail-drawer-safe-20260828-v2","qmes-sales-detail-drawer-20260828-v1","qmes-sales-order-detail-panel-20260826"].forEach(id=>document.getElementById(id)?.remove());
    document.documentElement.style.removeProperty("overflow");
    document.body.style.removeProperty("overflow");
  }

  function navigate(tab,detail){
    try{sessionStorage.setItem("qmes_current_tab",tab);}catch(_){ }
    const fire=()=>window.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab,...detail}}));
    fire();
    requestAnimationFrame(fire);
    setTimeout(fire,80);
  }

  function openWorkOrder(wo){
    const wanted=clean(wo);
    if(!wanted||wanted==="-"){alert("연결된 작업지시서가 없습니다.");return;}
    try{localStorage.setItem("qmes-focus-workorder",wanted);}catch(_){ }
    navigate("wo",{openMenu:"productionMenu",workOrder:wanted,source:"sales-detail"});

    let attempt=0;
    const tick=()=>{
      attempt++;
      const row=Array.from(document.querySelectorAll("table.qmes-wo-list-table tbody tr")).find(tr=>clean(tr.querySelector("td:first-child")?.textContent)===wanted);
      if(row){
        const view=Array.from(row.querySelectorAll("button")).find(btn=>clean(btn.textContent)==="보기")||row.querySelector("button");
        view?.click();
        row.scrollIntoView({block:"center",behavior:"auto"});
        setTimeout(()=>document.querySelector(".qmes-wo-cert")?.scrollIntoView({block:"start",behavior:"smooth"}),120);
        try{localStorage.removeItem("qmes-focus-workorder");}catch(_){ }
        return;
      }
      if(attempt===5&&typeof window.qmesSyncPullWorkOrders==="function")try{Promise.resolve(window.qmesSyncPullWorkOrders()).catch(()=>{});}catch(_){ }
      if(attempt<160)setTimeout(tick,50);else alert(`작업지시서 ${wanted}를 찾지 못했습니다.`);
    };
    setTimeout(tick,50);
  }

  function openLot(wo){
    const wanted=resolveLot(wo);
    if(!wanted||wanted==="-"){alert("연결된 생산 LOT가 없습니다.");return;}
    try{localStorage.setItem("qmes-focus-lot",wanted);}catch(_){ }
    navigate("trace",{lot:wanted,workOrder:clean(wo),source:"sales-detail"});

    let attempt=0;
    const tick=()=>{
      attempt++;
      const buttons=Array.from(document.querySelectorAll("button"));
      const match=buttons.find(btn=>{
        const text=clean(btn.textContent);
        return text===wanted||text.startsWith(wanted+" ")||text.startsWith(wanted+"·");
      });
      if(match){
        match.click();
        match.scrollIntoView({block:"center",behavior:"auto"});
        try{localStorage.removeItem("qmes-focus-lot");}catch(_){ }
        return;
      }
      if(attempt<160)setTimeout(tick,50);else alert(`LOT ${wanted}를 LOT 추적 화면에서 찾지 못했습니다.`);
    };
    setTimeout(tick,50);
  }

  document.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof Element))return;
    const button=target.closest("button");
    const action=actionOf(button);
    if(!action)return;
    const root=drawerRoot(button);
    if(!root)return;
    const wo=resolveWorkOrder(root);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    closeDrawer(root);
    if(action==="workorder")openWorkOrder(wo);else openLot(wo);
  },true);
})();
