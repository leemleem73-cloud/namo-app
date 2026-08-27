/* NAMO QMES — Sales/Delivery rows derived from current Work Orders — 2026-08-27
 * Sales order numbers default to SO-YYYYMMDD-NNN.
 * User-edited sales order numbers are preserved by work-order keyed metadata.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_FROM_WORKORDER_READY__) return;

  const LOCAL_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const DELETED_KEY="qmes-sales-deleted-v1";
  let resolveReady;
  window.__QMES_SALES_FROM_WORKORDER_READY__=new Promise(resolve=>{resolveReady=resolve;});

  function text(value){return String(value==null?"":value).trim();}
  function number(value){const n=Number(String(value==null?"":value).replace(/,/g,""));return Number.isFinite(n)?n:0;}
  function isoDate(value){
    const s=text(value),m=s.match(/(20\d{2})[-./](\d{1,2})[-./](\d{1,2})/);
    if(!m)return "";
    return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;
  }
  function compactDate(value){return isoDate(value).replace(/-/g,"");}
  function readJson(key,fallback){try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_error){return fallback;}}
  function mapValue(key){const value=readJson(key,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{};}
  function getDb(){
    try{if(typeof DB!=="undefined"&&DB&&typeof DB==="object")return DB;}catch(_error){}
    return window.DB&&typeof window.DB==="object"?window.DB:null;
  }

  function workOrderStatus(lot,doc,batch){
    try{if(typeof getAutoWoStatus==="function")return text(getAutoWoStatus(lot));}catch(_error){}
    return text(doc?.manualStatus||doc?.status||batch?.status||"발행");
  }
  function planStatus(status){return /완료|검사중|생산중|진행중/.test(status)?"반영완료":"계획반영";}
  function lotOqcRows(db,lot){const rows=Array.isArray(db?.insp?.OQC)?db.insp.OQC:[];return rows.filter(row=>text(row?.lot)===lot);}
  function actualShipmentRecord(ship){
    if(!ship||typeof ship!=="object")return false;
    return ship.actualShipment===true||/ERP_SHIPPING|SHIPPING_MODULE/i.test(text(ship.source))||Boolean(text(ship.invoice||ship.deliveryNo));
  }
  function hasShipment(db,lot,batch){const lotRow=db?.lots?.[lot]||{};return actualShipmentRecord(lotRow.ship)||actualShipmentRecord(batch?.ship);}
  function shippingStatus(db,lot,status,batch){
    if(hasShipment(db,lot,batch))return "출하완료";
    const oqcRows=lotOqcRows(db,lot);
    if(!oqcRows.length){
      if(/완료/.test(status))return "출하검사 대기";
      if(/검사중/.test(status))return "생산검사 중";
      if(/생산중|진행중/.test(status))return "생산중";
      return "-";
    }
    const judges=oqcRows.map(row=>text(row?.judge)).filter(Boolean);
    if(judges.some(value=>/불합격|NG|FAIL/i.test(value)))return "출하차단";
    if(judges.length===oqcRows.length&&judges.every(value=>/합격|PASS|OK/i.test(value)))return "출하검사 완료";
    return "출하검사 중";
  }

  function deletedWorkOrders(){
    const list=readJson(DELETED_KEY,[]),set=new Set();
    (Array.isArray(list)?list:[]).forEach(item=>{const lot=text(item?.workOrder);if(lot)set.add(lot);});
    return set;
  }
  function metaFor(id,lot){const m=mapValue(META_KEY);return m[lot]||m[id]||{};}
  function packagingFor(id,lot){const m=mapValue(PACK_KEY);return m[lot]||m[id]||null;}
  function remarkFor(id,lot){const m=mapValue(REMARK_KEY);return text(m[lot]??m[id]);}

  function buildRows(){
    const db=getDb();if(!db)return null;
    const docs=db.woDocs&&typeof db.woDocs==="object"?db.woDocs:{};
    const batches=Array.isArray(db.batches)?db.batches:[];
    const deletedLots=deletedWorkOrders();
    const ids=[];
    Object.keys(docs).forEach(id=>{const key=text(id);if(key&&!deletedLots.has(key)&&!ids.includes(key))ids.push(key);});
    batches.forEach(row=>{const key=text(row?.no);if(key&&!deletedLots.has(key)&&!ids.includes(key))ids.push(key);});

    const raw=ids.map(lot=>{
      const doc=docs[lot]||{},batch=batches.find(row=>text(row?.no)===lot)||{},lotRow=db.lots?.[lot]||{};
      const status=workOrderStatus(lot,doc,batch);
      const productionDate=isoDate(doc.date||doc.productionDate||batch.date||batch.productionDate||lotRow.date);
      let due=isoDate(doc.due||doc.deliveryDate||batch.due||batch.deliveryDate);
      if(due&&productionDate&&due===productionDate)due="";
      return {
        customer:text(doc.customer||doc.customerName||doc.client||doc.clientName||batch.customer||batch.customerName)||"현대자동차",
        po:text(doc.customerPo||doc.customerPO||doc.po||doc.poNo||batch.po||batch.poNo)||"-",
        product:text(doc.item||batch.item||lotRow.itemName||lotRow.item)||"NBA20-HM01",
        qty:number(doc.plan??doc.qty??batch.plan??batch.qty),
        due,
        plan:planStatus(status),
        shipping:shippingStatus(db,lot,status,batch),
        source:"WORK_ORDER",workOrder:lot,productionDate,workOrderStatus:status
      };
    });

    const counters={};
    raw.sort((a,b)=>String(a.productionDate||"").localeCompare(String(b.productionDate||""))||String(a.workOrder||"").localeCompare(String(b.workOrder||"")));
    raw.forEach(row=>{
      const dateKey=compactDate(row.productionDate)||compactDate(row.due)||new Date().toISOString().slice(0,10).replace(/-/g,"");
      counters[dateKey]=(counters[dateKey]||0)+1;
      const generatedId=`SO-${dateKey}-${String(counters[dateKey]).padStart(3,"0")}`;
      const meta=metaFor(generatedId,row.workOrder);
      row.id=text(meta.salesOrderIdOverride)||generatedId;
      if(text(meta.customerOverride))row.customer=text(meta.customerOverride);
      if(text(meta.poOverride))row.po=text(meta.poOverride);
      if(text(meta.productOverride))row.product=text(meta.productOverride);
      if(number(meta.qtyOverride)>0)row.qty=number(meta.qtyOverride);
      if(isoDate(meta.requestedDue))row.due=isoDate(meta.requestedDue);
      row.orderMeta={...meta};
      row.customerItemCode=text(meta.customerItemCode);
      row.deliveryPlace=text(meta.deliveryPlace);
      row.orderType=text(meta.orderType)||"양산";
      row.orderDate=isoDate(meta.orderDate);
      const packaging=packagingFor(row.id,row.workOrder);if(packaging)row.packaging=packaging;
      const remarks=remarkFor(row.id,row.workOrder);if(remarks)row.remarks=remarks;
    });

    const deletedList=readJson(DELETED_KEY,[]),deletedIds=new Set((Array.isArray(deletedList)?deletedList:[]).map(item=>text(item?.id)).filter(Boolean));
    return raw.filter(row=>!deletedIds.has(row.id)).sort((a,b)=>String(b.productionDate||b.due||"").localeCompare(String(a.productionDate||a.due||""))||String(b.workOrder||"").localeCompare(String(a.workOrder||"")));
  }

  function writeLocal(rows){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(rows));}catch(_error){}}
  async function apply(){
    const rows=buildRows();if(rows===null)return null;
    writeLocal(rows);
    window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",source:"WORK_ORDER",rows:rows.length}}));
    return {rows,status:"derived"};
  }

  let attempts=0;
  const timer=window.setInterval(async()=>{
    attempts+=1;const result=await apply();
    if(result!==null){window.clearInterval(timer);resolveReady(result);return;}
    if(attempts>=80){window.clearInterval(timer);writeLocal([]);resolveReady({rows:[],status:"local"});}
  },100);

  ["qmes:workorder-saved","qmes:workorder-synced","qmes:workorder-updated","qmes:data-updated","qmes:erp-data-changed"].forEach(name=>{
    window.addEventListener(name,event=>{
      if(name==="qmes:erp-data-changed"&&event?.detail?.kind==="sales"&&event?.detail?.source==="WORK_ORDER")return;
      apply();
    });
  });
  window.qmesSalesFromWorkOrderApply=apply;
})();
