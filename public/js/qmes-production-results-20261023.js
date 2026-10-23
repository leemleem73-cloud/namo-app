(function(){
'use strict';
function init(){
 var work=document.querySelector('#sidebar .menu[data-page="work"]');if(!work||document.getElementById('namo-production-result-menu'))return;
 var menu=document.createElement('div');menu.id='namo-production-result-menu';menu.className='menu';menu.innerHTML='<div class="ico">📊</div><div class="label">생산실적 현황</div>';work.insertAdjacentElement('afterend',menu);
 var panel=document.createElement('section');panel.id='namo-production-result-panel';panel.className='module-page';panel.style.cssText='background:#fff;padding:16px 18px;min-height:100%;font-family:inherit';
 panel.innerHTML='<style>#namo-production-result-panel h2{font-size:20px;font-weight:750}#namo-production-result-panel table{border-collapse:collapse!important}#namo-production-result-panel th{background:#e7eff7;color:#163b60;font-size:12px;text-align:center;height:42px;border:1px solid #cbd8e5}#namo-production-result-panel td{font-size:12px;text-align:center;height:44px;border:1px solid #d8e2ed}#namo-production-result-panel tbody tr:nth-child(even){background:#f8fafc}#namo-production-result-panel tbody tr:hover{background:#edf5ff}#namo-production-result-panel #nprSummary{border:1px solid #dce6f1;border-radius:2px!important;color:#24517a;font-weight:600}#namo-production-result-panel #nprSearch{border-radius:3px!important}#namo-production-result-panel #nprRefresh,#namo-production-result-panel #nprClose{border-radius:3px!important}</style><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h2 style="margin:0;color:#183653">생산실적 현황</h2><button id="nprClose" type="button" style="padding:9px 18px;border:1px solid #ccd6e3;border-radius:7px;background:white;cursor:pointer">닫기</button></div><p style="color:#65758b">작업지시서 데이터 기준 · 조회 전용</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin:16px 0"><input id="nprSearch" placeholder="작업지시번호 / 제품명 / LOT 검색" style="flex:1;min-width:240px;padding:12px;border:1px solid #ccd6e3;border-radius:7px"><button id="nprRefresh" style="background:#1769aa;color:white;border:0;border-radius:7px;padding:10px 20px;cursor:pointer">조회</button></div><div id="nprSummary" style="padding:16px;background:white;border-radius:9px;margin-bottom:15px"></div><div style="overflow:auto;background:white;border:1px solid #dce3ef;border-radius:9px"><table style="width:100%;border-collapse:collapse;text-align:left;font-size:13px"><thead><tr style="background:#edf2f8"><th style="padding:12px">No.</th><th>작업지시번호</th><th>제품명</th><th>LOT 번호</th><th>계획수량(kg)</th><th>실제 생산수량(kg)</th><th>달성률</th><th>작업상태</th></tr></thead><tbody id="nprRows"></tbody></table></div><p style="font-size:12px;color:#68788c">실제 생산수량이 저장되지 않은 작업은 미등록으로 표시합니다. 임의 생산실적을 생성하지 않습니다.</p>';
 var host=document.querySelector('#work')?.parentElement||document.querySelector('main')||document.body;host.appendChild(panel);
 var esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 var val=(o,keys)=>{for(var k of keys){if(o[k]!=null&&o[k]!=='')return o[k];if(o.fields&&o.fields[k]!=null&&o.fields[k]!=='')return o.fields[k]}return ''};
 function num(v){if(v===''||v==null)return null;var n=Number(String(v).replace(/,/g,''));return Number.isFinite(n)?n:null}
 async function load(){
  var summary=document.getElementById('nprSummary'),body=document.getElementById('nprRows');summary.textContent='공용 서버에서 조회 중...';
  try{
   if(window.qmesAuthDataReady&&window.qmesAuthDataReady.wait)await window.qmesAuthDataReady.wait();
   var res=await fetch('/api/qmes/work-orders',{credentials:'same-origin',cache:'no-store'});var json=await res.json();if(!res.ok||!json.success)throw Error(json.message||'조회 실패');
   var data=Array.isArray(json.data)?json.data:[];var q=document.getElementById('nprSearch').value.trim().toLowerCase();
   var rows=data.filter(o=>[val(o,['workNo','workOrderNo','작업지시번호']),val(o,['productName','제품명']),val(o,['lotNo','productionLot','생산 LOT NO'])].join(' ').toLowerCase().includes(q));
   var sum=0,count=0;body.innerHTML=rows.map((o,i)=>{
    var planned=num(val(o,['plannedQty','planQty','계획수량(kg)','계획수량']));
    var actual=num(val(o,['actualQty','producedQty','productionQty','실제생산수량','생산수량(kg)','생산수량']));
    if(actual!==null){sum+=actual;count++}
    var cells=[i+1,val(o,['workNo','workOrderNo','작업지시번호'])||o.id||'-',val(o,['productName','제품명'])||'-',val(o,['lotNo','productionLot','생산 LOT NO'])||'-',planned===null?'미등록':planned.toLocaleString(),actual===null?'미등록':actual.toLocaleString(),planned>0&&actual!==null?(actual/planned*100).toFixed(1)+'%':'-',val(o,['status','진행상태'])||'-'];
    return '<tr>'+cells.map((c,j)=>'<td style="padding:10px">'+(j===1?'<button type="button" class="nprWorkLink" style="border:0;background:none;color:#0874c7;text-decoration:underline;font-weight:700;cursor:pointer">'+esc(c)+'</button>':esc(c))+'</td>').join('')+'</tr>';
   }).join('')||'<tr><td colspan="8" style="padding:20px;text-align:center">조회 결과가 없습니다.</td></tr>';
   summary.textContent='작업지시 '+rows.length+'건  |  생산수량 기록 '+count+'건  |  확인된 생산수량 합계 '+sum.toLocaleString()+' kg';
  }catch(e){summary.textContent='조회 실패: '+e.message;body.innerHTML='';}
 }
 function close(){panel.classList.remove('active');menu.classList.remove('active')}
 menu.dataset.page='namo-production-result-panel';menu.addEventListener('click',function(e){e.stopPropagation();document.querySelectorAll('.menu').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.module-page').forEach(x=>x.classList.remove('active'));panel.classList.add('active');menu.classList.add('active');load()});
 document.getElementById('nprRows').addEventListener('click',function(e){if(!e.target.closest('.nprWorkLink'))return;close();document.querySelector('#sidebar .menu[data-page="work"]')?.click();});document.getElementById('nprClose').onclick=close;document.getElementById('nprRefresh').onclick=load;document.getElementById('nprSearch').onkeydown=e=>{if(e.key==='Enter')load()};
 document.addEventListener('click',e=>{if(panel.classList.contains('active')&&e.target.closest('.menu:not(#namo-production-result-menu)'))close()},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();