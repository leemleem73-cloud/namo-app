(function(){
'use strict';
const endpoint='/api/qmes/standard-documents',statuses=['대기','진행','완료'];
const departments=['대표','연구소','생산부','영업부','품질부','관리부'];
let records=[],loading=null,activeChoice=null;
const selected=new Set();let deleting=false;
function closeChoice(){if(!activeChoice)return;activeChoice.trigger.setAttribute('aria-expanded','false');activeChoice.popup.remove();activeChoice=null;}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path='',options={}){
 await window.qmesAuthDataReady?.wait();
 const config={credentials:'same-origin',cache:'no-store',...options};
 let response=await fetch(endpoint+path,config);
 if(response.status===401&&window.qmesReauthenticate){await window.qmesReauthenticate();response=await fetch(endpoint+path,config);}
 const result=await response.json().catch(()=>({}));
 if(!response.ok||!result.success)throw Error(result.message||'문서 서버 요청 실패');
 return result.data;
}

function ensureSelectionHeader(){
 const section=document.getElementById('standard'),cell=section?.querySelector('table thead tr>th');
 if(!cell||cell.querySelector('.std-select-all'))return;
 const label=document.createElement('label');label.className='std-select-number';
 const input=document.createElement('input');input.type='checkbox';input.className='std-select-all';input.setAttribute('aria-label','문서 전체 선택');
 const number=document.createElement('span');number.textContent='No.';label.append(input,number);cell.replaceChildren(label);
 input.addEventListener('change',()=>{
  section.querySelectorAll('tbody tr[data-standard-id]').forEach(row=>{
   const id=row.dataset.standardId;if(input.checked)selected.add(id);else selected.delete(id);
   const box=row.querySelector('.std-select-row');if(box)box.checked=input.checked;
  });updateSelection();
 });
}
function updateSelection(){
 const section=document.getElementById('standard');if(!section)return;
 ensureSelectionHeader();
 const visible=[...section.querySelectorAll('tbody tr[data-standard-id]')],checked=visible.filter(row=>selected.has(row.dataset.standardId));
 const head=section.querySelector('.std-select-all');if(head){head.checked=visible.length>0&&checked.length===visible.length;head.indeterminate=checked.length>0&&checked.length<visible.length;}
 visible.forEach(row=>row.classList.toggle('std-selected',selected.has(row.dataset.standardId)));
 let actions=section._standardBulkButtons;
 if(!actions){
  const edit=document.createElement('button'),remove=document.createElement('button'),clear=document.createElement('button');
  for(const button of [edit,remove,clear]){button.type='button';button.className='btn';}
  edit.onclick=()=>{if(selected.size===1)open(records.find(record=>selected.has(String(record.id)))||null);};
  remove.dataset.selectedDelete='1';remove.onclick=()=>removeDocuments([...selected]);
  clear.textContent='선택 해제';clear.onclick=()=>{selected.clear();section.querySelectorAll('.std-select-row').forEach(box=>box.checked=false);updateSelection();};
  actions=section._standardBulkButtons=[edit,remove,clear];
 }
 actions[0].textContent='선택 수정';actions[0].disabled=selected.size!==1||deleting;
 actions[1].textContent='선택 삭제 ('+selected.size+')';actions[1].disabled=deleting;
 actions[2].disabled=deleting;
 if(typeof qmesIncomingSelectionDock==='function')qmesIncomingSelectionDock(section,actions,selected.size);
}
async function removeDocuments(ids){
 if(deleting||!ids.length)return;
 if(!await window.qmesConfirm('선택한 문서 '+ids.length+'건을 삭제하시겠습니까?'))return;
 deleting=true;updateSelection();
 try{
  const result=await api('/delete-selected',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids})});
  const removed=new Set(result.ids.map(String));
  records=records.filter(record=>!removed.has(String(record.id)));
  removed.forEach(id=>selected.delete(id));render();toast(result.count+'건의 문서가 삭제되었습니다.');
 }catch(error){toast(error.message);}
 finally{deleting=false;updateSelection();}
}
function render(){
 const section=document.getElementById('standard'),body=section?.querySelector('.module-body>table tbody');
 if(!body)return;
 ensureSelectionHeader();
 const query=(section.querySelector('.module-toolbar .search-input')?.value||'').trim().toLowerCase();
 const list=records.filter(r=>!query||[r.documentNo,r.name,r.category,r.department].some(v=>String(v||'').toLowerCase().includes(query)));
 body.replaceChildren();
 list.forEach((record,index)=>{
  const row=document.createElement('tr');row.className='data-row';row.dataset.standardId=record.id;row.dataset.remarks=record.note||'';row.dataset.stdLayout='1';
  [String(index+1),record.documentNo,record.name,record.category,record.revision,record.revisionDate,record.department,record.status,'첨부 없음',record.note].forEach(value=>{const td=document.createElement('td');td.textContent=value||'-';row.append(td);});
  const label=document.createElement('label');label.className='std-select-number';
  const box=document.createElement('input');box.type='checkbox';box.className='std-select-row';box.checked=selected.has(String(record.id));box.setAttribute('aria-label',(index+1)+'번 문서 선택');
  const number=document.createElement('span');number.textContent=String(index+1);label.append(box,number);row.cells[0].replaceChildren(label);
  box.addEventListener('click',event=>event.stopPropagation());
  box.addEventListener('change',()=>{if(box.checked)selected.add(String(record.id));else selected.delete(String(record.id));updateSelection();});
  const remarks=row.cells[9],note=document.createElement('span');note.className='std-row-note';note.textContent=record.note||'';note.title=record.note||'';
  const actions=document.createElement('div');actions.className='std-row-actions';
  for(const [title,handler] of [['수정',()=>open(record)],['삭제',()=>removeDocuments([String(record.id)])]]){
   const button=document.createElement('button');button.type='button';button.className='btn';button.textContent=title;button.addEventListener('click',event=>{event.stopPropagation();handler();});actions.append(button);
  }
  remarks.replaceChildren(note,actions);
  row.addEventListener('click',event=>{if(!event.target.closest('button,input,label'))open(record);});body.append(row);
 });
 if(!list.length){const row=document.createElement('tr');row.dataset.stdPlaceholder='1';row.className='std-placeholder';row.setAttribute('aria-hidden','true');for(let i=0;i<10;i++)row.append(document.createElement('td'));body.append(row);}
 updateSelection();
}
async function load(){
 if(loading)return loading;
 loading=(async()=>{records=await api();const existing=new Set(records.map(r=>String(r.id)));for(const id of selected)if(!existing.has(id))selected.delete(id);render();})().catch(error=>{if(typeof toast==='function')toast(error.message);}).finally(()=>{loading=null;});
 return loading;
}
function open(record=null){
 closeChoice();document.getElementById('standard')?.querySelector('.iqc-selection-dock')?.classList.remove('is-visible');
 const fields=[['문서번호','documentNo'],['문서명','name'],['구분','category'],['Rev.','revision'],['개정일','revisionDate'],['담당부서','department'],['상태','status'],['비고','note']];
 const html='<div class="form-grid">'+fields.map(([label,key])=>{
  const value=record?.[key]||'';
  const control=['status','department'].includes(key)?'<input type="hidden" data-standard-field="'+key+'" value="'+esc(value)+'"><button type="button" class="std-choice-trigger" data-standard-choice="'+key+'" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-label="'+label+' 선택"><span>'+esc(value)+'</span><span aria-hidden="true">⌄</span></button>':key==='note'?'<textarea data-standard-field="'+key+'" placeholder="비고 입력">'+esc(value)+'</textarea>':'<input data-standard-field="'+key+'" type="'+(key==='revisionDate'?'date':'text')+'" value="'+esc(value)+'" placeholder="'+esc(label)+' 입력">';
  return '<div class="form-item '+(key==='note'?'full':'')+'"><label>'+label+'</label>'+control+'</div>';
 }).join('')+'</div>';
 const title='문서관리 '+(record?'상세 / 수정':'신규등록');
 openModal(title,amaranthScreen('standard',html,record?'edit':'new',title),'<button class="btn" id="modalCancel" type="button">목록으로</button><button class="btn primary" id="modalSave" type="button">저장</button>');
 const root=document.querySelector('.am-split[data-am-screen="standard"]');
 const revisionDate=root.querySelector('[data-standard-field="revisionDate"]');
 if(revisionDate){
  const updateDate=()=>{revisionDate.dataset.standardEmpty=String(!revisionDate.value);};
  revisionDate.addEventListener('input',updateDate);revisionDate.addEventListener('change',updateDate);updateDate();
 }

 root.querySelectorAll('[data-standard-choice]').forEach(trigger=>{
  trigger.addEventListener('click',()=>{
   if(activeChoice?.trigger===trigger){closeChoice();return;}
   closeChoice();
   const key=trigger.dataset.standardChoice,input=root.querySelector('[data-standard-field="'+key+'"]');
   const options=[...new Set([...(key==='status'?statuses:departments),input.value].filter(Boolean))];
   const popup=document.createElement('div');popup.className='std-choice-popup';popup.setAttribute('role','listbox');
   popup.setAttribute('aria-label',key==='status'?'상태':'담당부서');
   options.forEach((value,index)=>{
    const button=document.createElement('button');button.type='button';button.className='std-choice-option';button.textContent=value;
    button.setAttribute('role','option');button.setAttribute('aria-selected',String(input.value===value));
    button.addEventListener('click',()=>{
     input.value=value;trigger.firstElementChild.textContent=value;
     input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
     closeChoice();trigger.focus();
    });
    button.addEventListener('keydown',event=>{
     if(event.key==='Escape'){event.preventDefault();closeChoice();trigger.focus();return;}
     if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();const buttons=[...popup.children];
      buttons[(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();
     }
    });
    popup.append(button);
   });
   document.body.append(popup);trigger.setAttribute('aria-expanded','true');activeChoice={trigger,popup};
   function position(){
    if(activeChoice?.popup!==popup)return;
    if(!trigger.isConnected){closeChoice();return;}
    const rect=trigger.getBoundingClientRect(),height=Math.min(popup.scrollHeight,240);
    popup.style.left=rect.left+'px';popup.style.width=rect.width+'px';
    popup.style.top=(rect.bottom+height+6>innerHeight?Math.max(8,rect.top-height-4):rect.bottom+4)+'px';
    requestAnimationFrame(position);
   }
   position();(popup.querySelector('[aria-selected="true"]')||popup.firstElementChild)?.focus();
  });
  trigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();trigger.click();}});
 });

 const old=document.getElementById('modalSave'),save=old.cloneNode(true);old.replaceWith(save);
 let busy=false;
 save.addEventListener('click',async()=>{
  if(busy)return;
  const body={};root.querySelectorAll('[data-standard-field]').forEach(el=>body[el.dataset.standardField]=el.value.trim());
  if(!body.documentNo||!body.name){toast('문서번호와 문서명을 입력해 주세요.');return;}
  if(!statuses.includes(body.status)){toast('문서 상태를 선택해 주세요.');return;}
  busy=true;save.disabled=true;save.textContent='저장 중...';
  try{
   const saved=await api(record?'/'+encodeURIComponent(record.id):'',{method:record?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const index=records.findIndex(r=>r.id===saved.id);if(index<0)records.unshift(saved);else records[index]=saved;
   render();closeModal();toast('문서가 공용 서버에 저장되었습니다.');
  }catch(error){toast('문서 저장 실패: '+error.message);}
  finally{busy=false;if(save.isConnected){save.disabled=false;save.textContent='저장';}}
 });
}
document.addEventListener('pointerdown',event=>{if(activeChoice&&!activeChoice.popup.contains(event.target)&&!activeChoice.trigger.contains(event.target))closeChoice();},true);
document.addEventListener('keydown',event=>{if(activeChoice&&(event.key==='Escape'||event.key==='Tab'))closeChoice();},true);
window.qmesStandardDocuments={open,load,openRow:row=>open(records.find(r=>String(r.id)===String(row?.dataset.standardId))||null)};
const style=document.createElement('style');style.textContent='#mainWorkspace .am-split[data-am-screen="standard"] select,#mainWorkspace .am-split[data-am-screen="standard"] select option{color:#243e5d!important;-webkit-text-fill-color:#243e5d!important;background:#fff!important;font-family:inherit!important;font-size:12px!important;opacity:1!important;visibility:visible!important}';document.head.append(style);
function install(){
 const section=document.getElementById('standard'),table=section?.querySelector('.module-body>table');
 if(!table)return;
 ensureSelectionHeader();
 if(table.dataset.standardDbWired)return;
 table.dataset.standardDbWired='1';
 const search=section.querySelector('.module-toolbar .search-input');search?.addEventListener('input',render);
 load();
}
let queued=false;new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;install();});}}).observe(document.body,{childList:true,subtree:true});
document.querySelector('.sidebar .menu[data-page="standard"]')?.addEventListener('click',()=>{install();if(document.getElementById('standard')?.querySelector('[data-standard-db-wired]'))load();});
install();
})();

