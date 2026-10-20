
/* OQC CoA lifecycle: only explicit issuance creates an immutable server snapshot. */
(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>new Date(v).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
const style=document.createElement('style');style.textContent='.oqc-coa-panel{margin:10px 0;padding:12px;border:1px solid #cbd8e7;border-radius:6px;background:#f5f9ff;color:#244260;font:12px Pretendard,"Malgun Gothic",sans-serif}.oqc-coa-panel .coa-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.oqc-coa-panel button{cursor:pointer}.oqc-coa-panel .coa-error{color:#b42318;margin-top:8px}.oqc-coa-panel .coa-history{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.oqc-coa-panel small{display:block;color:#596d85;margin-top:6px}';document.head.append(style);
const api=async(path,targets)=>{const res=await fetch('/api/qmes/oqc/coa/'+path,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify(Array.isArray(targets)?{targets}:targets)});const json=await res.json().catch(()=>({}));if(!res.ok||!json.success)throw Error(json.message||'CoA 요청에 실패했습니다.');return json.data;};
const strip=row=>Object.fromEntries(Object.entries(row).filter(([k])=>!k.startsWith('__')));
function targetsFor(row){
 const record=document.getElementById('outgoing')?._oqcRecords?.get(String(row.dataset.sourceKey||'')+'|'+String(row.dataset.sourceId||''));
 if(!record)throw Error('목록을 다시 조회해 주세요.');
 return (record.__groupChecks||[record]).map(source=>({recordKey:source.__sourceRecordKey,rowId:source.__sourceRowId,expected:strip(source)}));
}
async function viewIssued(issue,original){
 try{issue=await api('record',{issueId:issue.id});}catch(e){toast(e.message);return;}
 const snap=issue.snapshot,section=document.getElementById('outgoing'),tr=original.cloneNode(true);
 const group=snap.items.map((item,index)=>({...snap.fields,id:'coa-'+issue.id+'-'+index,check:item.name,measurements:item.values,judge:item.judge,__sourceRecordKey:'coa-issued',__sourceRowId:issue.id}));
 const record={...group[0],__groupChecks:group};
 section._oqcRecords.set('coa-issued|'+issue.id,record);tr.dataset.sourceKey='coa-issued';tr.dataset.sourceId=issue.id;tr._coaIssue=issue;
 const fields={'검사일자':snap.fields.date,'고객사':snap.fields.customer,'제품명':snap.fields.product,'완제품 LOT':snap.fields.lot,'검사합부':snap.overall,'검사자':snap.fields.inspector};
 pageInfo.outgoing[2].forEach((name,index)=>{if(fields[name]!==undefined)tr.cells[index+1].textContent=fields[name]||'-';});
 issueInspectionReport('outgoing',tr);
}
window.qmesCoaAttach=async function(row){
 const root=document.querySelector('.std-inspection[data-inspection-type="outgoing"]');if(!root)return;
 const host=root.closest('.am-detail-pane');if(!host)return;
 const panel=document.createElement('div');panel.className='oqc-coa-panel';panel.setAttribute('aria-live','polite');root.before(panel);
 const print=document.getElementById('printReportBtn');if(print)print.textContent=row._coaIssue?'발행본 인쇄':'미리보기 인쇄';
 const statusCell=[...root.querySelectorAll('.std-info>.k')].find(el=>el.textContent.trim()==='CoA 상태')?.nextElementSibling;
 const docCells=root.querySelectorAll('.std-inspection-doc .v');
 if(row._coaIssue){
  const issue=row._coaIssue;
  if(statusCell)statusCell.textContent=issue.canceledAt?'발행취소':'발행완료 (보존본)';
  if(docCells[0])docCells[0].textContent=issue.number;
  if(docCells[3])docCells[3].textContent=issue.canceledAt?'발행취소 · 이력 보존':'발행 당시 확정본';
  panel.innerHTML='<b>'+esc(issue.number)+'</b><div>발행일시 '+esc(fmt(issue.issuedAt))+' · 발행자 '+esc(issue.issuedBy)+'</div><small>발행 당시 기록입니다. 현재 검사값과 다를 수 있습니다.</small><div class="coa-actions"><button class="btn" data-coa-back type="button">현재 검사기록으로</button></div>';

  if(issue.canceledAt){
   panel.insertAdjacentHTML('beforeend','<div class="coa-error"><b>발행취소</b> · '+esc(fmt(issue.canceledAt))+' · '+esc(issue.canceledBy)+'</div>');
   if(print){print.disabled=true;print.textContent='취소된 발행본';}
  }else{
   const cancel=document.createElement('button');cancel.type='button';cancel.className='btn';cancel.textContent='발행 취소';cancel.dataset.coaCancel='1';panel.querySelector('.coa-actions').append(cancel);
   cancel.onclick=()=>{
    const dialog=document.createElement('div');dialog.className='iqc-delete-backdrop';
    dialog.innerHTML='<div class="iqc-delete-dialog" role="dialog" aria-modal="true"><h3>CoA 발행 취소</h3><p>'+esc(issue.number)+' 발행을 취소하고 미발행 상태로 돌아갑니다. 취소 이력은 보존됩니다.</p><div class="iqc-delete-buttons"><button type="button" data-cancel>닫기</button><button type="button" data-confirm>발행 취소</button></div></div>';
    document.body.append(dialog);dialog.querySelector('[data-cancel]').onclick=()=>dialog.remove();
    dialog.querySelector('[data-confirm]').onclick=async()=>{dialog.remove();cancel.disabled=true;try{const changed=await api('cancel',{issueId:issue.id});viewIssued(changed,row);toast('CoA 발행 취소 완료 · 미발행 상태로 변경되었습니다.');}catch(e){toast(e.message);cancel.disabled=false;}};
   };
   // Recheck revocation before every official print, including stale open tabs.
   let permitted=false;
   print?.addEventListener('click',async event=>{
    if(permitted)return;event.preventDefault();event.stopImmediatePropagation();
    try{const fresh=await api('record',{issueId:issue.id});if(fresh.canceledAt){viewIssued(fresh,row);toast('취소된 발행본은 인쇄할 수 없습니다.');return;}permitted=true;print.click();permitted=false;}
    catch(e){permitted=false;toast(e.message);}
   },true);
  }
  panel.querySelector('[data-coa-back]').onclick=()=>{const current=(document.getElementById('outgoing')._inspectionAllRows||[]).find(tr=>{const rec=document.getElementById('outgoing')._oqcRecords?.get(tr.dataset.sourceKey+'|'+tr.dataset.sourceId);return rec&&(rec.__groupChecks||[rec]).some(check=>snapSources(issue).some(src=>src.recordKey===check.__sourceRecordKey&&src.rowId===check.__sourceRowId));});if(current)issueInspectionReport('outgoing',current);else closeModal();};
  return;
 }
 let targets;
 try{targets=targetsFor(row);}catch(e){panel.textContent=e.message;return;}
 const showError=message=>{let e=panel.querySelector('.coa-error');if(!e){e=document.createElement('div');e.className='coa-error';panel.append(e);}e.textContent=message;};
 panel.textContent='CoA 발행 상태 확인 중…';
 try{
  const data=await api('status',targets);if(!root.isConnected)return;
  if(statusCell)statusCell.textContent=data.status;
  panel.innerHTML='<b>CoA '+esc(data.status)+'</b><div class="coa-actions"><button class="btn primary" data-coa-issue type="button">'+(data.status==='재발행 필요'?'CoA 재발행':'CoA 발행')+'</button></div><small>합격한 검사만 발행할 수 있습니다. 발행본은 발행 당시 값으로 보존됩니다.</small><div class="coa-history"></div>';
  const button=panel.querySelector('[data-coa-issue]');
  button.disabled=!data.canIssue||data.status==='발행완료';
  if(!data.canIssue)button.title='모든 측정값이 합격이고 검사자가 저장되어야 합니다.';
  if(data.history.length){
   const latest=data.history[0];const info=document.createElement('div');info.textContent=(latest.canceledAt?'최근 발행취소 ':'최근 발행 ')+latest.number+' · '+fmt(latest.canceledAt||latest.issuedAt)+' · '+(latest.canceledBy||latest.issuedBy);panel.querySelector('.coa-actions').after(info);
   for(const issue of data.history){const b=document.createElement('button');b.className='btn';b.type='button';b.textContent=issue.number+(issue.canceledAt?' (발행취소)':' 발행본');b.onclick=()=>viewIssued(issue,row);panel.querySelector('.coa-history').append(b);}
  }
  button.onclick=()=>{
   const dialog=document.createElement('div');dialog.className='iqc-delete-backdrop';
   dialog.innerHTML='<div class="iqc-delete-dialog" role="dialog" aria-modal="true"><h3>CoA '+(data.status==='재발행 필요'?'재발행':'발행')+'</h3><p>현재 저장된 검사값을 확정본으로 보존하고 발행번호·발행일시·발행자를 기록합니다.</p><div class="iqc-delete-buttons"><button type="button" data-cancel>취소</button><button type="button" data-confirm>발행</button></div></div>';
   document.body.append(dialog);dialog.querySelector('[data-cancel]').onclick=()=>dialog.remove();
   dialog.querySelector('[data-confirm]').onclick=async()=>{dialog.remove();button.disabled=true;try{const issue=await api('issue',targets);if(root.isConnected){viewIssued(issue,row);toast('CoA 발행 완료 · '+issue.number);}}catch(e){showError(e.message);button.disabled=false;}};
  };
 }catch(e){if(root.isConnected){panel.textContent='CoA 상태 확인 실패';showError(e.message);if(statusCell)statusCell.textContent='조회 실패';}}
};
function snapSources(issue){return issue.snapshot.sources||[];}
})();
