/* Purchase list frame only. Preserve native registration, detail navigation and data APIs. */
(()=>{'use strict';
const selected=new Set();let wired=false,busy=false,queued=false;
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const key=row=>String(row.id||row.purchaseNo||row.no||'');
function init(){
 const root=document.querySelector('#purchase'),shell=root?.querySelector('.module-shell'),toolbar=shell?.querySelector('.module-toolbar'),filters=toolbar?.querySelector('.filters'),api=window.qmesPurchaseList;
 if(wired||!api||!filters?.querySelector('.qpu-supplier')||!filters.querySelector('.pcal-root'))return;
 wired=true;root.classList.add('purchase-work-frame');
 const head=root.querySelector('.page-head'),tools=toolbar.querySelector('.table-tools');head.classList.add('qpf-header');head.querySelector('h1').textContent='구매발주 등록 및 조회';head.querySelector('p')?.remove();head.querySelector('.date-badge')?.remove();if(tools)head.append(tools);shell.prepend(head);
 const search=filters.querySelector('.search-input'),supplier=filters.querySelector('.qpu-supplier'),status=filters.querySelector('.qpu-status'),calendar=filters.querySelector('.pcal-root'),clear=filters.querySelector('.qpu-clear'),query=filters.querySelector('.qpu-search');
 function field(title,input){const label=document.createElement('div');label.className='qpf-field';const name=document.createElement('span');name.textContent=title;label.append(name,input);return label;}
 const material=document.createElement('input');material.className='input qpf-material';material.placeholder='전체';
 const number=document.createElement('input');number.className='input qpf-number';number.placeholder='전체';
 supplier.dataset.iqcFilter='supplier';supplier.placeholder='전체';supplier.onclick=null;
 // Move original controls so their native handlers (including the range calendar) remain connected.
 const grid=document.createElement('div');grid.className='qpf-grid';grid.append(field('공급업체',supplier),field('품목명',material),field('발주번호',number),field('발주상태',status),field('발주기간',calendar),field('통합검색',search));
 filters.append(grid);filters.querySelector('.qpu-more').hidden=true;
 const actions=document.createElement('div');actions.className='qpf-actions';const count=document.createElement('span');count.className='qpf-count';const buttons=document.createElement('div');buttons.className='qpf-buttons';
 const print=document.createElement('button'),mail=document.createElement('button'),remove=document.createElement('button');
 for(const [button,cls,text] of [[print,'qpf-print','선택 인쇄'],[mail,'qpf-mail','선택 메일 전송'],[remove,'qpf-delete','선택 삭제']]){button.type='button';button.className='btn '+cls;button.textContent=text;button.hidden=true;buttons.append(button);}
 clear.textContent='조건 지우기';query.textContent='조회';buttons.append(clear,query);filters.querySelector('.qpu-more')?.remove();actions.append(count,buttons);toolbar.append(actions);
 const listHead=document.createElement('div');listHead.className='qpf-list-head';listHead.innerHTML='<span>▸ 구매발주 현황</span><span class="qpf-total"></span>';const wrap=shell.querySelector('.module-body');wrap.before(listHead);
 const detail=root.querySelector('.qpu-detail');if(detail)shell.after(detail);
 if(typeof wireIncomingSupplierPicker==='function')wireIncomingSupplierPicker(root,{rows:api.rows,onApply:api.render});
 clear.onclick=()=>{root._iqcSupplierSelection?.clear();[search,supplier,material,number,...filters.querySelectorAll('input[type=date]')].forEach(input=>input.value='');status.value='';api.render();};query.onclick=api.render;
 function docs(){return api.rows().filter(row=>selected.has(key(row)));}
 function update(){
  const valid=new Set(api.rows().map(key));for(const id of selected)if(!valid.has(id))selected.delete(id);
  const matches=api.filtered(),matched=matches.filter(row=>selected.has(key(row))).length;
  const all=wrap.querySelector('.qpf-check-all');if(all){all.checked=!!matches.length&&matched===matches.length;all.indeterminate=matched>0&&matched<matches.length;}
  wrap.querySelectorAll('.qpf-check').forEach(box=>{box.checked=selected.has(box.closest('tr').dataset.purchaseKey);box.disabled=busy;});
  for(const [button,title] of [[print,'선택 인쇄'],[mail,'선택 메일 전송'],[remove,'선택 삭제']]){button.hidden=!selected.size;button.disabled=busy;button.textContent=title+' ('+selected.size+')';}
  wrap.querySelectorAll('.qpp-row-action').forEach(button=>button.disabled=busy);
  count.textContent='조회 '+matches.length+'건';listHead.querySelector('.qpf-total').textContent='총 '+matches.length+'건';
 }
 function decorate(){
  const th=wrap.querySelector('thead th:first-child');if(th&&!th.querySelector('.qpf-check-all')){th.replaceChildren();const label=document.createElement('label');label.className='qpf-select';label.innerHTML='<input class="qpf-check-all" type="checkbox" aria-label="조회된 발주 전체 선택"><span>No.</span>';th.append(label);label.querySelector('input').onchange=event=>{api.filtered().forEach(row=>event.target.checked?selected.add(key(row)):selected.delete(key(row)));update();};}
  wrap.querySelectorAll('tbody tr[data-purchase-key]').forEach(row=>{const td=row.cells[0];if(td.querySelector('.qpf-check'))return;const value=td.textContent.trim(),label=document.createElement('label');label.className='qpf-select';const box=document.createElement('input');box.type='checkbox';box.className='qpf-check';box.setAttribute('aria-label',value+'번 발주 선택');const num=document.createElement('span');num.textContent=value;label.append(box,num);td.replaceChildren(label);box.onchange=()=>{box.checked?selected.add(row.dataset.purchaseKey):selected.delete(row.dataset.purchaseKey);update();};});
  wrap.querySelectorAll('tbody tr[data-purchase-key]').forEach(row=>{const cell=row.cells[row.cells.length-1];if(!cell||cell.querySelector('.qpp-row-actions'))return;const group=document.createElement('span');group.className='qpp-row-actions';for(const [action,title] of [['print','인쇄'],['edit','수정'],['delete','삭제']]){const button=document.createElement('button');button.type='button';button.className='qpp-row-action qpp-row-'+action;button.dataset.purchaseAction=action;button.textContent=title;group.append(button);}cell.append(group);});update();
 }
 const recordUrl=record=>'/api/purchase-orders/'+encodeURIComponent(key(record));
 async function request(url,options={}){const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options}),result=await response.json().catch(()=>({}));if(!response.ok||result.success===false)throw Error(result.message||'요청 실패 ('+response.status+')');return result.data??result;}
 async function printRecord(record){const win=window.open('','_blank');if(!win){alert('팝업을 허용한 후 다시 인쇄해 주세요.');return;}try{const saved=await request(recordUrl(record));const columns=[['발주번호',record.displayPurchaseNo||saved.purchaseNo||saved.no],['공급업체',saved.supplier],['발주일자',saved.orderDate],['요청입고일',saved.requestedDueDate||saved.due],['확정입고일',saved.confirmedDueDate||saved.expected],['발주상태',saved.status],['비고',saved.notes]];const items=Array.isArray(saved.items)&&saved.items.length?saved.items:[saved];win.addEventListener('load',()=>win.print(),{once:true});win.document.write('<!doctype html><html lang="ko"><meta charset="UTF-8"><title>구매발주서</title><style>@page{size:A4;margin:15mm}body{font:13px Arial,"Malgun Gothic",sans-serif;color:#243e59}h1{text-align:center}table{width:100%;border-collapse:collapse;margin:18px 0}td,th{border:1px solid #bdcddd;padding:10px}th{background:#eaf2fa}tr{break-inside:avoid}</style><h1>구매발주서</h1><p>나모케미칼(주)</p><table>'+columns.map(([name,value])=>'<tr><th>'+escape(name)+'</th><td>'+escape(value||'—')+'</td></tr>').join('')+'</table><table><thead><tr><th>품목명</th><th>규격</th><th>단위</th><th>수량</th><th>단가</th><th>공급가</th></tr></thead><tbody>'+items.map(item=>'<tr>'+[item.item||item.material,item.spec,item.unit||'kg',item.qty,item.unitPrice??item.price??0,item.amount??Number(item.qty||0)*Number(item.unitPrice??item.price??0)].map(value=>'<td>'+escape(value??'—')+'</td>').join('')+'</tr>').join('')+'</tbody></table></html>');win.document.close();}catch(error){win.close?.();alert(error.message);}}
 async function editRecord(record){
  let saved;try{saved=await request(recordUrl(record));}catch(error){alert(error.message);return;}
  if(document.querySelector('#qpp-edit-dialog'))return;
  const dialog=document.createElement('dialog');dialog.id='qpp-edit-dialog';dialog.setAttribute('aria-label','구매발주 수정');
  const fields=[['orderDate','발주일자','date'],['supplier','공급업체','text'],['item','품목명','text'],['spec','규격','text'],['qty','발주수량','number'],['unitPrice','단가','number'],['requestedDueDate','요청입고일','date'],['confirmedDueDate','확정입고일','date'],['notes','비고','text']];
  const original={...saved,item:saved.item||saved.material||'',unitPrice:saved.unitPrice??saved.price??0,requestedDueDate:saved.requestedDueDate||saved.due||'',confirmedDueDate:saved.confirmedDueDate||saved.expected||''};
  dialog.innerHTML='<form><header><strong>구매발주 수정</strong><button type="button" class="qpp-edit-cancel" aria-label="닫기">×</button></header><p>'+escape(record.displayPurchaseNo||saved.purchaseNo||saved.no||key(record))+'</p><div class="qpp-edit-fields">'+fields.map(([name,title,type])=>'<label><span>'+title+'</span><input name="'+name+'" type="'+type+'" value="'+escape(original[name]??'')+'"'+(['supplier','item','qty','orderDate'].includes(name)?' required':'')+(type==='number'?' min="'+(name==='qty'?'0.000001':'0')+'" step="any"':'')+'></label>').join('')+'</div><p class="qpp-edit-message" role="status"></p><footer><button type="button" class="qpp-edit-cancel">취소</button><button type="submit" class="qpp-edit-save">저장</button></footer></form>';
  document.body.append(dialog);const close=()=>{if(!dialog.querySelector('.qpp-edit-save').disabled){dialog.close();dialog.remove();}};dialog.querySelectorAll('.qpp-edit-cancel').forEach(button=>button.onclick=close);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.showModal();
  dialog.querySelector('form').onsubmit=async event=>{event.preventDefault();const submit=dialog.querySelector('.qpp-edit-save');if(submit.disabled)return;const changes={};for(const [name,,type] of fields){const value=dialog.querySelector('[name="'+name+'"]').value.trim();if(String(original[name]??'')!==value)changes[name]=type==='number'?Number(value):value;}
   if(!Object.keys(changes).length){close();return;}
   if('qty'in changes||'unitPrice'in changes)changes.amount=Number(changes.qty??original.qty)*Number(changes.unitPrice??original.unitPrice);
   submit.disabled=true;try{await request(recordUrl(record),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(changes)});dialog.close();dialog.remove();await api.reload();}catch(error){dialog.querySelector('.qpp-edit-message').textContent=error.message;submit.disabled=false;}
  };
 }
 wrap.addEventListener('click',async event=>{const button=event.target.closest('.qpp-row-action');if(!button)return;event.preventDefault();event.stopImmediatePropagation();if(busy)return;const record=api.rows().find(row=>key(row)===button.closest('tr').dataset.purchaseKey);if(!record){alert('발주 데이터를 찾을 수 없습니다. 다시 조회해 주세요.');return;}
  if(button.dataset.purchaseAction==='print'){await printRecord(record);return;}
  if(button.dataset.purchaseAction==='edit'){await editRecord(record);return;}
  if(!confirm((record.displayPurchaseNo||record.purchaseNo||record.no||'선택한 발주')+' 발주를 삭제하시겠습니까?'))return;
  busy=true;update();try{await request(recordUrl(record),{method:'DELETE'});selected.delete(key(record));await api.reload();}catch(error){alert(error.message);}finally{busy=false;update();}
 },true);
 wrap.addEventListener('click',event=>{if(event.target.closest('.qpf-select'))event.stopPropagation();},true);
 print.onclick=()=>{
  const records=docs();if(!records.length)return;
  const win=window.open('','_blank');if(!win){alert('팝업을 허용한 후 다시 인쇄해 주세요.');return;}
  const columns=['발주번호','발주일자','공급업체','품목명','수량(kg)','요청입고','발주상태'];
  const rows=records.map(row=>[row.displayPurchaseNo||row.purchaseNo||row.no,row.orderDate,row.supplier,row.item||row.material,row.qty,row.requestedDueDate||row.due,row.status]);
  win.addEventListener('load',()=>win.print(),{once:true});
  win.document.write('<!doctype html><html lang="ko"><meta charset="utf-8"><title>구매발주 선택 인쇄</title><style>@page{size:A4 landscape;margin:12mm}body{font:12px Arial,"Malgun Gothic",sans-serif;color:#172033}h1{text-align:center;font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #c5d2e1;padding:8px;text-align:center}th{background:#e8f0f8}tr{break-inside:avoid}</style><h1>나모케미칼 구매발주 현황</h1><p>선택 '+records.length+'건</p><table><thead><tr>'+columns.map(text=>'<th>'+escape(text)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(values=>'<tr>'+values.map(value=>'<td>'+escape(value??'-')+'</td>').join('')+'</tr>').join('')+'</tbody></table></html>');win.document.close();
 };
 mail.onclick=()=>{const records=docs();if(!records.length)return;const lines=records.map((row,index)=>(index+1)+'. '+(row.displayPurchaseNo||row.purchaseNo||row.no||'-')+' / '+(row.supplier||'-')+' / '+(row.item||row.material||'-')+' / '+(row.qty??'-')+' kg');location.href='mailto:?subject='+encodeURIComponent('[나모케미칼 QMES] 구매발주 '+records.length+'건 전달')+'&body='+encodeURIComponent('안녕하세요.\n\n구매발주 내역을 전달드립니다.\n\n'+lines.join('\n')+'\n\n감사합니다.');};
 remove.onclick=async()=>{
  if(busy)return;const records=docs();if(!records.length||!confirm('선택한 구매발주 '+records.length+'건을 삭제하시겠습니까?'))return;
  busy=true;update();let deleted=0;
  try{for(const row of records){const response=await fetch('/api/purchase-orders/'+encodeURIComponent(row.id||row.purchaseNo||row.no),{method:'DELETE',credentials:'same-origin'});const result=await response.json();if(!response.ok||result.success===false)throw Error(result.message||'발주 삭제 실패');selected.delete(key(row));deleted++;}}
  catch(error){alert(error.message+(deleted?' ('+deleted+'건 삭제 완료)':''));}
  finally{busy=false;await api.reload();update();}
 };
 function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorate();});}
 new MutationObserver(schedule).observe(wrap.querySelector('tbody'),{childList:true});document.addEventListener('qmes-purchase-list-render',schedule);decorate();

 // Match the current work-order inquiry tools while retaining native handlers.
 const headTools=document.createElement('div');headTools.className='qow-head-tools';
 query.textContent='';query.setAttribute('aria-label','조회');query.dataset.workTooltip='조회';query.innerHTML='<svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.75"/><path d="m13 13 4 4"/></svg>';
 const toggle=document.createElement('button');toggle.type='button';toggle.className='btn qpp-toggle';wrap.id='qpp-result-list';const pager=shell.querySelector('.qpu-pager');if(pager)pager.id='qpp-result-pages';toggle.setAttribute('aria-controls','qpp-result-list qpp-result-pages');toggle.innerHTML='<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg>';
 function toggleState(){const expanded=!shell.classList.contains('qpp-list-folded');toggle.setAttribute('aria-expanded',String(expanded));toggle.setAttribute('aria-label',expanded?'구매발주 현황 접기':'구매발주 현황 펼침');toggle.dataset.workTooltip=expanded?'접기':'펼침';}
 toggle.onclick=()=>{shell.classList.toggle('qpp-list-folded');toggleState();};query.addEventListener('click',()=>{shell.classList.remove('qpp-list-folded');toggleState();});toggleState();headTools.append(clear,query,toggle);listHead.append(headTools);
 const dates=[...filters.querySelectorAll('input[type=date]')],trigger=calendar.querySelector('.pcal-trigger'),periodValue=trigger.querySelector('span');dates[0].dataset.purchasePeriod='start';dates[1].dataset.purchasePeriod='end';periodValue.classList.add('qpp-period-value');trigger.setAttribute('aria-label','발주기간 선택');trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');
 const syncPeriod=()=>{periodValue.textContent=dates[0].value&&dates[1].value?dates[0].value+' ~ '+dates[1].value:'기간 선택';};syncPeriod();clear.addEventListener('click',syncPeriod);dates.forEach(input=>input.addEventListener('change',syncPeriod));

}
const style=document.createElement('style');style.textContent=`
#purchase.purchase-work-frame .module-shell{border:1px solid #d2dfed!important;border-radius:10px!important;overflow:visible!important;background:#fff!important;box-shadow:0 8px 24px #18335313!important}
#purchase.purchase-work-frame .qpf-header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:64px!important;margin:0!important;padding:14px 22px!important;border:0!important;border-bottom:1px solid #dbe5ef!important;border-radius:10px 10px 0 0!important;background:#fff!important}
#purchase.purchase-work-frame .qpf-header h1{display:flex;align-items:center;gap:10px;font-size:18px!important;margin:0!important;color:#173b61!important}
#purchase.purchase-work-frame .qpf-header h1:before{content:'';width:3px;height:24px;border-radius:2px;background:#166fbb}
#purchase.purchase-work-frame .qpf-header .table-tools{display:flex;gap:6px;margin-left:auto}
#purchase.purchase-work-frame .module-toolbar{display:block!important;padding:20px 22px 18px!important;border:0!important;border-bottom:1px solid #dae5ef!important;border-radius:0!important;background:#f3f7fb!important}
#purchase.purchase-work-frame .module-toolbar .filters{display:block!important;max-width:none!important;width:100%!important}
#purchase.purchase-work-frame .qpf-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px 20px}
#purchase.purchase-work-frame .qpf-field{display:flex;align-items:center;gap:8px;min-width:0}
#purchase.purchase-work-frame .qpf-field>span{flex:0 0 78px;text-align:right;font-size:12.5px;font-weight:700;color:#334e6b}
#purchase.purchase-work-frame .qpf-field input,#purchase.purchase-work-frame .qpf-field select{height:38px!important;min-width:0!important;width:100%!important;padding:0 11px!important;font-size:13px!important;font-weight:400!important;border:1px solid #c7d6e5!important;border-radius:7px!important;background:#fff!important;color:#243e5d!important}
#purchase.purchase-work-frame .qpf-field .pcal-root{flex:1;max-width:none!important;width:100%!important;grid-column:auto!important;grid-row:auto!important}
#purchase.purchase-work-frame .qpf-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px}
#purchase.purchase-work-frame .qpf-count{font-size:12.5px;font-weight:700;color:#526a83}
#purchase.purchase-work-frame .qpf-buttons{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}
#purchase.purchase-work-frame .qpf-header .btn,#purchase.purchase-work-frame .qpf-buttons .btn{display:inline-flex!important;align-items:center;justify-content:center;height:38px!important;padding:8px 15px!important;border-radius:7px!important;font-size:12.5px!important;font-weight:700!important;margin:0!important}
#purchase.purchase-work-frame .qpf-header .primary,#purchase.purchase-work-frame .qpf-buttons .qpu-search{background:#166fbb!important;color:#fff!important;border-color:#166fbb!important}
#purchase.purchase-work-frame .qpf-buttons .btn[hidden]{display:none!important}
#purchase.purchase-work-frame .qpf-buttons .qpf-print{background:#eaf3ff;color:#245482;border:1px solid #c8daed}
#purchase.purchase-work-frame .qpf-buttons .qpf-mail{background:#ecf6f1;color:#21634b;border:1px solid #c9e1d6}
#purchase.purchase-work-frame .qpf-buttons .qpf-delete{background:#fff1f1;color:#b23535;border:1px solid #e9cccc;margin-right:10px!important}
#purchase.purchase-work-frame .qpf-list-head{display:flex;justify-content:space-between;padding:17px 22px 14px;color:#1e3f64;font-size:13.5px;font-weight:800}
#purchase.purchase-work-frame .qpu-db-message{display:none!important}
#purchase.purchase-work-frame .module-shell>.module-body{margin:0 16px 16px!important;border:1px solid #d5dce5!important;border-radius:0!important;overflow:auto!important}
#purchase.purchase-work-frame .module-shell>.module-body table{width:100%!important;min-width:1000px;table-layout:fixed!important;border-collapse:separate!important;border-spacing:0!important;border:0!important}
#purchase.purchase-work-frame .module-shell>.module-body table th{height:34px!important;padding:6px 12px!important;font-size:12px!important;font-weight:600!important;background:#e8f0f8!important;color:#244260!important;border:0!important;border-right:1px solid #d5dce5!important;border-bottom:1px solid #d5dce5!important;text-align:center!important}
#purchase.purchase-work-frame .module-shell>.module-body table td{height:36px!important;padding:4px 12px!important;font-size:12px!important;line-height:1.2!important;font-weight:400!important;background:#fff!important;color:#344054!important;border:0!important;border-right:1px solid #d5dce5!important;border-bottom:1px solid #d5dce5!important;text-align:center!important}
#purchase.purchase-work-frame .module-shell>.module-body table tbody tr:nth-child(even)>td{background:#fcfdff!important}
#purchase.purchase-work-frame .module-shell>.module-body table tbody tr:hover>td{background:#eef6ff!important}
#purchase.purchase-work-frame .module-shell>.module-body table th:first-child,#purchase.purchase-work-frame .module-shell>.module-body table td:first-child{position:relative;width:86px!important;min-width:86px!important;max-width:86px!important;padding:0!important;color:#000!important;text-decoration:none!important}
#purchase.purchase-work-frame .module-shell>.module-body table col:first-child{width:86px!important}
#purchase.purchase-work-frame .module-shell>.module-body table th:first-child:before,#purchase.purchase-work-frame .module-shell>.module-body table tr[data-purchase-key]>td:first-child:before{content:'';position:absolute;left:34px;top:0;bottom:0;width:1px;background:#d5dce5;pointer-events:none}
#purchase.purchase-work-frame .qpf-select{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;min-height:34px;width:100%;margin:0}
#purchase.purchase-work-frame .qpf-select input{position:static!important;width:13px!important;height:13px!important;min-width:13px!important;margin:auto!important;accent-color:#2563eb}
#purchase.purchase-work-frame .qpf-select span{color:#000!important;font-weight:400!important;text-decoration:none!important;cursor:default}
#purchase.purchase-work-frame .module-shell>.module-body tbody td.qpu-order-number{color:#1689ed!important;text-decoration:underline!important;font-weight:600!important;cursor:pointer!important}
#purchase.purchase-work-frame .qpu-pager{border:0!important;background:#fff!important;padding:10px 16px 20px!important;border-radius:0 0 10px 10px}
#purchase.purchase-work-frame .qpu-pager>span{display:none}
@media(max-width:1100px){#purchase.purchase-work-frame .qpf-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:650px){#purchase.purchase-work-frame .qpf-grid{grid-template-columns:minmax(0,1fr)}#purchase.purchase-work-frame .qpf-actions{align-items:flex-start;flex-direction:column}}
/* Compact inquiry and result tools, matching the current work-order screen. */
#purchase.purchase-work-frame,#purchase.purchase-work-frame .module-shell,#purchase.purchase-work-frame .module-toolbar,#purchase.purchase-work-frame .module-toolbar .filters,#purchase.purchase-work-frame .qpf-grid{min-width:0!important;box-sizing:border-box!important;max-width:100%!important}
#purchase.purchase-work-frame .module-shell{width:100%!important}
#purchase.purchase-work-frame .module-shell>.module-body{min-width:0!important;max-width:calc(100% - 32px)!important}
#purchase.purchase-work-frame .module-toolbar{padding:12px 16px!important}
#purchase.purchase-work-frame .qpf-grid{display:flex!important;flex-wrap:wrap;align-items:center;gap:10px 20px}
#purchase.purchase-work-frame .qpf-field{flex:0 0 auto;gap:8px;margin:0}
#purchase.purchase-work-frame .qpf-field>span{flex:0 0 auto;text-align:left;font-size:11.5px;line-height:30px;white-space:nowrap}
#purchase.purchase-work-frame .qpf-field input,#purchase.purchase-work-frame .qpf-field select{width:144px!important;flex:0 0 144px;height:30px!important;border-radius:4px!important;font-size:12px!important;box-sizing:border-box}
#purchase.purchase-work-frame .qpf-count,#purchase.purchase-work-frame .qpf-total{display:none!important}
#purchase.purchase-work-frame .qpf-actions:not(:has(.btn:not([hidden]))){display:none!important}
#purchase.purchase-work-frame .qpf-actions{justify-content:flex-end!important}
#purchase.purchase-work-frame .qpf-actions>.qpf-buttons{margin-left:auto!important}
#purchase.purchase-work-frame .qpf-buttons .btn{height:30px!important;padding:4px 10px!important;border-radius:4px!important;font-size:11.5px!important}
#purchase.purchase-work-frame .qpf-list-head{min-height:52px;box-sizing:border-box;padding:11px 16px!important;align-items:center;gap:10px;flex-wrap:wrap}
#purchase.purchase-work-frame .qow-head-tools{display:flex;gap:8px;align-items:center;margin-left:auto}
#purchase.purchase-work-frame .qow-head-tools .btn{position:relative;display:inline-flex;align-items:center;justify-content:center;height:30px;min-height:30px;padding:4px 10px;border:1px solid #c7d6e5;border-radius:4px;background:#fff;color:#40566d;font:600 11.5px/20px Arial,sans-serif;cursor:pointer;overflow:visible}
#purchase.purchase-work-frame .qow-head-tools .qpu-search,#purchase.purchase-work-frame .qow-head-tools .qpp-toggle{width:30px;min-width:30px;padding:0}
#purchase.purchase-work-frame .qow-head-tools .btn:hover{background:#edf5fc}
#purchase.purchase-work-frame .qow-head-tools .btn:focus-visible{outline:2px solid #247bd1;outline-offset:2px}
#purchase.purchase-work-frame .qpp-toggle[aria-expanded="true"] svg{transform:rotate(180deg)}
#purchase.purchase-work-frame .qow-head-tools [data-work-tooltip]::after{content:attr(data-work-tooltip);position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);display:block;padding:6px 10px;min-width:max-content;background:#fff;color:#25384a;border:1px solid #aebdca;border-radius:3px;box-shadow:0 2px 6px #192d4124;font:600 12px/18px Arial,sans-serif;white-space:nowrap;pointer-events:none;opacity:0;visibility:hidden;z-index:20}
#purchase.purchase-work-frame .qow-head-tools [data-work-tooltip]:hover::after,#purchase.purchase-work-frame .qow-head-tools [data-work-tooltip]:focus-visible::after{opacity:1;visibility:visible}
#purchase.purchase-work-frame .module-shell.qpp-list-folded>.module-body,#purchase.purchase-work-frame .module-shell.qpp-list-folded>.qpu-pager{display:none!important}
#purchase.purchase-work-frame .qpf-field .pcal-root{width:208px!important;flex:0 0 208px!important}
#purchase.purchase-work-frame .pcal-trigger{width:208px!important;height:30px!important;min-height:30px!important;padding:0 8px!important;border-radius:4px!important;font-size:12px!important;font-weight:600!important}
#purchase.purchase-work-frame .qpp-period-value{white-space:nowrap}
#purchase.purchase-work-frame .module-shell>.module-body table{min-width:1240px!important}
#purchase.purchase-work-frame .module-shell>.module-body table th:last-child,#purchase.purchase-work-frame .module-shell>.module-body table td:last-child{width:190px!important;min-width:190px!important;padding:5px 8px!important}
#purchase.purchase-work-frame .qpp-row-actions{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
#purchase.purchase-work-frame .qpp-row-action{height:30px;min-width:44px;padding:4px 10px;border:1px solid #c8daed;border-radius:5px;background:#f7faff;color:#32649a;font:600 12px/20px Arial,sans-serif;cursor:pointer}
#purchase.purchase-work-frame .qpp-row-print{background:#eaf3ff;color:#245482}
#purchase.purchase-work-frame .qpp-row-delete{background:#fff8f8;color:#b23535;border-color:#f0caca}
#purchase.purchase-work-frame .qpp-row-action:disabled{opacity:.5;cursor:wait}
#qpp-edit-dialog{width:min(720px,calc(100vw - 40px));max-height:90vh;padding:22px;border:1px solid #c8d7e6;border-radius:10px;color:#243e59;box-shadow:0 16px 50px #10283b44;font:13px Arial,"Malgun Gothic",sans-serif}
#qpp-edit-dialog::backdrop{background:#152c4488}
#qpp-edit-dialog header{display:flex;align-items:center;justify-content:space-between;font-size:18px}
#qpp-edit-dialog .qpp-edit-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px 20px}
#qpp-edit-dialog label{display:flex;flex-direction:column;gap:6px;font-weight:600;min-width:0}
#qpp-edit-dialog input{box-sizing:border-box;width:100%;height:35px;border:1px solid #c7d6e5;border-radius:4px;padding:6px 9px;font:13px Arial,sans-serif}
#qpp-edit-dialog footer{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
#qpp-edit-dialog button{padding:7px 14px;border:1px solid #c7d6e5;border-radius:5px;background:#fff;cursor:pointer}
#qpp-edit-dialog .qpp-edit-save{background:#166fbb;color:white}
#qpp-edit-dialog .qpp-edit-message{color:#b23535}
@media(max-width:650px){#qpp-edit-dialog .qpp-edit-fields{grid-template-columns:1fr}}
`;document.head.append(style);new MutationObserver(init).observe(document.body,{subtree:true,childList:true});init();
})();

