(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else api.install(root);})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const PREFIX='sales-order:';
const text=value=>String(value??'').trim();
const day=value=>text(value).slice(0,10);
function normalize(row,index=0){
 const fields=row.fields||{},meta=row.orderMeta||{};
 return {...row,id:text(row.id||row.salesOrderId||row.orderNo||meta.salesOrderIdOverride)||'legacy:'+index,
 orderDate:day(row.orderDate||row.date||fields['수주일자']||meta.orderDate),customer:text(row.customer||fields['고객사']||meta.customerOverride),
 product:text(row.product||row.productCategory||fields['제품명']||meta.productOverride),qty:row.qty??row.quantity??fields['수량']??meta.qtyOverride??'',
 due:day(row.due||row.requestedDue||fields['요청납기']||meta.requestedDue),confirmedDue:day(row.confirmedDue||row.confirmedDueDate||fields['확정일자']),
 status:text(row.status||row.salesStatus||fields['진행상태'])||'대기',remarks:text(row.remarks||row.note||fields['비고'])};
}
function recordsFromSync(records){
 const legacy=new Map(),current=new Map(),deleted=new Set();
 for(const record of records){
  const key=text(record.record_key);if(key!=='erp:sales'&&!key.startsWith(PREFIX))continue;
  let payload=record.payload;if(typeof payload==='string'){try{payload=JSON.parse(payload);}catch(_){continue;}}
  if(!payload)continue;
  if(payload.deleted){
   if(key.startsWith(PREFIX))deleted.add(key.slice(PREFIX.length));
   continue;
  }
  (Array.isArray(payload.rows)?payload.rows:[]).forEach((value,index)=>{if(value.deleted)return;const row=normalize(value,index),map=key==='erp:sales'?legacy:current;
   if(!map.has(row.id))map.set(row.id,row);
  });
 }
 for(const [key,row] of current)legacy.set(key,row);
 for(const id of deleted)legacy.delete(id);
 return [...legacy.values()].sort((a,b)=>b.orderDate.localeCompare(a.orderDate)||a.id.localeCompare(b.id));
}
function validate(row){
 for(const [key,label] of [['orderDate','수주일자'],['customer','고객사'],['product','제품명'],['due','요청납기']])if(!text(row[key]))throw Error(label+'를 입력해 주세요.');
 for(const key of ['orderDate','due','confirmedDue'])if(row[key]&&!/^\d{4}-\d{2}-\d{2}$/.test(row[key]))throw Error('날짜를 확인해 주세요.');
 if(!text(row.qty)||!Number.isFinite(Number(row.qty))||Number(row.qty)<=0)throw Error('수량을 0보다 크게 입력해 주세요.');
 if(row.due<row.orderDate)throw Error('요청납기는 수주일자보다 빠를 수 없습니다.');
 return {...row,qty:Number(row.qty)};
}
async function request(fetcher,url,options={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetcher(url,{credentials:'same-origin',cache:'no-store',signal:controller.signal,...options});
  const result=await response.json().catch(()=>null);
  if(!response.ok||!result||result.success!==true)throw Error(result?.message||(response.status===401?'로그인이 만료되었습니다. 다시 로그인 후 저장해 주세요.':'서버 저장에 실패했습니다. 입력 내용은 유지됩니다.'));
  return result.data;
 }finally{clearTimeout(timer);}
}
async function persist(fetcher,row){
 const record=validate(row);
 const data=await request(fetcher,'/api/qmes-sync/inventory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:PREFIX+record.id,payload:{module:'sales',schema:1,rows:[record]}})});
 if(data?.record_key!==PREFIX+record.id)throw Error('저장 확인 응답이 올바르지 않습니다. 입력 내용은 유지됩니다.');
 return record;
}
async function remove(fetcher,id){
 if(!id||id.startsWith('legacy:'))throw Error('기존 수주의 고유번호를 확인할 수 없습니다.');
 const key=PREFIX+id;
 const data=await request(fetcher,'/api/qmes-sync/inventory',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({key,payload:{module:'sales',schema:1,deleted:true,deletedAt:new Date().toISOString(),rows:[]}})});
 if(data?.record_key!==key)throw Error('서버의 삭제 확인 응답이 올바르지 않습니다.');
}
function install(win){
 const doc=win.document,section=doc.getElementById('orders');if(!section||section.dataset.ordersPersistence)return;section.dataset.ordersPersistence='1';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let rows=[],busy=false,loading=null,generation=0;
 const notify=message=>{if(typeof win.toast==='function')win.toast(message);};
 function notice(message,host=section){let el=host.querySelector('[data-orders-notice]');if(!el){el=doc.createElement('div');el.dataset.ordersNotice='1';el.setAttribute('role','alert');el.style.cssText='padding:10px 12px;color:#a02040;background:#fff4f4;border:1px solid #efc8ce;font-size:12px';host.prepend(el);}el.textContent=message;}
 function render(){
  const body=section.querySelector('.module-body table tbody');if(!body)return;
  section._ordersRows=rows;
  body.innerHTML=rows.length?rows.map((row,index)=>'<tr class="data-row" tabindex="0" data-sales-order-id="'+esc(row.id)+'">'+[index+1,row.orderDate,row.customer,row.product,row.qty,row.due,row.confirmedDue||'-',row.status].map(value=>'<td>'+esc(value)+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="8" style="padding:24px;text-align:center">등록된 수주납기 내역이 없습니다.</td></tr>';
  section._qofReplaceRows?.([...body.querySelectorAll('tr.data-row')]);
 }
 async function load(){
  if(loading)return loading;
  const version=++generation;
  loading=(async()=>{try{if(win.qmesAuthDataReady?.wait)await win.qmesAuthDataReady.wait();const records=await request(win.fetch.bind(win),'/api/qmes-sync/inventory?_qmesFresh='+Date.now());if(!Array.isArray(records))throw Error('수주 조회 응답이 올바르지 않습니다.');if(version!==generation)return;rows=recordsFromSync(records);render();section.querySelector('[data-orders-notice]')?.remove();}catch(error){if(version===generation)notice(error.message);}finally{loading=null;}})();return loading;
 }
 function formValues(pane){const result={};pane.querySelectorAll('.form-item,.am-inline-cell').forEach(cell=>{const label=text(cell.querySelector('label')?.textContent),control=cell.querySelector('input,select,textarea');if(label&&control)result[label]=control.value;});return result;}
 const mapping={orderDate:'수주일자',customer:'고객사',product:'제품명',qty:'수량',due:'요청납기',confirmedDue:'확정일자',status:'진행상태',remarks:'비고'};
 async function save(pane){
  if(busy)return;busy=true;
  const buttons=[...doc.querySelectorAll('#workspaceFoot #modalSave,[data-am-screen="orders"] [data-am-save]')];buttons.forEach(b=>b.disabled=true);
  try{
   const fields=formValues(pane),existing=rows.find(row=>row.id===pane.dataset.ordersEditId);
   const id=existing?.id||pane.dataset.ordersNewId||(pane.dataset.ordersNewId=win.crypto.randomUUID());
   let record={...existing,id};for(const [key,label] of Object.entries(mapping))record[key]=text(fields[label]);
   record=validate(record);record.updatedAt=new Date().toISOString();record.createdAt=existing?.createdAt||record.updatedAt;
   const ticket=win.qmesFormDrafts?.beginSave(pane);
   record=await persist(win.fetch.bind(win),record);
   generation++;rows=[record,...rows.filter(row=>row.id!==record.id)].sort((a,b)=>b.orderDate.localeCompare(a.orderDate));render();
   section.querySelector('.qof-clear')?.click();win.qmesFormDrafts?.completeSave(ticket);
   if(typeof win.closeModal==='function')win.closeModal();notify('수주납기가 저장되었습니다.');
  }catch(error){notice(error.message,pane.querySelector('.am-detail-pane')||pane);notify(error.message);}finally{buttons.forEach(b=>b.disabled=false);busy=false;}
 }
 async function deleteSelected(ids){
  if(busy||!ids.length)return;
  const selected=rows.filter(row=>ids.includes(row.id));
  if(!selected.length)return;
  busy=true;section._salesOrdersDeleting=true;section._qofUpdateSelection?.();
  try{
   const confirmed=typeof win.confirmIqcBulkDelete==='function'
    ?await win.confirmIqcBulkDelete(selected.length,'수주납기')
    :win.confirm('선택한 수주납기 '+selected.length+'건을 삭제하시겠습니까?');
   if(!confirmed)return;
   const deleted=new Set(),failures=[];
   for(const row of selected){
    try{await remove(win.fetch.bind(win),row.id);deleted.add(row.id);}
    catch(error){failures.push([row.customer,row.product,error.message].join(' · '));}
   }
   if(deleted.size){generation++;rows=rows.filter(row=>!deleted.has(row.id));render();notify('수주납기 '+deleted.size+'건을 삭제했습니다.');}
   if(failures.length)notice('삭제 실패 '+failures.length+'건 · '+failures.join(' / '));
   else section.querySelector('[data-orders-notice]')?.remove();
  }finally{section._salesOrdersDeleting=false;busy=false;section._qofUpdateSelection?.();}
 }
 section._deleteSelectedSalesOrders=deleteSelected;
 section._qofUpdateSelection?.();
 function openRecord(id){const record=rows.find(row=>row.id===id);if(!record||typeof win.openNewForm!=='function')return;
  win.openNewForm('orders');const pane=doc.querySelector('#mainWorkspace .am-split[data-am-screen="orders"]');if(!pane)return;
  pane.dataset.amMode='edit';pane.dataset.amRecord=record.id;pane.dataset.ordersEditId=record.id;
  pane.querySelectorAll('.form-item').forEach(cell=>{const label=text(cell.querySelector('label')?.textContent),control=cell.querySelector('input,select,textarea');const key=Object.keys(mapping).find(key=>mapping[key]===label);if(control&&key){if(control.tagName==='SELECT'&&![...control.options].some(option=>option.value===text(record[key]))){const option=doc.createElement('option');option.value=option.textContent=text(record[key]);control.append(option);}control.value=record[key]??'';control.dispatchEvent(new Event('change',{bubbles:true}));}});
  pane.querySelector('.am-detail-top .title-wrap>b').textContent='수주납기 수정';win.qmesFormDrafts?.rescan();
 }
 doc.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-am-save],#modalSave');const pane=doc.querySelector('#mainWorkspace.active .am-split[data-am-screen="orders"]');
  if(button&&pane){event.preventDefault();event.stopImmediatePropagation();save(pane);return;}
  const row=event.target.closest?.('#orders tr[data-sales-order-id]');if(row&&!event.target.closest('input,button,.qpf-select')){event.preventDefault();event.stopImmediatePropagation();openRecord(row.dataset.salesOrderId);}
 },true);
 doc.addEventListener('keydown',event=>{const row=event.target.closest?.('#orders tr[data-sales-order-id]');if(row&&event.key==='Enter'&&!event.target.matches('input,button')){event.preventDefault();openRecord(row.dataset.salesOrderId);}});
 doc.addEventListener('visibilitychange',()=>{if(!doc.hidden&&section.classList.contains('active'))load();});
 section._loadSalesOrders=load;load();
}
return {PREFIX,normalize,recordsFromSync,validate,request,persist,remove,install};
});
