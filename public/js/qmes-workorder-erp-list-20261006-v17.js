/* QMES Workorder exact Sales/Due layout owner - 2026-09-29 V6
 * Fresh file. Reuses current Sales/Due structural classes for exact visual parity.
 */
(function(){
"use strict";
if(window.__QMES_WORKORDER_ERP_LIST_20261006_V17__)return;
window.__QMES_WORKORDER_ERP_LIST_20261006_V2__=true;

var PAGE_SIZE=10;
var state={root:null,host:null,rows:[],filtered:[],page:1,signature:""};
function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim()}
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function num(v){var n=parseFloat(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0}
function fmt(v){return Number(v||0).toLocaleString("ko-KR",{maximumFractionDigits:3})}
function currentUser(){var u=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};try{var s=JSON.parse(sessionStorage.getItem("qmes-current-user-v1")||"null");if(s&&typeof s==="object")u=Object.assign({},u,s)}catch(_){}return u||{}}
function canDelete(){var u=currentUser(),t=clean(u.title||u.position||u.rank||u.jobTitle||u.job_title),r=clean(u.role).toLowerCase();return /^(부장|이사|상무|전무|부사장|사장|대표|대표이사|회장|임원)$/.test(t)||r==="admin"||r==="administrator"||r==="관리자"}
function nativeTable(){return document.querySelector(".qmes-issued-table-v2")}
function findRoot(){var table=nativeTable();if(!table)return null;var p=table.parentElement;while(p&&p!==document.body){var h=[].slice.call(p.querySelectorAll("h1,h2,h3")).find(function(el){return clean(el.textContent)==="작업지시 관리"});if(h)return p;p=p.parentElement}return null}
function salesMeta(raw){
  var rows=[],meta={};
  try{rows=JSON.parse(localStorage.getItem("qmes-erp-sales-v1")||"[]")||[]}catch(_){}
  try{meta=JSON.parse(localStorage.getItem("qmes-sales-order-meta-v1")||"{}")||{}}catch(_){}
  if(!Array.isArray(rows))rows=[];
  var hit=rows.find(function(r){var k=clean(r&&(r.workOrder||r.id)),m=meta[k]||meta[clean(r&&r.id)]||(r&&r.orderMeta)||{};return clean(m.workOrder||r&&r.workOrder)===raw||clean(m.productionLotNo||r&&r.productionLotNo)===raw});
  if(!hit)return{};
  var k=clean(hit.workOrder||hit.id),m=meta[k]||meta[clean(hit.id)]||hit.orderMeta||{};
  return {customer:clean(m.customerOverride||m.customer||hit.customer),product:clean(m.productOverride||m.product||hit.product),remarks:clean(m.remarks||hit.remarks||hit.note)}
}
function sourceRows(root){
  var table=root.querySelector(".qmes-issued-table-v2");if(!table)return[];
  var previous={};
  (state.rows||[]).forEach(function(r){if(r&&r.rawKey)previous[clean(r.rawKey)]=r});
  return [].slice.call(table.querySelectorAll("tbody tr")).filter(function(tr){return tr.querySelectorAll("td").length>=10}).map(function(tr,index){
    var c=tr.querySelectorAll("td"),raw=clean(c[0]&&c[0].textContent),link=salesMeta(raw);
    var product=clean(c[1]&&c[1].textContent)||link.product||"-";
    var equipment=clean(c[2]&&c[2].textContent)||"-";if(/^HSM/i.test(equipment))equipment="HSM";
    var planCell=clean(c[3]&&(c[3].innerText||c[3].textContent));
    var actualCell=clean(c[4]&&(c[4].innerText||c[4].textContent));
    var plan=num(planCell),actual=num(actualCell),date=clean(c[5]&&(c[5].innerText||c[5].textContent))||"-";
    if(!plan){
      var planAttr=clean(tr.getAttribute("data-plan")||tr.dataset&&tr.dataset.plan);
      if(planAttr) plan=num(planAttr);
    }
    if(!plan){
      var planText=clean(tr.textContent).match(/(?:계획량|계획)\s*[:：]?\s*([0-9,.]+)/);
      if(planText) plan=num(planText[1]);
    }
    if(!plan&&previous[raw]&&Number(previous[raw].plan)>0) plan=Number(previous[raw].plan);
    if(!plan){
      try{
        var batch=(window.DB&&Array.isArray(window.DB.batches)?window.DB.batches:[]).find(function(b){return clean(b&&b.no)===raw});
        var doc=window.DB&&window.DB.woDocs&&window.DB.woDocs[raw];
        plan=num(batch&&batch.plan)||num(doc&&doc.plan)||0;
      }catch(_){}
    }
    var worker=clean(c[8]&&c[8].textContent)||"-",sel=c[9]&&c[9].querySelector("select"),status=clean(sel?sel.value:(c[9]&&c[9].textContent))||"-";
    var y=plan>0&&actual>0?actual/plan*100:null;
    return {index:index,rawKey:raw,date:date,workOrderNo:raw,productionLotNo:raw,customer:link.customer||"현대자동차",product:product,equipment:equipment,plan:plan,actual:actual,plannedDate:date,worker:worker,status:status,yield:y,pqc:"-",remarks:link.remarks||"-"};
  });
}
function tone(v){var s=clean(v);if(/불합격|NG|보류|이상/.test(s))return"bad";if(/완료|합격|OK/.test(s))return"good";if(/생산중|검사중|진행/.test(s))return"blue";if(/대기|발행|미착수/.test(s))return"warn";return"gray"}
function badge(v){return '<span class="qsd-badge '+tone(v)+'">'+esc(v||"-")+'</span>'}
function get(id){var e=state.host&&state.host.querySelector("#"+id);return e?clean(e.value):""}
function applyFilter(reset){
  if(reset)state.page=1;
  var from=get("qwf2-from"),to=get("qwf2-to"),customer=get("qwf2-customer"),product=get("qwf2-product").toLowerCase(),status=get("qwf2-status"),q=get("qwf2-q").toLowerCase();
  state.filtered=state.rows.filter(function(r){
    if(from&&r.date!=="-"&&r.date<from)return false;if(to&&r.date!=="-"&&r.date>to)return false;
    if(customer&&r.customer!==customer)return false;if(product&&!r.product.toLowerCase().includes(product))return false;if(status&&!r.status.includes(status))return false;
    if(q&&!(r.workOrderNo+" "+r.productionLotNo+" "+r.customer+" "+r.product+" "+r.equipment+" "+r.worker+" "+r.remarks).toLowerCase().includes(q))return false;return true;
  });
}
function customers(){return Array.from(new Set(state.rows.map(function(r){return r.customer}).filter(function(v){return v&&v!=="-"}))).sort()}
function renderCustomers(){var el=state.host.querySelector("#qwf2-customer");if(!el)return;var cur=el.value,vals=customers();el.innerHTML='<option value="">전체</option>'+vals.map(function(v){return'<option value="'+esc(v)+'">'+esc(v)+'</option>'}).join("");if(vals.indexOf(cur)>=0)el.value=cur}
function renderKpis(){
 var rows=state.filtered,vals=[rows.length,rows.filter(function(r){return /발행|대기|미착수/.test(r.status)}).length,rows.filter(function(r){return /생산중|검사중|진행/.test(r.status)}).length,rows.filter(function(r){return /완료/.test(r.status)}).length,rows.filter(function(r){return /보류|이상|NG/.test(r.status)||r.pqc==="NG"}).length,0];
 state.host.querySelectorAll(".qsd-kpi strong").forEach(function(el,i){el.textContent=vals[i]});
}
function renderTable(){
 var body=state.host.querySelector("tbody"),foot=state.host.querySelector(".qrl-foot"),pages=Math.max(1,Math.ceil(state.filtered.length/PAGE_SIZE));if(state.page>pages)state.page=pages;
 var start=(state.page-1)*PAGE_SIZE,shown=state.filtered.slice(start,start+PAGE_SIZE),del=canDelete();
 if(!shown.length)body.innerHTML='<tr><td colspan="19" class="qsd-empty">조회 조건에 맞는 작업지시가 없습니다.</td></tr>';
 else body.innerHTML=shown.map(function(r,i){var y=r.yield==null?"-":r.yield.toFixed(1)+"%";return '<tr data-src="'+r.index+'">'+
 '<td>'+(start+i+1)+'</td><td>'+esc(r.date)+'</td><td><button class="qrl-link" data-act="detail">'+esc(r.workOrderNo)+'</button></td><td>'+esc(r.customer)+'</td><td class="left">'+esc(r.product)+'</td><td>'+esc(r.productionLotNo)+'</td><td class="num">'+(r.plan>0?fmt(r.plan):"-")+'</td><td>kg</td><td>'+esc(r.plannedDate)+'</td><td>'+esc(r.equipment)+'</td><td class="num">'+fmt(r.plan)+'</td><td class="num">'+(r.actual?fmt(r.actual):"-")+'</td><td class="num">'+(r.actual?fmt(r.actual):"-")+'</td><td>'+y+'</td><td>'+badge(r.pqc)+'</td><td>'+badge(r.status)+'</td><td>'+esc(r.worker)+'</td><td class="left">'+esc(r.remarks)+'</td><td><span class="qrl-actions"><button data-act="print">인쇄</button><button data-act="edit">수정</button>'+(del?'<button class="qrl-delete-btn" data-act="delete">삭제</button>':'')+'</span></td></tr>'}).join("");
 foot.innerHTML=Array.from({length:pages},function(_,i){var p=i+1;return '<button type="button" class="qrl-page '+(p===state.page?"active":"")+'" data-page="'+p+'">'+p+'</button>'}).join("");
}
function render(){renderCustomers();renderKpis();renderTable()}
function markup(){
 return '<div class="qerp-head"><div class="qerp-title-wrap"><h1 class="qerp-title">작업지시 관리</h1></div><div class="qerp-actions">'+
 '<button type="button" class="qerp-btn" data-top="excel-in">엑셀 원료 불러오기</button><button type="button" class="qerp-btn primary" data-top="new">+ 신규 작업지시</button></div></div>'+
 '<section class="qerp-filter"><div class="qerp-filter-row">'+
 '<label><span>지시기간</span><div class="qerp-date"><input id="qwf2-from" type="date" value="2025-01-01"><b>~</b><input id="qwf2-to" type="date" value="2026-12-31"></div></label>'+
 '<label><span>거래처</span><select id="qwf2-customer"><option value="">전체</option></select></label>'+
 '<label><span>품목명</span><input id="qwf2-product" placeholder="품목명 또는 규격"></label>'+
 '<label><span>진행상태</span><select id="qwf2-status"><option value="">전체</option><option>발행</option><option>생산중</option><option>검사중</option><option>완료</option></select></label>'+
 ''+
 '<label class="qerp-search"><span>통합검색</span><input id="qwf2-q" placeholder="작업지시번호, 생산LOT, 제품명, 고객사"></label>'+
 '<div class="qerp-filter-actions"><button type="button" class="primary" data-top="search">조회</button><button type="button" data-top="reset">초기화</button></div>'+
 '</div></section>'+
 '<section class="qerp-grid-shell"><div class="qerp-grid-toolbar"><strong>생산지시 목록</strong><span>작업지시 현황</span></div><div class="qerp-scroll">'+
 '<table class="qerp-table qwf2-table"><thead><tr><th>No</th><th>지시일</th><th>작업지시번호</th><th>고객사</th><th>제품명</th><th>생산 LOT NO.</th><th>계획수량</th><th>단위</th><th>생산예정일</th><th>설비</th><th>투입계획량</th><th>실투입량</th><th>생산수량</th><th>수율</th><th>PQC</th><th>진행상태</th><th>작업자</th><th>비고</th><th>관리</th></tr></thead><tbody></tbody></table></div><div class="qrl-foot"></div></section>'+
 '';
}

function ensureNumberDetailStyle(){
 var id="qmes-workorder-number-detail-style-v2";if(document.getElementById(id))return;
 var st=document.createElement("style");st.id=id;st.textContent=
 '#qmes-workorder-number-detail-v2{position:fixed;inset:108px 0 0 54px;z-index:2147482500;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(240,244,248,.62);font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif;box-sizing:border-box}'+
 '#qmes-workorder-number-detail-v2 *{box-sizing:border-box}'+
 '#qmes-workorder-number-detail-v2 .qwnd-card{width:min(980px,calc(100vw - 110px));max-height:min(610px,calc(100vh - 142px));display:flex;flex-direction:column;background:#fff;border:1px solid #ccd9e4;border-radius:10px;box-shadow:0 18px 46px rgba(35,57,82,.18);overflow:hidden;color:#26384a}'+
 '#qmes-workorder-number-detail-v2 .qwnd-head{height:46px;min-height:46px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(180deg,#fff,#f7fafc);border-bottom:1px solid #d9e3eb}'+
 '#qmes-workorder-number-detail-v2 .qwnd-head-left{display:flex;align-items:center;gap:9px;min-width:0}'+
 '#qmes-workorder-number-detail-v2 .qwnd-icon{width:25px;height:25px;border-radius:7px;display:grid;place-items:center;background:#eaf5fd;border:1px solid #cbe4f6;color:#177fbd;font-size:13px;font-weight:900}'+
 '#qmes-workorder-number-detail-v2 .qwnd-title{font-size:13px;font-weight:850;color:#183650;white-space:nowrap}'+
 '#qmes-workorder-number-detail-v2 .qwnd-sub{font-size:9px;color:#7b8ca0;margin-top:2px}'+
 '#qmes-workorder-number-detail-v2 .qwnd-head-actions{display:flex;align-items:center;gap:6px}'+
 '#qmes-workorder-number-detail-v2 .qwnd-btn{height:28px;padding:0 10px;border:1px solid #cdd8e2;border-radius:6px;background:#fff;color:#42586b;font-size:10px;font-weight:750;cursor:pointer}'+
 '#qmes-workorder-number-detail-v2 .qwnd-close{width:28px;padding:0;font-size:18px;line-height:1}'+
 '#qmes-workorder-number-detail-v2 .qwnd-body{padding:10px 12px 12px;overflow:auto;background:#fff}'+
 '#qmes-workorder-number-detail-v2 .qwnd-info{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:10px}'+
 '#qmes-workorder-number-detail-v2 .qwnd-field{min-width:0;border:1px solid #dce5ed;border-radius:7px;background:#fbfdff;padding:7px 9px}'+
 '#qmes-workorder-number-detail-v2 .qwnd-field span{display:block;font-size:8px;font-weight:750;color:#7b8b9d;margin-bottom:3px}'+
 '#qmes-workorder-number-detail-v2 .qwnd-field b{display:block;font-size:10px;color:#2b4156;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
 '#qmes-workorder-number-detail-v2 .qwnd-sec-title{font-size:10.5px;font-weight:800;color:#2c4358;margin:4px 0 6px}'+
 '#qmes-workorder-number-detail-v2 .qwnd-table-wrap{border:1px solid #dbe4ec;border-radius:7px;overflow:auto}'+
 '#qmes-workorder-number-detail-v2 table{width:100%;min-width:900px;border-collapse:collapse;background:#fff;font-size:9px}'+
 '#qmes-workorder-number-detail-v2 th{height:29px;padding:5px 7px;background:#f3f6f9;color:#53677a;border-right:1px solid #dbe4ec;border-bottom:1px solid #d5dee7;font-weight:750;white-space:nowrap;text-align:center}'+
 '#qmes-workorder-number-detail-v2 td{height:30px;padding:5px 7px;background:#fff;color:#425466;border-right:1px solid #e2e8ee;border-bottom:1px solid #e2e8ee;white-space:nowrap;text-align:center}'+
 '#qmes-workorder-number-detail-v2 tbody tr:nth-child(even) td{background:#fbfcfd}'+
 '#qmes-workorder-number-detail-v2 td.left{text-align:left}'+
 '#qmes-workorder-number-detail-v2 td.num{text-align:right;font-variant-numeric:tabular-nums}'+
 '#qmes-workorder-number-detail-v2 tfoot td{background:#f4f6f8;font-weight:800;color:#2f4356}'+
 '#qmes-workorder-number-detail-v2 .qwnd-empty{padding:22px!important;text-align:center!important;color:#8a98a8!important}'+
 '@media(max-width:900px){#qmes-workorder-number-detail-v2{inset:108px 0 0 0;padding:8px}#qmes-workorder-number-detail-v2 .qwnd-card{width:calc(100vw - 16px);max-height:calc(100vh - 124px)}#qmes-workorder-number-detail-v2 .qwnd-info{grid-template-columns:repeat(2,minmax(0,1fr))}}';
 document.head.appendChild(st);
}
function closeNumberDetail(){var el=document.getElementById("qmes-workorder-number-detail-v2");if(el)el.remove()}
function getWorkOrderDoc(raw){
 try{
   if(typeof window.__QMES_GET_WORKORDER_DETAIL__==="function"){
     var bridged=window.__QMES_GET_WORKORDER_DETAIL__(raw)||{};
     return {doc:bridged.doc||{},batch:bridged.batch||{}};
   }
 }catch(_){}
 var d=window.DB||{},doc=d.woDocs&&d.woDocs[raw]?d.woDocs[raw]:{},batch=Array.isArray(d.batches)?d.batches.find(function(b){return clean(b&&b.no)===clean(raw)}):null;
 return {doc:doc||{},batch:batch||{}};
}
function openNumberDetail(row){
 if(!row)return false;
 ensureNumberDetailStyle();closeNumberDetail();
 var data=getWorkOrderDoc(row.rawKey),doc=data.doc,batch=data.batch,inputs=Array.isArray(doc.inputs)?doc.inputs:[];
 var materialRows=inputs.map(function(it,i){
   var plan=num(it&&((it.plan!=null)?it.plan:it.std)),hasAct=it&&it.act!=null&&clean(it.act)!=="",act=hasAct?num(it.act):null;
   var rem=(it&&it.remaining!=null&&clean(it.remaining)!=="")?num(it.remaining):null;
   var err=(hasAct&&plan)?((act-plan)/plan*100):null,ratio=(hasAct&&plan)?(act/plan*100):null;
   return '<tr><td>'+(i+1)+'</td><td class="left">'+esc(it&&it.name||"-")+'</td><td class="left">'+esc(it&&(it.materialLot||it.lot)||"-")+'</td><td>'+esc(it&&it.inputStatus||"신규")+'</td><td class="num">'+(plan?fmt(plan)+" kg":"-")+'</td><td class="num">'+(hasAct?fmt(act)+" kg":"-")+'</td><td class="num">'+(rem!=null?fmt(rem)+" kg":"-")+'</td><td class="num">'+(err!=null?err.toFixed(2)+"%":"-")+'</td><td class="num">'+(ratio!=null?ratio.toFixed(2)+"%":"-")+'</td><td class="left">'+esc(it&&it.note||"-")+'</td></tr>';
 }).join("");
 var planTotal=inputs.reduce(function(a,it){return a+num(it&&((it.plan!=null)?it.plan:it.std))},0),actTotal=inputs.reduce(function(a,it){return a+((it&&it.act!=null&&clean(it.act)!=="")?num(it.act):0)},0);
 var remTotal=inputs.reduce(function(a,it){return a+((it&&it.remaining!=null&&clean(it.remaining)!=="")?num(it.remaining):0)},0);
 var info=[
   ["지시일",row.date||"-"],["작업지시번호",row.workOrderNo||row.rawKey||"-"],["고객사",row.customer||"-"],["제품명",row.product||"-"],
   ["생산 LOT NO.",row.productionLotNo||row.rawKey||"-"],["계획수량",(row.plan?fmt(row.plan)+" kg":"-")],["생산예정일",row.plannedDate||"-"],["설비",row.equipment||"-"],
   ["작업자",clean(doc.workers||doc.worker||row.worker)||"-"],["진행상태",row.status||"-"],["근무유형",clean(doc.shiftType||batch.shift)||"-"],["생산시간",clean(doc.timeRange)||"-"]
 ];
 var fields=info.map(function(x){return '<div class="qwnd-field"><span>'+esc(x[0])+'</span><b title="'+esc(x[1])+'">'+esc(x[1])+'</b></div>'}).join("");
 var overlay=document.createElement("div");overlay.id="qmes-workorder-number-detail-v2";
 overlay.innerHTML='<section class="qwnd-card" role="dialog" aria-modal="true" aria-label="작업지시 상세">'+
 '<div class="qwnd-head"><div class="qwnd-head-left"><div class="qwnd-icon">▣</div><div><div class="qwnd-title">작업지시 상세</div><div class="qwnd-sub">작업지시번호 : '+esc(row.workOrderNo||row.rawKey||"-")+'</div></div></div>'+
 '<div class="qwnd-head-actions"><button type="button" class="qwnd-btn" data-qwnd-edit="1">수정</button><button type="button" class="qwnd-btn qwnd-close" data-qwnd-close="1" aria-label="닫기">×</button></div></div>'+
 '<div class="qwnd-body"><div class="qwnd-info">'+fields+'</div><div class="qwnd-sec-title">원재료 투입 계획</div>'+
 '<div class="qwnd-table-wrap"><table><thead><tr><th>순서</th><th>원재료명</th><th>LOT No.</th><th>투입상태</th><th>계획량</th><th>실투입량</th><th>사용 후 잔량</th><th>오차</th><th>투입비율</th><th>비고</th></tr></thead><tbody>'+
 (materialRows||'<tr><td colspan="10" class="qwnd-empty">등록된 원재료 투입 계획이 없습니다.</td></tr>')+
 '</tbody><tfoot><tr><td colspan="4" class="left">합계</td><td class="num">'+fmt(planTotal)+' kg</td><td class="num">'+(actTotal?fmt(actTotal)+' kg':'-')+'</td><td class="num">'+(remTotal?fmt(remTotal)+' kg':'-')+'</td><td colspan="3"></td></tr></tfoot></table></div></div></section>';
 overlay.addEventListener("mousedown",function(e){if(e.target===overlay)closeNumberDetail()});
 overlay.querySelector("[data-qwnd-close]").onclick=closeNumberDetail;
 overlay.querySelector("[data-qwnd-edit]").onclick=function(){closeNumberDetail();nativeAction(row.rawKey,"edit")};
 document.body.appendChild(overlay);
 document.addEventListener("keydown",function escClose(e){if(e.key==="Escape"){closeNumberDetail();document.removeEventListener("keydown",escClose)}},{once:true});
 return true;
}

function findNativeRow(raw){
 var root=state.root&&state.root.isConnected?state.root:findRoot();
 var scope=root||document;
 return [].slice.call(scope.querySelectorAll(".qmes-issued-table-v2 tbody tr")).find(function(tr){
   var td=tr.querySelector("td");
   return clean(td&&td.textContent)===clean(raw);
 })||null
}
function nativeAction(raw,type){
 var tr=findNativeRow(raw);if(!tr)return false;
 if(type==="detail"){
   var row=state.rows.find(function(r){return clean(r&&r.rawKey)===clean(raw)});
   return openNumberDetail(row);
 }
 var map={print:".qmes-manage-btn.print",edit:".qmes-manage-btn.edit",delete:".qmes-manage-btn.delete"},sel=map[type];if(!sel)return false;
 var b=tr.querySelector(sel);
 if(!b){
   var label=type==="print"?"출력":type==="edit"?"수정":"삭제";
   b=[].slice.call(tr.querySelectorAll("button")).find(function(x){return clean(x.textContent)===label});
 }
 if(type==="edit"){
   /* 수정은 현재 작업지시 React 원본 행의 수정 버튼을 직접 실행한다.
      전역 브리지/다른 화면/인쇄/스크롤 로직은 건드리지 않는다. */
   if(b){b.click();return true}
   if(typeof window.__QMES_EDIT_WORKORDER__==="function"){
     try{return !!window.__QMES_EDIT_WORKORDER__(raw)}catch(_){return false}
   }
   return false;
 }
 if(!b)return false;
 if(type!=="print"){b.click();return true}
 /* 반복 인쇄 시 이전 인쇄 상태가 남지 않도록 먼저 정리 */
 if(typeof window.__QMES_WORKORDER_PRINT_CLEANUP__==="function"){
   try{window.__QMES_WORKORDER_PRINT_CLEANUP__()}catch(_){}
 }
 var mainBefore=document.querySelector("#root>div>main");
 var ownerBefore=document.getElementById("qmes-workorder-erp-list-v1");
 var tableBefore=[].slice.call(document.querySelectorAll("#qmes-workorder-erp-list-v1 .qerp-scroll")).map(function(el){return el.scrollLeft||0});
 var beforePos={
   pageX:window.scrollX||0,
   pageY:window.scrollY||0,
   docX:document.documentElement.scrollLeft||0,
   bodyX:document.body.scrollLeft||0,
   mainX:mainBefore?(mainBefore.scrollLeft||0):0,
   ownerX:ownerBefore?(ownerBefore.scrollLeft||0):0
 };
 var restore=function(){
   document.body.classList.remove("qmes-workorder-direct-printing");
   window.__QMES_WORKORDER_PRINTING__=false;
   try{window.scrollTo({left:beforePos.pageX,top:beforePos.pageY,behavior:"auto"})}catch(_){try{window.scrollTo(beforePos.pageX,beforePos.pageY)}catch(__){}}
   try{document.documentElement.scrollLeft=beforePos.docX}catch(_){}
   try{document.body.scrollLeft=beforePos.bodyX}catch(_){}
   var main=document.querySelector("#root>div>main");if(main)try{main.scrollLeft=beforePos.mainX}catch(_){}
   var owner=document.getElementById("qmes-workorder-erp-list-v1");if(owner)try{owner.scrollLeft=beforePos.ownerX}catch(_){}
   document.querySelectorAll("#qmes-workorder-erp-list-v1 .qerp-scroll").forEach(function(el,i){try{el.scrollLeft=tableBefore[i]||0}catch(_){}});
 };
 /* 인쇄 전에는 화면/표 위치를 절대 변경하지 않는다. */
 window.__QMES_WORKORDER_PRINTING__=true;
 document.body.classList.add("qmes-workorder-direct-printing");
 var finished=false,watchdog=0;
 var finishPrint=function(){
   if(finished)return;
   finished=true;
   clearTimeout(watchdog);
   window.removeEventListener("qmes:workorder-print-finished",finishPrint);
   window.removeEventListener("focus",finishPrint);
   document.removeEventListener("visibilitychange",visibilityFinish);
   var viewer=document.querySelector(".qmes-wo-viewer.qmes-wo-output-preview");
   if(viewer){
     var close=viewer.querySelector(".qmes-modal-close");
     if(close)close.click();
   }
   restore();
   [60,180,420,800,1400].forEach(function(ms){setTimeout(restore,ms)});
   window.__QMES_WORKORDER_PRINT_CLEANUP__=null;
 };
 var visibilityFinish=function(){if(!document.hidden)finishPrint()};
 window.__QMES_WORKORDER_PRINT_CLEANUP__=finishPrint;
 window.addEventListener("qmes:workorder-print-finished",finishPrint,{once:true});
 window.addEventListener("focus",finishPrint,{once:true});
 document.addEventListener("visibilitychange",visibilityFinish);
 watchdog=setTimeout(finishPrint,8000);
 b.click();
 var tries=0,timer=setInterval(function(){
   tries++;
   var viewer=document.querySelector(".qmes-wo-viewer.qmes-wo-output-preview");
   if(viewer){
     clearInterval(timer);
     var printBtn=[].slice.call(viewer.querySelectorAll("button")).find(function(x){return clean(x.textContent)==="인쇄"});
     if(printBtn){
       setTimeout(function(){printBtn.click()},80);
     }else{
       finishPrint();
     }
   }else if(tries>40){
     clearInterval(timer);
     finishPrint();
   }
 },30);
 return true
}
function nativeNew(){var b=[].slice.call(document.querySelectorAll(".qmes-iqc-new-btn")).find(function(el){return !el.closest("#qmes-workorder-erp-list-v1")});if(!b)return false;b.click();return true}
function downloadCsv(){var heads=["No","지시일","작업지시번호","고객사","제품명","생산 LOT NO.","계획수량","단위","생산예정일","설비","투입계획량","실투입량","생산수량","수율","PQC","진행상태","작업자","비고"],rows=state.filtered.map(function(r,i){return[i+1,r.date,r.workOrderNo,r.customer,r.product,r.productionLotNo,r.plan,"kg",r.plannedDate,r.equipment,r.plan,r.actual||"",r.actual||"",r.yield==null?"":r.yield.toFixed(1)+"%",r.pqc,r.status,r.worker,r.remarks]});function cell(v){var s=String(v==null?"":v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}var csv="\uFEFF"+[heads].concat(rows).map(function(row){return row.map(cell).join(",")}).join("\r\n"),blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="작업지시서_"+new Date().toISOString().slice(0,10)+".csv";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000)}
function bind(){
 state.host.addEventListener("click",function(e){
  var p=e.target.closest("[data-page]");if(p){state.page=Number(p.getAttribute("data-page"))||1;renderTable();return}
  var top=e.target.closest("[data-top]");if(top){var a=top.getAttribute("data-top");if(a==="search"){applyFilter(true);render();return}if(a==="reset"){state.host.querySelector("#qwf2-from").value="2025-01-01";state.host.querySelector("#qwf2-to").value="2026-12-31";state.host.querySelector("#qwf2-customer").value="";state.host.querySelector("#qwf2-product").value="";state.host.querySelector("#qwf2-status").value="";state.host.querySelector("#qwf2-q").value="";applyFilter(true);render();return}if(a==="new"){if(!nativeNew())alert("신규 작업지시 화면을 찾을 수 없습니다.");return}if(a==="excel-in"){var b=document.querySelector('input[type="file"][accept*="xls"],input[type="file"][accept*="csv"]');if(b)b.click();else alert("엑셀 원료 불러오기 기능은 신규 작업지시 화면에서 사용하세요.");return}}
  var act=e.target.closest("[data-act]");if(!act)return;var tr=act.closest("tr"),idx=Number(tr&&tr.getAttribute("data-src")),row=state.rows.find(function(r){return r.index===idx});if(!row)return;var type=act.getAttribute("data-act");if(!nativeAction(row.rawKey,type))alert("작업지시 "+type+" 기능을 찾을 수 없습니다.");
 });
 ["qwf2-from","qwf2-to","qwf2-customer","qwf2-product","qwf2-status","qwf2-q"].forEach(function(id){var el=state.host.querySelector("#"+id);if(el)el.addEventListener("keydown",function(e){if(e.key==="Enter"){applyFilter(true);render()}})});
}
function resetWorkorderTableX(){
  var run=function(){
    document.querySelectorAll("#qmes-workorder-erp-list-v1 .qerp-scroll").forEach(function(el){
      try{el.scrollLeft=0}catch(_){}
    });
  };
  run();
  requestAnimationFrame(run);
  [40,120,260,520].forEach(function(ms){setTimeout(run,ms)});
}

var __qmesWorkorderScrollLocking=false;
function workorderTabActive(){
  try{return (sessionStorage.getItem("qmes_current_tab")||"")==="woIssue"}catch(_){return false}
}
function lockWorkorderPageX(){
  if(__qmesWorkorderScrollLocking||!workorderTabActive())return;
  __qmesWorkorderScrollLocking=true;
  try{
    var main=document.querySelector("#root>div>main");
    if(main&&main.scrollLeft!==0)main.scrollLeft=0;
    if(document.documentElement.scrollLeft!==0)document.documentElement.scrollLeft=0;
    if(document.body.scrollLeft!==0)document.body.scrollLeft=0;
    if((window.scrollX||0)!==0)window.scrollTo(0,window.scrollY||0);
  }catch(_){}
  __qmesWorkorderScrollLocking=false;
}
function bindWorkorderPageXLock(){
  var main=document.querySelector("#root>div>main");
  if(main&&!main.__QMES_X_LOCK_BOUND__){
    main.__QMES_X_LOCK_BOUND__=true;
    main.addEventListener("scroll",function(){
      if(workorderTabActive()&&main.scrollLeft!==0)main.scrollLeft=0;
    },{passive:true});
  }
  if(!window.__QMES_PAGE_X_LOCK_BOUND__){
    window.__QMES_PAGE_X_LOCK_BOUND__=true;
    window.addEventListener("scroll",function(){
      if(workorderTabActive()&&(window.scrollX||0)!==0)window.scrollTo(0,window.scrollY||0);
    },{passive:true});
  }
  if(state.host&&!state.host.__QMES_BUTTON_FOCUS_GUARD__){
    state.host.__QMES_BUTTON_FOCUS_GUARD__=true;
    state.host.addEventListener("mousedown",function(e){
      var btn=e.target.closest&&e.target.closest("button");
      if(!btn)return;
      /* 인쇄 버튼은 기존 인쇄 동작을 그대로 통과시킨다.
         화면 위치 보정은 인쇄 외 버튼에만 적용한다. */
      if(btn.getAttribute("data-act")==="print")return;
      e.preventDefault();
      resetWorkorderTableX();
      lockWorkorderPageX();
      requestAnimationFrame(function(){resetWorkorderTableX();lockWorkorderPageX()});
      setTimeout(function(){resetWorkorderTableX();lockWorkorderPageX()},60);
      setTimeout(function(){resetWorkorderTableX();lockWorkorderPageX()},180);
    },true);
  }
  lockWorkorderPageX();
}

function stabilizeWorkorderRoot(){
 var host=document.getElementById("qmes-workorder-erp-list-v1");
 if(!host||!host.isConnected)return false;
 var root=host.parentElement;
 if(!root)return false;
 if(state.root!==root)state.root=root;
 if(!root.classList.contains("qmes-workorder-erp-list-v1"))root.classList.add("qmes-workorder-erp-list-v1");
 if(root.getAttribute("data-qmes-workorder-owner")!=="erp-list-v1")root.setAttribute("data-qmes-workorder-owner","erp-list-v1");
 if(root.getAttribute("data-qmes-workorder-stable-root")!=="1")root.setAttribute("data-qmes-workorder-stable-root","1");
 try{root.scrollLeft=0}catch(_){}
 var main=root.closest("main");
 if(main)try{main.scrollLeft=0}catch(_){}
 try{document.documentElement.scrollLeft=0}catch(_){}
 try{document.body.scrollLeft=0}catch(_){}
 return true;
}
function mount(){
 var root=findRoot();if(!root)return;if(state.root!==root){state.root=root;state.host=null;state.signature=""}
 root.classList.add("qmes-workorder-erp-list-v1");root.setAttribute("data-qmes-workorder-owner","erp-list-v1");root.setAttribute("data-qmes-workorder-stable-root","1");
 if(!state.host||!state.host.isConnected){var host=document.createElement("section");host.id="qmes-workorder-erp-list-v1";host.className="qmes-workorder-erp-v1";host.innerHTML=markup();root.insertBefore(host,root.firstChild);state.host=host;bind()}
 var nextRows=sourceRows(root);
 var nextSignature="";
 try{nextSignature=JSON.stringify(nextRows.map(function(r){return [r.rawKey,r.date,r.customer,r.product,r.plan,r.actual,r.plannedDate,r.equipment,r.worker,r.status,r.remarks]}))}catch(_){}
 if(state.signature===nextSignature&&state.rows&&state.rows.length===nextRows.length)return;
 state.signature=nextSignature;state.rows=nextRows;applyFilter(false);render();if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.scan==="function")window.qmesFixedCalendar.scan(state.host);
}
var queued=false, initialObserver=null, mainObserver=null;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;mount();stabilizeWorkorderRoot();bindWorkorderPageXLock();lockWorkorderPageX()})}
function boot(){
  mount();
  stabilizeWorkorderRoot();
  bindWorkorderPageXLock();
  lockWorkorderPageX();

  /* React 상태 변경으로 작업지시 원본 루트의 class가 다시 작성되어도
     고정 메뉴 기준 레이아웃을 즉시 복구한다. */
  var main=document.querySelector("#root>div>main");
  if(main){
    mainObserver=new MutationObserver(function(){
      if(!state.host||!state.host.isConnected){schedule();return}
      stabilizeWorkorderRoot();
      bindWorkorderPageXLock();
      lockWorkorderPageX();
    });
    mainObserver.observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]});
  }

  if(!state.host){
    initialObserver=new MutationObserver(function(){
      mount();
      stabilizeWorkorderRoot();
      bindWorkorderPageXLock();
      lockWorkorderPageX();
      if(state.host&&initialObserver){initialObserver.disconnect();initialObserver=null;}
    });
    initialObserver.observe(document.documentElement,{childList:true,subtree:true});
  }
  window.addEventListener("qmes:navigate-tab",schedule);
  window.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("qmes:workorder-saved",schedule);
  window.addEventListener("qmes:workorder-synced",schedule);
  window.addEventListener("qmes:workorder-print-restored",function(){stabilizeWorkorderRoot();bindWorkorderPageXLock();lockWorkorderPageX()});
  document.addEventListener("focusin",function(){if(workorderTabActive()){lockWorkorderPageX();requestAnimationFrame(lockWorkorderPageX)}},true);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();