/* NAMO QMES - Sales source correction V3 - 2026-09-22
 * ADD-ONLY / IDEMPOTENT.
 * Exact source rows based on the provided shipment ledger.
 * - Repairs sourceQty/sourceUnit metadata for migrated rows.
 * - Adds only the two missing 2026-08-26 shipment rows.
 * - Does not delete unrelated user-created sales rows.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_SOURCE_CORRECTION_20260922_V3__) return;
  window.__QMES_SALES_SOURCE_CORRECTION_20260922_V3__=true;

  const SALES="qmes-erp-sales-v1";
  const META="qmes-sales-order-meta-v1";
  const TYPE="inventory";
  const RECORD="erp:sales";
  const SOURCE="SHIPMENT_LEDGER_20260922_V3";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const compact=v=>clean(v).replace(/\s+/g,"").replace(/^\(주\)/,"").toLowerCase();
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v}catch(_){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_){return false}};
  const parse=v=>{if(v&&typeof v==="object")return v;if(typeof v==="string"){try{return JSON.parse(v)}catch(_){}}return {}};

  const SOURCE_ROWS=[
    {id:"SO-250526-001",date:"2025-05-26",customer:"(주)현대자동차",product:"NBA15-HM01",sourceQty:1480,sourceUnit:"g"},
    {id:"SO-250526-002",date:"2025-05-26",customer:"(주)현대자동차",product:"NBA20-HM01",sourceQty:1640,sourceUnit:"g"},
    {id:"SO-250630-001",date:"2025-06-30",customer:"(주)현대자동차",product:"NBA15-HM01",sourceQty:550,sourceUnit:"g"},
    {id:"SO-250630-002",date:"2025-06-30",customer:"(주)현대자동차",product:"NBA20-HM01",sourceQty:550,sourceUnit:"g"},
    {id:"SO-250714-001",date:"2025-07-14",customer:"(주)현대자동차",product:"NBA20-HM01",sourceQty:1000,sourceUnit:"g"},
    {id:"SO-250806-001",date:"2025-08-06",customer:"(주)현대자동차",product:"NBA20-P4S6-HM01",sourceQty:100,sourceUnit:"g"},
    {id:"SO-250806-002",date:"2025-08-06",customer:"(주)현대자동차",product:"NBA20-S5V5-HM01",sourceQty:100,sourceUnit:"g"},
    {id:"SO-250905-001",date:"2025-09-05",customer:"(주)제이에스케미칼",product:"OZE33-JS01",sourceQty:20,sourceUnit:"kg",unitPrice:18000},
    {id:"SO-251204-001",date:"2025-12-04",customer:"(주)현대자동차",product:"절연슬러리",sourceQty:150,sourceUnit:"kg",unitPrice:20000},
    {id:"SO-251205-001",date:"2025-12-05",customer:"(주)제이에스케미칼",product:"OZE33-JS01",sourceQty:25,sourceUnit:"kg",unitPrice:18000},
    {id:"SO-260202-001",date:"2026-02-02",customer:"(주)현대자동차",product:"ADC30G(SBR)",sourceQty:64,sourceUnit:"kg"},
    {id:"SO-260202-002",date:"2026-02-02",customer:"(주)현대자동차",product:"AOH30(Boehmite)",sourceQty:12,sourceUnit:"kg"},
    {id:"SO-260202-003",date:"2026-02-02",customer:"(주)현대자동차",product:"NMP(SNET)",sourceQty:1219,sourceUnit:"kg"},
    {id:"SO-260202-004",date:"2026-02-02",customer:"(주)현대자동차",product:"절연슬러리",sourceQty:273,sourceUnit:"kg"},
    {id:"SO-260202-005",date:"2026-02-02",customer:"(주)현대자동차",product:"스피롤탄(a부, b부)",sourceQty:100,sourceUnit:"kg"},
    {id:"SO-260826-001",date:"2026-08-26",customer:"(주)현대자동차",product:"절연슬러리",sourceQty:100,sourceUnit:"kg",unitPrice:19500},
    {id:"SO-260826-002",date:"2026-08-26",customer:"(주)현대자동차",product:"절연슬러리",sourceQty:60,sourceUnit:"kg",unitPrice:19500}
  ];

  function normalizedQty(x){
    return String(x.sourceUnit).toLowerCase()==="g"?Number(x.sourceQty)/1000:Number(x.sourceQty);
  }

  function rowDate(row){
    const m=row&&row.orderMeta&&typeof row.orderMeta==="object"?row.orderMeta:{};
    return clean(m.orderDate||row&&row.orderDate||row&&row.date);
  }
  function rowCustomer(row){
    const m=row&&row.orderMeta&&typeof row.orderMeta==="object"?row.orderMeta:{};
    return compact(m.customerOverride||row&&row.customer);
  }
  function rowProduct(row){
    const m=row&&row.orderMeta&&typeof row.orderMeta==="object"?row.orderMeta:{};
    return compact(m.productOverride||row&&row.product).replace(/\[(kg|g)\]$/i,"");
  }
  function rowQty(row){
    const m=row&&row.orderMeta&&typeof row.orderMeta==="object"?row.orderMeta:{};
    const n=Number(m.qtyOverride!=null?m.qtyOverride:row&&row.qty);
    return Number.isFinite(n)?n:null;
  }
  function sameSource(row,x){
    if(clean(row&&row.id)===x.id) return true;
    return rowDate(row)===x.date &&
      rowCustomer(row)===compact(x.customer) &&
      rowProduct(row)===compact(x.product) &&
      Math.abs((rowQty(row)||0)-normalizedQty(x))<0.000001;
  }

  function makeRow(x){
    const qty=normalizedQty(x);
    const now=new Date().toISOString();
    const meta={
      salesOrderIdOverride:x.id,
      orderDate:x.date,
      customerOverride:x.customer,
      productOverride:x.product,
      qtyOverride:qty,
      requestedDue:x.date,
      confirmedDue:x.date,
      productionPlanStatus:"생산완료",
      shippingStatus:"출하완료",
      actualShipment:true,
      actualShipDate:x.date,
      unitPrice:Number(x.unitPrice||0),
      sourceQty:Number(x.sourceQty),
      sourceUnit:x.sourceUnit,
      source:SOURCE,
      savedAt:now
    };
    return {
      id:x.id,
      customer:x.customer,
      product:x.product,
      qty,
      unit:String(x.sourceUnit).toLowerCase()==="g"?"kg":x.sourceUnit,
      orderDate:x.date,
      due:x.date,
      plan:"생산완료",
      shipping:"출하완료",
      actualShipment:true,
      actualShipDate:x.date,
      unitPrice:Number(x.unitPrice||0),
      sourceQty:Number(x.sourceQty),
      sourceUnit:x.sourceUnit,
      source:SOURCE,
      orderMeta:meta,
      remarks:"출하내역 원본 연동"
    };
  }

  function repairRow(row,x){
    const qty=normalizedQty(x);
    const currentMeta=row&&row.orderMeta&&typeof row.orderMeta==="object"?row.orderMeta:{};
    return {
      ...row,
      customer:x.customer,
      product:x.product,
      qty,
      orderDate:x.date,
      due:x.date,
      actualShipment:true,
      actualShipDate:x.date,
      sourceQty:Number(x.sourceQty),
      sourceUnit:x.sourceUnit,
      unitPrice:Number(x.unitPrice||row&&row.unitPrice||0),
      orderMeta:{
        ...currentMeta,
        salesOrderIdOverride:clean(currentMeta.salesOrderIdOverride)||clean(row&&row.id)||x.id,
        orderDate:x.date,
        customerOverride:x.customer,
        productOverride:x.product,
        qtyOverride:qty,
        requestedDue:x.date,
        confirmedDue:x.date,
        actualShipment:true,
        actualShipDate:x.date,
        shippingStatus:"출하완료",
        sourceQty:Number(x.sourceQty),
        sourceUnit:x.sourceUnit,
        unitPrice:Number(x.unitPrice||currentMeta.unitPrice||0)
      }
    };
  }

  async function loadShared(){
    if(typeof window.qmesSyncList!=="function") return null;
    try{
      const records=await window.qmesSyncList(TYPE);
      const found=(Array.isArray(records)?records:[]).find(r=>clean(r&&r.record_key)===RECORD);
      const payload=found?parse(found.payload):{};
      return Array.isArray(payload.rows)?payload.rows:[];
    }catch(_){return null}
  }

  async function saveShared(rows){
    if(typeof window.qmesSyncUpsert!=="function") return false;
    try{
      await window.qmesSyncUpsert(TYPE,RECORD,{
        module:"erp",schema:3,kind:"sales",rows,
        updatedAt:new Date().toISOString(),
        updatedBy:clean(window.__QMES_CURRENT_USER__&&window.__QMES_CURRENT_USER__.name)||"QMES",
        source:SOURCE
      });
      return true;
    }catch(error){
      console.warn("[QMES Sales source correction] shared save failed",error);
      return false;
    }
  }

  function syncMeta(rows){
    const raw=read(META,{}),map=raw&&typeof raw==="object"&&!Array.isArray(raw)?{...raw}:{};
    for(const row of rows){
      if(!row||!row.orderMeta) continue;
      const id=clean(row.id);
      if(id) map[id]={...(map[id]||{}),...row.orderMeta};
      const shown=clean(row.orderMeta.salesOrderIdOverride);
      if(shown) map[shown]={...(map[shown]||{}),...row.orderMeta};
    }
    write(META,map);
  }

  async function run(){
    const remote=await loadShared();
    const local=read(SALES,[]);
    let rows=(Array.isArray(remote)&&remote.length?remote:Array.isArray(local)?local:[]).slice();
    let changed=false;

    for(const x of SOURCE_ROWS){
      const idx=rows.findIndex(r=>sameSource(r,x));
      if(idx>=0){
        const next=repairRow(rows[idx],x);
        if(JSON.stringify(next)!==JSON.stringify(rows[idx])){rows[idx]=next;changed=true}
      }else{
        rows.push(makeRow(x));
        changed=true;
      }
    }

    rows.sort((a,b)=>rowDate(b).localeCompare(rowDate(a))||clean(b&&b.id).localeCompare(clean(a&&a.id),undefined,{numeric:true}));
    write(SALES,rows);
    syncMeta(rows);
    if(changed) await saveShared(rows);

    if(changed){
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",reason:"shipment-source-correction-v3"}}));
      window.dispatchEvent(new CustomEvent("qmes:data-updated",{detail:{kind:"sales",reason:"shipment-source-correction-v3"}}));
    }
    return {changed,total:rows.length};
  }

  function schedule(){
    [150,800,1800].forEach(ms=>setTimeout(run,ms));
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
  ["qmes:erp-runtime-loaded","qmes:mes-master-ready","qmes:shared-sync-complete"].forEach(name=>window.addEventListener(name,schedule));

  window.qmesSalesSourceCorrection20260922V3={run};
})();