/* NAMO QMES - Sales manual product -> Work Order linkage - 2026-08-27 */
(function(){
  "use strict";
  if(window.__QMES_SALES_PRODUCT_WORKORDER_LINK_20260827__)return;
  window.__QMES_SALES_PRODUCT_WORKORDER_LINK_20260827__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const readRows=()=>{try{const v=JSON.parse(localStorage.getItem(SALES_KEY)||"[]");return Array.isArray(v)?v:[];}catch(_){return [];}};

  async function syncBySalesId(id){
    const salesId=clean(id);if(!salesId)return;
    const row=readRows().find(item=>clean(item?.id)===salesId);
    if(!row)return;
    const workOrder=clean(row.workOrder),product=clean(row.product);
    if(!workOrder||workOrder===salesId||!product)return;
    if(typeof window.qmesSalesSyncProductToWorkOrder!=="function")return;
    try{await window.qmesSalesSyncProductToWorkOrder(workOrder,product);}catch(error){console.warn("수주 제품 작업지시 연동 실패:",error?.message||error);}
  }

  window.addEventListener("qmes:erp-data-changed",event=>{
    const detail=event?.detail||{};
    if(detail.kind!=="sales")return;
    if(!/^SALES_EDIT_V11$/i.test(clean(detail.source)))return;
    const id=clean(detail.newId||detail.id||detail.oldId);
    setTimeout(()=>syncBySalesId(id),0);
  });
})();
