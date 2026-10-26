(function(){
'use strict';
if(window.__NAMO_PRODUCTION_STATUS_RESTORED_20261026__)return;
window.__NAMO_PRODUCTION_STATUS_RESTORED_20261026__=true;

function init(){
  document.querySelectorAll('#namo-production-status-menu,#namo-production-status-panel,#namo-production-result-menu,#namo-production-result-panel').forEach(function(el){el.remove();});
  var work=document.querySelector('#sidebar .menu[data-page="work"]');
  if(!work||document.getElementById('namo-production-status-menu'))return;

  var menu=document.createElement('div');
  menu.id='namo-production-status-menu';
  menu.className='menu';
  menu.dataset.page='namo-production-status-panel';
  menu.innerHTML='<div class="ico">📊</div><div class="label">생산현황</div>';
  work.insertAdjacentElement('beforebegin',menu);

  var panel=document.createElement('section');
  panel.id='namo-production-status-panel';
  panel.className='module-page';
  panel.innerHTML=`
<style>
#namo-production-status-panel{padding:0!important;background:#f3f6fa!important;color:#33485f;font-family:inherit}
#namo-production-status-panel *{box-sizing:border-box}
#namo-production-status-panel .ps-head{height:58px;background:#fff;border-bottom:1px solid #dfe7f0;display:flex;align-items:center;justify-content:space-between;padding:0 18px}
#namo-production-status-panel .ps-title h2{margin:0;font-size:18px;color:#254567;border-left:3px solid #4b92dd;padding-left:10px}
#namo-production-status-panel .ps-title p{margin:4px 0 0 13px;font-size:10px;color:#8a99aa}
#namo-production-status-panel .ps-actions{display:flex;gap:7px}
#namo-production-status-panel button{cursor:pointer;font:inherit}
#namo-production-status-panel .ps-btn{height:34px;border:1px solid #cfdbe7;background:#fff;color:#365b7c;border-radius:6px;padding:0 12px;font-size:10px;font-weight:800}
#namo-production-status-panel .ps-btn.primary{background:#4b92dd;color:#fff;border-color:#4b92dd}
#namo-production-status-panel .ps-filter{background:#eef4fa;border-bottom:1px solid #dfe7f0;padding:10px 12px;display:grid;grid-template-columns:repeat(5,1fr) auto;gap:9px}
#namo-production-status-panel .ps-field label{display:block;font-size:9px;color:#5b7188;font-weight:800;margin-bottom:4px}
#namo-production-status-panel .ps-field input,#namo-production-status-panel .ps-field select{width:100%;height:32px;border:1px solid #ccd8e5;background:#fff;border-radius:4px;padding:0 9px;font-size:10px;color:#425870}
#namo-production-status-panel .ps-filter-actions{display:flex;align-items:end;gap:6px}
#namo-production-status-panel .ps-wrap{padding:12px}
#namo-production-status-panel .ps-layout{display:grid;grid-template-columns:230px minmax(0,1fr) 270px;gap:10px;align-items:stretch}
#namo-production-status-panel .ps-panel{background:#fff;border:1px solid #dfe7f0;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(35,72,108,.04)}
#namo-production-status-panel .ps-panel-head{height:38px;padding:0 12px;border-bottom:1px solid #edf2f7;display:flex;align-items:center;justify-content:space-between}
#namo-production-status-panel .ps-panel-head b{font-size:11px;color:#274b6d}
#namo-production-status-panel .ps-panel-head small{font-size:8px;color:#8a99aa}
#namo-production-status-panel .ps-panel-body{padding:10px}
#namo-production-status-panel .ps-jobs{display:grid;gap:8px;max-height:560px;overflow:auto}
#namo-production-status-panel .ps-job{border:1px solid #dfe7f0;border-radius:8px;background:#fbfdff;padding:10px;cursor:pointer}
#namo-production-status-panel .ps-job.active{border:2px solid #4b92dd;background:#eaf4ff}
#namo-production-status-panel .ps-job-top{display:flex;justify-content:space-between;gap:8px}
#namo-production-status-panel .ps-job-top b{font-size:10px;color:#244765}
#namo-production-status-panel .ps-job-top span{font-size:8px;color:#93a0ae}
#namo-production-status-panel .ps-job p{margin:6px 0;font-size:8.5px;color:#728396;line-height:1.5}
#namo-production-status-panel .ps-job-foot{display:flex;justify-content:space-between;align-items:center;font-size:8px;color:#8a98a8}
#namo-production-status-panel .ps-badge{display:inline-block;padding:4px 8px;border-radius:10px;font-size:7.5px;font-weight:900;white-space:nowrap}
#namo-production-status-panel .ps-badge.run{background:#e8f2ff;color:#3475ba}
#namo-production-status-panel .ps-badge.ok{background:#eaf7ef;color:#36855a}
#namo-production-status-panel .ps-badge.wait{background:#fff5dd;color:#a57b13}
#namo-production-status-panel .ps-badge.ng{background:#fdebea;color:#c25555}
#namo-production-status-panel .ps-detail-title{display:flex;justify-content:space-between;align-items:flex-start}
#namo-production-status-panel .ps-detail-title h3{margin:0;font-size:17px;color:#23486a}
#namo-production-status-panel .ps-detail-title p{margin:4px 0 0;font-size:8.5px;color:#8e9bac}
#namo-production-status-panel .ps-info-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
#namo-production-status-panel .ps-info{border:1px solid #dfe7f0;border-radius:7px;background:#fbfdff;padding:9px}
#namo-production-status-panel .ps-info span{display:block;font-size:8px;color:#90a0af}
#namo-production-status-panel .ps-info b{display:block;font-size:11px;color:#2d4d69;margin-top:4px}
#namo-production-status-panel .ps-progress{margin-top:10px;border-top:1px solid #edf2f7;padding-top:10px}
#namo-production-status-panel .ps-progress-top{display:flex;justify-content:space-between;font-size:8px;color:#8796a7;margin-bottom:5px}
#namo-production-status-panel .ps-bar{height:10px;background:#e6edf5;border-radius:8px;overflow:hidden}
#namo-production-status-panel .ps-bar i{display:block;height:100%;background:linear-gradient(90deg,#4b92dd,#7ab2ea)}
#namo-production-status-panel .ps-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
#namo-production-status-panel .ps-metric{border:1px solid #dfe7f0;border-radius:7px;background:#fcfdff;padding:10px;text-align:center}
#namo-production-status-panel .ps-metric span{display:block;font-size:8px;color:#8a99aa}
#namo-production-status-panel .ps-metric b{display:block;font-size:16px;color:#264a6b;margin-top:5px}
#namo-production-status-panel .ps-route-wrap{margin-top:12px;border-top:1px solid #edf2f7;padding-top:12px}
#namo-production-status-panel .ps-route-title{font-size:9px;font-weight:900;color:#2d4d69;margin-bottom:8px}
#namo-production-status-panel .ps-route{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
#namo-production-status-panel .ps-node{position:relative;border:1px solid #dfe7f0;border-radius:7px;background:#f7fafc;padding:11px 6px;text-align:center}
#namo-production-status-panel .ps-node:not(:last-child):after{content:"";position:absolute;right:-9px;top:50%;width:10px;height:2px;background:#bfd0e0}
#namo-production-status-panel .ps-node span{display:block;font-size:7px;color:#91a0af}
#namo-production-status-panel .ps-node b{display:block;font-size:10px;margin-top:4px}
#namo-production-status-panel .ps-node.good{background:#edf8f1;border-color:#d7ebdf}.ps-node.good b{color:#49a36f}
#namo-production-status-panel .ps-node.active{background:#eaf4ff;border-color:#cfe2f7}.ps-node.active b{color:#4b92dd}
#namo-production-status-panel .ps-node.wait{background:#fff7e6;border-color:#f0e1b1}.ps-node.wait b{color:#d4a33b}
#namo-production-status-panel .ps-node.bad{background:#fff1f0;border-color:#efcecc}.ps-node.bad b{color:#e06b67}
#namo-production-status-panel .ps-node.lock{background:#f2f4f7}.ps-node.lock b{color:#97a3af}
#namo-production-status-panel .ps-log{margin-top:12px;border:1px solid #dfe7f0;border-radius:7px;overflow:hidden}
#namo-production-status-panel .ps-log-head{padding:8px 10px;background:#f7fafc;font-size:9px;font-weight:900;color:#2c4d68}
#namo-production-status-panel .ps-log-row{display:grid;grid-template-columns:70px 105px 1fr;gap:8px;padding:8px 10px;border-top:1px solid #edf2f7;font-size:8px}
#namo-production-status-panel .ps-log-row span{color:#95a3b2}.ps-log-row b{color:#2c4d68}.ps-log-row p{margin:0;color:#6d8094}
#namo-production-status-panel .ps-actions-list{display:grid;gap:8px}
#namo-production-status-panel .ps-action{border:1px solid #dfe7f0;border-radius:8px;padding:10px;background:#fbfdff}
#namo-production-status-panel .ps-action.green{border-left:4px solid #49a36f;background:#f6fbf8}
#namo-production-status-panel .ps-action.red{border-left:4px solid #e06b67;background:#fff7f7}
#namo-production-status-panel .ps-action.amber{border-left:4px solid #d4a33b;background:#fffaf0}
#namo-production-status-panel .ps-action.blue{border:2px solid #4b92dd;background:#f2f8ff}
#namo-production-status-panel .ps-action-top{display:flex;justify-content:space-between}
#namo-production-status-panel .ps-action-top b{font-size:9.5px;color:#2c4d68}
#namo-production-status-panel .ps-action-top strong{font-size:8px}
#namo-production-status-panel .ps-action p{margin:6px 0 0;font-size:8px;line-height:1.5;color:#73879b}
#namo-production-status-panel .ps-bottom{margin-top:10px}
#namo-production-status-panel .ps-bottom-toolbar{height:42px;padding:0 10px;border-bottom:1px solid #dfe7f0;display:flex;align-items:center;justify-content:space-between;background:#fff}
#namo-production-status-panel .ps-bottom-toolbar strong{font-size:11px;color:#274b6d}
#namo-production-status-panel .ps-bottom-tools{display:flex;align-items:center;gap:6px}
#namo-production-status-panel .ps-bottom-tools button{height:30px;border:1px solid #d3deea;background:#fff;color:#526b83;border-radius:5px;padding:0 10px;font-size:9px;font-weight:800}
#namo-production-status-panel .ps-bottom-tools .ps-icon-btn{width:32px;padding:0;font-size:15px;display:grid;place-items:center}
#namo-production-status-panel .ps-table-wrap{overflow:auto}
#namo-production-status-panel table{width:100%;border-collapse:collapse;min-width:1050px;font-size:9px}
#namo-production-status-panel th{background:#f3f7fb;color:#6c7b8b;border-bottom:1px solid #dfe7f0;padding:8px;text-align:center;white-space:nowrap}
#namo-production-status-panel td{border-bottom:1px solid #edf2f6;padding:8px;text-align:center;color:#4d6175;white-space:nowrap}
#namo-production-status-panel tbody tr:hover{background:#f8fbff}
#namo-production-status-panel .ps-link{border:0;background:none;color:#1672c3;text-decoration:underline;font-weight:800;padding:0}
#namo-production-status-panel .ps-summary{padding:10px;display:grid;gap:8px}
#namo-production-status-panel .ps-sum{border:1px solid #dfe7f0;border-radius:7px;padding:11px 12px;display:flex;justify-content:space-between;align-items:center}
#namo-production-status-panel .ps-sum span{font-size:8px;color:#91a0af}.ps-sum b{font-size:19px;color:#284d6d}
#namo-production-status-panel .ps-sum.green{background:#edf8f1}.ps-sum.blue{background:#eaf4ff}.ps-sum.amber{background:#fff7e6}.ps-sum.red{background:#fff1f0}
#namo-production-status-panel .ps-error{padding:10px;color:#b42318;font-size:11px}
@media(max-width:1250px){#namo-production-status-panel .ps-filter{grid-template-columns:repeat(3,1fr)}#namo-production-status-panel .ps-layout{grid-template-columns:1fr}}
</style>
<div class="ps-head">
  <div class="ps-title"><h2>생산현황</h2><p>작업지시 · 생산실적 · 품질 차단을 한 화면에서 확인합니다.</p></div>
  <div class="ps-actions"><button class="ps-btn" id="psExport">엑셀 내보내기</button><button class="ps-btn primary" id="psRefresh">새로고침</button></div>
</div>
<div class="ps-filter">
  <div class="ps-field"><label>고객사</label><input id="psCustomer" placeholder="전체"></div>
  <div class="ps-field"><label>작업지시번호</label><input id="psWork" placeholder="전체"></div>
  <div class="ps-field"><label>제품명</label><input id="psProduct" placeholder="전체"></div>
  <div class="ps-field"><label>생산 LOT</label><input id="psLot" placeholder="전체"></div>
  <div class="ps-field"><label>진행상태</label><select id="psStatus"><option value="">전체</option><option>생산중</option><option>완료</option><option>대기</option><option>품질보류</option></select></div>
  <div class="ps-filter-actions"><button class="ps-btn" id="psReset">조건 지우기</button><button class="ps-btn primary" id="psSearch">조회</button></div>
</div>
<div class="ps-wrap">
  <div class="ps-layout">
    <section class="ps-panel">
      <div class="ps-panel-head"><b>오늘 작업지시</b><small id="psJobCount">0건</small></div>
      <div class="ps-panel-body"><div class="ps-jobs" id="psJobs"></div></div>
    </section>

    <section class="ps-panel">
      <div class="ps-panel-head"><b>선택 작업 상세</b><small id="psSelectedWork">-</small></div>
      <div class="ps-panel-body" id="psDetail"></div>
    </section>

    <section class="ps-panel">
      <div class="ps-panel-head"><b>차단 / 조치</b><small>품질 Gate</small></div>
      <div class="ps-panel-body"><div class="ps-actions-list" id="psQuality"></div></div>
    </section>
  </div>

  <div class="ps-bottom">
    <section class="ps-panel">
      <div class="ps-bottom-toolbar">
        <strong>▸ 생산현황</strong>
        <div class="ps-bottom-tools">
          <button type="button" id="psBottomReset">조건 지우기</button>
          <button type="button" id="psBottomSearch" class="ps-icon-btn" title="조회" aria-label="조회">⌕</button>
          <button type="button" id="psBottomCollapse" class="ps-icon-btn" title="접기" aria-label="접기">⌃</button>
        </div>
      </div>
      <div class="ps-table-wrap" id="psTableWrap">
        <table>
          <thead><tr><th>No.</th><th>작업일자</th><th>작업지시번호</th><th>고객사</th><th>제품명</th><th>생산 LOT</th><th>설비명</th><th>작업자</th><th>계획수량</th><th>실적수량</th><th>달성률</th><th>PQC</th><th>OQC</th><th>진행상태</th></tr></thead>
          <tbody id="psRows"></tbody>
        </table>
      </div>
      <div class="ps-pagination" id="psPages"></div>
    </section>
  </div>
  <div class="ps-error" id="psError"></div>
</div>`;

  var host=document.querySelector('#work')?.parentElement||document.querySelector('main')||document.body;
  host.appendChild(panel);

  var state={all:[],filtered:[],selected:null,iqc:[],pqc:[],oqc:[],holds:[],page:1};
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var clean=function(v){return String(v==null?'':v).trim();};
  var num=function(v){if(v==null||v==='')return null;var n=Number(String(v).replace(/[^0-9.+-]/g,''));return Number.isFinite(n)?n:null;};
  var val=function(o,keys){for(var i=0;i<keys.length;i++){var k=keys[i];if(o&&o[k]!=null&&o[k]!=='')return o[k];if(o&&o.fields&&o.fields[k]!=null&&o.fields[k]!=='')return o.fields[k];}return '';};
  var fmt=function(v){return v==null?'-':Number(v).toLocaleString('ko-KR',{maximumFractionDigits:3});};
  var norm=function(v){return clean(v).toUpperCase();};
  var isFail=function(v){return /불합격|부적합|FAIL|NG/.test(norm(v));};
  var isPass=function(v){return /합격|적합|PASS|OK|정상/.test(norm(v));};
  var getLot=function(o){return clean(val(o,['lotNo','productionLot','productionLotNo','생산 LOT NO','생산LOT','lot']));};
  var getWork=function(o){return clean(val(o,['workNo','workOrderNo','작업지시번호','workOrder']))||clean(o&&o.id);};
  var getStatus=function(o){return clean(val(o,['status','진행상태','작업상태']))||'대기';};

  function inspect(row){
    if(!row)return '대기';
    var values=[row.judge,row.overall,row.finalJudge,row.inspectionDecision,row.result,row.status];
    try{
      var items=typeof row.items_json==='string'?JSON.parse(row.items_json):row.items_json||row.items||[];
      if(Array.isArray(items))items.forEach(function(x){values.push(x&&x.judge,x&&x.value,x&&x.result);});
    }catch(_){}
    if(values.some(isFail))return '불합격';
    if(values.some(isPass))return '합격';
    return '대기';
  }

  function inspectionFor(rows,lot,work){
    lot=norm(lot);work=norm(work);
    var matches=(rows||[]).filter(function(r){
      var candidates=[r.lot,r.lotNo,r.productionLot,r.productionLotNo,r.finishedLot,r.workOrder,r.workNo,r.workOrderNo,r['생산 LOT NO'],r['작업지시번호']].map(norm);
      return (lot&&candidates.includes(lot))||(work&&candidates.includes(work));
    });
    if(!matches.length)return '대기';
    if(matches.some(function(r){return inspect(r)==='불합격';}))return '불합격';
    if(matches.some(function(r){return inspect(r)==='합격';}))return '합격';
    return '대기';
  }

  function holdFor(lot){
    lot=norm(lot);
    return state.holds.find(function(h){return norm(h.lot)===lot&&!h.released_at;});
  }

  function model(o){
    var plan=num(val(o,['plannedQty','planQty','계획수량(kg)','계획수량','plan']));
    var actual=num(val(o,['actualQty','producedQty','productionQty','실제생산수량','생산수량(kg)','생산수량','actual']));
    var good=num(val(o,['goodQty','양품수량','양품']));
    var bad=num(val(o,['badQty','defectQty','불량수량','불량']));
    var lot=getLot(o),work=getWork(o),status=getStatus(o);
    var pqc=inspectionFor(state.pqc,lot,work),oqc=inspectionFor(state.oqc,lot,work),iqc=inspectionFor(state.iqc,lot,work);
    var hold=holdFor(lot);
    var blocked=!!hold||pqc==='불합격'||oqc==='불합격';
    if(blocked&&!/완료/.test(status))status='품질보류';
    return {
      raw:o,work:work,lot:lot||work,customer:clean(val(o,['customer','고객사']))||'-',
      product:clean(val(o,['productName','product','제품명']))||'-',
      equipment:clean(val(o,['equipment','equipmentName','설비명']))||'-',
      worker:clean(val(o,['worker','작업자']))||'-',
      date:clean(val(o,['workDate','작업일자','작업기간','date'])).slice(0,10)||'-',
      plan:plan,actual:actual,good:good,bad:bad,status:status,iqc:iqc,pqc:pqc,oqc:oqc,hold:hold,blocked:blocked
    };
  }

  function badge(text){
    var cls=isFail(text)||/차단|보류/.test(text)?'ng':isPass(text)||/완료/.test(text)?'ok':/생산중|진행/.test(text)?'run':'wait';
    return '<span class="ps-badge '+cls+'">'+esc(text||'-')+'</span>';
  }

  function filter(){
    var customer=norm(document.getElementById('psCustomer').value);
    var work=norm(document.getElementById('psWork').value);
    var product=norm(document.getElementById('psProduct').value);
    var lot=norm(document.getElementById('psLot').value);
    var status=norm(document.getElementById('psStatus').value);
    state.filtered=state.all.map(model).filter(function(r){
      return (!customer||norm(r.customer).includes(customer))&&(!work||norm(r.work).includes(work))&&(!product||norm(r.product).includes(product))&&(!lot||norm(r.lot).includes(lot))&&(!status||norm(r.status).includes(status));
    });
    if(!state.selected||!state.filtered.some(function(r){return r.work===state.selected.work;}))state.selected=state.filtered[0]||null;
    render();
  }

  function renderJobs(){
    document.getElementById('psJobCount').textContent=state.filtered.length+'건';
    var jobs=document.getElementById('psJobs');
    jobs.innerHTML=state.filtered.slice(0,20).map(function(r){
      var active=state.selected&&state.selected.work===r.work?' active':'';
      return '<div class="ps-job'+active+'" data-work="'+esc(r.work)+'"><div class="ps-job-top"><b>'+esc(r.work||'-')+'</b><span>'+esc(r.customer)+'</span></div><p>'+esc(r.product)+' · '+esc(r.lot)+' · '+esc(r.equipment)+'</p><div class="ps-job-foot"><span>'+esc(fmt(r.plan))+' kg</span>'+badge(r.status)+'</div></div>';
    }).join('')||'<div style="font-size:10px;color:#8a99aa;padding:10px">조회된 작업지시가 없습니다.</div>';
  }

  function renderDetail(){
    var root=document.getElementById('psDetail'),r=state.selected;
    document.getElementById('psSelectedWork').textContent=r?r.work:'-';
    if(!r){root.innerHTML='<div style="padding:30px;text-align:center;color:#8a99aa;font-size:11px">작업지시를 선택하세요.</div>';return;}
    var rate=r.plan>0&&r.actual!=null?Math.max(0,Math.min(100,r.actual/r.plan*100)):0;
    var good=r.good!=null?r.good:(r.actual!=null&&r.bad!=null?r.actual-r.bad:null);
    var bad=r.bad!=null?r.bad:(r.actual!=null&&good!=null?r.actual-good:null);
    var pqcClass=r.pqc==='불합격'?'bad':r.pqc==='합격'?'good':'wait';
    var oqcClass=r.oqc==='불합격'?'bad':r.oqc==='합격'?'good':'wait';
    root.innerHTML=
      '<div class="ps-detail-title"><div><h3>'+esc(r.lot||'-')+'</h3><p>'+esc(r.product)+' · '+esc(r.customer)+'</p></div>'+badge(r.status)+'</div>'+
      '<div class="ps-info-grid"><div class="ps-info"><span>설비명</span><b>'+esc(r.equipment)+'</b></div><div class="ps-info"><span>작업자</span><b>'+esc(r.worker)+'</b></div><div class="ps-info"><span>작업일자</span><b>'+esc(r.date)+'</b></div><div class="ps-info"><span>계획수량</span><b>'+esc(fmt(r.plan))+' kg</b></div></div>'+
      '<div class="ps-progress"><div class="ps-progress-top"><span>생산 진행률</span><b>'+rate.toFixed(1)+'%</b></div><div class="ps-bar"><i style="width:'+rate+'%"></i></div><div class="ps-metrics"><div class="ps-metric"><span>실적수량</span><b>'+esc(fmt(r.actual))+' kg</b></div><div class="ps-metric"><span>양품수량</span><b>'+esc(fmt(good))+' kg</b></div><div class="ps-metric"><span>불량수량</span><b>'+esc(fmt(bad))+' kg</b></div></div></div>'+
      '<div class="ps-route-wrap"><div class="ps-route-title">공정 진행 상태</div><div class="ps-route">'+
      '<div class="ps-node '+(r.iqc==='불합격'?'bad':r.iqc==='합격'?'good':'wait')+'"><span>IQC</span><b>'+esc(r.iqc)+'</b></div>'+
      '<div class="ps-node '+(r.iqc==='불합격'?'lock':'good')+'"><span>원료투입</span><b>'+(r.iqc==='불합격'?'차단':'가능')+'</b></div>'+
      '<div class="ps-node '+(/생산중|진행/.test(r.status)?'active':r.blocked?'lock':'good')+'"><span>생산</span><b>'+esc(r.blocked?'보류':r.status)+'</b></div>'+
      '<div class="ps-node '+pqcClass+'"><span>PQC</span><b>'+esc(r.pqc)+'</b></div>'+
      '<div class="ps-node '+oqcClass+'"><span>OQC</span><b>'+esc(r.oqc)+'</b></div>'+
      '<div class="ps-node '+(r.oqc==='합격'&&!r.hold?'good':'lock')+'"><span>출하</span><b>'+(r.oqc==='합격'&&!r.hold?'가능':'대기')+'</b></div>'+
      '</div></div>'+
      '<div class="ps-log"><div class="ps-log-head">작업 연결정보</div><div class="ps-log-row"><span>작업지시</span><b>'+esc(r.work)+'</b><p>생산 LOT '+esc(r.lot)+'</p></div><div class="ps-log-row"><span>품질상태</span><b>PQC '+esc(r.pqc)+'</b><p>OQC '+esc(r.oqc)+'</p></div><div class="ps-log-row"><span>LOT Gate</span><b>'+(r.hold?'차단 중':'정상')+'</b><p>'+esc(r.hold&&r.hold.reason||'등록된 품질 보류 없음')+'</p></div></div>';
  }

  function renderQuality(){
    var q=document.getElementById('psQuality');
    var pqcBlocks=state.filtered.filter(function(r){return r.pqc==='불합격';});
    var oqcBlocks=state.filtered.filter(function(r){return r.oqc==='불합격';});
    var holds=state.filtered.filter(function(r){return r.hold;});
    q.innerHTML=
      '<div class="ps-action green"><div class="ps-action-top"><b>IQC</b><strong style="color:#49a36f">생산 투입 Gate</strong></div><p>IQC 불합격 원료는 생산 투입을 차단합니다.</p></div>'+
      '<div class="ps-action red"><div class="ps-action-top"><b>PQC 차단</b><strong style="color:#e06b67">'+pqcBlocks.length+'건</strong></div><p>'+(pqcBlocks.length?esc(pqcBlocks.slice(0,2).map(function(r){return r.lot;}).join(', '))+' 후속공정 차단':'현재 PQC 불합격 LOT 없음')+'</p></div>'+
      '<div class="ps-action red"><div class="ps-action-top"><b>OQC 차단</b><strong style="color:#e06b67">'+oqcBlocks.length+'건</strong></div><p>'+(oqcBlocks.length?esc(oqcBlocks.slice(0,2).map(function(r){return r.lot;}).join(', '))+' 출하 차단':'현재 OQC 불합격 LOT 없음')+'</p></div>'+
      '<div class="ps-action amber"><div class="ps-action-top"><b>품질 보류 / NCR</b><strong style="color:#d4a33b">'+holds.length+'건</strong></div><p>품질 보류 LOT는 별도 해제 승인 전까지 처리 차단을 유지합니다.</p></div>'+
      '<div class="ps-action blue"><div style="font-size:7.5px;color:#5d7ea0;font-weight:900">NEXT ACTION</div><b style="display:block;margin-top:5px;font-size:12px;color:#205489">'+(pqcBlocks[0]?esc(pqcBlocks[0].lot)+' 원인조사 및 재검사':oqcBlocks[0]?esc(oqcBlocks[0].lot)+' OQC 재검사':'현재 긴급 조치 없음')+'</b><p>'+(pqcBlocks[0]?'PQC 불합격 → 원인조사 → 시정조치 → 재검사 → 품질 승인 후 해제':oqcBlocks[0]?'OQC 불합격 → 출하 차단 → 재검사 → 승인':'모든 품질 Gate가 정상입니다.')+'</p></div>';
  }

  function renderTable(){
    var body=document.getElementById('psRows');
    var pages=document.getElementById('psPages');
    var pageSize=10,totalPages=Math.max(1,Math.ceil(state.filtered.length/pageSize));
    if(state.page>totalPages)state.page=totalPages;
    var start=(state.page-1)*pageSize,shown=state.filtered.slice(start,start+pageSize);
    body.innerHTML=shown.map(function(r,i){
      var rate=r.plan>0&&r.actual!=null?(r.actual/r.plan*100).toFixed(1)+'%':'-';
      return '<tr><td>'+(start+i+1)+'</td><td>'+esc(r.date)+'</td><td><button class="ps-link" data-work="'+esc(r.work)+'">'+esc(r.work)+'</button></td><td>'+esc(r.customer)+'</td><td>'+esc(r.product)+'</td><td>'+esc(r.lot)+'</td><td>'+esc(r.equipment)+'</td><td>'+esc(r.worker)+'</td><td>'+esc(fmt(r.plan))+'</td><td>'+esc(fmt(r.actual))+'</td><td>'+esc(rate)+'</td><td>'+badge(r.pqc)+'</td><td>'+badge(r.oqc)+'</td><td>'+badge(r.status)+'</td></tr>';
    }).join('')||'<tr><td colspan="14">조회 결과가 없습니다.</td></tr>';
    pages.innerHTML='<button type="button" data-page="'+Math.max(1,state.page-1)+'" '+(state.page===1?'disabled':'')+'>‹</button>'+
      Array.from({length:totalPages},function(_,i){var p=i+1;return '<button type="button" data-page="'+p+'" class="'+(p===state.page?'active':'')+'">'+p+'</button>';}).join('')+
      '<button type="button" data-page="'+Math.min(totalPages,state.page+1)+'" '+(state.page===totalPages?'disabled':'')+'>›</button>';
  }

  function render(){renderJobs();renderDetail();renderQuality();renderTable();}

  async function read(url){
    try{
      var res=await fetch(url,{credentials:'same-origin',cache:'no-store'});
      var json=await res.json();
      if(!res.ok||json.success===false)return [];
      return Array.isArray(json.data)?json.data:Array.isArray(json)?json:[];
    }catch(_){return [];}
  }

  async function readHolds(){
    try{
      var res=await fetch('/api/qmes-quality-gate/holds',{credentials:'same-origin',cache:'no-store'});
      var json=await res.json();
      if(!res.ok||json.success===false)return [];
      var data=json.data||json;
      return Array.isArray(data.holds)?data.holds:[];
    }catch(_){return [];}
  }

  async function load(){
    document.getElementById('psError').textContent='';
    try{
      if(window.qmesAuthDataReady&&window.qmesAuthDataReady.wait)await window.qmesAuthDataReady.wait();
      var result=await Promise.all([read('/api/qmes/work-orders'),read('/api/iqc'),read('/api/pqc'),read('/api/oqc'),readHolds()]);
      state.all=result[0];state.iqc=result[1];state.pqc=result[2];state.oqc=result[3];state.holds=result[4];
      filter();
    }catch(e){document.getElementById('psError').textContent='생산현황 조회 실패: '+e.message;}
  }

  function open(){
    document.querySelectorAll('.menu').forEach(function(x){x.classList.remove('active');});
    document.querySelectorAll('.module-page').forEach(function(x){x.classList.remove('active');});
    panel.classList.add('active');menu.classList.add('active');load();
  }
  function close(){panel.classList.remove('active');menu.classList.remove('active');}

  menu.addEventListener('click',function(e){e.stopPropagation();open();});
  document.getElementById('psRefresh').onclick=load;
  document.getElementById('psBottomSearch').onclick=filter;
  document.getElementById('psBottomReset').onclick=function(){['psCustomer','psWork','psProduct','psLot','psStatus'].forEach(function(id){document.getElementById(id).value='';});filter();};
  document.getElementById('psBottomCollapse').onclick=function(){var wrap=document.getElementById('psTableWrap'),pages=document.getElementById('psPages'),hide=!wrap.hidden;wrap.hidden=hide;pages.hidden=hide;this.textContent=hide?'⌄':'⌃';this.title=hide?'펼치기':'접기';};
  document.getElementById('psPages').addEventListener('click',function(e){var b=e.target.closest('[data-page]');if(!b||b.disabled)return;state.page=Number(b.dataset.page)||1;renderTable();});
  document.getElementById('psSearch').onclick=filter;
  document.getElementById('psReset').onclick=function(){['psCustomer','psWork','psProduct','psLot','psStatus'].forEach(function(id){document.getElementById(id).value='';});filter();};
  panel.querySelectorAll('.ps-field input,.ps-field select').forEach(function(el){el.addEventListener('change',filter);});
  document.getElementById('psJobs').addEventListener('click',function(e){var el=e.target.closest('.ps-job');if(!el)return;state.selected=state.filtered.find(function(r){return r.work===el.dataset.work;})||state.selected;render();});
  document.getElementById('psRows').addEventListener('click',function(e){var btn=e.target.closest('[data-work]');if(!btn)return;state.selected=state.filtered.find(function(r){return r.work===btn.dataset.work;})||state.selected;render();panel.scrollIntoView({behavior:'smooth',block:'start'});});
  document.getElementById('psExport').onclick=function(){
    var header=['No.','작업일자','작업지시번호','고객사','제품명','생산 LOT','설비명','작업자','계획수량','실적수량','달성률','PQC','OQC','진행상태'];
    var lines=[header].concat(state.filtered.map(function(r,i){return [i+1,r.date,r.work,r.customer,r.product,r.lot,r.equipment,r.worker,r.plan,r.actual,r.plan>0&&r.actual!=null?(r.actual/r.plan*100).toFixed(1)+'%':'-',r.pqc,r.oqc,r.status];}));
    var csv='\uFEFF'+lines.map(function(row){return row.map(function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}).join(',');}).join('\r\n');
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='NAMO_QMES_생산현황.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
  };
  document.addEventListener('click',function(e){if(panel.classList.contains('active')&&e.target.closest('.menu:not(#namo-production-status-menu)'))close();},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();