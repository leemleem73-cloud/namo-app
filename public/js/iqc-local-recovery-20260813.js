/* IQC local recovery guard — 2026-08-13 safe revision
 * Only uses DB.iqc and the explicit recovery snapshot created by this script.
 * It no longer scans unrelated local/session storage objects.
 * It also normalizes legacy IQC rows so the IQC screen cannot crash on missing fields.
 */
(function(){
  'use strict';
  if(window.__QMES_IQC_LOCAL_RECOVERY_20260813_SAFE__) return;
  window.__QMES_IQC_LOCAL_RECOVERY_20260813_SAFE__ = true;

  const clean = (v) => String(v == null ? '' : v).trim();
  const rowKey = (row) => clean(row?.inNo) || [clean(row?.recv),clean(row?.lot),clean(row?.name),clean(row?.supplier)].join('|');
  const dateValue = (row) => clean(row?.recv || row?.inspectedAt || '');

  function isRealIqcRow(row){
    if(!row || typeof row !== 'object' || Array.isArray(row)) return false;
    const hasIqcNo = /^IQC-\d{6}-\d{4}$/.test(clean(row.inNo));
    const hasLegacyCore = /^\d{4}-\d{2}-\d{2}/.test(clean(row.recv || row.inspectedAt)) && clean(row.lot) && (clean(row.name) || clean(row.supplier));
    return Boolean(hasIqcNo || hasLegacyCore);
  }

  function normalizeRow(row){
    const visual = clean(row.visual) || '합격';
    const label = clean(row.label) || '합격';
    const weight = clean(row.weight) || '합격';
    const coa = clean(row.coa) || '합격';
    const judge = clean(row.judge) || ([visual,label,weight,coa].includes('불합격') ? '불합격' : '합격');
    return {
      ...row,
      inNo: clean(row.inNo),
      recv: clean(row.recv || row.inspectedAt).slice(0,10),
      inspectedAt: clean(row.inspectedAt || row.recv).slice(0,10),
      lot: clean(row.lot),
      name: clean(row.name) || '-',
      supplier: clean(row.supplier) || '-',
      qty: clean(row.qty),
      inspectQty: clean(row.inspectQty),
      defectQty: clean(row.defectQty || '0'),
      visual,
      label,
      weight,
      coa,
      inspector: clean(row.inspector || row.by),
      by: clean(row.by || row.inspector),
      remarks: clean(row.remarks || row.note),
      note: clean(row.note),
      judge
    };
  }

  function mergeRows(){
    const map = new Map();
    Array.from(arguments).forEach((list) => {
      (Array.isArray(list) ? list : []).forEach((raw) => {
        if(!isRealIqcRow(raw)) return;
        const row = normalizeRow(raw);
        const key = rowKey(row);
        if(!key) return;
        map.set(key, {...(map.get(key) || {}), ...row});
      });
    });
    return [...map.values()].sort((a,b) => dateValue(b).localeCompare(dateValue(a)) || rowKey(b).localeCompare(rowKey(a)));
  }

  function readRecoverySnapshot(){
    try{
      const raw = localStorage.getItem('qmes-iqc-recovery-snapshot-20260813');
      if(!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.iqc) ? parsed.iqc : [];
    }catch(_error){ return []; }
  }

  function recoverLocal(){
    if(!window.DB) return [];
    const current = Array.isArray(DB.iqc) ? DB.iqc : [];
    const snapshot = readRecoverySnapshot();
    const merged = mergeRows(current, snapshot);
    DB.iqc = merged;
    try{
      localStorage.setItem('qmes-iqc-recovery-snapshot-20260813', JSON.stringify({savedAt:new Date().toISOString(), iqc:merged}));
    }catch(_error){}
    try{ if(typeof window.dbSave === 'function') window.dbSave(); }catch(_error){}
    return merged;
  }

  function wrapPull(){
    const original = window.qmesSyncPullInspection;
    if(typeof original !== 'function' || original.__qmesIqcLocalRecoverySafeWrapped) return false;
    const wrapped = async function(type, localRows){
      const normalized = String(type || '').toLowerCase();
      if(normalized !== 'iqc') return original.apply(this, arguments);
      const protectedLocal = mergeRows(localRows, recoverLocal(), Array.isArray(window.DB?.iqc) ? window.DB.iqc : []);
      const remoteMerged = await original.call(this, type, protectedLocal);
      const finalRows = mergeRows(remoteMerged, protectedLocal, readRecoverySnapshot());
      if(window.DB) window.DB.iqc = finalRows;
      try{ if(typeof window.dbSave === 'function') window.dbSave(); }catch(_error){}
      return finalRows;
    };
    wrapped.__qmesIqcLocalRecoverySafeWrapped = true;
    window.qmesSyncPullInspection = wrapped;
    return true;
  }

  function install(){ recoverLocal(); wrapPull(); }
  install();
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    install();
    if((window.DB && typeof window.qmesSyncPullInspection === 'function') || tries >= 40) clearInterval(timer);
  }, 100);
})();
