/* Customer supplied COA files are distinct from inspection reports. */
(()=>{
'use strict';
const base='/api/qmes/oqc/attachments';
let files=[],loading=null;
const states=new WeakMap();
async function refresh(){
 if(loading)return loading;
 loading=(async()=>{const r=await fetch(base,{credentials:'same-origin',cache:'no-store'});const j=await r.json();if(!r.ok||!j.success)throw Error(j.message||'COA 조회 실패');files=j.data;return files;})().finally(()=>loading=null);
 return loading;
}
function match(targets){return files.find(f=>(f.sources||[]).some(s=>targets.some(t=>s.recordKey===t.recordKey&&s.rowId===t.rowId)));}
function link(file){const a=document.createElement('a');a.href=base+'/'+encodeURIComponent(file.id);a.target='_blank';a.rel='noopener';a.textContent=file.name;a.title=file.name;a.addEventListener('click',e=>e.stopPropagation());return a;}
function mount(root,targets=[]){
 if(states.has(root))return states.get(root);
 const box=document.createElement('div');box.className='oqc-file-field';
 const label=document.createElement('label');label.textContent='COA 첨부파일';
 const input=document.createElement('input');input.type='file';input.accept='.pdf,.png,.jpg,.jpeg';input.setAttribute('aria-label','COA 첨부파일');
 const info=document.createElement('span');info.className='oqc-file-info';info.textContent='PDF · JPG · PNG / 최대 5MB';
 box.append(label,input,info);
 const anchor=root.querySelector('.std-info.am-inline-edit-grid,.am-inline-edit-grid');
 if(anchor)anchor.after(box);else root.append(box);
 const state={input,targets,info};states.set(root,state);
 input.addEventListener('change',()=>{info.textContent=input.files[0]?input.files[0].name+' · 저장 버튼을 누르면 첨부됩니다.':'PDF · JPG · PNG / 최대 5MB';});
 if(targets.length)refresh().then(()=>{if(!input.files.length&&root.isConnected){const f=match(targets);info.replaceChildren();if(f)info.append(link(f));else info.textContent='첨부파일 없음';}}).catch(()=>{if(root.isConnected)info.textContent='기존 COA 조회 실패 · 목록을 다시 조회해 주세요.';});
 return state;
}
async function read(root){
 const state=states.get(root)||mount(root),file=state.input.files[0];
 if(!file)return undefined;
 if(file.size>5*1024*1024||!file.size)throw Error('COA 파일은 5MB 이하로 첨부해 주세요.');
 if(!/\.(pdf|png|jpe?g)$/i.test(file.name))throw Error('COA는 PDF, JPG, PNG로 첨부해 주세요.');
 const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('COA 파일을 읽지 못했습니다.'));reader.readAsDataURL(file);});
 return {name:file.name,base64};
}
let pending=false;
function scan(){
 document.querySelectorAll('.std-inspection.oqc-pqc-layout[data-inspection-type="outgoing"]').forEach(root=>mount(root));
 document.querySelectorAll('#outgoing tr[data-source-key]').forEach(tr=>{
  const cell=tr.querySelector('[data-coa-file-cell]');if(!cell||cell.dataset.loaded)return;
  const record=document.getElementById('outgoing')._oqcRecords?.get(tr.dataset.sourceKey+'|'+tr.dataset.sourceId);
  if(!record)return;
  const targets=(record.__groupChecks||[record]).map(r=>({recordKey:r.__sourceRecordKey,rowId:r.__sourceRowId}));
  cell.dataset.loaded='1';cell.textContent='조회 중';
  refresh().then(()=>{if(!cell.isConnected)return;cell.replaceChildren();const file=match(targets);if(file)cell.append(link(file));else cell.textContent='—';}).catch(()=>{cell.textContent='조회 실패';cell.dataset.loaded='error';});
 });
}
const style=document.createElement('style');style.textContent='.oqc-file-field{display:grid;grid-template-columns:128px minmax(180px,1fr) minmax(100px,1fr);align-items:center;gap:12px;padding:10px 12px;border:1px solid #d7e0e9;background:#f7faff;color:#244260;font:12px Pretendard,"Malgun Gothic",sans-serif;margin:10px 0}.oqc-file-field label{font-weight:600;text-align:center}.oqc-file-field input{min-width:0;width:100%;font:inherit}.oqc-file-info{overflow-wrap:anywhere}[data-coa-file-cell] a{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#245b9e}@media(max-width:760px){.oqc-file-field{grid-template-columns:100px minmax(0,1fr)}.oqc-file-info{grid-column:2}}';document.head.append(style);
window.qmesOqcFiles={mount,read};
new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;scan();});}).observe(document.body,{childList:true,subtree:true});
scan();
})();
