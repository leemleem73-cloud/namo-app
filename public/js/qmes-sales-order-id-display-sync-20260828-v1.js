/* NAMO QMES - Sales/Delivery final UI owner V6 - 2026-08-28
 * Final owner for Sales list status, KPI, equal cells, typography and alignment.
 * Actual shipment closes due status and production plan.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_FINAL_UI_OWNER_20260828_V6__)return;
  window.__QMES_SALES_FINAL_UI_OWNER_20260828_V6__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const SHIPPING_KEY="qmes-erp-shipping-v1";
  const STYLE_ID="qmes-sales-final-ui-owner-20260828-v6";
  const DAY=86400000;

  /* Confirmed historical correction supplied by the user. */
  const CONFIRMED={
    "SO-20260114-001":{
      actualShipDate:"2026-01-15",
      shipping:"출하완료",
      delivery:"납품완료",
      plan:"생산완료"
    }
  };

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/,/g,""));return Number.isFinite(n)?n:0;};
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const write=(key,v)=>{try{localStorage.setItem(key,JSON.stringify(v));return true;}catch(_){return false;}};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const metas=()=>{const v=read(META_KEY,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const ships=()=>{const v=read(SHIPPING_KEY,[]);return Array.isArray(v)?v:[];};
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);
  const isoDate=v=>{const m=clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`:"";};
  const dateMs=v=>{const d=isoDate(v);if(!d)return null;const t=new Date(d+"T00:00:00").getTime();return Number.isFinite(t)?t:null;};
  const todayMs=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime();};

  function metaFor(row,map){
    const id=clean(row?.id),key=rowKey(row);
    return map[key]||map[id]||row?.orderMeta||{};
  }

  function visibleId(row,map){return clean(metaFor(row,map)?.salesOrderIdOverride)||clean(row?.id);}

  function findRow(candidate,list,map){
    const id=clean(candidate);if(!id)return null;
    return list.find(row=>{
      const stored=clean(row?.id),key=rowKey(row),shown=visibleId(row,map);
      return stored===id||key===id||shown===id;
    })||null;
  }

  function applyConfirmed(){
    const list=rows(),map=metas();
    let changed=false,mapChanged=false;
    const next=list.map(row=>{
      const id=clean(row?.id),key=rowKey(row),shown=visibleId(row,map);
      const fix=CONFIRMED[shown]||CONFIRMED[id]||CONFIRMED[key];
      if(!fix)return row;
      const base=metaFor(row,map);
      const nextMeta={
        ...base,
        actualShipment:true,
        actualShipDate:fix.actualShipDate,
        shippingStatus:fix.shipping,
        deliveryStatus:fix.delivery,
        productionPlanStatus:fix.plan,
        shipmentCorrectionSource:"confirmed-user-correction-20260828"
      };
      if(id){map[id]=nextMeta;mapChanged=true;}
      if(key&&key!==id){map[key]=nextMeta;mapChanged=true;}
      const nextRow={
        ...row,
        plan:fix.plan,
        shipping:fix.shipping,
        delivery:fix.delivery,
        actualShipment:true,
        actualShipDate:fix.actualShipDate,
        shipDate:fix.actualShipDate,
        orderMeta:{...(row?.orderMeta||{}),...nextMeta}
      };
      if(JSON.stringify(nextRow)!==JSON.stringify(row))changed=true;
      return nextRow;
    });
    if(mapChanged)write(META_KEY,map);
    if(changed)write(SALES_KEY,next);
    return {list:changed?next:list,map};
  }

  function isCompleteState(v){return /출하완료|납품완료|배송완료|출고완료/.test(clean(v));}

  function shipmentFor(row,map,shippingRows){
    if(!row)return null;
    const meta=metaFor(row,map);
    const localState=[row?.shipping,row?.delivery,meta?.shippingStatus,meta?.deliveryStatus].map(clean).join(" ");
    if(row?.actualShipment===true||meta?.actualShipment===true||isCompleteState(localState)){
      const d=isoDate(row?.actualShipDate||row?.shipDate||meta?.actualShipDate||meta?.shipDate);
      return {complete:true,date:d,source:"sales"};
    }

    const ids=new Set([clean(row?.id),rowKey(row),visibleId(row,map)].filter(Boolean));
    const wo=rowKey(row);
    const matches=shippingRows.filter(ship=>{
      const state=[ship?.delivery,ship?.shipping,ship?.status].map(clean).join(" ");
      if(!(ship?.actualShipment===true||isCompleteState(state)))return false;
      const sid=clean(ship?.sales||ship?.salesOrder||ship?.salesOrderId);
      const swo=clean(ship?.workOrder||ship?.lot);
      return (sid&&ids.has(sid))||(wo&&swo===wo);
    });
    if(!matches.length)return null;
    matches.sort((a,b)=>String(isoDate(b?.actualShipDate||b?.shipDate||b?.actualDate||b?.date||b?.completedAt)).localeCompare(String(isoDate(a?.actualShipDate||a?.shipDate||a?.actualDate||a?.date||a?.completedAt))));
    const ship=matches[0];
    return {complete:true,date:isoDate(ship?.actualShipDate||ship?.shipDate||ship?.actualDate||ship?.date||ship?.completedAt),source:"shipping"};
  }

  function dueFor(row,map){return isoDate(row?.due||metaFor(row,map)?.requestedDue);}

  function dueState(row,map,ship){
    const due=dueFor(row,map);
    if(ship?.complete){
      const actual=isoDate(ship.date);
      if(!due||!actual)return {label:"납기완료",tone:"good"};
      const diff=Math.round((dateMs(actual)-dateMs(due))/DAY);
      return diff<=0?{label:"납기완료",tone:"good"}:{label:`지연완료 ${diff}일`,tone:"bad"};
    }
    if(!due)return {label:"-",tone:"neutral"};
    const diff=Math.round((dateMs(due)-todayMs())/DAY);
    if(diff<0)return {label:`지연 ${Math.abs(diff)}일`,tone:"bad"};
    if(diff<=7)return {label:`임박 D-${diff}`,tone:"warn"};
    return {label:"정상",tone:"good"};
  }

  function ensureStyle(){
    let style=document.getElementById(STYLE_ID);
    if(!style){style=document.createElement("style");style.id=STYLE_ID;document.head.appendChild(style);}
    style.textContent=`
      .qmes-sales-stable .qerp-table{width:100%!important;min-width:0!important;table-layout:fixed!important;border-collapse:collapse!important}
      .qmes-sales-stable .qerp-table thead tr,.qmes-sales-stable .qerp-table tbody tr{height:46px!important}
      .qmes-sales-stable .qerp-table th,.qmes-sales-stable .qerp-table td{height:46px!important;padding:8px 6px!important;font-family:inherit!important;font-size:12px!important;font-weight:700!important;line-height:1.25!important;letter-spacing:0!important;text-align:center!important;vertical-align:middle!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;box-sizing:border-box!important}
      .qmes-sales-stable .qerp-table th *,.qmes-sales-stable .qerp-table td *{font-family:inherit!important;font-size:12px!important;line-height:1.25!important;text-align:center!important;vertical-align:middle!important}
      .qmes-sales-stable .qerp-table td:first-child{ text-align:center!important }
      .qmes-sales-stable .qerp-table .qmes-sales-order-link,.qmes-sales-stable .qerp-table .qmes-sales-plain-status,.qmes-sales-stable .qerp-table .qmes-sales-packaging-text,.qmes-sales-stable .qerp-table .qmes-sales-packaging-missing{font-size:12px!important;text-align:center!important}
      .qmes-sales-stable .qerp-table .qmes-sales-action-wrap{display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;width:100%!important}
      .qmes-sales-stable .qerp-table .qmes-sales-edit-btn,.qmes-sales-stable .qerp-table .qmes-sales-delete-btn{font-size:12px!important;line-height:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;height:28px!important;padding:0 7px!important}
    `;
    if(style.parentNode===document.head)document.head.appendChild(style);
  }

  function setImportant(el,prop,value){try{el?.style?.setProperty(prop,value,"important");}catch(_){}}

  function forceTableGeometry(table){
    if(!table)return;
    setImportant(table,"width","100%");
    setImportant(table,"min-width","0");
    setImportant(table,"table-layout","fixed");
    setImportant(table,"border-collapse","collapse");

    const headers=Array.from(table.querySelectorAll("thead th"));
    const poIndex=headers.findIndex(th=>clean(th.textContent)==="고객 PO");
    if(poIndex>=0){
      setImportant(headers[poIndex],"display","none");
      table.querySelectorAll("tbody tr").forEach(tr=>setImportant(tr.children?.[poIndex],"display","none"));
    }

    const visibleHeaders=headers.filter(th=>getComputedStyle(th).display!=="none");
    const count=Math.max(1,visibleHeaders.length);
    const width=(100/count).toFixed(6)+"%";

    headers.forEach((th,index)=>{
      if(index===poIndex)return;
      ["width","min-width","max-width"].forEach(prop=>setImportant(th,prop,width));
      setImportant(th,"height","46px");
      setImportant(th,"padding","8px 6px");
      setImportant(th,"font-size","12px");
      setImportant(th,"font-weight","700");
      setImportant(th,"line-height","1.25");
      setImportant(th,"text-align","center");
      setImportant(th,"vertical-align","middle");
    });

    table.querySelectorAll("tbody tr").forEach(tr=>{
      setImportant(tr,"height","46px");
      Array.from(tr.children).forEach((td,index)=>{
        if(index===poIndex)return;
        ["width","min-width","max-width"].forEach(prop=>setImportant(td,prop,width));
        setImportant(td,"height","46px");
        setImportant(td,"padding","8px 6px");
        setImportant(td,"font-size","12px");
        setImportant(td,"font-weight","700");
        setImportant(td,"line-height","1.25");
        setImportant(td,"text-align","center");
        setImportant(td,"vertical-align","middle");
        td.querySelectorAll("a,button,span,b,strong,div").forEach(node=>{
          setImportant(node,"font-size","12px");
          setImportant(node,"line-height","1.25");
          setImportant(node,"text-align","center");
        });
      });
    });
  }

  function tableHeaders(table){return Array.from(table?.querySelectorAll("thead th")||[]).map(th=>clean(th.textContent));}
  function hIndex(table,label){return tableHeaders(table).findIndex(v=>v===label||v.includes(label));}
  function salesTables(){
    return Array.from(document.querySelectorAll(".qmes-sales-stable table")).filter(table=>hIndex(table,"수주번호")>=0);
  }

  function setStatus(cell,text,tone){
    if(!cell)return;
    const target=cell.querySelector(".qmes-sales-plain-status,span,b,strong,a,button")||cell;
    if(clean(target.textContent)!==text)target.textContent=text;
    if(target.classList){target.classList.remove("good","warn","bad","neutral");target.classList.add("qmes-sales-plain-status",tone||"neutral");}
  }

  function syncKpis(list,map,shippingRows){
    const root=document.querySelector(".qmes-sales-stable");if(!root)return;
    const info=list.map(row=>({row,ship:shipmentFor(row,map,shippingRows)}));
    const incomplete=info.filter(x=>!x.ship?.complete);
    const now=todayMs();
    const dueSoon=incomplete.filter(x=>{const due=dateMs(dueFor(x.row,map));if(due==null)return false;const diff=Math.round((due-now)/DAY);return diff>=0&&diff<=7;}).length;
    const risk=incomplete.filter(x=>{const due=dateMs(dueFor(x.row,map));return (due!=null&&now>due)||/위험|지연|차단/.test(clean(x.row?.shipping));}).length;
    const samples=info.filter(x=>x.ship?.complete&&dateMs(dueFor(x.row,map))!=null&&dateMs(x.ship.date)!=null);
    const compliant=samples.filter(x=>dateMs(x.ship.date)<=dateMs(dueFor(x.row,map))).length;
    const compliance=samples.length?(compliant/samples.length*100).toFixed(1)+"%":"-";
    const kg=list.reduce((sum,row)=>sum+num(row?.qty),0);
    const tons=(kg/1000).toFixed(2).replace(/0+$/,"" ).replace(/\.$/,"")+"t";

    const values={
      "진행 수주":incomplete.length+"건",
      "7일 이내 납기":dueSoon+"건",
      "납기 준수율":compliance,
      "지연 위험":risk+"건",
      "수주량 합계":tons
    };
    root.querySelectorAll(".qerp-kpi").forEach(card=>{
      const label=clean(card.querySelector("span")?.textContent);
      const value=card.querySelector("b");
      if(value&&Object.prototype.hasOwnProperty.call(values,label)&&clean(value.textContent)!==values[label])value.textContent=values[label];
    });
  }

  let running=false;
  function sync(){
    if(running)return;
    running=true;
    try{
      ensureStyle();
      const corrected=applyConfirmed();
      const list=corrected.list,map=corrected.map,shippingRows=ships();

      salesTables().forEach(table=>{
        const orderIndex=hIndex(table,"수주번호");
        const dueIndex=hIndex(table,"납기상태");
        const planIndex=hIndex(table,"생산계획");
        const shipIndex=hIndex(table,"출하상태");
        forceTableGeometry(table);

        table.querySelectorAll("tbody tr").forEach(tr=>{
          const orderCell=tr.children?.[orderIndex];if(!orderCell)return;
          const anchor=orderCell.querySelector("[data-qso-id],.qmes-sales-order-link,a,b,strong");
          const candidates=[anchor?.getAttribute?.("data-qso-id"),anchor?.getAttribute?.("data-qso-visible-id"),anchor?.textContent,orderCell.textContent].map(clean).filter(Boolean);
          let row=null;
          for(const id of candidates){row=findRow(id,list,map);if(row)break;}
          if(!row)return;

          const shown=visibleId(row,map);
          if(anchor&&shown&&clean(anchor.textContent)!==shown)anchor.textContent=shown;
          anchor?.setAttribute?.("data-qso-visible-id",shown);

          const ship=shipmentFor(row,map,shippingRows);
          const state=dueState(row,map,ship);
          if(dueIndex>=0)setStatus(tr.children?.[dueIndex],state.label,state.tone);
          if(ship?.complete&&planIndex>=0)setStatus(tr.children?.[planIndex],"생산완료","good");
          if(ship?.complete&&shipIndex>=0)setStatus(tr.children?.[shipIndex],"출하완료","good");
        });

        /* Apply once more after status DOM updates. */
        forceTableGeometry(table);
      });

      syncKpis(list,map,shippingRows);
    }finally{running=false;}
  }

  let queued=false;
  function schedule(delay=0){
    if(delay){setTimeout(()=>schedule(0),delay);return;}
    if(queued)return;
    queued=true;
    const run=()=>{queued=false;sync();};
    if(typeof requestAnimationFrame==="function")requestAnimationFrame(run);else setTimeout(run,0);
  }

  function start(){
    ensureStyle();
    sync();
    [80,180,350,700,1200,2200,4000].forEach(ms=>schedule(ms));
    const observer=new MutationObserver(mutations=>{
      if(mutations.some(m=>m.type==="childList"||m.type==="characterData"))schedule();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    window.__QMES_SALES_FINAL_UI_OBSERVER_20260828_V6__=observer;
  }

  ["qmes:erp-data-changed","qmes:erp-runtime-loaded","qmes:mes-master-ready","qmes:enterprise-ui-ready","qmes:shared-sync-complete"].forEach(name=>window.addEventListener(name,()=>schedule()));
  window.addEventListener("storage",event=>{if([SALES_KEY,META_KEY,SHIPPING_KEY].includes(event.key))schedule();});
  window.addEventListener("hashchange",()=>schedule(80));
  window.addEventListener("popstate",()=>schedule(80));
  document.addEventListener("click",()=>schedule(120),true);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  window.qmesSalesOrderIdDisplaySync={sync,schedule};
})();
