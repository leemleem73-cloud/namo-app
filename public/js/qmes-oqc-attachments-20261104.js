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
const style=document.createElement('style');style.textContent='.oqc-file-field{display:grid;grid-template-columns:128px minmax(180px,1fr) minmax(100px,1fr);align-items:center;gap:12px;padding:10px 12px;border:1px solid #d7e0e9;background:#f7faff;color:#244260;font:12px Pretendard,"Malgun Gothic",sans-serif;margin:10px 0}.oqc-file-field label{font-weight:600;text-align:center}.oqc-file-field input{min-width:0;width:100%;font:inherit}.oqc-file-info{overflow-wrap:anywhere}html body #outgoing [data-coa-file-cell]{white-space:normal!important;padding:8px 10px!important;vertical-align:middle!important;text-align:center!important}html body #outgoing [data-coa-file-cell] a{display:block!important;max-width:100%;overflow:visible!important;text-overflow:clip!important;white-space:normal!important;overflow-wrap:anywhere!important;line-height:1.5!important;color:#245b9e;text-align:center!important}@media(max-width:760px){.oqc-file-field{grid-template-columns:100px minmax(0,1fr)}.oqc-file-info{grid-column:2}}';document.head.append(style);
window.qmesOqcFiles={mount,read};
new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;scan();});}).observe(document.body,{childList:true,subtree:true});
scan();
})();

/* Compact outgoing list: reserve room for the complete inspection item names and use CoA as file heading. */
(function(){
 const root=document.getElementById('outgoing');if(!root)return;
 const style=document.createElement('style');style.textContent='html body #outgoing .ip-table tbody td[data-oqc-check-summary]{word-break:keep-all!important;overflow-wrap:normal!important;white-space:normal!important;padding-left:5px!important;padding-right:5px!important}#outgoing [data-oqc-check-summary] span{display:inline-block;white-space:nowrap}';document.head.append(style);
 let queued=false;function scan(){queued=false;
  root.querySelectorAll('.ip-table').forEach(table=>{const ths=[...table.querySelectorAll('thead th')];
   const file=ths.find(th=>['첨부파일','CoA'].includes((th.querySelector('.iqc-column-label')?.textContent||th.textContent).trim()));if(file){const label=file.querySelector('.iqc-column-label')||file;if(label.textContent!=='CoA')label.textContent='CoA';}
   const i=ths.findIndex(th=>(th.querySelector('.iqc-column-label')?.textContent||th.textContent).trim()==='검사항목');if(i<0)return;
   table.querySelectorAll('tbody tr').forEach(tr=>{const td=tr.children[i];if(!td||tr.children.length!==ths.length||td.dataset.oqcCheckSummary)return;td.dataset.oqcCheckSummary='1';const values=td.textContent.split('/').map(value=>value.trim());td.replaceChildren();values.forEach((value,index)=>{if(index)td.append(document.createTextNode(' / '));const span=document.createElement('span');span.textContent=value;td.append(span);});});
  });
 }
 function schedule(){if(!queued){queued=true;queueMicrotask(scan);}}
 new MutationObserver(schedule).observe(root,{subtree:true,childList:true});scan();
})();
