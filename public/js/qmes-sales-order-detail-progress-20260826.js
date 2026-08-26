/* NAMO QMES — Sales Order detail / progress view — 2026-08-26
 * Click-based only: no DOM-wide MutationObserver.
 * Flow: 수주 -> 원료/IQC -> 작업지시/생산 -> PQC -> OQC -> CoA -> 출하
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ORDER_DETAIL_PROGRESS_20260826__) return;
  window.__QMES_SALES_ORDER_DETAIL_PROGRESS_20260826__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const PACK_KEY="qmes-sales-packaging-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const REMARK_KEY="qmes-sales-remarks-v1";
  const PANEL_ID="qmes-sales-order-detail-panel-20260826";
  const BTN_ID="qmes-sales-progress-button-20260826";

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const num=v=>{const n=Number(String(v==null?"":v).replace(/,/g,""));return Number.isFinite(n)?n:0;};
  const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v;}catch(_){return f;}};
  const map=k=>{const v=read(k,{});return v&&typeof v==="object"&&!Array.isArray(v)?v:{};};
  const rows=()=>{const v=read(SALES_KEY,[]);return Array.isArray(v)?v:[];};
  const getDb=()=>{try{if(typeof DB!=="undefined"&&DB&&typeof DB==="object")return DB;}catch(_){}return window.DB&&typeof window.DB==="object"?window.DB:null;};
  const fmtQty=v=>`${num(v).toLocaleString("ko-KR",{maximumFractionDigits:3})} kg`;
  const iso=v=>{const s=clean(v),m=s.match(/(20\d{2})[-./](\d{1,2})[-./](\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`:(s||"-");};

  function salesRoot(){return Array.from(document.querySelectorAll(".qerp")).find(r=>clean(r.querySelector(".qerp-title")?.textContent)==="수주 · 납기관리")||null;}
  function rowById(id){return rows().find(r=>clean(r?.id)===clean(id))||null;}
  function keyFor(row){return clean(row?.workOrder)||clean(row?.id);}
  function metaFor(row){const m=map(META_KEY),k=keyFor(row);return m[clean(row?.id)]||m[k]||row?.orderMeta||{};}
  function packFor(row){const m=map(PACK_KEY),k=keyFor(row);return m[clean(row?.id)]||m[k]||row?.packaging||null;}
  function remarkFor(row){const m=map(REMARK_KEY),k=keyFor(row);return clean(m[clean(row?.id)]??m[k]??row?.remarks??row?.remark??row?.note)||"-";}
  function packText(row){const p=packFor(row);if(!p)return "-";const type=clean(p.type||p.packagingType),u=num(p.unitWeight??p.unitPackQty),q=num(p.packageQty);return [type,u&&q?`${u}kg × ${q}EA`:u?`${u}kg/EA`:q?`${q}EA`:""].filter(Boolean).join(" · ")||"-";}

  function inspection(kind,lot){
    const db=getDb(),list=Array.isArray(db?.insp?.[kind])?db.insp[kind].filter(x=>clean(x?.lot)===lot):[];
    if(!list.length)return {label:"대기",tone:"wait"};
    if(list.some(x=>/불합격|NG|FAIL/i.test(clean(x?.judge))))return {label:"불합격",tone:"bad"};
    const judged=list.map(x=>clean(x?.judge)).filter(Boolean);
    if(judged.length&&judged.every(x=>/합격|PASS|OK/i.test(x)))return {label:"완료",tone:"good"};
    return {label:"진행중",tone:"progress"};
  }
  function workStatus(row){
    const db=getDb(),lot=clean(row?.workOrder);if(!lot)return {label:"미연동",tone:"wait"};
    const doc=db?.woDocs?.[lot]||{},batch=(Array.isArray(db?.batches)?db.batches:[]).find(x=>clean(x?.no)===lot)||{};
    let s="";try{if(typeof getAutoWoStatus==="function")s=clean(getAutoWoStatus(lot));}catch(_){}
    s=s||clean(doc.manualStatus||doc.status||batch.status);
    if(/완료/.test(s))return {label:"완료",tone:"good"};
    if(/생산중|진행|실적/.test(s))return {label:"진행중",tone:"progress"};
    return {label:s||"대기",tone:"wait"};
  }
  function iqcStatus(row){
    const db=getDb(),lot=clean(row?.workOrder),doc=db?.woDocs?.[lot]||{},inputs=Array.isArray(doc.inputs)?doc.inputs:[];
    const raw=inputs.filter(x=>clean(x?.lot||x?.materialLot));
    if(!raw.length)return {label:"원료 LOT 미연결",tone:"wait"};
    let matched=0,fail=0;
    raw.forEach(input=>{const ml=clean(input.lot||input.materialLot),found=(Array.isArray(db?.iqc)?db.iqc:[]).filter(x=>clean(x?.lot)===ml);if(found.length)matched++;if(found.some(x=>/불합격|NG|FAIL/i.test(clean(x?.judge))))fail++;});
    if(fail)return {label:`불합격 ${fail}건`,tone:"bad"};
    if(matched===raw.length)return {label:`완료 ${matched}/${raw.length}`,tone:"good"};
    return {label:`확인 ${matched}/${raw.length}`,tone:"progress"};
  }
  function coaStatus(row){const db=getDb(),lot=clean(row?.workOrder);return lot&&db?.coa?.[lot]?{label:"발행완료",tone:"good"}:{label:"미발행",tone:"wait"};}
  function shippingStatus(row){const s=clean(row?.shipping);if(/출하완료/.test(s))return {label:"출하완료",tone:"good"};if(/차단|불합격/.test(s))return {label:s,tone:"bad"};if(/완료/.test(s))return {label:s,tone:"good"};if(/중/.test(s))return {label:s,tone:"progress"};return {label:s||"출하대기",tone:"wait"};}
  function orderStatus(row){return row?{label:"접수완료",tone:"good"}:{label:"미등록",tone:"wait"};}
  function materialStatus(row){const iqc=iqcStatus(row);return iqc.tone==="good"?{label:"원료확보/검사 완료",tone:"good"}:iqc;}

  function flow(row){
    const lot=clean(row?.workOrder);
    return [
      ["수주",orderStatus(row)],
      ["원료 · IQC",materialStatus(row)],
      ["작업지시 · 생산",workStatus(row)],
      ["PQC",lot?inspection("PQC",lot):{label:"대기",tone:"wait"}],
      ["OQC",lot?inspection("OQC",lot):{label:"대기",tone:"wait"}],
      ["CoA",coaStatus(row)],
      ["출하",shippingStatus(row)]
    ];
  }

  function ensureStyle(){
    if(document.getElementById("qmes-sales-order-detail-style-20260826"))return;
    const s=document.createElement("style");s.id="qmes-sales-order-detail-style-20260826";s.textContent=`
      #${PANEL_ID}{position:fixed;inset:0;z-index:16000;background:rgba(15,23,42,.36);display:flex;align-items:center;justify-content:center;padding:24px}
      #${PANEL_ID} .qso-panel{width:min(1180px,96vw);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 24px 80px rgba(15,23,42,.28);border:1px solid #dbe3ec}
      #${PANEL_ID} .qso-head{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #e2e8f0;position:sticky;top:0;background:#fff;z-index:2}
      #${PANEL_ID} h2{margin:0;font-size:20px;font-weight:950;color:#0f172a}#${PANEL_ID} .qso-sub{margin-top:4px;color:#64748b;font-size:11px;font-weight:700}
      #${PANEL_ID} .qso-close{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:8px 13px;font-weight:900;cursor:pointer}
      #${PANEL_ID} .qso-body{padding:18px 20px 22px}.qso-section{margin-bottom:16px}.qso-title{font-size:12px;font-weight:950;color:#334155;margin:0 0 8px}
      .qso-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #dbe3ec;border-radius:10px;overflow:hidden}.qso-item{padding:10px 12px;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;min-height:62px}.qso-item:nth-child(4n){border-right:0}.qso-item b{display:block;color:#64748b;font-size:9px;margin-bottom:5px}.qso-item span{color:#111827;font-size:12px;font-weight:850}
      .qso-flow{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}.qso-step{position:relative;border:1px solid #dbe3ec;border-radius:10px;padding:11px 8px;text-align:center;background:#fff}.qso-step strong{display:block;font-size:10px;color:#475569;margin-bottom:7px}.qso-badge{display:inline-flex;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:950}.qso-badge.good{background:#dcfce7;color:#15803d}.qso-badge.wait{background:#f1f5f9;color:#64748b}.qso-badge.progress{background:#dbeafe;color:#1d4ed8}.qso-badge.bad{background:#fee2e2;color:#b91c1c}
      .qso-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.qso-actions button{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:8px 12px;font-size:10px;font-weight:900;cursor:pointer}.qso-actions button.primary{border-color:#2563eb;background:#2563eb;color:#fff}
      .qmes-sales-order-link{border:0;background:transparent;color:#1d4ed8;font:inherit;font-weight:950;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px}
      #${BTN_ID}{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:8px;padding:9px 12px;font-size:11px;font-weight:900;cursor:pointer}
      @media(max-width:900px){.qso-grid{grid-template-columns:repeat(2,1fr)}.qso-item:nth-child(4n){border-right:1px solid #e2e8f0}.qso-item:nth-child(2n){border-right:0}.qso-flow{grid-template-columns:repeat(2,1fr)}}
    `;document.head.appendChild(s);
  }

  function detailHtml(row){
    const m=metaFor(row),lot=clean(row?.workOrder)||"-",steps=flow(row),confirmed=clean(m.confirmedDue)||"미확정";
    const info=[
      ["수주번호",row.id],["수주일자",m.orderDate||"-"],["고객사",row.customer||"-"],["고객 PO",row.po||"-"],
      ["고객 품목코드",m.customerItemCode||"-"],["제품",row.product||"-"],["수주수량",fmtQty(row.qty)],["수주구분",m.orderType||"양산"],
      ["요청 납기일",iso(row.due)],["확정 납기일",confirmed],["납품처",m.deliveryPlace||"-"],["포장정보",packText(row)],
      ["작업지시 / 생산 LOT",lot],["생산계획",row.plan||"-"],["출하상태",row.shipping||"-"],["비고",remarkFor(row)]
    ];
    return `<div class="qso-panel"><div class="qso-head"><div><h2>수주 상세 · 진행현황</h2><div class="qso-sub">${esc(row.id)} · ${esc(row.customer||"-")} · ${esc(row.product||"-")}</div></div><button class="qso-close" data-qso-close="1">닫기</button></div><div class="qso-body">
      <section class="qso-section"><h3 class="qso-title">수주 상세</h3><div class="qso-grid">${info.map(([k,v])=>`<div class="qso-item"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join("")}</div></section>
      <section class="qso-section"><h3 class="qso-title">수주 진행현황</h3><div class="qso-flow">${steps.map(([name,s])=>`<div class="qso-step"><strong>${esc(name)}</strong><span class="qso-badge ${esc(s.tone)}">${esc(s.label)}</span></div>`).join("")}</div></section>
      <div class="qso-actions"><button data-qso-close="1">닫기</button><button class="primary" data-qso-refresh="${esc(row.id)}">상태 새로고침</button></div>
    </div></div>`;
  }
  function openDetail(id){const row=rowById(id);if(!row){alert("수주 데이터를 찾을 수 없습니다.");return;}ensureStyle();document.getElementById(PANEL_ID)?.remove();const panel=document.createElement("div");panel.id=PANEL_ID;panel.innerHTML=detailHtml(row);document.body.appendChild(panel);}
  function closeDetail(){document.getElementById(PANEL_ID)?.remove();}

  function ensureEntryPoints(){
    ensureStyle();const root=salesRoot();if(!root)return;
    const actions=root.querySelector(".qerp-head-actions");
    if(actions&&!document.getElementById(BTN_ID)){
      const b=document.createElement("button");b.id=BTN_ID;b.type="button";b.textContent="수주 진행현황";b.addEventListener("click",()=>{const first=rows()[0];if(first)openDetail(first.id);else alert("수주 데이터가 없습니다.");});
      const primary=actions.querySelector(".qerp-btn:not(.ghost)");if(primary)actions.insertBefore(b,primary);else actions.appendChild(b);
    }
    const table=Array.from(root.querySelectorAll("table.qerp-table")).find(t=>/수주번호/.test(clean(t.querySelector("thead")?.textContent)));
    table?.querySelectorAll("tbody tr").forEach(tr=>{
      const td=tr.children[0];if(!td)return;const id=clean(td.textContent);if(!id||td.querySelector(".qmes-sales-order-link"))return;
      td.innerHTML="";const b=document.createElement("button");b.type="button";b.className="qmes-sales-order-link";b.dataset.qsoId=id;b.textContent=id;td.appendChild(b);
    });
  }

  document.addEventListener("click",e=>{
    const order=e.target.closest?.(".qmes-sales-order-link");if(order){e.preventDefault();openDetail(order.dataset.qsoId);return;}
    if(e.target.closest?.("[data-qso-close]")){e.preventDefault();closeDetail();return;}
    const refresh=e.target.closest?.("[data-qso-refresh]");if(refresh){e.preventDefault();openDetail(refresh.dataset.qsoRefresh);}
    if(e.target.id===PANEL_ID)closeDetail();
  },true);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDetail();});

  ["qmes:erp-runtime-loaded","qmes:erp-data-changed","qmes:quality-linkage-updated","qmes:mes-master-ready"].forEach(name=>window.addEventListener(name,()=>setTimeout(ensureEntryPoints,0)));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(ensureEntryPoints,0),{once:true});else setTimeout(ensureEntryPoints,0);
  setTimeout(ensureEntryPoints,800);
  setTimeout(ensureEntryPoints,1800);

  window.qmesSalesOrderDetail={open:openDetail,refresh:ensureEntryPoints};
})();
