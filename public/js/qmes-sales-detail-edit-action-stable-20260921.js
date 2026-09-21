/* QMES Sales detail persistent Edit action - 2026-09-21
 * ADD-ONLY patch.
 * Keeps the "수정" action visible in Sales detail even when the detail drawer
 * re-renders after opening or when changing detail tabs.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_DETAIL_EDIT_ACTION_STABLE_20260921__) return;
  window.__QMES_SALES_DETAIL_EDIT_ACTION_STABLE_20260921__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const SAFE_ROOT="qmes-sales-detail-drawer-safe-20260828-v2";
  const LEGACY_ROOT="qmes-sales-detail-drawer-20260828-v1";
  const OLD_PANEL="qmes-sales-order-detail-panel-20260826";
  const BTN_CLASS="qmes-sales-detail-edit-stable";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const read=(key,fallback)=>{
    try{
      const value=JSON.parse(localStorage.getItem(key)||"null");
      return value==null?fallback:value;
    }catch(_){return fallback;}
  };

  function visibleId(row,map){
    const key=clean(row&&row.workOrder)||clean(row&&row.id);
    const meta=(map&&typeof map==="object"&&!Array.isArray(map))
      ? (map[key]||map[clean(row&&row.id)]||row&&row.orderMeta||{})
      : (row&&row.orderMeta||{});
    return clean(meta&&meta.salesOrderIdOverride)||clean(row&&row.id);
  }

  function findRow(id){
    const target=clean(id);
    if(!target) return null;
    const list=read(SALES_KEY,[]);
    const map=read(META_KEY,{});
    return (Array.isArray(list)?list:[]).find(row=>{
      return clean(row&&row.id)===target
        || clean(row&&row.workOrder)===target
        || visibleId(row,map)===target;
    })||null;
  }

  function salesIdFromRoot(root){
    const direct=clean(root&&root.dataset&&root.dataset.salesId);
    if(direct) return direct;

    const order=root&&root.querySelector(".qsd2-order,.qsd-order,.qso-sub");
    if(order){
      const text=clean(order.textContent);
      const match=text.match(/SO-[A-Z0-9-]+/i);
      if(match) return clean(match[0]);
    }
    return "";
  }

  function closeDetail(){
    try{window.qmesSalesDetailDrawerSafe?.close?.();}catch(_){}
    try{window.qmesSalesOrderDetail?.close?.();}catch(_){}
    [SAFE_ROOT,LEGACY_ROOT,OLD_PANEL].forEach(id=>document.getElementById(id)?.remove());
    document.documentElement.style.removeProperty("overflow");
    document.body.style.removeProperty("overflow");
  }

  function openEdit(root){
    const id=salesIdFromRoot(root);
    const row=findRow(id);
    if(!row){
      window.alert("수주 데이터를 찾지 못했습니다.");
      return;
    }

    closeDetail();

    setTimeout(()=>{
      if(window.qmesSalesEditDirectV18&&typeof window.qmesSalesEditDirectV18.open==="function"){
        window.qmesSalesEditDirectV18.open(row);
        return;
      }

      window.alert("수주 수정 기능을 불러오는 중입니다. 잠시 후 다시 눌러 주세요.");
    },40);
  }

  function addButton(root){
    if(!root||!document.documentElement.contains(root)) return;

    const actions=root.querySelector(".qsd2-actions,.qsd-actions,.qso-actions");
    if(!actions) return;

    let button=actions.querySelector("."+BTN_CLASS);
    if(!button){
      button=document.createElement("button");
      button.type="button";
      button.className=BTN_CLASS;
      button.textContent="수정";
      button.setAttribute("aria-label","수주 수정");
      button.addEventListener("click",event=>{
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        openEdit(root);
      },true);
      actions.insertBefore(button,actions.firstChild);
    }

    if(actions.classList.contains("qsd2-actions")||actions.classList.contains("qsd-actions")){
      actions.style.setProperty("grid-template-columns","repeat(3,minmax(0,1fr))","important");
    }

    button.style.setProperty("display","inline-flex","important");
    button.style.setProperty("align-items","center","important");
    button.style.setProperty("justify-content","center","important");
    button.style.setProperty("height","40px","important");
    button.style.setProperty("border","1px solid #9fbfd4","important");
    button.style.setProperty("border-radius","9px","important");
    button.style.setProperty("background","#eef6fb","important");
    button.style.setProperty("color","#245b7c","important");
    button.style.setProperty("font-size","11px","important");
    button.style.setProperty("font-weight","900","important");
    button.style.setProperty("cursor","pointer","important");
    button.style.setProperty("visibility","visible","important");
    button.style.setProperty("opacity","1","important");
  }

  function ensure(){
    [SAFE_ROOT,LEGACY_ROOT,OLD_PANEL].forEach(id=>{
      const root=document.getElementById(id);
      if(root) addButton(root);
    });
  }

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      ensure();
    });
  }

  function boot(){
    ensure();

    const observer=new MutationObserver(records=>{
      if(records.some(record=>
        record.type==="childList" ||
        (record.type==="attributes"&&record.target instanceof Element)
      )) schedule();
    });
    observer.observe(document.documentElement,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:["style","class","hidden"]
    });

    document.addEventListener("click",event=>{
      const target=event.target instanceof Element?event.target:null;
      if(
        target?.closest(".qmes-sales-ledger-v4 .qrl-actions button") ||
        target?.closest("[data-qsd2-tab],[data-qsd-tab]")
      ){
        setTimeout(schedule,0);
        setTimeout(schedule,60);
        setTimeout(schedule,180);
      }
    },true);

    ["qmes:erp-data-changed","qmes:data-updated"]
      .forEach(name=>window.addEventListener(name,()=>setTimeout(schedule,0)));

    [200,700,1500,3000].forEach(ms=>setTimeout(schedule,ms));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();