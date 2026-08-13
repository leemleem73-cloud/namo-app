/* IQC sync guard — keep registered IQC rows across refresh/deploy and sync them to shared DB. */
(function(){
  'use strict';
  if(window.__QMES_IQC_SYNC_GUARD_20260813_V2__) return;
  window.__QMES_IQC_SYNC_GUARD_20260813_V2__ = true;

  const clean = (v) => String(v == null ? '' : v).trim();
  const validInNo = (v) => /^IQC-\d{6}-\d{4}$/.test(clean(v));
  const inspector = (row) => clean(row?.inspector || row?.by);
  const dateFromInNo = (inNo) => {
    const m = clean(inNo).match(/^IQC-(\d{2})(\d{2})(\d{2})-\d{4}$/);
    return m ? `20${m[1]}-${m[2]}-${m[3]}` : '';
  };
  const keyOf = (row) => clean(row?.inNo || row?.serverId || [row?.lot,row?.name,row?.supplier,inspector(row)].map(clean).join('|'));

  function normalize(row){
    const next = {...row};
    const encodedDate = validInNo(next.inNo) ? dateFromInNo(next.inNo) : '';
    if(encodedDate && !clean(next.recv)) next.recv = encodedDate;
    if(!clean(next.inspectedAt)) next.inspectedAt = clean(next.recv);
    return next;
  }

  function keep(row){
    if(!row || typeof row !== 'object') return false;
    // Never discard a real registered IQC row merely because it is legacy/manual.
    return Boolean(
      clean(row.inNo) || clean(row.lot) || clean(row.name) || clean(row.supplier) ||
      clean(row.recv) || clean(row.inspectedAt) || inspector(row)
    );
  }

  function mergeWithLocalPriority(remoteRows, localRows){
    const map = new Map();
    (Array.isArray(remoteRows) ? remoteRows : []).filter(keep).forEach((row) => {
      const normalized = normalize(row);
      const key = keyOf(normalized);
      if(key) map.set(key, normalized);
    });
    (Array.isArray(localRows) ? localRows : []).filter(keep).forEach((row) => {
      const normalized = normalize(row);
      const key = keyOf(normalized);
      if(!key) return;
      map.set(key, {...(map.get(key) || {}), ...normalized});
    });
    return [...map.values()].sort((a,b) => clean(b.recv || b.inspectedAt).localeCompare(clean(a.recv || a.inspectedAt)));
  }

  let pushing = false;
  let pushTimer = null;
  async function pushAllLocalIqc(){
    if(pushing || typeof window.qmesSyncUpsert !== 'function' || !window.DB) return;
    const rows = (Array.isArray(DB.iqc) ? DB.iqc : []).filter(keep);
    if(!rows.length) return;
    pushing = true;
    try{
      for(const row of rows){
        const key = clean(row.inNo || row.serverId);
        if(!key) continue;
        const lotNo = clean(row.lot);
        await window.qmesSyncUpsert('iqc', key, {
          mode:'IQC',
          lotNo,
          rows:[{...row, sharedSync:true}],
          lotRecord:lotNo ? (DB.lots?.[lotNo] || null) : null,
          holds:(DB.holds || []).filter((hold) => String(hold?.target || '').includes(lotNo)),
          savedAt:new Date().toISOString(),
          savedBy:inspector(row)
        });
        row.sharedSync = true;
      }
      try{ if(typeof window.dbSave === 'function') window.dbSave(); }catch(_error){}
    }catch(error){
      console.warn('IQC 공용 DB 보존 실패:', error.message);
    }finally{
      pushing = false;
    }
  }

  function schedulePush(delay=250){
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushAllLocalIqc, delay);
  }

  function installPullGuard(){
    const original = window.qmesSyncPullInspection;
    if(typeof original !== 'function' || original.__iqcPreserveWrapped) return false;
    const wrapped = async function(type, localRows){
      if(String(type || '').toLowerCase() !== 'iqc') return original.apply(this, arguments);
      const localSnapshot = (Array.isArray(localRows) ? localRows : []).filter(keep).map((row) => ({...row}));
      const pulled = await original.call(this, type, localRows);
      const merged = mergeWithLocalPriority(pulled, localSnapshot);
      if(window.DB){
        DB.iqc = merged;
        try{ if(typeof window.dbSave === 'function') window.dbSave(); }catch(_error){}
      }
      schedulePush(80);
      return merged;
    };
    wrapped.__iqcPreserveWrapped = true;
    window.qmesSyncPullInspection = wrapped;
    return true;
  }

  function installSaveGuard(){
    const original = window.dbSave;
    if(typeof original !== 'function' || original.__iqcPersistWrapped) return false;
    const wrapped = function(){
      const result = original.apply(this, arguments);
      schedulePush();
      return result;
    };
    wrapped.__iqcPersistWrapped = true;
    window.dbSave = wrapped;
    try{ dbSave = wrapped; }catch(_error){}
    return true;
  }

  let tries = 0;
  const installTimer = setInterval(() => {
    tries += 1;
    const pullReady = installPullGuard();
    const saveReady = installSaveGuard();
    if((pullReady || window.qmesSyncPullInspection?.__iqcPreserveWrapped) &&
       (saveReady || window.dbSave?.__iqcPersistWrapped)){
      clearInterval(installTimer);
      schedulePush(500);
    } else if(tries >= 100){
      clearInterval(installTimer);
    }
  }, 50);
})();
