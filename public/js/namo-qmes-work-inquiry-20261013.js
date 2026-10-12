/* QMES work order enhanced inquiry, additive and read-only; existing create/edit/delete/API unchanged. */
(function(){
'use strict';
if(window.__namoWorkInquiry20261013)return;
window.__namoWorkInquiry20261013=true;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels=['고객사','제품명','생산 LOT','진행상태','시작일자','종료일자','작업지시번호','설비명'];
const indices=[2,3,4,9,8,8,1,5];
function init(){
 const section=document.getElementById('work');
 if(!section)return;
 const shell=section.querySelector('.module-shell'),tbody=shell?.querySelector('.work-list-table tbody');
 if(!shell||!tbody||section.querySelector('#namo-work-inquiry'))return;
 const style=document.createElement('style');
 style.textContent='#namo-work-inquiry{padding:13px 15px;background:#fff;border-bottom:1px solid #dce3ec}#namo-work-inquiry .nwi-grid{display:grid;grid-template-columns:repeat(4,minmax(155px,1fr));gap:10px 14px}#namo-work-inquiry label{display:flex;gap:7px;align-items:center;min-width:0;font-size:12px;font-weight:700;color:#26374b}#namo-work-inquiry label span{min-width:64px;text-align:right}#namo-work-inquiry input,#namo-work-inquiry select{min-width:0;width:100%;height:32px;padding:4px 7px;border:1px solid #cbd5e1;border-radius:3px;background:#fff;color:#243344}#namo-work-inquiry .nwi-actions{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:10px}#namo-work-inquiry .nwi-count{margin-right:auto;color:#526578;font-size:12px}#namo-work-detail{background:#fff;border:1px solid #d5dfe9;margin-top:12px}#namo-work-detail .nwd-head{font-size:15px;font-weight:700;padding:12px 14px;border-bottom:1px solid #d5dfe9;color:#243344}#namo-work-detail .nwd-content{padding:14px;color:#36465b}#namo-work-detail .nwd-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid #d5dfe9;border-left:1px solid #d5dfe9}#namo-work-detail .nwd-cell{display:flex;min-width:0;border-right:1px solid #d5dfe9;border-bottom:1px solid #d5dfe9}#namo-work-detail .nwd-cell b{flex:0 0 95px;padding:9px;background:#edf1f5}#namo-work-detail .nwd-cell span{padding:9px;overflow-wrap:anywhere}#namo-work-detail table{width:100%;border-collapse:collapse;margin-top:10px}#namo-work-detail th,#namo-work-detail td{border:1px solid #d5dfe9;padding:9px;text-align:center}#namo-work-detail th{background:#edf1f5}#work .work-list-table tbody tr.nwi-selected>td{background:#e2f1ff!important}@media(max-width:1100px){#namo-work-inquiry .nwi-grid,#namo-work-detail .nwd-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){#namo-work-inquiry .nwi-grid,#namo-work-detail .nwd-grid{grid-template-columns:1fr}}';
 style.textContent+="#work .module-toolbar>.filters{display:none!important}#work .module-toolbar{display:flex!important;align-items:center!important;justify-content:flex-end!important;padding:8px 12px!important}#work .module-toolbar .table-tools{margin-left:auto!important}#namo-work-inquiry .nwi-grid{grid-template-columns:repeat(4,minmax(0,1fr))}#namo-work-inquiry label span{min-width:80px;flex:0 0 80px;overflow-wrap:anywhere}#namo-work-detail .nwd-tabs{display:flex;gap:4px;margin:14px 0 10px;border-bottom:1px solid #d5dfe9}#namo-work-detail .nwd-tab{padding:9px 14px;border:1px solid #d5dfe9;border-bottom:0;background:#f5f7fa;cursor:pointer}#namo-work-detail .nwd-tab.active{background:#1689ed;color:white;border-color:#1689ed}#work .work-list-table tbody tr[hidden]{display:none!important}@media(max-width:1100px){#namo-work-inquiry .nwi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){#namo-work-inquiry .nwi-grid{grid-template-columns:1fr}}";
 document.head.appendChild(style);
 const panel=document.createElement('div');panel.id='namo-work-inquiry';
 panel.innerHTML='<div class="nwi-grid">'+labels.map((l,i)=>'<label><span>'+esc(l)+'</span>'+(i===3?'<select data-filter="'+i+'"><option value="">전체</option><option>대기</option><option>진행</option><option>완료</option></select>':'<input data-filter="'+i+'" type="'+(i===4||i===5?'date':'text')+'" placeholder="전체">')+'</label>').join('')+'</div><div class="nwi-actions"><span class="nwi-count" aria-live="polite"></span><button type="button" class="btn" id="nwi-clear">조건 지우기</button><button type="button" class="btn primary" id="nwi-search">조회</button></div>';
 const toolbar=shell.querySelector('.module-toolbar');toolbar?.insertAdjacentElement('afterend',panel);
 const detail=document.createElement('div');detail.id='namo-work-detail';
 detail.innerHTML='<div class="nwd-head">작업지시 상세내역</div><div class="nwd-content">상단 작업지시 목록에서 항목을 선택하세요.</div>';
 shell.insertAdjacentElement('afterend',detail);
 const controls=[...panel.querySelectorAll('[data-filter]')];let activeId='',activeTab='materials',activeRecord=null;
 const getRows=()=>[...tbody.querySelectorAll('tr[data-work-saved]')];
 function filter(){
  const q=controls.map(x=>x.value.trim().toLowerCase());let count=0;
  getRows().forEach(tr=>{
   const vals=[...tr.cells].map(td=>td.textContent.trim().toLowerCase());
   const matches=q.every((v,i)=>!v||(i===4?((vals[8]||'').split('~')[0].trim()>=v):i===5?((vals[8]||'').split('~').pop().trim()<=v):(vals[indices[i]]||'').includes(v)));
   tr.hidden=!matches;tr.style.display=matches?'':'none';if(matches)count++;
  });
  panel.querySelector('.nwi-count').textContent='조회 '+count+'건';
 }
 panel.querySelector('#nwi-search').addEventListener('click',filter);
 panel.querySelector('#nwi-clear').addEventListener('click',()=>{controls.forEach(x=>x.value='');filter()});
 controls.forEach(x=>x.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();filter()}}));
 function draw(row,order){
  const cells=[...row.cells].map(c=>c.textContent.trim()),fields=order?.fields||{};
  const vals=[['작업지시번호',order?.id||cells[1]],['고객사',fields['고객사']||cells[2]],['제품명',fields['제품명']||cells[3]],['생산 LOT',fields['생산 LOT NO']||cells[4]],['설비명',fields['설비명']||cells[5]],['작업자',fields['작업자']||cells[6]],['계획수량',fields['계획수량']||cells[7]],['작업기간',fields['작업기간']||cells[8]],['진행상태',fields['진행상태']||cells[9]],['작업일자',order?.workDate||'-'],['생산구분',order?.productionType||'-'],['작업지시사항',order?.note||'-']];
  const materials=Array.isArray(order?.materials)?order.materials:[];
  const tabs=[['materials','원재료 투입내역'],['progress','생산진행 현황'],['trace','LOT 추적정보']];
  const mats=order?'<div style="overflow-x:auto"><table><thead><tr><th>NO</th><th>원재료명</th><th>원재료 LOT</th><th>계획 투입량 (kg)</th><th>실투입량 (kg)</th></tr></thead><tbody>'+(materials.length?materials.map((m,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(m.name)+'</td><td>'+esc(m.lot)+'</td><td>'+esc(m.plan)+'</td><td>'+esc(m.actual)+'</td></tr>').join(''):'<tr><td colspan="5">등록된 원료가 없습니다.</td></tr>')+'</tbody></table></div>':'<p>원료 정보 조회 중입니다.</p>';
  const content=activeTab==='materials'?mats:activeTab==='progress'?'<p>진행상태: '+esc(fields['진행상태']||cells[9])+' · 세부 실적은 생산진행 현황에서 확인하세요.</p>':'<p>생산 LOT: '+esc(fields['생산 LOT NO']||cells[4])+' · 검사/출하 연결정보는 LOT 추적관리에서 확인하세요.</p>';
  detail.querySelector('.nwd-head').textContent='작업지시 상세내역  '+(order?.id||cells[1]);
  detail.querySelector('.nwd-content').innerHTML='<div class="nwd-grid">'+vals.map(v=>'<div class="nwd-cell"><b>'+esc(v[0])+'</b><span>'+esc(v[1])+'</span></div>').join('')+'</div><div class="nwd-tabs">'+tabs.map(([key,title])=>'<button type="button" data-nwd-tab="'+key+'" class="nwd-tab '+(activeTab===key?'active':'')+'">'+title+'</button>').join('')+'</div>'+content;
 }
 tbody.addEventListener('click',async e=>{
  const row=e.target.closest('tr[data-work-saved]');
  if(!row||e.target.closest('button,input,a,select'))return;
  e.stopImmediatePropagation();e.preventDefault();
  activeId=row.dataset.workSaved;activeTab='materials';activeRecord=null;
  getRows().forEach(r=>r.classList.toggle('nwi-selected',r===row));
  draw(row,null);
  const requestedId=activeId;
  try{
   const res=await fetch('/api/qmes/work-orders',{credentials:'same-origin',cache:'no-store'});
   if(!res.ok)throw new Error('조회 실패');
   const body=await res.json();if(!body.success)throw new Error('조회 실패');
   const order=(Array.isArray(body.data)?body.data:[]).find(x=>x.id===requestedId);
   if(order&&row.isConnected&&activeId===requestedId){activeRecord=order;draw(row,order);}
  }catch(err){console.warn('[work inquiry] detail fetch:',err);}
 },true);
 detail.addEventListener('click',e=>{const tab=e.target.closest('[data-nwd-tab]');if(!tab||!activeId)return;activeTab=tab.dataset.nwdTab;const row=getRows().find(x=>x.dataset.workSaved===activeId);if(row)draw(row,activeRecord);});
 let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;filter();})});
 observer.observe(tbody,{childList:true});
 filter();
}
function boot(){init();if(document.getElementById('namo-work-inquiry'))return;const obs=new MutationObserver(()=>{if(document.querySelector('#work .work-list-table')){init();if(document.getElementById('namo-work-inquiry'))obs.disconnect()}});obs.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();