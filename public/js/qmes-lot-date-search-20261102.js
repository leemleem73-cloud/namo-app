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
 function rowsFor(actual,orders,kind,start,end){
  if(rangeError(start,end))return [];
  const inRange=day=>day&&day>=start&&day<=end;
  const saved=orders.filter(row=>!row.deleted),byLot=new Map();
  for(const row of saved){const lot=norm(row.fields?.['생산 LOT NO']);if(!lot)continue;if(!byLot.has(lot))byLot.set(lot,[]);byLot.get(lot).push(row);}
  let rows=[];
  if(kind==='actual')rows=actual.filter(row=>!row.deleted&&inRange(dayOf(row.workDate))&&norm(row.finishedLot)&&!['-','NULL','UNDEFINED'].includes(norm(row.finishedLot))).map((row,index)=>{
   const matches=byLot.get(norm(row.finishedLot))||[],sameDay=matches.filter(order=>dayOf(order.workDate)===dayOf(row.workDate));
   const related=sameDay.length===1?sameDay[0]:matches.length===1?matches[0]:null;
   return {id:String(row.id??index),kind:'actual',date:dayOf(row.workDate),lot:String(row.finishedLot).trim(),number:related?.fields?.['작업지시번호']||'',product:related?.fields?.['제품명']||'',quantity:row.prodQty,worker:row.worker||'',status:'실적 등록',mode:related?.productionType==='중간배치'?'intermediate':'finished'};
  });
  else rows=saved.filter(row=>inRange(dayOf(row.workDate))&&norm(row.fields?.['생산 LOT NO'])&&!['-','NULL','UNDEFINED'].includes(norm(row.fields?.['생산 LOT NO']))).map((row,index)=>({id:String(row.id??index),kind:'work',date:dayOf(row.workDate),lot:String(row.fields['생산 LOT NO']).trim(),number:row.fields['작업지시번호']||row.id||'',product:row.fields['제품명']||'',quantity:row.fields['계획수량'],worker:row.fields['작업자']||'',status:row.fields['진행상태']||'미확인',mode:row.productionType==='중간배치'?'intermediate':'finished'}));
  return rows.sort((a,b)=>b.date.localeCompare(a.date)||a.lot.localeCompare(b.lot,'ko')||a.id.localeCompare(b.id));
 }
 function install(win){
  if(win.qmesLotDateSearch)return;const doc=win.document,root=doc.getElementById('lotTrace'),anchor=root?.querySelector('.lot-search-card');if(!anchor)return;
  const panel=doc.createElement('section');panel.className='lot-date-search';panel.setAttribute('aria-label','생산일자로 LOT 찾기');
  panel.innerHTML='<div class="lot-date-heading"><b>생산일자로 LOT 찾기</b><small>LOT 번호를 모를 때 날짜로 찾아 선택하세요.</small></div><div class="lot-date-filters"><label>조회 대상<select data-date-kind><option value="actual">생산실적 · 생산일</option><option value="work">작업지시 · 작업일</option></select></label><label>시작일<input type="date" data-date-start></label><span class="lot-date-separator">~</span><label>종료일<input type="date" data-date-end></label><div class="lot-date-shortcuts"><button type="button" data-date-period="today">오늘</button><button type="button" data-date-period="week">이번 주</button><button type="button" data-date-period="month">이번 달</button></div><div class="lot-date-actions"><button type="button" data-date-reset>초기화</button><button type="button" class="primary" data-date-search>날짜 조회</button></div></div><p class="lot-date-help">생산실적은 실제 생산일과 생산수량, 작업지시는 작업일과 계획수량 기준입니다. 날짜별 결과의 LOT를 누르면 아래에서 추적합니다.</p><div class="lot-date-message" role="status" aria-live="polite">기간을 선택하고 날짜 조회를 눌러주세요.</div><div class="lot-date-results"></div><div class="lot-date-pages"></div>';
  anchor.after(panel);
  const $=selector=>panel.querySelector(selector),start=$('[data-date-start]'),end=$('[data-date-end]'),kind=$('[data-date-kind]');
  let sequence=0,controller=null,rows=[],page=1,warning='';const size=30;
  const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function invalidate(){sequence++;controller?.abort();controller=null;rows=[];page=1;warning='';$('[data-date-search]').disabled=false;$('.lot-date-results').replaceChildren();$('.lot-date-pages').replaceChildren();$('.lot-date-message').textContent='조건이 변경되었습니다. 날짜 조회를 눌러주세요.';}
  function setPeriod(value){const dates=period(value,today());start.value=dates.start;end.value=dates.end;invalidate();}
  function draw(){
   $('.lot-date-message').textContent=warning+start.value+' ~ '+end.value+' · 조회 '+rows.length+'건';
   const shown=rows.slice((page-1)*size,page*size);
   $('.lot-date-results').innerHTML=shown.length?'<div class="lot-date-scroll"><table><thead><tr><th>번호</th><th>'+ (kind.value==='actual'?'생산일':'작업일')+'</th><th>작업지시번호</th><th>제품명</th><th>생산 LOT</th><th>'+(kind.value==='actual'?'생산수량':'계획수량')+' (kg)</th><th>작업자</th><th>상태</th><th>추적</th></tr></thead><tbody>'+shown.map((row,i)=>'<tr><td>'+((page-1)*size+i+1)+'</td><td>'+esc(row.date)+'</td><td>'+esc(row.number||'-')+'</td><td>'+esc(row.product||'-')+'</td><td><button type="button" class="lot-date-link" data-date-open="'+((page-1)*size+i)+'">'+esc(row.lot)+'</button></td><td>'+esc(row.quantity===undefined||row.quantity===null||row.quantity===''?'-':row.quantity)+'</td><td>'+esc(row.worker||'-')+'</td><td>'+esc(row.status)+'</td><td><button type="button" data-date-open="'+((page-1)*size+i)+'">LOT 추적</button></td></tr>').join('')+'</tbody></table></div>':'<p class="lot-date-empty">선택한 기간에 '+(kind.value==='actual'?'생산실적':'작업지시')+'이 없습니다.</p>';
   const pages=Math.max(1,Math.ceil(rows.length/size));$('.lot-date-pages').innerHTML=pages>1?'<button type="button" data-date-page="-1" '+(page===1?'disabled':'')+'>이전</button><span>'+page+' / '+pages+'</span><button type="button" data-date-page="1" '+(page===pages?'disabled':'')+'>다음</button>':'';
  }
  async function read(url,signal){const response=await win.fetch(url,{credentials:'same-origin',cache:'no-store',signal});const result=await response.json();if(!response.ok||result.success===false||!Array.isArray(result.data))throw Error('자료 조회에 실패했습니다.');return result.data;}
  async function search(){
   const error=rangeError(start.value,end.value);if(error){$('.lot-date-message').textContent=error;return;}
   invalidate();const request=sequence,selected=kind.value,from=start.value,to=end.value;controller=new AbortController();const active=controller,timer=win.setTimeout(()=>active.abort(),20000);
   $('[data-date-search]').disabled=true;$('.lot-date-message').textContent='날짜별 '+(selected==='actual'?'생산실적':'작업지시')+'을 조회하고 있습니다.';
   try{
    const sources=await Promise.allSettled([selected==='actual'?read('/api/worklog',active.signal):Promise.resolve([]),read('/api/qmes/work-orders',active.signal)]);
    if(request!==sequence||kind.value!==selected||start.value!==from||end.value!==to)return;
    const main=selected==='actual'?sources[0]:sources[1];if(main.status==='rejected')throw main.reason;
    const actual=sources[0].status==='fulfilled'?sources[0].value:[],orders=sources[1].status==='fulfilled'?sources[1].value:[];
    warning=selected==='actual'&&sources[1].status==='rejected'?'작업지시 조회 실패 · 제품명과 작업지시번호가 누락될 수 있습니다. ':'';
    rows=rowsFor(actual,orders,selected,from,to);page=1;draw();
   }catch(_){if(request===sequence){$('.lot-date-message').textContent=active.signal.aborted?'조회 시간이 초과되었습니다. 다시 조회해 주세요.':'자료 조회에 실패했습니다. 다시 조회해 주세요.';$('.lot-date-results').replaceChildren();}}
   finally{win.clearTimeout(timer);if(request===sequence){controller=null;$('[data-date-search]').disabled=false;}}
  }
  panel.addEventListener('click',event=>{
   const button=event.target.closest('button');if(!button||button.disabled)return;
   if(button.hasAttribute('data-date-search'))search();
   else if(button.hasAttribute('data-date-reset')){setPeriod('month');$('.lot-date-message').textContent='기간을 선택하고 날짜 조회를 눌러주세요.';}
   else if(button.dataset.datePeriod)setPeriod(button.dataset.datePeriod);
   else if(button.dataset.datePage){page+=Number(button.dataset.datePage);draw();}
   else if(button.dataset.dateOpen!==undefined){const row=rows[Number(button.dataset.dateOpen)];if(!row)return;if(!win.qmesLotTrace?.openLot){$('.lot-date-message').textContent='LOT 추적 기능을 준비 중입니다. 새로고침 후 다시 시도해 주세요.';return;}win.qmesLotTrace.openLot(row.lot,row.mode);doc.getElementById('lotResultTitle')?.scrollIntoView({behavior:'smooth',block:'start'});}
  });
  [start,end,kind].forEach(input=>input.addEventListener('change',invalidate));panel.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.matches('input,select')){event.preventDefault();search();}});
  function clearPrivate(){invalidate();$('.lot-date-message').textContent='다시 조회해 주세요.';}
  doc.addEventListener('click',event=>{if(event.target.closest?.('[data-auth="logout"]'))clearPrivate();},true);win.addEventListener('qmes-authenticated',clearPrivate);
  const style=doc.createElement('style');style.textContent=`
  #lotTrace .lot-date-search{margin:14px 0;border:1px solid #d5dce5;border-radius:5px;background:#fff;color:#244260;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;font-size:12px}.lot-date-heading{padding:12px 16px;border-bottom:1px solid #d5dce5;background:#f8fafc}.lot-date-heading b{font-size:13px;font-weight:700}.lot-date-heading small{margin-left:10px;color:#718397;font-size:11px;font-weight:500}.lot-date-filters{display:flex;align-items:flex-end;gap:9px;padding:14px 16px 8px;flex-wrap:wrap}.lot-date-filters label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:700;color:#64748b}.lot-date-filters input,.lot-date-filters select{height:32px;box-sizing:border-box;border:1px solid #cfd9e5;border-radius:4px;padding:0 8px;background:#fff;color:#244260;font-family:inherit;font-size:12px;font-weight:600}.lot-date-filters input{width:155px}.lot-date-separator{padding-bottom:7px}.lot-date-shortcuts,.lot-date-actions{display:flex;gap:6px}.lot-date-actions{margin-left:auto}.lot-date-search button{height:30px;padding:0 10px;border:1px solid #cfd7e1;border-radius:3px;background:#fff;color:#415267;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer}.lot-date-search button.primary{background:#2f8de4;border-color:#2f8de4;color:#fff}.lot-date-search button:disabled{opacity:.5;cursor:default}.lot-date-search :is(button,input,select):focus-visible{outline:2px solid #2f8de4;outline-offset:2px}.lot-date-help{margin:0;padding:0 16px 10px;color:#718397;font-size:11px;line-height:1.6}.lot-date-message{padding:8px 16px;border-top:1px solid #e1e7ee;font-size:12px;color:#526b85}.lot-date-scroll{overflow:auto}.lot-date-scroll table{width:100%;min-width:850px;border-collapse:collapse;font-size:12px}.lot-date-scroll th,.lot-date-scroll td{padding:9px 10px;text-align:center;border-top:1px solid #d5dce5;border-right:1px solid #d5dce5;vertical-align:middle;overflow-wrap:anywhere}.lot-date-scroll th{background:#edf3f9;font-weight:600}.lot-date-scroll th:last-child,.lot-date-scroll td:last-child{border-right:0}.lot-date-search button.lot-date-link{height:auto;padding:0;border:0;background:transparent;color:#1768ad;text-decoration:underline;font-size:12px}.lot-date-pages{display:flex;align-items:center;justify-content:center;gap:10px;padding:10px}.lot-date-pages:empty{display:none}.lot-date-empty{padding:18px;margin:0;text-align:center;color:#718397}@media(max-width:700px){.lot-date-heading small{display:block;margin:4px 0 0}.lot-date-filters input{width:140px}.lot-date-actions{width:100%;justify-content:flex-end}}
  `;doc.head.append(style);setPeriod('month');$('.lot-date-message').textContent='기간을 선택하고 날짜 조회를 눌러주세요.';win.qmesLotDateSearch={clear:clearPrivate};
 }
 return {dayOf,rangeError,period,rowsFor,install};
});