/* Purchase inquiry date popup only. Preserve native date filters, row data and query handlers. */
(()=>{'use strict';let popup=null,trigger=null,start='',end='',picking=false,month=null;
const root=()=>document.querySelector('#purchase .module-toolbar');
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
const fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function close(focus=false){popup?.remove();popup=null;trigger?.setAttribute('aria-expanded','false');if(focus)trigger?.focus();}
function position(){if(!popup||!trigger)return;const r=trigger.getBoundingClientRect(),box=popup.getBoundingClientRect();popup.style.left=Math.max(6,Math.min(r.left,innerWidth-box.width-6))+'px';popup.style.top=(r.bottom+box.height+5<innerHeight?r.bottom+4:Math.max(6,r.top-box.height-4))+'px';}
function draw(){const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();let cells='';for(let i=0;i<first;i++)cells+='<span aria-hidden="true"></span>';for(let n=1;n<=days;n++){const value=fmt(new Date(y,m,n)),weekday=(first+n-1)%7;cells+='<button type="button" data-day="'+value+'" class="'+(weekday===0||weekday===6?'weekend ':'')+(value===start||value===end?'chosen ':start&&end&&value>start&&value<end?'between ':'')+'" aria-label="'+value+'" aria-pressed="'+(value===start||value===end)+'"'+(value===today()?' aria-current="date"':'')+'>'+n+'</button>';}
popup.innerHTML='<div class="nwm-head"><button type="button" data-month="-12" aria-label="이전 해">«</button><button type="button" data-month="-1" aria-label="이전 달">‹</button><strong>'+y+'.'+String(m+1).padStart(2,'0')+'</strong><button type="button" data-month="1" aria-label="다음 달">›</button><button type="button" data-month="12" aria-label="다음 해">»</button></div><div class="nwm-days">'+['일','월','화','수','목','금','토'].map(v=>'<span class="nwm-week">'+v+'</span>').join('')+cells+'</div><div class="nwm-hint" aria-live="polite">'+(picking?start+' ~ 종료일 선택':'시작일 → 종료일 순서로 선택')+'</div><div class="nwm-foot"><button type="button" data-today>오늘</button><button type="button" data-clear>초기화</button><button type="button" data-close>닫기</button></div>';position();}
function apply(a,b){const panel=root();if(!panel)return;const from=panel.querySelector('[data-purchase-period="start"]'),to=panel.querySelector('[data-purchase-period="end"]'),value=panel.querySelector('.qpp-period-value');if(!from||!to||!value)return;from.value=a;to.value=b;value.textContent=a&&b?a+' ~ '+b:'기간 선택';close(true);document.querySelector('#purchase .qpu-search')?.click();}
function open(button){if(popup){close(true);return;}const panel=root();if(!panel)return;trigger=button;panel.querySelectorAll('.pcal-pop').forEach(p=>p.hidden=true);start=panel.querySelector('[data-purchase-period="start"]')?.value||'';end=panel.querySelector('[data-purchase-period="end"]')?.value||'';picking=false;month=new Date((start||today())+'T12:00:00');month=new Date(month.getFullYear(),month.getMonth(),1);popup=document.createElement('div');popup.className='namo-purchase-mini-calendar';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','발주기간 선택');document.body.append(popup);trigger.setAttribute('aria-expanded','true');draw();popup.querySelector('[data-day="'+(start||today())+'"]')?.focus();}
window.addEventListener('click',event=>{const button=event.target.closest?.('#purchase .module-toolbar .pcal-trigger');if(button){event.preventDefault();event.stopImmediatePropagation();open(button);return;}const action=event.target.closest?.('.namo-purchase-mini-calendar button');if(!action||!popup)return;event.preventDefault();event.stopImmediatePropagation();if(action.hasAttribute('data-month')){month=new Date(month.getFullYear(),month.getMonth()+Number(action.dataset.month),1);draw();}else if(action.dataset.day){if(!picking){start=action.dataset.day;end='';picking=true;draw();}else{end=action.dataset.day;if(end<start)[start,end]=[end,start];apply(start,end);}}else if(action.hasAttribute('data-today'))apply(today(),today());else if(action.hasAttribute('data-clear'))apply('','');else close(true);},true);
document.addEventListener('pointerdown',event=>{if(popup&&!event.target.closest('.namo-purchase-mini-calendar,#purchase .pcal-trigger'))close();},true);
window.addEventListener('keydown',event=>{if(popup&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close(true);}},true);
window.addEventListener('resize',position);window.addEventListener('scroll',()=>{if(popup)close();},true);
const style=document.createElement('style');style.textContent=`
.namo-purchase-mini-calendar{position:fixed;z-index:2147483000;box-sizing:border-box;width:220px;max-width:calc(100vw - 12px);padding:8px;background:#fff;border:1px solid #b8c4d0;border-radius:3px;box-shadow:0 4px 14px #0002;color:#344254;font:12px Arial,"Malgun Gothic",sans-serif}
.namo-purchase-mini-calendar *{box-sizing:border-box}
.namo-purchase-mini-calendar button{font:inherit;border:0;background:transparent;color:inherit;cursor:pointer;border-radius:2px;padding:0;min-width:0;box-shadow:none}
.namo-purchase-mini-calendar button:focus-visible{outline:2px solid #499cef;outline-offset:-2px}
.namo-purchase-mini-calendar .nwm-head{display:flex;align-items:center;justify-content:space-between;height:29px;margin-bottom:7px;border-bottom:1px solid #e1e6eb}
.namo-purchase-mini-calendar .nwm-head strong{font-size:13px;color:#172b40}
.namo-purchase-mini-calendar .nwm-head button{width:24px;height:25px;font-size:18px;color:#83909c}
.namo-purchase-mini-calendar .nwm-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px}
.namo-purchase-mini-calendar .nwm-days>*{height:25px;line-height:25px;text-align:center;font-size:11px}
.namo-purchase-mini-calendar .nwm-week{color:#89939e;font-weight:400}
.namo-purchase-mini-calendar .weekend{color:#e14d4d}
.namo-purchase-mini-calendar .nwm-days button:hover{background:#e4f0ff}
.namo-purchase-mini-calendar .nwm-days .between{background:#edf5ff}
.namo-purchase-mini-calendar .nwm-days .chosen{background:#2689ef;color:#fff}
.namo-purchase-mini-calendar .nwm-days [aria-current="date"]:not(.chosen){font-weight:700;box-shadow:inset 0 0 0 1px #8cbcf0}
.namo-purchase-mini-calendar .nwm-hint{font-size:10px;min-height:24px;padding-top:7px;color:#61768b;text-align:center}
.namo-purchase-mini-calendar .nwm-foot{display:flex;gap:4px;margin-top:5px;padding-top:7px;border-top:1px solid #e1e6eb}
.namo-purchase-mini-calendar .nwm-foot button{border:1px solid #d3d9df;background:#fff;height:23px;padding:0 7px;font-size:11px}
.namo-purchase-mini-calendar .nwm-foot [data-close]{margin-left:auto}
`;document.head.append(style);
})();
