(function(){
'use strict';
const endpoint='/api/qmes/standard-documents',statuses=['대기','진행','완료'];
let records=[],loading=null;
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
function render(){
 const section=document.getElementById('standard'),body=section?.querySelector('.module-body>table tbody');
 if(!body)return;
 const query=(section.querySelector('.module-toolbar .search-input')?.value||'').trim().toLowerCase();
 const list=records.filter(r=>!query||[r.documentNo,r.name,r.category,r.department].some(v=>String(v||'').toLowerCase().includes(query)));
 body.replaceChildren();
 list.forEach((record,index)=>{
  const row=document.createElement('tr');row.className='data-row';row.dataset.standardId=record.id;row.dataset.remarks=record.note||'';
  [String(index+1),record.documentNo,record.name,record.category,record.revision,record.revisionDate,record.department,record.status].forEach(value=>{const td=document.createElement('td');td.textContent=value||'-';row.append(td);});
  row.addEventListener('click',()=>open(record));body.append(row);
 });
 if(!list.length){const row=document.createElement('tr');row.dataset.stdPlaceholder='1';row.className='std-placeholder';row.setAttribute('aria-hidden','true');for(let i=0;i<10;i++)row.append(document.createElement('td'));body.append(row);}
}
async function load(){
 if(loading)return loading;
 loading=(async()=>{records=await api();render();})().catch(error=>{if(typeof toast==='function')toast(error.message);}).finally(()=>{loading=null;});
 return loading;
}
function open(record=null){
 const fields=[['문서번호','documentNo'],['문서명','name'],['구분','category'],['Rev.','revision'],['개정일','revisionDate'],['담당부서','department'],['상태','status'],['비고','note']];
 const html='<div class="form-grid">'+fields.map(([label,key])=>{
  const value=record?.[key]||'';
  const control=key==='status'?'<select data-standard-field="status" aria-label="문서 상태">'+statuses.map(status=>'<option value="'+status+'"'+((value||'대기')===status?' selected':'')+'>'+status+'</option>').join('')+'</select>':key==='note'?'<textarea data-standard-field="'+key+'" placeholder="비고 입력">'+esc(value)+'</textarea>':'<input data-standard-field="'+key+'" type="'+(key==='revisionDate'?'date':'text')+'" value="'+esc(value)+'" placeholder="'+esc(label)+' 입력">';
  return '<div class="form-item '+(['status','note'].includes(key)?'full':'')+'"><label>'+label+'</label>'+control+'</div>';
 }).join('')+'</div>';
 const title='문서관리 '+(record?'상세 / 수정':'신규등록');
 openModal(title,amaranthScreen('standard',html,record?'edit':'new',title),'<button class="btn" id="modalCancel" type="button">목록으로</button><button class="btn primary" id="modalSave" type="button">저장</button>');
 const root=document.querySelector('.am-split[data-am-screen="standard"]');
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
window.qmesStandardDocuments={open,load};
const style=document.createElement('style');style.textContent='#mainWorkspace .am-split[data-am-screen="standard"] select,#mainWorkspace .am-split[data-am-screen="standard"] select option{color:#243e5d!important;-webkit-text-fill-color:#243e5d!important;background:#fff!important;font-family:inherit!important;font-size:12px!important;opacity:1!important;visibility:visible!important}';document.head.append(style);
function install(){
 const section=document.getElementById('standard'),table=section?.querySelector('.module-body>table');
 if(!table||table.dataset.standardDbWired)return;
 table.dataset.standardDbWired='1';
 const search=section.querySelector('.module-toolbar .search-input');search?.addEventListener('input',render);
 load();
}
let queued=false;new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;install();});}}).observe(document.body,{childList:true,subtree:true});
document.querySelector('.sidebar .menu[data-page="standard"]')?.addEventListener('click',()=>{install();if(document.getElementById('standard')?.querySelector('[data-standard-db-wired]'))load();});
install();
})();
