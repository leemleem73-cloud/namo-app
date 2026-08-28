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

/* APPEND-ONLY V2 - compliance KPI dedicated visual owner.
 * The original <b> remains in the DOM for React/legacy scripts, but is hidden.
 * A separate sibling <b> owns the visible value, so legacy text rewrites cannot flicker on screen.
 * No existing sales/runtime/traceability source is changed.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_COMPLIANCE_VISUAL_OWNER_20260828_V2__)return;
  window.__QMES_SALES_COMPLIANCE_VISUAL_OWNER_20260828_V2__=true;

  const STYLE_ID="qmes-sales-compliance-visual-owner-20260828-v2";
  const OWNER_CLASS="qmes-compliance-visual-owner";
  const LAST_GOOD_KEY="qmes-sales-compliance-last-good-v2";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();

  function isComplianceLabel(value){
    const key=clean(value).replace(/\s+/g,"");
    return key==="납기준수율"||key==="납기준율";
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-sales-stable .qerp-kpi[data-qmes-compliance-owner="1"] > b:not(.${OWNER_CLASS}){
        display:none!important;
        visibility:hidden!important;
      }
      .qmes-sales-stable .qerp-kpi > b.${OWNER_CLASS}{
        display:block!important;
        visibility:visible!important;
        position:static!important;
        width:auto!important;
        height:auto!important;
        margin:0!important;
        padding:0!important;
        color:#0f172a!important;
        opacity:1!important;
        text-shadow:none!important;
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

  function complianceFromVisibleTable(root){
    const table=root.querySelector("table");
    if(!table)return "";
    const heads=Array.from(table.querySelectorAll("thead th")).map(th=>clean(th.textContent));
    const dueIndex=heads.findIndex(v=>v.includes("납기상태"));
    const shipIndex=heads.findIndex(v=>v.includes("출하상태"));
    if(dueIndex<0||shipIndex<0)return "";

    let samples=0,compliant=0;
    table.querySelectorAll("tbody tr").forEach(tr=>{
      const due=clean(tr.children?.[dueIndex]?.textContent);
      const ship=clean(tr.children?.[shipIndex]?.textContent);
      if(!/출하완료|납품완료|배송완료|출고완료/.test(ship))return;
      samples++;
      if(/납기완료|^완료$/.test(due)&&!/지연/.test(due))compliant++;
    });
    return samples?(compliant/samples*100).toFixed(1)+"%":"";
  }

  function fallbackValue(){
    try{
      const value=window.qmesSalesKpiVisualLock?.values?.()?.["납기 준수율"];
      if(/^\d+(?:\.\d+)?%$/.test(clean(value)))return clean(value);
    }catch(_error){}
    try{
      const saved=sessionStorage.getItem(LAST_GOOD_KEY)||"";
      if(/^\d+(?:\.\d+)?%$/.test(saved))return saved;
    }catch(_error){}
    return "";
  }

  let applying=false;
  function apply(){
    if(applying)return;
    const root=document.querySelector(".qmes-sales-stable");
    if(!root)return;
    const card=Array.from(root.querySelectorAll(".qerp-kpi")).find(node=>isComplianceLabel(node.querySelector("span")?.textContent));
    if(!card)return;

    applying=true;
    try{
      ensureStyle();
      let value=complianceFromVisibleTable(root)||fallbackValue();
      if(!value)return;
      try{sessionStorage.setItem(LAST_GOOD_KEY,value);}catch(_error){}

      const original=Array.from(card.querySelectorAll(":scope > b")).find(node=>!node.classList.contains(OWNER_CLASS))||card.querySelector("b");
      let owner=card.querySelector(":scope > b."+OWNER_CLASS);
      if(!owner){
        owner=document.createElement("b");
        owner.className=OWNER_CLASS;
        owner.setAttribute("aria-live","off");
        if(original?.nextSibling)card.insertBefore(owner,original.nextSibling);else card.appendChild(owner);
      }
      card.setAttribute("data-qmes-compliance-owner","1");
      card.setAttribute("data-qmes-compliance-value",value);
      if(owner.textContent!==value)owner.textContent=value;
      owner.setAttribute("aria-label",value);
      card.title="실제 출하 완료건의 납기 준수 여부를 기준으로 산정합니다.";
    }finally{applying=false;}
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;apply();});
  }

  function stabilizeFrames(count){
    let left=count;
    const tick=()=>{
      apply();
      left--;
      if(left>0)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function boot(){
    ensureStyle();
    apply();
    [50,120,250,500,900,1500,2500,4000,7000].forEach(ms=>setTimeout(apply,ms));
    const observer=new MutationObserver(mutations=>{
      const touched=mutations.some(m=>{
        const el=m.target?.nodeType===1?m.target:m.target?.parentElement;
        if(el?.closest?.(".qmes-sales-stable"))return true;
        return Array.from(m.addedNodes||[]).some(n=>n.nodeType===1&&(n.matches?.(".qmes-sales-stable")||n.querySelector?.(".qmes-sales-stable")));
      });
      if(touched)schedule();
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    window.__QMES_SALES_COMPLIANCE_VISUAL_OWNER_OBSERVER_20260828_V2__=observer;
  }

  window.addEventListener("qmes:mes-master-ready",()=>{apply();stabilizeFrames(120);});
  window.addEventListener("qmes:enterprise-ui-ready",()=>{apply();stabilizeFrames(60);});
  ["qmes:erp-data-changed","qmes:data-updated","qmes:shared-sync-complete","qmes:sales-workorder-linked"].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener("hashchange",schedule);
  window.addEventListener("popstate",schedule);

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.qmesSalesComplianceVisualOwner={apply};
})();
