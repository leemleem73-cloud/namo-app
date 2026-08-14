/* IQC sync sanitizer — prevents stale/incomplete shared rows from reappearing after refresh. */
(function(){
  'use strict';
  if(window.__QMES_IQC_SYNC_SANITIZE_20260813__) return;
  window.__QMES_IQC_SYNC_SANITIZE_20260813__ = true;

  const clean = (v) => String(v == null ? '' : v).trim();
  const validInNo = (v) => /^IQC-\d{6}-\d{4}$/.test(clean(v));
  const inspector = (row) => clean(row?.inspector || row?.by);
  const meaningfulInspector = (row) => {
    const value = inspector(row);
    return Boolean(value && value !== '-');
  };
  const dateFromInNo = (inNo) => {
    const m = clean(inNo).match(/^IQC-(\d{2})(\d{2})(\d{2})-\d{4}$/);
    return m ? `20${m[1]}-${m[2]}-${m[3]}` : '';
  };
  const composite = (row) => [
    clean(row?.lot), clean(row?.name), clean(row?.supplier), inspector(row)
  ].join('|');
  const keyOf = (row) => validInNo(row?.inNo) ? clean(row.inNo) : composite(row);

  function normalize(row){
    const next = {...row};
    const encodedDate = validInNo(next.inNo) ? dateFromInNo(next.inNo) : '';
    if(encodedDate) next.recv = encodedDate;
    if(!clean(next.inspectedAt)) next.inspectedAt = clean(next.recv);
    return next;
  }

  function keep(row){
    // Current IQC records always have a generated IQC number. Legacy rows are kept only
    // when they still carry a real inspector name. Empty '-' ghost rows are discarded.
    return validInNo(row?.inNo) || meaningfulInspector(row);
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
      // Local data wins for user-edited fields such as receipt date, inspector and remarks.
      map.set(key, {...(map.get(key) || {}), ...normalized});
    });
    return [...map.values()].sort((a,b) => clean(b.recv || b.inspectedAt).localeCompare(clean(a.recv || a.inspectedAt)));
  }

  function install(){
    const original = window.qmesSyncPullInspection;
    if(typeof original !== 'function' || original.__iqcSanitizeWrapped) return false;

    const wrapped = async function(type, localRows){
      if(String(type || '').toLowerCase() !== 'iqc') return original.apply(this, arguments);
      const localSnapshot = (Array.isArray(localRows) ? localRows : []).map((row) => ({...row}));
      const pulled = await original.call(this, type, localRows);
      const merged = mergeWithLocalPriority(pulled, localSnapshot);
      if(window.DB){
        DB.iqc = merged;
        try{ if(typeof window.dbSave === 'function') window.dbSave(); }catch(_error){}
      }
      return merged;
    };
    wrapped.__iqcSanitizeWrapped = true;
    window.qmesSyncPullInspection = wrapped;
    return true;
  }

  if(!install()){
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if(install() || tries >= 50) clearInterval(timer);
    }, 50);
  }
})();
