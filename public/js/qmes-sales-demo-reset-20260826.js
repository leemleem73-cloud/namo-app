/* NAMO QMES — Sales/Delivery rows derived from current Work Orders — 2026-08-26
 * The ERP Sales module must never show demo SO rows. Before the ERP runtime renders,
 * this bridge converts the actual QMES work orders (DB.woDocs / DB.batches) into
 * Sales/Delivery rows, stores them locally and in the shared DB, then resolves a
 * readiness promise consumed by qmes-erp-runtime-loader-20260826.js.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_FROM_WORKORDER_READY__) return;

  const LOCAL_KEY="qmes-erp-sales-v1";
  const SYNC_TYPE="inventory";
  const RECORD_KEY="erp:sales";
  let resolveReady;
  window.__QMES_SALES_FROM_WORKORDER_READY__=new Promise(resolve=>{resolveReady=resolve;});

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
  function getDb(){
    try{
      if(typeof DB!=="undefined"&&DB&&typeof DB==="object") return DB;
    }catch(_error){}
    return window.DB&&typeof window.DB==="object"?window.DB:null;
  }

  function workOrderStatus(lot,doc,batch){
    try{
      if(typeof getAutoWoStatus==="function") return text(getAutoWoStatus(lot));
    }catch(_error){}
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
    const db=getDb();
    if(!db) return null;
    const docs=db.woDocs&&typeof db.woDocs==="object"?db.woDocs:{};
    const batches=Array.isArray(db.batches)?db.batches:[];
    const ids=[];
    Object.keys(docs).forEach(id=>{const key=text(id);if(key&&!ids.includes(key))ids.push(key);});
    batches.forEach(row=>{const key=text(row?.no);if(key&&!ids.includes(key))ids.push(key);});

    return ids.map(lot=>{
      const doc=docs[lot]||{};
      const batch=batches.find(row=>text(row?.no)===lot)||{};
      const lotRow=db.lots?.[lot]||{};
      const status=workOrderStatus(lot,doc,batch);
      const product=text(doc.item||batch.item||lotRow.itemName||lotRow.item)||"-";
      const qty=number(doc.plan??doc.qty??batch.plan??batch.qty);
      const customer=text(doc.customer||doc.customerName||doc.client||doc.clientName||batch.customer||batch.customerName)||"-";
      const po=text(doc.customerPo||doc.customerPO||doc.po||doc.poNo||batch.po||batch.poNo)||"-";
      const due=isoDate(doc.due||doc.deliveryDate||batch.due||doc.date||batch.date)||"";
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
    if(typeof window.qmesSyncUpsert!=="function") return "local";
    try{
      await window.qmesSyncUpsert(SYNC_TYPE,RECORD_KEY,{
        module:"erp",
        schema:1,
        kind:"sales",
        rows,
        source:"WORK_ORDER",
        updatedAt:new Date().toISOString(),
        updatedBy:currentUserName()
      });
      return "shared";
    }catch(error){
      console.warn("[QMES] work-order sales shared sync failed",error);
      return "local";
    }
  }

  async function apply(){
    const rows=buildRows();
    if(rows===null) return null;
    writeLocal(rows);
    const status=await writeShared(rows);
    window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",source:"WORK_ORDER",rows:rows.length}}));
    return {rows,status};
  }

  /* Wait briefly for production.jsx/common state to become available. */
  let attempts=0;
  const timer=window.setInterval(async()=>{
    attempts+=1;
    const result=await apply();
    if(result!==null){
      window.clearInterval(timer);
      resolveReady(result);
      return;
    }
    if(attempts>=80){
      window.clearInterval(timer);
      writeLocal([]);
      resolveReady({rows:[],status:"local"});
    }
  },100);

  /* Keep Sales synchronized when a work order changes later in the same session. */
  ["qmes:workorder-saved","qmes:workorder-synced","qmes:workorder-updated"].forEach(name=>{
    window.addEventListener(name,()=>{apply();});
  });
})();
