/* IQC delete fix — supports recovered legacy rows that do not have inNo. */
(function(){
  'use strict';
  if(window.__QMES_IQC_DELETE_FIX_20260813__) return;
  window.__QMES_IQC_DELETE_FIX_20260813__ = true;

  const clean = (v) => String(v == null ? '' : v).replace(/\s+/g,' ').trim();
  const date10 = (v) => clean(v).slice(0,10);
  const composite = (r) => [date10(r?.recv || r?.inspectedAt), clean(r?.name), clean(r?.supplier), clean(r?.lot)].join('|');

  function findRecordFromTableRow(tr){
    const cells = Array.from(tr?.cells || []);
    if(cells.length < 4) return null;
    const recv = date10(cells[0]?.textContent);
    const name = clean(cells[1]?.textContent);
    const supplier = clean(cells[2]?.textContent);
    const lot = clean(cells[3]?.textContent);
    const list = Array.isArray(window.DB?.iqc) ? DB.iqc : [];
    return list.find((r) => date10(r.recv || r.inspectedAt) === recv && clean(r.name) === name && clean(r.supplier) === supplier && clean(r.lot) === lot)
      || list.find((r) => date10(r.recv || r.inspectedAt) === recv && clean(r.lot) === lot)
      || null;
  }

  function saveRecoverySnapshot(rows){
    try{
      localStorage.setItem('qmes-iqc-recovery-snapshot-20260813', JSON.stringify({savedAt:new Date().toISOString(), iqc:rows}));
    }catch(_error){}
  }

  async function handleDelete(event){
    const button = event.target?.closest?.('.qmes-iqc-action-delete');
    if(!button) return;
    const tr = button.closest('tr');
    const record = findRecordFromTableRow(tr);
    if(!record) return; // fall back to native React handler when record cannot be resolved

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const label = clean(record.inNo) || `${date10(record.recv || record.inspectedAt)} / ${clean(record.lot) || clean(record.name)}`;
    const reason = window.prompt(`수입검사 ${label} 삭제 사유를 입력하세요.\n취소하면 삭제하지 않습니다.`, '기록 정리');
    if(reason === null) return;
    if(!clean(reason)){
      window.alert('삭제 사유를 입력하세요.');
      return;
    }

    const current = Array.isArray(window.DB?.iqc) ? DB.iqc : [];
    const key = composite(record);
    let removed = false;
    const next = current.filter((row) => {
      if(removed) return true;
      const same = row === record || (clean(record.inNo) && clean(row.inNo) === clean(record.inNo)) || (!clean(record.inNo) && composite(row) === key);
      if(same){ removed = true; return false; }
      return true;
    });
    if(!removed){
      window.alert('삭제할 수입검사 기록을 찾지 못했습니다.');
      return;
    }

    DB.iqc = next;
    saveRecoverySnapshot(next);
    try{ if(typeof window.auditLog === 'function') auditLog('IQC','삭제',label,clean(reason)); }catch(_error){}
    try{ if(typeof window.dbSave === 'function') window.dbSave(); }catch(_error){}

    // Only create a shared DB tombstone when a real shared key exists.
    const inNo = clean(record.inNo);
    if(inNo && typeof window.qmesSyncTombstoneInspection === 'function'){
      try{
        await window.qmesSyncTombstoneInspection('iqc', inNo, [record], clean(reason));
      }catch(error){
        console.warn('IQC 공용 DB 삭제 표시 실패:', error?.message || error);
        window.alert(`이 PC에서는 삭제되었습니다.\n공용 DB 삭제 표시는 실패했습니다.\n${error?.message || error}`);
      }
    }

    window.location.reload();
  }

  window.addEventListener('click', handleDelete, true);
})();
