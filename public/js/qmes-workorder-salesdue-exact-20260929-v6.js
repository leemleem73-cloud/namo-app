/* QMES Workorder exact Sales/Due layout owner - 2026-09-29 V6
 * Fresh file. Reuses current Sales/Due structural classes for exact visual parity.
 */
(function(){
"use strict";
if(window.__QMES_WORKORDER_SALESDUE_EXACT_20260929_V6__)return;
window.__QMES_WORKORDER_SALESDUE_EXACT_20260929_V6__=true;

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
 return '<div class="qslv4-head"><div><h1 class="qslv4-title">작업지시서 관리</h1></div><div class="qslv4-head-actions">'+
 '<button type="button" class="qslv4-upload-btn" data-top="excel-in">엑셀 원료 불러오기</button><button type="button" class="qslv4-new-btn" data-top="excel-out">엑셀 다운로드</button><button type="button" class="qslv4-new-btn" data-top="new">+ 신규 작업지시</button></div></div>'+
 '<div class="qsd-kpis"><div class="qsd-kpi"><span>전체 작업지시</span><strong>0</strong><small>조회기간 기준</small></div><div class="qsd-kpi warn"><span>생산 대기</span><strong>0</strong><small>작업 시작 전</small></div><div class="qsd-kpi"><span>생산 진행</span><strong>0</strong><small>현재 생산중</small></div><div class="qsd-kpi good"><span>생산 완료</span><strong>0</strong><small>실적 등록 완료</small></div><div class="qsd-kpi bad"><span>보류 / 이상</span><strong>0</strong><small>확인 필요</small></div><div class="qsd-kpi good"><span>승인 완료</span><strong>0</strong><small>결재 완료</small></div></div>'+
 '<div class="qrl-filter"><div class="qrl-grid"><label class="qrl-field"><span>기간</span><span class="qrl-date"><input id="qwf2-from" type="date" value="2025-01-01"><b>~</b><input id="qwf2-to" type="date" value="2026-12-31"></span></label><label class="qrl-field"><span>거래처</span><select id="qwf2-customer"><option value="">전체</option></select></label><label class="qrl-field"><span>품목명</span><input id="qwf2-product" placeholder="품목명 또는 규격 입력"></label><label class="qrl-field"><span>진행상태</span><select id="qwf2-status"><option value="">전체</option><option>발행</option><option>생산중</option><option>검사중</option><option>완료</option></select></label><label class="qrl-field"><span>결재상태</span><select disabled><option>전체</option></select></label><label class="qrl-field"><span>통합검색</span><input id="qwf2-q" placeholder="작업지시번호, 생산LOT, 제품명, 고객사 검색"></label><button type="button" class="primary" data-top="search">조회</button><button type="button" data-top="reset">초기화</button></div></div>'+
 '<div class="qsd-legend"><div><b>작업지시 현황</b> · 수주 → 작업지시 → 원료투입 → 생산 → PQC → 완료</div><div class="qsd-note">※ 작업지시 데이터 기준</div></div>'+
 '<div class="qsd-table-shell"><table class="qsd-table qwf2-table"><thead><tr><th>No</th><th>지시일</th><th>작업지시번호</th><th>고객사</th><th>제품명</th><th>생산 LOT NO.</th><th>계획수량</th><th>단위</th><th>생산예정일</th><th>설비</th><th>투입계획량</th><th>실투입량</th><th>생산수량</th><th>수율</th><th>PQC</th><th>진행상태</th><th>작업자</th><th>비고</th><th>관리</th></tr></thead><tbody></tbody></table><div class="qrl-foot"></div></div>';
}
function findNativeRow(raw){return [].slice.call(document.querySelectorAll(".qmes-issued-table-v2 tbody tr")).find(function(tr){var td=tr.querySelector("td");return clean(td&&td.textContent)===clean(raw)})||null}
function nativeAction(raw,type){
 var tr=findNativeRow(raw);if(!tr)return false;
 var map={print:".qmes-manage-btn.print",edit:".qmes-manage-btn.edit",delete:".qmes-manage-btn.delete"},sel=map[type];if(!sel)return false;
 var b=tr.querySelector(sel);
 if(!b){var label=type==="print"?"출력":type==="edit"?"수정":"삭제";b=[].slice.call(tr.querySelectorAll("button")).find(function(x){return clean(x.textContent)===label})}
 if(!b)return false;
 if(type!=="print"){b.click();return true}
 document.body.classList.add("qmes-workorder-direct-printing");
 b.click();
 var tries=0,timer=setInterval(function(){
   tries++;
   var viewer=document.querySelector(".qmes-wo-viewer.qmes-wo-output-preview");
   if(viewer){
     clearInterval(timer);
     var printBtn=[].slice.call(viewer.querySelectorAll("button")).find(function(x){return clean(x.textContent)==="인쇄"});
     if(printBtn){
       setTimeout(function(){
         printBtn.click();
         setTimeout(function(){
           var close=viewer.querySelector(".qmes-modal-close");
           if(close)close.click();
           document.body.classList.remove("qmes-workorder-direct-printing");
         },250);
       },60);
     }else{
       document.body.classList.remove("qmes-workorder-direct-printing");
     }
   }else if(tries>30){
     clearInterval(timer);
     document.body.classList.remove("qmes-workorder-direct-printing");
   }
 },30);
 return true
}

var newModalObserver=null;
function ensureNewModalStyle(){
 if(document.getElementById("qmes-workorder-new-modal-style-v2"))return;
 var s=document.createElement("style");s.id="qmes-workorder-new-modal-style-v2";
 s.textContent=[
 ".qmes-wo-issue-shell.qmes-new-workorder-modal{position:fixed!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;width:min(1120px,92vw)!important;max-height:88vh!important;overflow:auto!important;z-index:2147483000!important;background:#fff!important;color:#26384a!important;border-radius:11px!important;box-shadow:0 0 0 100vmax rgba(17,35,49,.42),0 24px 65px rgba(0,0,0,.28)!important;padding:0!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal>div{background:#fff!important;border:0!important;box-shadow:none!important;color:#26384a!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal h1,.qmes-wo-issue-shell.qmes-new-workorder-modal h2,.qmes-wo-issue-shell.qmes-new-workorder-modal h3{color:#26384a!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-wo-form-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px!important;padding:17px 17px 0!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-wo-form-field,.qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-workorder-extra-field{display:flex!important;flex-direction:column!important;gap:4px!important;min-width:0!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-wo-form-field>span,.qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-workorder-extra-field>span{font-size:9px!important;color:#64788a!important;font-weight:800!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-wo-form-field input,.qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-wo-form-field select,.qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-workorder-extra-field input,.qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-workorder-extra-field select,.qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-workorder-extra-field textarea{width:100%!important;height:34px!important;border:1px solid #cad8e4!important;border-radius:5px!important;background:#fff!important;color:#26384a!important;padding:7px 9px!important;font-size:10px!important;box-shadow:none!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-workorder-extra-field textarea{height:70px!important;min-height:70px!important;resize:vertical!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-new-wide{grid-column:1/-1!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-new-material-box{margin:12px 17px 0!important;border:1px solid #d6e0e8!important;border-radius:8px!important;background:#fff!important;padding:11px!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-new-material-box h4{margin:0 0 9px!important;font-size:11px!important;color:#26384a!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-material-table{min-width:0!important;width:100%!important;border-collapse:collapse!important;font-size:9px!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-material-table th,.qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-material-table td{border:1px solid #dbe4eb!important;padding:7px!important;text-align:center!important;background:#fff!important;color:#3b4d5f!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-material-table thead th{background:#edf5fa!important;color:#4b6477!important;position:static!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal [data-qmes-new-hidden='1']{display:none!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-new-material-note{display:none!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-new-footer{display:flex!important;justify-content:flex-end!important;gap:7px!important;padding:13px 17px 17px!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-new-footer button{height:34px!important;border:1px solid #c7d5e1!important;background:#fff!important;border-radius:6px!important;padding:0 13px!important;font-size:10px!important;font-weight:800!important;color:#40566a!important}",
 ".qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-new-footer button.qmes-new-save{background:#138dcc!important;color:#fff!important;border-color:#138dcc!important}",
 "@media(max-width:900px){.qmes-wo-issue-shell.qmes-new-workorder-modal .qmes-wo-form-grid{grid-template-columns:1fr!important}.qmes-wo-issue-shell.qmes-new-workorder-modal{width:95vw!important;max-height:90vh!important}}"
 ].join("");
 document.head.appendChild(s);
}
function fieldByLabel(shell,text){
 return [].slice.call(shell.querySelectorAll(".qmes-wo-form-field")).find(function(el){
   var n=el.querySelector("span");return clean(n&&n.textContent)===text;
 })||null;
}
function renameField(shell,from,to){
 var f=fieldByLabel(shell,from);if(!f)return null;var n=f.querySelector("span");if(n)n.textContent=to;return f;
}
function hideMaterialColumn(table,labelText){
 if(!table)return;
 var ths=[].slice.call(table.querySelectorAll("thead th")),idx=ths.findIndex(function(th){return clean(th.textContent)===labelText});
 if(idx<0)return;
 ths[idx].setAttribute("data-qmes-new-hidden","1");
 [].slice.call(table.querySelectorAll("tbody tr")).forEach(function(tr){var cell=tr.children[idx];if(cell)cell.setAttribute("data-qmes-new-hidden","1")});
}
function hideSalesLinkStrip(){
 [].slice.call(document.querySelectorAll("body *")).forEach(function(el){
   if(el===document.body||el===document.documentElement)return;
   var t=clean(el.textContent);
   if(t==="연결 수주번호"||t==="연결 가능한 미발행 수주 없음"){
     var p=el.parentElement;
     if(p&&clean(p.textContent).indexOf("수주 선택")>=0)p.setAttribute("data-qmes-new-hidden","1");
   }
 });
}
function customizeNewModal(){
 ensureNewModalStyle();
 var shell=document.querySelector(".qmes-wo-issue-shell");
 if(!shell)return false;
 var all=clean(shell.textContent);
 if(/작업지시 수정/.test(all)&&!/(신규 작업지시 발행|신규 작업지시 등록)/.test(all))return false;
 shell.classList.add("qmes-new-workorder-modal");
 hideSalesLinkStrip();

 var heading=[].slice.call(shell.querySelectorAll("h1,h2,h3")).find(function(el){return /(신규 작업지시 발행|신규 작업지시 등록)/.test(clean(el.textContent))});
 if(heading)heading.textContent="신규 작업지시 등록";
 [].slice.call(shell.querySelectorAll("span")).forEach(function(el){if(/^LOT No\. 자동 채번/.test(clean(el.textContent)))el.setAttribute("data-qmes-new-hidden","1")});

 ["작업구분","생산구분","작업시간","생산시간","근무유형"].forEach(function(t){var f=fieldByLabel(shell,t);if(f)f.setAttribute("data-qmes-new-hidden","1")});
 renameField(shell,"공정 / 품목 (Grd.)","제품명");
 renameField(shell,"설비명","설비");
 renameField(shell,"생산일자","생산예정일");
 renameField(shell,"LOT No.","생산LOT");
 renameField(shell,"생산계획량 (kg)","계획수량");
 renameField(shell,"작업자","작성자");

 var grid=shell.querySelector(".qmes-wo-form-grid");
 if(grid&&!grid.querySelector("[data-extra='order-date']")){
   var today=new Date().toISOString().slice(0,10);
   var d=document.createElement("div");d.className="qmes-workorder-extra-field";d.setAttribute("data-extra","order-date");d.innerHTML='<span>지시일</span><input type="date" value="'+today+'">';
   var cust=document.createElement("div");cust.className="qmes-workorder-extra-field";cust.setAttribute("data-extra","customer");cust.innerHTML='<span>고객사</span><select><option>현대자동차</option><option>알파라인</option></select>';
   grid.insertBefore(d,grid.firstChild);grid.insertBefore(cust,d.nextSibling);

   var product=fieldByLabel(shell,"제품명");if(product)grid.insertBefore(product,cust.nextSibling);
   var lot=fieldByLabel(shell,"생산LOT");if(lot)grid.insertBefore(lot,product?product.nextSibling:null);
   var plan=fieldByLabel(shell,"계획수량");if(plan)grid.insertBefore(plan,lot?lot.nextSibling:null);
   var unit=document.createElement("div");unit.className="qmes-workorder-extra-field";unit.setAttribute("data-extra","unit");unit.innerHTML='<span>단위</span><select><option>kg</option><option>EA</option></select>';if(plan)grid.insertBefore(unit,plan.nextSibling);else grid.appendChild(unit);
   var date=fieldByLabel(shell,"생산예정일");if(date)grid.appendChild(date);
   var eq=fieldByLabel(shell,"설비");if(eq)grid.appendChild(eq);
   var author=fieldByLabel(shell,"작성자");if(author)grid.appendChild(author);
   var note=document.createElement("div");note.className="qmes-workorder-extra-field qmes-new-wide";note.setAttribute("data-extra","note");note.innerHTML='<span>비고</span><textarea placeholder="작업지시 특이사항"></textarea>';grid.appendChild(note);
 }

 var mt=[].slice.call(shell.querySelectorAll("table")).find(function(t){return [].slice.call(t.querySelectorAll("th")).some(function(th){return /원재료명/.test(clean(th.textContent))})});
 if(mt){
   var holder=mt.closest("div");
   if(holder&&!holder.classList.contains("qmes-new-material-box")){
     var box=document.createElement("div");box.className="qmes-new-material-box";box.innerHTML="<h4>투입원료</h4>";
     holder.parentElement.insertBefore(box,holder);box.appendChild(holder);
   }
   [].slice.call(mt.querySelectorAll("thead th")).forEach(function(th){var t=clean(th.textContent);if(t==="순서")th.textContent="No";if(t==="LOT No.")th.textContent="원재료 LOT";if(t==="계획량")th.textContent="투입량";});
   ["투입상태","사용 후 잔량","오차(%)","투입비율"].forEach(function(t){hideMaterialColumn(mt,t)});
 }
 [].slice.call(shell.querySelectorAll("div,span")).forEach(function(el){var t=clean(el.textContent);if(t.indexOf("계획량 합계")>=0||t.indexOf("오차 기준")>=0)el.classList.add("qmes-new-material-note")});

 var footer=shell.querySelector(".qmes-new-footer");
 if(!footer){
   footer=document.createElement("div");footer.className="qmes-new-footer";
   var cancel=document.createElement("button");cancel.type="button";cancel.textContent="취소";cancel.onclick=function(){var x=[].slice.call(shell.querySelectorAll("button")).find(function(b){return clean(b.textContent)==="×"||/닫기/.test(b.getAttribute("aria-label")||"")});if(x)x.click();};
   var save=[].slice.call(shell.querySelectorAll("button")).find(function(b){return /^(발행|작업지시 발행|등록|저장)$/.test(clean(b.textContent))});
   var saveProxy=document.createElement("button");saveProxy.type="button";saveProxy.className="qmes-new-save";saveProxy.textContent="저장";saveProxy.onclick=function(){if(save)save.click();};
   footer.appendChild(cancel);footer.appendChild(saveProxy);shell.appendChild(footer);
   if(save)save.setAttribute("data-qmes-new-hidden","1");
 }
 return true;
}
function watchNewModal(){
 if(newModalObserver){newModalObserver.disconnect();newModalObserver=null}
 var tries=0,timer=setInterval(function(){
   tries++;
   if(customizeNewModal()){
     clearInterval(timer);
     var shell=document.querySelector(".qmes-wo-issue-shell.qmes-new-workorder-modal");
     if(shell){
       newModalObserver=new MutationObserver(function(){customizeNewModal()});
       newModalObserver.observe(shell,{childList:true,subtree:true});
     }
   }else if(tries>60)clearInterval(timer);
 },30);
}
function nativeNew(){var b=document.querySelector(".qmes-iqc-new-btn");if(!b)return false;b.click();watchNewModal();return true}
function downloadCsv(){var heads=["No","지시일","작업지시번호","고객사","제품명","생산 LOT NO.","계획수량","단위","생산예정일","설비","투입계획량","실투입량","생산수량","수율","PQC","진행상태","작업자","비고"],rows=state.filtered.map(function(r,i){return[i+1,r.date,r.workOrderNo,r.customer,r.product,r.productionLotNo,r.plan,"kg",r.plannedDate,r.equipment,r.plan,r.actual||"",r.actual||"",r.yield==null?"":r.yield.toFixed(1)+"%",r.pqc,r.status,r.worker,r.remarks]});function cell(v){var s=String(v==null?"":v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}var csv="\uFEFF"+[heads].concat(rows).map(function(row){return row.map(cell).join(",")}).join("\r\n"),blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="작업지시서_"+new Date().toISOString().slice(0,10)+".csv";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000)}
function bind(){
 state.host.addEventListener("click",function(e){
  var p=e.target.closest("[data-page]");if(p){state.page=Number(p.getAttribute("data-page"))||1;renderTable();return}
  var top=e.target.closest("[data-top]");if(top){var a=top.getAttribute("data-top");if(a==="search"){applyFilter(true);render();return}if(a==="reset"){state.host.querySelector("#qwf2-from").value="2025-01-01";state.host.querySelector("#qwf2-to").value="2026-12-31";state.host.querySelector("#qwf2-customer").value="";state.host.querySelector("#qwf2-product").value="";state.host.querySelector("#qwf2-status").value="";state.host.querySelector("#qwf2-q").value="";applyFilter(true);render();return}if(a==="new"){if(!nativeNew())alert("신규 작업지시 화면을 찾을 수 없습니다.");return}if(a==="excel-out"){downloadCsv();return}if(a==="excel-in"){var b=document.querySelector('input[type="file"][accept*="xls"],input[type="file"][accept*="csv"]');if(b)b.click();else alert("엑셀 원료 불러오기 기능은 신규 작업지시 화면에서 사용하세요.");return}}
  var act=e.target.closest("[data-act]");if(!act)return;var tr=act.closest("tr"),idx=Number(tr&&tr.getAttribute("data-src")),row=state.rows.find(function(r){return r.index===idx});if(!row)return;var type=act.getAttribute("data-act");if(!nativeAction(row.rawKey,type))alert("작업지시 "+type+" 기능을 찾을 수 없습니다.");
 });
 ["qwf2-from","qwf2-to","qwf2-customer","qwf2-product","qwf2-status","qwf2-q"].forEach(function(id){var el=state.host.querySelector("#"+id);if(el)el.addEventListener("keydown",function(e){if(e.key==="Enter"){applyFilter(true);render()}})});
}
function mount(){
 var root=findRoot();if(!root)return;if(state.root!==root){state.root=root;state.host=null;state.signature=""}
 root.classList.add("qmes-workorder-salesdue-exact-v6");root.setAttribute("data-qmes-workorder-owner","salesdue-exact-v6");
 if(!state.host||!state.host.isConnected){var host=document.createElement("section");host.id="qmes-workorder-salesdue-exact-v6";host.className="qmes-sales-ledger-v4 qmes-sales-delivery-dashboard-v1 qmes-sales-delivery-dashboard-v2";host.innerHTML=markup();root.insertBefore(host,root.firstChild);state.host=host;bind()}
 var nextRows=sourceRows(root);
 var nextSignature="";
 try{nextSignature=JSON.stringify(nextRows.map(function(r){return [r.rawKey,r.date,r.customer,r.product,r.plan,r.actual,r.plannedDate,r.equipment,r.worker,r.status,r.remarks]}))}catch(_){}
 if(state.signature===nextSignature&&state.rows&&state.rows.length===nextRows.length)return;
 state.signature=nextSignature;state.rows=nextRows;applyFilter(false);render();if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.scan==="function")window.qmesFixedCalendar.scan(state.host);
}
var queued=false, initialObserver=null;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;mount()})}
function boot(){
  mount();
  if(!state.host){
    initialObserver=new MutationObserver(function(){
      mount();
      if(state.host&&initialObserver){initialObserver.disconnect();initialObserver=null;}
    });
    initialObserver.observe(document.documentElement,{childList:true,subtree:true});
  }
  window.addEventListener("qmes:navigate-tab",schedule);
  window.addEventListener("qmes:data-updated",schedule);
  window.addEventListener("qmes:workorder-saved",schedule);
  window.addEventListener("qmes:workorder-synced",schedule);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();