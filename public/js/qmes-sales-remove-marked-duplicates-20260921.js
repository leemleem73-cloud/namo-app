/* QMES Sales - remove user-marked duplicate legacy SO rows - 2026-09-21
 * ADD-ONLY patch. Canonical 3-digit SO rows are preserved.
 */
(function(){
  "use strict";
  if(window.__QMES_REMOVE_MARKED_SALES_DUPLICATES_20260921__) return;
  window.__QMES_REMOVE_MARKED_SALES_DUPLICATES_20260921__=true;

  const SALES="qmes-erp-sales-v1";
  const META="qmes-sales-order-meta-v1";
  const DELETED="qmes-sales-deleted-v1";
  const TYPE="inventory";
  const RECORD_KEY="erp:sales";

  const REMOVE_IDS=new Set([
    "SO-260202-05",
    "SO-260202-04",
    "SO-260202-03",
    "SO-260202-02",
    "SO-260202-01",
    "SO-251204-01",
    "SO-250806-02",
    "SO-250806-01",
    "SO-250714-01",
    "SO-250630-02",
    "SO-250630-01",
    "SO-250526-02",
    "SO-250526-01"
  ]);

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();

  function read(key,fallback){
    try{
      const value=JSON.parse(localStorage.getItem(key)||"null");
      return value==null?fallback:value;
    }catch(_){
      return fallback;
    }
  }

  function rowIds(row){
    const m=row&&row.orderMeta&&typeof row.orderMeta==="object"?row.orderMeta:{};
    return [
      clean(row&&row.id),
      clean(m.salesOrderIdOverride)
    ].filter(Boolean);
  }

  function shouldRemove(row){
    return rowIds(row).some(id=>REMOVE_IDS.has(id));
  }

  function filterRows(rows){
    return (Array.isArray(rows)?rows:[]).filter(row=>!shouldRemove(row));
  }

  function markDeleted(){
    const current=read(DELETED,[]);
    const list=Array.isArray(current)?current.slice():[];
    const existing=new Set(list.map(x=>clean(x&&x.id)).filter(Boolean));
    REMOVE_IDS.forEach(id=>{
      if(!existing.has(id)){
        list.push({id,reason:"duplicate-legacy-so",deletedAt:new Date().toISOString()});
        existing.add(id);
      }
    });
    localStorage.setItem(DELETED,JSON.stringify(list));
  }

  function cleanLocal(){
    const before=read(SALES,[]);
    const after=filterRows(before);
    localStorage.setItem(SALES,JSON.stringify(after));

    const meta=read(META,{});
    if(meta&&typeof meta==="object"&&!Array.isArray(meta)){
      Object.keys(meta).forEach(key=>{
        const item=meta[key];
        const override=clean(item&&item.salesOrderIdOverride);
        if(REMOVE_IDS.has(clean(key))||REMOVE_IDS.has(override)) delete meta[key];
      });
      localStorage.setItem(META,JSON.stringify(meta));
    }

    return {before:Array.isArray(before)?before.length:0,after:after.length};
  }

  let running=false;
  let lastSharedSignature="";

  async function cleanShared(){
    if(typeof window.qmesSyncList!=="function" || typeof window.qmesSyncUpsert!=="function") return false;

    const records=await window.qmesSyncList(TYPE);
    const found=(Array.isArray(records)?records:[]).find(r=>clean(r&&r.record_key)===RECORD_KEY);
    let payload=found&&found.payload;
    if(typeof payload==="string"){
      try{payload=JSON.parse(payload)}catch(_){payload=null}
    }
    if(!payload||!Array.isArray(payload.rows)) return false;

    const before=payload.rows;
    const after=filterRows(before);
    const signature=after.map(row=>rowIds(row)[0]).join("|");

    if(after.length===before.length){
      lastSharedSignature=signature;
      return true;
    }
    if(signature===lastSharedSignature) return true;

    await window.qmesSyncUpsert(TYPE,RECORD_KEY,{
      ...payload,
      module:payload.module||"erp",
      schema:payload.schema||1,
      kind:payload.kind||"sales",
      rows:after,
      savedAt:new Date().toISOString(),
      source:"REMOVE_MARKED_DUPLICATES_20260921"
    });
    lastSharedSignature=signature;
    return true;
  }

  async function apply(){
    if(running) return;
    running=true;
    try{
      markDeleted();
      const localResult=cleanLocal();

      try{
        await cleanShared();
      }catch(error){
        console.warn("[QMES] marked duplicate shared cleanup retry:",error&&error.message);
      }

      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{
        detail:{
          module:"sales",
          reason:"remove-marked-duplicates-20260921",
          removed:Array.from(REMOVE_IDS),
          localBefore:localResult.before,
          localAfter:localResult.after
        }
      }));
      window.dispatchEvent(new CustomEvent("qmes:data-updated",{
        detail:{module:"sales",reason:"remove-marked-duplicates-20260921"}
      }));
    }finally{
      running=false;
    }
  }

  function boot(){
    apply();
    [400,1200,3000,7000,15000].forEach(ms=>setTimeout(apply,ms));
    window.addEventListener("qmes:shared-sync-complete",()=>setTimeout(apply,100));
    window.addEventListener("qmes:erp-data-changed",event=>{
      if(event&&event.detail&&event.detail.reason==="remove-marked-duplicates-20260921") return;
      setTimeout(apply,100);
    });
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();