(()=>{const style=document.createElement('style');style.textContent="\n#mainWorkspace .am-split[data-am-screen=\"standard\"] .std-choice-trigger{display:flex!important;align-items:center!important;justify-content:space-between!important;box-sizing:border-box!important;width:100%!important;height:30px!important;border:1px solid #cfd7df!important;border-radius:2px!important;background:#fff!important;color:#243e5d!important;font:600 12px Pretendard,\"Noto Sans KR\",Arial,sans-serif!important;text-align:left!important;padding:0 10px!important;cursor:pointer!important}\n.std-choice-popup{position:fixed!important;z-index:200000!important;box-sizing:border-box!important;max-height:240px!important;overflow:auto!important;border:1px solid #cfd7df!important;border-radius:3px!important;background:#fff!important;box-shadow:0 6px 18px #173b6126!important;padding:4px!important;color:#243e5d!important}\n.std-choice-popup .std-choice-option{display:block!important;width:100%!important;min-height:32px!important;border:0!important;border-radius:2px!important;background:#fff!important;color:#243e5d!important;-webkit-text-fill-color:#243e5d!important;font:12px Pretendard,\"Noto Sans KR\",Arial,sans-serif!important;text-align:left!important;padding:6px 10px!important;cursor:pointer!important}\n.std-choice-popup .std-choice-option:hover,.std-choice-popup .std-choice-option:focus,.std-choice-popup .std-choice-option[aria-selected=\"true\"]{background:#edf5ff!important;outline:0!important}\n";document.head.append(style);})();

