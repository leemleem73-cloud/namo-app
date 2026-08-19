/* QMES global cross-PC synchronization bootstrap - 2026-08-20
 * Central PostgreSQL/shared APIs are the source of truth.
 * Pulls shared records on startup/focus/visibility and pushes local edits/deletes.
 */
(function () {
  'use strict';
  if (window.__QMES_GLOBAL_CROSS_PC_SYNC__) return;
  window.__QMES_GLOBAL_CROSS_PC_SYNC__ = true;

  let running = false;
  let timer = null;
  let pushTimer = null;
  let baseline = null;
  let dbSavePatched = false;
  let suppressPush = false;

  function getDb() {
    try {
      if (typeof DB !== 'undefined' && DB) return DB;
    } catch (_error) {}
    return window.DB || null;
  }

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (_error) { return value; }
  }

  function inspectionKey(type, row) {
    if (type === 'iqc') return String(row?.inNo || row?.serverId || '').trim();
    return String(row?.groupId || row?.id || '').trim();
  }

  function groupInspection(type, rows) {
    const map = new Map();
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const key = inspectionKey(type, row);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    return map;
  }

  function snapshotDb(db) {
    const iqc = groupInspection('iqc', db?.iqc || []);
    const pqc = groupInspection('pqc', db?.insp?.PQC || []);
    const oqc = groupInspection('oqc', db?.insp?.OQC || []);
    const workorders = new Map();
    Object.keys(db?.woDocs || {}).forEach((key) => {
      const doc = db.woDocs[key];
      const batch = (db.batches || []).find((row) => String(row?.no || '') === key) || null;
      if (doc && batch) workorders.set(key, { doc:clone(doc), batch:clone(batch) });
    });
    const equipment = new Map();
    (db?.eqLogs || []).forEach((row) => {
      const key = String(row?.id || '').trim();
      if (key) equipment.set(key, clone(row));
    });
    return {
      iqc:new Map(Array.from(iqc, ([key, rows]) => [key, clone(rows)])),
      pqc:new Map(Array.from(pqc, ([key, rows]) => [key, clone(rows)])),
      oqc:new Map(Array.from(oqc, ([key, rows]) => [key, clone(rows)])),
      workorders,
      equipment,
    };
  }

  function same(a, b) {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch (_error) { return a === b; }
  }

  function inspectionPayload(type, rows, db) {
    const first = rows?.[0] || {};
    const lotNo = String(first.lot || '').trim();
    return {
      mode:type.toUpperCase(),
      lotNo,
      rows,
      lotRecord:lotNo ? (db?.lots?.[lotNo] || null) : null,
      holds:(db?.holds || []).filter((row) => lotNo && String(row?.target || '').includes(lotNo)),
      savedAt:new Date().toISOString(),
      savedBy:String(first.inspector || first.by || window.__QMES_USER__?.name || window.__QMES_USER__ || ''),
    };
  }

  async function pushInspectionChanges(type, previousMap, currentMap, db) {
    if (typeof window.qmesSyncUpsert !== 'function') return;
    for (const [key, rows] of currentMap) {
      const previous = previousMap.get(key);
      if (!previous || !same(previous, rows)) {
        await window.qmesSyncUpsert(type, key, inspectionPayload(type, rows, db));
      }
    }
    if (typeof window.qmesSyncTombstoneInspection === 'function') {
      for (const [key, rows] of previousMap) {
        if (!currentMap.has(key)) {
          await window.qmesSyncTombstoneInspection(type, key, rows, '다른 PC와 공용 삭제 동기화');
        }
      }
    }
  }

  async function pushWorkOrderChanges(previousMap, currentMap) {
    if (typeof window.qmesSyncWorkOrder === 'function') {
      for (const [key, value] of currentMap) {
        const previous = previousMap.get(key);
        if (!previous || !same(previous, value)) await window.qmesSyncWorkOrder(key);
      }
    }
    if (typeof window.qmesSyncDeleteWorkOrder === 'function') {
      for (const key of previousMap.keys()) {
        if (!currentMap.has(key)) await window.qmesSyncDeleteWorkOrder(key);
      }
    }
  }

  async function pushEquipmentChanges(previousMap, currentMap) {
    if (typeof window.qmesSyncEquipmentEntry === 'function') {
      for (const [key, entry] of currentMap) {
        const previous = previousMap.get(key);
        if (!previous || !same(previous, entry)) await window.qmesSyncEquipmentEntry(entry);
      }
    }
    if (typeof window.qmesSyncDeleteEquipment === 'function') {
      for (const [key, entry] of previousMap) {
        if (!currentMap.has(key)) await window.qmesSyncDeleteEquipment(entry, '다른 PC와 공용 삭제 동기화');
      }
    }
  }

  async function pushLocalChanges() {
    if (running || suppressPush) return;
    const db = getDb();
    if (!db) return;
    const current = snapshotDb(db);
    if (!baseline) {
      baseline = current;
      return;
    }
    try {
      suppressPush = true;
      await pushInspectionChanges('iqc', baseline.iqc, current.iqc, db);
      await pushInspectionChanges('pqc', baseline.pqc, current.pqc, db);
      await pushInspectionChanges('oqc', baseline.oqc, current.oqc, db);
      await pushWorkOrderChanges(baseline.workorders, current.workorders);
      await pushEquipmentChanges(baseline.equipment, current.equipment);
      baseline = snapshotDb(db);
      window.dispatchEvent(new CustomEvent('qmes:shared-push-complete', { detail:{ at:Date.now() } }));
    } catch (error) {
      console.warn('QMES 공용 DB 저장 동기화 실패:', error.message);
    } finally {
      suppressPush = false;
    }
  }

  function schedulePush() {
    if (suppressPush || running) return;
    window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(pushLocalChanges, 800);
  }

  function patchDbSave() {
    if (dbSavePatched || typeof window.dbSave !== 'function') return false;
    const original = window.dbSave;
    window.dbSave = function qmesSharedDbSave() {
      const result = original.apply(this, arguments);
      schedulePush();
      return result;
    };
    dbSavePatched = true;
    return true;
  }

  async function syncInspections(db) {
    if (typeof window.qmesSyncPullInspection !== 'function' || !db) return;
    db.insp = db.insp || {};
    const [iqc, pqc, oqc] = await Promise.all([
      window.qmesSyncPullInspection('iqc', Array.isArray(db.iqc) ? db.iqc : []),
      window.qmesSyncPullInspection('pqc', Array.isArray(db.insp.PQC) ? db.insp.PQC : []),
      window.qmesSyncPullInspection('oqc', Array.isArray(db.insp.OQC) ? db.insp.OQC : []),
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
    suppressPush = true;
    try {
      const tasks = [syncInspections(db)];
      if (typeof window.qmesSyncPullWorkOrders === 'function') tasks.push(window.qmesSyncPullWorkOrders());
      if (typeof window.qmesSyncPullEquipment === 'function') tasks.push(window.qmesSyncPullEquipment());
      await Promise.allSettled(tasks);
      if (typeof window.dbSave === 'function') {
        try { window.dbSave(); } catch (_error) {}
      }
      baseline = snapshotDb(db);
      window.dispatchEvent(new CustomEvent('qmes:shared-sync-complete', { detail:{ at:Date.now() } }));
    } catch (error) {
      console.warn('QMES 공용 DB 자동 동기화 실패:', error.message);
    } finally {
      suppressPush = false;
      running = false;
    }
  }

  function start() {
    if (timer) return;
    patchDbSave();
    baseline = snapshotDb(getDb() || {});
    syncAll();
    timer = window.setInterval(syncAll, 7000);
    window.setInterval(patchDbSave, 1500);
    window.addEventListener('focus', syncAll);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) syncAll();
    });
    document.addEventListener('qmes:data-updated', syncAll);
    document.addEventListener('qmes:data-changed', syncAll);
    window.qmesSyncAllSharedData = syncAll;
    window.qmesPushAllSharedChanges = pushLocalChanges;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.setTimeout(start, 500); }, { once:true });
  } else {
    window.setTimeout(start, 500);
  }
})();
