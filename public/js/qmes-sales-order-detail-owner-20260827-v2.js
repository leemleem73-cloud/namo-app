/* NAMO QMES - Sales order detail owner V2 - 2026-08-27
 * ADD-ONLY patch. Existing Sales/ERP source is not replaced.
 * Fixes: clicking an edited/visible sales-order number could show
 * '수주 데이터를 찾을 수 없습니다.' because the detail module only matched row.id.
 * This owner resolves visible ID, stored ID, work-order key and shared ERP rows,
 * then delegates to the existing detail renderer with the real stored row.id.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ORDER_DETAIL_OWNER_V2__) return;
  window.__QMES_SALES_ORDER_DETAIL_OWNER_V2__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const ERP_RECORD_KEY="erp:sales";
  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();

  const read=(key,fallback)=>{
    try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_error){return fallback;}
  };
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(_error){}};
  const salesRows=()=>{const value=read(SALES_KEY,[]);return Array.isArray(value)?value:[];};
  const metaMap=()=>{const value=read(META_KEY,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{};};
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);
  const metaFor=row=>{
    const map=metaMap(),id=clean(row?.id),key=rowKey(row);
    return map[key]||map[id]||row?.orderMeta||{};
  };
  const visibleId=row=>clean(metaFor(row)?.salesOrderIdOverride)||clean(row?.id);

  function findLocal(target){
    const id=clean(target);if(!id)return null;
    const map=metaMap();
    const workOrderKey=Object.keys(map).find(key=>clean(map[key]?.salesOrderIdOverride)===id)||"";
    return salesRows().find(row=>{
      const rid=clean(row?.id),key=rowKey(row),shown=visibleId(row);
      return rid===id||key===id||shown===id||(workOrderKey&&(key===workOrderKey||rid===workOrderKey));
    })||null;
  }

  function currentVisibleId(preferred){
    const wanted=clean(preferred);
    if(wanted)return wanted;
    const root=Array.from(document.querySelectorAll(".qerp")).find(node=>clean(node.querySelector(".qerp-title")?.textContent)==="수주 · 납기관리");
    const link=root?.querySelector("table.qerp-table tbody .qmes-sales-order-link,[data-qso-id]");
    return clean(link?.textContent)||clean(link?.getAttribute?.("data-qso-id"));
  }

  function rowFromScreen(target){
    const id=clean(target);if(!id)return null;
    const root=Array.from(document.querySelectorAll(".qerp")).find(node=>clean(node.querySelector(".qerp-title")?.textContent)==="수주 · 납기관리");
    const table=Array.from(root?.querySelectorAll("table.qerp-table")||[]).find(t=>/수주번호/.test(clean(t.querySelector("thead")?.textContent)));
    if(!table)return null;
    const headers=Array.from(table.querySelectorAll("thead th")).map(th=>clean(th.textContent));
    const indexOf=(...names)=>{for(const name of names){const index=headers.indexOf(name);if(index>=0)return index;}return -1;};
    const rows=Array.from(table.querySelectorAll("tbody tr"));
    const tr=rows.find(row=>{
      const first=row.children?.[indexOf("수주번호")>=0?indexOf("수주번호"):0];
      const link=first?.querySelector?.("[data-qso-id],.qmes-sales-order-link");
      return [link?.textContent,link?.getAttribute?.("data-qso-id"),first?.textContent].some(value=>clean(value)===id);
    });
    if(!tr)return null;
    const cell=(...names)=>{const i=indexOf(...names);return i>=0?clean(tr.children?.[i]?.textContent):"";};
    const qty=Number(cell("수량").replace(/[^0-9.+-]/g,""))||0;
    const map=metaMap();
    const metaKey=Object.keys(map).find(key=>clean(map[key]?.salesOrderIdOverride)===id)||id;
    const meta=map[metaKey]||map[id]||{};
    return {
      id,
      workOrder:metaKey!==id?metaKey:"",
      customer:cell("고객사"),
      po:cell("고객 PO","고객PO"),
      product:cell("제품").replace(/고객품번\s+.*$/,""),
      qty,
      due:clean(meta.requestedDue),
      plan:cell("생산계획"),
      shipping:cell("출하상태"),
      deliveryPlace:cell("납품처"),
      orderMeta:meta,
      source:"SCREEN_FALLBACK"
    };
  }

  async function refreshSharedSales(){
    if(typeof window.qmesSyncList!=="function")return [];
    try{
      const records=await window.qmesSyncList("inventory");
      const record=(Array.isArray(records)?records:[]).find(item=>clean(item?.record_key)===ERP_RECORD_KEY);
      let payload=record?.payload;
      if(typeof payload==="string"){try{payload=JSON.parse(payload);}catch(_error){payload={};}}
      const rows=payload&&payload.module==="erp"&&Array.isArray(payload.rows)?payload.rows:[];
      if(rows.length)write(SALES_KEY,rows);
      return rows;
    }catch(error){
      console.warn("[QMES Sales Detail Owner V2] shared sales lookup failed",error?.message||error);
      return [];
    }
  }

  let legacyOpen=null;
  let busy=false;
  function captureLegacy(){
    const candidate=window.qmesSalesOrderDetail?.open;
    if(typeof candidate==="function"&&candidate!==fixedOpen)legacyOpen=candidate;
  }

  async function fixedOpen(requestedId){
    const id=currentVisibleId(requestedId);
    if(!id){window.alert("수주번호를 확인하지 못했습니다.");return;}
    captureLegacy();
    let row=findLocal(id);
    if(row&&legacyOpen){legacyOpen(clean(row.id)||id);return;}

    if(busy)return;
    busy=true;
    try{
      await refreshSharedSales();
      row=findLocal(id);
      if(row&&legacyOpen){legacyOpen(clean(row.id)||id);return;}

      /* Last-resort screen row: keep the visible current order usable without native error popup. */
      const screen=rowFromScreen(id);
      if(screen&&legacyOpen){
        const list=salesRows();
        const existing=list.some(item=>clean(item?.id)===id||visibleId(item)===id);
        if(!existing)write(SALES_KEY,[screen,...list]);
        legacyOpen(id);
        return;
      }
      window.alert("수주 상세 데이터를 다시 불러오지 못했습니다. 공용 DB 연동 상태를 확인해 주세요.");
    }finally{busy=false;}
  }

  function install(){
    captureLegacy();
    if(!window.qmesSalesOrderDetail)window.qmesSalesOrderDetail={};
    window.qmesSalesOrderDetail.open=fixedOpen;
    if(typeof window.qmesSalesOrderDetail.refresh!=="function")window.qmesSalesOrderDetail.refresh=()=>{};
  }

  /* Window capture fires before the older document-capture detail handler. */
  window.addEventListener("click",event=>{
    const target=event.target;if(!(target instanceof Element))return;
    const link=target.closest(".qmes-sales-order-link,[data-qso-id]");
    if(link&&link.closest(".qmes-sales-stable,.qerp")){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      fixedOpen(clean(link.textContent)||clean(link.getAttribute("data-qso-id")));
      return;
    }
    const progress=target.closest("#qmes-sales-progress-button-20260826");
    if(progress){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      fixedOpen(currentVisibleId(""));
    }
  },true);

  const start=()=>{install();[80,250,600,1200].forEach(delay=>setTimeout(install,delay));};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  ["qmes:erp-runtime-loaded","qmes:erp-data-changed","qmes:mes-master-ready"].forEach(name=>window.addEventListener(name,()=>setTimeout(install,0)));
})();
