(function(){
'use strict';
const endpoint='/api/qmes/standard-documents',statuses=['대기','진행','완료'];
const departments=['대표','연구소','생산부','영업부','품질부','관리부'];
let records=[],loading=null,activeChoice=null,listPage=1,currentDocumentId='';
try{listPage=Math.max(1,Number(sessionStorage.getItem('qmes-standard-list-page'))||1);}catch(_){}
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
 const section=document.getElementById('standard'),table=section?.querySelector('.module-body>table'),head=table?.querySelector('thead tr');
 if(!head||table.dataset.standardColumns==='split'&&head.querySelector('.std-select-all'))return;
 table.dataset.standardColumns='split';table.classList.add('std-document-list');head.dataset.stdLayout='1';
 head.replaceChildren();
 const columns=[['check',''],['no','No.'],['documentNo','문서번호'],['name','문서명'],['category','구분'],['revision','Rev.'],['revisionDate','개정일'],['department','담당부서'],['status','상태'],['attachment','첨부파일'],['note','비고'],['manage','관리']];
 columns.forEach(([key,title])=>{const cell=document.createElement('th');cell.dataset.standardCol=key;cell.textContent=title;head.append(cell);});
 const input=document.createElement('input');input.type='checkbox';input.className='std-select-all';input.setAttribute('aria-label','문서 전체 선택');head.cells[0].append(input);
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
 const pages=Math.max(1,Math.ceil(list.length/10));listPage=Math.min(Math.max(1,listPage),pages);
 try{sessionStorage.setItem('qmes-standard-list-page',String(listPage));}catch(_){}
 const offset=(listPage-1)*10,visible=list.slice(offset,offset+10);
 body.replaceChildren();
 visible.forEach((record,rowIndex)=>{
  const index=offset+rowIndex;
  const row=document.createElement('tr');row.className='data-row';row.dataset.standardId=record.id;row.dataset.remarks=record.note||'';row.dataset.stdLayout='1';row.classList.toggle('std-current',String(record.id)===currentDocumentId);
  const keys=['check','no','documentNo','name','category','revision','revisionDate','department','status','attachment','note','manage'];
  ['',String(index+1),record.documentNo,record.name,record.category,record.revision,record.revisionDate,record.department,record.status,'첨부 없음',record.note,''].forEach((value,i)=>{const td=document.createElement('td');td.dataset.standardCol=keys[i];td.textContent=value||'';row.append(td);});
  row.cells[3].className='std-document-name';
  row.cells[3].title=record.name||'';
  if(record.attachments?.length){
   const cell=row.cells[9];cell.replaceChildren();
   record.attachments.slice(0,1).forEach(file=>{
    const link=document.createElement('a');link.className='std-attachment-link';link.textContent=file.name;link.title=file.name;
    link.href=endpoint+'/'+encodeURIComponent(record.id)+'/attachments/'+encodeURIComponent(file.id);link.setAttribute('download',file.name);
    link.addEventListener('click',event=>event.stopPropagation());cell.append(link);
   });
   if(record.attachments.length>1){const more=document.createElement('span');more.textContent='외 '+(record.attachments.length-1)+'개';more.title='수정 화면에서 전체 첨부파일 확인';more.style.fontSize='10px';cell.append(more);}
  }

  const box=document.createElement('input');box.type='checkbox';box.className='std-select-row';box.checked=selected.has(String(record.id));box.setAttribute('aria-label',(index+1)+'번 문서 선택');
  row.cells[0].replaceChildren(box);
  box.addEventListener('click',event=>event.stopPropagation());
  box.addEventListener('change',()=>{if(box.checked)selected.add(String(record.id));else selected.delete(String(record.id));updateSelection();});
  const remarks=row.cells[10],note=document.createElement('span');note.className='std-row-note';note.textContent=record.note||'';note.title=record.note||'';
  const actions=document.createElement('div');actions.className='std-row-actions';
  for(const [title,handler] of [['수정',()=>open(record)],['삭제',()=>removeDocuments([String(record.id)])]]){
   const button=document.createElement('button');button.type='button';button.className='btn';button.textContent=title;button.addEventListener('click',event=>{event.stopPropagation();handler();});actions.append(button);
  }
  remarks.replaceChildren(note);row.cells[11].replaceChildren(actions);
  row.addEventListener('click',event=>{if(!event.target.closest('button,input,label,a'))open(record);});body.append(row);
 });
 if(!list.length){const row=document.createElement('tr');row.dataset.stdPlaceholder='1';row.className='std-placeholder';row.setAttribute('aria-hidden','true');for(const key of ['check','no','documentNo','name','category','revision','revisionDate','department','status','attachment','note','manage']){const td=document.createElement('td');td.dataset.standardCol=key;row.append(td);}body.append(row);}
 let pager=section.querySelector('.std-document-pagination');
 if(!pager){pager=document.createElement('div');pager.className='ip-pagination std-document-pagination';pager.setAttribute('aria-label','문서관리 목록 페이지');section.querySelector('.module-body').after(pager);}
 pager.replaceChildren();
 [[listPage-1,'‹'],...Array.from({length:pages},(_,i)=>[i+1,String(i+1)]),[listPage+1,'›']].forEach(([page,label])=>{
  const button=document.createElement('button');button.type='button';button.className='ip-page-btn'+(page===listPage&&/^\d+$/.test(label)?' active':'');button.textContent=label;
  button.disabled=page<1||page>pages;button.setAttribute('aria-label',label==='‹'?'이전 페이지':label==='›'?'다음 페이지':page+'페이지');
  if(page===listPage&&/^\d+$/.test(label))button.setAttribute('aria-current','page');
  button.onclick=()=>{listPage=page;render();};pager.append(button);
 });
 updateSelection();
}
async function load(){
 if(loading)return loading;
 loading=(async()=>{records=await api();const existing=new Set(records.map(r=>String(r.id)));for(const id of selected)if(!existing.has(id))selected.delete(id);render();})().catch(error=>{if(typeof toast==='function')toast(error.message);}).finally(()=>{loading=null;});
 return loading;
}
function open(record=null){
 let attachments=(record?.attachments||[]).map(file=>({...file})),attachmentReading=false;
 currentDocumentId=record?String(record.id):'';
 closeChoice();document.getElementById('standard')?.querySelector('.iqc-selection-dock')?.classList.remove('is-visible');
 const fields=[['문서번호','documentNo'],['문서명','name'],['구분','category'],['Rev.','revision'],['개정일','revisionDate'],['담당부서','department'],['상태','status'],['첨부파일','attachments'],['비고','note']];
 const html='<div class="form-grid">'+fields.map(([label,key])=>{
  const value=record?.[key]||'';
  const control=key==='attachments'?'<div class="std-attachment-field"><input type="file" id="stdDocumentFile" multiple aria-label="첨부파일 선택"><div class="std-attachment-list"></div></div>':['status','department'].includes(key)?'<input type="hidden" data-standard-field="'+key+'" value="'+esc(value)+'"><button type="button" class="std-choice-trigger" data-standard-choice="'+key+'" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-label="'+label+' 선택"><span>'+esc(value)+'</span><span aria-hidden="true">⌄</span></button>':key==='note'?'<textarea data-standard-field="'+key+'" placeholder="비고 입력">'+esc(value)+'</textarea>':'<input data-standard-field="'+key+'" type="'+(key==='revisionDate'?'date':'text')+'" value="'+esc(value)+'" placeholder="'+esc(label)+' 입력">';
  return '<div class="form-item '+(key==='note'?'full':'')+'"><label>'+label+'</label>'+control+'</div>';
 }).join('')+'</div>';
 const title='문서관리 '+(record?'상세 / 수정':'신규등록');
 const selectedRow=record?document.createElement('tr'):null;if(selectedRow)selectedRow.dataset.standardId=String(record.id);
 openModal(title,amaranthScreen('standard',html,record?'edit':'new',title,selectedRow),'<button class="btn" id="modalCancel" type="button">목록으로</button><button class="btn primary" id="modalSave" type="button">저장</button>');
 const root=document.querySelector('.am-split[data-am-screen="standard"]');
 const attachmentRoot=root.querySelector('.std-attachment-list'),fileInput=root.querySelector('#stdDocumentFile');

 const detail=root.querySelector('.am-detail-pane'),section=detail.querySelector('.am-section');
 const split=document.createElement('div');split.className='std-document-editor-split';
 const preview=document.createElement('section');preview.className='std-document-preview';
 preview.innerHTML='<div class="std-preview-head"><strong>문서 미리보기</strong><select aria-label="미리볼 첨부파일"></select></div><div class="std-preview-body"></div>';
 if(section){section.before(split);split.append(section,preview);}
 const previewSelect=preview.querySelector('select'),previewBody=preview.querySelector('.std-preview-body');
 let previewUrl='',previewSerial=0;
 function releasePreview(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}}
 async function showPreview(){
  const serial=++previewSerial;releasePreview();previewBody.replaceChildren();
  const file=attachments[Number(previewSelect.value)||0];
  if(!file){previewBody.textContent='첨부파일을 선택하면 여기에 문서가 표시됩니다.';return;}
  const mime=/\.pdf$/i.test(file.name)?'application/pdf':/\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name)?({'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png','gif':'image/gif','webp':'image/webp','bmp':'image/bmp'}[file.name.split('.').pop().toLowerCase()]):file.type;
  const supported=mime==='application/pdf'||/^image\/(png|jpeg|gif|webp|bmp)$/.test(mime||'');
  previewBody.textContent='파일을 불러오는 중입니다.';
  try{
   let blob;
   if(file.data){const bytes=Uint8Array.from(atob(file.data),c=>c.charCodeAt(0));blob=new Blob([bytes],{type:mime||'application/octet-stream'});}
   else{const response=await fetch(endpoint+'/'+encodeURIComponent(record.id)+'/attachments/'+encodeURIComponent(file.id),{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw Error('첨부파일을 불러오지 못했습니다.');blob=new Blob([await response.arrayBuffer()],{type:mime||'application/octet-stream'});}
   if(serial!==previewSerial||!root.isConnected)return;
   previewUrl=URL.createObjectURL(blob);previewBody.replaceChildren();
   if(supported){
    const viewer=document.createElement(mime==='application/pdf'?'iframe':'img');viewer.src=previewUrl;
    if(viewer.tagName==='IMG')viewer.alt=file.name;else viewer.title=file.name+' PDF 미리보기';
    previewBody.append(viewer);
   }else{
    const text=document.createElement('p');text.textContent='이 파일은 다운로드하여 확인해 주세요.';previewBody.append(text);
   }
   const download=document.createElement('a');download.href=previewUrl;download.download=file.name;download.textContent=file.name+' 다운로드';download.className='std-preview-download';previewBody.append(download);
  }catch(error){if(serial===previewSerial)previewBody.textContent=error.message;}
 }
 function updatePreview(){
  const previous=previewSelect.value;previewSelect.replaceChildren();
  attachments.forEach((file,index)=>{const option=document.createElement('option');option.value=index;option.textContent=file.name;previewSelect.append(option);});
  if(attachments[Number(previous)])previewSelect.value=previous;
  previewSelect.hidden=!attachments.length;showPreview();
 }
 previewSelect.addEventListener('change',showPreview);
 const cleanup=new MutationObserver(()=>{if(!root.isConnected){previewSerial++;releasePreview();cleanup.disconnect();}});
 cleanup.observe(document.getElementById('mainWorkspace'),{childList:true,subtree:true});

 function renderAttachments(){
  attachmentRoot.replaceChildren();
  attachments.forEach((file,index)=>{
   const row=document.createElement('div');row.className='std-file-row';
   const label=document.createElement(file.id?'a':'span');label.textContent=file.name;label.title=file.name;
   if(file.id){label.href=endpoint+'/'+encodeURIComponent(record.id)+'/attachments/'+encodeURIComponent(file.id);label.setAttribute('download',file.name);}
   const remove=document.createElement('button');remove.type='button';remove.textContent='제거';remove.setAttribute('aria-label',file.name+' 첨부 제거');
   remove.onclick=()=>{attachments.splice(index,1);renderAttachments();};
   row.append(label,remove);attachmentRoot.append(row);
  });
  updatePreview();
 }
 renderAttachments();
 fileInput.addEventListener('change',async()=>{
  const files=[...fileInput.files];if(!files.length)return;
  if(attachments.length+files.length>10||attachments.reduce((sum,file)=>sum+file.size,0)+files.reduce((sum,file)=>sum+file.size,0)>5*1024*1024){
   toast('첨부파일은 최대 10개, 전체 5MB까지 등록할 수 있습니다.');fileInput.value='';return;
  }
  attachmentReading=true;
  try{
   const added=await Promise.all(files.map(file=>new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onerror=()=>reject(Error('파일을 읽지 못했습니다.'));
    reader.onload=()=>resolve({name:file.name,type:file.type||'application/octet-stream',size:file.size,data:String(reader.result).split(',')[1]||''});
    reader.readAsDataURL(file);
   })));
   attachments.push(...added);renderAttachments();
  }catch(error){toast(error.message);}
  finally{attachmentReading=false;fileInput.value='';}
 });

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
  if(attachmentReading){toast('첨부파일을 읽는 중입니다. 잠시 후 저장해 주세요.');return;}
  const body={attachments};root.querySelectorAll('[data-standard-field]').forEach(el=>body[el.dataset.standardField]=el.value.trim());
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
window.qmesStandardDocuments={open,load,openById:id=>open(records.find(r=>String(r.id)===String(id))||null),listData:()=>records.map((r,index)=>({index,recordId:String(r.id),primary:[r.documentNo,r.name].filter(Boolean).join(' / '),secondary:[r.revision,r.department].filter(Boolean).join(' · ')})),openRow:row=>open(records.find(r=>String(r.id)===String(row?.dataset.standardId))||null)};
const style=document.createElement('style');style.textContent='#mainWorkspace .am-split[data-am-screen="standard"] select,#mainWorkspace .am-split[data-am-screen="standard"] select option{color:#243e5d!important;-webkit-text-fill-color:#243e5d!important;background:#fff!important;font-family:inherit!important;font-size:12px!important;opacity:1!important;visibility:visible!important}';document.head.append(style);
function install(){
 const section=document.getElementById('standard'),table=section?.querySelector('.module-body>table');
 if(!table)return;
 ensureSelectionHeader();
 if(table.dataset.standardDbWired)return;
 table.dataset.standardDbWired='1';
 const search=section.querySelector('.module-toolbar .search-input');search?.addEventListener('input',()=>{listPage=1;render();});
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

(()=>{const style=document.createElement('style');style.id='standard-separate-check-management-20261027';style.textContent="\nhtml body #standard#standard .std-document-list[data-standard-columns=\"split\"] tr{grid-template-columns:34px 52px repeat(7,minmax(0,1fr)) 120px!important}\nhtml body #standard#standard .std-document-list[data-standard-columns=\"split\"] tr>:nth-child(n){display:flex!important;order:0!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:none!important;flex-direction:column!important;justify-content:center!important;align-items:center!important}\nhtml body #standard#standard .std-document-list[data-standard-columns=\"split\"] tr>[data-standard-col=\"category\"],\nhtml body #standard#standard .std-document-list[data-standard-columns=\"split\"] tr>[data-standard-col=\"status\"]{display:none!important}\nhtml body #standard#standard .std-document-list[data-standard-columns=\"split\"] tr>[data-standard-col=\"check\"]{padding:0!important}\nhtml body #standard#standard .std-document-list[data-standard-columns=\"split\"] input[type=\"checkbox\"]{width:13px!important;height:13px!important;min-height:0!important;margin:0!important;accent-color:#2f7de1;cursor:pointer}\nhtml body #standard#standard .std-document-list[data-standard-columns=\"split\"] tr>[data-standard-col=\"name\"],\nhtml body #standard#standard .std-document-list[data-standard-columns=\"split\"] tr>[data-standard-col=\"note\"]{display:block!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;line-height:27px!important}\n";document.head.append(style);})();

(()=>{const style=document.createElement('style');style.id='standard-pagination-selection-parity-20261027';style.textContent="\nhtml body #standard .std-document-pagination{display:flex!important;align-items:center!important;justify-content:center!important;gap:4px!important;padding:10px 0 14px!important}\nhtml body #standard .std-document-pagination .ip-page-btn{min-width:28px!important;height:28px!important;border:1px solid #dbe3ec!important;border-radius:4px!important;background:#fff!important;color:#536177!important;font-size:12px!important}\nhtml body #standard .std-document-pagination .ip-page-btn.active{background:#2f7de1!important;border-color:#2f7de1!important;color:#fff!important}\nhtml body #standard#standard .std-document-list tbody tr.std-current>td{background:#eef6ff!important}\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .am-list-item.active{background:#eef6ff!important;box-shadow:inset 3px 0 #2686e8!important}\n";document.head.append(style);})();

(()=>{const style=document.createElement('style');style.id='standard-attachment-field-20261027';style.textContent="\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .std-attachment-field{box-sizing:border-box;min-width:0;width:calc(100% - 16px);margin:5px 8px}\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .std-attachment-field>input[type=\"file\"]{box-sizing:border-box;width:100%;height:30px;min-height:30px;padding:3px 6px;margin:0;border:1px solid #cfd7df;border-radius:2px;font:12px inherit;background:#fff;color:#344054}\n.std-attachment-list{display:grid;gap:4px}.std-file-row{display:flex;align-items:center;gap:8px;min-width:0;padding-top:4px}\n.std-file-row>a,.std-file-row>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#1673c7;font-size:11px}\n.std-file-row>button{flex-shrink:0;margin-left:auto;border:1px solid #edc4c4;border-radius:3px;background:#fff;color:#b42318;padding:2px 6px;font-size:10px}\nhtml body #standard#standard .std-document-list .std-attachment-link{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:#1673c7;text-decoration:underline}\n";document.head.append(style);})();

(()=>{const style=document.createElement('style');style.id='standard-attachment-fit-20261027';style.textContent="\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .am-section-body>.form-grid>.form-item>.std-attachment-field{\n display:block!important;box-sizing:border-box!important;min-width:0!important;width:calc(100% - 16px)!important;max-width:calc(100% - 16px)!important;margin:5px 8px!important;padding:0!important;overflow:hidden!important;align-self:center!important;\n}\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .std-attachment-field>input[type=\"file\"]{\n display:block!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;height:30px!important;min-height:30px!important;margin:0!important;padding:3px 6px!important;border:1px solid #cfd7df!important;border-radius:2px!important;background:#fff!important;color:#344054!important;font-family:inherit!important;font-size:11px!important;font-weight:400!important;line-height:22px!important;white-space:nowrap!important;overflow:hidden!important;\n}\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .std-attachment-field>input[type=\"file\"]::file-selector-button{\n box-sizing:border-box!important;height:22px!important;max-height:22px!important;margin:0 6px 0 0!important;padding:0 7px!important;border:1px solid #b9c5d2!important;border-radius:2px!important;background:#f8fafc!important;color:#344054!important;font-family:inherit!important;font-size:11px!important;line-height:20px!important;vertical-align:top!important;cursor:pointer;\n}\n";document.head.append(style);})();

(()=>{const style=document.createElement('style');style.textContent="\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .std-document-editor-split{display:grid;grid-template-columns:minmax(0,3fr) minmax(220px,1fr);gap:14px;align-items:start}\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .std-document-editor-split>.am-section{min-width:0;width:100%;margin:0}\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .std-document-editor-split .form-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}\nhtml body #mainWorkspace .am-split[data-am-screen=\"standard\"] .std-document-editor-split .form-item{grid-column:auto!important;min-width:0}\nhtml body #mainWorkspace .am-split[data-am-screen=standard] .std-document-editor-split .form-item.full{grid-column:1/-1!important}\n.std-document-preview{border:1px solid #d6e1ee;border-radius:7px;background:#fff;overflow:hidden;min-width:0}\n.std-preview-head{display:flex;gap:12px;align-items:center;padding:10px 12px;background:#f6f9fc;border-bottom:1px solid #d6e1ee;color:#234765;font-size:12px}\n.std-preview-head select{min-width:0;flex:1;height:30px;border:1px solid #cbd8e6;background:#fff;color:#344054;font:inherit}\n.std-preview-body{min-height:240px;padding:10px;display:flex;flex-direction:column;gap:10px;align-items:center;justify-content:center;color:#7b8b9c;font-size:12px;background:#f9fbfd}\n.std-preview-body img{display:block;max-width:100%;height:auto;max-height:320px;object-fit:contain}\n.std-preview-body iframe{display:block;width:100%;height:320px;min-height:240px;border:0;background:#fff}\n.std-preview-download{font-size:12px;color:#1673c7;overflow-wrap:anywhere}\n@media(max-width:1100px){html body #mainWorkspace .am-split[data-am-screen=\"standard\"] .std-document-editor-split{grid-template-columns:minmax(0,1fr)}}\n";document.head.append(style);})();