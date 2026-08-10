/* QMES shared sync — mobile/IPAD/PC inspection and work-order records */
(function () {
  const allowedTypes = new Set(["iqc", "pqc", "oqc", "workorder", "equipment", "inventory"]);

  function normalizeType(type) {
    const value = String(type || "").trim().toLowerCase();
    if (!allowedTypes.has(value)) throw new Error("지원하지 않는 동기화 유형입니다.");
    return value;
  }

  async function request(path, options = {}) {
    const response = await fetch(path, {
      credentials:"same-origin",
      headers:{"Content-Type":"application/json", ...(options.headers || {})},
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      try { sessionStorage.removeItem("qmes-current-user-v1"); } catch (_error) {}
      delete window.__QMES_CURRENT_USER__;
      delete window.__QMES_USER__;
      if (!window.__QMES_AUTH_RELOAD_PENDING__) {
        window.__QMES_AUTH_RELOAD_PENDING__ = true;
        window.dispatchEvent(new CustomEvent("qmes:auth-expired"));
        setTimeout(() => window.location.reload(), 50);
      }
      throw new Error(payload.message || "로그인 세션이 만료되었습니다.");
    }
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || `공용 DB 요청 실패 (${response.status})`);
    }
    return payload.data;
  }

  function recordPayload(record) {
    const value = record?.payload;
    if (value && typeof value === "object") return value;
    if (typeof value === "string") {
      try { return JSON.parse(value); } catch (_error) { return {}; }
    }
    return {};
  }

  function mergeRelated(payload) {
    const lotNo = String(payload?.lotNo || "").trim();
    if (lotNo && payload.lotRecord) {
      DB.lots = DB.lots || {};
      DB.lots[lotNo] = payload.lotRecord;
    }
    if (Array.isArray(payload?.holds) && payload.holds.length) {
      DB.holds = DB.holds || [];
      const remoteIds = new Set(payload.holds.map((row) => row.id));
      DB.holds = [...payload.holds, ...DB.holds.filter((row) => !remoteIds.has(row.id))];
    }
  }

  async function list(type) {
    return await request(`/api/qmes-sync/${encodeURIComponent(normalizeType(type))}`);
  }

  async function upsert(type, key, payload) {
    const recordKey = String(key || "").trim();
    if (!recordKey) throw new Error("동기화 기록 키가 없습니다.");
    return await request(`/api/qmes-sync/${encodeURIComponent(normalizeType(type))}`, {
      method:"POST",
      body:JSON.stringify({key:recordKey, payload})
    });
  }

  async function pullInspection(type, localRows) {
    const normalized = normalizeType(type);
    const records = await list(normalized);
    const remoteRows = [];
    const sharedKeys = new Set();
    (records || []).forEach((record) => {
      const payload = recordPayload(record);
      mergeRelated(payload);
      (Array.isArray(payload.rows) ? payload.rows : []).forEach((row) => {
        const key = normalized === "iqc"
          ? String(row?.inNo || row?.serverId || "")
          : String(row?.id || `${row?.groupId || ""}|${row?.check || ""}`);
        if (key) sharedKeys.add(key);
        if (!payload.deleted) remoteRows.push({...row, sharedSync:true, sharedUpdatedAt:record.updated_at || ""});
      });
    });

    const rowKey = (row) => normalized === "iqc"
      ? String(row?.inNo || row?.serverId || "")
      : String(row?.id || `${row?.groupId || ""}|${row?.check || ""}`);
    const merged = [
      ...remoteRows,
      ...(localRows || []).filter((row) => !sharedKeys.has(rowKey(row)))
    ];
    dbSave();
    return merged;
  }

  function pendingInspectionPayload(mode, rows) {
    const first = rows[0] || {};
    const lotNo = String(first.lot || "").trim();
    return {
      mode:String(mode || "").toUpperCase(),
      lotNo,
      rows,
      lotRecord:DB.lots?.[lotNo] || null,
      holds:(DB.holds || []).filter((row) => String(row.target || "").includes(lotNo)),
      savedAt:new Date().toISOString(),
      savedBy:String(first.inspector || first.by || "")
    };
  }

  async function pushPendingInspections() {
    const pending = [];
    (DB.iqc || [])
      .filter((row) => row.source === "IPAD POP" && !row.sharedSync && row.inNo)
      .forEach((row) => pending.push({type:"iqc", key:row.inNo, rows:[row]}));

    ["PQC","OQC"].forEach((mode) => {
      const groups = new Map();
      (DB.insp?.[mode] || [])
        .filter((row) => row.source === "IPAD POP" && !row.sharedSync && (row.groupId || row.id))
        .forEach((row) => {
          const key = String(row.groupId || row.id);
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(row);
        });
      groups.forEach((rows, key) => pending.push({type:mode.toLowerCase(), key, rows}));
    });

    for (const record of pending) {
      await upsert(record.type, record.key, pendingInspectionPayload(record.type, record.rows));
      record.rows.forEach((row) => { row.sharedSync = true; });
    }
    if (pending.length) dbSave();
    return pending.length;
  }

  async function tombstoneInspection(type, key, rows, reason) {
    const normalized = normalizeType(type);
    const recordKey = String(key || "").trim();
    if (!recordKey) throw new Error("삭제할 검사기록 번호가 없습니다.");
    const records = await list(normalized);
    const existing = (records || []).find((record) => record.record_key === recordKey);
    const previous = recordPayload(existing);
    const preservedRows = Array.isArray(previous.rows) && previous.rows.length
      ? previous.rows
      : (Array.isArray(rows) ? rows : []);
    const first = preservedRows[0] || {};
    const lotNo = String(previous.lotNo || first.lot || "").trim();
    return await upsert(normalized, recordKey, {
      ...previous,
      mode:String(previous.mode || normalized).toUpperCase(),
      lotNo,
      rows:preservedRows,
      deleted:true,
      deletedAt:new Date().toISOString(),
      deletedBy:String(window.__QMES_USER__?.name || window.__QMES_USER__ || ""),
      deleteReason:String(reason || "")
    });
  }


  function equipmentDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function equipmentEntryKey(entry) {
    return String(entry?.id || "").trim();
  }

  async function syncEquipmentEntry(entry) {
    const key = equipmentEntryKey(entry);
    if (!key) throw new Error("설비 점검 기록 번호가 없습니다.");
    return await upsert("equipment", key, {
      entry,
      savedAt:new Date().toISOString(),
      savedBy:String(entry?.by || window.__QMES_USER__?.name || window.__QMES_USER__ || "")
    });
  }

  async function deleteEquipmentEntry(entry, reason) {
    const key = equipmentEntryKey(entry);
    if (!key) throw new Error("삭제할 설비 점검 기록번호가 없습니다.");
    const records = await list("equipment");
    const existing = (records || []).find((record) => record.record_key === key);
    const previous = recordPayload(existing);
    return await upsert("equipment", key, {
      ...previous,
      entry:previous.entry || entry,
      deleted:true,
      deletedAt:new Date().toISOString(),
      deletedBy:String(window.__QMES_USER__?.name || window.__QMES_USER__ || ""),
      deleteReason:String(reason || "")
    });
  }

  async function deleteAllEquipmentEntries(entries, reason) {
    const uniqueEntries = new Map();
    (Array.isArray(entries) ? entries : []).forEach((entry) => {
      const key = equipmentEntryKey(entry);
      if (key) uniqueEntries.set(key, entry);
    });
    if (!uniqueEntries.size) return 0;

    const records = await list("equipment");
    const existingByKey = new Map((records || []).map((record) => [String(record.record_key || ""), record]));
    const deletedAt = new Date().toISOString();
    const deletedBy = String(window.__QMES_USER__?.name || window.__QMES_USER__ || "");
    const deleteReason = String(reason || "");
    const tombstones = Array.from(uniqueEntries, ([key, entry]) => {
      const previous = recordPayload(existingByKey.get(key));
      return {
        key,
        payload:{
          ...previous,
          entry:previous.entry || entry,
          deleted:true,
          deleteScope:"all-equipment-records",
          deletedAt,
          deletedBy,
          deleteReason
        }
      };
    });

    for (let index = 0; index < tombstones.length; index += 5) {
      const batch = tombstones.slice(index, index + 5);
      await Promise.all(batch.map((row) => upsert("equipment", row.key, row.payload)));
    }
    return tombstones.length;
  }

  async function pushPendingEquipment() {
    const pending = (DB.eqLogs || []).filter((entry) => equipmentEntryKey(entry) && !entry.sharedSync);
    for (const entry of pending) {
      await syncEquipmentEntry(entry);
      entry.sharedSync = true;
    }
    if (pending.length) dbSave();
    return pending.length;
  }

  async function pullEquipment() {
    const records = await list("equipment");
    const remoteEntries = [];
    const sharedKeys = new Set();

    (records || []).forEach((record) => {
      const payload = recordPayload(record);
      const entry = payload?.entry;
      const key = equipmentEntryKey(entry) || String(record.record_key || "").trim();
      if (key) sharedKeys.add(key);
      if (!payload.deleted && entry && key) {
        remoteEntries.push({
          ...entry,
          id:key,
          sharedSync:true,
          sharedUpdatedAt:record.updated_at || ""
        });
      }
    });

    const localEntries = (DB.eqLogs || []).filter((entry) => {
      const key = equipmentEntryKey(entry);
      return !key || !sharedKeys.has(key);
    });
    const entries = [...remoteEntries, ...localEntries].sort((a, b) => {
      const left = String(a.recordedAt || `${a.date || ""}T${a.time || ""}`);
      const right = String(b.recordedAt || `${b.date || ""}T${b.time || ""}`);
      return right.localeCompare(left);
    });

    const today = equipmentDateKey();
    const readings = {};
    entries.forEach((entry) => {
      if (String(entry.date || "") !== today) return;
      const eqId = String(entry.eqId || "").trim();
      const paramKey = String(entry.paramKey || "").trim();
      const key = eqId && paramKey ? `${eqId}:${paramKey}` : "";
      if (!key || readings[key]) return;
      readings[key] = {
        v:entry.v,
        ok:entry.judge === "정상",
        time:entry.time || "",
        by:entry.by || ""
      };
    });

    const alarms = entries
      .filter((entry) => entry.judge === "이탈")
      .map((entry) => ({
        id:entry.id,
        date:entry.date || "",
        time:entry.time || "",
        eq:entry.eqId || "",
        msg:`${entry.item || "관리항목"} ${entry.v || ""} — 관리기준(${entry.spec || "-"}) 이탈, 점검·조치 필요${entry.note ? ` · 비고: ${entry.note}` : ""}`,
        level:"경고",
        by:entry.by || ""
      }));

    DB.eqDate = today;
    DB.eqLogs = entries.slice(0, 3000);
    DB.eqReadings = readings;
    DB.eqAlarms = alarms.slice(0, 1000);
    dbSave();
    return {readings:DB.eqReadings, logs:DB.eqLogs, alarms:DB.eqAlarms};
  }

  function workOrderSnapshot(lotNo) {
    const key = String(lotNo || "").trim();
    const doc = DB.woDocs?.[key] || null;
    const batch = (DB.batches || []).find((row) => row.no === key) || null;
    const lotRecord = DB.lots?.[key] || null;
    const intermediateLot = DB.intermediateLots?.[key] || null;
    const containers = {};
    const containerNos = new Set([
      ...(doc?.packaging || []).map((row) => row.containerNo).filter(Boolean),
      ...Object.values(DB.intermediateContainers || {})
        .filter((row) => row.workOrder === key || row.lastWorkOrder === key)
        .map((row) => row.containerNo).filter(Boolean)
    ]);
    containerNos.forEach((containerNo) => {
      if (DB.intermediateContainers?.[containerNo]) containers[containerNo] = DB.intermediateContainers[containerNo];
    });
    const remainders = Object.fromEntries(
      Object.entries(DB.materialRemainders || {}).filter(([, row]) => row.workOrder === key)
    );
    return {lotNo:key, doc, batch, lotRecord, intermediateLot, containers, remainders};
  }

  async function syncWorkOrder(lotNo) {
    const snapshot = workOrderSnapshot(lotNo);
    if (!snapshot.doc || !snapshot.batch) throw new Error("저장할 작업지시서 데이터가 없습니다.");
    return await upsert("workorder", snapshot.lotNo, snapshot);
  }

  function mergeWorkOrder(payload) {
    const key = String(payload?.lotNo || "").trim();
    if (!key) return false;
    if (payload.deleted) {
      if (DB.woDocs) delete DB.woDocs[key];
      DB.batches = (DB.batches || []).filter((row) => row.no !== key);
      if (DB.lots) delete DB.lots[key];
      if (DB.intermediateLots) delete DB.intermediateLots[key];
      return true;
    }
    if (!payload.doc) return false;
    DB.woDocs = DB.woDocs || {};
    DB.woDocs[key] = payload.doc;

    if (payload.batch) {
      DB.batches = DB.batches || [];
      DB.batches = [payload.batch, ...DB.batches.filter((row) => row.no !== key)];
    }
    if (payload.lotRecord) {
      DB.lots = DB.lots || {};
      DB.lots[key] = payload.lotRecord;
    }
    if (payload.intermediateLot) {
      DB.intermediateLots = DB.intermediateLots || {};
      DB.intermediateLots[key] = payload.intermediateLot;
    }
    DB.intermediateContainers = {...(DB.intermediateContainers || {}), ...(payload.containers || {})};
    DB.materialRemainders = {...(DB.materialRemainders || {}), ...(payload.remainders || {})};
    return true;
  }

  async function pullWorkOrders() {
    const records = await list("workorder");
    let count = 0;
    (records || []).forEach((record) => {
      if (mergeWorkOrder(recordPayload(record))) count += 1;
    });
    dbSave();
    return count;
  }

  async function deleteWorkOrder(lotNo) {
    const key = String(lotNo || "").trim();
    if (!key) return;
    const deletedAt = new Date().toISOString();
    const deletedBy = String(window.__QMES_USER__?.name || window.__QMES_USER__ || "");
    const workOrderRecords = await list("workorder");
    const existingWorkOrder = (workOrderRecords || []).find((record) => record.record_key === key);
    const workOrderTombstone = {
      ...recordPayload(existingWorkOrder),
      ...workOrderSnapshot(key),
      lotNo:key,
      deleted:true,
      deletedAt,
      deletedBy
    };
    const inspectionRecords = await Promise.all([list("pqc"), list("oqc")]);
    const tombstones = [];
    ["pqc","oqc"].forEach((type, index) => {
      (inspectionRecords[index] || []).forEach((record) => {
        const payload = recordPayload(record);
        if (String(payload.lotNo || "").trim() !== key) return;
        tombstones.push(upsert(type, record.record_key, {...payload, deleted:true, deletedAt, deletedBy}));
      });
    });
    await Promise.all([upsert("workorder", key, workOrderTombstone), ...tombstones]);
  }

  window.qmesSyncList = list;
  window.qmesSyncUpsert = upsert;
  window.qmesSyncPullInspection = pullInspection;
  window.qmesSyncPushPendingInspections = pushPendingInspections;
  window.qmesSyncTombstoneInspection = tombstoneInspection;
  window.qmesSyncEquipmentEntry = syncEquipmentEntry;
  window.qmesSyncPushPendingEquipment = pushPendingEquipment;
  window.qmesSyncDeleteEquipment = deleteEquipmentEntry;
  window.qmesSyncDeleteAllEquipment = deleteAllEquipmentEntries;
  window.qmesSyncPullEquipment = pullEquipment;
  window.qmesSyncWorkOrder = syncWorkOrder;
  window.qmesSyncPullWorkOrders = pullWorkOrders;
  window.qmesSyncDeleteWorkOrder = deleteWorkOrder;
})();
