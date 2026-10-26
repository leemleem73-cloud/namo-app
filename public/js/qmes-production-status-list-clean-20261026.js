(function(){
'use strict';
if(window.__NAMO_PRODUCTION_STATUS_LIST_20261026__)return;
window.__NAMO_PRODUCTION_STATUS_LIST_20261026__=true;

function init(){
  document.querySelectorAll('#namo-production-status-menu,#namo-production-status-panel,#namo-production-result-menu,#namo-production-result-panel').forEach(function(el){el.remove();});
  var work=document.querySelector('#sidebar .menu[data-page="work"]');
  if(!work)return;

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
#namo-production-status-panel{padding:0!important;background:#f5f7fa!important;font-family:inherit;color:#33485f}
#namo-production-status-panel *{box-sizing:border-box}
#namo-production-status-panel .nps-head{height:64px;background:#fff;border-bottom:1px solid #dbe4ee;display:flex;align-items:center;justify-content:space-between;padding:0 18px}
#namo-production-status-panel .nps-head h2{margin:0;font-size:18px;color:#173f66;border-left:3px solid #1676c5;padding-left:10px}
#namo-production-status-panel .nps-actions{display:flex;gap:7px}
#namo-production-status-panel button{font:inherit;cursor:pointer}
#namo-production-status-panel .nps-btn{height:34px;border:1px solid #ccd8e5;background:#fff;color:#315978;border-radius:5px;padding:0 12px;font-size:10px;font-weight:800}
#namo-production-status-panel .nps-filter{background:#eef4fa;border-bottom:1px solid #dbe4ee;padding:11px 14px;display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:12px}
#namo-production-status-panel .nps-field{display:flex;align-items:center;gap:8px}
#namo-production-status-panel .nps-field label{font-size:10px;font-weight:800;color:#49637c;white-space:nowrap}
#namo-production-status-panel .nps-field input,#namo-production-status-panel .nps-field select{height:32px;min-width:0;flex:1;border:1px solid #cbd8e6;background:#fff;border-radius:4px;padding:0 9px;color:#3d5368;font-size:10px}
#namo-production-status-panel .nps-wrap{padding:12px}
#namo-production-status-panel .nps-card{background:#fff;border:1px solid #dbe4ee;border-radius:7px;overflow:hidden}
#namo-production-status-panel .nps-toolbar{height:44px;padding:0 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dbe4ee}
#namo-production-status-panel .nps-toolbar strong{font-size:11px;color:#254b6c}
#namo-production-status-panel .nps-tools{display:flex;gap:6px}
#namo-production-status-panel .nps-tools button{height:30px;border:1px solid #d0dbe7;background:#fff;color:#506980;border-radius:5px;padding:0 10px;font-size:9px;font-weight:800}
#namo-production-status-panel .nps-tools .icon{width:32px;padding:0;font-size:15px}
#namo-production-status-panel .nps-table-wrap{overflow:auto}
#namo-production-status-panel table{border-collapse:collapse;width:100%;min-width:1320px;font-size:10px}
#namo-production-status-panel th{background:#e9f0f7;color:#284d6a;border:1px solid #cdd9e5;padding:10px 7px;text-align:center;white-space:nowrap}
#namo-production-status-panel td{border:1px solid #d9e2eb;padding:10px 7px;text-align:center;color:#42576a;white-space:nowrap;background:#fff}
#namo-production-status-panel tbody tr:nth-child(even) td{background:#fbfcfe}
#namo-production-status-panel tbody tr:hover td{background:#f2f7fc}
#namo-production-status-panel .link{border:0;background:none;color:#0874c7;text-decoration:underline;padding:0;font-weight:800}
#namo-production-status-panel .badge{display:inline-block;padding:4px 8px;border-radius:12px;font-size:8px;font-weight:900}
#namo-production-status-panel .badge.ok{background:#eaf7ef;color:#33845a}
#namo-production-status-panel .badge.wait{background:#fff4dc;color:#a87600}
#namo-production-status-panel .badge.run{background:#e9f3ff;color:#2871b3}
#namo-production-status-panel .badge.ng{background:#fdeaea;color:#bd4b4b}
#namo-production-status-panel .nps-pages{display:flex;justify-content:center;gap:5px;padding:16px}
#namo-production-status-panel .nps-pages button{width:30px;height:30px;border:1px solid #d0dbe7;background:#fff;border-radius:5px;color:#526b83;font-size:10px;font-weight:800}
#namo-production-status-panel .nps-pages button.active{background:#2e7bd0;color:#fff;border-color:#2e7bd0}
#namo-production-status-panel .nps-pages button:disabled{opacity:.35;cursor:default}
#namo-production-status-panel .nps-empty{padding:35px;text-align:center;color:#8a99aa}
#namo-production-status-panel .nps-error{padding:10px 14px;color:#b42318;font-size:10px}
@media(max-width:1200px){#namo-production-status-panel .nps-filter{grid-template-columns:repeat(2,1fr)}}
</style>

<div class="nps-head">
  <h2>생산현황</h2>
  <div class="nps-actions"><button class="nps-btn" id="npsExport">엑셀 내보내기</button></div>
</div>

<div class="nps-filter">
  <div class="nps-field"><label>고객사</label><input id="npsCustomer" placeholder="전체"></div>
  <div class="nps-field"><label>작업지시번호</label><input id="npsWork" placeholder="전체"></div>
  <div class="nps-field"><label>제품명</label><input id="npsProduct" placeholder="전체"></div>
  <div class="nps-field"><label>생산 LOT</label><input id="npsLot" placeholder="전체"></div>
  <div class="nps-field"><label>진행상태</label><select id="npsStatus"><option value="">전체</option><option>대기</option><option>생산중</option><option>완료</option><option>품질보류</option></select></div>
</div>

<div class="nps-wrap">
  <section class="nps-card">
    <div class="nps-toolbar">
      <strong>▸ 생산현황 <span id="npsCount"></span></strong>
      <div class="nps-tools">
        <button type="button" id="npsReset">조건 지우기</button>
        <button type="button" id="npsSearch" class="icon" title="조회" aria-label="조회">⌕</button>
        <button type="button" id="npsCollapse" class="icon" title="접기" aria-label="접기">⌃</button>
      </div>
    </div>
    <div class="nps-table-wrap" id="npsTableWrap">
      <table>
        <thead>
          <tr><th>No.</th><th>작업일자</th><th>작업지시번호</th><th>고객사</th><th>제품명</th><th>생산 LOT</th><th>설비명</th><th>작업자</th><th>계획수량</th><th>실적수량</th><th>달성률</th><th>PQC</th><th>OQC</th><th>진행상태</th></tr>
        </thead>
        <tbody id="npsRows"></tbody>
      </table>
    </div>
    <div class="nps-pages" id="npsPages"></div>
  </section>
  <div class="nps-error" id="npsError"></div>
</div>`;

  var host=document.querySelector('#work')?.parentElement||document.querySelector('main')||document.body;
  host.appendChild(panel);

  var state={orders:[],pqc:[],oqc:[],filtered:[],page:1};
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var clean=function(v){return String(v==null?'':v).trim();};
  var norm=function(v){return clean(v).toUpperCase();};
  var val=function(o,keys){for(var i=0;i<keys.length;i++){var k=keys[i];if(o&&o[k]!=null&&o[k]!=='')return o[k];if(o&&o.fields&&o.fields[k]!=null&&o.fields[k]!=='')return o.fields[k];}return '';};
  var num=function(v){if(v==null||v==='')return null;var n=Number(String(v).replace(/[^0-9.+-]/g,''));return Number.isFinite(n)?n:null;};
  var fmt=function(v){return v==null?'-':Number(v).toLocaleString('ko-KR',{maximumFractionDigits:3});};
  var isFail=function(v){return /불합격|부적합|FAIL|NG/.test(norm(v));};
  var isPass=function(v){return /합격|적합|PASS|OK|정상/.test(norm(v));};

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
    var L=norm(lot),W=norm(work),matches=(rows||[]).filter(function(r){
      var arr=[r.lot,r.lotNo,r.productionLot,r.productionLotNo,r.finishedLot,r.workOrder,r.workNo,r.workOrderNo,r['생산 LOT NO'],r['작업지시번호']].map(norm);
      return (L&&arr.includes(L))||(W&&arr.includes(W));
    });
    if(!matches.length)return '대기';
    if(matches.some(function(r){return inspect(r)==='불합격';}))return '불합격';
    if(matches.some(function(r){return inspect(r)==='합격';}))return '합격';
    return '대기';
  }

  function model(o){
    var work=clean(val(o,['workNo','workOrderNo','작업지시번호','workOrder']))||clean(o&&o.id);
    var lot=clean(val(o,['lotNo','productionLot','productionLotNo','생산 LOT NO','생산LOT','lot']))||work;
    var plan=num(val(o,['plannedQty','planQty','계획수량(kg)','계획수량','plan']));
    var actual=num(val(o,['actualQty','producedQty','productionQty','실제생산수량','생산수량(kg)','생산수량','actual']));
    var pqc=inspectionFor(state.pqc,lot,work),oqc=inspectionFor(state.oqc,lot,work);
    var status=clean(val(o,['status','진행상태','작업상태']))||'대기';
    if((pqc==='불합격'||oqc==='불합격')&&!/완료/.test(status))status='품질보류';
    return {
      work:work,lot:lot,
      date:clean(val(o,['workDate','작업일자','작업기간','date'])).slice(0,10)||'-',
      customer:clean(val(o,['customer','고객사']))||'-',
      product:clean(val(o,['productName','product','제품명']))||'-',
      equipment:clean(val(o,['equipment','equipmentName','설비명']))||'-',
      worker:clean(val(o,['worker','작업자']))||'-',
      plan:plan,actual:actual,pqc:pqc,oqc:oqc,status:status
    };
  }

  function badge(v){
    var cls=isFail(v)||/보류|차단/.test(v)?'ng':isPass(v)||/완료/.test(v)?'ok':/생산중|진행/.test(v)?'run':'wait';
    return '<span class="badge '+cls+'">'+esc(v||'-')+'</span>';
  }

  function apply(){
    var c=norm(document.getElementById('npsCustomer').value),
        w=norm(document.getElementById('npsWork').value),
        p=norm(document.getElementById('npsProduct').value),
        l=norm(document.getElementById('npsLot').value),
        s=norm(document.getElementById('npsStatus').value);
    state.filtered=state.orders.map(model).filter(function(r){
      return (!c||norm(r.customer).includes(c))&&(!w||norm(r.work).includes(w))&&(!p||norm(r.product).includes(p))&&(!l||norm(r.lot).includes(l))&&(!s||norm(r.status).includes(s));
    });
    state.page=1;
    draw();
  }

  function draw(){
    var pageSize=10,total=Math.max(1,Math.ceil(state.filtered.length/pageSize));
    if(state.page>total)state.page=total;
    var start=(state.page-1)*pageSize,shown=state.filtered.slice(start,start+pageSize);
    document.getElementById('npsCount').textContent='('+state.filtered.length+'건)';
    document.getElementById('npsRows').innerHTML=shown.map(function(r,i){
      var rate=r.plan>0&&r.actual!=null?(r.actual/r.plan*100).toFixed(1)+'%':'-';
      return '<tr><td>'+(start+i+1)+'</td><td>'+esc(r.date)+'</td><td><button class="link" data-work="'+esc(r.work)+'">'+esc(r.work)+'</button></td><td>'+esc(r.customer)+'</td><td>'+esc(r.product)+'</td><td>'+esc(r.lot)+'</td><td>'+esc(r.equipment)+'</td><td>'+esc(r.worker)+'</td><td>'+esc(fmt(r.plan))+'</td><td>'+esc(fmt(r.actual))+'</td><td>'+esc(rate)+'</td><td>'+badge(r.pqc)+'</td><td>'+badge(r.oqc)+'</td><td>'+badge(r.status)+'</td></tr>';
    }).join('')||'<tr><td colspan="14" class="nps-empty">조회 결과가 없습니다.</td></tr>';
    document.getElementById('npsPages').innerHTML='<button data-page="'+Math.max(1,state.page-1)+'" '+(state.page===1?'disabled':'')+'>‹</button>'+
      Array.from({length:total},function(_,i){var n=i+1;return '<button data-page="'+n+'" class="'+(n===state.page?'active':'')+'">'+n+'</button>';}).join('')+
      '<button data-page="'+Math.min(total,state.page+1)+'" '+(state.page===total?'disabled':'')+'>›</button>';
  }

  async function read(url){
    try{
      var res=await fetch(url,{credentials:'same-origin',cache:'no-store'});
      var json=await res.json();
      if(!res.ok||json.success===false)return [];
      return Array.isArray(json.data)?json.data:Array.isArray(json)?json:[];
    }catch(_){return [];}
  }

  async function load(){
    document.getElementById('npsError').textContent='';
    try{
      if(window.qmesAuthDataReady&&window.qmesAuthDataReady.wait)await window.qmesAuthDataReady.wait();
      var a=await Promise.all([read('/api/qmes/work-orders'),read('/api/pqc'),read('/api/oqc')]);
      state.orders=a[0];state.pqc=a[1];state.oqc=a[2];apply();
    }catch(e){document.getElementById('npsError').textContent='생산현황 조회 실패: '+e.message;}
  }

  function open(){
    document.querySelectorAll('.menu').forEach(function(x){x.classList.remove('active');});
    document.querySelectorAll('.module-page').forEach(function(x){x.classList.remove('active');});
    panel.classList.add('active');menu.classList.add('active');load();
  }
  function close(){panel.classList.remove('active');menu.classList.remove('active');}

  menu.addEventListener('click',function(e){e.stopPropagation();open();});
  document.getElementById('npsSearch').onclick=apply;
  document.getElementById('npsReset').onclick=function(){['npsCustomer','npsWork','npsProduct','npsLot','npsStatus'].forEach(function(id){document.getElementById(id).value='';});apply();};
  document.getElementById('npsCollapse').onclick=function(){var w=document.getElementById('npsTableWrap'),p=document.getElementById('npsPages'),hide=!w.hidden;w.hidden=hide;p.hidden=hide;this.textContent=hide?'⌄':'⌃';this.title=hide?'펼치기':'접기';};
  document.getElementById('npsPages').addEventListener('click',function(e){var b=e.target.closest('[data-page]');if(!b||b.disabled)return;state.page=Number(b.dataset.page)||1;draw();});
  panel.querySelectorAll('.nps-field input,.nps-field select').forEach(function(el){el.addEventListener('change',apply);});
  document.getElementById('npsRows').addEventListener('click',function(e){var b=e.target.closest('[data-work]');if(!b)return;close();document.querySelector('#sidebar .menu[data-page="work"]')?.click();});
  document.getElementById('npsExport').onclick=function(){
    var h=['No.','작업일자','작업지시번호','고객사','제품명','생산 LOT','설비명','작업자','계획수량','실적수량','달성률','PQC','OQC','진행상태'];
    var lines=[h].concat(state.filtered.map(function(r,i){return [i+1,r.date,r.work,r.customer,r.product,r.lot,r.equipment,r.worker,r.plan,r.actual,r.plan>0&&r.actual!=null?(r.actual/r.plan*100).toFixed(1)+'%':'-',r.pqc,r.oqc,r.status];}));
    var csv='\uFEFF'+lines.map(function(row){return row.map(function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}).join(',');}).join('\r\n');
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='NAMO_QMES_생산현황.csv';a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
  };
  document.addEventListener('click',function(e){if(panel.classList.contains('active')&&e.target.closest('.menu:not(#namo-production-status-menu)'))close();},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();