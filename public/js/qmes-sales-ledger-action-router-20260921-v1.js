/* QMES Sales ledger action router - CURRENT ONLY - 2026-09-21
 * 상세 => detail only.
 * 수정 => edit only.
 * No edit button is injected into the detail drawer.
 * One user click is enough; delayed module readiness is handled internally.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_LEDGER_ACTION_ROUTER_20260921_V1__) return;
  window.__QMES_SALES_LEDGER_ACTION_ROUTER_20260921_V1__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v;}catch(_){return f;}};

  function shownId(row,map){
    const key=clean(row&&row.workOrder)||clean(row&&row.id);
    const m=map&&typeof map==="object"&&!Array.isArray(map)
      ? (map[key]||map[clean(row&&row.id)]||row&&row.orderMeta||{})
      : (row&&row.orderMeta||{});
    return clean(m&&m.salesOrderIdOverride)||clean(row&&row.id);
  }

  function salesIdFromRow(tr){
    const links=[...tr.querySelectorAll(".qrl-link")];
    return clean(links[1]?.textContent||links[0]?.textContent);
  }

  function salesRow(id){
    const list=read(SALES_KEY,[]);
    const map=read(META_KEY,{});
    return (Array.isArray(list)?list:[]).find(row=>
      clean(row&&row.id)===id ||
      clean(row&&row.workOrder)===id ||
      shownId(row,map)===id
    )||null;
  }

  function closeDetail(){
    try{window.qmesSalesOrderDetail?.close?.();}catch(_){}
    ["qmes-sales-detail-drawer-safe-20260828-v2","qmes-sales-detail-drawer-20260828-v1","qmes-sales-order-detail-panel-20260826"]
      .forEach(id=>document.getElementById(id)?.remove());
  }

  function openDetail(id){
    const run=()=>{
      if(window.qmesSalesDetailConsistency&&typeof window.qmesSalesDetailConsistency.open==="function"){
        window.qmesSalesDetailConsistency.open(id);
        return true;
      }
      if(window.qmesSalesOrderDetail&&typeof window.qmesSalesOrderDetail.open==="function"){
        window.qmesSalesOrderDetail.open(id);
        return true;
      }
      return false;
    };

    if(run()) return;

    let tries=0;
    const retry=()=>{
      if(run()) return;
      if(++tries<40) setTimeout(retry,50);
    };
    retry();
  }

  function openEdit(row){
    closeDetail();

    const run=()=>{
      const owner=window.qmesSalesEditDirectV18;
      if(owner&&typeof owner.open==="function"){
        owner.open(row);
        return true;
      }
      return false;
    };

    if(run()) return;

    let tries=0;
    const retry=()=>{
      if(run()) return;
      if(++tries<40) setTimeout(retry,50);
    };
    retry();
  }

  function handle(event){
    const target=event.target;
    if(!(target instanceof Element)) return;

    const button=target.closest(".qmes-sales-ledger-v4 .qrl-actions button");
    if(!button) return;

    const action=clean(button.textContent);
    if(action!=="상세" && action!=="수정") return;

    const tr=button.closest("tr");
    if(!tr) return;

    const id=salesIdFromRow(tr);
    if(!id) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if(action==="상세"){
      openDetail(id);
      return;
    }

    const row=salesRow(id);
    if(row) openEdit(row);
  }

  // Capture phase wins before React and older bridge handlers, preventing cross-action.
  window.addEventListener("click",handle,true);
})();