(()=>{const style=document.createElement('style');style.id='standard-empty-field-labels-20261027';style.textContent="\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] input[type=\"date\"],\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .std-choice-trigger{font-size:12px!important;font-weight:400!important;color:#344054!important;-webkit-text-fill-color:#344054!important}\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] input[type=\"date\"]::-webkit-datetime-edit{font-family:inherit!important;font-weight:400!important;color:inherit!important}\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] input[type=\"date\"][data-standard-empty=\"true\"]::-webkit-datetime-edit{color:transparent!important;-webkit-text-fill-color:transparent!important}\n";document.head.append(style);})();

(()=>{const style=document.createElement('style');style.id='standard-uniform-form-controls-20261027';style.textContent="\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .am-section-body>.form-grid>.form-item>:is(input:not([type=\"hidden\"]),select,.std-choice-trigger){\n box-sizing:border-box!important;width:calc(100% - 16px)!important;max-width:calc(100% - 16px)!important;min-width:0!important;height:30px!important;min-height:30px!important;margin:5px 8px!important;padding:5px 8px!important;border:1px solid #cfd7df!important;border-radius:2px!important;background:#fff!important;font-family:inherit!important;font-size:12px!important;font-weight:400!important;line-height:18px!important;color:#344054!important;\n}\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .am-section-body>.form-grid>.form-item>.std-choice-trigger{justify-self:stretch!important;align-self:center!important}\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .am-section-body>.form-grid>.form-item>textarea{box-sizing:border-box!important;width:calc(100% - 16px)!important;margin:5px 8px!important;padding:5px 8px!important;border:1px solid #cfd7df!important;border-radius:2px!important;font-size:12px!important;font-weight:400!important;color:#344054!important}\n";document.head.append(style);})();

