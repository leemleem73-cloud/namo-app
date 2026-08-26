/* NAMO QMES — one-time Sales/Delivery reset from current Work Orders — 2026-08-26
 * Removes old demo SO rows and rebuilds Sales/Delivery data from the actual QMES
 * work-order source (DB.woDocs / DB.batches). If no work order exists, Sales shows 0 rows.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_FROM_WORKORDER_20260826__) return;
  window.__QMES_SALES_FROM_WORKORDER_20260826__=true;

  const MARKER="qmes-sales-from-workorder-20260826-v2";
  const LOCAL_KEY="qmes-erp-sales-v1";
  const SYNC_TYPE="inventory";
  const RECORD_KEY="erp:sales";

  function text(value){return String(value==null?"":value).trim();}
  function number(value){
    const n=Number(String(value==null?"":value).replace(/,/g,""));
    return Number.isFinite(n)?n:0;
  }
  function isoDate(value){
    const s=text(value);
    const m=s.match(/(20\d{2})[-./](\d{1,2})[-./](\d{1,2})/);
    if(!m) return "";
    return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;
  }
  function currentUserName(){
    const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    return text(user?.name||user?.uid||user);
  }

  function workOrderStatus(lot,doc,batch){
    if(typeof window.getAutoWoStatus==="function"){
      try{return text(window.getAutoWoStatus(lot));}catch(_error){}
    }
    return text(doc?.manualStatus||doc?.status||batch?.status||"발행");
  }

  function planStatus(status){
    if(/완료|검사중|생산중|진행중/.test(status)) return "반영완료";
    return "계획반영";
  }
  function shippingStatus(status){
    if(/완료/.test(status)) return "생산완료";
    if(/검사중/.test(status)) return "검사중";
    if(/생산중|진행중/.test(status)) return "생산중";
    return "-";
  }

  function buildRows(){
    const DB=window.DB;
    if(!DB||typeof DB!=="object") return null;
    const docs=DB.woDocs&&typeof DB.woDocs==="object"?DB.woDocs:{};
    const batches=Array.isArray(DB.batches)?DB.batches:[];
    const ids=[];
    Object.keys(docs).forEach(id=>{if(text(id)&&!ids.includes(text(id))) ids.push(text(id));});
    batches.forEach(row=>{const id=text(row?.no);if(id&&!ids.includes(id)) ids.push(id);});

    return ids.map(lot=>{
      const doc=docs[lot]||{};
      const batch=batches.find(row=>text(row?.no)===lot)||{};
      const product=text(doc.item||batch.item||DB.lots?.[lot]?.itemName||DB.lots?.[lot]?.item)||"-";
      const qty=number(doc.plan??doc.qty??batch.plan??batch.qty);
      const status=workOrderStatus(lot,doc,batch);
      const customer=text(doc.customer||doc.customerName||doc.client||doc.clientName||batch.customer||batch.customerName)||"-";
      const po=text(doc.customerPo||doc.customerPO||doc.po||doc.poNo||batch.po||batch.poNo)||"-";
      const due=isoDate(doc.due||doc.deliveryDate||batch.due||doc.date||batch.date)||isoDate(doc.date)||"";
      return {
        id:lot,
        customer,
        po,
        product,
        qty,
        due,
        plan:planStatus(status),
        shipping:shippingStatus(status),
        source:"WORK_ORDER",
        workOrder:lot,
        workOrderStatus:status
      };
    }).sort((a,b)=>String(b.due||"").localeCompare(String(a.due||""))||String(b.id).localeCompare(String(a.id)));
  }

  function writeLocal(rows){
    try{localStorage.setItem(LOCAL_KEY,JSON.stringify(rows));}catch(_error){}
  }

  async function writeShared(rows){
    if(typeof window.qmesSyncUpsert!=="function") return false;
    try{
      await window.qmesSyncUpsert(SYNC_TYPE,RECORD_KEY,{
        module:"erp",
        schema:1,
        kind:"sales",
        rows,
        source:"WORK_ORDER",
        updatedAt:new Date().toISOString(),
        updatedBy:currentUserName(),
        resetReason:"sales rows rebuilt from current work orders"
      });
      return true;
    }catch(error){
      console.warn("[QMES] work-order sales sync failed",error);
      return false;
    }
  }

  async function apply(){
    const rows=buildRows();
    if(rows===null) return false;
    writeLocal(rows);
    const shared=await writeShared(rows);
    if(shared){
      try{localStorage.setItem(MARKER,"done");}catch(_error){}
    }
    window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",source:"WORK_ORDER",rows:rows.length}}));
    return true;
  }

  /* Wait until production/work-order DB and shared sync helpers are loaded. */
  let attempt=0;
  const timer=window.setInterval(async()=>{
    attempt+=1;
    const ready=window.DB&&typeof window.DB==="object"&&window.DB.woDocs&&Array.isArray(window.DB.batches);
    if(!ready){
      if(attempt>=80) window.clearInterval(timer);
      return;
    }
    const done=await apply();
    if(done||attempt>=80) window.clearInterval(timer);
  },125);

  /* Rebuild again whenever a work order is saved/synchronized in the same session. */
  ["qmes:workorder-saved","qmes:workorder-synced","qmes:workorder-updated"].forEach(name=>{
    window.addEventListener(name,()=>{apply();});
  });
})();
