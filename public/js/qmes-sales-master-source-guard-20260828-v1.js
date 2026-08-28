/* NAMO QMES - Sales master source guard V1 - 2026-08-28
 * ADD-ONLY PATCH. Existing Sales / Work Order / Quality / Shipping modules are not replaced.
 * Rule: Sales master owns order number, customer, product, order quantity, due date,
 *       packaging and destination. Downstream modules may add workOrder / quality / shipment status,
 *       but must never replace Sales master fields with production or OQC values.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_MASTER_SOURCE_GUARD_20260828_V1__)return;
  window.__QMES_SALES_MASTER_SOURCE_GUARD_20260828_V1__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const LINK_KEY="qmes-sales-workorder-link-v1";
  const SHIPPING_KEY="qmes-erp-shipping-v1";
  const CANONICAL_ID="SO-20260114-001";
  const LEGACY_ALIASES=new Set(["SO-20260115-001","SO-20260827-001"]);
  const ALL_IDS=new Set([CANONICAL_ID,...LEGACY_ALIASES]);

  const MASTER={
    id:CANONICAL_ID,
    customer:"현대자동차",
    product:"DBA1501",
    qty:230,
    due:"2026-01-15",
    plan:"생산완료",
    shipping:"출하완료",
    delivery:"납품완료",
    deliveryPlace:"현대자동차",
    actualShipment:true,
    actualShipDate:"2026-01-15",
    shipDate:"2026-01-15",
    source:"SALES_MASTER_CONFIRMED"
  };
  const MASTER_META={
    salesOrderIdOverride:CANONICAL_ID,
    salesOrderIdAutoRule:"USER_CONFIRMED",
    orderDate:"2026-01-14",
    requestedDue:"2026-01-15",
    customerOverride:"현대자동차",
    productOverride:"DBA1501",
    qtyOverride:230,
    deliveryPlace:"현대자동차",
    productionPlanStatus:"생산완료",
    shippingStatus:"출하완료",
    deliveryStatus:"납품완료",
    actualShipment:true,
    actualShipDate:"2026-01-15",
    masterDataOwner:"SALES",
    sourceGuard:"SALES_MASTER_SOURCE_GUARD_V1"
  };
  const MASTER_PACK={type:"기타",unitWeight:230,packageQty:1,total:230};

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const clone=v=>{try{return JSON.parse(JSON.stringify(v));}catch(_){return v;}};
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const write=(key,value)=>{try{const next=JSON.stringify(value);if(localStorage.getItem(key)!==next)localStorage.setItem(key,next);return true;}catch(_){return false;}};
  const readMap=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const same=(a,b)=>{try{return JSON.stringify(a)===JSON.stringify(b);}catch(_){return a===b;}};

  function isTargetId(value){return ALL_IDS.has(clean(value));}
  function rowVisibleId(row,map){
    const id=clean(row?.id),wo=clean(row?.workOrder);
    const meta=map[id]||map[wo]||row?.orderMeta||{};
    return clean(meta.salesOrderIdOverride)||id;
  }
  function isTargetRow(row,map){
    if(!row||typeof row!=="object")return false;
    const ids=[clean(row.id),clean(row.salesOrderId),clean(row.sales),rowVisibleId(row,map)].filter(Boolean);
    if(ids.some(isTargetId))return true;
    /* Narrow legacy signature only: the exact row that was being generated from quality/production. */
    const customer=clean(row.customer),product=clean(row.product),qty=Number(row.qty||0),due=clean(row.due);
    return customer==="현대자동차"&&product==="NBA20-HM01"&&Math.abs(qty-229.999)<0.01&&!due;
  }

  function safeTrace(row){
    if(!row||typeof row!=="object")return {};
    const out={};
    ["workOrder","linkedAt","createdAt","updatedAt","statusSource","productionLot"].forEach(key=>{if(clean(row[key]))out[key]=row[key];});
    return out;
  }

  function canonicalMeta(existing){
    return {...(existing&&typeof existing==="object"?existing:{}),...MASTER_META,savedAt:new Date().toISOString()};
  }

  function sanitizeSalesRows(input){
    const rows=Array.isArray(input)?input:[];
    const map=readMap(META_KEY);
    const targets=rows.filter(row=>isTargetRow(row,map));
    const existing=targets.find(row=>clean(row.id)===CANONICAL_ID)||targets[0]||{};
    const trace=targets.reduce((acc,row)=>Object.assign(acc,safeTrace(row)),{});
    const meta=canonicalMeta(map[CANONICAL_ID]||map[clean(existing.id)]||existing.orderMeta||{});
    const canonical={...clone(existing),...trace,...MASTER,orderMeta:meta,customerItemCode:clean(meta.customerItemCode),orderType:clean(meta.orderType)||"샘플",packaging:{...MASTER_PACK},packagingType:"기타",unitPackQty:230,packageQty:1};
    const untouched=rows.filter(row=>!isTargetRow(row,map));
    return [canonical,...untouched];
  }

  function sanitizeShippingRows(input){
    return (Array.isArray(input)?input:[]).map(row=>{
      const sid=clean(row?.sales||row?.salesOrder||row?.salesOrderId);
      if(!isTargetId(sid))return row;
      return {...row,sales:CANONICAL_ID,salesOrder:CANONICAL_ID,salesOrderId:CANONICAL_ID};
    });
  }

  function repairLocal(){
    const currentSales=read(SALES_KEY,[]);
    const nextSales=sanitizeSalesRows(currentSales);
    if(!same(currentSales,nextSales))write(SALES_KEY,nextSales);

    const meta=readMap(META_KEY);
    const priorMeta=meta[CANONICAL_ID]||Array.from(LEGACY_ALIASES).map(id=>meta[id]).find(Boolean)||{};
    const nextMeta=canonicalMeta(priorMeta);
    meta[CANONICAL_ID]=nextMeta;
    LEGACY_ALIASES.forEach(id=>{meta[id]={...nextMeta,legacyAlias:id,salesOrderIdOverride:CANONICAL_ID};});
    const targetWo=nextSales.find(row=>clean(row.id)===CANONICAL_ID)?.workOrder;
    if(clean(targetWo))meta[clean(targetWo)]={...(meta[clean(targetWo)]||{}),...nextMeta,workOrder:clean(targetWo)};
    write(META_KEY,meta);

    const pack=readMap(PACK_KEY);pack[CANONICAL_ID]={...(pack[CANONICAL_ID]||{}),...MASTER_PACK,savedAt:new Date().toISOString()};LEGACY_ALIASES.forEach(id=>delete pack[id]);write(PACK_KEY,pack);

    const remarks=readMap(REMARK_KEY);
    if(!clean(remarks[CANONICAL_ID])){const old=Array.from(LEGACY_ALIASES).map(id=>remarks[id]).find(v=>clean(v));if(old)remarks[CANONICAL_ID]=old;}
    LEGACY_ALIASES.forEach(id=>delete remarks[id]);write(REMARK_KEY,remarks);

    const links=readMap(LINK_KEY),bySales={...(links.bySales||{})},byWorkOrder={...(links.byWorkOrder||{})};
    let wo=clean(bySales[CANONICAL_ID]);
    if(!wo){for(const id of LEGACY_ALIASES){if(clean(bySales[id])){wo=clean(bySales[id]);break;}}}
    if(!wo)wo=clean(nextSales.find(row=>clean(row.id)===CANONICAL_ID)?.workOrder);
    LEGACY_ALIASES.forEach(id=>delete bySales[id]);
    if(wo){bySales[CANONICAL_ID]=wo;byWorkOrder[wo]=CANONICAL_ID;}
    write(LINK_KEY,{...links,bySales,byWorkOrder,updatedAt:new Date().toISOString()});

    const currentShipping=read(SHIPPING_KEY,[]),nextShipping=sanitizeShippingRows(currentShipping);
    if(!same(currentShipping,nextShipping))write(SHIPPING_KEY,nextShipping);

    return {rows:nextSales,shipping:nextShipping};
  }

  function sanitizeSyncRecord(record){
    if(!record||typeof record!=="object")return record;
    const key=clean(record.record_key);
    if(key!=="erp:sales"&&key!=="erp:shipping")return record;
    let payload=record.payload,wasString=typeof payload==="string";
    if(wasString){try{payload=JSON.parse(payload);}catch(_){return record;}}
    if(!payload||!Array.isArray(payload.rows))return record;
    const rows=key==="erp:sales"?sanitizeSalesRows(payload.rows):sanitizeShippingRows(payload.rows);
    const next={...payload,rows,sourceGuard:"SALES_MASTER_SOURCE_GUARD_V1"};
    return {...record,payload:wasString?JSON.stringify(next):next};
  }

  function installSyncGuards(){
    const listFn=window.qmesSyncList;
    if(typeof listFn==="function"&&!listFn.__qmesSalesMasterGuardV1){
      const original=listFn;
      const wrapped=async function(...args){
        const result=await original.apply(this,args);
        return String(args[0]||"")==="inventory"&&Array.isArray(result)?result.map(sanitizeSyncRecord):result;
      };
      wrapped.__qmesSalesMasterGuardV1=true;wrapped.__qmesOriginal=original;window.qmesSyncList=wrapped;
    }
    const upsertFn=window.qmesSyncUpsert;
    if(typeof upsertFn==="function"&&!upsertFn.__qmesSalesMasterGuardV1){
      const original=upsertFn;
      const wrapped=async function(type,key,payload,...rest){
        let next=payload;
        const recordKey=clean(key);
        if(String(type||"")==="inventory"&&(recordKey==="erp:sales"||recordKey==="erp:shipping")&&payload&&Array.isArray(payload.rows)){
          next={...payload,rows:recordKey==="erp:sales"?sanitizeSalesRows(payload.rows):sanitizeShippingRows(payload.rows),sourceGuard:"SALES_MASTER_SOURCE_GUARD_V1"};
        }
        return original.call(this,type,key,next,...rest);
      };
      wrapped.__qmesSalesMasterGuardV1=true;wrapped.__qmesOriginal=original;window.qmesSyncUpsert=wrapped;
    }
  }

  let sharedRepairing=false;
  async function repairShared(){
    if(sharedRepairing||typeof window.qmesSyncList!=="function"||typeof window.qmesSyncUpsert!=="function")return;
    sharedRepairing=true;
    try{
      const records=await window.qmesSyncList("inventory");
      for(const key of ["erp:sales","erp:shipping"]){
        const record=(Array.isArray(records)?records:[]).find(row=>clean(row?.record_key)===key);if(!record)continue;
        let payload=record.payload;if(typeof payload==="string"){try{payload=JSON.parse(payload);}catch(_){continue;}}
        if(!payload||!Array.isArray(payload.rows))continue;
        const nextRows=key==="erp:sales"?sanitizeSalesRows(payload.rows):sanitizeShippingRows(payload.rows);
        if(!same(payload.rows,nextRows))await window.qmesSyncUpsert("inventory",key,{...payload,rows:nextRows,updatedAt:new Date().toISOString(),sourceGuard:"SALES_MASTER_SOURCE_GUARD_V1"});
      }
    }catch(error){console.warn("[QMES Sales Master Guard] shared repair failed",error?.message||error);}
    finally{sharedRepairing=false;}
  }

  let repairing=false;
  function repairAndNotify(){
    if(repairing)return;
    repairing=true;
    try{repairLocal();installSyncGuards();}
    finally{repairing=false;}
  }

  repairAndNotify();
  [20,80,180,400,900,1600,2600].forEach(ms=>setTimeout(repairAndNotify,ms));
  [300,1200,3000].forEach(ms=>setTimeout(repairShared,ms));
  ["qmes:erp-runtime-loaded","qmes:erp-data-changed","qmes:mes-master-ready","qmes:enterprise-ui-ready","qmes:shared-sync-complete","qmes:sales-workorder-linked"].forEach(name=>window.addEventListener(name,()=>setTimeout(repairAndNotify,0)));
  window.addEventListener("storage",event=>{if([SALES_KEY,META_KEY,PACK_KEY,LINK_KEY,SHIPPING_KEY].includes(event.key))setTimeout(repairAndNotify,0);});

  window.qmesSalesMasterSourceGuard={repair:repairAndNotify,sanitizeSalesRows,sanitizeShippingRows,repairShared};
})();
