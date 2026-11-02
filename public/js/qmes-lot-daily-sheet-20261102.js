/* One read-only sheet for all production LOTs on a selected work-order date. */
(function(factory){'use strict';const core=factory();if(typeof module==='object'&&module.exports)module.exports=core;if(typeof window!=='undefined'&&window.document)core.install(window);})(function(){
 'use strict';
 const norm=v=>String(v??'').trim().toUpperCase(),day=v=>String(v||'').slice(0,10);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.getTime())&&day(d.toISOString())===value;}
 function text(value){if(value===undefined||value===null||value==='')return '-';if(Array.isArray(value))return value.map(text).join(' / ');if(typeof value==='object')return Object.entries(value).map(([k,v])=>k+': '+text(v)).join(' · ');return String(value);}
 function parse(v){if(typeof v==='string'){try{return JSON.parse(v);}catch(_){return {};}}return v||{};}
 function inspectionDetail(row){
  const checks=row.__groupChecks||[row];
  return checks.map(check=>{
   const items=parse(check.items_json||check.items||[]),list=Array.isArray(items)?items:Array.isArray(items.rows)?items.rows:[];
   if(list.length)return list.map(item=>text(item.name||item.check)+' · '+text(item.value??item.measurements??item.result)+' · '+text(item.judge)).join('\n');
   return [check.check||check.name||'검사내용',text(check.measurements??check.value??check.result??check.overall),check.judge||check.inspectionDecision||'판정 미확인'].join(' · ');
  }).join('\n');
 }
 function buildDay(sources,date,buildGraph){
  if(!validDate(date))throw Error('조회할 날짜를 확인해 주세요.');
  if(!sources[1]||sources[1].error)throw Error('작업지시서를 불러오지 못해 통합 이력을 만들 수 없습니다.');
  const orders=sources[1].rows.filter(row=>!row.deleted&&day(row.workDate||row.fields?.['작업일자'])===date&&norm(row.fields?.['생산 LOT NO'])&&!['-','NULL','UNDEFINED'].includes(norm(row.fields?.['생산 LOT NO'])));
  const lots=new Map();for(const order of orders){const lot=norm(order.fields['생산 LOT NO']);if(!lots.has(lot))lots.set(lot,[]);lots.get(lot).push(order);}
  const entries=[],inspectionKeys=new Set(),ncrKeys=new Set(),shippingKeys=new Set();
  for(const [lot,dayOrders] of lots){
   const graph=buildGraph(sources,lot,dayOrders.every(o=>o.productionType==='중간배치')?'intermediate':'finished');
   const add=(type,date,eventLot,title,detail,status)=>entries.push({lot,type,date:day(date),eventLot:eventLot||lot,title,detail,status:status||'미확인'});
   for(const row of dayOrders){const f=row.fields||{};add('작업지시',date,lot,f['작업지시번호']||row.id,[f['제품명']||'-','계획수량 '+text(f['계획수량'])+' kg','작업자 '+text(f['작업자'])].join(' · '),f['진행상태']);
    for(const material of row.materials||[])add('원료 투입',date,material.lot,material.name,'계획 '+text(material.plan)+' kg · 실투입 '+text(material.actual)+' kg','저장된 투입내역');
   }
   for(const row of graph.actual.filter(r=>norm(r.finishedLot)===lot))add('작업실적',row.workDate,row.lotNo,row.material,'실투입 '+text(row.inputQty)+' · 공급업체 '+text(row.supName),'실적 등록');
   for(const group of graph.groups)for(const row of group.rows){const key=JSON.stringify([group.type,row.id||'',row.lot,row.date,row.check||'']);inspectionKeys.add(key);add({iqc:'수입검사',pqc:'공정검사',oqc:'출하검사'}[group.type],row.date,row.lot,row.item||row.product||row.check||group.title,inspectionDetail(row),row.judge||row.inspectionDecision||'검사내용 확인');}
   for(const row of graph.ncr||[]){ncrKeys.add(String(row.id||row.report_no));add('부적합',row.occurred_on,row.lot,row.report_no||'부적합보고서',[row.description,row.containment&&'긴급조치: '+row.containment,row.corrective_action&&'시정조치: '+row.corrective_action].filter(Boolean).join('\n'),{OPEN:'발행',IN_PROGRESS:'조치중',CLOSED:'완료'}[row.status]||row.status);}
   for(const row of graph.shipping){shippingKeys.add(JSON.stringify([row.id||row.shipmentNo||row.no,row.lot||row.finishedLot,row.shipDate||row.date]));add('출하',row.actualShipDate||row.shipDate||row.date,row.lot||row.finishedLot||row.productionLot,row.shipmentNo||row.no||row.id,[row.customer,row.product||row.item,'출하수량 '+text(row.shipmentQty??row.qty??row.quantity)].filter(Boolean).join(' · '),row.deliveryStatus||row.delivery||row.status||row.shipping);}
  }
  return {date,orders,entries,lotCount:lots.size,inspectionCount:inspectionKeys.size,ncrCount:ncrKeys.size,shippingCount:shippingKeys.size,errors:sources.filter(s=>s.error).map(s=>s.label)};
 }
 function table(headers,rows){return '<div class="lot-day-table"><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(value=>'<td>'+esc(text(value))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
 function markup(model){
  if(!model.orders.length)return '<p class="lot-day-empty">'+esc(model.date)+'에 해당하는 작업지시서와 생산 LOT가 없습니다.</p>';
  const warning=model.errors.length?'<p class="lot-day-warning">일부 자료 조회 실패: '+model.errors.map(esc).join(', ')+' · 아래 내용은 조회된 자료만 포함합니다.</p>':'';
  return warning+'<div class="lot-day-summary"><span>생산 LOT <b>'+model.lotCount+'</b>건</span><span>작업지시 <b>'+model.orders.length+'</b>건</span><span>검사 <b>'+model.inspectionCount+'</b>건</span><span>부적합 <b>'+model.ncrCount+'</b>건</span><span>출하 <b>'+model.shippingCount+'</b>건</span></div><p class="lot-day-note">기준일은 작업지시서의 작업일입니다. 연결된 검사·출하가 다른 날에 진행됐으면 실제 이력 날짜를 표시합니다. 계획수량과 실투입량은 구분해 확인하세요.</p><h3>01 · 해당 날짜의 생산 LOT</h3>'+table(['작업일','작업지시번호','생산 LOT','제품명','계획수량 (kg)','작업자','진행상태'],model.orders.map(row=>{const f=row.fields||{};return [model.date,f['작업지시번호']||row.id,f['생산 LOT NO'],f['제품명'],f['계획수량'],f['작업자'],f['진행상태']];}))+'<h3>02 · LOT별 통합 이력</h3>'+table(['기준 생산 LOT','이력 구분','이력 날짜','해당 LOT','문서 / 항목','기록 내용','판정 / 상태'],model.entries.map(row=>[row.lot,row.type,row.date||'-',row.eventLot,row.title,row.detail,row.status]));
 }
 function install(win){
  if(win.qmesLotDaily)return;const doc=win.document;let viewer=null,controller=null,serial=0;
  function close(){serial++;controller?.abort();controller=null;const old=viewer;viewer=null;if(old){old.close();old.remove();}}
  async function open(date){
   close();if(!validDate(date))return;
   const request=serial,dialog=doc.createElement('dialog');viewer=dialog;dialog.className='lot-day-sheet';dialog.setAttribute('aria-label',date+' 일자 통합 이력');
   dialog.innerHTML='<header><div><strong>일자별 LOT 통합 이력</strong><span>'+esc(date)+' · 해당 날짜의 생산 LOT 전체</span></div><button type="button" data-day-close>닫기</button></header><div class="lot-day-body" role="status">통합 이력을 불러오는 중입니다.</div>';
   const previous=doc.activeElement;dialog.querySelector('[data-day-close]').onclick=close;dialog.addEventListener('close',()=>{if(viewer===dialog){controller?.abort();viewer=null;serial++;}dialog.remove();if(previous?.isConnected)previous.focus();},{once:true});
   doc.body.append(dialog);dialog.showModal();dialog.querySelector('[data-day-close]').focus();
   if(!win.qmesLotTrace?.readSources||!win.qmesLotTrace?.buildGraph){dialog.querySelector('.lot-day-body').textContent='통합 조회 기능을 준비 중입니다. 새로고침 후 다시 시도해 주세요.';return;}
   const active=new AbortController();controller=active;const timer=win.setTimeout(()=>active.abort(),25000);
   try{const sources=await win.qmesLotTrace.readSources('',active.signal);if(request!==serial||viewer!==dialog||!dialog.open)return;const model=buildDay(sources,date,win.qmesLotTrace.buildGraph);dialog.querySelector('.lot-day-body').innerHTML=markup(model);}
   catch(error){if(request===serial&&viewer===dialog)dialog.querySelector('.lot-day-body').textContent=active.signal.aborted?'조회 시간이 초과되었습니다. 다시 열어주세요.':error.message||'통합 이력을 불러오지 못했습니다.';}
   finally{win.clearTimeout(timer);if(request===serial)controller=null;}
  }
  doc.addEventListener('qmes-lot-date-invalidated',close);doc.addEventListener('click',event=>{if(event.target.closest?.('[data-auth="logout"]'))close();},true);win.addEventListener('qmes-authenticated',close);
  const style=doc.createElement('style');style.textContent=`
  .lot-day-sheet{box-sizing:border-box;width:min(1320px,calc(100vw - 32px));max-height:92dvh;margin:auto;padding:0;overflow:auto;border:1px solid #d5dce5;border-radius:6px;background:#fff;color:#244260;font:12px/1.6 Pretendard,"Noto Sans KR",Arial,sans-serif}.lot-day-sheet::backdrop{background:rgba(24,49,75,.4)}.lot-day-sheet>header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px;border-bottom:1px solid #d5dce5;background:#fff}.lot-day-sheet header strong{display:block;font-size:18px;font-weight:800;color:#173b61}.lot-day-sheet header span{display:block;margin-top:4px;font-size:12px;color:#64748b}.lot-day-sheet button{height:30px;padding:0 12px;border:1px solid #cfd7e1;border-radius:4px;background:#fff;color:#415267;font:600 12px Pretendard,"Noto Sans KR",Arial,sans-serif;cursor:pointer}.lot-day-sheet button:focus-visible{outline:2px solid #2f8de4;outline-offset:2px}.lot-day-body{padding:16px 18px}.lot-day-summary{display:flex;flex-wrap:wrap;gap:10px 24px;padding:10px 12px;border:1px solid #d5dce5;border-radius:4px;background:#f8fafc}.lot-day-summary b{color:#1768ad}.lot-day-note{color:#64748b;font-size:11px}.lot-day-body h3{margin:18px 0 8px;font-size:13px;font-weight:700}.lot-day-table{overflow:auto;border:1px solid #d5dce5;border-radius:4px}.lot-day-table table{width:100%;min-width:900px;border:0;border-collapse:separate;border-spacing:0;font-size:12px}.lot-day-table :is(thead,tbody,tr){border:0}.lot-day-table :is(th,td){padding:8px 9px;border:0;border-right:1px solid #d5dce5;border-bottom:1px solid #d5dce5;vertical-align:middle;text-align:center;white-space:pre-wrap;overflow-wrap:anywhere;font-weight:500}.lot-day-table th{background:#edf3f9;font-weight:600;white-space:nowrap}.lot-day-table tr>:last-child{border-right:0}.lot-day-table tbody tr:last-child>td{border-bottom:0}.lot-day-warning{padding:10px 12px;border:1px solid #f0d9b2;background:#fff8e9;color:#885c18;border-radius:4px}.lot-day-empty{padding:24px;text-align:center;color:#718397}
  `;doc.head.append(style);win.qmesLotDaily={open,close};
 }
 return {validDate,buildDay,markup,install};
});
