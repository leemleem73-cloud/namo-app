/* QMES Workorder Sales/Due clean rebuild - 2026-09-29
 * Fresh owner. No overwrite of legacy/core workorder source.
 */
(function(){
  "use strict";
  if(window.__QMES_WORKORDER_CLEAN_REBUILD_20260929_V1__)return;
  window.__QMES_WORKORDER_CLEAN_REBUILD_20260929_V1__=true;

  var PAGE_SIZE=10;
  var state={root:null,host:null,rows:[],filtered:[],page:1};

  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
  function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
  function num(v){var n=parseFloat(String(v==null?"":v).replace(/[^0-9.+-]/g,""));return Number.isFinite(n)?n:0;}
  function fmt(v){return Number(v||0).toLocaleString("ko-KR",{maximumFractionDigits:3});}
  function currentUser(){
    var u=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    try{var s=JSON.parse(sessionStorage.getItem("qmes-current-user-v1")||"null");if(s&&typeof s==="object")u=Object.assign({},u,s);}catch(_){}
    return u||{};
  }
  function canDelete(){
    var u=currentUser(),t=clean(u.title||u.position||u.rank||u.jobTitle||u.job_title),r=clean(u.role).toLowerCase();
    return /^(부장|이사|상무|전무|부사장|사장|대표|대표이사|회장|임원)$/.test(t)||r==="admin"||r==="administrator"||r==="관리자";
  }
  function normalizeLot(raw,doc,batch){
    var direct=clean(doc&&(doc.productionLotNo||doc.sourceLotNo||doc.displayWorkOrderNo||doc.woNo))||
      clean(batch&&(batch.productionLotNo||batch.displayLotNo||batch.workOrderNo));
    if(direct)return direct;
    var s=clean(raw),m=s.match(/([A-Z]{3}\d{4})$/i);
    return m?m[1].toUpperCase():s;
  }
  function normalizeEquipment(v){
    var s=clean(v);
    if(/^HSM/i.test(s))return"HSM";
    return s.replace(/\s*\([^)]*\)\s*$/,"");
  }
  function salesLink(rawKey,lot){
    var rows=[],meta={};
    try{rows=JSON.parse(localStorage.getItem("qmes-erp-sales-v1")||"[]")||[];}catch(_){}
    try{meta=JSON.parse(localStorage.getItem("qmes-sales-order-meta-v1")||"{}")||{};}catch(_){}
    if(!Array.isArray(rows))rows=[];
    function mm(r){var k=clean(r&&(r.workOrder||r.id));return meta[k]||meta[clean(r&&r.id)]||(r&&r.orderMeta)||{};}
    var hit=rows.find(function(r){
      var m=mm(r),wo=clean(m.workOrder||r&&r.workOrder),pl=clean(m.productionLotNo||r&&r.productionLotNo);
      return wo===rawKey||wo===lot||pl===lot;
    });
    if(!hit)return{};
    var m=mm(hit);
    return {
      customer:clean(m.customer||hit.customer||hit.customerName),
      product:clean(m.product||hit.product||hit.item||hit.itemName),
      quantity:num(m.quantity!=null?m.quantity:hit.quantity),
      due:clean(m.confirmedDue||m.requestedDue||hit.due||hit.confirmedDue)
    };
  }
  function nativeTable(){
    return document.querySelector(".qmes-issued-table-v2");
  }
  function findRoot(){
    var table=nativeTable();
    if(!table)return null;
    var p=table.parentElement;
    while(p&&p!==document.body){
      var heading=[].slice.call(p.querySelectorAll("h1,h2,h3")).find(function(el){return clean(el.textContent)==="작업지시 관리";});
      if(heading)return p;
      p=p.parentElement;
    }
    return null;
  }
  function sourceRows(root){
    var table=root.querySelector(".qmes-issued-table-v2");
    if(!table)return[];
    var DB=window.DB||{};
    return [].slice.call(table.querySelectorAll("tbody tr"))
      .filter(function(tr){return tr.querySelectorAll("td").length>=10;})
      .map(function(tr,index){
        var c=tr.querySelectorAll("td");
        var raw=clean(c[0]&&c[0].textContent);
        var doc=DB.woDocs&&DB.woDocs[raw]||{};
        var batch=(DB.batches||[]).find(function(b){return clean(b&&b.no)===raw;})||{};
        var sel=c[9]&&c[9].querySelector("select");
        var status=clean(sel?sel.value:(c[9]&&c[9].textContent));
        var lot=normalizeLot(raw,doc,batch),linked=salesLink(raw,lot);
        var plan=num(doc.plan!=null?doc.plan:(batch.plan!=null?batch.plan:(c[3]&&c[3].textContent)));
        var actual=num(doc.productionActual!=null?doc.productionActual:(batch.done!=null?batch.done:(c[4]&&c[4].textContent)));
        var yieldRate=plan>0&&actual>0?(actual/plan*100):null;
        return {
          src:tr,index:index,rawKey:raw,workOrderNo:lot,productionLotNo:lot,
          customer:linked.customer||clean(doc.customer)||"-",
          product:clean(doc.item||batch.item||c[1]&&c[1].textContent)||linked.product||"-",
          equipment:normalizeEquipment(doc.tank||batch.tank||c[2]&&c[2].textContent),
          plan:plan,actual:actual,
          date:clean(doc.date||batch.due||c[5]&&c[5].textContent),
          plannedDate:clean(doc.productionDate||batch.productionDate||doc.date||batch.due||c[5]&&c[5].textContent),
          worker:clean(doc.workers||batch.worker||c[8]&&c[8].textContent),
          status:status,
          yield:yieldRate,
          remarks:clean(doc.remarks),
          pqc:(doc.processChecks||[]).length?((doc.processChecks||[]).some(function(x){return /NG|불합격/i.test(clean(x.judge));})?"NG":"OK"):"-"
        };
      });
  }
  function tone(s){
    s=clean(s);
    if(/완료|합격|OK/.test(s))return"good";
    if(/보류|재확인|이상|NG|불합격/.test(s))return"bad";
    if(/생산중|검사중|진행/.test(s))return"blue";
    if(/대기|발행|미착수/.test(s))return"warn";
    return"gray";
  }
  function badge(s){s=s||"-";return'<span class="qwr-badge '+tone(s)+'">'+esc(s)+'</span>';}
  function value(id){var el=state.host&&state.host.querySelector("#"+id);return el?clean(el.value):"";}
  function refreshFiltered(resetPage){
    if(resetPage)state.page=1;
    var from=value("qwr-from"),to=value("qwr-to"),customer=value("qwr-customer"),product=value("qwr-product").toLowerCase(),
      status=value("qwr-status"),q=value("qwr-q").toLowerCase();
    state.filtered=state.rows.filter(function(r){
      if(from&&r.date&&r.date<from)return false;
      if(to&&r.date&&r.date>to)return false;
      if(customer&&r.customer!==customer)return false;
      if(product&&!r.product.toLowerCase().includes(product))return false;
      if(status&&!r.status.includes(status))return false;
      if(q&&!(r.workOrderNo+" "+r.productionLotNo+" "+r.customer+" "+r.product+" "+r.equipment+" "+r.worker).toLowerCase().includes(q))return false;
      return true;
    });
  }
  function renderCustomers(){
    var el=state.host.querySelector("#qwr-customer");
    if(!el)return;
    var cur=el.value;
    var vals=Array.from(new Set(state.rows.map(function(r){return r.customer;}).filter(function(v){return v&&v!=="-";}))).sort();
    el.innerHTML='<option value="">전체</option>'+vals.map(function(v){return'<option value="'+esc(v)+'">'+esc(v)+'</option>';}).join("");
    if(vals.includes(cur))el.value=cur;
  }
  function renderKpis(){
    var rows=state.filtered;
    var vals=[
      rows.length,
      rows.filter(function(r){return /발행|대기|미착수/.test(r.status);}).length,
      rows.filter(function(r){return /생산중|검사중|진행/.test(r.status);}).length,
      rows.filter(function(r){return /완료/.test(r.status);}).length,
      rows.filter(function(r){return /보류|재확인|이상|NG/.test(r.status)||r.pqc==="NG";}).length,
      0
    ];
    state.host.querySelectorAll(".qwr-kpi strong").forEach(function(el,i){el.textContent=vals[i];});
  }
  function renderTable(){
    var body=state.host.querySelector("tbody");
    var pager=state.host.querySelector(".qwr-pagination");
    var pages=Math.max(1,Math.ceil(state.filtered.length/PAGE_SIZE));
    if(state.page>pages)state.page=pages;
    var start=(state.page-1)*PAGE_SIZE;
    var shown=state.filtered.slice(start,start+PAGE_SIZE);
    if(!shown.length){
      body.innerHTML='<tr><td colspan="19" class="qwr-empty">조회 조건에 맞는 작업지시가 없습니다.</td></tr>';
    }else{
      var del=canDelete();
      body.innerHTML=shown.map(function(r,i){
        var y=r.yield==null?"-":r.yield.toFixed(1)+"%";
        return'<tr data-src="'+r.index+'">'+
          '<td>'+(start+i+1)+'</td>'+
          '<td>'+esc(r.date||"-")+'</td>'+
          '<td><button class="qwr-link" data-act="detail">'+esc(r.workOrderNo||"-")+'</button></td>'+
          '<td>'+esc(r.customer||"-")+'</td>'+
          '<td>'+esc(r.product||"-")+'</td>'+
          '<td>'+esc(r.productionLotNo||"-")+'</td>'+
          '<td>'+fmt(r.plan)+'</td><td>kg</td>'+
          '<td>'+esc(r.plannedDate||"-")+'</td>'+
          '<td>'+esc(r.equipment||"-")+'</td>'+
          '<td>'+fmt(r.plan)+'</td>'+
          '<td>'+(r.actual?fmt(r.actual):"-")+'</td>'+
          '<td>'+(r.actual?fmt(r.actual):"-")+'</td>'+
          '<td>'+y+'</td>'+
          '<td>'+badge(r.pqc)+'</td>'+
          '<td>'+badge(r.status)+'</td>'+
          '<td>'+esc(r.worker||"-")+'</td>'+
          '<td>'+esc(r.remarks||"-")+'</td>'+
          '<td><div class="qwr-manage"><button class="primary" data-act="detail">상세</button><button data-act="edit">수정</button>'+(del?'<button class="delete" data-act="delete">삭제</button>':'')+'</div></td>'+
        '</tr>';
      }).join("");
    }
    var html="";
    for(var p=1;p<=pages;p++)html+='<button class="qwr-page '+(p===state.page?"active":"")+'" data-page="'+p+'">'+p+'</button>';
    pager.innerHTML=html;
  }
  function render(){
    renderCustomers();
    renderKpis();
    renderTable();
  }
  function markup(){
    return ''+
      '<div class="qwr-head"><div><h1>작업지시서 관리</h1></div><div class="qwr-actions">'+
        '<button class="green" data-top="excel-in">엑셀 원료 불러오기</button>'+
        '<button data-top="print">작업지시서 인쇄</button>'+
        '<button class="green" data-top="excel-out">엑셀 다운로드</button>'+
        '<button class="blue" data-top="new">+ 신규 작업지시</button>'+
      '</div></div>'+
      '<div class="qwr-kpis">'+
        '<div class="qwr-kpi"><span>전체 작업지시</span><strong>0</strong><small>조회기간 기준</small></div>'+
        '<div class="qwr-kpi warn"><span>생산 대기</span><strong>0</strong><small>작업 시작 전</small></div>'+
        '<div class="qwr-kpi"><span>생산 진행</span><strong>0</strong><small>현재 생산중</small></div>'+
        '<div class="qwr-kpi good"><span>생산 완료</span><strong>0</strong><small>실적 등록 완료</small></div>'+
        '<div class="qwr-kpi bad"><span>보류 / 이상</span><strong>0</strong><small>확인 필요</small></div>'+
        '<div class="qwr-kpi good"><span>승인 완료</span><strong>0</strong><small>결재 완료</small></div>'+
      '</div>'+
      '<div class="qwr-filter">'+
        '<div class="qwr-field"><span>지시기간</span><div class="qwr-date qrl-date"><input id="qwr-from" type="date"><b>~</b><input id="qwr-to" type="date"></div></div>'+
        '<div class="qwr-field"><span>고객사</span><select id="qwr-customer"><option value="">전체</option></select></div>'+
        '<div class="qwr-field"><span>제품명</span><input id="qwr-product" placeholder="제품명 검색"></div>'+
        '<div class="qwr-field"><span>진행상태</span><select id="qwr-status"><option value="">전체</option><option>발행</option><option>생산중</option><option>검사중</option><option>완료</option></select></div>'+
        '<div class="qwr-field"><span>결재상태</span><select disabled><option>전체</option></select></div>'+
        '<div class="qwr-field"><span>통합검색</span><input id="qwr-q" placeholder="작업지시번호, 생산 LOT NO., 제품명, 고객사 검색"></div>'+
        '<button data-top="search">조회</button>'+
      '</div>'+
      '<div class="qwr-legend"><b>작업지시 현황</b><span>수주 → 작업지시 → 원료투입 → 생산 → PQC → 완료</span></div>'+
      '<div class="qwr-table-shell"><table class="qwr-table"><thead><tr>'+
        '<th>No</th><th>지시일</th><th>작업지시번호</th><th>고객사</th><th>제품명</th><th>생산 LOT NO.</th><th>계획수량</th><th>단위</th><th>생산예정일</th><th>설비</th><th>투입계획량</th><th>실투입량</th><th>생산수량</th><th>수율</th><th>PQC</th><th>진행상태</th><th>작업자</th><th>비고</th><th>관리</th>'+
      '</tr></thead><tbody></tbody></table></div>'+
      '<div class="qwr-pagination"></div>';
  }
  function bind(){
    state.host.addEventListener("click",function(e){
      var page=e.target.closest("[data-page]");
      if(page){state.page=Math.max(1,Number(page.getAttribute("data-page"))||1);renderTable();return;}
      var top=e.target.closest("[data-top]");
      if(top){
        var a=top.getAttribute("data-top");
        if(a==="search"){refreshFiltered(true);render();return;}
        if(a==="new"){var b=state.root.querySelector(".qmes-iqc-new-btn");if(b)b.click();return;}
        if(a==="print"){window.print();return;}
        if(a==="excel-in"||a==="excel-out"){return;}
      }
      var action=e.target.closest("[data-act]");
      if(!action)return;
      var tr=action.closest("tr"),idx=Number(tr&&tr.getAttribute("data-src"));
      var row=state.rows.find(function(r){return r.index===idx;});
      if(!row||!row.src)return;
      var type=action.getAttribute("data-act");
      var selector=type==="edit"?".qmes-manage-btn.edit":type==="delete"?".qmes-manage-btn.delete":".qmes-manage-btn.view";
      var btn=row.src.querySelector(selector);
      if(btn)btn.click();
    });
    ["qwr-product","qwr-status","qwr-q","qwr-from","qwr-to","qwr-customer"].forEach(function(id){
      var el=state.host.querySelector("#"+id);
      if(el)el.addEventListener(el.tagName==="SELECT"?"change":"input",function(){refreshFiltered(true);render();});
    });
  }
  function mount(){
    var root=findRoot();
    if(!root)return;
    if(state.root!==root){state.root=root;state.host=null;}
    root.classList.add("qmes-workorder-clean-rebuild-v1");
    root.setAttribute("data-qmes-workorder-owner","clean-rebuild-v1");
    if(!state.host||!state.host.isConnected){
      var host=document.createElement("section");
      host.id="qmes-workorder-clean-rebuild-v1";
      host.innerHTML=markup();
      root.insertBefore(host,root.firstChild);
      state.host=host;
      bind();
    }
    state.rows=sourceRows(root);
    var dates=state.rows.map(function(r){return r.date;}).filter(Boolean).sort();
    if(dates.length&&!state.host.querySelector("#qwr-from").value){
      state.host.querySelector("#qwr-from").value=dates[0];
      state.host.querySelector("#qwr-to").value=dates[dates.length-1];
    }
    refreshFiltered(false);
    render();
    if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.scan==="function")window.qmesFixedCalendar.scan(state.host);
  }
  var queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(function(){queued=false;mount();});
  }
  function boot(){
    mount();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener("qmes:navigate-tab",schedule);
    window.addEventListener("qmes:data-updated",schedule);
    window.addEventListener("focus",schedule);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();