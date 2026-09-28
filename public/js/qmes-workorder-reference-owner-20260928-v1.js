/* NAMO QMES - Workorder reference owner V1 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * Mirrors attached 작업지시서l(3).html while reusing native QMES work-order data/actions.
 */
(function(){
"use strict";
if(window.__QMES_WORKORDER_REFERENCE_OWNER_V1__)return;
window.__QMES_WORKORDER_REFERENCE_OWNER_V1__=true;
var state={root:null,host:null,rows:[],filtered:[]};
function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function num(v){var n=parseFloat(String(v||"").replace(/[^0-9.-]/g,""));return Number.isFinite(n)?n:0;}
function findRoot(){
 var h=[].slice.call(document.querySelectorAll("h1,h2,h3")).find(function(el){return clean(el.textContent)==="작업지시 관리";});
 if(!h)return null;
 var p=h.parentElement;
 while(p&&p!==document.body){if(p.querySelector&&p.querySelector(".qmes-issued-table-v2"))return p;p=p.parentElement;}
 return null;
}
function sourceRows(root){
 var table=root.querySelector(".qmes-issued-table-v2"); if(!table)return[];
 return [].slice.call(table.querySelectorAll("tbody tr")).filter(function(tr){return tr.querySelectorAll("td").length>=10;}).map(function(tr,index){
  var c=tr.querySelectorAll("td"), status=clean(c[9]&&c[9].textContent);
  var plan=num(c[3]&&c[3].textContent), actual=num(c[4]&&c[4].textContent), y=plan>0&&actual>0?(actual/plan*100):null;
  return {src:tr,index:index,wo:clean(c[0]&&c[0].textContent),product:clean(c[1]&&c[1].textContent),equipment:clean(c[2]&&c[2].textContent),
   plan:plan,actual:actual,date:clean(c[5]&&c[5].textContent),time:clean(c[6]&&c[6].textContent),shift:clean(c[7]&&c[7].textContent),
   worker:clean(c[8]&&c[8].textContent),status:status,yield:y};
 });
}
function statusTone(s){if(/완료|합격/.test(s))return"ok";if(/보류|재확인|이상|NG/.test(s))return"bad";if(/생산중|검사중|진행/.test(s))return"blue";if(/대기|발행|미착수/.test(s))return"warn";return"gray";}
function statusSpan(s){s=s||"-";return'<span class="qwor-status '+statusTone(s)+'">'+esc(s)+'</span>';}
function readFilter(id){var e=state.host&&state.host.querySelector("#"+id);return e?clean(e.value):"";}
function applyFilter(){
 var from=readFilter("qwor-from"),to=readFilter("qwor-to"),product=readFilter("qwor-product").toLowerCase(),st=readFilter("qwor-status"),q=readFilter("qwor-q").toLowerCase();
 state.filtered=state.rows.filter(function(r){
  var d=r.date||""; if(from&&d&&d<from)return false;if(to&&d&&d>to)return false;
  if(product&&!r.product.toLowerCase().includes(product))return false;
  if(st&&!r.status.includes(st))return false;
  if(q&&!(r.wo+" "+r.product+" "+r.equipment+" "+r.worker).toLowerCase().includes(q))return false;
  return true;
 });
 renderTable(); renderKpis();
}
function renderKpis(){
 if(!state.host)return;var rows=state.filtered||[];
 var total=rows.length,wait=rows.filter(r=>/발행|대기|미착수/.test(r.status)).length,run=rows.filter(r=>/생산중|검사중|진행/.test(r.status)).length,
 done=rows.filter(r=>/완료/.test(r.status)).length,bad=rows.filter(r=>/보류|재확인|이상|NG/.test(r.status)).length;
 var vals=[total,wait,run,done,bad,0];state.host.querySelectorAll(".qwor-kpi .v").forEach(function(el,i){el.textContent=vals[i]||0;});
}
function renderTable(){
 var tb=state.host&&state.host.querySelector("tbody");if(!tb)return;
 if(!state.filtered.length){tb.innerHTML='<tr><td colspan="22" style="padding:24px;text-align:center;color:#718096">조회 조건에 맞는 작업지시가 없습니다.</td></tr>';return;}
 tb.innerHTML=state.filtered.map(function(r,i){
  var yieldTxt=r.yield==null?"-":r.yield.toFixed(1)+"%";
  return '<tr data-src="'+r.index+'">'+
  '<td>'+(i+1)+'</td><td>'+esc(r.date||"-")+'</td><td><span class="qwor-link" data-act="detail">'+esc(r.wo||"-")+'</span></td>'+
  '<td>-</td><td class="qwor-left">'+esc(r.product||"-")+'</td><td>'+esc(r.wo||"-")+'</td>'+
  '<td>'+r.plan.toLocaleString("ko-KR")+'</td><td>kg</td><td>'+esc(r.date||"-")+'</td><td>'+esc(r.equipment||"-")+'</td>'+
  '<td>-</td><td>'+r.plan.toLocaleString("ko-KR")+'</td><td>'+(r.actual?r.actual.toLocaleString("ko-KR"):"-")+'</td><td>'+(r.actual?r.actual.toLocaleString("ko-KR"):"-")+'</td><td>'+yieldTxt+'</td>'+
  '<td>'+statusSpan("-")+'</td><td>'+statusSpan(r.status)+'</td><td>'+esc(r.worker||"-")+'</td><td>'+statusSpan("대기")+'</td><td>'+statusSpan("대기")+'</td><td>-</td>'+
  '<td><div class="qwor-manage"><button class="qwor-mini blue" data-act="detail">상세</button><button class="qwor-mini" data-act="edit">수정</button></div></td></tr>';
 }).join("");
}
function hostHtml(){
 return '<div class="qwor-title-row"><h1>작업지시서 관리</h1><div class="qwor-title-actions">'+
 '<button class="qwor-btn green" data-top="excel-in">엑셀 원료 불러오기</button><button class="qwor-btn" data-top="print">작업지시서 인쇄</button>'+
 '<button class="qwor-btn green" data-top="excel-out">엑셀 다운로드</button><button class="qwor-btn blue" data-top="new">+ 신규 작업지시</button></div></div>'+
 '<div class="qwor-filter"><div class="qwor-field"><label>지시기간</label><div class="qwor-period"><input id="qwor-from" class="qwor-control" type="date"><span>~</span><input id="qwor-to" class="qwor-control" type="date"></div></div>'+
 '<div class="qwor-field"><label>고객사</label><select class="qwor-control" disabled><option>전체</option></select></div>'+
 '<div class="qwor-field"><label>제품명</label><input id="qwor-product" class="qwor-control" placeholder="제품명 검색"></div>'+
 '<div class="qwor-field"><label>진행상태</label><select id="qwor-status" class="qwor-control"><option value="">전체</option><option>발행</option><option>생산중</option><option>검사중</option><option>완료</option></select></div>'+
 '<div class="qwor-field"><label>결재상태</label><select class="qwor-control" disabled><option>전체</option></select></div>'+
 '<div class="qwor-field"><label>통합검색</label><input id="qwor-q" class="qwor-control" placeholder="작업지시번호, 생산LOT, 제품명, 고객사 검색"></div>'+
 '<button class="qwor-search-btn" data-top="search">조회</button></div>'+
 '<div class="qwor-kpis">'+
 '<div class="qwor-kpi info"><div class="l">전체 작업지시</div><div class="v">0</div><div class="s">조회기간 기준</div></div>'+
 '<div class="qwor-kpi warn"><div class="l">생산 대기</div><div class="v">0</div><div class="s">작업 시작 전</div></div>'+
 '<div class="qwor-kpi info"><div class="l">생산 진행</div><div class="v">0</div><div class="s">현재 생산중</div></div>'+
 '<div class="qwor-kpi good"><div class="l">생산 완료</div><div class="v">0</div><div class="s">실적 등록 완료</div></div>'+
 '<div class="qwor-kpi bad"><div class="l">보류 / 이상</div><div class="v">0</div><div class="s">확인 필요</div></div>'+
 '<div class="qwor-kpi good"><div class="l">승인 완료</div><div class="v">0</div><div class="s">결재 완료</div></div></div>'+
 '<div class="qwor-panel"><div class="qwor-panel-hd"><h2>작업지시 현황</h2><span>수주 → 작업지시 → 원료투입 → 생산 → PQC → 완료</span></div><div class="qwor-table-scroll">'+
 '<table class="qwor-table"><thead><tr><th>No</th><th>지시일</th><th>작업지시번호</th><th>고객사</th><th>제품명</th><th>생산LOT</th><th>계획수량</th><th>단위</th><th>생산예정일</th><th>설비</th><th>원료수</th><th>투입계획량</th><th>실투입량</th><th>생산수량</th><th>수율</th><th>PQC</th><th>진행상태</th><th>작성자</th><th>검토</th><th>승인</th><th>비고</th><th>관리</th></tr></thead><tbody></tbody></table></div></div>'+
 '<div class="qwor-footer">※ 나모케미칼 QMES 작업지시서 · 작성자는 로그인 사용자 고정 · 검토/승인 권한은 직책 권한과 연동합니다.</div>';
}
function bind(){
 state.host.addEventListener("click",function(e){
  var top=e.target.closest("[data-top]"); if(top){
   var a=top.getAttribute("data-top");
   if(a==="search"){applyFilter();return;}
   if(a==="new"){var b=state.root.querySelector(".qmes-iqc-new-btn");if(b)b.click();return;}
   if(a==="print"){window.print();return;}
   if(a==="excel-in"||a==="excel-out"){alert(a==="excel-in"?"엑셀 원료 불러오기 기능은 기존 작업지시 기능과 연결됩니다.":"엑셀 다운로드 기능은 기존 작업지시 기능과 연결됩니다.");return;}
  }
  var act=e.target.closest("[data-act]");if(!act)return;
  var tr=act.closest("tr"),idx=Number(tr&&tr.getAttribute("data-src")),src=state.rows.find(function(r){return r.index===idx;});
  if(!src||!src.src)return;
  var type=act.getAttribute("data-act");
  var btn=src.src.querySelector(type==="edit"?".qmes-manage-btn.edit":".qmes-manage-btn.view");
  if(btn)btn.click();
 });
 ["qwor-product","qwor-status","qwor-q","qwor-from","qwor-to"].forEach(function(id){var el=state.host.querySelector("#"+id);if(el)el.addEventListener(el.tagName==="SELECT"?"change":"input",applyFilter);});
}
function mount(){
 var root=findRoot();if(!root)return;
 if(state.root!==root){state.root=root;state.host=null;}
 root.classList.add("qmes-workorder-reference-active");
 if(!state.host){
  var host=document.createElement("div");host.id="qmes-workorder-reference-owner";host.innerHTML=hostHtml();root.insertBefore(host,root.firstChild);state.host=host;bind();
  var dates=sourceRows(root).map(function(r){return r.date;}).filter(Boolean).sort();
  if(dates.length){host.querySelector("#qwor-from").value=dates[0];host.querySelector("#qwor-to").value=dates[dates.length-1];}
 }
 state.rows=sourceRows(root);state.filtered=state.rows.slice();renderTable();renderKpis();
}
var queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;mount();});}
function boot(){mount();new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});window.addEventListener("qmes:navigate-tab",schedule);window.addEventListener("qmes:data-updated",schedule);window.addEventListener("focus",schedule);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();