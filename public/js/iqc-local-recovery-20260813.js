/* IQC local recovery guard — 2026-08-13
 * Recovers IQC rows from same-origin browser storage and prevents shared sync from
 * replacing a larger local IQC set with a smaller remote set.
 * No remote writes are performed by this file.
 */
(function(){
  'use strict';
  if(window.__QMES_IQC_LOCAL_RECOVERY_20260813__) return;
  window.__QMES_IQC_LOCAL_RECOVERY_20260813__ = true;

  const clean = (v) => String(v == null ? '' : v).trim();
  const rowKey = (row) => clean(row?.inNo) || [clean(row?.recv),clean(row?.lot),clean(row?.name),clean(row?.supplier)].join('|');
  const dateValue = (row) => clean(row?.recv || row?.inspectedAt || '');

  function looksLikeIqcRow(row){
    return row && typeof row === 'object' && (
      clean(row.inNo).startsWith('IQC-') ||
      (clean(row.lot) && (clean(row.name) || clean(row.supplier)) && (clean(row.recv) || clean(row.inspectedAt)))
    );
  }

  function mergeRows(){
    const map = new Map();
    Array.from(arguments).forEach((list) => {
      (Array.isArray(list) ? list : []).forEach((row) => {
        if(!looksLikeIqcRow(row)) return;
        const key = rowKey(row);
        if(!key) return;
        map.set(key, {...(map.get(key) || {}), ...row});
      });
    });
    return [...map.values()].sort((a,b) => dateValue(b).localeCompare(dateValue(a)) || rowKey(b).localeCompare(rowKey(a)));
  }

  function collectFromValue(value, found, depth){
    if(depth > 4 || value == null) return;
    if(Array.isArray(value)){
      if(value.some(looksLikeIqcRow)) found.push(value.filter(looksLikeIqcRow));
      value.slice(0,50).forEach((item) => collectFromValue(item, found, depth + 1));
      return;
    }
    if(typeof value !== 'object') return;
    if(Array.isArray(value.iqc) && value.iqc.some(looksLikeIqcRow)) found.push(value.iqc.filter(looksLikeIqcRow));
    Object.keys(value).slice(0,80).forEach((key) => {
      if(key === 'iqc') return;
      collectFromValue(value[key], found, depth + 1);
    });
  }

  function scanStorage(storage){
    const found = [];
    if(!storage) return found;
    try{
      for(let i=0;i<storage.length;i+=1){
        const key = storage.key(i);
        if(!key) continue;
        const raw = storage.getItem(key);
        if(!raw || raw.length < 10) continue;
        try{
          const parsed = JSON.parse(raw);
          collectFromValue(parsed, found, 0);
        }catch(_error){}
      }
    }catch(_error){}
    return found;
  }

  function recoverLocal(){
    if(!window.DB) return [];
    const candidates = [Array.isArray(DB.iqc) ? DB.iqc : []];
    scanStorage(window.localStorage).forEach((rows) => candidates.push(rows));
    scanStorage(window.sessionStorage).forEach((rows) => candidates.push(rows));
    const merged = mergeRows.apply(null, candidates);
    if(merged.length > (Array.isArray(DB.iqc) ? DB.iqc.length : 0)){
      DB.iqc = merged;
      try{
        localStorage.setItem('qmes-iqc-recovery-snapshot-20260813', JSON.stringify({savedAt:new Date().toISOString(), iqc:merged}));
      }catch(_error){}
      try{ if(typeof window.dbSave === 'function') window.dbSave(); }catch(_error){}
      window.dispatchEvent(new CustomEvent('qmes:data-updated', {detail:{type:'iqc-recovery', count:merged.length}}));
    }
    return merged;
  }

  function wrapPull(){
    const original = window.qmesSyncPullInspection;
    if(typeof original !== 'function' || original.__qmesIqcLocalRecoveryWrapped) return false;
    const wrapped = async function(type, localRows){
      const normalized = String(type || '').toLowerCase();
      if(normalized !== 'iqc') return original.apply(this, arguments);
      const recoveredBefore = recoverLocal();
      const localSnapshot = mergeRows(localRows, recoveredBefore, Array.isArray(window.DB?.iqc) ? window.DB.iqc : []);
      const remoteMerged = await original.call(this, type, localSnapshot);
      const recoveredAfter = recoverLocal();
      const finalRows = mergeRows(remoteMerged, localSnapshot, recoveredAfter, Array.isArray(window.DB?.iqc) ? window.DB.iqc : []);
      if(window.DB) window.DB.iqc = finalRows;
      try{ if(typeof window.dbSave === 'function') window.dbSave(); }catch(_error){}
      return finalRows;
    };
    wrapped.__qmesIqcLocalRecoveryWrapped = true;
    window.qmesSyncPullInspection = wrapped;
    return true;
  }

  function install(){
    recoverLocal();
    wrapPull();
  }

  install();
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    install();
    if((window.DB && typeof window.qmesSyncPullInspection === 'function') || tries >= 40) clearInterval(timer);
  }, 100);
})();
