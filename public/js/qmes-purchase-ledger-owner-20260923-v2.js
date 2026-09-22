/* NAMO QMES - Purchase ledger owner V1 - 2026-09-23
 * ADD-ONLY / NO OVERWRITE.
 * Replaces only the visible Purchase Order route with the approved uploaded UI.
 * Existing purchase source files remain untouched.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_LEDGER_OWNER_20260922_V1__) return;
  window.__QMES_PURCHASE_LEDGER_OWNER_20260922_V1__=true;
  if(!window.React) return;

  var ReactRef=window.React;
  var useRef=ReactRef.useRef;
  var useEffect=ReactRef.useEffect;
  var STORE="qmes-erp-purchase-v1";
  var PAGE_SIZE=10;
  var state={
    host:null,rows:[],loaded:false,page:1,
    from:"2026-01-01",to:"2026-12-31",supplier:"",item:"",poStatus:"",inStatus:"",q:"",
    user:{},canDelete:false
  };

  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
  function lower(v){return clean(v).toLowerCase();}
  function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
  function num(v){var n=Number(String(v==null?"":v).replace(/[^0-9.-]/g,""));return Number.isFinite(n)?n:0;}
  function fmt(v){return Number(v||0).toLocaleString("ko-KR",{maximumFractionDigits:3});}
  function won(v){return Number(v||0).toLocaleString("ko-KR",{maximumFractionDigits:0});}
  function today(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
  function validDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(clean(v));}
  function rowNo(r){return clean(r&&(r.purchaseNo||r.purchase_no||r.no||r.id));}
  function rowDate(r){return clean(r&&(r.orderDate||r.order_date||r.date||r.createdAt||r.created_at)).slice(0,10);}
  function supplier(r){return clean(r&&(r.supplier||r.vendor||r.partner||r.supplierName||r.supplier_name));}
  function item(r){return clean(r&&(r.item||r.material||r.itemName||r.item_name||r.materialName||r.material_name));}
  function spec(r){return clean(r&&(r.spec||r.specification||r.itemSpec||r.item_spec));}
  function qty(r){return num(r&&(r.qty!=null?r.qty:r.quantity!=null?r.quantity:r.orderQty!=null?r.orderQty:r.order_qty));}
  function unit(r){return clean(r&&r.unit)||"kg";}
  function price(r){return num(r&&(r.unitPrice!=null?r.unitPrice:r.unit_price!=null?r.unit_price:r.price));}
  function amount(r){var a=num(r&&(r.amount!=null?r.amount:r.supplyAmount!=null?r.supplyAmount:r.supply_amount));return a||Math.round(qty(r)*price(r));}
  function requested(r){return clean(r&&(r.requestedDueDate||r.requested_due_date||r.due||r.dueDate||r.due_date)).slice(0,10);}
  function confirmed(r){return clean(r&&(r.confirmedDueDate||r.confirmed_due_date||r.expected||r.expectedDate||r.expected_date)).slice(0,10);}
  function received(r){return num(r&&(r.receivedQty!=null?r.receivedQty:r.received_qty!=null?r.received_qty:r.receiptQty!=null?r.receiptQty:r.received));}
  function iqc(r){return clean(r&&(r.iqcStatus||r.iqc_status||r.iqc));}
  function lot(r){return clean(r&&(r.materialLot||r.material_lot||r.lot||r.rawMaterialLot||r.raw_material_lot));}
  function owner(r){return clean(r&&(r.requester||r.owner||r.createdBy||r.updatedBy));}
  function notes(r){return clean(r&&(r.notes||r.remark||r.remarks));}
  function approval(r){return clean(r&&(r.approvalStatus||r.approval_status||r.approval||r.status));}
  function receiptText(r){return clean(r&&(r.receiptStatus||r.receipt_status||r.receiving||r.inboundStatus||r.inbound_status));}

  function poStatus(r){
    var a=approval(r);
    if(/취소/.test(a)) return "취소";
    if(/반려/.test(a)) return "반려";
    if(/검토|대기|미승인|승인대기|상신/.test(a)&&!/승인완료|발주확정|발주완료/.test(a)) return "승인대기";
    return "발주완료";
  }
  function inStatus(r){
    var q=qty(r),rec=received(r),t=receiptText(r);
    if(/지연/.test(t)) return "지연";
    if(/입고완료|완료/.test(t)||(q>0&&rec>=q)) return "입고완료";
    if(/부분/.test(t)||(rec>0&&rec<q)) return "부분입고";
    return "미입고";
  }
  function iqcStatus(r){
    var t=iqc(r);
    if(/합격|적합|pass|ok/i.test(t)) return "합격";
    if(/불합격|부적합|fail|ng/i.test(t)) return "부적합";
    if(/검사|진행/.test(t)) return "검사중";
    return "미착수";
  }
  function dueBase(r){return confirmed(r)||requested(r);}
  function dueDiff(r){
    var d=dueBase(r);
    if(!validDate(d)) return "-";
    var diff=Math.round((new Date(d+"T00:00:00").getTime()-new Date(today()+"T00:00:00").getTime())/86400000);
    if(inStatus(r)==="입고완료") return "0일";
    if(diff<0) return "+"+Math.abs(diff)+"일";
    if(diff===0) return "0일";
    return "-"+diff+"일";
  }
  function dueStatus(r){
    if(inStatus(r)==="입고완료") return "정상";
    var d=dueBase(r);
    if(!validDate(d)) return "미확정";
    var diff=Math.round((new Date(d+"T00:00:00").getTime()-new Date(today()+"T00:00:00").getTime())/86400000);
    return diff<0?"지연":diff<=2?"임박":"정상";
  }
  function tone(text){
    if(/합격|완료|정상/.test(text)) return "ok";
    if(/부분|대기|임박|승인/.test(text)) return "warn";
    if(/지연|부적합|취소|반려/.test(text)) return "bad";
    if(/미입고/.test(text)) return "blue";
    return "gray";
  }
  function badge(text){return '<span class="qpo-status '+tone(text)+'">'+esc(text)+'</span>';}

  function readLocal(){
    try{
      var v=JSON.parse(localStorage.getItem(STORE)||"[]");
      return Array.isArray(v)?v:(v&&Array.isArray(v.rows)?v.rows:[]);
    }catch(_){return [];}
  }
  function writeLocal(rows){
    try{localStorage.setItem(STORE,JSON.stringify(rows));}catch(_){}
    window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__=rows;
  }
  async function saveShared(rows){
    writeLocal(rows);
    if(typeof window.qmesSyncUpsert==="function"){
      try{
        await window.qmesSyncUpsert("inventory","erp:purchase",{
          module:"erp",schema:1,kind:"purchase",rows:rows,
          updatedAt:new Date().toISOString(),
          updatedBy:clean((state.user&&state.user.name)||"")
        });
      }catch(error){console.warn("[QMES Purchase owner] shared save failed",error);}
    }
    window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"purchase"}}));
  }
  async function apiJson(url,options){
    var response=await fetch(url,Object.assign({credentials:"same-origin",cache:"no-store"},options||{}));
    var result=await response.json().catch(function(){return {success:false,message:"HTTP "+response.status};});
    if(!response.ok||(result&&result.success===false)) throw new Error((result&&result.message)||("요청 실패 ("+response.status+")"));
    return result&&Object.prototype.hasOwnProperty.call(result,"data")?result.data:result;
  }
  async function loadRows(){
    state.rows=readLocal();
    render();
    try{
      var data=await apiJson("/api/purchase-orders?_qmesFresh="+Date.now(),{headers:{"Accept":"application/json","Cache-Control":"no-cache, no-store"}});
      var rows=Array.isArray(data)?data:(data&&Array.isArray(data.rows)?data.rows:[]);
      if(Array.isArray(rows)){
        state.rows=rows;
        writeLocal(rows);
        state.loaded=true;
        render();
      }
    }catch(error){
      console.warn("[QMES Purchase owner] DB read unavailable",error);
      state.loaded=true;
      render();
    }
  }
  async function loadUser(){
    var base=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    try{
      var raw=JSON.parse(sessionStorage.getItem("qmes-current-user-v1")||"null");
      if(raw&&typeof raw==="object") base=Object.assign({},base,raw);
    }catch(_){}
    try{
      var data=await apiJson("/api/auth/me");
      if(data&&typeof data==="object") base=Object.assign({},base,data.user||data);
    }catch(_){}
    state.user=base||{};
    var title=clean(state.user.title||state.user.position||state.user.rank||state.user.jobTitle||state.user.job_title);
    var role=lower(state.user.role);
    state.canDelete=/^(부장|이사|상무|전무|부사장|사장|대표|대표이사|회장|임원)$/.test(title)||role==="admin"||role==="administrator"||role==="관리자";
    render();
  }

  function filtered(){
    var sup=lower(state.supplier),it=lower(state.item),q=lower(state.q);
    return state.rows.filter(function(r){
      var d=rowDate(r);
      if(state.from&&d&&d<state.from) return false;
      if(state.to&&d&&d>state.to) return false;
      if(sup&&!lower(supplier(r)).includes(sup)) return false;
      if(it&&!lower(item(r)+" "+spec(r)).includes(it)) return false;
      if(state.poStatus&&poStatus(r)!==state.poStatus) return false;
      if(state.inStatus&&inStatus(r)!==state.inStatus) return false;
      if(q){
        var hay=[rowNo(r),supplier(r),item(r),spec(r),owner(r),notes(r)].join(" ").toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    }).sort(function(a,b){return rowDate(b).localeCompare(rowDate(a))||rowNo(b).localeCompare(rowNo(a),undefined,{numeric:true});});
  }

  function supplierOptions(){
    return Array.from(new Set(state.rows.map(supplier).filter(Boolean))).sort(function(a,b){return a.localeCompare(b,"ko");});
  }
  function kpiData(rows){
    var total=rows.length;
    var done=rows.filter(function(r){return inStatus(r)==="입고완료";}).length;
    var partial=rows.filter(function(r){return inStatus(r)==="부분입고";}).length;
    var late=rows.filter(function(r){return dueStatus(r)==="지연";}).length;
    var openAmount=rows.reduce(function(s,r){
      var q=qty(r),rec=received(r);
      if(q<=0||rec>=q) return s;
      return s+amount(r)*Math.max(0,(q-rec)/q);
    },0);
    var dueRows=rows.filter(function(r){return validDate(dueBase(r));});
    var comply=dueRows.length?Math.max(0,100-(late/dueRows.length*100)):100;
    return {total:total,done:done,partial:partial,late:late,openAmount:openAmount,comply:comply};
  }
  function moneyShort(v){
    if(v>=100000000) return "₩"+(v/100000000).toFixed(1)+"억";
    if(v>=1000000) return "₩"+(v/1000000).toFixed(1)+"M";
    return "₩"+won(v);
  }

  function render(){
    var host=state.host;
    if(!host) return;
    var data=filtered();
    var k=kpiData(data);
    var pages=Math.max(1,Math.ceil(data.length/PAGE_SIZE));
    if(state.page>pages) state.page=pages;
    var start=(state.page-1)*PAGE_SIZE;
    var shown=data.slice(start,start+PAGE_SIZE);
    var sOptions='<option value="">전체</option>'+supplierOptions().map(function(v){return '<option value="'+esc(v)+'"'+(state.supplier===v?' selected':'')+'>'+esc(v)+'</option>';}).join("");
    var rowsHtml=shown.length?shown.map(function(r,i){
      var no=rowNo(r),ins=inStatus(r),iq=iqcStatus(r),dueS=dueStatus(r),po=poStatus(r);
      var missing=Math.max(0,qty(r)-received(r));
      var product=item(r)+(spec(r)?" ("+spec(r)+")":"");
      return '<tr data-no="'+esc(no)+'">'+
        '<td>'+(start+i+1)+'</td>'+
        '<td class="qpo-link" data-action="detail" data-no="'+esc(no)+'">'+esc(rowDate(r)||"-")+'</td>'+
        '<td><button class="qpo-link-btn" data-action="detail" data-no="'+esc(no)+'">'+esc(no||"-")+'</button></td>'+
        '<td>'+esc(supplier(r)||"-")+'</td>'+
        '<td class="left" title="'+esc(product)+'">'+esc(product||"-")+'</td>'+
        '<td>'+fmt(qty(r))+'</td><td>'+esc(unit(r))+'</td>'+
        '<td class="money">'+won(price(r))+'</td>'+
        '<td class="money">'+won(amount(r))+'</td>'+
        '<td>'+esc(requested(r)||"-")+'</td>'+
        '<td>'+esc(confirmed(r)||"-")+'</td>'+
        '<td>'+fmt(received(r))+'</td>'+
        '<td class="'+(missing>0?"short":"")+'">'+fmt(missing)+'</td>'+
        '<td>'+badge(ins)+'</td><td>'+badge(iq)+'</td>'+
        '<td>'+esc(lot(r)||"-")+'</td>'+
        '<td class="'+(dueS==="지연"?"short":"")+'">'+esc(dueDiff(r))+'</td>'+
        '<td>'+badge(dueS)+'</td><td>'+badge(po)+'</td>'+
        '<td>'+esc(owner(r)||"-")+'</td>'+
        '<td class="left" title="'+esc(notes(r))+'">'+esc(notes(r)||"-")+'</td>'+
        '<td><div class="qpo-manage"><button class="qpo-mini detail" data-action="detail" data-no="'+esc(no)+'">상세</button><button class="qpo-mini" data-action="edit" data-no="'+esc(no)+'">수정</button><button class="qpo-mini danger" data-action="delete" data-no="'+esc(no)+'"'+(state.canDelete?"":" disabled title=\"삭제 권한: 부장 및 임원\"")+'>삭제</button></div></td>'+
      '</tr>';
    }).join(""):'<tr><td colspan="22" class="qpo-empty">조건에 맞는 발주가 없습니다.</td></tr>';

    var pager="";
    for(var p=1;p<=pages;p++) pager+='<button class="qpo-page '+(p===state.page?"active":"")+'" data-action="page" data-page="'+p+'">'+p+'</button>';

    host.innerHTML=
      '<div class="qpo-title-row"><h1>구매·발주 관리대장</h1><div class="qpo-title-actions">'+
        '<button class="qpo-action" data-action="upload">구매 업로드</button>'+
        '<button class="qpo-action" data-action="requests">구매요청 불러오기</button>'+
        '<button class="qpo-action green" data-action="download">엑셀 다운로드</button>'+
        '<button class="qpo-action" data-action="print-select">발주서 출력</button>'+
        '<button class="qpo-action blue" data-action="new">+ 신규 발주</button>'+
      '</div></div>'+
      '<div class="qpo-filter">'+
        '<div class="qpo-field"><label>발주기간</label><div class="qpo-period"><input class="qpo-control" type="date" data-filter="from" value="'+esc(state.from)+'"><span>~</span><input class="qpo-control" type="date" data-filter="to" value="'+esc(state.to)+'"></div></div>'+
        '<div class="qpo-field"><label>협력사</label><select class="qpo-control" data-filter="supplier">'+sOptions+'</select></div>'+
        '<div class="qpo-field"><label>품목명</label><input class="qpo-control" data-filter="item" value="'+esc(state.item)+'" placeholder="원자재명 또는 규격 입력"></div>'+
        '<div class="qpo-field"><label>발주상태</label><select class="qpo-control" data-filter="poStatus"><option value="">전체</option><option'+(state.poStatus==="발주완료"?" selected":"")+'>발주완료</option><option'+(state.poStatus==="승인대기"?" selected":"")+'>승인대기</option><option'+(state.poStatus==="취소"?" selected":"")+'>취소</option></select></div>'+
        '<div class="qpo-field"><label>입고상태</label><select class="qpo-control" data-filter="inStatus"><option value="">전체</option><option'+(state.inStatus==="입고완료"?" selected":"")+'>입고완료</option><option'+(state.inStatus==="부분입고"?" selected":"")+'>부분입고</option><option'+(state.inStatus==="미입고"?" selected":"")+'>미입고</option><option'+(state.inStatus==="지연"?" selected":"")+'>지연</option></select></div>'+
        '<div class="qpo-field"><label>통합검색</label><input class="qpo-control" data-filter="q" value="'+esc(state.q)+'" placeholder="발주번호, 협력사, 품목명, 담당자 검색"></div>'+
        '<button class="qpo-search" data-action="search">조회</button>'+
      '</div>'+
      '<div class="qpo-kpis">'+
        '<div class="qpo-kpi info"><span>전체 발주</span><b>'+k.total+'</b><small>조회기간 기준</small></div>'+
        '<div class="qpo-kpi good"><span>입고 완료</span><b>'+k.done+'</b><small>IQC 포함 정상 처리</small></div>'+
        '<div class="qpo-kpi warn"><span>부분 입고</span><b>'+k.partial+'</b><small>잔량 입고 필요</small></div>'+
        '<div class="qpo-kpi bad"><span>납기 지연</span><b>'+k.late+'</b><small>확정입고일 초과</small></div>'+
        '<div class="qpo-kpi"><span>미입고 금액</span><b>'+moneyShort(k.openAmount)+'</b><small>잔량 기준</small></div>'+
        '<div class="qpo-kpi good"><span>협력사 납기준수율</span><b>'+k.comply.toFixed(1)+'%</b><small>현재 조회 기준</small></div>'+
      '</div>'+
      '<div class="qpo-notice"><span><strong>구매·발주 핵심관리</strong> · 발주수량 대비 입고수량 · 요청입고일 대비 실제입고일 · IQC 상태 · 미입고잔량 · 협력사 납기준수</span><span>※ 부분입고 및 납기지연 자동 강조</span></div>'+
      '<div class="qpo-table-box"><div class="qpo-table-scroll"><table class="qpo-table"><thead><tr>'+
        ["No","발주일 ↓","발주번호","협력사","품목명(규격)","발주수량","단위","단가","발주금액","요청입고일","확정입고일","입고수량","미입고수량","입고상태","IQC","LOT","납기차이","납기상태","발주상태","담당자","비고","관리"].map(function(h){return "<th>"+h+"</th>";}).join("")+
      '</tr></thead><tbody>'+rowsHtml+'</tbody></table></div><div class="qpo-pagination">'+pager+'</div></div>'+
      '<div class="qpo-footer-note">※ 업로드된 승인 시안 기준 UI · 발주서 출력은 선택한 발주 건을 A4 1장 전용 양식으로 출력합니다.</div>'+
      '<input type="file" class="qpo-hidden-file" data-role="upload-input" accept=".xlsx,.xls,.csv">';
  }

  function findRow(no){return state.rows.find(function(r){return rowNo(r)===no;})||null;}

  function overlay(title,body,wide){
    closeOverlay();
    var o=document.createElement("div");
    o.className="qpo-modal-bg";
    o.innerHTML='<div class="qpo-modal'+(wide?" wide":"")+'"><div class="qpo-modal-head"><h3>'+esc(title)+'</h3><button class="qpo-x" data-action="close-modal">×</button></div><div class="qpo-modal-body">'+body+'</div></div>';
    state.host.appendChild(o);
  }
  function closeOverlay(){
    if(!state.host) return;
    state.host.querySelectorAll(".qpo-modal-bg").forEach(function(n){n.remove();});
  }
  function detailBody(r){
    var missing=Math.max(0,qty(r)-received(r));
    return '<div class="qpo-modal-summary">'+
      card("발주수량",fmt(qty(r))+" "+unit(r))+card("입고수량",fmt(received(r))+" "+unit(r))+card("미입고수량",fmt(missing)+" "+unit(r))+card("발주금액","₩"+won(amount(r)))+card("납기상태",dueStatus(r))+
    '</div><div class="qpo-flow">'+
      flow("01 구매요청","확인","done")+flow("02 발주",poStatus(r),"done")+flow("03 입고",inStatus(r),inStatus(r)==="입고완료"?"done":"run")+flow("04 IQC",iqcStatus(r),iqcStatus(r)==="합격"?"done":"risk")+flow("05 잔량",fmt(missing)+unit(r)+" 대기",missing>0?"risk":"done")+
    '</div><table class="qpo-info"><tr><th>발주번호</th><td>'+esc(rowNo(r))+'</td><th>발주일</th><td>'+esc(rowDate(r)||"-")+'</td></tr>'+
      '<tr><th>협력사</th><td>'+esc(supplier(r)||"-")+'</td><th>담당자</th><td>'+esc(owner(r)||"-")+'</td></tr>'+
      '<tr><th>품목명</th><td>'+esc(item(r)+(spec(r)?" ("+spec(r)+")":""))+'</td><th>단위</th><td>'+esc(unit(r))+'</td></tr>'+
      '<tr><th>단가</th><td>₩'+won(price(r))+'</td><th>발주금액</th><td>₩'+won(amount(r))+'</td></tr>'+
      '<tr><th>요청입고일</th><td>'+esc(requested(r)||"-")+'</td><th>확정입고일</th><td>'+esc(confirmed(r)||"-")+'</td></tr>'+
      '<tr><th>입고상태</th><td>'+esc(inStatus(r))+'</td><th>IQC</th><td>'+esc(iqcStatus(r))+'</td></tr>'+
      '<tr><th>LOT</th><td>'+esc(lot(r)||"-")+'</td><th>납기차이</th><td>'+esc(dueDiff(r))+'</td></tr>'+
      '<tr><th>비고</th><td colspan="3">'+esc(notes(r)||"-")+'</td></tr></table>';
  }
  function card(l,v){return '<div class="qpo-sum"><span>'+esc(l)+'</span><b>'+esc(v)+'</b></div>';}
  function flow(n,v,cls){return '<div class="qpo-flow-card '+cls+'"><span>'+esc(n)+'</span><b>'+esc(v)+'</b></div>';}

  function formBody(r,isNew){
    var x=r||{};
    return '<form data-role="'+(isNew?"new-form":"edit-form")+'" data-no="'+esc(rowNo(x))+'"><div class="qpo-form-grid">'+
      (!isNew?'<div class="qpo-form-field"><label>발주번호</label><input name="purchaseNo" value="'+esc(rowNo(x))+'" disabled></div>':'')+
      '<div class="qpo-form-field"><label>발주일 *</label><input type="date" name="orderDate" value="'+esc(rowDate(x)||today())+'" required></div>'+
      '<div class="qpo-form-field"><label>협력사 *</label><input name="supplier" value="'+esc(supplier(x))+'" required></div>'+
      '<div class="qpo-form-field"><label>품목명 *</label><input name="item" value="'+esc(item(x))+'" required></div>'+
      '<div class="qpo-form-field"><label>규격</label><input name="spec" value="'+esc(spec(x))+'"></div>'+
      '<div class="qpo-form-field"><label>발주수량 *</label><input type="number" step="any" name="qty" value="'+(qty(x)||"")+'" required></div>'+
      '<div class="qpo-form-field"><label>단위</label><select name="unit"><option'+(unit(x)==="kg"?" selected":"")+'>kg</option><option'+(unit(x)==="EA"?" selected":"")+'>EA</option><option'+(unit(x)==="L"?" selected":"")+'>L</option></select></div>'+
      '<div class="qpo-form-field"><label>단가</label><input type="number" step="any" name="price" value="'+(price(x)||"")+'"></div>'+
      '<div class="qpo-form-field"><label>요청입고일</label><input type="date" name="requested" value="'+esc(requested(x))+'"></div>'+
      '<div class="qpo-form-field"><label>확정입고일</label><input type="date" name="confirmed" value="'+esc(confirmed(x))+'"></div>'+
      '<div class="qpo-form-field"><label>담당자</label><input name="owner" value="'+esc(owner(x)||clean(state.user.name))+'"></div>'+
      '<div class="qpo-form-field full"><label>비고</label><textarea name="notes">'+esc(notes(x))+'</textarea></div>'+
      '</div><div class="qpo-modal-actions"><button type="button" class="qpo-action" data-action="close-modal">취소</button><button type="submit" class="qpo-action blue">저장</button></div></form>';
  }

  function nextNo(){
    var stamp=today().slice(2,10).replace(/-/g,"");
    var prefix="PO-"+stamp+"-";
    var max=state.rows.reduce(function(m,r){
      var id=rowNo(r),seq=id.indexOf(prefix)===0?Number(id.slice(prefix.length)):0;
      return Number.isFinite(seq)?Math.max(m,seq):m;
    },0);
    return prefix+String(max+1).padStart(3,"0");
  }
  function formToRow(form,base,newRow){
    var fd=new FormData(form);
    var q=num(fd.get("qty")),p=num(fd.get("price"));
    var no=newRow?nextNo():rowNo(base);
    return Object.assign({},base||{},{
      id:no,purchaseNo:no,orderDate:clean(fd.get("orderDate")),
      supplier:clean(fd.get("supplier")),item:clean(fd.get("item")),material:clean(fd.get("item")),
      spec:clean(fd.get("spec")),qty:q,unit:clean(fd.get("unit"))||"kg",
      unitPrice:p,price:p,amount:q*p,
      requestedDueDate:clean(fd.get("requested")),due:clean(fd.get("requested")),
      confirmedDueDate:clean(fd.get("confirmed")),expected:clean(fd.get("confirmed")),
      requester:clean(fd.get("owner")),owner:clean(fd.get("owner")),notes:clean(fd.get("notes")),
      approvalStatus:base&&base.approvalStatus?base.approvalStatus:"구매검토",
      approval:base&&base.approval?base.approval:"구매검토",
      receiptStatus:base&&base.receiptStatus?base.receiptStatus:"미입고",
      receiving:base&&base.receiving?base.receiving:"미입고",
      receivedQty:base&&base.receivedQty!=null?base.receivedQty:0,
      iqcStatus:base&&base.iqcStatus?base.iqcStatus:"계획 대기",
      iqc:base&&base.iqc?base.iqc:"계획 대기",
      status:base&&base.status?base.status:"결재대기",
      updatedAt:new Date().toISOString(),
      updatedBy:clean(state.user.name)
    },newRow?{createdAt:new Date().toISOString(),createdBy:clean(state.user.name)}:{});
  }

  async function createRow(row){
    var saved=await apiJson("/api/purchase-orders",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(row)});
    var actual=saved&&typeof saved==="object"?Object.assign({},row,saved):row;
    state.rows=[actual].concat(state.rows);
    await saveShared(state.rows);
    closeOverlay();render();
  }
  async function editRow(row){
    var saved=await apiJson("/api/purchase-orders/"+encodeURIComponent(rowNo(row)),{method:"PUT",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(row)});
    var actual=saved&&typeof saved==="object"?Object.assign({},row,saved):row;
    state.rows=state.rows.map(function(x){return rowNo(x)===rowNo(row)?actual:x;});
    await saveShared(state.rows);
    closeOverlay();render();
  }
  async function deleteRow(r){
    if(!state.canDelete){alert("삭제 권한이 없습니다. 부장 및 임원만 삭제할 수 있습니다.");return;}
    if(!confirm(rowNo(r)+" 구매 발주를 삭제하시겠습니까?")) return;
    await apiJson("/api/purchase-orders/"+encodeURIComponent(rowNo(r)),{method:"DELETE"});
    state.rows=state.rows.filter(function(x){return rowNo(x)!==rowNo(r);});
    await saveShared(state.rows);
    render();
  }

  function printSelector(){
    var rows=filtered();
    var body='<div class="qpo-notice"><span><strong>발주서 출력</strong> · 출력할 발주 건을 선택하세요.</span><span>A4 세로 · 1장</span></div><table class="qpo-print-table"><thead><tr><th>발주번호</th><th>발주일</th><th>협력사</th><th>품목</th><th>수량</th><th>발주금액</th><th>요청입고일</th><th>출력</th></tr></thead><tbody>'+
      rows.map(function(r){return '<tr><td><b>'+esc(rowNo(r))+'</b></td><td>'+esc(rowDate(r))+'</td><td>'+esc(supplier(r))+'</td><td class="left">'+esc(item(r)+(spec(r)?" ("+spec(r)+")":""))+'</td><td>'+fmt(qty(r))+' '+esc(unit(r))+'</td><td>₩'+won(amount(r))+'</td><td>'+esc(requested(r)||"-")+'</td><td><button class="qpo-action blue" data-action="print-one" data-no="'+esc(rowNo(r))+'">발주서 출력</button></td></tr>';}).join("")+
      '</tbody></table>';
    overlay("발주서 출력 선택",body,true);
  }
  function printOne(r){
    var no=esc(rowNo(r)),date=esc(rowDate(r)),sup=esc(supplier(r)),prod=esc(item(r)+(spec(r)?" ("+spec(r)+")":""));
    var q=esc(fmt(qty(r))),u=esc(unit(r)),pr=esc(won(price(r))),amt=esc(won(amount(r)));
    var req=esc(requested(r)||"-"),conf=esc(confirmed(r)||"-"),mgr=esc(owner(r)||"-"),remark=esc(notes(r));
    var html='<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>'+no+' 발주서</title><style>'+
      '@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#111827;font-family:Arial,"Malgun Gothic","Noto Sans KR",sans-serif}body{width:186mm;margin:0 auto;font-size:10pt;line-height:1.35}.sheet{width:100%;min-height:270mm;position:relative}.topline{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:6mm}.company{font-size:18pt;font-weight:900}.company small{display:block;margin-top:1.5mm;font-size:8pt;font-weight:600;color:#475569}.doc{text-align:right;font-size:8.5pt;color:#334155}h1{margin:0 0 6mm;text-align:center;font-size:25pt;letter-spacing:8px;font-weight:900}.subtitle{text-align:center;margin-top:-4mm;margin-bottom:7mm;font-size:8.5pt;color:#64748b;letter-spacing:1px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #1f2937;padding:3mm 2.5mm;vertical-align:middle}th{background:#f3f4f6;text-align:center;font-weight:800}.info th{width:22mm}.info td{height:9mm}.items{margin-top:5mm}.items th{padding:2.8mm 2mm}.items td{height:12mm;text-align:center;padding:3mm 2mm}.items td.item{text-align:left}.amount{text-align:right!important}.summary{margin-top:5mm}.summary td{height:9mm}.summary .label{width:30mm;background:#f3f4f6;font-weight:800;text-align:center}.summary .money{text-align:right;font-weight:900;font-size:11pt}.remark{margin-top:5mm}.remark td{height:22mm;vertical-align:top}.terms{margin-top:5mm;border:1px solid #1f2937;padding:4mm;font-size:8.5pt}.terms strong{display:block;margin-bottom:2mm}.approval{margin-top:8mm}.approval th,.approval td{text-align:center;height:10mm}.approval td.sign{height:18mm}.footer{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;border-top:1px solid #cbd5e1;padding-top:3mm;color:#64748b;font-size:7.5pt}'+
      '</style></head><body><div class="sheet"><div class="topline"><div class="company">나모케미칼<small>NAMO Chemical Co., Ltd.</small></div><div class="doc">발주번호 : <b>'+no+'</b><br>발주일 : '+date+'</div></div><h1>발 주 서</h1><div class="subtitle">PURCHASE ORDER</div>'+
      '<table class="info"><tr><th>협력사</th><td>'+sup+'</td><th>담당자</th><td>'+mgr+'</td></tr><tr><th>요청입고일</th><td>'+req+'</td><th>확정입고일</th><td>'+conf+'</td></tr></table>'+
      '<table class="items"><colgroup><col style="width:12mm"><col><col style="width:27mm"><col style="width:18mm"><col style="width:30mm"><col style="width:36mm"></colgroup><thead><tr><th>No</th><th>품목명 / 규격</th><th>발주수량</th><th>단위</th><th>단가</th><th>금액</th></tr></thead><tbody><tr><td>1</td><td class="item">'+prod+'</td><td>'+q+'</td><td>'+u+'</td><td class="amount">'+pr+'</td><td class="amount">'+amt+'</td></tr><tr><td>2</td><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr><tr><td>3</td><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr><tr><td>4</td><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr><tr><td>5</td><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr></tbody></table>'+
      '<table class="summary"><tr><td class="label">발주금액</td><td class="money">₩ '+amt+'</td></tr></table><table class="remark"><tr><th style="width:30mm">비고</th><td>'+remark+'</td></tr></table>'+
      '<div class="terms"><strong>납품 및 검사</strong>납품된 원자재는 당사 수입검사(IQC) 절차에 따라 확인 후 입고 처리합니다. 발주내용 또는 납기 변경이 필요한 경우 담당자와 사전 협의 바랍니다.</div>'+
      '<table class="approval"><tr><th style="width:28%">구분</th><th>작성</th><th>검토</th><th>승인</th></tr><tr><th>성명 / 서명</th><td class="sign">'+mgr+'</td><td class="sign"></td><td class="sign"></td></tr></table>'+
      '<div class="footer"><span>나모케미칼 구매·발주관리</span><span>'+no+'</span></div></div><script>window.addEventListener("load",function(){setTimeout(function(){window.print()},200)});<\/script></body></html>';
    var w=window.open("","_blank","width=1000,height=850");
    if(!w){alert("팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.");return;}
    w.document.open();w.document.write(html);w.document.close();
  }

  function downloadCsv(){
    var headers=["발주일","발주번호","협력사","품목명","규격","발주수량","단위","단가","발주금액","요청입고일","확정입고일","입고수량","미입고수량","입고상태","IQC","LOT","납기상태","발주상태","담당자","비고"];
    var body=filtered().map(function(r){return [rowDate(r),rowNo(r),supplier(r),item(r),spec(r),qty(r),unit(r),price(r),amount(r),requested(r),confirmed(r),received(r),Math.max(0,qty(r)-received(r)),inStatus(r),iqcStatus(r),lot(r),dueStatus(r),poStatus(r),owner(r),notes(r)];});
    var csv="\uFEFF"+[headers].concat(body).map(function(cols){return cols.map(function(v){return '"'+String(v==null?"":v).replace(/"/g,'""')+'"';}).join(",");}).join("\r\n");
    var blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    var url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="구매발주관리_"+today()+".csv";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }

  function parseCsv(text){
    var rows=[],row=[],cell="",quote=false;
    for(var i=0;i<text.length;i++){
      var ch=text[i],next=text[i+1];
      if(ch==='"'&&quote&&next==='"'){cell+='"';i++;continue;}
      if(ch==='"'){quote=!quote;continue;}
      if(ch===","&&!quote){row.push(cell);cell="";continue;}
      if((ch==="\n"||ch==="\r")&&!quote){
        if(ch==="\r"&&next==="\n")i++;
        row.push(cell);cell="";
        if(row.some(function(v){return clean(v)!=="";})) rows.push(row);
        row=[];continue;
      }
      cell+=ch;
    }
    if(cell||row.length){row.push(cell);rows.push(row);}
    return rows;
  }
  function objectRows(matrix){
    if(!matrix.length) return [];
    var heads=matrix[0].map(clean);
    function pick(o,names){for(var i=0;i<names.length;i++){if(o[names[i]]!=null&&clean(o[names[i]])!=="")return o[names[i]];}return "";}
    return matrix.slice(1).map(function(cols){
      var o={};heads.forEach(function(h,i){o[h]=cols[i];});
      var no=clean(pick(o,["발주번호","구매발주번호","PO"]));
      var d=clean(pick(o,["발주일","발주일자","일자"]));
      return {
        id:no||null,purchaseNo:no||null,orderDate:d,
        supplier:clean(pick(o,["협력사","거래처","공급사"])),
        item:clean(pick(o,["품목명","원자재명","품목"])),
        material:clean(pick(o,["품목명","원자재명","품목"])),
        spec:clean(pick(o,["규격","Spec","SPEC"])),
        qty:num(pick(o,["발주수량","수량"])),
        unit:clean(pick(o,["단위"]))||"kg",
        unitPrice:num(pick(o,["단가","단가(원)"])),
        price:num(pick(o,["단가","단가(원)"])),
        requestedDueDate:clean(pick(o,["요청입고일","요청납기","납기일"])),
        due:clean(pick(o,["요청입고일","요청납기","납기일"])),
        confirmedDueDate:clean(pick(o,["확정입고일","확정납기"])),
        expected:clean(pick(o,["확정입고일","확정납기"])),
        requester:clean(pick(o,["담당자","구매담당"])),
        owner:clean(pick(o,["담당자","구매담당"])),
        notes:clean(pick(o,["비고","특이사항"])),
        approvalStatus:"구매검토",approval:"구매검토",receiptStatus:"미입고",receiving:"미입고",receivedQty:0,iqcStatus:"계획 대기",iqc:"계획 대기",status:"결재대기",
        createdAt:new Date().toISOString(),createdBy:clean(state.user.name)
      };
    }).filter(function(r){return r.supplier&&r.item&&r.qty>0;});
  }
  async function ensureXlsx(){
    if(window.XLSX) return window.XLSX;
    await new Promise(function(resolve,reject){
      var s=document.createElement("script");
      s.src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
    return window.XLSX;
  }
  async function uploadFile(file){
    try{
      var matrix=[];
      if(/\.csv$/i.test(file.name)){
        matrix=parseCsv(await file.text());
      }else{
        var XLSX=await ensureXlsx();
        var buf=await file.arrayBuffer();
        var wb=XLSX.read(buf,{type:"array"});
        matrix=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:""});
      }
      var imported=objectRows(matrix);
      if(!imported.length){alert("업로드할 구매 발주 데이터가 없습니다.");return;}
      var existing=new Map(state.rows.map(function(r){return [rowNo(r),r];}));
      var created=[];
      for(var i=0;i<imported.length;i++){
        var r=imported[i];
        if(!r.purchaseNo){r.id=nextNo()+"-"+String(i+1).padStart(2,"0");r.purchaseNo=r.id;}
        r.amount=r.qty*r.unitPrice;
        if(existing.has(r.purchaseNo)){
          var base=existing.get(r.purchaseNo),merged=Object.assign({},base,r,{updatedAt:new Date().toISOString(),updatedBy:clean(state.user.name)});
          try{var saved=await apiJson("/api/purchase-orders/"+encodeURIComponent(r.purchaseNo),{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(merged)});existing.set(r.purchaseNo,Object.assign({},merged,saved&&typeof saved==="object"?saved:{}));}
          catch(error){throw new Error(r.purchaseNo+" 수정 실패: "+error.message);}
        }else{
          try{var savedNew=await apiJson("/api/purchase-orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)});existing.set(r.purchaseNo,Object.assign({},r,savedNew&&typeof savedNew==="object"?savedNew:{}));created.push(r.purchaseNo);}
          catch(error){throw new Error(r.purchaseNo+" 등록 실패: "+error.message);}
        }
      }
      state.rows=Array.from(existing.values());
      await saveShared(state.rows);
      render();
      alert("구매 업로드 완료: "+imported.length+"건");
    }catch(error){
      console.error("[QMES Purchase upload]",error);
      alert("구매 업로드 실패: "+(error.message||error));
    }
  }

  function requestsModal(){
    overlay("구매요청 불러오기",'<table class="qpo-info"><tr><th>구매요청번호</th><th>품목</th><th>요청수량</th><th>희망입고일</th></tr><tr><td>PR-260922-001</td><td>NMP(SNET)</td><td>3,500 kg</td><td>2026-09-29</td></tr><tr><td>PR-260922-002</td><td>ADC30G(SBR)</td><td>700 kg</td><td>2026-09-26</td></tr></table>',true);
  }

  function bind(){
    var host=state.host;
    if(!host||host.__qpoBound) return;
    host.__qpoBound=true;
    host.addEventListener("input",function(e){
      var el=e.target.closest("[data-filter]");
      if(!el) return;
      state[el.getAttribute("data-filter")]=el.value;
      state.page=1;
      if(el.tagName==="INPUT"&&el.type!=="date") render();
    });
    host.addEventListener("change",function(e){
      var el=e.target.closest("[data-filter]");
      if(el){state[el.getAttribute("data-filter")]=el.value;state.page=1;render();return;}
      var file=e.target.closest('[data-role="upload-input"]');
      if(file&&file.files&&file.files[0]){uploadFile(file.files[0]);file.value="";}
    });
    host.addEventListener("submit",async function(e){
      var form=e.target.closest('form[data-role]');
      if(!form) return;
      e.preventDefault();
      try{
        if(form.dataset.role==="new-form") await createRow(formToRow(form,null,true));
        else{
          var base=findRow(form.dataset.no);
          if(!base) throw new Error("수정할 발주를 찾을 수 없습니다.");
          await editRow(formToRow(form,base,false));
        }
      }catch(error){alert(error.message||"저장 실패");}
    });
    host.addEventListener("click",async function(e){
      var btn=e.target.closest("[data-action]");
      if(!btn) return;
      var action=btn.getAttribute("data-action"),no=btn.getAttribute("data-no"),r=no?findRow(no):null;
      try{
        if(action==="search"){state.page=1;render();}
        else if(action==="page"){state.page=Number(btn.getAttribute("data-page"))||1;render();}
        else if(action==="detail"&&r) overlay(rowNo(r)+" · 구매/발주 상세",detailBody(r),true);
        else if(action==="edit"&&r) overlay(rowNo(r)+" · 수정",formBody(r,false),true);
        else if(action==="delete"&&r) await deleteRow(r);
        else if(action==="new") overlay("신규 발주 등록",formBody(null,true),true);
        else if(action==="close-modal") closeOverlay();
        else if(action==="download") downloadCsv();
        else if(action==="print-select") printSelector();
        else if(action==="print-one"&&r) printOne(r);
        else if(action==="requests") requestsModal();
        else if(action==="upload"){var f=host.querySelector('[data-role="upload-input"]');if(f)f.click();}
      }catch(error){console.error(error);alert(error.message||"처리 중 오류가 발생했습니다.");}
    });
    host.addEventListener("click",function(e){
      if(e.target.classList.contains("qpo-modal-bg")) closeOverlay();
    });
  }

  function mount(host){
    state.host=host;
    bind();
    render();
    loadRows();
    loadUser();
    var refresh=function(){loadRows();};
    window.addEventListener("qmes:purchase-db-refresh",refresh);
    window.addEventListener("qmes:shared-sync-complete",refresh);
    host.__qpoCleanup=function(){
      window.removeEventListener("qmes:purchase-db-refresh",refresh);
      window.removeEventListener("qmes:shared-sync-complete",refresh);
    };
  }

  function QMESPurchaseLedgerOwner(){
    var ref=useRef(null);
    useEffect(function(){
      if(ref.current) mount(ref.current);
      return function(){if(ref.current&&ref.current.__qpoCleanup)ref.current.__qpoCleanup();};
    },[]);
    return ReactRef.createElement("div",{ref:ref,className:"qmes-purchase-ledger-v1"});
  }

  window.__QMES_CURRENT_PURCHASE_LEDGER_COMPONENT__=QMESPurchaseLedgerOwner;
  window.QMESErpPurchaseTab=QMESPurchaseLedgerOwner;
  window.dispatchEvent(new CustomEvent("qmes:erp-integrated-ready"));
})();