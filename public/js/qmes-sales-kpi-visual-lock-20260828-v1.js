/* NAMO QMES - Sales KPI visual lock V1 - 2026-08-28
 * APPEND-ONLY PATCH. Existing sales/runtime/traceability logic is not replaced.
 * Purpose: keep the final KPI values visually stable even when legacy scripts
 * rewrite the underlying <b> text after React/master-loader updates.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_KPI_VISUAL_LOCK_20260828_V1__)return;
  window.__QMES_SALES_KPI_VISUAL_LOCK_20260828_V1__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const SHIPPING_KEY="qmes-erp-shipping-v1";
  const STYLE_ID="qmes-sales-kpi-visual-lock-style-20260828-v1";
  const DAY=86400000;
  const CONFIRMED={"SO-20260114-001":"2026-01-15"};

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const num=v=>{const n=Number(String(v==null?"":v).replace(/,/g,""));return Number.isFinite(n)?n:0;};
  const iso=v=>{const m=clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`:"";};
  const ms=v=>{const d=iso(v);if(!d)return null;const t=new Date(d+"T00:00:00").getTime();return Number.isFinite(t)?t:null;};
  const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime();};

  function salesRows(){const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];}
  function metaMap(){const v=read(META_KEY,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};}
  function shippingRows(){const v=read(SHIPPING_KEY,[]);return Array.isArray(v)?v:[];}
  function rowKey(row){return clean(row?.workOrder)||clean(row?.id);}
  function metaFor(row,map){const id=clean(row?.id),key=rowKey(row);return map[id]||map[key]||row?.orderMeta||{};}
  function salesId(row,map){return clean(metaFor(row,map)?.salesOrderIdOverride)||clean(row?.id);}
  function dueDate(row,map){return iso(row?.due||metaFor(row,map)?.requestedDue);}
  function completeText(v){return /출하완료|납품완료|배송완료|출고완료/.test(clean(v));}

  function shipmentFor(row,map,ships){
    const meta=metaFor(row,map),sid=salesId(row,map),raw=clean(row?.id),wo=rowKey(row);
    const localState=[row?.shipping,row?.delivery,meta?.shippingStatus,meta?.deliveryStatus].map(clean).join(" ");
    const localDate=iso(row?.actualShipDate||row?.shipDate||meta?.actualShipDate||meta?.shipDate||CONFIRMED[sid]||CONFIRMED[raw]);
    if(row?.actualShipment===true||meta?.actualShipment===true||completeText(localState)||CONFIRMED[sid]||CONFIRMED[raw]){
      return {complete:true,date:localDate};
    }
    const found=ships.find(ship=>{
      const state=[ship?.delivery,ship?.shipping,ship?.status].map(clean).join(" ");
      if(!(ship?.actualShipment===true||completeText(state)))return false;
      const shipSales=clean(ship?.sales||ship?.salesOrder||ship?.salesOrderId);
      const shipWo=clean(ship?.workOrder||ship?.lot);
      return (shipSales&&(shipSales===sid||shipSales===raw))||(wo&&shipWo===wo);
    });
    return found?{complete:true,date:iso(found?.actualShipDate||found?.shipDate||found?.actualDate||found?.date||found?.completedAt)}:null;
  }

  function values(){
    const list=salesRows(),map=metaMap(),ships=shippingRows(),now=today();
    const info=list.map(row=>({row,ship:shipmentFor(row,map,ships)}));
    const incomplete=info.filter(x=>!x.ship?.complete);

    const dueSoon=incomplete.filter(x=>{
      const d=ms(dueDate(x.row,map));if(d==null)return false;
      const diff=Math.round((d-now)/DAY);
      return diff>=0&&diff<=7;
    }).length;

    const risk=incomplete.filter(x=>{
      const d=ms(dueDate(x.row,map));
      return (d!=null&&now>d)||/위험|지연|차단/.test(clean(x.row?.shipping));
    }).length;

    const samples=info.filter(x=>x.ship?.complete&&ms(dueDate(x.row,map))!=null&&ms(x.ship.date)!=null);
    const compliant=samples.filter(x=>ms(x.ship.date)<=ms(dueDate(x.row,map))).length;
    const compliance=samples.length?(compliant/samples.length*100).toFixed(1)+"%":"-";

    const kg=list.reduce((sum,row)=>sum+num(row?.qty),0);
    const tons=(kg/1000).toFixed(2).replace(/0+$/,"" ).replace(/\.$/,"")+"t";

    return {
      "진행 수주":incomplete.length+"건",
      "7일 이내 납기":dueSoon+"건",
      "납기 준수율":compliance,
      "지연 위험":risk+"건",
      "수주량 합계":tons
    };
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-sales-stable .qerp-kpi b[data-qmes-kpi-lock="1"]{
        position:relative!important;
        color:transparent!important;
        text-shadow:none!important;
      }
      .qmes-sales-stable .qerp-kpi b[data-qmes-kpi-lock="1"]::after{
        content:attr(data-qmes-kpi-value)!important;
        position:absolute!important;
        inset:0!important;
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        color:#0f172a!important;
        font:inherit!important;
        font-size:inherit!important;
        font-weight:inherit!important;
        line-height:inherit!important;
        white-space:nowrap!important;
        pointer-events:none!important;
      }
    `;
    document.head.appendChild(style);
  }

  let applying=false;
  function apply(){
    if(applying)return;
    const root=document.querySelector(".qmes-sales-stable");
    if(!root)return;
    applying=true;
    try{
      ensureStyle();
      const kpis=values();
      root.querySelectorAll(".qerp-kpi").forEach(card=>{
        const label=clean(card.querySelector("span")?.textContent);
        const b=card.querySelector("b");
        if(!b||!Object.prototype.hasOwnProperty.call(kpis,label))return;
        const finalValue=kpis[label];
        b.setAttribute("data-qmes-kpi-lock","1");
        b.setAttribute("data-qmes-kpi-value",finalValue);
        b.setAttribute("aria-label",finalValue);
      });
    }finally{applying=false;}
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;apply();});
  }

  function boot(){
    ensureStyle();
    apply();
    [50,120,250,500,900,1500,2500,4000,7000].forEach(ms=>setTimeout(apply,ms));
    const observer=new MutationObserver(mutations=>{
      const hit=mutations.some(m=>{
        const el=m.target?.nodeType===1?m.target:m.target?.parentElement;
        if(el?.closest?.(".qmes-sales-stable"))return true;
        return Array.from(m.addedNodes||[]).some(n=>n.nodeType===1&&(n.matches?.(".qmes-sales-stable")||n.querySelector?.(".qmes-sales-stable")));
      });
      if(hit)schedule();
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    window.__QMES_SALES_KPI_VISUAL_LOCK_OBSERVER_20260828_V1__=observer;
  }

  ["qmes:mes-master-ready","qmes:enterprise-ui-ready","qmes:erp-data-changed","qmes:data-updated","qmes:shared-sync-complete","qmes:sales-workorder-linked"].forEach(name=>window.addEventListener(name,apply));
  window.addEventListener("storage",event=>{if([SALES_KEY,META_KEY,SHIPPING_KEY].includes(event.key))apply();});
  window.addEventListener("hashchange",schedule);
  window.addEventListener("popstate",schedule);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.qmesSalesKpiVisualLock={apply,values};
})();
