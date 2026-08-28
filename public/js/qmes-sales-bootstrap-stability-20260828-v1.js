/* NAMO QMES - Sales bootstrap stability V1 - 2026-08-28
 * ADD-ONLY bootstrap loaded before ERP runtime modules.
 * 1) Preserve local Sales rows while the shared ERP Sales record is loading.
 * 2) Provide the Sales progress button/detail panel directly, without late legacy owners.
 * 3) Avoid the local -> shared 2-second row flash/disappearance.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_BOOTSTRAP_STABILITY_20260828_V1__)return;
  window.__QMES_SALES_BOOTSTRAP_STABILITY_20260828_V1__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const DELETED_KEY="qmes-sales-deleted-v1";
  const PANEL_ID="qmes-sales-order-detail-panel-20260826";
  const BTN_ID="qmes-sales-progress-button-20260826";

  /* These two legacy modules are loaded later by the MES master loader.
   * Their old shared-refresh/detail ownership is intentionally skipped because
   * this bootstrap owns the same UI before ERP first paint.
   */
  window.__QMES_SALES_ORDER_DETAIL_PROGRESS_20260826__=true;
  window.__QMES_SALES_ORDER_DETAIL_OWNER_V2__=true;

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v==null?fallback:v;}catch(_){return fallback;}};
  const readMap=key=>{const v=read(key,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const salesRows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const metaMap=()=>readMap(META_KEY);
  const rowKey=row=>clean(row?.workOrder)||clean(row?.id);
  const metaFor=(row,map=metaMap())=>map[rowKey(row)]||map[clean(row?.id)]||row?.orderMeta||{};
  const visibleId=(row,map=metaMap())=>clean(metaFor(row,map)?.salesOrderIdOverride)||clean(row?.id);

  function deletedRows(){
    const list=read(DELETED_KEY,[]);
    return Array.isArray(list)?list:[];
  }
  function isDeleted(row){
    const id=clean(row?.id),wo=rowKey(row),shown=visibleId(row);
    return deletedRows().some(item=>{
      const did=clean(item?.id),dwo=clean(item?.workOrder);
      return (did&&(did===id||did===shown))||(dwo&&wo&&dwo===wo);
    });
  }
  function identityKeys(row,map=metaMap()){
    return Array.from(new Set([clean(row?.id),rowKey(row),visibleId(row,map)].filter(Boolean)));
  }
  function mergeSalesRows(sharedRows,localRows){
    const map=metaMap(),out=[],used=new Set();
    const add=row=>{
      if(!row||typeof row!=="object"||isDeleted(row))return;
      const keys=identityKeys(row,map);
      if(keys.some(key=>used.has(key)))return;
      out.push(row);keys.forEach(key=>used.add(key));
    };
    /* Local first: the row already shown/edited on this client must not disappear
     * merely because an older shared snapshot arrives later. */
    (Array.isArray(localRows)?localRows:[]).forEach(add);
    (Array.isArray(sharedRows)?sharedRows:[]).forEach(add);
    return out;
  }

  function installSharedSalesMerge(){
    if(window.__QMES_SALES_SHARED_READ_MERGE_20260828_V1__)return true;
    const original=window.qmesSyncList;
    if(typeof original!=="function")return false;
    window.__QMES_SALES_SHARED_READ_MERGE_20260828_V1__=true;
    const wrapped=async function(...args){
      const records=await original.apply(this,args);
      if(String(args[0]||"")!=="inventory"||!Array.isArray(records))return records;
      const local=salesRows();
      return records.map(record=>{
        if(clean(record?.record_key)!=="erp:sales")return record;
        let payload=record?.payload;
        let wasString=typeof payload==="string";
        if(wasString){try{payload=JSON.parse(payload);}catch(_){return record;}}
        if(!payload||payload.module!=="erp"||!Array.isArray(payload.rows))return record;
        const merged=mergeSalesRows(payload.rows,local);
        if(merged.length===payload.rows.length&&merged.every((row,index)=>row===payload.rows[index]))return record;
        const nextPayload={...payload,rows:merged,localMergeApplied:true};
        return {...record,payload:wasString?JSON.stringify(nextPayload):nextPayload};
      });
    };
    wrapped.__qmesOriginal=original;
    wrapped.__qmesSalesMergeV1=true;
    window.qmesSyncList=wrapped;
    return true;
  }

  function findRow(id){
    const wanted=clean(id);if(!wanted)return null;
    const map=metaMap();
    const mappedKey=Object.keys(map).find(key=>clean(map[key]?.salesOrderIdOverride)===wanted)||"";
    return salesRows().find(row=>{
      const rid=clean(row?.id),key=rowKey(row),shown=visibleId(row,map);
      return rid===wanted||key===wanted||shown===wanted||(mappedKey&&(rid===mappedKey||key===mappedKey));
    })||null;
  }
  function currentVisibleId(){
    const root=document.querySelector(".qmes-sales-stable")||Array.from(document.querySelectorAll(".qerp")).find(node=>/수주\s*·?\s*납기관리/.test(clean(node.querySelector(".qerp-title")?.textContent)));
    const link=root?.querySelector("table tbody [data-qso-visible-id],table tbody .qmes-sales-order-link,table tbody [data-qso-id],table tbody td:first-child a,table tbody td:first-child button");
    return clean(link?.getAttribute?.("data-qso-visible-id"))||clean(link?.textContent)||clean(link?.getAttribute?.("data-qso-id"));
  }
  function packText(row){
    const map=readMap(PACK_KEY),meta=metaFor(row),key=rowKey(row),p=map[key]||map[clean(row?.id)]||row?.packaging||{};
    const type=clean(p.type||p.packagingType||row?.packagingType),unit=num(p.unitWeight??p.unitPackQty??row?.unitPackQty),count=num(p.packageQty??row?.packageQty);
    if(!type&&!unit&&!count)return "-";
    return [type,unit&&count?`${unit.toLocaleString("ko-KR",{maximumFractionDigits:3})}kg × ${count.toLocaleString("ko-KR")}EA`:unit?`${unit.toLocaleString("ko-KR",{maximumFractionDigits:3})}kg/EA`:count?`${count.toLocaleString("ko-KR")}EA`:""].filter(Boolean).join(" · ")||clean(meta.packaging)||"-";
  }
  function remarkText(row){
    const map=readMap(REMARK_KEY),key=rowKey(row);
    return clean(map[key]??map[clean(row?.id)]??row?.remarks??row?.remark??row?.note)||"-";
  }

  function ensureStyle(){
    if(document.getElementById("qmes-sales-bootstrap-detail-style-20260828-v1"))return;
    const style=document.createElement("style");
    style.id="qmes-sales-bootstrap-detail-style-20260828-v1";
    style.textContent=`
      #${PANEL_ID}{position:fixed;inset:0;z-index:16000;background:rgba(15,23,42,.36);display:flex;align-items:center;justify-content:center;padding:24px}
      #${PANEL_ID} .qso-panel{width:min(1180px,96vw);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 24px 80px rgba(15,23,42,.28);border:1px solid #dbe3ec}
      #${PANEL_ID} .qso-head{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #e2e8f0;position:sticky;top:0;background:#fff;z-index:2}
      #${PANEL_ID} h2{margin:0;font-size:20px;font-weight:950;color:#0f172a}#${PANEL_ID} .qso-sub{margin-top:4px;color:#64748b;font-size:11px;font-weight:700}
      #${PANEL_ID} .qso-close{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:8px 13px;font-weight:900;cursor:pointer}
      #${PANEL_ID} .qso-body{padding:18px 20px 22px}.qso-section{margin-bottom:16px}.qso-title{font-size:12px;font-weight:950;color:#334155;margin:0 0 8px}
      #${PANEL_ID} .qso-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #dbe3ec;border-radius:10px;overflow:hidden}
      #${PANEL_ID} .qso-item{padding:10px 12px;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;min-height:62px}#${PANEL_ID} .qso-item:nth-child(4n){border-right:0}
      #${PANEL_ID} .qso-item b{display:block;color:#64748b;font-size:9px;margin-bottom:5px}#${PANEL_ID} .qso-item span{color:#111827;font-size:12px;font-weight:850}
      #${PANEL_ID} .qso-flow{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}#${PANEL_ID} .qso-step{border:1px solid #dbe3ec;border-radius:10px;padding:11px 8px;text-align:center;background:#fff}
      #${PANEL_ID} .qso-step strong{display:block;font-size:10px;color:#475569;margin-bottom:7px}#${PANEL_ID} .qso-badge{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:950}
      #${PANEL_ID} .qso-badge.good{background:#dcfce7;color:#15803d}#${PANEL_ID} .qso-badge.wait{background:#f1f5f9;color:#64748b}#${PANEL_ID} .qso-badge.progress{background:#dbeafe;color:#1d4ed8}#${PANEL_ID} .qso-badge.bad{background:#fee2e2;color:#b91c1c}
      #${PANEL_ID} .qso-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}#${PANEL_ID} .qso-actions button{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:8px 12px;font-size:10px;font-weight:900;cursor:pointer}#${PANEL_ID} .qso-actions button.primary{border-color:#2563eb;background:#2563eb;color:#fff}
      #${BTN_ID}{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:8px;padding:9px 12px;font-size:11px;font-weight:900;cursor:pointer}
      @media(max-width:900px){#${PANEL_ID} .qso-grid{grid-template-columns:repeat(2,1fr)}#${PANEL_ID} .qso-flow{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(style);
  }

  function badge(label="대기",tone="wait"){return {label,tone};}
  function initialFlow(row){
    const plan=clean(row?.plan),ship=clean(row?.shipping);
    const production=/생산완료|완료/.test(plan)?badge("완료","good"):/생산중|진행/.test(plan)?badge("진행중","progress"):badge(row?.workOrder?"연결":"미연동","wait");
    const shipping=/출하완료|납품완료|배송완료|출고완료/.test(ship)?badge("출하완료","good"):/출하검사\s*완료/.test(ship)?badge("출하검사 완료","progress"):badge(ship&&ship!=="-"?ship:"대기","wait");
    return [["수주",badge("접수완료","good")],["원료 · IQC",badge("대기","wait")],["작업지시 · 생산",production],["PQC",badge("대기","wait")],["OQC",badge("대기","wait")],["CoA",badge("미발행","wait")],["출하",shipping]];
  }

  function renderDetail(row){
    ensureStyle();
    const map=metaMap(),meta=metaFor(row,map),shown=visibleId(row,map)||clean(row?.id),lot=clean(row?.workOrder||meta.workOrder)||"-";
    const info=[
      ["수주번호",shown],["수주일자",clean(meta.orderDate)||"-"],["고객사",clean(meta.customerOverride)||clean(row?.customer)||"-"],["고객 PO",clean(row?.po)||"-"],
      ["고객 품목코드",clean(meta.customerItemCode)||"-"],["제품",clean(meta.productOverride)||clean(row?.product)||"-"],["수주수량",`${num(meta.qtyOverride??row?.qty).toLocaleString("ko-KR",{maximumFractionDigits:3})} kg`],["수주구분",clean(meta.orderType)||"양산"],
      ["요청 납기일",clean(meta.requestedDue)||clean(row?.due)||"-"],["확정 납기일",clean(meta.confirmedDue)||"미확정"],["납품처",clean(meta.deliveryPlace)||clean(row?.deliveryPlace)||"-"],["포장정보",packText(row)],
      ["작업지시 / 생산 LOT",lot],["생산계획",clean(meta.productionPlanStatus)||clean(row?.plan)||"-"],["출하상태",clean(meta.shippingStatus)||clean(row?.shipping)||"-"],["비고",remarkText(row)]
    ];
    const steps=initialFlow(row);
    document.getElementById(PANEL_ID)?.remove();
    const panel=document.createElement("div");
    panel.id=PANEL_ID;panel.dataset.qsoCanonicalId=shown;panel.dataset.qsoStoredId=clean(row?.id);
    panel.innerHTML=`<div class="qso-panel"><div class="qso-head"><div><h2>수주 상세 · 진행현황</h2><div class="qso-sub">${esc(shown)} · ${esc(clean(meta.customerOverride)||clean(row?.customer)||"-")} · ${esc(clean(meta.productOverride)||clean(row?.product)||"-")}</div></div><button type="button" class="qso-close" data-qso-close="1">닫기</button></div><div class="qso-body"><section class="qso-section"><h3 class="qso-title">수주 상세</h3><div class="qso-grid">${info.map(([k,v])=>`<div class="qso-item"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join("")}</div></section><section class="qso-section"><h3 class="qso-title">수주 진행현황</h3><div class="qso-flow">${steps.map(([name,state])=>`<div class="qso-step"><strong>${esc(name)}</strong><span class="qso-badge ${esc(state.tone)}">${esc(state.label)}</span></div>`).join("")}</div></section><div class="qso-actions"><button type="button" data-qso-close="1">닫기</button><button type="button" class="primary" data-qso-refresh="${esc(clean(row?.id)||shown)}">상태 새로고침</button></div></div></div>`;
    document.body.appendChild(panel);
    queueMicrotask(()=>window.qmesSalesDetailFastSync?.patchPanel?.());
    setTimeout(()=>window.qmesSalesDetailFastSync?.patchPanel?.(),60);
    return true;
  }

  function openDetail(requested){
    const id=clean(requested)||currentVisibleId();
    const row=findRow(id);
    if(!row){window.alert("수주 데이터를 찾을 수 없습니다.");return false;}
    return renderDetail(row);
  }
  function closeDetail(){document.getElementById(PANEL_ID)?.remove();}

  function ensureButton(){
    const root=document.querySelector(".qmes-sales-stable")||Array.from(document.querySelectorAll(".qerp")).find(node=>/수주\s*·?\s*납기관리/.test(clean(node.querySelector(".qerp-title")?.textContent)));
    const actions=root?.querySelector(".qerp-head-actions");if(!actions)return;
    if(document.getElementById(BTN_ID))return;
    const button=document.createElement("button");button.id=BTN_ID;button.type="button";button.textContent="수주 진행현황";
    const primary=actions.querySelector(".qerp-btn:not(.ghost)");primary?actions.insertBefore(button,primary):actions.appendChild(button);
  }

  /* Expose the detail API before the master loader reaches its old detail modules. */
  window.qmesSalesOrderDetail={open:openDetail,refresh:ensureButton};

  document.addEventListener("click",event=>{
    const target=event.target;if(!(target instanceof Element))return;
    if(target.closest("[data-qso-close]")){event.preventDefault();closeDetail();return;}
    const refresh=target.closest("[data-qso-refresh]");
    if(refresh&&refresh.closest("#"+PANEL_ID)){event.preventDefault();openDetail(refresh.getAttribute("data-qso-refresh")||document.getElementById(PANEL_ID)?.dataset.qsoCanonicalId);return;}
    if(target.id===PANEL_ID)closeDetail();
  },false);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")closeDetail();});

  installSharedSalesMerge();
  [20,80,180,400].forEach(ms=>setTimeout(()=>{installSharedSalesMerge();ensureButton();},ms));
  ["qmes:erp-runtime-loaded","qmes:enterprise-ui-ready","qmes:mes-master-ready","qmes:erp-data-changed"].forEach(name=>window.addEventListener(name,()=>{ensureButton();}));

  window.qmesSalesBootstrapStability={mergeSalesRows,ensureButton,open:openDetail,installSharedSalesMerge};
})();
