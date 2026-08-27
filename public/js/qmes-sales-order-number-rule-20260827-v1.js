/* NAMO QMES - Sales order number rule V1 - 2026-08-27
 * ADD-ONLY patch. Existing Sales/ERP source is not replaced.
 * Rule for WORK_ORDER-derived sales rows:
 *   - manual/explicit salesOrderIdOverride stays unchanged
 *   - otherwise order-number date = requested due date - 1 day
 *   - format = SO-YYYYMMDD-NNN
 * This prevents accidental fallback to today's date (e.g. SO-20260827-001)
 * when the actual requested due date belongs to an older production order.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ORDER_NUMBER_RULE_20260827_V1__) return;
  window.__QMES_SALES_ORDER_NUMBER_RULE_20260827_V1__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const clean=value=>String(value==null?"":value).trim();
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_error){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_error){}};
  const rows=()=>{const value=read(SALES_KEY,[]);return Array.isArray(value)?value:[];};
  const map=()=>{const value=read(META_KEY,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{};};
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);

  function iso(value){
    const s=clean(value),m=s.match(/(20\d{2})[-./](\d{1,2})[-./](\d{1,2})/);
    if(!m)return "";
    return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;
  }
  function previousDay(value){
    const d=iso(value);if(!d)return "";
    const date=new Date(`${d}T12:00:00`);if(Number.isNaN(date.getTime()))return "";
    date.setDate(date.getDate()-1);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  }
  const compact=value=>iso(value).replace(/-/g,"");
  const validSo=value=>/^SO-20\d{6}-\d{3}$/.test(clean(value));

  let running=false;
  async function normalize(){
    if(running)return;
    running=true;
    try{
      const list=rows();if(!list.length)return;
      const metaMap=map();
      const counters={};
      let changed=false;

      const next=list.map(row=>{
        const key=rowKey(row),id=clean(row?.id),meta=metaMap[key]||metaMap[id]||row?.orderMeta||{};
        const requestedDue=iso(meta.requestedDue||row?.due);
        if(!requestedDue)return row;

        /* A true manual override is preserved. Auto-rule overrides are recalculated. */
        const explicit=clean(meta.salesOrderIdOverride);
        const autoRule=clean(meta.salesOrderIdAutoRule);
        if(explicit&&autoRule!=="DUE_MINUS_1") return row;

        const orderDate=previousDay(requestedDue);
        const dateKey=compact(orderDate);if(!dateKey)return row;
        counters[dateKey]=(counters[dateKey]||0)+1;
        const seq=String(counters[dateKey]).padStart(3,"0");
        const target=`SO-${dateKey}-${seq}`;

        /* Only auto-format rows are normalized; custom manual numbers are untouched. */
        if(id&&!validSo(id)&&!explicit)return row;
        if(id===target&&explicit===target&&autoRule==="DUE_MINUS_1")return row;

        const nextMeta={...meta,salesOrderIdOverride:target,salesOrderIdAutoRule:"DUE_MINUS_1",requestedDue,orderDate:iso(meta.orderDate)||orderDate,savedAt:new Date().toISOString()};
        if(key)metaMap[key]=nextMeta;
        if(id)metaMap[id]=nextMeta;
        metaMap[target]=nextMeta;
        changed=true;
        return {...row,id:target,due:requestedDue,orderMeta:nextMeta};
      });

      if(!changed)return;
      write(META_KEY,metaMap);
      write(SALES_KEY,next);

      if(typeof window.qmesSyncUpsert==="function"){
        try{
          await window.qmesSyncUpsert("inventory","erp:sales",{module:"erp",schema:1,kind:"sales",rows:next,updatedAt:new Date().toISOString(),updatedBy:clean(window.__QMES_CURRENT_USER__?.name||window.__QMES_USER__?.name||""),source:"SALES_ORDER_NUMBER_RULE_V1"});
        }catch(error){console.warn("[QMES Sales Order Number Rule] shared save failed",error?.message||error);}
      }
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"sales",source:"SALES_ORDER_NUMBER_RULE_V1"}}));
    }finally{running=false;}
  }

  const schedule=()=>setTimeout(normalize,0);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();
  window.addEventListener("qmes:erp-runtime-loaded",schedule);
  window.addEventListener("qmes:mes-master-ready",schedule);
  window.addEventListener("qmes:erp-data-changed",event=>{if(event?.detail?.kind!=="sales"||event?.detail?.source==="SALES_ORDER_NUMBER_RULE_V1")return;schedule();});
  setTimeout(normalize,500);
  setTimeout(normalize,1400);
})();
