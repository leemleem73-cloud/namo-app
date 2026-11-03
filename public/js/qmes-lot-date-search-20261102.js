/* Date finder for existing LOT trace; no creation or modification of production records. */
(function(factory){
 'use strict';const core=factory();if(typeof module==='object'&&module.exports)module.exports=core;if(typeof window!=='undefined'&&window.document)core.install(window);
})(function(){
 'use strict';
 const norm=value=>String(value??'').trim().toUpperCase();
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function dayOf(value){const day=String(value||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return '';const parsed=new Date(day+'T00:00:00Z');return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===day?day:'';}
 function rangeError(start,end){if(!dayOf(start)||!dayOf(end))return '시작일과 종료일을 선택해 주세요.';return start>end?'시작일은 종료일보다 늦을 수 없습니다.':'';}
 function period(kind,today){const day=dayOf(today);if(!day)return null;const end=new Date(day+'T12:00:00Z'),start=new Date(end);if(kind==='week')start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7));else if(kind==='month')start.setUTCDate(1);return {start:start.toISOString().slice(0,10),end:day};}
 function rowsFor(orders,start,end){
  if(rangeError(start,end))return [];
  return orders.filter(row=>!row.deleted&&dayOf(row.workDate||row.fields?.['작업일자'])>=start&&dayOf(row.workDate||row.fields?.['작업일자'])<=end&&norm(row.fields?.['생산 LOT NO'])&&!['-','NULL','UNDEFINED'].includes(norm(row.fields?.['생산 LOT NO']))).map((row,index)=>({
   id:String(row.id??index),date:dayOf(row.workDate||row.fields?.['작업일자']),lot:String(row.fields['생산 LOT NO']).trim(),number:row.fields['작업지시번호']||row.id||'',product:row.fields['제품명']||'',quantity:row.fields['계획수량'],worker:row.fields['작업자']||'',status:row.fields['진행상태']||'미확인',mode:row.productionType==='중간배치'?'intermediate':'finished'
  })).sort((a,b)=>b.date.localeCompare(a.date)||a.lot.localeCompare(b.lot,'ko')||a.id.localeCompare(b.id));
 }
 function recordDates(records){
  return new Set(records.filter(row=>!row.deleted&&norm(row.fields?.['생산 LOT NO'])&&!['-','NULL','UNDEFINED'].includes(norm(row.fields?.['생산 LOT NO']))).map(row=>dayOf(row.workDate||row.fields?.['작업일자'])).filter(Boolean));
 }
 function sheetDatesFor(records){return [...recordDates(records)].sort((a,b)=>b.localeCompare(a));}
 function sheetDatesFromSources(sources){
  const dates=new Set(sheetDatesFor(sources[1]?.rows||[]));
  const add=value=>{const d=dayOf(value);if(d)dates.add(d);};
  const unpack=value=>{if(typeof value==='string')try{value=JSON.parse(value);}catch(_){return [];}return Array.isArray(value)?value:Array.isArray(value?.rows)?value.rows:[];};
  (sources[0]?.rows||[]).filter(r=>!r.deleted).forEach(r=>add(r.workDate));
  for(const index of [2,3,4])(sources[index]?.rows||[]).filter(r=>!r.deleted).forEach(r=>add(r.date));
  for(const index of [5,6])for(const record of sources[index]?.rows||[]){let payload=record.payload;if(typeof payload==='string')try{payload=JSON.parse(payload);}catch(_){continue;}if(payload?.deleted)continue;unpack(payload).filter(r=>!r.deleted).forEach(r=>add(r.date));}
  for(const record of sources[7]?.rows||[]){if(record.record_key!=='erp:shipping')continue;unpack(record.payload).filter(r=>!r.deleted).forEach(r=>add(r.actualShipDate||r.shipDate||r.date));}
  (sources[8]?.rows||[]).filter(r=>!r.deleted).forEach(r=>add(r.occurred_on));
  return [...dates].sort((a,b)=>b.localeCompare(a));
 }
 function calendarCells(month,today,selected,recorded){
  const date=new Date(dayOf(month)+'T12:00:00Z');if(!Number.isFinite(date.getTime()))return [];
  const year=date.getUTCFullYear(),index=date.getUTCMonth(),leading=new Date(Date.UTC(year,index,1)).getUTCDay(),count=new Date(Date.UTC(year,index+1,0)).getUTCDate();
  const cells=Array.from({length:leading},()=>null);
  for(let number=1;number<=count;number++){const day=year+'-'+String(index+1).padStart(2,'0')+'-'+String(number).padStart(2,'0');cells.push({day,number,today:day===today,selected:day===selected,recorded:recorded.has(day)});}
  return cells;
 }
 function install(win){
  if(win.qmesLotDateSearch)return;const doc=win.document,root=doc.getElementById('lotTrace'),anchor=root?.querySelector('.lot-search-card');if(!anchor)return;
  const panel=doc.createElement('section');panel.className='lot-date-search';panel.setAttribute('aria-label','생산일자로 LOT 찾기');
  panel.innerHTML='<div class="lot-date-heading"><b>생산일자로 LOT 찾기</b><small>LOT 번호를 모를 때 날짜로 찾아 선택하세요.</small></div><div class="lot-date-filters"><label>조회 대상<select data-date-kind aria-label="조회 대상" disabled><option value="work">생산실적 · 작업지시서</option></select></label><label>시작일<input type="date" data-date-start></label><span class="lot-date-separator">~</span><label>종료일<input type="date" data-date-end></label><div class="lot-date-shortcuts"><button type="button" data-date-period="today">오늘</button><button type="button" data-date-period="week">이번 주</button><button type="button" data-date-period="month">이번 달</button></div><div class="lot-date-actions"><button type="button" data-date-reset>초기화</button><button type="button" class="primary" data-date-search>날짜 조회</button></div></div><p class="lot-date-help">작업지시서의 작업일·생산 LOT 기준으로 조회합니다. 수량은 작업지시서에 저장된 계획수량입니다. LOT를 누르면 아래에서 추적합니다.</p><div class="lot-date-message" role="status" aria-live="polite">기간을 선택하고 날짜 조회를 눌러주세요.</div><div class="lot-date-daily"></div><div class="lot-date-results"></div><div class="lot-date-pages"></div>';
  panel.id='lot-date-search-panel';panel.hidden=true;anchor.after(panel);
  const toggle=doc.createElement('button');toggle.type='button';toggle.className='lot-reset-btn lot-date-toggle';toggle.textContent='날짜로 찾기';toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-expanded','false');
  const range=doc.getElementById('lotRange');
  if(range?.parentElement){const controls=doc.createElement('div');controls.className='lot-range-controls';range.before(controls);controls.append(range,toggle);}else anchor.before(toggle);
  toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));if(panel.hidden)closeCalendar();else void loadSheetDates();});
  const $=selector=>panel.querySelector(selector),start=$('[data-date-start]'),end=$('[data-date-end]'),kind=$('[data-date-kind]');kind.value='work';
  let sequence=0,controller=null,rows=[],page=1,warning='';const size=30;
  const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  let popup=null,calendarAnchor=null,calendarMonth='',calendarDays=new Set(),calendarMessage='',calendarSequence=0,calendarController=null;
  const calendarCache=new Map();let sheetSequence=0,sheetController=null;
  [start,end].forEach(input=>{input.type='text';input.readOnly=true;input.setAttribute('inputmode','none');input.setAttribute('aria-haspopup','dialog');input.setAttribute('aria-expanded','false');});
  function closeCalendar(restoreFocus=false){
   calendarSequence++;calendarController?.abort();calendarController=null;
   popup?.remove();popup=null;const input=calendarAnchor;calendarAnchor=null;input?.setAttribute('aria-expanded','false');if(restoreFocus&&input?.isConnected)input.focus();
  }
  function placeCalendar(){
   if(!popup||!calendarAnchor?.isConnected||panel.hidden){if(popup)closeCalendar();return;}
   const rect=calendarAnchor.getBoundingClientRect(),width=Math.min(rect.width,win.innerWidth-16);popup.style.width=width+'px';
   const height=popup.getBoundingClientRect().height;popup.style.left=Math.max(8,Math.min(rect.left,win.innerWidth-width-8))+'px';
   popup.style.top=Math.max(8,rect.bottom+height+4<=win.innerHeight?rect.bottom+4:rect.top-height-4)+'px';
  }
  function drawCalendar(){
   if(!popup||!calendarAnchor)return;
   const cells=calendarCells(calendarMonth,today(),calendarAnchor.value,calendarDays);
   popup.innerHTML='<div class="lot-cal-head"><button type="button" data-cal-month="-1" aria-label="이전 달">‹</button><strong>'+calendarMonth.slice(0,7).replace('-','.')+'</strong><button type="button" data-cal-month="1" aria-label="다음 달">›</button></div><div class="lot-cal-grid">'+['일','월','화','수','목','금','토'].map(day=>'<span>'+day+'</span>').join('')+cells.map(cell=>!cell?'<span></span>':'<button type="button" data-cal-day="'+cell.day+'" class="'+[cell.today?'is-today':'',cell.recorded?'has-record':'',cell.selected?'is-selected':''].filter(Boolean).join(' ')+'"'+(cell.today?' aria-current="date"':'')+(cell.selected?' aria-pressed="true"':'')+' aria-label="'+cell.day+(cell.today?' 오늘':'')+(cell.recorded?' 생산기록 있음':'')+'">'+cell.number+'</button>').join('')+'</div><div class="lot-cal-legend"><span class="today">오늘</span><span class="record">기록일</span></div><div class="lot-cal-message" role="status">'+esc(calendarMessage)+'</div><div class="lot-cal-foot"><button type="button" data-cal-today>오늘</button><button type="button" data-cal-clear>초기화</button><button type="button" data-cal-close>닫기</button></div>';
   placeCalendar();
  }
  async function loadCalendarDays(){
   const source=kind.value,cached=calendarCache.get(source);
   if(cached&&Date.now()-cached.at<300000){calendarDays=recordDates(cached.rows);calendarMessage='작업지시서 작업일 기준';drawCalendar();return;}
   const request=++calendarSequence;calendarController?.abort();const active=new AbortController();calendarController=active;const timer=win.setTimeout(()=>active.abort(),15000);
   calendarMessage='기록일 조회 중';drawCalendar();
   try{
    const records=await read('/api/qmes/work-orders',active.signal);
    if(request!==calendarSequence||!popup||source!==kind.value)return;
    calendarCache.set(source,{at:Date.now(),rows:records});calendarDays=recordDates(records);calendarMessage='작업지시서 작업일 기준';drawCalendar();
   }catch(_){if(request===calendarSequence&&popup){calendarDays=new Set();calendarMessage='기록일 조회 실패';drawCalendar();}}
   finally{win.clearTimeout(timer);if(request===calendarSequence)calendarController=null;}
  }
  function openCalendar(input){
   if(calendarAnchor===input&&popup){closeCalendar(true);return;}
   closeCalendar();calendarAnchor=input;calendarMonth=(dayOf(input.value)||today()).slice(0,7)+'-01';calendarDays=new Set();calendarMessage='';
   popup=doc.createElement('div');popup.className='lot-date-calendar';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',input===start?'시작일 선택':'종료일 선택');doc.body.append(popup);input.setAttribute('aria-expanded','true');
   popup.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;event.preventDefault();
    if(button.dataset.calMonth){const month=new Date(calendarMonth+'T12:00:00Z');month.setUTCMonth(month.getUTCMonth()+Number(button.dataset.calMonth));calendarMonth=month.toISOString().slice(0,10);drawCalendar();}
    else if(button.dataset.calDay||button.hasAttribute('data-cal-today')||button.hasAttribute('data-cal-clear')){
     const target=calendarAnchor;target.value=button.dataset.calDay||(button.hasAttribute('data-cal-today')?today():'');closeCalendar(true);target.dispatchEvent(new win.Event('input',{bubbles:true}));target.dispatchEvent(new win.Event('change',{bubbles:true}));
    }else closeCalendar(true);
   });
   drawCalendar();void loadCalendarDays();
  }
  function renderSheetDates(){
   const dates=calendarCache.get('all')?.dates||sheetDatesFor(calendarCache.get('work')?.rows||[]),previous=$('[data-sheet-date]')?.value;
   $('.lot-date-daily').innerHTML=dates.length?'<label>통합시트 일자 (생산·입고·검사 전체) <select data-sheet-date>'+dates.map(date=>'<option value="'+date+'">'+date+'</option>').join('')+'</select></label><button type="button" class="primary" data-date-sheet>일자 통합시트 보기</button><span class="lot-sheet-date-count">전체 기록일 '+dates.length+'일</span>':'<span>조회된 생산·입고·검사 기록일이 없습니다.</span>';
   if(dates.length)$('[data-sheet-date]').value=dates.includes(previous)?previous:dates[0];
  }
  async function loadSheetDates(){
   const cache=calendarCache.get('all');if(cache&&Date.now()-cache.at<300000){renderSheetDates();return;}
   sheetController?.abort();const active=new AbortController(),request=++sheetSequence;sheetController=active;
   const timer=win.setTimeout(()=>active.abort(),15000);$('.lot-date-daily').textContent='전체 통합시트 일자를 불러오는 중입니다.';
   try{
    if(!win.qmesLotTrace?.readSources)throw Error('통합 조회를 준비 중입니다.');
    const sources=await win.qmesLotTrace.readSources('',active.signal);if(request!==sheetSequence)return;
    const dates=sheetDatesFromSources(sources);
    calendarCache.set('all',{at:Date.now(),dates});
    if(!sources[1]?.error)calendarCache.set('work',{at:Date.now(),rows:sources[1]?.rows||[]});renderSheetDates();
    const errors=sources.filter(s=>s.error).map(s=>s.label);
    if(errors.length){const note=doc.createElement('span');note.className='lot-sheet-date-count';note.textContent='일부 자료 조회 실패: '+errors.join(', ');$('.lot-date-daily').append(note);}
   }catch(_){if(request===sheetSequence)$('.lot-date-daily').innerHTML='<span>통합시트 일자를 불러오지 못했습니다.</span><button type="button" data-sheet-load>다시 조회</button>';}
   finally{win.clearTimeout(timer);if(request===sheetSequence)sheetController=null;}
  }
  function invalidate(){doc.dispatchEvent(new win.CustomEvent('qmes-lot-date-invalidated'));closeCalendar();sequence++;controller?.abort();controller=null;rows=[];page=1;warning='';$('[data-date-search]').disabled=false;$('.lot-date-results').replaceChildren();$('.lot-date-pages').replaceChildren();$('.lot-date-message').textContent='조건이 변경되었습니다. 날짜 조회를 눌러주세요.';}
  function setPeriod(value){const dates=period(value,today());start.value=dates.start;end.value=dates.end;invalidate();}
  function draw(){
   $('.lot-date-message').textContent=warning+start.value+' ~ '+end.value+' · 조회 '+rows.length+'건';
   renderSheetDates();
   const shown=rows.slice((page-1)*size,page*size);
   $('.lot-date-results').innerHTML=shown.length?'<div class="lot-date-scroll"><table><thead><tr><th>번호</th><th>'+ '작업일'+'</th><th>작업지시번호</th><th>제품명</th><th>생산 LOT</th><th>'+'계획수량'+' (kg)</th><th>작업자</th><th>상태</th><th>추적</th></tr></thead><tbody>'+shown.map((row,i)=>'<tr><td>'+((page-1)*size+i+1)+'</td><td>'+esc(row.date)+'</td><td>'+esc(row.number||'-')+'</td><td>'+esc(row.product||'-')+'</td><td><button type="button" class="lot-date-link" data-date-open="'+((page-1)*size+i)+'">'+esc(row.lot)+'</button></td><td>'+esc(row.quantity===undefined||row.quantity===null||row.quantity===''?'-':row.quantity)+'</td><td>'+esc(row.worker||'-')+'</td><td>'+esc(row.status)+'</td><td><button type="button" data-date-open="'+((page-1)*size+i)+'">LOT 추적</button></td></tr>').join('')+'</tbody></table></div>':'<p class="lot-date-empty">선택한 기간에 '+'생산기록'+'이 없습니다.</p>';
   const pages=Math.max(1,Math.ceil(rows.length/size));$('.lot-date-pages').innerHTML=pages>1?'<button type="button" data-date-page="-1" '+(page===1?'disabled':'')+'>이전</button><span>'+page+' / '+pages+'</span><button type="button" data-date-page="1" '+(page===pages?'disabled':'')+'>다음</button>':'';
  }
  async function read(url,signal){const response=await win.fetch(url,{credentials:'same-origin',cache:'no-store',signal});const result=await response.json();if(!response.ok||result.success===false||!Array.isArray(result.data))throw Error('자료 조회에 실패했습니다.');return result.data;}
  async function search(){
   const error=rangeError(start.value,end.value);if(error){$('.lot-date-message').textContent=error;return;}
   invalidate();const request=sequence,selected=kind.value,from=start.value,to=end.value;controller=new AbortController();const active=controller,timer=win.setTimeout(()=>active.abort(),20000);
   $('[data-date-search]').disabled=true;$('.lot-date-message').textContent='날짜별 '+'생산기록'+'을 조회하고 있습니다.';
   try{
    const orders=await read('/api/qmes/work-orders',active.signal);
    if(request!==sequence||kind.value!==selected||start.value!==from||end.value!==to)return;
    sheetSequence++;sheetController?.abort();sheetController=null;calendarCache.set('work',{at:Date.now(),rows:orders});
    rows=rowsFor(orders,from,to);page=1;draw();void loadSheetDates();
   }catch(_){if(request===sequence){$('.lot-date-message').textContent=active.signal.aborted?'조회 시간이 초과되었습니다. 다시 조회해 주세요.':'자료 조회에 실패했습니다. 다시 조회해 주세요.';$('.lot-date-results').replaceChildren();}}
   finally{win.clearTimeout(timer);if(request===sequence){controller=null;$('[data-date-search]').disabled=false;}}
  }
  panel.addEventListener('click',event=>{
   if(event.target===start||event.target===end){openCalendar(event.target);return;}
   const button=event.target.closest('button');if(!button||button.disabled)return;
   if(button.hasAttribute('data-sheet-load')){void loadSheetDates();}
   else if(button.hasAttribute('data-date-sheet')){const date=$('[data-sheet-date]').value;if(win.qmesLotDaily)win.qmesLotDaily.open(date);else $('.lot-date-message').textContent='통합시트를 준비 중입니다. 새로고침 후 다시 시도해 주세요.';}
   else if(button.hasAttribute('data-date-search'))search();
   else if(button.hasAttribute('data-date-reset')){setPeriod('month');$('.lot-date-message').textContent='기간을 선택하고 날짜 조회를 눌러주세요.';}
   else if(button.dataset.datePeriod)setPeriod(button.dataset.datePeriod);
   else if(button.dataset.datePage){page+=Number(button.dataset.datePage);draw();}
   else if(button.dataset.dateOpen!==undefined){const row=rows[Number(button.dataset.dateOpen)];if(!row)return;if(!win.qmesLotTrace?.openLot){$('.lot-date-message').textContent='LOT 추적 기능을 준비 중입니다. 새로고침 후 다시 시도해 주세요.';return;}win.qmesLotTrace.openLot(row.lot,row.mode);doc.getElementById('lotResultTitle')?.scrollIntoView({behavior:'smooth',block:'start'});}
  });
  [start,end,kind].forEach(input=>input.addEventListener('change',invalidate));panel.addEventListener('keydown',event=>{if((event.target===start||event.target===end)&&(event.key==='Enter'||event.key===' '||event.key==='F4'||event.altKey&&event.key==='ArrowDown')){event.preventDefault();openCalendar(event.target);return;}if(event.key==='Enter'&&event.target.matches('input,select')){event.preventDefault();search();}});
  function clearPrivate(){sheetSequence++;sheetController?.abort();sheetController=null;calendarCache.clear();$('.lot-date-daily').replaceChildren();invalidate();$('.lot-date-message').textContent='다시 조회해 주세요.';}
  doc.addEventListener('click',event=>{if(event.target.closest?.('[data-auth="logout"]'))clearPrivate();},true);win.addEventListener('qmes-authenticated',clearPrivate);
  doc.addEventListener('pointerdown',event=>{if(popup&&!popup.contains(event.target)&&event.target!==calendarAnchor)closeCalendar();},true);
  win.addEventListener('keydown',event=>{if(event.key==='Escape'&&popup){event.preventDefault();closeCalendar(true);}},true);
  win.addEventListener('resize',placeCalendar);win.addEventListener('scroll',placeCalendar,true);
  doc.addEventListener('qmes-lot-conditions-clear',()=>{kind.value='work';setPeriod('month');panel.hidden=true;toggle.setAttribute('aria-expanded','false');$('.lot-date-message').textContent='기간을 선택하고 날짜 조회를 눌러주세요.';});
  const style=doc.createElement('style');style.textContent=`
  #lotTrace .lot-date-search{margin:14px 0;border:1px solid #d5dce5;border-radius:5px;background:#fff;color:#244260;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;font-size:12px}.lot-date-heading{padding:12px 16px;border-bottom:1px solid #d5dce5;background:#f8fafc}.lot-date-heading b{font-size:13px;font-weight:700}.lot-date-heading small{margin-left:10px;color:#718397;font-size:11px;font-weight:500}.lot-date-filters{display:flex;align-items:flex-end;gap:9px;padding:14px 16px 8px;flex-wrap:wrap}.lot-date-filters label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:700;color:#64748b}.lot-date-filters input,.lot-date-filters select{height:32px;box-sizing:border-box;border:1px solid #cfd9e5;border-radius:4px;padding:0 8px;background:#fff;color:#244260;font-family:inherit;font-size:12px;font-weight:600}.lot-date-filters input{width:220px}.lot-date-separator{padding-bottom:7px}.lot-date-shortcuts,.lot-date-actions{display:flex;gap:6px}.lot-date-actions{margin-left:16px}.lot-date-search button{height:30px;padding:0 10px;border:1px solid #cfd7e1;border-radius:3px;background:#fff;color:#415267;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer}.lot-date-search button.primary{background:#2f8de4;border-color:#2f8de4;color:#fff}.lot-date-search button:disabled{opacity:.5;cursor:default}.lot-date-search :is(button,input,select):focus-visible{outline:2px solid #2f8de4;outline-offset:2px}.lot-date-help{margin:0;padding:0 16px 10px;color:#718397;font-size:11px;line-height:1.6}.lot-date-message{padding:8px 16px;border-top:1px solid #e1e7ee;font-size:12px;color:#526b85}.lot-date-scroll{overflow:auto}.lot-date-scroll table{width:100%;min-width:850px;border-collapse:collapse;font-size:12px}.lot-date-scroll th,.lot-date-scroll td{padding:9px 10px;text-align:center;border-top:1px solid #d5dce5;border-right:1px solid #d5dce5;vertical-align:middle;overflow-wrap:anywhere}.lot-date-scroll th{background:#edf3f9;font-weight:600}.lot-date-scroll th:last-child,.lot-date-scroll td:last-child{border-right:0}.lot-date-search button.lot-date-link{height:auto;padding:0;border:0;background:transparent;color:#1768ad;text-decoration:underline;font-size:12px}.lot-date-pages{display:flex;align-items:center;justify-content:center;gap:10px;padding:10px}.lot-date-pages:empty{display:none}.lot-date-empty{padding:18px;margin:0;text-align:center;color:#718397}@media(max-width:700px){.lot-date-heading small{display:block;margin:4px 0 0}.lot-date-filters input{width:190px}.lot-date-actions{margin-left:0;width:100%;justify-content:flex-start}}

  #lotTrace .lot-date-search[hidden]{display:none!important}
  #lotTrace .lot-range-controls{display:flex;align-items:center;gap:6px;min-width:0}
  #lotTrace .lot-range-controls>select{flex:1;min-width:75px;width:0}
  #lotTrace .lot-range-controls>.lot-date-toggle{flex:none;width:auto;padding:0 10px;white-space:nowrap}
  #lotTrace .lot-date-toggle[aria-expanded=true]{border-color:#2f8de4;background:#edf5ff;color:#1768ad}
  html body #lotTrace .lot-date-search{margin:0!important;border:0!important;border-bottom:1px solid #d5dce5!important;border-radius:0!important;background:#fff!important;box-shadow:none!important;color:#244260!important}
  html body #lotTrace .lot-date-heading{background:#f8fafc!important;border-bottom:1px solid #d5dce5!important}
  html body #lotTrace .lot-date-filters input,html body #lotTrace .lot-date-filters select{border:1px solid #cfd9e5!important;background:#fff!important;border-radius:4px!important;color:#244260!important;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;font-size:12px!important;font-weight:600!important;box-shadow:none!important}
  html body #lotTrace .lot-date-filters input{cursor:pointer;padding-right:28px!important;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2715%27 height=%2715%27 viewBox=%270 0 20 20%27 fill=%27none%27 stroke=%27%2365798e%27 stroke-width=%271.3%27%3E%3Crect x=%273%27 y=%274%27 width=%2714%27 height=%2713%27 rx=%272%27/%3E%3Cpath d=%27M3 8h14M7 2v4m6-4v4%27/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:right 8px center!important}
  html body #lotTrace .lot-date-scroll table{width:100%!important;border-collapse:collapse!important;border-spacing:0!important;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;box-shadow:none!important}
  html body #lotTrace .lot-date-scroll table th,html body #lotTrace .lot-date-scroll table td{height:auto!important;padding:9px 10px!important;border:0!important;border-top:1px solid #d5dce5!important;border-right:1px solid #d5dce5!important;text-align:center!important;vertical-align:middle!important;color:#244260!important;font-family:inherit!important;font-size:12px!important;line-height:1.5!important;font-weight:500!important}
  html body #lotTrace .lot-date-scroll table th{background:#edf3f9!important;font-weight:600!important}
  html body #lotTrace .lot-date-scroll table td{background:#fff!important}
  .lot-date-calendar{position:fixed;z-index:2147483200;box-sizing:border-box;max-height:calc(100dvh - 16px);overflow:auto;padding:6px;border:1px solid #b6c8dc;border-radius:4px;background:#fff;color:#244260;box-shadow:0 6px 18px #18304c26;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;font-size:10px}
  .lot-date-calendar *{box-sizing:border-box}.lot-date-calendar button{min-width:0;padding:0;margin:0;border:0;border-radius:3px;background:#fff;color:inherit;font:inherit;cursor:pointer}
  .lot-cal-head{display:flex;align-items:center;justify-content:space-between;gap:2px;border-bottom:1px solid #e1e7ee;padding-bottom:5px;margin-bottom:5px}.lot-cal-head button{width:20px;height:23px;font-size:18px}.lot-cal-head strong{font-size:11px;font-weight:700;white-space:nowrap}
  .lot-cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px;text-align:center}.lot-cal-grid>*{height:22px;line-height:22px;font-size:10px}.lot-cal-grid>span{color:#8290a0}.lot-cal-grid button{position:relative}
  .lot-cal-grid button:hover{box-shadow:inset 0 0 0 1px #2689ef}
  .lot-cal-grid button.has-record{background:#fff0ad;color:#79570a;font-weight:700}
  .lot-cal-grid button.is-today{background:#2689ef;color:#fff;font-weight:800}
  .lot-cal-grid button.is-today.has-record:after{content:"";position:absolute;bottom:1px;left:calc(50% - 2px);width:4px;height:4px;border-radius:50%;background:#ffe16b}
  .lot-cal-grid button.is-selected{box-shadow:inset 0 0 0 1px #174d7b}
  .lot-date-calendar button:focus-visible{outline:2px solid #2689ef;outline-offset:1px}
  .lot-cal-legend{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:6px;font-size:9px}.lot-cal-legend span:before{content:"";display:inline-block;width:7px;height:7px;margin-right:3px;border-radius:2px}.lot-cal-legend .today:before{background:#2689ef}.lot-cal-legend .record:before{background:#ffe16b}
  .lot-cal-message{text-align:center;margin-top:4px;color:#718397;font-size:9px}
  .lot-cal-foot{display:flex;justify-content:space-between;gap:3px;border-top:1px solid #e1e7ee;padding-top:5px;margin-top:5px}.lot-cal-foot button{height:23px;padding:0 4px;border:1px solid #cfd9e5;font-size:9px}

  html body #lotTrace .lot-date-scroll table th:last-child,html body #lotTrace .lot-date-scroll table td:last-child{border-right:0!important}
  html body #lotTrace .lot-date-search .lot-date-results,html body #lotTrace .lot-date-search .lot-date-scroll{margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#fff!important}
  html body #lotTrace .lot-date-search .lot-date-heading{border:0!important;border-bottom:1px solid #d5dce5!important;background:#f8fafc!important}
  html body #lotTrace .lot-date-search .lot-date-message{border:0!important;border-top:1px solid #e1e7ee!important;background:#fff!important}
  html body #lotTrace .lot-date-search .lot-date-pages:not(:empty){border-top:1px solid #d5dce5!important}
  html body #lotTrace .lot-date-filters [data-date-kind]:disabled{opacity:1!important;-webkit-text-fill-color:#52677e!important;color:#52677e!important;background:#f8fafc!important;cursor:default}
  .lot-date-daily{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 16px}.lot-date-daily:empty{display:none}.lot-sheet-date-count{color:#718397;font-size:11px}.lot-date-daily label{display:flex;align-items:center;gap:8px;font-size:12px;color:#52677e}.lot-date-daily select{height:30px;padding:0 8px;border:1px solid #cfd9e5;border-radius:4px;background:#fff;color:#244260;font:inherit}
  `;doc.head.append(style);setPeriod('month');$('.lot-date-message').textContent='기간을 선택하고 날짜 조회를 눌러주세요.';win.qmesLotDateSearch={clear:clearPrivate};
 }
 return {dayOf,rangeError,period,rowsFor,recordDates,sheetDatesFor,sheetDatesFromSources,calendarCells,install};
});
