/* Equipment work-order-style list controls: scoped additive patch. */
(()=>{'use strict';
const STORE='namo-qmes-equipment-additions-v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch{return []}};
const save=a=>localStorage.setItem(STORE,JSON.stringify(a));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=()=>document.querySelector('#equipment .eq-page');
let active=false;
function editForm(item,done){
 const box=document.createElement('div');box.className='eq-wo-overlay';box.innerHTML='<form class="eq-wo-form"><h3>'+(item?'설비 수정':'신규 설비 등록')+'</h3><div class="eq-wo-fields">'+[['no','설비번호'],['name','설비명'],['group','구분'],['use','용도'],['standard','관리기준'],['method','확인방법'],['cycle','관리주기'],['last','최근점검'],['next','차기점검'],['owner','담당자']].map(([k,l])=>'<label>'+l+'<input name="'+k+'" value="'+esc(item?.[k]||'')+'" '+(k==='name'?'required':'')+'></label>').join('')+'<label>상태<select name="status">'+['정상','점검예정','교정관리'].map(s=>'<option '+(item?.status===s?'selected':'')+'>'+s+'</option>').join('')+'</select></label></div><footer><button type="button" data-cancel>취소</button><button type="submit">저장</button></footer></form>';document.body.appendChild(box);
 box.querySelector('[data-cancel]').onclick=()=>box.remove();box.onclick=e=>{if(e.target===box)box.remove()};box.querySelector('form').onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));done({...item,...data});box.remove()};}
