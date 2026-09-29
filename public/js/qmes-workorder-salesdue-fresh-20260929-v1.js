/* QMES Workorder - Sales/Due parity fresh rebuild - 2026-09-29
 * Fresh files only. Legacy custom workorder rebuild files were deleted first.
 * Layout mirrors current Sales/Due dashboard while preserving native workorder actions/data.
 */
(function(){
"use strict";
if(window.__QMES_WORKORDER_SALESDUE_FRESH_20260929_V1__) return;
window.__QMES_WORKORDER_SALESDUE_FRESH_20260929_V1__=true;

var PAGE_SIZE=10;
var state={root:null,host:null,rows:[],filtered:[],page:1};

function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim()}
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function number(v){var n=parseFloat(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0}
function fmt(v){return Number(v||0).toLocaleString("ko-KR",{maximumFractionDigits:3})}

function currentUser(){
  var u=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
  try{var s=JSON.parse(sessionStorage.getItem("qmes-current-user-v1")||"null");if(s&&typeof s==="object")u=Object.assign({},u,s)}catch(_){}
  return u||{};
}
function canDelete(){
  var u=currentUser(),t=clean(u.title||u.position||u.rank||u.jobTitle||u.job_title),r=clean(u.role).toLowerCase();
  return /^(부장|이사|상무|전무|부사장|사장|대표|대표이사|회장|임원)$/.test(t)||r==="admin"||r==="administrator"||r==="관리자";
}
function nativeTable(){return document.querySelector(".qmes-issued-table-v2")}
function findRoot(){
  var table=nativeTable(); if(!table)return null;
  var p=table.parentElement;
  while(p&&p!==document.body){
    var h=[].slice.call(p.querySelectorAll("h1,h2,h3")).find(function(el){return clean(el.textContent)==="작업지시 관리"});
    if(h)return p;
    p=p.parentElement;
  }
  return null;
}
function sourceRows(root){
  var table=root.querySelector(".qmes-issued-table-v2"); if(!table)return[];
  return [].slice.call(table.querySelectorAll("tbody tr")).filter(function(tr){return tr.querySelectorAll("td").length>=10}).map(function(tr,index){
    var c=tr.querySelectorAll("td");
    var raw=clean(c[0]&&c[0].textContent);
    var product=clean(c[1]&&c[1].textContent)||"-";
    var equipment=clean(c[2]&&c[2].textContent)||"-";
    if(/^HSM/i.test(equipment))equipment="HSM";
    var plan=number(c[3]&&c[3].textContent);
    var actual=number(c[4]&&c[4].textContent);
    var date=clean(c[5]&&c[5].textContent)||"-";
    var worker=clean(c[8]&&c[8].textContent)||"-";
    var statusSelect=c[9]&&c[9].querySelector("select");
    var status=clean(statusSelect?statusSelect.value:(c[9]&&c[9].textContent))||"-";
    var y=plan>0&&actual>0?(actual/plan*100):null;
    var lot=raw;
    var m=raw.match(/([A-Z]{3}\d{4})$/i); if(m)lot=m[1].toUpperCase();
    return {index:index,rawKey:raw,src:tr,date:date,workOrderNo:lot,productionLotNo:lot,customer:"-",product:product,equipment:equipment,plan:plan,actual:actual,plannedDate:date,worker:worker,status:status,yield:y,pqc:"-",remarks:"-"};
  });
}
function tone(v){
  var s=clean(v);
  if(/불합격|NG|보류|이상/.test(s))return"bad";
  if(/완료|합격|OK/.test(s))return"good";
  if(/생산중|검사중|진행/.test(s))return"blue";
  if(/대기|발행|미착수/.test(s))return"warn";
  return"gray";
}
function badge(v){return '<span class="qwf-badge '+tone(v)+'">'+esc(v||"-")+'</span>'}
function get(id){var e=state.host&&state.host.querySelector("#"+id);return e?clean(e.value):""}
function applyFilter(reset){
  if(reset)state.page=1;
  var from=get("qwf-from"),to=get("qwf-to"),product=get("qwf-product").toLowerCase(),status=get("qwf-status"),q=get("qwf-q").toLowerCase();
  state.filtered=state.rows.filter(function(r){
    if(from&&r.date!=="-"&&r.date<from)return false;
    if(to&&r.date!=="-"&&r.date>to)return false;
    if(product&&!r.product.toLowerCase().includes(product))return false;
    if(status&&!r.status.includes(status))return false;
    if(q&&!(r.workOrderNo+" "+r.productionLotNo+" "+r.product+" "+r.equipment+" "+r.worker).toLowerCase().includes(q))return false;
    return true;
  });
}
function renderKpis(){
  var rows=state.filtered;
  var vals=[
    rows.length,
    rows.filter(function(r){return /발행|대기|미착수/.test(r.status)}).length,
    rows.filter(function(r){return /생산중|검사중|진행/.test(r.status)}).length,
    rows.filter(function(r){return /완료/.test(r.status)}).length,
    rows.filter(function(r){return /보류|이상|NG/.test(r.status)||r.pqc==="NG"}).length,
    0
  ];
  state.host.querySelectorAll(".qwf-kpi strong").forEach(function(el,i){el.textContent=vals[i]});
}
function renderTable(){
  var body=state.host.querySelector("tbody"),pager=state.host.querySelector(".qwf-pages");
  var pages=Math.max(1,Math.ceil(state.filtered.length/PAGE_SIZE));
  if(state.page>pages)state.page=pages;
  var start=(state.page-1)*PAGE_SIZE,shown=state.filtered.slice(start,start+PAGE_SIZE),del=canDelete();
  if(!shown.length){
    body.innerHTML='<tr><td colspan="19" class="qwf-empty">조회 조건에 맞는 작업지시가 없습니다.</td></tr>';
  }else{
    body.innerHTML=shown.map(function(r,i){
      var y=r.yield==null?"-":r.yield.toFixed(1)+"%";
      return '<tr data-src="'+r.index+'">'+
        '<td>'+(start+i+1)+'</td>'+
        '<td>'+esc(r.date)+'</td>'+
        '<td><button class="qwf-link" data-act="detail">'+esc(r.workOrderNo)+'</button></td>'+
        '<td>'+esc(r.customer)+'</td>'+
        '<td class="left">'+esc(r.product)+'</td>'+
        '<td>'+esc(r.productionLotNo)+'</td>'+
        '<td class="num">'+fmt(r.plan)+'</td>'+
        '<td>kg</td>'+
        '<td>'+esc(r.plannedDate)+'</td>'+
        '<td>'+esc(r.equipment)+'</td>'+
        '<td class="num">'+fmt(r.plan)+'</td>'+
        '<td class="num">'+(r.actual?fmt(r.actual):"-")+'</td>'+
        '<td class="num">'+(r.actual?fmt(r.actual):"-")+'</td>'+
        '<td>'+y+'</td>'+
        '<td>'+badge(r.pqc)+'</td>'+
        '<td>'+badge(r.status)+'</td>'+
        '<td>'+esc(r.worker)+'</td>'+
        '<td>'+esc(r.remarks)+'</td>'+
        '<td><div class="qwf-actions"><button class="primary" data-act="detail">상세</button><button data-act="edit">수정</button>'+(del?'<button class="delete" data-act="delete">삭제</button>':'')+'</div></td>'+
      '</tr>';
    }).join("");
  }
  var html="";for(var p=1;p<=pages;p++)html+='<button class="qwf-page '+(p===state.page?"active":"")+'" data-page="'+p+'">'+p+'</button>';
  pager.innerHTML=html;
}
function render(){renderKpis();renderTable()}
function markup(){
  return ''+
  '<div class="qwf-head"><h1>작업지시서 관리</h1><div class="qwf-head-actions">'+
    '<button class="green" data-top="excel-in">엑셀 원료 불러오기</button>'+
    '<button data-top="print">작업지시서 인쇄</button>'+
    '<button class="green" data-top="excel-out">엑셀 다운로드</button>'+
    '<button class="blue" data-top="new">+ 신규 작업지시</button>'+
  '</div></div>'+
  '<div class="qwf-kpis">'+
    '<div class="qwf-kpi"><span>전체 작업지시</span><strong>0</strong><small>조회기간 기준</small></div>'+
    '<div class="qwf-kpi warn"><span>생산 대기</span><strong>0</strong><small>작업 시작 전</small></div>'+
    '<div class="qwf-kpi"><span>생산 진행</span><strong>0</strong><small>현재 생산중</small></div>'+
    '<div class="qwf-kpi good"><span>생산 완료</span><strong>0</strong><small>실적 등록 완료</small></div>'+
    '<div class="qwf-kpi bad"><span>보류 / 이상</span><strong>0</strong><small>확인 필요</small></div>'+
    '<div class="qwf-kpi good"><span>승인 완료</span><strong>0</strong><small>결재 완료</small></div>'+
  '</div>'+
  '<div class="qwf-filter">'+
    '<div class="qwf-field"><span>지시기간</span><div class="qwf-date qrl-date"><input id="qwf-from" type="date"><b>~</b><input id="qwf-to" type="date"></div></div>'+
    '<div class="qwf-field"><span>고객사</span><select disabled><option>전체</option></select></div>'+
    '<div class="qwf-field"><span>제품명</span><input id="qwf-product" placeholder="제품명 검색"></div>'+
    '<div class="qwf-field"><span>진행상태</span><select id="qwf-status"><option value="">전체</option><option>발행</option><option>생산중</option><option>검사중</option><option>완료</option></select></div>'+
    '<div class="qwf-field"><span>결재상태</span><select disabled><option>전체</option></select></div>'+
    '<div class="qwf-field"><span>통합검색</span><input id="qwf-q" placeholder="작업지시번호, 생산 LOT NO., 제품명 검색"></div>'+
    '<button data-top="search">조회</button>'+
  '</div>'+
  '<div class="qwf-legend"><b>작업지시 현황</b><span>수주 → 작업지시 → 원료투입 → 생산 → PQC → 완료</span></div>'+
  '<div class="qwf-table-shell"><table class="qwf-table"><thead><tr>'+
    '<th>No</th><th>지시일</th><th>작업지시번호</th><th>고객사</th><th>제품명</th><th>생산 LOT NO.</th><th>계획수량</th><th>단위</th><th>생산예정일</th><th>설비</th><th>투입계획량</th><th>실투입량</th><th>생산수량</th><th>수율</th><th>PQC</th><th>진행상태</th><th>작업자</th><th>비고</th><th>관리</th>'+
  '</tr></thead><tbody></tbody></table></div><div class="qwf-pages"></div>';
}
function findNativeRow(rawKey){
  return [].slice.call(document.querySelectorAll(".qmes-issued-table-v2 tbody tr")).find(function(tr){
    return clean(tr.querySelector("td")&&tr.querySelector("td").textContent)===clean(rawKey);
  })||null;
}
function clickNativeAction(rawKey,type){
  var tr=findNativeRow(rawKey); if(!tr)return false;
  var sel=type==="edit"?".qmes-manage-btn.edit":type==="delete"?".qmes-manage-btn.delete":".qmes-manage-btn.view";
  var b=tr.querySelector(sel); if(!b)return false; b.click(); return true;
}
function clickNativeNew(){
  var b=document.querySelector(".qmes-iqc-new-btn"); if(!b)return false;b.click();return true;
}
function clickNativePrint(rawKey){
  var tr=findNativeRow(rawKey);if(!tr)return false;var b=tr.querySelector(".qmes-manage-btn.print");if(!b)return false;b.click();return true;
}
function downloadCsv(){
  var heads=["No","지시일","작업지시번호","고객사","제품명","생산 LOT NO.","계획수량","단위","생산예정일","설비","투입계획량","실투입량","생산수량","수율","PQC","진행상태","작업자","비고"];
  var rows=state.filtered.map(function(r,i){return[i+1,r.date,r.workOrderNo,r.customer,r.product,r.productionLotNo,r.plan,"kg",r.plannedDate,r.equipment,r.plan,r.actual||"",r.actual||"",r.yield==null?"":r.yield.toFixed(1)+"%",r.pqc,r.status,r.worker,r.remarks]});
  function cell(v){var s=String(v==null?"":v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
  var csv="\uFEFF"+[heads].concat(rows).map(function(row){return row.map(cell).join(",")}).join("\r\n");
  var blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="작업지시서_"+new Date().toISOString().slice(0,10)+".csv";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000);
}
function bind(){
  state.host.addEventListener("click",function(e){
    var pg=e.target.closest("[data-page]");if(pg){state.page=Math.max(1,Number(pg.getAttribute("data-page"))||1);renderTable();return}
    var top=e.target.closest("[data-top]");
    if(top){
      var a=top.getAttribute("data-top");
      if(a==="search"){applyFilter(true);render();return}
      if(a==="new"){if(!clickNativeNew())alert("신규 작업지시 화면을 찾을 수 없습니다.");return}
      if(a==="print"){var first=state.filtered[0];if(first&&!clickNativePrint(first.rawKey))window.print();return}
      if(a==="excel-out"){downloadCsv();return}
      if(a==="excel-in"){var native=document.querySelector('input[type="file"][accept*="xls"],input[type="file"][accept*="csv"]');if(native){native.click();}else{alert("엑셀 원료 불러오기 기능은 기존 작업지시 입력 화면에서 사용하세요.");}return}
    }
    var act=e.target.closest("[data-act]");if(!act)return;
    var tr=act.closest("tr"),idx=Number(tr&&tr.getAttribute("data-src")),row=state.rows.find(function(r){return r.index===idx});if(!row)return;
    var type=act.getAttribute("data-act");
    if(!clickNativeAction(row.rawKey,type))alert("작업지시 "+(type==="detail"?"상세":type==="edit"?"수정":"삭제")+" 기능을 찾을 수 없습니다.");
  });
  ["qwf-product","qwf-status","qwf-q","qwf-from","qwf-to"].forEach(function(id){
    var el=state.host.querySelector("#"+id);if(el)el.addEventListener(el.tagName==="SELECT"?"change":"input",function(){applyFilter(true);render()});
  });
}
function mount(){
  var root=findRoot();if(!root)return;
  if(state.root!==root){state.root=root;state.host=null}
  root.classList.add("qmes-workorder-salesdue-fresh-v1");
  root.setAttribute("data-qmes-workorder-owner","salesdue-fresh-v1");
  if(!state.host||!state.host.isConnected){
    var host=document.createElement("section");host.id="qmes-workorder-salesdue-fresh-v1";host.innerHTML=markup();root.insertBefore(host,root.firstChild);state.host=host;bind();
  }
  state.rows=sourceRows(root);
  var dates=state.rows.map(function(r){return r.date}).filter(function(v){return v&&v!=="-"}).sort();
  if(dates.length&&!state.host.querySelector("#qwf-from").value){state.host.querySelector("#qwf-from").value=dates[0];state.host.querySelector("#qwf-to").value=dates[dates.length-1]}
  applyFilter(false);render();
  if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.scan==="function")window.qmesFixedCalendar.scan(state.host);
}
var queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;mount()})}
function boot(){mount();new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener("qmes:navigate-tab",schedule);window.addEventListener("qmes:data-updated",schedule);window.addEventListener("focus",schedule)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();