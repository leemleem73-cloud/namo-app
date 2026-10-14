/* QMES work-order selection, contextual detail tabs, batch print bar. */
(function(){
'use strict';
if(window.__qmesWorkBatchUi)return;window.__qmesWorkBatchUi=true;
const selected=new Set();
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const getRecords=()=>{try{const v=JSON.parse(localStorage.getItem('namo_qmes_work_orders_v1')||'[]');return Array.isArray(v)?v:[]}catch(_){return []}};
const current=()=>document.getElementById('work');
const rows=()=>[...((current()||document).querySelectorAll('tr[data-work-saved]'))];
let activeTab='route',details=null,bar=null,all=null;
function records(){const lookup=new Map(getRecords().map(r=>[String(r.id),r]));return [...selected].map(id=>lookup.get(id)).filter(Boolean)}
function repaint(){
 const valid=new Set(rows().map(r=>r.dataset.workSaved));
 [...selected].forEach(id=>{if(!valid.has(id))selected.delete(id)});
 rows().forEach(row=>{const check=row.querySelector('.qmes-work-check');if(check)check.checked=selected.has(row.dataset.workSaved);row.classList.toggle('qmes-work-checked',selected.has(row.dataset.workSaved))});
 if(all){all.checked=rows().length>0&&rows().every(row=>selected.has(row.dataset.workSaved));all.indeterminate=selected.size>0&&!all.checked}
 if(bar){bar.hidden=!selected.size;bar.querySelector('.qmes-picked-count').textContent=selected.size+'건 선택됨'}
 if(details)renderDetails();
}
function renderDetails(){
 const list=records();const r=list[0];const body=details.querySelector('.qmes-work-detail-body');if(!body)return;
 details.querySelectorAll('[data-qmes-work-tab]').forEach(x=>x.classList.toggle('active',x.dataset.qmesWorkTab===activeTab));
 if(!r){body.innerHTML='<div class="qmes-work-empty">작업지시서 행의 체크박스를 선택하면 상세정보가 표시됩니다.</div>';return}
 const f=r.fields||{}, m=Array.isArray(r.materials)?r.materials:[];
 if(activeTab==='materials'){
  body.innerHTML='<table class="qmes-work-subtable"><thead><tr><th>NO</th><th>원료명</th><th>원료 LOT NO</th><th>계획투입량(kg)</th><th>실투입량(kg)</th></tr></thead><tbody>'+m.map((x,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(x.name||'-')+'</td><td>'+esc(x.lot||'-')+'</td><td>'+esc(x.plan||'-')+'</td><td>'+esc(x.actual||'-')+'</td></tr>').join('')+'</tbody></table>';
 }else if(activeTab==='trace'){
  body.innerHTML='<div class="qmes-work-fields"><span>작업지시번호 <b>'+esc(f['작업지시번호']||r.id)+'</b></span><span>생산 LOT NO <b>'+esc(f['생산 LOT NO']||'-')+'</b></span><span>고객사 <b>'+esc(f['고객사']||'-')+'</b></span><span>진행상태 <b>'+esc(f['진행상태']||'-')+'</b></span></div>';
 }else{
  body.innerHTML='<div class="qmes-work-fields"><span>작업지시번호 <b>'+esc(r.id)+'</b></span><span>작업기간 <b>'+esc(f['작업기간']||'-')+'</b></span><span>제품명 <b>'+esc(f['제품명']||'-')+'</b></span><span>설비명 <b>'+esc(f['설비명']||'-')+'</b></span><span>작업자 <b>'+esc(f['작업자']||'-')+'</b></span><span>계획수량 <b>'+esc(f['계획수량']||'-')+'</b></span></div>';
 }
}
function printSelected(){
 const list=records();if(!list.length)return;
 const w=window.open('','_blank','width=1000,height=800');if(!w){alert('인쇄 팝업을 허용해 주세요.');return}
 const docs=list.map(r=>{const f=r.fields||{},materials=Array.isArray(r.materials)?r.materials:[];return '<article><h2>작 업 지 시 서</h2><table><tbody>'+Object.entries({'작업지시번호':r.id,'고객사':f['고객사'],'제품명':f['제품명'],'생산 LOT NO':f['생산 LOT NO'],'설비명':f['설비명'],'작업자':f['작업자'],'계획수량':f['계획수량'],'작업기간':f['작업기간'],'진행상태':f['진행상태']}).map(([k,v])=>'<tr><th>'+esc(k)+'</th><td>'+esc(v||'-')+'</td></tr>').join('')+'</tbody></table><h3>원료 투입계획</h3><table><thead><tr><th>원료명</th><th>원료 LOT NO</th><th>계획투입량(kg)</th><th>실투입량(kg)</th></tr></thead><tbody>'+materials.map(m=>'<tr><td>'+esc(m.name||'-')+'</td><td>'+esc(m.lot||'-')+'</td><td>'+esc(m.plan||'-')+'</td><td>'+esc(m.actual||'-')+'</td></tr>').join('')+'</tbody></table><p>작업지시사항: '+esc(r.note||'-')+'</p></article>'}).join('');
 w.document.open();w.document.write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>작업지시서 선택 인쇄</title><style>body{font-family:Arial,"Malgun Gothic",sans-serif;color:#172b42;margin:24px}h2{text-align:center}table{width:100%;border-collapse:collapse;margin:14px 0}th,td{border:1px solid #aab8c8;padding:9px;text-align:left;font-size:12px}th{background:#eef3f8}article{break-after:page;page-break-after:always;margin-bottom:24px}article:last-child{break-after:auto;page-break-after:auto}@media print{body{margin:10mm}}</style></head><body>'+docs+'</body></html>');w.document.close();w.focus();setTimeout(()=>w.print(),250);
}
function init(){
 const section=current(),table=section?.querySelector('.module-body table'),thead=table?.querySelector('thead tr');if(!section||!table||!thead)return;
 if(!thead.querySelector('.qmes-work-select-all')){const first=thead.querySelector('th');if(first){all=document.createElement('input');all.type='checkbox';all.className='qmes-work-select-all';all.setAttribute('aria-label','작업지시서 전체 선택');all.addEventListener('change',()=>{rows().forEach(r=>all.checked?selected.add(r.dataset.workSaved):selected.delete(r.dataset.workSaved));repaint()});first.prepend(all)}}else all=thead.querySelector('.qmes-work-select-all');
 rows().forEach(row=>{if(row.querySelector('.qmes-work-check'))return;const cell=row.querySelector('td');if(!cell)return;const ck=document.createElement('input');ck.type='checkbox';ck.className='qmes-work-check';ck.setAttribute('aria-label','작업지시서 '+row.dataset.workSaved+' 선택');ck.addEventListener('click',e=>e.stopPropagation());ck.addEventListener('change',e=>{e.stopPropagation();ck.checked?selected.add(row.dataset.workSaved):selected.delete(row.dataset.workSaved);repaint()});cell.prepend(ck)});
 if(!details||!details.isConnected){details=document.createElement('div');details.className='qmes-work-reference';details.innerHTML='<nav><button type="button" data-qmes-work-tab="route">공정경로</button><button type="button" data-qmes-work-tab="materials">소요자재</button><button type="button" data-qmes-work-tab="trace">추적정보</button></nav><div class="qmes-work-detail-body"></div>';details.querySelectorAll('[data-qmes-work-tab]').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.qmesWorkTab;renderDetails()}));const wrapper=table.closest('.module-body')||table.parentElement;wrapper.parentElement.insertBefore(details,wrapper.nextSibling)}
 if(!bar||!bar.isConnected){bar=document.createElement('div');bar.className='qmes-work-printbar';bar.hidden=true;bar.innerHTML='<strong class="qmes-picked-count">0건 선택됨</strong><div><button type="button" class="qmes-work-clear">선택 해제</button><button type="button" class="qmes-work-print">선택 인쇄</button></div>';bar.querySelector('.qmes-work-clear').onclick=()=>{selected.clear();repaint()};bar.querySelector('.qmes-work-print').onclick=printSelected;section.appendChild(bar)}
 repaint();
}
const style=document.createElement('style');style.textContent='.qmes-work-select-all,.qmes-work-check{width:15px;height:15px;vertical-align:middle;accent-color:#188ad1;margin-right:9px;cursor:pointer}.qmes-work-checked{background:#eef7ff!important}.qmes-work-reference{border:1px solid #d8e3ee;border-radius:7px;background:#fff;margin:12px 0;overflow:hidden}.qmes-work-reference nav{display:flex;border-bottom:1px solid #d8e3ee;padding:0 12px}.qmes-work-reference nav button{border:0;background:none;color:#64748b;font-weight:700;font-size:12px;padding:14px;cursor:pointer}.qmes-work-reference nav button.active{color:#087bc3;border-bottom:2px solid #087bc3}.qmes-work-detail-body{min-height:85px;padding:17px;color:#475569;font-size:12px}.qmes-work-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.qmes-work-fields span{display:flex;justify-content:space-between;border-bottom:1px solid #e8edf3;padding:10px}.qmes-work-subtable{width:100%;border-collapse:collapse}.qmes-work-subtable th,.qmes-work-subtable td{border:1px solid #dce5ee;padding:9px;text-align:center}.qmes-work-subtable th{background:#f1f6fb}.qmes-work-printbar{position:sticky;bottom:0;z-index:70;display:flex;justify-content:space-between;align-items:center;background:#3c4d65;color:white;padding:14px 22px;box-shadow:0 -5px 20px #21354b23;border-radius:5px;font-size:14px}.qmes-work-printbar[hidden]{display:none!important}.qmes-work-printbar button{background:transparent;color:white;border:1px solid #a9b7c7;border-radius:5px;padding:9px 18px;margin-left:8px;cursor:pointer}.qmes-work-printbar .qmes-work-print{background:#1687cf;border-color:#1687cf}.qmes-work-empty{color:#8a96a5}';document.head.appendChild(style);
let pending=false;const observe=new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;init()})});observe.observe(document.body,{childList:true,subtree:true});init();
})();
