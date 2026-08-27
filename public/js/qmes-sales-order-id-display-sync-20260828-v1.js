/* NAMO QMES - Sales order ID display sync V1 - 2026-08-28
 * ADD-ONLY hotfix.
 * Keeps the Sales list's displayed order number aligned with the canonical
 * salesOrderIdOverride already used by the edit/detail screens.
 * Stable data-qso-id / workOrder identity is intentionally not rewritten.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ORDER_ID_DISPLAY_SYNC_20260828_V1__)return;
  window.__QMES_SALES_ORDER_ID_DISPLAY_SYNC_20260828_V1__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_error){return fallback;}};
  const salesRows=()=>{const value=read(SALES_KEY,[]);return Array.isArray(value)?value:[];};
  const metaMap=()=>{const value=read(META_KEY,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{};};
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);

  function metaFor(row,map){
    const id=clean(row?.id),key=rowKey(row);
    return map[key]||map[id]||row?.orderMeta||{};
  }

  function visibleId(row,map){
    return clean(metaFor(row,map)?.salesOrderIdOverride)||clean(row?.id);
  }

  function findRow(candidate,list,map){
    const id=clean(candidate);if(!id)return null;
    return list.find(row=>{
      const stored=clean(row?.id),key=rowKey(row),shown=visibleId(row,map);
      return stored===id||key===id||shown===id;
    })||null;
  }

  function canonicalId(candidate,list,map){
    const id=clean(candidate);if(!id)return "";
    const direct=clean(map[id]?.salesOrderIdOverride);
    if(direct)return direct;
    const row=findRow(id,list,map);
    if(row)return visibleId(row,map)||id;
    const key=Object.keys(map).find(item=>clean(map[item]?.salesOrderIdOverride)===id);
    return key?id:"";
  }

  function headerIndex(table){
    const headers=Array.from(table?.querySelectorAll("thead th")||[]).map(th=>clean(th.textContent));
    return headers.findIndex(text=>text==="수주번호"||text.includes("수주번호"));
  }

  function salesTables(){
    const roots=Array.from(document.querySelectorAll(".qmes-sales-stable,.qerp")).filter(root=>{
      const title=clean(root.querySelector(".qerp-title")?.textContent);
      return root.classList.contains("qmes-sales-stable")||(/수주/.test(title)&&/납기/.test(title));
    });
    const tables=[];
    roots.forEach(root=>root.querySelectorAll("table").forEach(table=>{if(headerIndex(table)>=0&&!tables.includes(table))tables.push(table);}));
    return tables;
  }

  function setCellId(cell,canonical){
    if(!cell||!canonical)return false;
    const preferred=cell.querySelector(".qmes-sales-order-link,[data-qso-id],a,b,strong");
    const current=clean(preferred?.textContent||cell.textContent);
    if(current===canonical){
      if(preferred?.setAttribute)preferred.setAttribute("data-qso-visible-id",canonical);
      return false;
    }
    if(preferred){
      preferred.textContent=canonical;
      preferred.setAttribute?.("data-qso-visible-id",canonical);
      return true;
    }
    if(cell.children.length===0){cell.textContent=canonical;return true;}
    const textNode=Array.from(cell.childNodes).find(node=>node.nodeType===Node.TEXT_NODE&&clean(node.textContent));
    if(textNode){textNode.textContent=canonical;return true;}
    return false;
  }

  let running=false;
  function sync(){
    if(running)return;
    running=true;
    try{
      const list=salesRows(),map=metaMap();
      salesTables().forEach(table=>{
        const index=headerIndex(table);if(index<0)return;
        table.querySelectorAll("tbody tr").forEach(tr=>{
          const cell=tr.children?.[index];if(!cell)return;
          const link=cell.querySelector(".qmes-sales-order-link,[data-qso-id]");
          const candidates=[
            link?.getAttribute?.("data-qso-id"),
            link?.getAttribute?.("data-qso-visible-id"),
            link?.textContent,
            cell.querySelector("b,strong,a")?.textContent,
            cell.textContent
          ].map(clean).filter(Boolean);
          let canonical="";
          for(const candidate of candidates){canonical=canonicalId(candidate,list,map);if(canonical)break;}
          if(canonical)setCellId(cell,canonical);
        });
      });
    }finally{running=false;}
  }

  let queued=false;
  function schedule(delay=0){
    if(delay){setTimeout(()=>schedule(0),delay);return;}
    if(queued)return;queued=true;
    const run=()=>{queued=false;sync();};
    if(typeof requestAnimationFrame==="function")requestAnimationFrame(run);else setTimeout(run,0);
  }

  const start=()=>{
    sync();
    [80,180,350,700,1200,2200].forEach(schedule);
    const observer=new MutationObserver(mutations=>{
      if(!mutations.some(item=>item.type==="childList"||item.type==="characterData"))return;
      if(document.querySelector(".qmes-sales-stable")||Array.from(document.querySelectorAll(".qerp-title")).some(node=>/수주/.test(clean(node.textContent))&&/납기/.test(clean(node.textContent))))schedule();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    window.__QMES_SALES_ORDER_ID_DISPLAY_OBSERVER_20260828_V1__=observer;
  };

  ["qmes:erp-data-changed","qmes:erp-runtime-loaded","qmes:mes-master-ready"].forEach(name=>window.addEventListener(name,()=>schedule()));
  window.addEventListener("storage",event=>{if(event.key===SALES_KEY||event.key===META_KEY)schedule();});
  window.addEventListener("hashchange",()=>schedule(80));
  window.addEventListener("popstate",()=>schedule(80));
  document.addEventListener("click",()=>schedule(120),true);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  window.qmesSalesOrderIdDisplaySync={sync,schedule};
})();
