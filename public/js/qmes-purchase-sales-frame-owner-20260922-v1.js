/* NAMO QMES - Purchase ledger Sales-frame owner V1 - 2026-09-22
 * ADD-ONLY / NO OVERWRITE.
 * Purpose:
 * - Remove the CURRENT visible purchase UI only.
 * - Keep existing purchase source/data/save/edit/modal logic untouched.
 * - Render a fresh purchase ledger using the same frame/layout language as
 *   the approved Sales/Due management ledger.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_SALES_FRAME_OWNER_20260922_V1__) return;
  window.__QMES_PURCHASE_SALES_FRAME_OWNER_20260922_V1__=true;

  const HOST_ID="qmes-purchase-sales-frame-owner-20260922";
  const STORE="qmes-erp-purchase-v1";
  const WIDTH_KEY="qmes-purchase-sales-frame-widths-v1";
  const PAGE_SIZE=10;

  const state={
    rows:[],
    from:"2025-01-01",
    to:String(new Date().getFullYear())+"-12-31",
    supplier:"",
    item:"",
    po:"전체",
    receipt:"전체",
    q:"",
    page:1,
    loaded:false,
    root:null
  };

  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const lower=v=>clean(v).toLowerCase();
  const esc=v=>String(v==null?"":v)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  const num=v=>{
    if(typeof v==="number") return Number.isFinite(v)?v:0;
    const n=Number(String(v==null?"":v).replace(/[^0-9.-]/g,""));
    return Number.isFinite(n)?n:0;
  };
  const qtyFmt=new Intl.NumberFormat("ko-KR",{maximumFractionDigits:3});
  const wonFmt=new Intl.NumberFormat("ko-KR",{maximumFractionDigits:0});

  function visible(el){
    if(!el||!el.isConnected) return false;
    const s=getComputedStyle(el);
    return s.display!=="none"&&s.visibility!=="hidden";
  }

  function findRoot(){
    const roots=[...document.querySelectorAll(".qmes-purchase-live")];
    return roots.find(root=>{
      if(!visible(root)) return false;
      const text=clean(root.textContent).slice(0,2500);
      return /구매/.test(text)&&/발주/.test(text);
    })||null;
  }

  function rawNo(r){return clean(r&& (r.purchaseNo||r.purchase_no||r.no||r.id));}
  function orderDate(r){return clean(r&&(r.orderDate||r.order_date||r.date||r.createdAt||r.created_at)).slice(0,10);}
  function dueDate(r){return clean(r&&(r.requestedDueDate||r.requested_due_date||r.due||r.dueDate||r.due_date)).slice(0,10);}
  function supplierOf(r){return clean(r&&(r.supplier||r.vendor||r.partner||r.supplierName||r.supplier_name));}
  function itemOf(r){return clean(r&&(r.item||r.material||r.itemName||r.item_name||r.materialName||r.material_name));}
  function specOf(r){return clean(r&&(r.spec||r.specification||r.itemSpec||r.item_spec));}
  function unitOf(r){return clean(r&&r.unit)||"kg";}
  function orderedQty(r){return num(r&&(r.qty??r.quantity??r.orderQty??r.order_qty));}
  function receivedQty(r){return num(r&&(r.receivedQty??r.received_qty??r.receiptQty??r.receipt_qty));}
  function unitPrice(r){return num(r&&(r.unitPrice??r.unit_price??r.price));}
  function supplyAmount(r){
    const v=num(r&&(r.supplyAmount??r.supply_amount??r.amount));
    return v||Math.round(orderedQty(r)*unitPrice(r));
  }
  function vatAmount(r){
    const v=num(r&&(r.vatAmount??r.vat_amount??r.vat));
    return v||Math.round(supplyAmount(r)*0.1);
  }
  function totalAmount(r){
    const v=num(r&&(r.totalAmount??r.total_amount??r.total));
    return v||supplyAmount(r)+vatAmount(r);
  }
  function approvalText(r){return clean(r&&(r.approvalStatus||r.approval_status||r.approval||r.status));}
  function receiptText(r){return clean(r&&(r.receiptStatus||r.receipt_status||r.receipt||r.inboundStatus||r.inbound_status));}
  function iqcText(r){return clean(r&&(r.iqcStatus||r.iqc_status||r.iqc));}
  function iqcRequired(r){
    const v=r&&(r.iqcRequired??r.iqc_required);
    return !(v===false||v===0||lower(v)==="false"||clean(v)==="N");
  }
  function isApprovalPending(r){
    const t=approvalText(r);
    return /결재대기|결재\s*대기|승인대기|상신|구매검토|검토중|대기/.test(t)&&
      !/완료|승인완료|결재완료|발주완료/.test(t);
  }
  function isReceiptComplete(r){
    const oq=orderedQty(r),rq=receivedQty(r),t=receiptText(r);
    return /입고완료|완료/.test(t)||(oq>0&&rq>=oq);
  }
  function isPartial(r){
    const oq=orderedQty(r),rq=receivedQty(r),t=receiptText(r);
    return /부분입고/.test(t)||(rq>0&&oq>rq);
  }
  function isIqcPending(r){
    if(!iqcRequired(r)) return false;
    const t=iqcText(r);
    if(!t) return isReceiptComplete(r)||isPartial(r);
    return !/완료|합격|적합|pass|기존\s*erp\s*반영/.test(lower(t));
  }
  function poStatus(r){
    if(isApprovalPending(r)) return "결재대기";
    const t=approvalText(r);
    if(/반려/.test(t)) return "반려";
    if(/취소/.test(t)) return "취소";
    return "발주완료";
  }
  function receiptStatus(r){
    if(isReceiptComplete(r)) return "입고완료";
    if(isPartial(r)) return "부분입고";
    return "미입고";
  }
  function iqcStatus(r){
    if(!iqcRequired(r)) return "대상아님";
    const t=iqcText(r);
    if(/검사중|진행/.test(t)) return "검사중";
    if(/완료|합격|적합|pass|기존\s*erp\s*반영/.test(lower(t))) return "완료";
    return "대기";
  }

  function normalizeRows(input){
    const rows=Array.isArray(input)?input:[];
    return rows.filter(r=>r&&typeof r==="object"&&rawNo(r))
      .slice()
      .sort((a,b)=>orderDate(b).localeCompare(orderDate(a))||
        rawNo(b).localeCompare(rawNo(a),undefined,{numeric:true}));
  }

  function localRows(){
    if(Array.isArray(window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__)&&window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__.length){
      return normalizeRows(window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__);
    }
    try{
      const parsed=JSON.parse(localStorage.getItem(STORE)||"[]");
      if(Array.isArray(parsed)) return normalizeRows(parsed);
      if(parsed&&Array.isArray(parsed.rows)) return normalizeRows(parsed.rows);
    }catch(_){}
    return [];
  }

  async function refresh(){
    let rows=localRows();
    try{
      const response=await fetch("/api/purchase-orders",{credentials:"same-origin",cache:"no-store",headers:{Accept:"application/json"}});
      if(response.ok){
        const json=await response.json();
        const remote=normalizeRows(Array.isArray(json)?json:(json.rows||json.data||json.items||[]));
        if(remote.length||!rows.length) rows=remote;
        try{localStorage.setItem(STORE,JSON.stringify(rows));}catch(_){}
        window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__=rows;
      }
    }catch(_){}
    state.rows=rows;
    state.loaded=true;
    render();
  }

  function filtered(){
    const q=lower(state.q),sup=lower(state.supplier),item=lower(state.item);
    return state.rows.filter(r=>{
      const d=orderDate(r);
      if(state.from&&d&&d<state.from) return false;
      if(state.to&&d&&d>state.to) return false;
      if(sup&&!lower(supplierOf(r)).includes(sup)) return false;
      if(item&&!lower(itemOf(r)+" "+specOf(r)).includes(item)) return false;
      if(state.po!=="전체"&&poStatus(r)!==state.po) return false;
      if(state.receipt!=="전체"&&receiptStatus(r)!==state.receipt) return false;
      if(q){
        const hay=[
          rawNo(r),supplierOf(r),itemOf(r),specOf(r),poStatus(r),receiptStatus(r),iqcStatus(r),
          clean(r.mrp||r.mrpNo||r.mrp_no),clean(r.workOrder||r.work_order||r.workOrderNo||r.work_order_no)
        ].join(" ").toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function tone(kind,text){
    if(kind==="receipt"){
      if(text==="입고완료") return "good";
      if(text==="부분입고") return "warn";
      return "gray";
    }
    if(kind==="iqc"){
      if(text==="완료") return "good";
      if(text==="검사중") return "blue";
      if(text==="대상아님") return "gray";
      return "warn";
    }
    if(kind==="po"){
      if(text==="발주완료") return "blue";
      if(text==="결재대기") return "warn";
      if(text==="반려"||text==="취소") return "bad";
      return "gray";
    }
    return "gray";
  }

  function badge(kind,text){
    return '<span class="qpsf-badge '+tone(kind,text)+'">'+esc(text)+'</span>';
  }

  function findOriginalCreateButton(){
    const root=state.root||findRoot();
    if(!root) return null;
    const buttons=[...root.querySelectorAll("button,a")];
    return buttons.find(b=>{
      if(b.closest("#"+HOST_ID)) return false;
      const t=clean(b.textContent).replace(/^[+＋]\s*/,"");
      return /^(신규 구매 발주|구매 발주 등록|신규 발주|발주서 생성|등록 닫기|입력 닫기)$/.test(t);
    })||null;
  }

  function openCreate(){
    const b=findOriginalCreateButton();
    if(b){b.click();return;}
    alert("기존 구매 발주 등록 화면을 찾지 못했습니다.");
  }

  function openEdit(no){
    const root=state.root||findRoot();
    if(!root) return;
    const buttons=[...root.querySelectorAll(".qpc-edit-btn,[data-purchase-no]")];
    const b=buttons.find(el=>!el.closest("#"+HOST_ID)&&clean(el.getAttribute("data-purchase-no"))===no);
    if(b){b.click();return;}
    const link=[...root.querySelectorAll(".qp-po-link,[data-purchase-no]")].find(el=>!el.closest("#"+HOST_ID)&&clean(el.textContent)===no);
    if(link){link.click();return;}
    alert("수정 화면을 찾지 못했습니다.");
  }

  function showDetail(no){
    const r=state.rows.find(x=>rawNo(x)===no);
    if(!r) return;
    document.querySelectorAll(".qpsf-detail-overlay").forEach(n=>n.remove());
    const fields=[
      ["발주번호",rawNo(r)],["발주일",orderDate(r)],["거래처",supplierOf(r)],
      ["품목명",itemOf(r)],["규격",specOf(r)||"-"],["발주수량",qtyFmt.format(orderedQty(r))+" "+unitOf(r)],
      ["단가",wonFmt.format(Math.round(unitPrice(r)))+"원"],["공급가액",wonFmt.format(Math.round(supplyAmount(r)))+"원"],
      ["부가세",wonFmt.format(Math.round(vatAmount(r)))+"원"],["합계",wonFmt.format(Math.round(totalAmount(r)))+"원"],
      ["납기일",dueDate(r)||"-"],["입고상태",receiptStatus(r)],["입고수량",qtyFmt.format(receivedQty(r))+" "+unitOf(r)],
      ["IQC",iqcStatus(r)],["결재",poStatus(r)]
    ];
    const o=document.createElement("div");
    o.className="qpsf-detail-overlay";
    o.innerHTML='<div class="qpsf-detail"><div class="qpsf-detail-head"><strong>구매 발주 상세 · '+esc(no)+'</strong><button type="button" data-qpsf-detail-close>×</button></div><div class="qpsf-detail-body">'+
      fields.map(([k,v])=>'<div class="qpsf-detail-item"><span>'+esc(k)+'</span><b>'+esc(v)+'</b></div>').join("")+
      '</div></div>';
    document.body.appendChild(o);
  }

  function downloadCsv(){
    const rows=filtered();
    const header=["발주일","발주번호","거래처명","품목명","규격","발주수량","단위","단가","공급가액","부가세","합계","납기일","입고상태","IQC","결재"];
    const body=rows.map(r=>[
      orderDate(r),rawNo(r),supplierOf(r),itemOf(r),specOf(r),orderedQty(r),unitOf(r),
      unitPrice(r),supplyAmount(r),vatAmount(r),totalAmount(r),dueDate(r),receiptStatus(r),iqcStatus(r),poStatus(r)
    ]);
    const csv="\uFEFF"+[header,...body].map(cols=>cols.map(v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"').join(",")).join("\r\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="QMES_구매발주_"+new Date().toISOString().slice(0,10)+".csv";
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function kpi(label,value,sub,toneClass){
    return '<div class="qpsf-kpi '+(toneClass||"")+'"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(sub)+'</small></div>';
  }

  function applySavedWidths(host){
    let widths=null;
    try{widths=JSON.parse(localStorage.getItem(WIDTH_KEY)||"null");}catch(_){}
    if(!Array.isArray(widths)||widths.length!==16) return;
    const table=host.querySelector(".qpsf-table");
    if(!table) return;
    const total=widths.reduce((a,b)=>a+(Number(b)||0),0);
    table.style.setProperty("width",total+"px","important");
    table.style.setProperty("min-width",total+"px","important");
    widths.forEach((w,i)=>{
      table.querySelectorAll("tr > *:nth-child("+(i+1)+")").forEach(cell=>{
        cell.style.setProperty("width",w+"px","important");
        cell.style.setProperty("min-width",w+"px","important");
        cell.style.setProperty("max-width",w+"px","important");
      });
    });
  }

  function render(){
    const host=document.getElementById(HOST_ID);
    if(!host||!state.root) return;

    const data=filtered();
    const pages=Math.max(1,Math.ceil(data.length/PAGE_SIZE));
    if(state.page>pages) state.page=pages;
    const start=(state.page-1)*PAGE_SIZE;
    const shown=data.slice(start,start+PAGE_SIZE);

    const total=state.rows.length;
    const pending=state.rows.filter(isApprovalPending).length;
    const complete=state.rows.filter(r=>poStatus(r)==="발주완료").length;
    const partial=state.rows.filter(isPartial).length;
    const receiptDone=state.rows.filter(isReceiptComplete).length;
    const iqcPending=state.rows.filter(isIqcPending).length;

    const suppliers=[...new Set(state.rows.map(supplierOf).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ko"));
    const supplierOptions='<option value="">전체</option>'+suppliers.map(v=>'<option value="'+esc(v)+'"'+(state.supplier===v?' selected':'')+'>'+esc(v)+'</option>').join("");

    const rowsHtml=shown.length?shown.map((r,i)=>{
      const no=rawNo(r),rt=receiptStatus(r),it=iqcStatus(r),pt=poStatus(r);
      return '<tr>'+
        '<td>'+String(start+i+1)+'</td>'+
        '<td><button type="button" class="qpsf-link" data-qpsf-detail="'+esc(no)+'">'+esc(orderDate(r)||"-")+'</button></td>'+
        '<td><button type="button" class="qpsf-link" data-qpsf-detail="'+esc(no)+'">'+esc(no)+'</button></td>'+
        '<td title="'+esc(supplierOf(r))+'">'+esc(supplierOf(r)||"-")+'</td>'+
        '<td class="left" title="'+esc(itemOf(r)+" "+specOf(r))+'">'+esc(itemOf(r)||"-")+(specOf(r)?' ('+esc(specOf(r))+')':'')+'</td>'+
        '<td class="num">'+qtyFmt.format(orderedQty(r))+'</td>'+
        '<td>'+esc(unitOf(r))+'</td>'+
        '<td class="num">'+wonFmt.format(Math.round(unitPrice(r)))+'</td>'+
        '<td class="num">'+wonFmt.format(Math.round(supplyAmount(r)))+'</td>'+
        '<td class="num">'+wonFmt.format(Math.round(vatAmount(r)))+'</td>'+
        '<td class="num">'+wonFmt.format(Math.round(totalAmount(r)))+'</td>'+
        '<td>'+esc(dueDate(r)||"-")+'</td>'+
        '<td>'+badge("receipt",rt)+'</td>'+
        '<td>'+badge("iqc",it)+'</td>'+
        '<td>'+badge("po",pt)+'</td>'+
        '<td><span class="qpsf-actions"><button type="button" data-qpsf-detail="'+esc(no)+'">상세</button><button type="button" data-qpsf-edit="'+esc(no)+'">수정</button></span></td>'+
      '</tr>';
    }).join(""):'<tr><td colspan="16" class="qpsf-empty">조회 조건에 해당하는 구매 발주가 없습니다.</td></tr>';

    const pager=Array.from({length:pages},(_,i)=>'<button type="button" class="qpsf-page '+(i+1===state.page?'active':'')+'" data-qpsf-page="'+(i+1)+'">'+(i+1)+'</button>').join("");

    host.innerHTML=
      '<div class="qpsf-head">'+
        '<h1>구매·발주 관리대장</h1>'+
        '<div class="qpsf-head-actions">'+
          '<button type="button" data-qpsf-sync>구매 DB 연동</button>'+
          '<button type="button" data-qpsf-export>엑셀 다운로드</button>'+
          '<button type="button" class="new" data-qpsf-create>+ 신규 구매 발주</button>'+
        '</div>'+
      '</div>'+
      '<div class="qpsf-kpis">'+
        kpi("전체 발주",String(total),"조회기간 기준","")+
        kpi("결재 대기",String(pending),"검토·승인 필요","warn")+
        kpi("발주 완료",String(complete),"협력사 발주 완료","good")+
        kpi("부분 입고",String(partial),"잔량 입고 필요","warn")+
        kpi("입고 완료",String(receiptDone),"발주수량 입고 완료","good")+
        kpi("IQC 대기",String(iqcPending),"입고검사 필요","bad")+
      '</div>'+
      '<div class="qpsf-filter"><div class="qpsf-grid">'+
        '<label class="qpsf-field"><span>기간</span><span class="qpsf-date"><input type="date" data-qpsf-filter="from" value="'+esc(state.from)+'"><b>~</b><input type="date" data-qpsf-filter="to" value="'+esc(state.to)+'"></span></label>'+
        '<label class="qpsf-field"><span>거래처</span><select data-qpsf-filter="supplier">'+supplierOptions+'</select></label>'+
        '<label class="qpsf-field"><span>품목명</span><input data-qpsf-filter="item" value="'+esc(state.item)+'" placeholder="품목명 또는 규격 입력"></label>'+
        '<label class="qpsf-field"><span>발주상태</span><select data-qpsf-filter="po"><option>전체</option><option'+(state.po==="결재대기"?' selected':'')+'>결재대기</option><option'+(state.po==="발주완료"?' selected':'')+'>발주완료</option><option'+(state.po==="반려"?' selected':'')+'>반려</option><option'+(state.po==="취소"?' selected':'')+'>취소</option></select></label>'+
        '<label class="qpsf-field"><span>입고상태</span><select data-qpsf-filter="receipt"><option>전체</option><option'+(state.receipt==="미입고"?' selected':'')+'>미입고</option><option'+(state.receipt==="부분입고"?' selected':'')+'>부분입고</option><option'+(state.receipt==="입고완료"?' selected':'')+'>입고완료</option></select></label>'+
        '<label class="qpsf-field"><span>통합검색</span><input data-qpsf-filter="q" value="'+esc(state.q)+'" placeholder="발주번호, 거래처명, 품목명 등 검색"></label>'+
        '<button type="button" class="primary" data-qpsf-search>조회</button>'+
        '<button type="button" data-qpsf-reset>초기화</button>'+
      '</div></div>'+
      '<div class="qpsf-legend"><div><b>발주 관리 기준</b> · 결재대기: 승인 필요 · 부분입고: 발주수량 미달 · 입고완료: 발주수량 충족 · IQC대기: 입고 후 검사 미완료</div><div>※ 구매·입고·IQC 데이터 기준</div></div>'+
      '<div class="qpsf-table-shell"><table class="qpsf-table"><thead><tr>'+
        ["No","발주일 ↓","발주번호","거래처명","품목명 (규격)","발주수량","단위","단가 (원)","공급가액 (원)","부가세 (원)","합계 (원)","납기일","입고상태","IQC","결재","관리"].map(v=>'<th>'+v+'</th>').join("")+
      '</tr></thead><tbody>'+rowsHtml+'</tbody></table>'+
      '<div class="qpsf-foot">'+pager+'</div></div>';

    applySavedWidths(host);
  }

  function readFilters(){
    const host=document.getElementById(HOST_ID);
    if(!host) return;
    state.from=clean(host.querySelector('[data-qpsf-filter="from"]')?.value);
    state.to=clean(host.querySelector('[data-qpsf-filter="to"]')?.value);
    state.supplier=clean(host.querySelector('[data-qpsf-filter="supplier"]')?.value);
    state.item=clean(host.querySelector('[data-qpsf-filter="item"]')?.value);
    state.po=clean(host.querySelector('[data-qpsf-filter="po"]')?.value)||"전체";
    state.receipt=clean(host.querySelector('[data-qpsf-filter="receipt"]')?.value)||"전체";
    state.q=clean(host.querySelector('[data-qpsf-filter="q"]')?.value);
    state.page=1;
  }

  function resetFilters(){
    state.from="2025-01-01";
    state.to=String(new Date().getFullYear())+"-12-31";
    state.supplier="";state.item="";state.po="전체";state.receipt="전체";state.q="";state.page=1;
  }

  function ensure(){
    const root=findRoot();
    if(!root){
      const host=document.getElementById(HOST_ID);
      if(host) host.remove();
      if(state.root) state.root.classList.remove("qpsf-owned");
      state.root=null;
      return;
    }
    state.root=root;
    root.classList.add("qpsf-owned");

    let host=document.getElementById(HOST_ID);
    if(!host){
      host=document.createElement("section");
      host.id=HOST_ID;
      host.className="qpsf-host";
      root.parentElement.insertBefore(host,root);
    }else if(host.nextElementSibling!==root){
      root.parentElement.insertBefore(host,root);
    }

    if(!state.loaded){
      state.rows=localRows();
      state.loaded=true;
      render();
      refresh();
    }else{
      render();
    }
  }

  function beginResize(event){
    const th=event.target instanceof Element?event.target.closest("#"+HOST_ID+" .qpsf-table th"):null;
    if(!th||event.button!==0) return;
    const r=th.getBoundingClientRect();
    if(Math.abs(event.clientX-r.right)>9) return;
    const table=th.closest("table");
    const headers=[...table.querySelectorAll("thead th")];
    const index=headers.indexOf(th);
    if(index<0) return;

    event.preventDefault();
    const widths=headers.map(x=>Math.round(x.getBoundingClientRect().width));
    const startX=event.clientX,startW=widths[index];

    const move=e=>{
      widths[index]=Math.max(42,Math.min(520,startW+(e.clientX-startX)));
      const total=widths.reduce((a,b)=>a+b,0);
      table.style.setProperty("width",total+"px","important");
      table.style.setProperty("min-width",total+"px","important");
      widths.forEach((w,i)=>table.querySelectorAll("tr > *:nth-child("+(i+1)+")").forEach(cell=>{
        cell.style.setProperty("width",w+"px","important");
        cell.style.setProperty("min-width",w+"px","important");
        cell.style.setProperty("max-width",w+"px","important");
      }));
    };
    const stop=()=>{
      try{localStorage.setItem(WIDTH_KEY,JSON.stringify(widths.map(Math.round)));}catch(_){}
      window.removeEventListener("pointermove",move,true);
      window.removeEventListener("pointerup",stop,true);
    };
    window.addEventListener("pointermove",move,true);
    window.addEventListener("pointerup",stop,true);
  }

  document.addEventListener("pointerdown",beginResize,true);

  document.addEventListener("click",event=>{
    const t=event.target instanceof Element?event.target:null;
    if(!t) return;

    if(t.closest("[data-qpsf-detail-close]")||t.classList.contains("qpsf-detail-overlay")){
      if(t.closest(".qpsf-detail")&&!t.closest("[data-qpsf-detail-close]")) return;
      document.querySelectorAll(".qpsf-detail-overlay").forEach(n=>n.remove());
      return;
    }

    const host=t.closest("#"+HOST_ID);
    if(!host) return;

    if(t.closest("[data-qpsf-create]")){openCreate();return;}
    if(t.closest("[data-qpsf-sync]")){refresh();return;}
    if(t.closest("[data-qpsf-export]")){downloadCsv();return;}
    if(t.closest("[data-qpsf-search]")){readFilters();render();return;}
    if(t.closest("[data-qpsf-reset]")){resetFilters();render();return;}

    const d=t.closest("[data-qpsf-detail]");
    if(d){showDetail(clean(d.getAttribute("data-qpsf-detail")));return;}
    const e=t.closest("[data-qpsf-edit]");
    if(e){openEdit(clean(e.getAttribute("data-qpsf-edit")));return;}
    const p=t.closest("[data-qpsf-page]");
    if(p){state.page=Math.max(1,Number(p.getAttribute("data-qpsf-page"))||1);render();return;}
  },true);

  document.addEventListener("keydown",event=>{
    if(event.key!=="Enter") return;
    const t=event.target instanceof Element?event.target:null;
    if(t&&t.matches("#"+HOST_ID+' [data-qpsf-filter="q"],#'+HOST_ID+' [data-qpsf-filter="item"]')){
      readFilters();render();
    }
  },true);

  let queued=false;
  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;ensure();});
  }

  function start(){
    ensure();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    ["qmes:navigate-tab","qmes:data-updated","qmes:purchase-updated","qmes:shared-sync-complete"].forEach(name=>
      window.addEventListener(name,()=>{state.loaded=false;setTimeout(schedule,0);})
    );
    setInterval(schedule,1200);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();