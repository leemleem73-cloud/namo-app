/* NAMO QMES - Sales right detail drawer SAFE V2 - 2026-08-28
 * ADD-ONLY replacement owner loaded before V1.
 * Fixes blank/dim-only drawer and removes expensive backdrop/auto-refresh churn.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_DETAIL_DRAWER_SAFE_20260828_V2__)return;
  window.__QMES_SALES_DETAIL_DRAWER_SAFE_20260828_V2__=true;
  window.__QMES_SALES_DETAIL_DRAWER_20260828_V1__=true;
  window.__QMES_SALES_ORDER_DETAIL_PROGRESS_20260826__=true;
  window.__QMES_SALES_ORDER_DETAIL_OWNER_V2__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const LINK_KEY="qmes-sales-workorder-link-v1";
  const SHIPPING_KEY="qmes-erp-shipping-v1";
  const ROOT_ID="qmes-sales-detail-drawer-safe-20260828-v2";
  const OLD_ROOT_ID="qmes-sales-detail-drawer-20260828-v1";
  const OLD_PANEL_ID="qmes-sales-order-detail-panel-20260826";
  const STYLE_ID="qmes-sales-detail-drawer-safe-style-20260828-v2";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const readMap=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const metaMap=()=>readMap(META_KEY);
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);
  const metaFor=(row,map=metaMap())=>map[rowKey(row)]||map[clean(row?.id)]||row?.orderMeta||{};
  const visibleId=(row,map=metaMap())=>clean(metaFor(row,map)?.salesOrderIdOverride)||clean(row?.id);
  const iso=v=>{const m=clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`:"";};

  function findRow(id){
    const wanted=clean(id),map=metaMap();
    if(!wanted)return rows()[0]||null;
    const alias=Object.keys(map).find(key=>clean(map[key]?.salesOrderIdOverride)===wanted)||"";
    return rows().find(row=>{
      const rid=clean(row?.id),key=rowKey(row),shown=visibleId(row,map);
      return rid===wanted||key===wanted||shown===wanted||(alias&&(rid===alias||key===alias));
    })||null;
  }

  function currentId(){
    const root=document.querySelector(".qmes-sales-stable")||document.querySelector(".qerp");
    const link=root?.querySelector("table tbody [data-qso-visible-id],table tbody .qmes-sales-order-link,table tbody [data-qso-id],table tbody td:first-child a");
    return clean(link?.getAttribute?.("data-qso-visible-id"))||clean(link?.textContent)||clean(link?.getAttribute?.("data-qso-id"));
  }

  function workOrder(row,shown){
    const meta=metaFor(row),links=readMap(LINK_KEY);
    return clean(row?.workOrder)||clean(meta?.workOrder)||clean(links?.bySales?.[shown])||clean(links?.bySales?.[clean(row?.id)])||"-";
  }

  function packaging(row){
    const map=readMap(PACK_KEY),meta=metaFor(row),p=map[rowKey(row)]||map[clean(row?.id)]||row?.packaging||{};
    const type=clean(p.type||p.packagingType||row?.packagingType),unit=num(p.unitWeight??p.unitPackQty??row?.unitPackQty),count=num(p.packageQty??row?.packageQty);
    if(!type&&!unit&&!count)return clean(meta.packaging)||"-";
    return [type,unit&&count?`${unit.toLocaleString("ko-KR",{maximumFractionDigits:3})}kg × ${count.toLocaleString("ko-KR")}EA`:unit?`${unit.toLocaleString("ko-KR",{maximumFractionDigits:3})}kg/EA`:count?`${count.toLocaleString("ko-KR")}EA`:""].filter(Boolean).join(" · ");
  }

  function shipment(row,shown,wo){
    const meta=metaFor(row),list=read(SHIPPING_KEY,[]),ships=Array.isArray(list)?list:[];
    const found=ships.find(s=>{
      const sid=clean(s?.sales||s?.salesOrder||s?.salesOrderId),swo=clean(s?.workOrder||s?.lot);
      return (sid&&(sid===shown||sid===clean(row?.id)))||(wo!=="-"&&swo===wo);
    })||{};
    const status=clean(found.delivery||found.status||found.shipping||meta.shippingStatus||row?.shipping)||"-";
    const complete=row?.actualShipment===true||meta?.actualShipment===true||found?.actualShipment===true||/출하완료|납품완료|배송완료|출고완료/.test(status);
    return {status:complete?"출하완료":status,date:iso(row?.actualShipDate||row?.shipDate||meta?.actualShipDate||found?.actualShipDate||found?.shipDate||found?.date),qty:num(found?.shipQty??found?.qty??found?.actualQty),no:clean(found?.shipNo||found?.shippingNo||found?.no)};
  }

  function quality(wo,shipDone){
    let q={};
    try{q=(wo!=="-"&&window.DB?.lots?.[wo]?.qualityLink)||{};}catch(_){q={};}
    const one=(raw,label="완료")=>{
      const s=clean(raw?.status||raw);
      if(/불합격|NG|FAIL/i.test(s))return {label:"불합격",tone:"bad"};
      if(/합격|완료|발행/i.test(s))return {label,tone:"good"};
      if(/검사중|진행/i.test(s))return {label:"진행중",tone:"progress"};
      return shipDone?{label,tone:"good"}:{label:"대기",tone:"wait"};
    };
    return {iqc:one(q.iqc),pqc:one(q.pqc),oqc:one(q.oqc),coa:one(q.coa,"발행완료")};
  }

  function vm(row){
    const map=metaMap(),meta=metaFor(row,map),shown=visibleId(row,map)||clean(row?.id),wo=workOrder(row,shown),ship=shipment(row,shown,wo),q=quality(wo,ship.status==="출하완료"),remarks=readMap(REMARK_KEY);
    const orderDate=iso(meta.orderDate||row?.orderDate||row?.date)||(()=>{const m=shown.match(/^SO-(20\d{2})(\d{2})(\d{2})-/);return m?`${m[1]}-${m[2]}-${m[3]}`:"-";})();
    return {row,meta,shown,wo,ship,q,orderDate,
      customer:clean(meta.customerOverride)||clean(row?.customer)||"-",
      product:clean(meta.productOverride)||clean(row?.product)||"-",
      qty:num(meta.qtyOverride??row?.qty),
      due:iso(meta.requestedDue||row?.due)||"-",
      confirmed:iso(meta.confirmedDue)||((ship.status==="출하완료"&&ship.date)?ship.date:"미확정"),
      destination:clean(meta.deliveryPlace)||clean(row?.deliveryPlace)||"-",
      pack:packaging(row),
      plan:clean(meta.productionPlanStatus||row?.plan)||"-",
      remark:clean(remarks[rowKey(row)]??remarks[clean(row?.id)]??row?.remark??row?.note)||"-"
    };
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");s.id=STYLE_ID;
    s.textContent=`
      #${ROOT_ID}{position:fixed!important;inset:0!important;z-index:2147481000!important;background:rgba(15,23,42,.24)!important;display:block!important}
      #${ROOT_ID}[hidden]{display:none!important}
      #${ROOT_ID} .qsd2-panel{position:absolute!important;top:0!important;right:0!important;bottom:0!important;width:min(520px,94vw)!important;background:#fff!important;border-left:1px solid #e2e8f0!important;box-shadow:-16px 0 42px rgba(15,23,42,.18)!important;display:flex!important;flex-direction:column!important;visibility:visible!important;opacity:1!important;transform:none!important}
      #${ROOT_ID} .qsd2-head{display:flex;justify-content:space-between;align-items:flex-start;padding:20px;border-bottom:1px solid #e5e7eb}.qsd2-title{font-size:19px;font-weight:950;color:#111827}.qsd2-sub{margin-top:4px;font-size:10px;color:#94a3b8;font-weight:700}.qsd2-close{width:38px;height:38px;border:0;border-radius:9px;background:#f1f5f9;font-size:23px;cursor:pointer}
      #${ROOT_ID} .qsd2-tabs{display:flex;gap:7px;padding:13px 20px 8px}.qsd2-tab{height:31px;padding:0 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;font-size:10px;font-weight:900;cursor:pointer}.qsd2-tab.on{background:#111827;color:#fff;border-color:#111827}
      #${ROOT_ID} .qsd2-body{flex:1;overflow:auto;padding:8px 20px 20px}.qsd2-order{font-size:17px;font-weight:950;color:#0f172a;margin:4px 0 12px}.qsd2-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.qsd2-card{padding:12px;border:1px solid #e2e8f0;border-radius:10px;min-height:66px;background:#fff}.qsd2-card small{display:block;color:#94a3b8;font-size:9px;font-weight:800;margin-bottom:6px}.qsd2-card strong{display:block;color:#172033;font-size:12px;font-weight:900;line-height:1.35;word-break:break-word}
      #${ROOT_ID} .qsd2-section{margin-top:20px}.qsd2-section h3{margin:0 0 9px;font-size:12px;color:#334155;font-weight:950}.qsd2-row{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid #e2e8f0;border-radius:9px;margin-bottom:7px}.qsd2-row b{font-size:11px;color:#334155}.qsd2-badge{padding:5px 8px;border-radius:999px;font-size:9px;font-weight:950}.qsd2-badge.good{background:#dcfce7;color:#15803d}.qsd2-badge.wait{background:#f1f5f9;color:#64748b}.qsd2-badge.progress{background:#dbeafe;color:#1d4ed8}.qsd2-badge.bad{background:#fee2e2;color:#b91c1c}
      #${ROOT_ID} .qsd2-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 20px 18px;border-top:1px solid #e5e7eb}.qsd2-actions button{height:40px;border:1px solid #dbe3ec;border-radius:9px;background:#fff;font-size:11px;font-weight:900;cursor:pointer}.qsd2-actions button.primary{background:#2563eb;border-color:#2563eb;color:#fff}
      @media(max-width:640px){#${ROOT_ID} .qsd2-panel{width:100vw!important}.qsd2-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  const badge=x=>`<span class="qsd2-badge ${esc(x.tone)}">${esc(x.label)}</span>`;
  const card=(label,value)=>`<div class="qsd2-card"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`;

  function bodyHtml(data,tab){
    if(tab==="생산")return `<div class="qsd2-order">${esc(data.shown)}</div><div class="qsd2-grid">${card("생산계획",data.plan)}${card("작업지시",data.wo)}${card("생산 LOT",data.wo)}${card("계획수량",data.qty.toLocaleString("ko-KR")+" kg")}</div>`;
    if(tab==="품질")return `<div class="qsd2-order">${esc(data.shown)}</div><div class="qsd2-section" style="margin-top:0"><h3>품질 진행상태</h3>${[["원료 IQC",data.q.iqc],["PQC",data.q.pqc],["OQC",data.q.oqc],["CoA",data.q.coa]].map(([n,s])=>`<div class="qsd2-row"><b>${n}</b>${badge(s)}</div>`).join("")}</div>`;
    if(tab==="LOT")return `<div class="qsd2-order">${esc(data.shown)}</div><div class="qsd2-grid">${card("작업지시 / 생산 LOT",data.wo)}${card("제품",data.product)}</div><div class="qsd2-section"><h3>LOT 추적</h3><div class="qsd2-row"><b>생산 LOT</b><span>${esc(data.wo)}</span></div></div>`;
    if(tab==="출하")return `<div class="qsd2-order">${esc(data.shown)}</div><div class="qsd2-grid">${card("출하상태",data.ship.status)}${card("출하일",data.ship.date||"-")}${card("실출하량",data.ship.qty?data.ship.qty.toLocaleString("ko-KR")+" kg":"-")}${card("출하번호",data.ship.no||"-")}${card("납품처",data.destination)}${card("요청 납기",data.due)}</div>`;
    return `<div class="qsd2-order">${esc(data.shown)}</div><div class="qsd2-grid">${card("고객사",data.customer)}${card("제품",data.product)}${card("수주수량",data.qty.toLocaleString("ko-KR")+" kg")}${card("요청 납기",data.due)}${card("확정 납기",data.confirmed)}${card("작업지시",data.wo)}${card("포장정보",data.pack)}${card("납품처",data.destination)}</div><div class="qsd2-section"><h3>현재 상태</h3><div class="qsd2-row"><b>생산계획</b><span>${esc(data.plan)}</span></div><div class="qsd2-row"><b>출하</b><span>${esc(data.ship.status)}</span></div></div>`;
  }

  function cleanupOld(){document.getElementById(OLD_ROOT_ID)?.remove();document.getElementById(OLD_PANEL_ID)?.remove();}

  function render(row,tab="요약"){
    cleanupOld();ensureStyle();
    let data;
    try{data=vm(row);}catch(error){
      console.error("[QMES Drawer V2] view error",error);
      data={shown:visibleId(row)||clean(row?.id)||"-",customer:clean(row?.customer)||"-",product:clean(row?.product)||"-",qty:num(row?.qty),due:clean(row?.due)||"-",confirmed:"-",wo:clean(row?.workOrder)||"-",pack:"-",destination:clean(row?.deliveryPlace)||"-",plan:clean(row?.plan)||"-",ship:{status:clean(row?.shipping)||"-",date:"",qty:0,no:""},q:{iqc:{label:"대기",tone:"wait"},pqc:{label:"대기",tone:"wait"},oqc:{label:"대기",tone:"wait"},coa:{label:"대기",tone:"wait"}}};
    }
    let root=document.getElementById(ROOT_ID);
    if(!root){root=document.createElement("div");root.id=ROOT_ID;document.body.appendChild(root);}
    root.hidden=false;root.dataset.salesId=data.shown;root.dataset.tab=tab;
    root.setAttribute("style","position:fixed!important;inset:0!important;z-index:2147481000!important;background:rgba(15,23,42,.24)!important;display:block!important;");
    let content="";
    try{content=bodyHtml(data,tab);}catch(error){content=`<div class="qsd2-order">${esc(data.shown)}</div>${card("상세정보",data.customer+" · "+data.product)}`;}
    root.innerHTML=`<section class="qsd2-panel" role="dialog" aria-modal="true" aria-label="통합 상세 정보" style="position:absolute!important;top:0!important;right:0!important;bottom:0!important;width:min(520px,94vw)!important;background:#fff!important;display:flex!important;flex-direction:column!important;visibility:visible!important;opacity:1!important;transform:none!important;"><div class="qsd2-head"><div><div class="qsd2-title">통합 상세 정보</div><div class="qsd2-sub">Sales Order → MES → Quality → Shipment</div></div><button type="button" class="qsd2-close" data-qsd2-close>×</button></div><div class="qsd2-tabs">${["요약","생산","품질","LOT","출하"].map(t=>`<button type="button" class="qsd2-tab ${t===tab?"on":""}" data-qsd2-tab="${t}">${t}</button>`).join("")}</div><div class="qsd2-body">${content}</div><div class="qsd2-actions"><button type="button" data-qsd2-workorder ${data.wo==="-"?"disabled":""}>작업지시 보기</button><button type="button" class="primary" data-qsd2-lot ${data.wo==="-"?"disabled":""}>LOT 추적</button></div></section>`;
    document.documentElement.style.overflow="hidden";
    return true;
  }

  function open(id){const row=findRow(clean(id)||currentId());if(!row){cleanupOld();window.alert("수주 데이터를 찾을 수 없습니다.");return false;}return render(row,"요약");}
  function close(){document.getElementById(ROOT_ID)?.remove();cleanupOld();document.documentElement.style.overflow="";}
  function refresh(){const root=document.getElementById(ROOT_ID);if(!root)return;const row=findRow(root.dataset.salesId);if(row)render(row,root.dataset.tab||"요약");}

  cleanupOld();document.documentElement.style.overflow="";
  window.qmesSalesOrderDetail={open,close,refresh};
  window.qmesSalesDetailDrawerSafe={open,close,refresh};

  document.addEventListener("click",event=>{
    const target=event.target;if(!(target instanceof Element))return;
    const root=target.closest("#"+ROOT_ID);
    if(target.closest("[data-qsd2-close]")){event.preventDefault();close();return;}
    const tab=target.closest("[data-qsd2-tab]");
    if(tab&&root){event.preventDefault();const row=findRow(root.dataset.salesId);if(row)render(row,tab.getAttribute("data-qsd2-tab")||"요약");return;}
    if(target.id===ROOT_ID){close();return;}
    if(target.closest("[data-qsd2-workorder]")&&root){const row=findRow(root.dataset.salesId),data=row?vm(row):null;if(!data||data.wo==="-")return;try{localStorage.setItem("qmes-focus-workorder",data.wo);}catch(_){}close();location.hash="#page-workorder-list";return;}
    if(target.closest("[data-qsd2-lot]")&&root){const row=findRow(root.dataset.salesId),data=row?vm(row):null;if(!data||data.wo==="-")return;try{localStorage.setItem("qmes-focus-lot",data.wo);}catch(_){}close();location.hash="#page-lot-trace";}
  },false);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")close();});
})();
