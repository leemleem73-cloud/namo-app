/* NAMO QMES - Sales order display/delivery sync V3 - 2026-08-28
 * Delivery status is based on actual shipment.
 * Confirmed correction: SO-20260114-001 shipped on 2026-01-15.
 * Stable data-qso-id / workOrder identity is intentionally not rewritten.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ORDER_ID_DISPLAY_SYNC_20260828_V3__)return;
  window.__QMES_SALES_ORDER_ID_DISPLAY_SYNC_20260828_V3__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const SHIPPING_KEY="qmes-erp-shipping-v1";
  const CONFIRMED_SHIPMENTS={
    "SO-20260114-001":{actualShipDate:"2026-01-15",status:"출하완료",delivery:"납품완료"}
  };

  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_error){return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_error){return false;}};
  const salesRows=()=>{const value=read(SALES_KEY,[]);return Array.isArray(value)?value:[];};
  const metaMap=()=>{const value=read(META_KEY,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{};};
  const shippingRows=()=>{const value=read(SHIPPING_KEY,[]);return Array.isArray(value)?value:[];};
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);
  const isoDate=value=>{const m=clean(value).match(/(20\d{2})[-./](\d{1,2})[-./](\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`:"";};
  const same=(a,b)=>{try{return JSON.stringify(a)===JSON.stringify(b);}catch(_error){return a===b;}};

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

  function applyConfirmedCorrections(){
    const list=salesRows();
    const map=metaMap();
    let rowsChanged=false,mapChanged=false;

    const nextRows=list.map(row=>{
      const id=clean(row?.id),key=rowKey(row),shown=visibleId(row,map);
      const fix=CONFIRMED_SHIPMENTS[shown]||CONFIRMED_SHIPMENTS[id]||CONFIRMED_SHIPMENTS[key];
      if(!fix)return row;

      const base=metaFor(row,map);
      const nextMeta={
        ...base,
        actualShipment:true,
        actualShipDate:fix.actualShipDate,
        shippingStatus:fix.status,
        deliveryStatus:fix.delivery,
        shipmentCorrectionSource:"confirmed-user-correction-20260828"
      };
      if(id&&!same(map[id],nextMeta)){map[id]=nextMeta;mapChanged=true;}
      if(key&&key!==id&&!same(map[key],nextMeta)){map[key]=nextMeta;mapChanged=true;}

      const nextRow={
        ...row,
        shipping:fix.status,
        delivery:fix.delivery,
        actualShipment:true,
        actualShipDate:fix.actualShipDate,
        shipDate:fix.actualShipDate,
        orderMeta:{...(row?.orderMeta||{}),...nextMeta}
      };
      if(!same(row,nextRow))rowsChanged=true;
      return nextRow;
    });

    if(mapChanged)write(META_KEY,map);
    if(rowsChanged)write(SALES_KEY,nextRows);
    return {list:rowsChanged?nextRows:list,map};
  }

  function headers(table){return Array.from(table?.querySelectorAll("thead th")||[]).map(th=>clean(th.textContent));}
  function headerIndex(table,label){return headers(table).findIndex(text=>text===label||text.includes(label));}

  function salesTables(){
    const roots=Array.from(document.querySelectorAll(".qmes-sales-stable,.qerp")).filter(root=>{
      const title=clean(root.querySelector(".qerp-title")?.textContent);
      return root.classList.contains("qmes-sales-stable")||(/수주/.test(title)&&/납기/.test(title));
    });
    const tables=[];
    roots.forEach(root=>root.querySelectorAll("table").forEach(table=>{if(headerIndex(table,"수주번호")>=0&&!tables.includes(table))tables.push(table);}));
    return tables;
  }

  function setCellText(cell,text,tone){
    if(!cell||!text)return false;
    const target=cell.querySelector(".qmes-sales-plain-status,span,b,strong,a,button")||cell;
    if(clean(target.textContent)!==text)target.textContent=text;
    if(target.classList&&tone){
      target.classList.remove("good","warn","bad","neutral");
      target.classList.add("qmes-sales-plain-status",tone);
    }
    return true;
  }

  function setCellId(cell,canonical){
    if(!cell||!canonical)return false;
    const preferred=cell.querySelector(".qmes-sales-order-link,[data-qso-id],a,b,strong");
    const current=clean(preferred?.textContent||cell.textContent);
    if(current===canonical){preferred?.setAttribute?.("data-qso-visible-id",canonical);return false;}
    if(preferred){preferred.textContent=canonical;preferred.setAttribute?.("data-qso-visible-id",canonical);return true;}
    if(cell.children.length===0){cell.textContent=canonical;return true;}
    const textNode=Array.from(cell.childNodes).find(node=>node.nodeType===Node.TEXT_NODE&&clean(node.textContent));
    if(textNode){textNode.textContent=canonical;return true;}
    return false;
  }

  function isShipmentComplete(ship){
    const state=`${clean(ship?.delivery)} ${clean(ship?.shipping)} ${clean(ship?.status)}`;
    return ship?.actualShipment===true||/출하완료|납품완료/.test(state);
  }

  function shipmentFor(row,map,ships){
    if(!row)return null;
    const meta=metaFor(row,map);
    const rowState=`${clean(row?.delivery)} ${clean(row?.shipping)} ${clean(meta?.deliveryStatus)} ${clean(meta?.shippingStatus)}`;
    if(row?.actualShipment===true||meta?.actualShipment===true||/출하완료|납품완료/.test(rowState)){
      const date=isoDate(row?.actualShipDate||row?.shipDate||meta?.actualShipDate||meta?.shipDate||row?.due||meta?.requestedDue);
      return {actualShipment:true,status:"출하완료",delivery:"납품완료",date,shipDate:date,actualShipDate:date,source:"SALES_CONFIRMED"};
    }

    const ids=new Set([clean(row.id),rowKey(row),visibleId(row,map)].filter(Boolean));
    const workOrder=rowKey(row);
    const matches=ships.filter(ship=>{
      if(!isShipmentComplete(ship))return false;
      const sales=clean(ship?.sales||ship?.salesOrder||ship?.salesOrderId);
      const lot=clean(ship?.lot||ship?.workOrder);
      return (sales&&ids.has(sales))||(workOrder&&lot===workOrder);
    });
    return matches.sort((a,b)=>isoDate(b?.date||b?.shipDate).localeCompare(isoDate(a?.date||a?.shipDate)))[0]||null;
  }

  function dueStateFromShipment(row,map,ship){
    const due=isoDate(row?.due||metaFor(row,map)?.requestedDue);
    if(ship&&isShipmentComplete(ship)){
      const shipped=isoDate(ship?.date||ship?.shipDate||ship?.actualShipDate||ship?.completedAt);
      if(!due||!shipped)return {label:"납기완료",tone:"good"};
      const diff=Math.round((new Date(shipped+"T00:00:00").getTime()-new Date(due+"T00:00:00").getTime())/86400000);
      return diff<=0?{label:"납기완료",tone:"good"}:{label:`지연완료 ${diff}일`,tone:"bad"};
    }
    if(!due)return {label:"-",tone:"neutral"};
    const today=new Date();today.setHours(0,0,0,0);
    const diff=Math.round((new Date(due+"T00:00:00").getTime()-today.getTime())/86400000);
    if(diff<0)return {label:`지연 ${Math.abs(diff)}일`,tone:"bad"};
    if(diff<=7)return {label:`임박 D-${diff}`,tone:"warn"};
    return {label:"정상",tone:"good"};
  }

  let running=false;
  function sync(){
    if(running)return;
    running=true;
    try{
      const corrected=applyConfirmedCorrections();
      const list=corrected.list,map=corrected.map,ships=shippingRows();
      salesTables().forEach(table=>{
        const orderIndex=headerIndex(table,"수주번호");
        const dueIndex=headerIndex(table,"납기상태");
        const shipIndex=headerIndex(table,"출하상태");
        if(orderIndex<0)return;
        table.querySelectorAll("tbody tr").forEach(tr=>{
          const orderCell=tr.children?.[orderIndex];if(!orderCell)return;
          const link=orderCell.querySelector(".qmes-sales-order-link,[data-qso-id]");
          const candidates=[link?.getAttribute?.("data-qso-id"),link?.getAttribute?.("data-qso-visible-id"),link?.textContent,orderCell.querySelector("b,strong,a")?.textContent,orderCell.textContent].map(clean).filter(Boolean);
          let row=null,canonical="";
          for(const candidate of candidates){row=findRow(candidate,list,map)||row;canonical=canonicalId(candidate,list,map)||canonical;if(row&&canonical)break;}
          if(canonical)setCellId(orderCell,canonical);
          if(!row&&canonical)row=findRow(canonical,list,map);
          if(!row)return;
          const ship=shipmentFor(row,map,ships);
          const state=dueStateFromShipment(row,map,ship);
          if(dueIndex>=0)setCellText(tr.children?.[dueIndex],state.label,state.tone);
          if(ship&&shipIndex>=0)setCellText(tr.children?.[shipIndex],"출하완료","good");
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
    window.__QMES_SALES_ORDER_ID_DISPLAY_OBSERVER_20260828_V3__=observer;
  };

  ["qmes:erp-data-changed","qmes:erp-runtime-loaded","qmes:mes-master-ready","qmes:shared-sync-complete"].forEach(name=>window.addEventListener(name,()=>schedule()));
  window.addEventListener("storage",event=>{if([SALES_KEY,META_KEY,SHIPPING_KEY].includes(event.key))schedule();});
  window.addEventListener("hashchange",()=>schedule(80));
  window.addEventListener("popstate",()=>schedule(80));
  document.addEventListener("click",()=>schedule(120),true);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  window.qmesSalesOrderIdDisplaySync={sync,schedule};
})();
