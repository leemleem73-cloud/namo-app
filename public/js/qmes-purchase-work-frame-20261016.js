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
  count.textContent='조회 '+matches.length+'건';listHead.querySelector('.qpf-total').textContent='총 '+matches.length+'건';
 }
 function decorate(){
  const th=wrap.querySelector('thead th:first-child');if(th&&!th.querySelector('.qpf-check-all')){th.replaceChildren();const label=document.createElement('label');label.className='qpf-select';label.innerHTML='<input class="qpf-check-all" type="checkbox" aria-label="조회된 발주 전체 선택"><span>No.</span>';th.append(label);label.querySelector('input').onchange=event=>{api.filtered().forEach(row=>event.target.checked?selected.add(key(row)):selected.delete(key(row)));update();};}
  wrap.querySelectorAll('tbody tr[data-purchase-key]').forEach(row=>{const td=row.cells[0];if(td.querySelector('.qpf-check'))return;const value=td.textContent.trim(),label=document.createElement('label');label.className='qpf-select';const box=document.createElement('input');box.type='checkbox';box.className='qpf-check';box.setAttribute('aria-label',value+'번 발주 선택');const num=document.createElement('span');num.textContent=value;label.append(box,num);td.replaceChildren(label);box.onchange=()=>{box.checked?selected.add(row.dataset.purchaseKey):selected.delete(row.dataset.purchaseKey);update();};});update();
 }
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
`;document.head.append(style);new MutationObserver(init).observe(document.body,{subtree:true,childList:true});init();
})();
