/* QMES shared sync — mobile/IPAD/PC inspection and work-order records */
(function () {
  const employeeCodePattern = /\s*\(U-\d+\)\s*/gi;
  const cleanEmployeeCode = (value) => String(value || "").replace(employeeCodePattern, " ").replace(/\s{2,}/g, " ").trim();

  function cleanInspectorDisplay() {
    ["__QMES_USER__", "__QMES_CURRENT_USER__"].forEach((key) => {
      const user = window[key];
      if (user && typeof user === "object" && user.name) user.name = cleanEmployeeCode(user.name);
      else if (typeof user === "string") window[key] = cleanEmployeeCode(user);
    });

    document.querySelectorAll(".qmes-ipad-inspector").forEach((element) => {
      element.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && employeeCodePattern.test(node.nodeValue || "")) {
          node.nodeValue = cleanEmployeeCode(node.nodeValue);
        }
      });
      element.querySelectorAll("strong").forEach((strong) => {
        const cleaned = cleanEmployeeCode(strong.textContent);
        if (strong.textContent !== cleaned) strong.textContent = cleaned;
      });
    });

    document.querySelectorAll('.qmes-ipad-form-grid input[readonly]').forEach((input) => {
      const cleaned = cleanEmployeeCode(input.value);
      if (input.value !== cleaned) {
        const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
        descriptor?.set?.call(input, cleaned);
        input.dispatchEvent(new Event("input", {bubbles:true}));
        input.dispatchEvent(new Event("change", {bubbles:true}));
      }
    });
  }

  const startInspectorCleaner = () => {
    cleanInspectorDisplay();
    const observer = new MutationObserver(cleanInspectorDisplay);
    observer.observe(document.documentElement, {childList:true, subtree:true, characterData:true});
    window.setInterval(cleanInspectorDisplay, 1000);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startInspectorCleaner, {once:true});
  else startInspectorCleaner();

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
  window.qmesSyncWorkOrder = syncWorkOrder;
  window.qmesSyncPullWorkOrders = pullWorkOrders;
  window.qmesSyncDeleteWorkOrder = deleteWorkOrder;
})();