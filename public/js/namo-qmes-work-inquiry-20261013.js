/* QMES work order enhanced inquiry, additive and read-only; existing create/edit/delete/API unchanged. */
(function(){
'use strict';
if(window.__namoWorkInquiry20261013)return;
window.__namoWorkInquiry20261013=true;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.namoPrintWorkOrder=printWorkOrderDocument;
function printWorkOrderDocument(record,reservedWindow,renderOnly=false){
 if(!record||!record.id){window.alert('저장된 작업지시서를 선택해 주세요.');return false;}
 const win=renderOnly?null:(reservedWindow||window.open('','_blank','width=980,height=760,scrollbars=yes'));
 if(!win&&!renderOnly){window.alert('인쇄창이 차단됐습니다. 사이트의 팝업을 허용해주세요.');return false;}
 const f=record.fields||{},materials=Array.isArray(record.materials)?record.materials:[];
 const safe=v=>esc(v===undefined||v===null||String(v).trim()===''?'-':v);
 const num=v=>{const t=String(v??'').trim().replace(/,/g,'');const n=Number(t);return t&&Number.isFinite(n)?n:0};
 const qty=n=>n.toLocaleString('ko-KR',{maximumFractionDigits:3});
 const planned=materials.reduce((total,m)=>total+num(m.plan),0);
 const used=materials.reduce((total,m)=>total+num(m.actual),0);
 const timestamp=new Date().toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false});
 const meta=[
  ['작업지시번호',record.id,'작업일자',record.workDate],
  ['고객사',f['고객사'],'제품명',f['제품명']],
  ['생산 LOT NO',f['생산 LOT NO'],'설비명',f['설비명']],
  ['계획수량 (kg)',f['계획수량'],'작업자',f['작업자']],
  ['작업기간',f['작업기간'],'생산구분',record.productionType],
  ['진행상태',f['진행상태'],'중간배치 종류',record.intermediateBatch?.kind]
 ];
 const rows=materials.map((m,i)=>{
  const name=m.name==='중간배치'&&m.batchType?String(m.name)+' ('+String(m.batchType)+')':m.name;
  const ratio=planned>0?qty(num(m.plan)/planned*100)+'%':'-';
  return '<tr><td>'+safe(i+1)+'</td><td>'+safe(name)+'</td><td>'+safe(m.lot)+'</td><td>'+safe(m.plan)+'</td><td>'+safe(m.actual)+'</td><td>'+ratio+'</td></tr>';
 }).join('');
 const steps=[
  ['01','A탱크 원료 투입','NMP / 분산제 / 세라믹 투입'],
  ['02','High Shear','A탱크 선분산 진행'],
  ['03','A탱크 추가 투입','바인더 / SBR 추가 후 Mixing'],
  ['04','교차 순환','A↔B 탱크 교차 순환 Mixing']
 ];
 const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>작업지시서 ${safe(record.id)}</title>
<style>
@page{size:A4 portrait;margin:12mm 11mm}
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#1d314a;font-family:"Malgun Gothic","Noto Sans KR",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-size:10pt}.paper{max-width:188mm;margin:auto}
.actions{display:flex;justify-content:flex-end;gap:7px;margin:12px 0}.actions button{padding:9px 14px;border:1px solid #bbcadb;border-radius:5px;background:white;cursor:pointer;font-weight:700}.actions button:first-child{background:#164b7a;color:#fff;border-color:#164b7a}
.brand{display:flex;justify-content:space-between;align-items:center;border-top:4px solid #174d7c;padding:12px 2px}
.brand strong{font-size:17pt;color:#174d7c}.brand small{font-size:8pt;color:#6e8398;text-align:right}
h1{font-size:20pt;letter-spacing:4px;margin:0;padding:10px 0 13px;text-align:center;border-block:1px solid #c9d7e5;color:#1b3c5d}
h1 small{display:block;letter-spacing:2px;font-size:8pt;color:#7b8c9b;font-weight:500;margin-top:4px}
h2{font-size:10pt;color:#1f4366;background:#eaf1f8;border:1px solid #c9d7e5;border-bottom:0;margin:15px 0 0;padding:8px 10px}
table{border-collapse:collapse;table-layout:fixed;width:100%}th,td{border:1px solid #cad6e3;font-size:9pt;padding:7px 6px;overflow-wrap:anywhere;vertical-align:middle}
.meta th{background:#f3f7fb;width:17%;color:#31516f;text-align:center}.meta td{width:33%}
.material th{background:#edf3f9;color:#31516f;text-align:center;font-size:8.5pt}.material td{text-align:center}
.material th:nth-child(1){width:6%}.material th:nth-child(2){width:19%}.material th:nth-child(3){width:29%}.material th:nth-child(4){width:17%}.material th:nth-child(5){width:16%}.material th:nth-child(6){width:13%}
.material tfoot td{background:#f4f8fb;font-weight:800}
.steps{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.step{border:1px solid #d4e0eb;display:flex;gap:8px;align-items:center;min-height:49px;padding:8px}
.step b{font-size:8pt;color:#1a659b}.step strong{display:block;font-size:9pt}.step small{display:block;font-size:8pt;color:#667e94;margin-top:3px}
.note{min-height:56px;border:1px solid #cad6e3;padding:10px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
.footer{display:flex;justify-content:space-between;border-top:1px solid #ccd9e6;margin-top:15px;padding-top:8px;font-size:8pt;color:#688096}
tr{break-inside:avoid}thead{display:table-header-group}
@media print{.actions{display:none!important}.paper{max-width:none}h2{break-after:avoid}}
</style></head><body><main class="paper">
<div class="actions"><button type="button" onclick="window.print()">인쇄하기</button><button type="button" onclick="window.close()">닫기</button></div>
<div class="brand"><strong>NAMO Chemical</strong><small>(주)나모케미칼<br>QMES · PRODUCTION MANAGEMENT</small></div>
<h1>작업지시서<small>WORK ORDER</small></h1>
<h2>01. 작업 기본정보</h2>
<table class="meta"><tbody>${meta.map(x=>'<tr><th>'+safe(x[0])+'</th><td>'+safe(x[1])+'</td><th>'+safe(x[2])+'</th><td>'+safe(x[3])+'</td></tr>').join('')}</tbody></table>
<h2>02. 원료 투입계획</h2>
<table class="material"><thead><tr><th>NO</th><th>원료명</th><th>원료 LOT NO</th><th>계획투입량(kg)</th><th>실투입량(kg)</th><th>투입비율</th></tr></thead>
<tbody>${rows||'<tr><td colspan="6">등록된 원료가 없습니다.</td></tr>'}</tbody>
<tfoot><tr><td colspan="3">합계</td><td>${qty(planned)}</td><td>${qty(used)}</td><td>${planned>0?'100%':'-'}</td></tr></tfoot></table>
<h2>03. 기본 공정순서</h2>
<div class="steps">${steps.map(x=>'<div class="step"><b>STEP '+safe(x[0])+'</b><div><strong>'+safe(x[1])+'</strong><small>'+safe(x[2])+'</small></div></div>').join('')}</div>
<h2>04. 작업지시사항</h2><div class="note">${safe(record.note)}</div>
<div class="footer"><span>작업지시번호: ${safe(record.id)}</span><span>출력일시: ${safe(timestamp)} KST</span><span>NAMO QMES</span></div>
</main><script>window.addEventListener('load',function(){setTimeout(function(){window.focus();window.print()},250)});</script></body></html>`;
 if(renderOnly)return html;
 try{win.document.open();win.document.write(html);win.document.close();return true;}
 catch(error){console.error('[QMES work print]',error);window.alert('인쇄 화면을 열지 못했습니다. 다시 시도해주세요.');return false;}
}
const labels=['고객사','제품명','생산 LOT','진행상태','시작일자','종료일자','작업지시번호','설비명'];
const indices=[2,3,4,9,8,8,1,5];
function init(){
 const section=document.getElementById('work');
 if(!section)return;
 const shell=section.querySelector('.module-shell'),tbody=shell?.querySelector('.work-list-table tbody');
 if(!shell||!tbody||section.querySelector('#namo-work-inquiry'))return;
 let head=shell.querySelector('.nwi-header');
 if(!head){
   head=document.createElement('div');head.className='nwi-header';
   head.innerHTML='<div class="nwi-title"><strong>작업지시서 등록 및 조회</strong></div>';
   const existingToolbar=shell.querySelector('.module-toolbar');
   existingToolbar?.querySelector('.filters')?.remove();
   if(existingToolbar)head.appendChild(existingToolbar);
   shell.prepend(head);
 }
 section.querySelector('.page-head')?.remove();
 const panel=document.createElement('div');panel.id='namo-work-inquiry';
 panel.innerHTML='<div class="nwi-grid">'+labels.map((l,i)=>'<label><span>'+esc(l)+'</span>'+(i===3?'<select data-filter="'+i+'"><option value="">전체</option><option>대기</option><option>진행</option><option>완료</option></select>':'<input data-filter="'+i+'" type="'+(i===4||i===5?'date':'text')+'" placeholder="전체">')+'</label>').join('')+'</div><div class="nwi-actions"><span class="nwi-count" aria-live="polite"></span><button type="button" class="btn" id="nwi-clear">조건 지우기</button><button type="button" class="btn primary" id="nwi-search">조회</button></div>';
 head.insertAdjacentElement('afterend',panel);
 // Date-range UI only: keep original start/end filters and their search behavior.
 (function installInstructionPeriod(){
  const start=panel.querySelector('[data-filter="4"]'),end=panel.querySelector('[data-filter="5"]');
  if(!start||!end)return;
  const startLabel=start.closest('label'),endLabel=end.closest('label');
  const rangeLabel=document.createElement('label');
  rangeLabel.className='nwi-period-label';
  rangeLabel.innerHTML='<span>지시기간</span><button type="button" class="nwi-period-trigger" aria-label="지시기간 달력 열기" aria-expanded="false"><span class="nwi-period-value">기간 선택</span><span class="nwi-period-icon">▦</span></button>';
  startLabel.before(rangeLabel);startLabel.hidden=true;endLabel.hidden=true;
  const pop=document.createElement('div');pop.className='nwi-period-popup';pop.hidden=true;
  pop.innerHTML='<div class="nwi-period-presets" role="group" aria-label="지시기간 빠른 선택">'+['올해','오늘까지','오늘','전일','주간','전주','당월','이전달'].map(name=>'<button type="button" class="nwi-period-preset">'+name+'</button>').join('')+'</div><div class="nwi-period-months"></div><div class="nwi-period-footer"><span class="nwi-period-summary">기간을 선택하세요</span><div><button type="button" class="btn nwi-period-cancel">취소</button><button type="button" class="btn primary nwi-period-ok">확인</button></div></div>';
  rangeLabel.after(pop);
  const fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const parse=v=>v?new Date(v+'T12:00:00'):null;
  const today=new Date(),firstOfMonth=new Date(today.getFullYear(),today.getMonth(),1),todayLocal=new Date(today.getFullYear(),today.getMonth(),today.getDate());let base=new Date(firstOfMonth),a=new Date(firstOfMonth),b=new Date(todayLocal);
  const trigger=rangeLabel.querySelector('.nwi-period-trigger'),value=rangeLabel.querySelector('.nwi-period-value');
  value.textContent=fmt(a)+' ~ '+fmt(b);
  function redraw(){
   const months=pop.querySelector('.nwi-period-months');months.innerHTML='';
   for(let k=0;k<2;k++){
    const d=new Date(base.getFullYear(),base.getMonth()+k,1),y=d.getFullYear(),m=d.getMonth();
    const block=document.createElement('div');block.className='nwi-period-month';
    const top=document.createElement('div');top.className='nwi-period-month-head';
    const prev=document.createElement('button');prev.type='button';prev.textContent='‹';prev.setAttribute('aria-label','이전 달');prev.onclick=()=>{base=new Date(base.getFullYear(),base.getMonth()-1,1);redraw()};
    const next=document.createElement('button');next.type='button';next.textContent='›';next.setAttribute('aria-label','다음 달');next.onclick=()=>{base=new Date(base.getFullYear(),base.getMonth()+1,1);redraw()};
    const title=document.createElement('strong');title.textContent=y+'.'+String(m+1).padStart(2,'0');top.append(prev,title,next);block.appendChild(top);
    const grid=document.createElement('div');grid.className='nwi-period-days';
    ['일','월','화','수','목','금','토'].forEach(w=>{const x=document.createElement('b');x.textContent=w;grid.appendChild(x)});
    const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
    for(let i=0;i<first;i++)grid.appendChild(document.createElement('i'));
    for(let n=1;n<=days;n++){
     const date=new Date(y,m,n),key=fmt(date),btn=document.createElement('button');btn.type='button';btn.textContent=n;
     if((a&&key===fmt(a))||(b&&key===fmt(b)))btn.classList.add('selected');
     else if(a&&b&&date>a&&date<b)btn.classList.add('between');
     btn.onclick=()=>{if(!a||b){a=date;b=null}else if(date<a){b=a;a=date}else{b=date}redraw()};
     grid.appendChild(btn);
    }
    block.appendChild(grid);months.appendChild(block);
   }
   pop.querySelector('.nwi-period-summary').textContent=a?(fmt(a)+(b?' ~ '+fmt(b):' ~ 종료일 선택')):'시작일과 종료일을 선택하세요';
  }
  function weekMonday(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
  function preset(name){
   const y=today.getFullYear(),m=today.getMonth(),day=today.getDate();
   if(name==='올해'){a=new Date(y,0,1);b=new Date(y,11,31)}
   else if(name==='오늘까지'){a=new Date(y,0,1);b=new Date(todayLocal)}
   else if(name==='오늘'){a=new Date(todayLocal);b=new Date(todayLocal)}
   else if(name==='전일'){a=new Date(y,m,day-1);b=new Date(a)}
   else if(name==='주간'){a=weekMonday(today);b=new Date(a);b.setDate(b.getDate()+6)}
   else if(name==='전주'){b=weekMonday(today);b.setDate(b.getDate()-1);a=new Date(b);a.setDate(a.getDate()-6)}
   else if(name==='당월'){a=new Date(y,m,1);b=new Date(y,m+1,0)}
   else if(name==='이전달'){a=new Date(y,m-1,1);b=new Date(y,m,0)}
   else return;
   base=new Date(a.getFullYear(),a.getMonth(),1);redraw();
  }
  pop.querySelectorAll('.nwi-period-preset').forEach(btn=>btn.addEventListener('click',()=>preset(btn.textContent.trim())));
  function close(){pop.hidden=true;trigger.setAttribute('aria-expanded','false')}
  trigger.onclick=()=>{if(!pop.hidden){close();return}a=parse(start.value);b=parse(end.value);if(!a&&!b&&value.textContent!=='기간 선택'){a=new Date(firstOfMonth);b=new Date(todayLocal)}if(a)base=new Date(a.getFullYear(),a.getMonth(),1);redraw();pop.hidden=false;trigger.setAttribute('aria-expanded','true')};
  pop.querySelector('.nwi-period-cancel').onclick=close;
  pop.querySelector('.nwi-period-ok').onclick=()=>{if(!a||!b)return;start.value=fmt(a);end.value=fmt(b);value.textContent=fmt(a)+' ~ '+fmt(b);close()};
  document.addEventListener('pointerdown',e=>{if(!pop.hidden&&!pop.contains(e.target)&&!rangeLabel.contains(e.target))close()});
  panel.querySelector('#nwi-search').addEventListener('click',()=>{if(!start.value&&!end.value&&value.textContent!=='기간 선택'){start.value=fmt(firstOfMonth);end.value=fmt(todayLocal)}});
  panel.querySelector('#nwi-clear').addEventListener('click',()=>{value.textContent='기간 선택';a=null;b=null;close()});
 })();

 const listHead=document.createElement('div');listHead.className='nwi-list-head';
 listHead.innerHTML='<span>▸ 작업지시 현황</span><span id="nwi-list-total">총 0건</span>';
 const tableWrap=shell.querySelector('.module-body');if(tableWrap)shell.insertBefore(listHead,tableWrap);
 const detail=document.createElement('div');detail.id='namo-work-detail';
 detail.innerHTML='<div class="nwd-head">작업지시 상세내역</div><div class="nwd-content">상단 작업지시 목록에서 항목을 선택하세요.</div>';
 shell.insertAdjacentElement('afterend',detail);
 const controls=[...panel.querySelectorAll('[data-filter]')];let activeId='',activeTab='materials',activeRecord=null;
 const getRows=()=>[...tbody.querySelectorAll('tr[data-work-saved]')];
 function ensureRowPrintButtons(){
  getRows().forEach(tr=>{
   const actions=tr.cells[tr.cells.length-1];
   if(!actions||actions.querySelector('.work-order-print-btn'))return;
   let group=actions.querySelector('.work-row-actions');
   if(!group){
    group=document.createElement('span');
    group.className='work-row-actions';
    while(actions.firstChild)group.appendChild(actions.firstChild);
    actions.appendChild(group);
   }
   const print=document.createElement('button');
   print.type='button';
   print.className='btn work-order-print-btn';
   print.textContent='인쇄';
   print.title='해당 작업지시서 인쇄';
   print.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    const id=String(tr.dataset.workSaved||'');
    const record=typeof readWorkOrders==='function'
      ?readWorkOrders().find(x=>String(x?.id||'')===id):null;
    if(!record){window.alert('저장된 작업지시서를 찾을 수 없습니다. 다시 조회해 주세요.');return;}
    printWorkOrderDocument(record);
   });
   group.prepend(print);
  });
 }
 function filter(){
  ensureRowPrintButtons();
  const q=controls.map(x=>x.value.trim().toLowerCase());let count=0;
  getRows().forEach(tr=>{
   const vals=[...tr.cells].map(td=>td.textContent.trim().toLowerCase());
   const matches=q.every((v,i)=>!v||(i===4?((vals[8]||'').split('~')[0].trim()>=v):i===5?((vals[8]||'').split('~').pop().trim()<=v):(vals[indices[i]]||'').includes(v)));
   tr.hidden=!matches;tr.style.display=matches?'':'none';if(matches)count++;
  });
  panel.querySelector('.nwi-count').textContent='조회 '+count+'건';
  const total=section.querySelector('#nwi-list-total');if(total)total.textContent='총 '+count+'건';
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
window.namoWorkInquiryInit=init;
function boot(){init();if(document.getElementById('namo-work-inquiry'))return;const obs=new MutationObserver(()=>{if(document.querySelector('#work .work-list-table')){init();if(document.getElementById('namo-work-inquiry'))obs.disconnect()}});obs.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
/* QMES work order checkbox actions, isolated from other modules. */
(function(){
'use strict';
const selected=new Set();let busy=false,queued=false;
const section=()=>document.getElementById('work');
const rows=()=>Array.from(section()?.querySelectorAll('tr[data-work-saved]')||[]);
function update(){
 const live=new Set(rows().map(r=>r.dataset.workSaved));
 for(const id of selected)if(!live.has(id))selected.delete(id);
 rows().forEach(r=>{const x=r.querySelector('.wo-bulk-check');if(x)x.checked=selected.has(r.dataset.workSaved)});
 const all=section()?.querySelector('.wo-bulk-all');if(all){all.checked=rows().length>0&&rows().every(r=>selected.has(r.dataset.workSaved));all.indeterminate=selected.size>0&&!all.checked}
 const bar=section()?.querySelector('.wo-bulk-controls');if(bar){bar.hidden=!selected.size;bar.querySelector('.wo-bulk-print').textContent='선택 인쇄 ('+selected.size+')';bar.querySelector('.wo-bulk-delete').textContent='선택 삭제 ('+selected.size+')';bar.querySelectorAll('button').forEach(x=>x.disabled=busy)}
}
function scan(){
 const root=section(),table=root?.querySelector('.work-list-table');if(!table)return;
 const tools=root.querySelector('#namo-work-inquiry .nwi-actions');
 if(tools&&!tools.querySelector('.wo-bulk-controls')){
  const bar=document.createElement('span');bar.className='wo-bulk-controls';bar.hidden=true;
  bar.innerHTML='<button type="button" class="btn wo-bulk-print">선택 인쇄</button><button type="button" class="btn wo-bulk-delete">선택 삭제</button>';
  const clear=tools.querySelector('#nwi-clear');if(clear)tools.insertBefore(bar,clear);else tools.appendChild(bar);bar.querySelector('.wo-bulk-print').onclick=print;bar.querySelector('.wo-bulk-delete').onclick=remove;
 }
 const th=table.querySelector('thead th');if(th&&!th.querySelector('.wo-bulk-all')){
  const c=document.createElement('input');c.type='checkbox';c.className='wo-bulk-all';c.setAttribute('aria-label','전체 선택');c.onclick=e=>e.stopPropagation();c.onchange=()=>{rows().forEach(r=>c.checked?selected.add(r.dataset.workSaved):selected.delete(r.dataset.workSaved));update()};th.prepend(c)
 }
 rows().forEach(r=>{const td=r.cells[0];if(!td||td.querySelector('.wo-bulk-check'))return;
  const c=document.createElement('input');c.type='checkbox';c.className='wo-bulk-check';c.setAttribute('aria-label','작업지시서 '+r.dataset.workSaved+' 선택');c.onclick=e=>e.stopPropagation();c.onchange=e=>{e.stopPropagation();c.checked?selected.add(r.dataset.workSaved):selected.delete(r.dataset.workSaved);update()};td.prepend(c)
 });update()
}
function print(){
 const saved=typeof readWorkOrders==='function'?readWorkOrders():[];
 const docs=[...selected].map(id=>saved.find(r=>String(r?.id)===id)).filter(Boolean);
 if(!docs.length)return alert('인쇄할 작업지시서를 선택해 주세요.');
 const pages=docs.map(r=>printWorkOrderDocument(r,null,true));
 const parts=pages.map(page=>page.match(/<main class="paper">[\s\S]*?<\/main>/)?.[0]).filter(Boolean);
 if(parts.length!==docs.length)return alert('선택 인쇄 문서를 준비하지 못했습니다.');
 const w=window.open('','_blank','width=980,height=760,scrollbars=yes');
 if(!w)return alert('인쇄 팝업을 허용해 주세요.');
 let html=pages[0].replace(parts[0],parts.join('\n'));
 html=html.replace('</style>','.paper{break-after:page;page-break-after:always}.paper:last-of-type{break-after:auto;page-break-after:auto}\n</style>');
 html=html.replace(/<title>[^<]*<\/title>/,'<title>작업지시서 선택 인쇄 ('+docs.length+'건)</title>');
 w.document.open();w.document.write(html);w.document.close();
}
async function remove(){
 if(busy)return;
 const ids=[...selected];if(!ids.length||!confirm('선택한 작업지시서 '+ids.length+'건을 삭제하시겠습니까?'))return;
 busy=true;update();let count=0;
 try{
  for(const id of ids){
   try{await workApi('DELETE','/'+encodeURIComponent(id));selected.delete(id);count++;
    if(typeof workSharedRows!=='undefined'&&Array.isArray(workSharedRows))workSharedRows=workSharedRows.filter(r=>String(r?.id)!==id);
   }catch(e){alert('작업지시서 '+id+' 삭제 실패: '+e.message);break}
  }
  if(typeof workSharedRows!=='undefined'&&Array.isArray(workSharedRows))try{localStorage.setItem(WORK_LOCAL_KEY,JSON.stringify(workSharedRows))}catch(e){}
  if(typeof refreshSharedWorkOrders==='function')await refreshSharedWorkOrders();
  if(typeof renderSavedWorkOrders==='function')renderSavedWorkOrders();
  if(count&&typeof toast==='function')toast('작업지시서 '+count+'건 삭제 완료');
 }finally{busy=false;scan()}
}
const style=document.createElement('style');style.textContent='.wo-bulk-check,.wo-bulk-all{width:15px;height:15px;margin-right:8px;vertical-align:middle;accent-color:#2563eb;cursor:pointer}.wo-bulk-controls{display:inline-flex;gap:7px;margin-right:10px}.wo-bulk-controls[hidden]{display:none!important}.wo-bulk-controls .wo-bulk-print{background:#eaf3ff;color:#245482;border:1px solid #c8daed}.wo-bulk-controls .wo-bulk-delete{background:#fff1f1;color:#b23535;border:1px solid #e9cccc}';document.head.appendChild(style);
const observer=new MutationObserver(ms=>{if(queued||!ms.some(m=>m.target.closest?.('#work')||[...m.addedNodes].some(n=>n.nodeType===1&&(n.id==='work'||n.querySelector?.('#work')))))return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})});observer.observe(document.body,{childList:true,subtree:true});scan();
})();
