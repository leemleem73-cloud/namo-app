/* QMES Sales duplicate cleanup - 2026-09-21
 * Additive cleanup patch. Keeps the canonical 3-digit SO number when the same
 * sales row exists as both -01 and -001 style records.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_DEDUP_20260921__) return;
  window.__QMES_SALES_DEDUP_20260921__=true;

  const SALES="qmes-erp-sales-v1";
  const META="qmes-sales-order-meta-v1";
  const TYPE="inventory";
  const KEY="erp:sales";
  const STANDARD="(주) 현대자동차";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};

  function normalizeCustomer(v){
    const raw=clean(v);
    const compact=raw.replace(/\s+/g,"").replace(/^주식회사/,"(주)");
    if(compact==="현대자동차" || compact==="(주)현대자동차") return STANDARD;
    return raw;
  }

  function customerKey(v){
    return normalizeCustomer(v).replace(/^\(주\)\s*/,"").replace(/\s+/g,"");
  }

  function productKey(v){
    return clean(v).replace(/\s*\[(?:kg|g)\]\s*$/i,"").replace(/\s+/g,"").toLowerCase();
  }

  function rowDate(row){
    const m=row&&row.orderMeta&&typeof row.orderMeta==="object"?row.orderMeta:{};
    const direct=clean(m.orderDate||row&&row.date);
    if(/^20\d{2}-\d{2}-\d{2}$/.test(direct)) return direct;
    const id=clean(m.salesOrderIdOverride||row&&row.id);
    let x=id.match(/^SO-(20\d{2})(\d{2})(\d{2})-/i);
    if(x) return x[1]+"-"+x[2]+"-"+x[3];
    x=id.match(/^SO-(\d{2})(\d{2})(\d{2})-/i);
    return x?"20"+x[1]+"-"+x[2]+"-"+x[3]:"";
  }

  function identity(row){
    const m=row&&row.orderMeta&&typeof row.orderMeta==="object"?row.orderMeta:{};
    const customer=normalizeCustomer(m.customerOverride||row&&row.customer);
    const product=clean(m.productOverride||row&&row.product);
    const qty=num(m.qtyOverride!=null?m.qtyOverride:row&&row.qty);
    return [rowDate(row),customerKey(customer),productKey(product),String(qty)].join("|");
  }

  function idOf(row){
    const m=row&&row.orderMeta&&typeof row.orderMeta==="object"?row.orderMeta:{};
    return clean(m.salesOrderIdOverride||row&&row.id);
  }

  function score(row){
    const id=idOf(row);
    let value=0;
    if(/^SO-\d{6,8}-\d{3}$/i.test(id)) value+=100;
    else if(/^SO-\d{6,8}-\d{2}$/i.test(id)) value+=10;
    const customer=clean((row&&row.orderMeta&&row.orderMeta.customerOverride)||row&&row.customer);
    if(customer===STANDARD) value+=20;
    if(row&&row.orderMeta&&typeof row.orderMeta==="object") value+=5;
    if(clean(row&&row.source).includes("20260918")) value+=2;
    return value;
  }

  function normalizeRow(row){
    if(!row||typeof row!=="object") return row;
    const out={...row};
    out.customer=normalizeCustomer(out.customer);
    if(out.orderMeta&&typeof out.orderMeta==="object"){
      out.orderMeta={...out.orderMeta,customerOverride:normalizeCustomer(out.orderMeta.customerOverride||out.customer)};
    }
    return out;
  }

  function dedupe(rows){
    const source=Array.isArray(rows)?rows:[];
    const winners=new Map();
    const order=[];
    const removed=[];

    source.forEach(raw=>{
      const row=normalizeRow(raw);
      const key=identity(row);
      if(!key || key.startsWith("|||")){
        order.push(row);
        return;
      }
      if(!winners.has(key)){
        winners.set(key,row);
        order.push(key);
        return;
      }
      const current=winners.get(key);
      if(score(row)>score(current)){
        winners.set(key,row);
        removed.push(idOf(current));
      }else{
        removed.push(idOf(row));
      }
    });

    const out=[];
    order.forEach(item=>{
      if(typeof item==="string"){
        const row=winners.get(item);
        if(row&&!out.includes(row)) out.push(row);
      }else{
        out.push(item);
      }
    });

    return {rows:out,removed:[...new Set(removed.filter(Boolean))]};
  }

  function read(key,fallback){
    try{
      const v=JSON.parse(localStorage.getItem(key)||"null");
      return v==null?fallback:v;
    }catch(_){return fallback;}
  }

  function writeLocal(result){
    localStorage.setItem(SALES,JSON.stringify(result.rows));
    const meta=read(META,{});
    if(meta&&typeof meta==="object"&&!Array.isArray(meta)){
      result.removed.forEach(id=>{delete meta[id];});
      result.rows.forEach(row=>{
        const id=idOf(row);
        if(id&&row.orderMeta&&typeof row.orderMeta==="object") meta[id]={...(meta[id]||{}),...row.orderMeta};
      });
      localStorage.setItem(META,JSON.stringify(meta));
    }
  }

  let running=false;
  async function cleanup(){
    if(running) return;
    running=true;
    try{
      let rows=read(SALES,[]);

      if(typeof window.qmesSyncList==="function"){
        try{
          const records=await window.qmesSyncList(TYPE);
          const found=(Array.isArray(records)?records:[]).find(r=>clean(r&&r.record_key)===KEY);
          const payload=found&&found.payload;
          if(payload&&Array.isArray(payload.rows)&&payload.rows.length) rows=payload.rows;
        }catch(_){}
      }

      const result=dedupe(rows);
      writeLocal(result);

      if(typeof window.qmesSyncUpsert==="function"){
        try{
          await window.qmesSyncUpsert(TYPE,KEY,{
            module:"erp",
            schema:1,
            kind:"sales",
            rows:result.rows,
            savedAt:new Date().toISOString(),
            source:"SALES_DEDUP_20260921"
          });
        }catch(error){
          console.warn("[QMES] sales duplicate shared cleanup retry later:",error&&error.message);
        }
      }

      if(result.removed.length){
        console.log("[QMES] duplicate sales removed:",result.removed.join(", "));
      }

      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{
        detail:{module:"sales",reason:"deduplicate-20260921",removed:result.removed}
      }));
      window.dispatchEvent(new CustomEvent("qmes:data-updated",{
        detail:{module:"sales",reason:"deduplicate-20260921"}
      }));
    }finally{
      running=false;
    }
  }

  function schedule(){
    setTimeout(cleanup,50);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();

  [500,1500,3500,7000].forEach(ms=>setTimeout(cleanup,ms));
  window.addEventListener("qmes:erp-data-changed",event=>{
    if(event&&event.detail&&event.detail.reason==="deduplicate-20260921") return;
    setTimeout(cleanup,120);
  });
})();