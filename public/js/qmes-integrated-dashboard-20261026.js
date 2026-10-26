(function(){
'use strict';
if(window.__NAMO_INTEGRATED_DASHBOARD_20261026__)return;
window.__NAMO_INTEGRATED_DASHBOARD_20261026__=true;

function mount(){
 const page=document.getElementById('dashboard');
 if(!page)return;
 page.className='module-page namo-integrated-dashboard';
 page.innerHTML=`
 <style>
 #dashboard{padding:10px 12px 18px!important;background:#f4f7fb!important;color:#173b63!important;overflow:auto}
 #dashboard *{box-sizing:border-box}
 #dashboard .idb-grid{display:grid;gap:10px}
 #dashboard .idb-kpis{grid-template-columns:repeat(6,minmax(0,1fr))}
 #dashboard .idb-card{background:#fff;border:1px solid #dce6f1;border-radius:8px;box-shadow:0 2px 8px rgba(34,67,103,.04)}
 #dashboard .idb-kpi{padding:12px 14px;display:grid;grid-template-columns:1fr 58px;align-items:center;min-height:86px}
 #dashboard .idb-kpi .t{font-size:12px;font-weight:800;color:#173b63}
 #dashboard .idb-kpi .v{font-size:25px;font-weight:900;margin-top:7px}
 #dashboard .idb-kpi small{display:block;color:#8496aa;font-size:10px;margin-top:2px}
 #dashboard .ring{width:48px;height:48px;border-radius:50%;background:conic-gradient(#2f8cf5 var(--p),#e9eff6 0);display:grid;place-items:center}
 #dashboard .ring:after{content:"";width:35px;height:35px;border-radius:50%;background:#fff}
 #dashboard .ring span{position:absolute;font-size:10px;font-weight:800;color:#2f8cf5}
 #dashboard .idb-row2{grid-template-columns:1.15fr .75fr .92fr}
 #dashboard .idb-row3{grid-template-columns:1.25fr .75fr .75fr}
 #dashboard .idb-row4{grid-template-columns:1fr 1fr 1.05fr}
 #dashboard .head{height:40px;padding:0 12px;border-bottom:1px solid #e5edf5;display:flex;align-items:center;justify-content:space-between}
 #dashboard .head b{font-size:13px;color:#163d68;border-left:3px solid #2f8cf5;padding-left:8px}
 #dashboard .body{padding:12px}
 #dashboard .chartbox{height:185px;position:relative}
 #dashboard .linechart{position:absolute;inset:14px 8px 24px 40px;border-left:1px solid #dbe5ef;border-bottom:1px solid #dbe5ef}
 #dashboard .linechart svg{width:100%;height:100%;overflow:visible}
 #dashboard .axis{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-around;font-size:9px;color:#6e8297;padding-left:35px}
 #dashboard .statbox{position:absolute;right:4px;top:16px;width:112px}
 #dashboard .statbox b{display:block;font-size:18px;margin:6px 0 14px;color:#163d68}
 #dashboard .goal{background:#2f8cf5;color:#fff;padding:9px;text-align:center;border-radius:4px;font-weight:800}
 #dashboard .donutwrap{display:grid;grid-template-columns:170px 1fr;align-items:center}
 #dashboard .donut{width:150px;height:150px;border-radius:50%;background:conic-gradient(#2f8cf5 0 42%,#25bf83 42% 70%,#f5aa24 70% 85%,#7a55ed 85% 95%,#a7b2c0 95%);position:relative;display:grid;place-items:center;margin:auto}
 #dashboard .donut:after{content:"";width:92px;height:92px;border-radius:50%;background:#fff}
 #dashboard .donuttext{position:absolute;text-align:center;font-size:10px;z-index:1}.donuttext b{font-size:16px;display:block}
 #dashboard .legend{display:grid;gap:10px;font-size:11px}.legend i{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:7px}
 #dashboard table{width:100%;border-collapse:collapse;font-size:10px}
 #dashboard th{background:#eef4f9;color:#49647f;font-weight:800;padding:7px;border-bottom:1px solid #dce6ef}
 #dashboard td{padding:7px;border-bottom:1px solid #edf2f7;text-align:center;color:#36516d}
 #dashboard .badge{display:inline-block;padding:4px 8px;border-radius:11px;font-size:9px;font-weight:900}
 #dashboard .blue{background:#eaf4ff;color:#237bd4}.green{background:#eaf8f1;color:#2d9a62}.amber{background:#fff3d9;color:#b77d00}.red{background:#ffe9ec;color:#df3349}
 #dashboard .bar{height:8px;background:#e7edf4;border-radius:5px;overflow:hidden}.bar i{display:block;height:100%;background:#2f8cf5}
 #dashboard .equip{display:grid;grid-template-columns:1.15fr .8fr 1.2fr 1fr;gap:8px;align-items:center;font-size:10px;padding:10px 0}
 #dashboard .gate{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
 #dashboard .gate div{border:1px solid #dce6ef;border-radius:6px;padding:10px 5px;text-align:center;min-height:92px}
 #dashboard .gate b{display:block;font-size:11px;margin-bottom:13px}.gate span{font-size:10px}
 #dashboard .detailgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:10px}
 #dashboard .detailgrid div{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eef3f7}
 #dashboard .bars{height:145px;display:flex;align-items:end;gap:16px;padding:10px 12px 0}
 #dashboard .bars .pair{flex:1;display:flex;align-items:end;gap:5px;height:100%}
 #dashboard .bars i{display:block;flex:1;background:#cfd8e3;border-radius:3px 3px 0 0}.bars i.actual{background:#2f8cf5}
 #dashboard .ncrtags{display:flex;gap:8px;margin-bottom:8px}.ncrtags span{padding:5px 12px;border-radius:14px;background:#ffe9ec;color:#df3349;font-size:9px;font-weight:900}
 @media(max-width:1250px){#dashboard .idb-kpis{grid-template-columns:repeat(3,1fr)}#dashboard .idb-row2,#dashboard .idb-row3,#dashboard .idb-row4{grid-template-columns:1fr}}
 </style>
 <div class="idb-grid idb-kpis">
  ${[
   ['오늘 작업지시','26','전체 38건','68%'],
   ['생산량','12','계획 45,000 kg','46%'],
   ['생산완료','10','실적 32,500 kg','35%'],
   ['품질보류','2','23,400 kg','8%'],
   ['PQC 불합격','1','1,200 kg','4%'],
   ['OQC 불합격','1','800 kg','4%']
  ].map((x,i)=>`<div class="idb-card idb-kpi"><div><div class="t">${x[0]}</div><div class="v" style="color:${i>2?'#e32d40':'#173b63'}">${x[1]} <span style="font-size:11px">건</span></div><small>${x[2]}</small></div><div class="ring" style="--p:${x[3]}"><span>${x[3]}</span></div></div>`).join('')}
 </div>
 <div class="idb-grid idb-row2">
  <div class="idb-card"><div class="head"><b>일자별 생산실적 추이 (최근 7일)</b><span style="font-size:10px">7일⌄</span></div><div class="body chartbox">
    <div class="linechart"><svg viewBox="0 0 360 140"><polyline points="5,92 55,70 105,80 155,68 205,48 255,42 315,58" fill="none" stroke="#7bb5f6" stroke-width="3"/><polyline points="5,116 55,94 105,112 155,96 205,72 255,66 315,80" fill="none" stroke="#115fae" stroke-width="3"/></svg></div>
    <div class="axis"><span>10/20</span><span>10/21</span><span>10/22</span><span>10/23</span><span>10/24</span><span>10/25</span><span>10/26</span></div>
    <div class="statbox"><small>누적 계획</small><b>280,000 kg</b><small>누적 실적</small><b>213,500 kg</b><div class="goal">달성률<br>76%</div></div>
  </div></div>
  <div class="idb-card"><div class="head"><b>제품별 생산 비중 (금일 실적)</b><span style="font-size:10px">kg / %</span></div><div class="body donutwrap"><div class="donut"><div class="donuttext">총 실적<b>32,500 kg</b></div></div><div class="legend"><span><i style="background:#2f8cf5"></i>HSM　13,650 kg</span><span><i style="background:#25bf83"></i>DBL　9,100 kg</span><span><i style="background:#f5aa24"></i>DBA　4,900 kg</span><span><i style="background:#7a55ed"></i>SBS　3,250 kg</span><span><i style="background:#a7b2c0"></i>기타　1,600 kg</span></div></div></div>
  <div class="idb-card"><div class="head"><b>설비별 가동 현황 (금일)</b><span style="font-size:10px">실시간⌄</span></div><div class="body"><div class="equip"><b>생산설비 1호기</b><span class="badge green">가동중</span><div><div class="bar"><i style="width:85%"></i></div></div><b>12,500 / 15,000</b></div></div></div>
 </div>
 <div class="idb-grid idb-row3">
  <div class="idb-card"><div class="head"><b>오늘 작업지시 현황 (26건)</b><span style="font-size:10px">전체보기 ›</span></div><div class="body"><table><thead><tr><th>No.</th><th>작업지시번호</th><th>제품명</th><th>LOT 번호</th><th>계획수량</th><th>실적수량</th><th>진행률</th><th>상태</th></tr></thead><tbody>
  ${[['1','WO-20261026-001','HSM','DBL1501','50,000','32,500','65%','생산중'],['2','WO-20261026-002','DBL','DBL25G1','20,000','18,600','93%','생산중'],['3','WO-20261026-003','HSM','HSM2610','15,000','15,000','100%','완료'],['4','WO-20261026-004','SBS','SBS2610','10,000','0','0%','대기'],['5','WO-20261026-005','DBA','DBA2610','8,000','0','0%','품질보류']].map(r=>`<tr>${r.map((v,i)=>`<td>${i===7?'<span class="badge '+(v==='완료'?'green':v==='대기'?'amber':v==='품질보류'?'red':'blue')+'">'+v+'</span>':v}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div></div>
  <div class="idb-card"><div class="head"><b>선택 작업 상세</b><span style="font-size:9px">WO-20261026-001</span></div><div class="body detailgrid"><div><span>제품명</span><b>HSM</b></div><div><span>작업구분</span><b>대체 원료, 동일 공정</b></div><div><span>LOT 번호</span><b>DBL1501</b></div><div><span>작업일자</span><b>2026-10-26</b></div><div><span>계획수량</span><b>50,000 kg</b></div><div><span>설비명</span><b>설산 1호기</b></div><div><span>실적수량</span><b>32,500 kg</b></div><div><span>현재상태</span><span class="badge blue">생산중</span></div><div><span>진행률</span><b>65%</b></div><div><span>예상종료</span><b>2026-10-26 15:00</b></div></div></div>
  <div class="idb-card"><div class="head"><b>품질 Gate 상태</b><span style="font-size:10px">상세보기 ›</span></div><div class="body gate"><div style="border-color:#8ee0bd"><b style="color:#279566">IQC</b><span>완료<br>10/26 08:10</span></div><div style="border-color:#8ee0bd"><b style="color:#279566">원료투입</b><span>완료<br>10/26 08:30</span></div><div style="border-color:#6eb3ff"><b style="color:#2f8cf5">생산</b><span>진행<br>65%</span></div><div style="border-color:#f2c36b"><b style="color:#bf861d">PQC</b><span>대기<br>-</span></div><div><b>OQC</b><span>대기<br>-</span></div><div><b>출하</b><span>대기<br>-</span></div></div></div>
 </div>
 <div class="idb-grid idb-row4">
   <div class="idb-card"><div class="head"><b>공정별 생산실적 (금일)</b><span style="font-size:10px">계획수량　실적수량</span></div><div class="body"><div class="bars">${[['45','32'],['40','31'],['35','24'],['30','22'],['30','18']].map(x=>`<div class="pair"><i style="height:${x[0]*2}px"></i><i class="actual" style="height:${x[1]*2}px"></i></div>`).join('')}</div></div></div>
   <div class="idb-card"><div class="head"><b>제품별 생산실적 (금일)</b><span style="font-size:10px">계획수량　실적수량</span></div><div class="body"><div class="bars">${[['15','13.6'],['12','9.1'],['8','4.9'],['5','3.2'],['2','1.6']].map(x=>`<div class="pair"><i style="height:${x[0]*7}px"></i><i class="actual" style="height:${x[1]*7}px"></i></div>`).join('')}</div></div></div>
   <div class="idb-card"><div class="head"><b>품질보류 / 불합격 / NCR (금일)</b></div><div class="body"><div class="ncrtags"><span>품질보류　2</span><span>PQC 불합격　1</span><span>OQC 불합격　1</span></div><table><thead><tr><th>No.</th><th>작업지시번호</th><th>내용</th><th>수량(kg)</th><th>발생시간</th></tr></thead><tbody><tr><td>1</td><td>WO-20261026-005</td><td>원료 투입 품질 기준 이탈</td><td>23,400</td><td>10/26 09:20</td></tr><tr><td>2</td><td>WO-20261026-003</td><td>PQC 외관 불량</td><td>1,200</td><td>10/26 11:40</td></tr></tbody></table></div></div>
 </div>`;
}
function openDashboard(){
 const menu=document.querySelector('#sidebar .menu[data-page="dashboard"]');
 const page=document.getElementById('dashboard');
 if(!menu||!page)return;
 document.querySelectorAll('.menu').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll('.module-page').forEach(x=>x.classList.remove('active'));
 menu.classList.add('active');page.classList.add('active');
}
function wire(){
 mount();
 const menu=document.querySelector('#sidebar .menu[data-page="dashboard"]');
 if(menu&&menu.dataset.integratedDashWired!=='1'){
  menu.dataset.integratedDashWired='1';
  menu.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();openDashboard();},true);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();