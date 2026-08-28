/* NAMO QMES - Sales right detail drawer V1 - 2026-08-28
 * ADD-ONLY UI PATCH.
 * Reuses current Sales / Work Order / Quality / Shipping data without changing their master data.
 * Sales number click -> right-side integrated detail drawer.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_DETAIL_DRAWER_20260828_V1__)return;
  window.__QMES_SALES_DETAIL_DRAWER_20260828_V1__=true;

  /* Prevent later legacy center-modal owners from taking detail ownership again. */
  window.__QMES_SALES_ORDER_DETAIL_PROGRESS_20260826__=true;
  window.__QMES_SALES_ORDER_DETAIL_OWNER_V2__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const LINK_KEY="qmes-sales-workorder-link-v1";
  const SHIPPING_KEY="qmes-erp-shipping-v1";
  const DRAWER_ID="qmes-sales-detail-drawer-20260828-v1";
  const STYLE_ID="qmes-sales-detail-drawer-style-20260828-v1";
  const OLD_PANEL_ID="qmes-sales-order-detail-panel-20260826";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const readMap=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const salesRows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const shippingRows=()=>{const v=read(SHIPPING_KEY,[]);return Array.isArray(v)?v:[];};
  const metaMap=()=>readMap(META_KEY);
  const getDb=()=>{try{return window.DB&&typeof window.DB==="object"?window.DB:null;}catch(_){return null;}};
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);
  const metaFor=(row,map=metaMap())=>map[rowKey(row)]||map[clean(row?.id)]||row?.orderMeta||{};
  const visibleId=(row,map=metaMap())=>clean(metaFor(row,map)?.salesOrderIdOverride)||clean(row?.id);
  const iso=v=>{const m=clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`:"";};
  const completeText=v=>/출하완료|납품완료|배송완료|출고완료/.test(clean(v));

  function findRow(id){
    const wanted=clean(id);if(!wanted)return null;
    const map=metaMap();
    const alias=Object.keys(map).find(key=>clean(map[key]?.salesOrderIdOverride)===wanted)||"";
    return salesRows().find(row=>{
      const rid=clean(row?.id),key=rowKey(row),shown=visibleId(row,map);
      return rid===wanted||key===wanted||shown===wanted||(alias&&(rid===alias||key===alias));
    })||null;
  }

  function currentVisibleId(){
    const root=document.querySelector(".qmes-sales-stable")||Array.from(document.querySelectorAll(".qerp")).find(node=>/수주/.test(clean(node.querySelector(".qerp-title")?.textContent))&&/납기/.test(clean(node.querySelector(".qerp-title")?.textContent)));
    const link=root?.querySelector("table tbody [data-qso-visible-id],table tbody .qmes-sales-order-link,table tbody [data-qso-id],table tbody td:first-child a");
    return clean(link?.getAttribute?.("data-qso-visible-id"))||clean(link?.textContent)||clean(link?.getAttribute?.("data-qso-id"));
  }

  function workOrderFor(row,shown){
    const meta=metaFor(row),links=readMap(LINK_KEY);
    return clean(row?.workOrder)||clean(meta?.workOrder)||clean(links?.bySales?.[shown])||clean(links?.bySales?.[clean(row?.id)]);
  }

  function packText(row){
    const map=readMap(PACK_KEY),meta=metaFor(row),key=rowKey(row),p=map[key]||map[clean(row?.id)]||row?.packaging||{};
    const type=clean(p.type||p.packagingType||row?.packagingType),unit=num(p.unitWeight??p.unitPackQty??row?.unitPackQty),count=num(p.packageQty??row?.packageQty);
    if(!type&&!unit&&!count)return clean(meta.packaging)||"-";
    return [type,unit&&count?`${unit.toLocaleString("ko-KR",{maximumFractionDigits:3})}kg × ${count.toLocaleString("ko-KR")}EA`:unit?`${unit.toLocaleString("ko-KR",{maximumFractionDigits:3})}kg/EA`:count?`${count.toLocaleString("ko-KR")}EA`:""].filter(Boolean).join(" · ");
  }

  function remarkText(row){
    const map=readMap(REMARK_KEY),key=rowKey(row);
    return clean(map[key]??map[clean(row?.id)]??row?.remarks??row?.remark??row?.note)||"-";
  }

  function shipmentFor(row,shown,wo){
    const raw=clean(row?.id),meta=metaFor(row);
    const found=shippingRows().find(ship=>{
      const sid=clean(ship?.sales||ship?.salesOrder||ship?.salesOrderId),swo=clean(ship?.workOrder||ship?.lot);
      return (sid&&(sid===shown||sid===raw))||(wo&&swo===wo);
    })||null;
    const state=[row?.shipping,row?.delivery,meta?.shippingStatus,meta?.deliveryStatus,found?.shipping,found?.delivery,found?.status].map(clean).join(" ");
    return {
      row:found,
      complete:row?.actualShipment===true||meta?.actualShipment===true||found?.actualShipment===true||completeText(state),
      status:clean(found?.delivery||found?.status||found?.shipping||meta?.shippingStatus||row?.shipping)||"-",
      date:iso(row?.actualShipDate||row?.shipDate||meta?.actualShipDate||found?.actualShipDate||found?.shipDate||found?.actualDate||found?.date),
      qty:num(found?.shipQty??found?.qty??found?.actualQty),
      no:clean(found?.shipNo||found?.shippingNo||found?.no||found?.deliveryNo),
      destination:clean(found?.destination||found?.deliveryPlace||meta?.deliveryPlace||row?.deliveryPlace)
    };
  }

  function qualityFor(wo,shipComplete){
    const D=getDb(),lot=wo&&D?.lots?.[wo]||{},q=lot?.qualityLink||{};
    const state=(raw,goodLabel="완료")=>{
      const s=clean(raw?.status||raw);
      if(/불합격|NG|FAIL|차단/i.test(s))return {label:"불합격",tone:"bad"};
      if(/합격|완료|발행/i.test(s))return {label:goodLabel,tone:"good"};
      if(/검사중|진행/i.test(s))return {label:"진행중",tone:"progress"};
      return null;
    };
    const result={
      iqc:state(q.iqc),
      pqc:state(q.pqc),
      oqc:state(q.oqc),
      coa:state(q.coa,"발행완료")
    };
    if(shipComplete){
      result.iqc=result.iqc||{label:"완료",tone:"good"};
      result.pqc=result.pqc||{label:"완료",tone:"good"};
      result.oqc=result.oqc||{label:"완료",tone:"good"};
      result.coa=result.coa||{label:"발행완료",tone:"good"};
    }
    return result;
  }

  function lotData(wo){
    const D=getDb(),doc=wo&&D?.woDocs?.[wo]||{},lot=wo&&D?.lots?.[wo]||{};
    const inputs=Array.isArray(doc.inputs)?doc.inputs:[];
    const materials=inputs.map(input=>({name:clean(input?.name)||"원료",lot:clean(input?.lot||input?.materialLot)||"-",qty:num(input?.act??input?.std),unit:clean(input?.unit)||"kg"})).filter(x=>x.lot!=="-");
    return {productionLot:clean(lot?.workOrder||lot?.wo||wo)||"-",materials};
  }

  function orderDate(row,shown){
    const meta=metaFor(row),explicit=iso(meta.orderDate||row?.orderDate||row?.date);
    if(explicit)return explicit;
    const m=shown.match(/^SO-(20\d{2})(\d{2})(\d{2})-/i);
    return m?`${m[1]}-${m[2]}-${m[3]}`:"-";
  }

  function viewModel(row){
    const map=metaMap(),meta=metaFor(row,map),shown=visibleId(row,map)||clean(row?.id),wo=workOrderFor(row,shown),ship=shipmentFor(row,shown,wo),quality=qualityFor(wo,ship.complete),lot=lotData(wo);
    return {
      row,meta,shown,wo:wo||"-",ship,quality,lot,
      customer:clean(meta.customerOverride)||clean(row?.customer)||"-",
      product:clean(meta.productOverride)||clean(row?.product)||"-",
      qty:num(meta.qtyOverride??row?.qty),
      requestedDue:iso(meta.requestedDue||row?.due)||"-",
      confirmedDue:iso(meta.confirmedDue)||((ship.complete&&ship.date)?ship.date:"미확정"),
      deliveryPlace:clean(meta.deliveryPlace)||clean(row?.deliveryPlace)||ship.destination||"-",
      packaging:packText(row),
      orderType:clean(meta.orderType)||"-",
      po:clean(row?.po||meta.customerPO)||"-",
      itemCode:clean(meta.customerItemCode)||"-",
      plan:clean(meta.productionPlanStatus||row?.plan)||"-",
      shipping:ship.complete?"출하완료":(ship.status||clean(meta.shippingStatus||row?.shipping)||"-"),
      orderDate:orderDate(row,shown),
      remark:remarkText(row)
    };
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #${DRAWER_ID}{position:fixed;inset:0;z-index:19000;display:flex;justify-content:flex-end;background:rgba(15,23,42,.28);backdrop-filter:blur(1px);font-family:inherit}
      #${DRAWER_ID}[hidden]{display:none!important}
      #${DRAWER_ID} .qsd-drawer{width:min(520px,94vw);height:100%;background:#fff;border-left:1px solid #e2e8f0;box-shadow:-18px 0 48px rgba(15,23,42,.18);display:flex;flex-direction:column;animation:qsd-in .18s ease-out}
      @keyframes qsd-in{from{transform:translateX(24px);opacity:.7}to{transform:translateX(0);opacity:1}}
      #${DRAWER_ID} .qsd-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:20px 20px 14px;border-bottom:1px solid #e5e7eb;background:#fff}
      #${DRAWER_ID} .qsd-head h2{margin:0;color:#111827;font-size:18px;font-weight:950;letter-spacing:-.02em}
      #${DRAWER_ID} .qsd-head p{margin:4px 0 0;color:#94a3b8;font-size:10px;font-weight:700}
      #${DRAWER_ID} .qsd-close{width:38px;height:38px;border:0;border-radius:10px;background:#f8fafc;color:#334155;font-size:25px;line-height:1;cursor:pointer}
      #${DRAWER_ID} .qsd-tabs{display:flex;gap:7px;padding:14px 20px 8px;background:#fff}
      #${DRAWER_ID} .qsd-tab{height:31px;padding:0 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#334155;font-size:10px;font-weight:900;cursor:pointer}
      #${DRAWER_ID} .qsd-tab.is-active{border-color:#111827;background:#111827;color:#fff}
      #${DRAWER_ID} .qsd-scroll{flex:1;overflow:auto;padding:8px 20px 20px}
      #${DRAWER_ID} .qsd-order{font-size:17px;font-weight:950;color:#0f172a;margin:2px 0 12px}
      #${DRAWER_ID} .qsd-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      #${DRAWER_ID} .qsd-card{min-height:69px;padding:12px;border:1px solid #e2e8f0;border-radius:11px;background:#fff}
      #${DRAWER_ID} .qsd-card small{display:block;margin-bottom:7px;color:#94a3b8;font-size:9px;font-weight:800}
      #${DRAWER_ID} .qsd-card strong{display:block;color:#172033;font-size:12px;font-weight:900;line-height:1.35;word-break:break-word}
      #${DRAWER_ID} .qsd-section{margin-top:20px}
      #${DRAWER_ID} .qsd-section h3{margin:0 0 10px;color:#1e293b;font-size:12px;font-weight:950}
      #${DRAWER_ID} .qsd-timeline{position:relative;margin-left:5px;padding-left:20px}
      #${DRAWER_ID} .qsd-timeline:before{content:"";position:absolute;left:4px;top:7px;bottom:8px;width:2px;background:#e2e8f0}
      #${DRAWER_ID} .qsd-event{position:relative;padding:0 0 17px 7px}
      #${DRAWER_ID} .qsd-event:before{content:"";position:absolute;left:-21px;top:3px;width:9px;height:9px;border-radius:50%;background:#3b82f6;border:2px solid #fff;box-shadow:0 0 0 1px #93c5fd}
      #${DRAWER_ID} .qsd-event b{display:block;color:#334155;font-size:10px;font-weight:900}
      #${DRAWER_ID} .qsd-event span{display:block;margin-top:4px;color:#94a3b8;font-size:9px;font-weight:700}
      #${DRAWER_ID} .qsd-status-list{display:grid;gap:8px}
      #${DRAWER_ID} .qsd-status-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border:1px solid #e2e8f0;border-radius:10px}
      #${DRAWER_ID} .qsd-status-row b{font-size:11px;color:#334155}
      #${DRAWER_ID} .qsd-badge{display:inline-flex;align-items:center;justify-content:center;min-width:58px;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:950}
      #${DRAWER_ID} .qsd-badge.good{background:#dcfce7;color:#15803d}#${DRAWER_ID} .qsd-badge.wait{background:#f1f5f9;color:#64748b}#${DRAWER_ID} .qsd-badge.progress{background:#dbeafe;color:#1d4ed8}#${DRAWER_ID} .qsd-badge.bad{background:#fee2e2;color:#b91c1c}
      #${DRAWER_ID} .qsd-lot-row{padding:10px 12px;border:1px solid #e2e8f0;border-radius:9px;margin-bottom:7px}
      #${DRAWER_ID} .qsd-lot-row b{display:block;font-size:10px;color:#334155}.qsd-lot-row span{display:block;margin-top:3px;font-size:9px;color:#64748b}
      #${DRAWER_ID} .qsd-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 20px 18px;border-top:1px solid #e5e7eb;background:#fff}
      #${DRAWER_ID} .qsd-actions button{height:40px;border:1px solid #dbe3ec;border-radius:9px;background:#fff;color:#334155;font-size:11px;font-weight:900;cursor:pointer}
      #${DRAWER_ID} .qsd-actions button.primary{border-color:#2563eb;background:#2563eb;color:#fff}
      @media(max-width:640px){#${DRAWER_ID} .qsd-drawer{width:100vw}#${DRAWER_ID} .qsd-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  const badge=(label,tone="wait")=>`<span class="qsd-badge ${tone}">${esc(label)}</span>`;
  function qualityRows(vm){
    const q=vm.quality;
    return [["원료 IQC",q.iqc],["PQC",q.pqc],["OQC",q.oqc],["CoA",q.coa]].map(([name,state])=>`<div class="qsd-status-row"><b>${esc(name)}</b>${state?badge(state.label,state.tone):badge("대기","wait")}</div>`).join("");
  }

  function timeline(vm){
    const events=[];
    events.push(["수주 등록 완료",`${vm.orderDate} · ${vm.shown}`]);
    if(vm.plan!=="-")events.push([`생산계획 ${vm.plan}`,vm.wo!=="-"?`작업지시 ${vm.wo}`:"생산계획 연결"]);
    if(vm.wo!=="-")events.push(["작업지시 연결",vm.wo]);
    if(vm.quality.iqc)events.push([`원료 IQC ${vm.quality.iqc.label}`,vm.wo]);
    if(vm.quality.pqc)events.push([`PQC ${vm.quality.pqc.label}`,vm.wo]);
    if(vm.quality.oqc)events.push([`OQC ${vm.quality.oqc.label}`,vm.wo]);
    if(vm.quality.coa)events.push([`CoA ${vm.quality.coa.label}`,vm.wo]);
    if(vm.ship.complete)events.push(["출하 완료",vm.ship.date||vm.ship.no||"출하완료"]);
    return events.map(([title,sub])=>`<div class="qsd-event"><b>${esc(title)}</b><span>${esc(sub||"")}</span></div>`).join("");
  }

  function panelHtml(vm,tab){
    if(tab==="생산")return `<div class="qsd-order">${esc(vm.shown)}</div><div class="qsd-grid"><div class="qsd-card"><small>생산계획</small><strong>${esc(vm.plan)}</strong></div><div class="qsd-card"><small>작업지시</small><strong>${esc(vm.wo)}</strong></div><div class="qsd-card"><small>생산 LOT</small><strong>${esc(vm.lot.productionLot)}</strong></div><div class="qsd-card"><small>제품 / 계획수량</small><strong>${esc(vm.product)} · ${esc(vm.qty.toLocaleString("ko-KR"))} kg</strong></div></div><section class="qsd-section"><h3>생산 진행</h3><div class="qsd-timeline">${timeline(vm)}</div></section>`;
    if(tab==="품질")return `<div class="qsd-order">${esc(vm.shown)}</div><section class="qsd-section" style="margin-top:0"><h3>품질 진행상태</h3><div class="qsd-status-list">${qualityRows(vm)}</div></section><section class="qsd-section"><h3>연결 기준</h3><div class="qsd-card"><small>생산 LOT / 작업지시</small><strong>${esc(vm.wo)}</strong></div></section>`;
    if(tab==="LOT"){
      const materials=vm.lot.materials.length?vm.lot.materials.map(item=>`<div class="qsd-lot-row"><b>${esc(item.name)} · ${esc(item.lot)}</b><span>${item.qty?esc(item.qty.toLocaleString("ko-KR")+" "+item.unit):"투입 LOT"}</span></div>`).join(""):`<div class="qsd-lot-row"><b>연결된 원재료 LOT 없음</b><span>작업지시 원료 LOT 연결 후 표시됩니다.</span></div>`;
      return `<div class="qsd-order">${esc(vm.shown)}</div><div class="qsd-card"><small>완제품 / 생산 LOT</small><strong>${esc(vm.lot.productionLot)}</strong></div><section class="qsd-section"><h3>원재료 LOT</h3>${materials}</section>`;
    }
    if(tab==="출하")return `<div class="qsd-order">${esc(vm.shown)}</div><div class="qsd-grid"><div class="qsd-card"><small>출하상태</small><strong>${esc(vm.shipping)}</strong></div><div class="qsd-card"><small>출하일</small><strong>${esc(vm.ship.date||"-")}</strong></div><div class="qsd-card"><small>실출하량</small><strong>${vm.ship.qty?esc(vm.ship.qty.toLocaleString("ko-KR")+" kg"):"-"}</strong></div><div class="qsd-card"><small>출하번호</small><strong>${esc(vm.ship.no||"-")}</strong></div><div class="qsd-card"><small>납품처</small><strong>${esc(vm.deliveryPlace)}</strong></div><div class="qsd-card"><small>납기</small><strong>${esc(vm.requestedDue)}</strong></div></div>`;
    return `<div class="qsd-order">${esc(vm.shown)}</div><div class="qsd-grid"><div class="qsd-card"><small>고객사</small><strong>${esc(vm.customer)}</strong></div><div class="qsd-card"><small>제품</small><strong>${esc(vm.product)}</strong></div><div class="qsd-card"><small>수주수량</small><strong>${esc(vm.qty.toLocaleString("ko-KR"))} kg</strong></div><div class="qsd-card"><small>요청 납기</small><strong>${esc(vm.requestedDue)}</strong></div><div class="qsd-card"><small>작업지시</small><strong>${esc(vm.wo)}</strong></div><div class="qsd-card"><small>생산 LOT</small><strong>${esc(vm.lot.productionLot)}</strong></div><div class="qsd-card"><small>포장정보</small><strong>${esc(vm.packaging)}</strong></div><div class="qsd-card"><small>납품처</small><strong>${esc(vm.deliveryPlace)}</strong></div></div><section class="qsd-section"><h3>진행 이력</h3><div class="qsd-timeline">${timeline(vm)}</div></section>`;
  }

  function render(row,tab="요약"){
    ensureStyle();
    document.getElementById(OLD_PANEL_ID)?.remove();
    const vm=viewModel(row);
    let root=document.getElementById(DRAWER_ID);
    if(!root){root=document.createElement("div");root.id=DRAWER_ID;document.body.appendChild(root);}
    root.hidden=false;root.dataset.salesId=vm.shown;root.dataset.tab=tab;
    root.innerHTML=`<aside class="qsd-drawer" role="dialog" aria-modal="true" aria-label="통합 상세 정보"><div class="qsd-head"><div><h2>통합 상세 정보</h2><p>Sales Order → MES → Quality → Shipment</p></div><button class="qsd-close" type="button" data-qsd-close aria-label="닫기">×</button></div><div class="qsd-tabs">${["요약","생산","품질","LOT","출하"].map(name=>`<button type="button" class="qsd-tab ${name===tab?"is-active":""}" data-qsd-tab="${name}">${name}</button>`).join("")}</div><div class="qsd-scroll">${panelHtml(vm,tab)}</div><div class="qsd-actions"><button type="button" data-qsd-workorder ${vm.wo==="-"?"disabled":""}>작업지시 보기</button><button type="button" class="primary" data-qsd-lot ${vm.wo==="-"?"disabled":""}>LOT 추적</button></div></aside>`;
    document.documentElement.style.overflow="hidden";
    return true;
  }

  function open(requested){
    const id=clean(requested)||currentVisibleId(),row=findRow(id);
    if(!row){window.alert("수주 데이터를 찾을 수 없습니다.");return false;}
    return render(row,"요약");
  }
  function close(){const root=document.getElementById(DRAWER_ID);if(root)root.hidden=true;document.documentElement.style.overflow="";}
  function refresh(){
    const root=document.getElementById(DRAWER_ID);if(!root||root.hidden)return;
    const row=findRow(root.dataset.salesId);if(row)render(row,root.dataset.tab||"요약");
  }

  /* Existing Sales link handler calls this API, so the old center modal is replaced by the drawer. */
  window.qmesSalesOrderDetail={open,refresh,close};

  document.addEventListener("click",event=>{
    const target=event.target;if(!(target instanceof Element))return;
    const root=target.closest("#"+DRAWER_ID);
    if(target.closest("[data-qsd-close]")){event.preventDefault();close();return;}
    const tab=target.closest("[data-qsd-tab]");
    if(tab&&root){event.preventDefault();const row=findRow(root.dataset.salesId);if(row)render(row,tab.getAttribute("data-qsd-tab")||"요약");return;}
    if(target.id===DRAWER_ID){close();return;}
    if(target.closest("[data-qsd-workorder]")&&root){
      const row=findRow(root.dataset.salesId),vm=row?viewModel(row):null;if(!vm||vm.wo==="-")return;
      try{localStorage.setItem("qmes-focus-workorder",vm.wo);}catch(_){}
      window.dispatchEvent(new CustomEvent("qmes:open-workorder",{detail:{workOrder:vm.wo,salesOrderId:vm.shown}}));
      close();location.hash="#page-workorder-list";return;
    }
    if(target.closest("[data-qsd-lot]")&&root){
      const row=findRow(root.dataset.salesId),vm=row?viewModel(row):null;if(!vm||vm.wo==="-")return;
      try{localStorage.setItem("qmes-focus-lot",vm.wo);}catch(_){}
      window.dispatchEvent(new CustomEvent("qmes:open-lot-trace",{detail:{lot:vm.wo,salesOrderId:vm.shown}}));
      close();location.hash="#page-lot-trace";
    }
  },false);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")close();});

  ["qmes:erp-data-changed","qmes:data-updated","qmes:quality-linkage-updated","qmes:shared-sync-complete","qmes:sales-workorder-linked"].forEach(name=>window.addEventListener(name,()=>setTimeout(refresh,0)));
  window.addEventListener("storage",event=>{if([SALES_KEY,META_KEY,PACK_KEY,REMARK_KEY,LINK_KEY,SHIPPING_KEY].includes(event.key))setTimeout(refresh,0);});

  window.qmesSalesDetailDrawer={open,close,refresh};
})();
