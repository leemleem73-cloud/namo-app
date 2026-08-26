/* NAMO QMES — enterprise-style Sales Order / Delivery print forms — 2026-08-26
 * Provides:
 *  1) 수주확인서 (single sales order, A4 portrait)
 *  2) 수주·납기 현황표 (all rows, A4 landscape)
 * Uses current QMES sales, Work Order, PQC, OQC, CoA, packaging and shipment data.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_ENTERPRISE_PRINT_20260826__) return;
  window.__QMES_SALES_ENTERPRISE_PRINT_20260826__=true;

  const SALES_KEY="qmes-erp-sales-v1";
  const PACK_KEY="qmes-sales-packaging-v1";

  const clean=value=>String(value==null?"":value).replace(/\s+/g," ").trim();
  const num=value=>{const n=Number(String(value==null?"":value).replace(/,/g,""));return Number.isFinite(n)?n:0;};
  const esc=value=>String(value==null?"":value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const fmtQty=value=>`${num(value).toLocaleString("ko-KR",{maximumFractionDigits:3})} kg`;
  const fmtDate=value=>{
    const s=clean(value);
    const m=s.match(/(20\d{2})[-./](\d{1,2})[-./](\d{1,2})/);
    return m?`${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`:(s||"-");
  };
  const shortDate=value=>{const d=fmtDate(value);return /^20\d{2}-/.test(d)?d.slice(5).replace("-","/"):d;};

  function readJson(key,fallback){
    try{const value=JSON.parse(localStorage.getItem(key)||"null");return value==null?fallback:value;}catch(_error){return fallback;}
  }
  function salesRows(){const value=readJson(SALES_KEY,[]);return Array.isArray(value)?value:[];}
  function packageMap(){const value=readJson(PACK_KEY,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{};}
  function getDb(){
    try{if(typeof DB!=="undefined"&&DB&&typeof DB==="object") return DB;}catch(_error){}
    return window.DB&&typeof window.DB==="object"?window.DB:null;
  }
  function currentUser(){
    const user=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    return clean(user?.name||user?.uid||user)||"-";
  }
  function salesDate(id){
    const m=clean(id).match(/^SO-(\d{4})(\d{2})(\d{2})-/);
    return m?`${m[1]}-${m[2]}-${m[3]}`:"-";
  }
  function packagingFor(row){
    const map=packageMap();
    const workOrder=clean(row?.workOrder);
    return row?.packaging||map[clean(row?.id)]||map[workOrder]||(
      row?.packagingType||row?.unitPackQty||row?.packageQty
        ? {type:row.packagingType,unitWeight:row.unitPackQty,packageQty:row.packageQty}
        : null
    );
  }
  function packagingText(row){
    const pkg=packagingFor(row);
    if(!pkg)return "-";
    const type=clean(pkg.type||pkg.packagingType);
    const unit=num(pkg.unitWeight??pkg.unitPackQty);
    const count=num(pkg.packageQty);
    const parts=[];
    if(type)parts.push(type);
    if(unit&&count)parts.push(`${unit.toLocaleString("ko-KR",{maximumFractionDigits:3})}kg × ${count.toLocaleString("ko-KR")}EA`);
    else if(unit)parts.push(`${unit.toLocaleString("ko-KR",{maximumFractionDigits:3})}kg/EA`);
    else if(count)parts.push(`${count.toLocaleString("ko-KR")}EA`);
    return parts.join(" · ")||"-";
  }
  function packagingTotal(row){
    const pkg=packagingFor(row); if(!pkg)return 0;
    return num(pkg.total)||(num(pkg.unitWeight??pkg.unitPackQty)*num(pkg.packageQty));
  }
  function inspectionStatus(kind,lot){
    const db=getDb();
    const rows=Array.isArray(db?.insp?.[kind])?db.insp[kind].filter(row=>clean(row?.lot)===clean(lot)):[];
    if(!rows.length)return "대기";
    const groupKey=row=>clean(row?.groupId)||clean(row?.id).replace(/-\d+$/,"");
    const groups=new Map();
    rows.forEach(row=>{const key=groupKey(row);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);});
    const latest=Array.from(groups.values()).sort((a,b)=>{
      const av=a[0]||{},bv=b[0]||{};
      return `${clean(bv.date||bv.shipDate)} ${clean(bv.time)} ${clean(bv.id)}`.localeCompare(`${clean(av.date||av.shipDate)} ${clean(av.time)} ${clean(av.id)}`);
    })[0]||[];
    if(latest.some(row=>/불합격|NG|FAIL/i.test(clean(row?.judge))))return "불합격";
    if(latest.length&&latest.every(row=>/합격|PASS|OK/i.test(clean(row?.judge))))return "합격";
    if(latest.some(row=>clean(row?.value)||Array.isArray(row?.measurements)&&row.measurements.some(v=>clean(v))))return "검사중";
    return "대기";
  }
  function productionStatus(row){
    if(clean(row?.workOrderStatus))return clean(row.workOrderStatus);
    const db=getDb(); const lot=clean(row?.workOrder);
    const doc=db?.woDocs?.[lot]||{};
    const batch=(Array.isArray(db?.batches)?db.batches:[]).find(item=>clean(item?.no)===lot)||{};
    try{if(typeof getAutoWoStatus==="function"&&lot)return clean(getAutoWoStatus(lot));}catch(_error){}
    return clean(doc.manualStatus||doc.status||batch.status)||"-";
  }
  function linkedLot(row){return clean(row?.workOrder)||"-";}
  function pqcStatus(row){const lot=linkedLot(row);const s=lot==="-"?"대기":inspectionStatus("PQC",lot);return s==="합격"?"공정검사 완료":s==="불합격"?"공정검사 불합격":s==="검사중"?"공정검사 중":"공정검사 대기";}
  function oqcStatus(row){const lot=linkedLot(row);const s=lot==="-"?"대기":inspectionStatus("OQC",lot);return s==="합격"?"출하검사 완료":s==="불합격"?"출하검사 불합격":s==="검사중"?"출하검사 중":"출하검사 대기";}
  function coaStatus(row){const db=getDb();const lot=linkedLot(row);return lot!=="-"&&db?.coa?.[lot]?"발행완료":"미발행";}
  function productionDate(row){
    if(clean(row?.productionDate))return fmtDate(row.productionDate);
    const db=getDb();const lot=linkedLot(row);
    const doc=db?.woDocs?.[lot]||{};
    const batch=(Array.isArray(db?.batches)?db.batches:[]).find(item=>clean(item?.no)===lot)||{};
    return fmtDate(doc.date||doc.productionDate||batch.date||batch.productionDate);
  }
  function deliveryStatus(row){return clean(row?.shipping)||"-";}
  function statusClass(value){
    const s=clean(value);
    if(/불합격|차단|지연|위험/.test(s))return "bad";
    if(/완료|합격|발행완료|출하완료/.test(s))return "good";
    if(/중|진행/.test(s))return "progress";
    if(/대기|미발행/.test(s))return "wait";
    return "neutral";
  }
  function statusBadge(value){return `<span class="status ${statusClass(value)}">${esc(value||"-")}</span>`;}

  function printBase(title,body,landscape){
    const popup=window.open("","_blank","width=1200,height=860");
    if(!popup){window.alert("인쇄 창이 차단되었습니다. 브라우저 팝업 허용 후 다시 시도하세요.");return;}
    const page=landscape?"A4 landscape":"A4 portrait";
    popup.document.open();
    popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
      @page{size:${page};margin:9mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111827;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif}body{font-size:10.5px}.sheet{width:100%;margin:0 auto}.doc-head{display:grid;grid-template-columns:170px 1fr 220px;border:1.4px solid #111827;min-height:64px}.brand{display:flex;align-items:center;justify-content:center;border-right:1px solid #111827;font-weight:900;font-size:19px;letter-spacing:.4px}.title{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.title h1{font-size:20px;margin:0 0 3px;letter-spacing:-.4px}.title small{font-size:9px;color:#475569;font-weight:700}.meta{display:grid;grid-template-columns:72px 1fr}.meta b,.meta span{display:flex;align-items:center;padding:4px 6px;border-left:1px solid #111827;border-bottom:1px solid #111827}.meta b{justify-content:center;background:#f1f5f9;font-size:9px}.meta span{font-size:9px}.meta b:nth-last-child(-n+2),.meta span:nth-last-child(-n+2){border-bottom:0}.section-title{margin-top:8px;padding:5px 7px;border:1px solid #334155;border-bottom:0;background:#eaf0f6;font-weight:900;font-size:10px}.grid-table,.list-table{width:100%;border-collapse:collapse;table-layout:fixed}.grid-table th,.grid-table td,.list-table th,.list-table td{border:1px solid #64748b;padding:5px 6px;vertical-align:middle}.grid-table th,.list-table th{background:#f8fafc;color:#334155;font-weight:900;text-align:center}.grid-table td{font-size:10.5px}.list-table{font-size:8.5px}.list-table th,.list-table td{padding:4px 4px}.list-table td{text-align:center;word-break:break-all}.list-table td.left{text-align:left}.strong{font-weight:900}.status{display:inline-block;border-radius:999px;padding:2px 6px;font-size:8px;font-weight:900;white-space:nowrap}.status.good{background:#dcfce7;color:#166534}.status.wait{background:#ffedd5;color:#9a3412}.status.progress{background:#dbeafe;color:#1e40af}.status.bad{background:#fee2e2;color:#991b1b}.status.neutral{background:#f1f5f9;color:#475569}.flow{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}.flow-item{border:1px solid #94a3b8;border-radius:4px;padding:7px 4px;text-align:center}.flow-item b{display:block;font-size:9px;margin-bottom:4px}.flow-item small{font-size:8px}.approval{display:grid;grid-template-columns:1fr 92px 92px 92px;margin-top:9px;border:1px solid #64748b}.approval>div{min-height:42px;border-right:1px solid #64748b;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px}.approval>div:last-child{border-right:0}.approval .note{justify-content:flex-start;text-align:left;color:#475569;font-size:8px}.approval b{display:block;font-size:8px;color:#475569;margin-bottom:3px}.footer{display:flex;justify-content:space-between;gap:10px;margin-top:6px;color:#64748b;font-size:7.5px}.mismatch{color:#b91c1c;font-weight:900}.screen-actions{display:flex;justify-content:flex-end;gap:6px;margin:0 0 8px}.screen-actions button{border:0;border-radius:5px;padding:6px 10px;font-weight:800;cursor:pointer}.screen-actions .print{background:#1d4ed8;color:#fff}.screen-actions .close{background:#e2e8f0;color:#334155}@media print{.screen-actions{display:none!important}.sheet{page-break-inside:avoid}}
    </style></head><body><div class="screen-actions"><button class="close" onclick="window.close()">닫기</button><button class="print" onclick="window.print()">인쇄 / PDF 저장</button></div>${body}</body></html>`);
    popup.document.close();
    try{popup.focus();}catch(_error){}
  }

  function printOne(row){
    if(!row)return;
    const lot=linkedLot(row);
    const pkg=packagingFor(row)||{};
    const pTotal=packagingTotal(row);
    const qty=num(row.qty);
    const mismatch=pTotal>0&&qty>0&&Math.abs(pTotal-qty)>0.01;
    const now=new Date();
    const printDate=now.toLocaleString("ko-KR",{hour12:false});
    const body=`<div class="sheet">
      <div class="doc-head">
        <div class="brand">NAMO CHEMICAL</div>
        <div class="title"><h1>수주 · 납기 관리표</h1><small>SALES ORDER &amp; DELIVERY CONTROL SHEET</small></div>
        <div class="meta"><b>문서번호</b><span>NMC-SO-001</span><b>개정번호</b><span>Rev.00</span><b>출력일자</b><span>${esc(now.toISOString().slice(0,10))}</span></div>
      </div>

      <div class="section-title">1. 수주 기본정보 / ORDER INFORMATION</div>
      <table class="grid-table"><colgroup><col style="width:14%"><col style="width:36%"><col style="width:14%"><col style="width:36%"></colgroup>
        <tr><th>수주번호</th><td class="strong">${esc(row.id)}</td><th>수주일자</th><td>${esc(salesDate(row.id))}</td></tr>
        <tr><th>고객사</th><td>${esc(row.customer||"-")}</td><th>고객 PO 번호</th><td>${esc(row.po||"-")}</td></tr>
        <tr><th>제품명</th><td class="strong">${esc(row.product||"-")}</td><th>수주수량</th><td class="strong">${esc(fmtQty(row.qty))}</td></tr>
        <tr><th>요청 납기일</th><td>${esc(fmtDate(row.due))}</td><th>확정 납기</th><td>${esc(fmtDate(row.confirmedDue||row.due))}</td></tr>
      </table>

      <div class="section-title">2. 생산 · LOT 연계 / PRODUCTION TRACEABILITY</div>
      <table class="grid-table"><colgroup><col style="width:14%"><col style="width:36%"><col style="width:14%"><col style="width:36%"></colgroup>
        <tr><th>작업지시 / LOT</th><td class="strong">${esc(lot)}</td><th>생산일자</th><td>${esc(productionDate(row))}</td></tr>
        <tr><th>생산계획</th><td>${statusBadge(clean(row.plan)||"-")}</td><th>생산상태</th><td>${statusBadge(productionStatus(row))}</td></tr>
      </table>

      <div class="section-title">3. 포장정보 / PACKAGING INFORMATION</div>
      <table class="grid-table"><colgroup><col style="width:14%"><col style="width:20%"><col style="width:14%"><col style="width:18%"><col style="width:14%"><col style="width:20%"></colgroup>
        <tr><th>포장형태</th><td>${esc(clean(pkg.type||pkg.packagingType)||"-")}</td><th>단위 포장량</th><td>${num(pkg.unitWeight??pkg.unitPackQty)?esc(fmtQty(pkg.unitWeight??pkg.unitPackQty))+" / EA":"-"}</td><th>포장수량</th><td>${num(pkg.packageQty)?esc(`${num(pkg.packageQty).toLocaleString("ko-KR")} EA`):"-"}</td></tr>
        <tr><th>포장 합계</th><td colspan="2" class="${mismatch?"mismatch":"strong"}">${pTotal?esc(fmtQty(pTotal)):"-"}</td><th>수주수량 대조</th><td colspan="2" class="${mismatch?"mismatch":""}">${mismatch?`불일치 (${esc(fmtQty(qty))} ↔ ${esc(fmtQty(pTotal))})`:pTotal?"일치":"포장정보 미입력"}</td></tr>
      </table>

      <div class="section-title">4. 품질 · 출하 진행상태 / QUALITY &amp; DELIVERY STATUS</div>
      <div class="flow">
        <div class="flow-item"><b>작업지시</b><small>${statusBadge(lot!=="-"?"연동완료":"미연동")}</small></div>
        <div class="flow-item"><b>생산</b><small>${statusBadge(productionStatus(row))}</small></div>
        <div class="flow-item"><b>PQC</b><small>${statusBadge(pqcStatus(row))}</small></div>
        <div class="flow-item"><b>OQC</b><small>${statusBadge(oqcStatus(row))}</small></div>
        <div class="flow-item"><b>CoA</b><small>${statusBadge(coaStatus(row))}</small></div>
        <div class="flow-item"><b>출하</b><small>${statusBadge(deliveryStatus(row))}</small></div>
      </div>

      <div class="section-title">5. 특이사항 / REMARKS</div>
      <table class="grid-table"><tr><td style="height:55px;vertical-align:top">${esc(row.remarks||row.note||"-")}</td></tr></table>

      <div class="approval"><div class="note">본 문서는 QMES의 수주·작업지시·검사·출하 데이터를 LOT 기준으로 연결하여 출력한 전산관리본입니다.</div><div><span><b>작성</b>${esc(currentUser())}</span></div><div><span><b>검토</b>-</span></div><div><span><b>승인</b>-</span></div></div>
      <div class="footer"><span>관리부서: 생산/품질 · NAMO CHEMICAL QMES</span><span>출력시각: ${esc(printDate)} · 전산 원본 우선</span></div>
    </div>`;
    printBase(`수주확인서_${row.id}`,body,false);
  }

  function printLedger(){
    const rows=salesRows();
    if(!rows.length){window.alert("출력할 수주 데이터가 없습니다.");return;}
    const now=new Date();
    const body=`<div class="sheet">
      <div class="doc-head" style="grid-template-columns:170px 1fr 220px">
        <div class="brand">NAMO CHEMICAL</div>
        <div class="title"><h1>수주 · 납기 현황표</h1><small>SALES ORDER &amp; DELIVERY STATUS REPORT</small></div>
        <div class="meta"><b>문서번호</b><span>NMC-SO-002</span><b>개정번호</b><span>Rev.00</span><b>기준일자</b><span>${esc(now.toISOString().slice(0,10))}</span></div>
      </div>
      <div class="section-title">수주 · 생산 · 품질 · 출하 통합현황</div>
      <table class="list-table"><thead><tr>
        <th style="width:8%">수주번호</th><th style="width:7%">고객사</th><th style="width:8%">고객 PO</th><th style="width:8%">제품</th><th style="width:6%">수량</th><th style="width:11%">포장정보</th><th style="width:6%">납기일</th><th style="width:8%">생산 LOT</th><th style="width:7%">생산</th><th style="width:8%">PQC</th><th style="width:8%">OQC</th><th style="width:6%">CoA</th><th style="width:9%">출하상태</th>
      </tr></thead><tbody>${rows.map(row=>`<tr>
        <td class="strong">${esc(row.id)}</td><td>${esc(row.customer||"-")}</td><td>${esc(row.po||"-")}</td><td class="left">${esc(row.product||"-")}</td><td>${esc(fmtQty(row.qty))}</td><td class="left">${esc(packagingText(row))}</td><td>${esc(shortDate(row.due))}</td><td>${esc(linkedLot(row))}</td><td>${statusBadge(productionStatus(row))}</td><td>${statusBadge(pqcStatus(row))}</td><td>${statusBadge(oqcStatus(row))}</td><td>${statusBadge(coaStatus(row))}</td><td>${statusBadge(deliveryStatus(row))}</td>
      </tr>`).join("")}</tbody></table>
      <div class="footer"><span>총 ${rows.length.toLocaleString("ko-KR")}건 · 수주량 합계 ${esc(fmtQty(rows.reduce((sum,row)=>sum+num(row.qty),0)))}</span><span>출력: ${esc(currentUser())} · ${esc(now.toLocaleString("ko-KR",{hour12:false}))}</span></div>
    </div>`;
    printBase("수주_납기_현황표",body,true);
  }

  function findSalesRoot(){
    return Array.from(document.querySelectorAll(".qerp")).find(root=>clean(root.querySelector(".qerp-title")?.textContent)==="수주 · 납기관리")||null;
  }
  function ensureHeaderButton(root){
    const actions=root.querySelector(".qerp-head-actions");
    if(!actions||actions.querySelector('[data-qmes-sales-ledger-print="1"]'))return;
    const button=document.createElement("button");
    button.type="button";button.className="qerp-btn ghost";button.dataset.qmesSalesLedgerPrint="1";
    button.textContent="현황표 출력";
    button.addEventListener("click",printLedger);
    const primary=actions.querySelector(".qerp-btn:not(.ghost)");
    if(primary)actions.insertBefore(button,primary);else actions.appendChild(button);
  }
  function ensureRowPrint(root){
    const table=Array.from(root.querySelectorAll("table.qerp-table")).find(t=>/수주번호/.test(clean(t.querySelector("thead")?.textContent)));
    if(!table)return;
    const head=table.querySelector("thead tr");
    if(head&&!head.querySelector('[data-qmes-sales-print-head="1"]')){
      const th=document.createElement("th");th.dataset.qmesSalesPrintHead="1";th.textContent="출력";head.appendChild(th);
    }
    table.querySelectorAll("tbody tr").forEach(tr=>{
      let td=tr.querySelector('[data-qmes-sales-print-cell="1"]');
      if(!td){td=document.createElement("td");td.dataset.qmesSalesPrintCell="1";tr.appendChild(td);}
      const id=clean(tr.children[0]?.textContent);
      if(!id)return;
      td.innerHTML="";
      const button=document.createElement("button");
      button.type="button";button.className="qerp-linkbtn";button.textContent="수주확인서";
      button.style.cssText="border:1px solid #cbd5e1;background:#fff;border-radius:6px;padding:4px 7px;color:#1d4ed8;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap";
      button.addEventListener("click",()=>{
        const row=salesRows().find(item=>clean(item?.id)===id);
        if(!row){window.alert("해당 수주 데이터를 찾을 수 없습니다.");return;}
        printOne(row);
      });
      td.appendChild(button);
    });
  }
  function apply(){const root=findSalesRoot();if(!root)return;ensureHeaderButton(root);ensureRowPrint(root);}

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});};
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  ["qmes:erp-runtime-loaded","qmes:erp-data-changed","qmes:quality-linkage-updated","qmes:mes-master-ready"].forEach(name=>window.addEventListener(name,schedule));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});else schedule();

  window.qmesSalesPrint={printOneById:id=>printOne(salesRows().find(row=>clean(row?.id)===clean(id))),printLedger};
})();