function printRows(rows){const win=window.open('','_blank');if(!win)return alert('팝업 허용 후 다시 시도해 주세요.');const html='<html><head><meta charset="utf-8"><title>설비 관리대장</title><style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #999;padding:8px}th{background:#e8f0f8}</style></head><body><h2>설비 관리대장</h2><table><thead><tr>'+['No','설비명','구분','용도','관리기준','확인방법','관리주기','최근점검','차기점검','상태'].map(v=>'<th>'+v+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+[r.no,r.name,r.group,r.use,r.standard,r.method,r.cycle,r.last,r.next,r.status].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></body></html>';win.document.write(html);win.document.close();win.focus();win.print();}
function showExtra(item){const box=get()?.querySelector('#eqDetail');if(!box)return;box.classList.add('show');box.innerHTML='<div class="eq-detail-head"><div><h3>'+esc(item.name)+'</h3><p>'+esc(item.no)+' · '+esc(item.group)+'</p></div></div><div class="eq-detail-grid"><div class="eq-box"><div class="eq-box-title">설비 상세정보</div><div class="eq-box-body">'+[['use','용도'],['standard','관리기준'],['method','확인방법'],['cycle','관리주기'],['last','최근점검'],['next','차기점검'],['owner','담당자']].map(([k,l])=>'<p><b>'+l+'</b> : '+esc(item[k])+'</p>').join('')+'</div></div></div>';box.scrollIntoView({block:'nearest',behavior:'smooth'})}
function init(){
 const root=get();if(!root||root.dataset.woEquipment==='1')return;root.dataset.woEquipment='1';
 const table=root.querySelector('.eq-table'),thead=table?.querySelector('thead tr'),tbody=table?.querySelector('tbody'),actions=root.querySelector('.eq-actions');if(!table||!thead||!tbody||!actions)return;
 root.querySelector('.eq-hero h1').textContent='설비 등록 및 조회';
 root.querySelector('.eq-table-title b').textContent='설비 등록 현황';
 const style=document.createElement('style');style.textContent='#equipment .eq-wo-name{border:0;background:none;color:#1c5ca1;font-weight:700;cursor:pointer;text-decoration:underline;text-underline-offset:3px}#equipment .eq-table th[data-eq-sort]{cursor:pointer} #equipment .eq-wo-check{width:35px;text-align:center!important}#equipment .eq-wo-action{white-space:nowrap;text-align:center!important}#equipment .eq-wo-action button,.eq-wo-actions button{margin:2px;padding:5px 10px;border:1px solid #cbd8e5;border-radius:4px;background:#f5f9ff;color:#17446f;cursor:pointer}.eq-wo-actions{display:flex;gap:5px;align-items:center}.eq-wo-overlay{position:fixed;inset:0;z-index:99999;background:#0006;display:grid;place-items:center}.eq-wo-form{background:#fff;width:min(850px,95vw);max-height:90vh;overflow:auto;padding:24px;border-radius:9px}.eq-wo-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.eq-wo-fields label{display:grid;gap:5px;font-size:13px}.eq-wo-fields input,.eq-wo-fields select{padding:9px;border:1px solid #ccd6e0;border-radius:5px}.eq-wo-form footer{display:flex;justify-content:flex-end;gap:10px;margin-top:15px}@media print{.eq-wo-actions,.eq-wo-check,.eq-wo-action{display:none!important}}';document.head.appendChild(style);
 thead.querySelectorAll('th').forEach((th,index)=>{th.dataset.eqSort=['index','name','group','use','standard','method','cycle','last','next','status'][index]||'index';th.title='클릭하여 정렬';th.addEventListener('click',()=>{const key=th.dataset.eqSort;sortAsc=sortKey===key?!sortAsc:true;sortKey=key;render()})});thead.insertAdjacentHTML('afterbegin','<th class="eq-wo-check"><input type="checkbox" aria-label="전체 선택" id="eqWoAll"></th>');
 thead.insertAdjacentHTML('beforeend','<th class="eq-wo-action">비고</th>');
 const bulk=document.createElement('div');bulk.className='eq-wo-actions';bulk.hidden=true;bulk.innerHTML='<button data-bulk-print>선택 인쇄</button><button data-bulk-delete>선택 삭제</button>';actions.prepend(bulk);
 const newBtn=document.createElement('button');newBtn.className='eq-btn primary';newBtn.textContent='+ 신규 설비 등록';actions.append(newBtn);
 let sortKey='index',sortAsc=true;
 function allRecords(){return [...(typeof NAMO_EQUIPMENT_CP!=='undefined'?NAMO_EQUIPMENT_CP:[]),...read()]}
 function render(){
  const items=allRecords();const sorted=items.map((e,i)=>({...e,_sourceIndex:i})).sort((a,b)=>{let n=sortKey==='index'?a._sourceIndex-b._sourceIndex:String(a[sortKey]||'').localeCompare(String(b[sortKey]||''),'ko',{numeric:true});return sortAsc?n:-n});tbody.innerHTML=sorted.map((e,_display)=>{const i=e._sourceIndex;return '<tr class="eq-row" data-eq-i="'+i+'" data-group="'+esc(e.group)+'"><td class="eq-wo-check"><input type="checkbox" class="eq-wo-select"></td><td>'+String(i+1)+'</td><td class="left"><strong>'+esc(e.name)+'</strong></td><td>'+esc(e.group)+'</td><td class="left">'+esc(e.use)+'</td><td class="left">'+esc(e.standard)+'</td><td class="left">'+esc(e.method)+'</td><td>'+esc(e.cycle)+'</td><td>'+esc(e.last)+'</td><td>'+esc(e.next)+'</td><td>'+esc(e.status)+'</td><td class="eq-wo-action"><button data-eq-print>인쇄</button><button data-eq-edit>수정</button><button data-eq-delete>삭제</button></td></tr>').join('');
  root.querySelector('#eqWoAll').checked=false;bulk.hidden=true;
  const selected=()=>[...tbody.querySelectorAll('.eq-wo-select:checked')].map(b=>Number(b.closest('tr').dataset.eqI));
  const update=()=>{bulk.hidden=!selected().length;};
  tbody.querySelectorAll('.eq-wo-select').forEach(b=>b.onchange=update);
  root.querySelector('#eqWoAll').onchange=e=>{tbody.querySelectorAll('.eq-wo-select').forEach(b=>{if(b.closest('tr').style.display!=='none')b.checked=e.target.checked});update()};
  bulk.querySelector('[data-bulk-print]').onclick=()=>printRows(selected().map(i=>items[i]));
  bulk.querySelector('[data-bulk-delete]').onclick=()=>{const ids=selected();if(ids.some(i=>i<7)){alert('기존 관리계획서 설비 7종은 보호되어 삭제할 수 없습니다.');return}if(!confirm(ids.length+'건을 삭제하시겠습니까?'))return;save(read().filter((_,j)=>!ids.includes(j+7)));render()};
  tbody.querySelectorAll('tr').forEach(tr=>{const i=Number(tr.dataset.eqI),item=items[i];tr.onclick=e=>{if(e.target.closest('button,input'))return;if(i<7&&typeof renderEquipmentDetail==='function')renderEquipmentDetail(i);else showExtra(item)};tr.querySelector('.eq-wo-action').insertAdjacentHTML('afterbegin','');tr.querySelector('.left strong').innerHTML='<button type="button" class="eq-wo-name">'+esc(item.name)+'</button>';tr.querySelector('.eq-wo-name').onclick=e=>{e.stopPropagation();if(i<7&&typeof renderEquipmentDetail==='function')renderEquipmentDetail(i);else showExtra(item)};
   tr.querySelector('[data-eq-print]').onclick=()=>printRows([item]);
   tr.querySelector('[data-eq-edit]').onclick=()=>{if(i<7){alert('기본 설비는 관리계획서 기준 원본으로 보호됩니다.');return}editForm(item,v=>{const arr=read();arr[i-7]=v;save(arr);render()})};
   tr.querySelector('[data-eq-delete]').onclick=()=>{if(i<7){alert('기본 설비 7종은 삭제할 수 없습니다.');return}if(confirm('선택한 설비를 삭제하시겠습니까?')){save(read().filter((_,j)=>j!==i-7));render()}};
  });
  filterNow();
 }
 let group='all';
 function filterNow(){const q=(root.querySelector('#eqSearch')?.value||'').trim().toLowerCase();tbody.querySelectorAll('tr').forEach(tr=>{const ok=(group==='all'||tr.dataset.group===group)&&(!q||tr.textContent.toLowerCase().includes(q));tr.style.display=ok?'':'none'})}
 root.querySelectorAll('.eq-tab').forEach(b=>b.addEventListener('click',()=>{group=b.dataset.eqFilter;setTimeout(filterNow,0)}));
 root.querySelector('#eqSearch')?.addEventListener('input',()=>setTimeout(filterNow,0));
 newBtn.onclick=()=>editForm(null,v=>{save([...read(),{...v,points:[],statusClass:'good'}]);render()});
 render();
 }
 const observer=new MutationObserver(()=>{if(active)return;active=true;try{init()}finally{active=false}});observer.observe(document.body,{childList:true,subtree:true});init();
})();