(()=>{const style=document.createElement('style');style.id='standard-selection-actions-20261027';style.textContent="\nhtml body #standard#standard .std-document-list tr{grid-template-columns:86px repeat(7,minmax(0,1fr))!important}\nhtml body #standard#standard .std-document-list .std-select-number{display:grid!important;grid-template-columns:20px minmax(0,1fr)!important;align-items:center!important;justify-content:center!important;width:100%!important;height:100%!important;gap:0!important;margin:0!important}\nhtml body #standard#standard .std-document-list .std-select-number input{width:13px!important;height:13px!important;min-height:0!important;margin:0 auto!important;accent-color:#2f7de1}\nhtml body #standard#standard .std-document-list .std-row-actions{display:flex!important;justify-content:center!important;gap:6px!important;align-items:center!important;flex-shrink:0}\nhtml body #standard#standard .std-document-list .std-row-actions .btn{height:25px!important;min-height:25px!important;line-height:23px!important;padding:0 8px!important;margin:0!important;border:1px solid #cbd8e7!important;background:#f7faff!important;color:#315f94!important;border-radius:3px!important;font-size:11px!important}\nhtml body #standard#standard .std-document-list .std-row-actions .btn:last-child{color:#b42318!important;border-color:#edc4c4!important;background:#fff!important}\nhtml body #standard#standard .std-document-list .std-row-note{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:14px}\nhtml body #standard#standard .std-document-list .std-row-note:empty{display:none}\nhtml body #standard#standard .std-document-list tbody tr.std-selected>td{background:#eef6ff!important}\n";document.head.append(style);})();

(()=>{const style=document.createElement('style');style.textContent="html body #standard#standard .std-document-list tbody tr>td:nth-child(10){flex-direction:row!important;gap:6px!important}html body #standard#standard .std-document-list .std-row-note{flex:1;min-width:0}html body #standard#standard .std-document-list .std-row-actions{flex:0 0 auto}";document.head.append(style);})();
