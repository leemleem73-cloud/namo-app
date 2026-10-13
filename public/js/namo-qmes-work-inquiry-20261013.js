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
 function filter(){
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