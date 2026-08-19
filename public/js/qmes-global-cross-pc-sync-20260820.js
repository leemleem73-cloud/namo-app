/* QMES global cross-PC synchronization bootstrap - 2026-08-20
 * Central PostgreSQL/shared APIs are the source of truth.
 * Pulls shared records on startup, focus, visibility return and on a short interval.
 */
(function () {
  'use strict';
  if (window.__QMES_GLOBAL_CROSS_PC_SYNC__) return;
  window.__QMES_GLOBAL_CROSS_PC_SYNC__ = true;

  let running = false;
  let timer = null;

  function getDb() {
    try {
      if (typeof DB !== 'undefined' && DB) return DB;
    } catch (_error) {}
    return window.DB || null;
  }

  async function syncInspections(db) {
    if (typeof window.qmesSyncPullInspection !== 'function' || !db) return;
    db.insp = db.insp || {};
    const iqcLocal = Array.isArray(db.iqc) ? db.iqc : [];
    const pqcLocal = Array.isArray(db.insp.PQC) ? db.insp.PQC : [];
    const oqcLocal = Array.isArray(db.insp.OQC) ? db.insp.OQC : [];

    const [iqc, pqc, oqc] = await Promise.all([
      window.qmesSyncPullInspection('iqc', iqcLocal),
      window.qmesSyncPullInspection('pqc', pqcLocal),
      window.qmesSyncPullInspection('oqc', oqcLocal),
    ]);

    if (Array.isArray(iqc)) db.iqc = iqc;
    if (Array.isArray(pqc)) db.insp.PQC = pqc;
    if (Array.isArray(oqc)) db.insp.OQC = oqc;
  }

  async function syncAll() {
    if (running) return;
    const db = getDb();
    if (!db) return;
    running = true;
    try {
      const tasks = [];
      tasks.push(syncInspections(db));
      if (typeof window.qmesSyncPullWorkOrders === 'function') tasks.push(window.qmesSyncPullWorkOrders());
      if (typeof window.qmesSyncPullEquipment === 'function') tasks.push(window.qmesSyncPullEquipment());
      await Promise.allSettled(tasks);
      if (typeof window.dbSave === 'function') {
        try { window.dbSave(); } catch (_error) {}
      }
      window.dispatchEvent(new CustomEvent('qmes:shared-sync-complete', { detail:{ at:Date.now() } }));
    } catch (error) {
      console.warn('QMES 공용 DB 자동 동기화 실패:', error.message);
    } finally {
      running = false;
    }
  }

  function start() {
    if (timer) return;
    syncAll();
    timer = window.setInterval(syncAll, 7000);
    window.addEventListener('focus', syncAll);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) syncAll();
    });
    document.addEventListener('qmes:data-updated', syncAll);
    document.addEventListener('qmes:data-changed', syncAll);
    window.qmesSyncAllSharedData = syncAll;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.setTimeout(start, 500); }, { once:true });
  } else {
    window.setTimeout(start, 500);
  }
})();
