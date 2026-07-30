/* QMES shared sync — mobile/IPAD/PC inspection and work-order records */
(function () {
  const employeeCodePattern = /\s*\(U-\d+\)\s*/gi;
  const cleanEmployeeCode = (value) => String(value || "").replace(employeeCodePattern, " ").replace(/\s{2,}/g, " ").trim();

  function cleanEmployeeCodesInDom(root = document) {
    const targets = root.querySelectorAll
      ? root.querySelectorAll(".qmes-ipad-inspector, .qmes-ipad-form-grid, .qmes-iqc-doc, .qmes-pqc-doc, .qmes-oqc-doc, .qmes-iqc-label-paper, #qmes-print-root")
      : [];

    targets.forEach((target) => {
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      textNodes.forEach((node) => {
        const original = node.nodeValue || "";
        const cleaned = cleanEmployeeCode(original);
        if (original !== cleaned) node.nodeValue = cleaned;
      });

      target.querySelectorAll("input, textarea").forEach((field) => {
        const original = field.value || "";
        const cleaned = cleanEmployeeCode(original);
        if (original !== cleaned) field.value = cleaned;
      });
    });
  }

  function startEmployeeCodeCleaner() {
    cleanEmployeeCodesInDom();
    const observer = new MutationObserver(() => cleanEmployeeCodesInDom());
    observer.observe(document.documentElement, {childList:true, subtree:true, characterData:true});
    window.addEventListener("beforeprint", () => cleanEmployeeCodesInDom());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startEmployeeCodeCleaner, {once:true});
  } else {
    startEmployeeCodeCleaner();
  }

  const allowedTypes = new Set(["iqc", "pqc", "oqc", "workorder"]);

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

  window.qmesCleanEmployeeCode = cleanEmployeeCode;
  window.qmesSyncList = list;
  window.qmesSyncUpsert = upsert;
  window.qmesSyncPullInspection = pullInspection;
  window.qmesSyncPushPendingInspections = pushPendingInspections;
  window.qmesSyncWorkOrder = syncWorkOrder;
  window.qmesSyncPullWorkOrders = pullWorkOrders;
  window.qmesSyncDeleteWorkOrder = deleteWorkOrder;
})();