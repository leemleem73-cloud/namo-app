/* NAMO QMES production process management, 2026-08-24.
 * Work order -> production process -> PQC -> worklog / batch completion linkage.
 * Additional workers and process records are stored in shared qmes_sync_records via workorder type.
 */

const QMES_PROCESS_SYNC_TYPE = "workorder";
const QMES_PROCESS_KEY_PREFIX = "process:";
const QMES_WORKER_KEY_PREFIX = "worker:";

function qmesProcessClean(value) {
  return String(value == null ? "" : value).trim();
}

function qmesProcessNow() {
  return new Date().toISOString();
}

function qmesProcessTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return qmesProcessClean(value) || "-";
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function qmesProcessDate(value) {
  if (!value) return "-";
  return String(value).slice(0, 10);
}

async function qmesProcessFetchSyncRows() {
  const response = await fetch(`/api/qmes-sync/${QMES_PROCESS_SYNC_TYPE}`, { credentials: "same-origin" });
  const payload = await response.json().catch(() => ({ success: false, data: [] }));
  if (!response.ok || !payload.success) throw new Error(payload.message || "생산공정 공용 DB 조회에 실패했습니다.");
  return Array.isArray(payload.data) ? payload.data : [];
}

async function qmesProcessSaveSync(key, payload) {
  const response = await fetch(`/api/qmes-sync/${QMES_PROCESS_SYNC_TYPE}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, payload }),
  });
  const data = await response.json().catch(() => ({ success: false }));
  if (!response.ok || !data.success) throw new Error(data.message || "생산공정 저장에 실패했습니다.");
  return data.data;
}

function qmesProcessCurrentUser() {
  const user = window.__QMES_CURRENT_USER__ || {};
  return {
    id: qmesProcessClean(user.id || user.uid || user.name),
    uid: qmesProcessClean(user.uid),
    name: qmesProcessClean(user.name) || "사용자",
    dept: qmesProcessClean(user.dept || user.department),
  };
}

function qmesProcessPlanQty(workOrder) {
  const direct = Number(workOrder?.planQty ?? workOrder?.plan ?? workOrder?.qty ?? 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const inputs = Array.isArray(workOrder?.inputs) ? workOrder.inputs : [];
  return Number(inputs.reduce((sum, row) => {
    const value = Number(String(row?.std ?? row?.plan ?? row?.qty ?? 0).replace(/,/g, ""));
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0).toFixed(3));
}

function qmesProcessDefaultSteps(workOrder) {
  const equipment = qmesProcessClean(workOrder?.equipment || workOrder?.equipmentName || workOrder?.machine || workOrder?.tank || workOrder?.eq) || "생산설비";
  return [
    { no: 1, name: "작업준비 / 원료확인", equipment: "원료 준비", status: "대기", startAt: "", endAt: "", resultQty: "", defectQty: "0", workers: [] },
    { no: 2, name: "원료 계량 / 투입", equipment, status: "대기", startAt: "", endAt: "", resultQty: "", defectQty: "0", workers: [] },
    { no: 3, name: "바인더 제조", equipment: "TK 501", status: "대기", startAt: "", endAt: "", resultQty: "", defectQty: "0", workers: [] },
    { no: 4, name: "전도 슬러리 제조", equipment: "TK 501A ↔ B", status: "대기", startAt: "", endAt: "", resultQty: "", defectQty: "0", workers: [] },
    { no: 5, name: "공정검사 (PQC)", equipment: "검사실", status: "대기", startAt: "", endAt: "", resultQty: "", defectQty: "0", workers: [] },
    { no: 6, name: "충진 / 포장", equipment: "충진기", status: "대기", startAt: "", endAt: "", resultQty: "", defectQty: "0", workers: [] },
    { no: 7, name: "생산완료 / 제품보관", equipment: "제품보관", status: "대기", startAt: "", endAt: "", resultQty: "", defectQty: "0", workers: [] },
  ];
}

function qmesProcessWorkOrdersFromDb() {
  const docs = window.DB?.woDocs && typeof window.DB.woDocs === "object" ? window.DB.woDocs : {};
  return Object.entries(docs).map(([lot, workOrder]) => ({
    lot,
    key: lot,
    workOrder: workOrder || {},
  }));
}

function qmesProcessPqcState(lot) {
  const rows = Array.isArray(window.DB?.insp?.PQC) ? window.DB.insp.PQC : [];
  const matches = rows.filter(row => qmesProcessClean(row?.lot) === qmesProcessClean(lot));
  if (!matches.length) return { state: "없음", tone: "gray", rows: [] };
  if (matches.some(row => qmesProcessClean(row?.judge) === "불합격")) return { state: "불합격", tone: "red", rows: matches };
  if (matches.every(row => qmesProcessClean(row?.judge) === "합격")) return { state: "합격", tone: "green", rows: matches };
  return { state: "검사대기", tone: "amber", rows: matches };
}

function qmesProcessUpdateLocalCompletion(lot, workOrder, workers, process) {
  try {
    const planQty = qmesProcessPlanQty(workOrder);
    if (Array.isArray(window.DB?.batches)) {
      window.DB.batches = window.DB.batches.map(batch => {
        if (qmesProcessClean(batch?.no) !== qmesProcessClean(lot)) return batch;
        return { ...batch, status: "완료", done: Number(batch.plan || planQty || batch.done || 0) };
      });
    }
    if (window.DB?.lots?.[lot]) {
      window.DB.lots[lot] = {
        ...window.DB.lots[lot],
        status: "생산완료",
        productionStatus: "완료",
        productionWorkers: workers.map(worker => worker.name),
        processCompletedAt: process.completedAt || qmesProcessNow(),
      };
    }
    if (typeof window.dbSave === "function") window.dbSave();
    else if (typeof dbSave === "function") dbSave();
  } catch (error) {
    console.warn("[QMES 생산공정] 로컬 완료 반영 실패", error);
  }
  try {
    window.dispatchEvent(new CustomEvent("qmes:production-process-updated", { detail: { lot, status: "완료" } }));
  } catch (_error) {}
}

async function qmesProcessCreateWorklog(lot, workOrder, workers, process) {
  const planQty = qmesProcessPlanQty(workOrder);
  const materials = (Array.isArray(workOrder?.inputs) ? workOrder.inputs : []).map((row, index) => ({
    seq: index + 1,
    material: qmesProcessClean(row?.name || row?.material),
    supName: qmesProcessClean(row?.supplier || row?.supName),
    lotNo: qmesProcessClean(row?.lot || row?.materialLot),
    inputQty: qmesProcessClean(row?.act ?? row?.std ?? ""),
    inputTime: "",
  }));
  const completedStep = (process.steps || []).slice().reverse().find(step => step.status === "완료");
  const resultQty = completedStep?.resultQty || planQty || "";
  const response = await fetch("/api/worklog", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workDate: qmesProcessDate(workOrder?.date || process.productionDate || new Date()),
      finishedLot: lot,
      worker: workers.map(worker => worker.name).join(", "),
      planQty: planQty ? String(planQty) : "",
      prodQty: resultQty ? String(resultQty) : "",
      failQty: String((process.steps || []).reduce((sum, step) => sum + (Number(step.defectQty) || 0), 0)),
      remark: "생산공정 관리 자동 완료 등록",
      materials,
    }),
  });
  const payload = await response.json().catch(() => ({ success: false }));
  if (!response.ok || !payload.success) throw new Error(payload.message || "작업일지 자동 저장에 실패했습니다.");
  return payload.data;
}

function ProductionProcessTab() {
  const [syncRows, setSyncRows] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [selectedLot, setSelectedLot] = useState("");
  const [process, setProcess] = useState(null);
  const [selectedStep, setSelectedStep] = useState(0);
  const [workerIds, setWorkerIds] = useState([]);
  const [workerModal, setWorkerModal] = useState(false);
  const [registerModal, setRegisterModal] = useState(false);
  const [actionModal, setActionModal] = useState("");
  const [defectDraft, setDefectDraft] = useState({ qty: "0", reason: "", note: "" });
  const [downtimeDraft, setDowntimeDraft] = useState({ reason: "", minutes: "", note: "" });
  const [workerDraft, setWorkerDraft] = useState({ name: "", uid: "", dept: "생산팀", role: "작업자" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const localOrders = qmesProcessWorkOrdersFromDb();
  const remoteOrders = syncRows
    .filter(row => !String(row.record_key || "").startsWith(QMES_PROCESS_KEY_PREFIX) && !String(row.record_key || "").startsWith(QMES_WORKER_KEY_PREFIX))
    .map(row => {
      const payload = row.payload || {};
      const lot = qmesProcessClean(payload.lotNo || payload.lot || payload.productionLot || row.record_key);
      return lot ? { lot, key: row.record_key, workOrder: payload } : null;
    })
    .filter(Boolean);

  const orderMap = new Map();
  [...remoteOrders, ...localOrders].forEach(item => {
    if (!item?.lot) return;
    const previous = orderMap.get(item.lot) || {};
    orderMap.set(item.lot, { ...previous, ...item, workOrder: { ...(previous.workOrder || {}), ...(item.workOrder || {}) } });
  });
  const orders = Array.from(orderMap.values()).sort((a, b) => String(b.workOrder?.date || "").localeCompare(String(a.workOrder?.date || "")));

  const addedWorkers = syncRows
    .filter(row => String(row.record_key || "").startsWith(QMES_WORKER_KEY_PREFIX))
    .map(row => ({ ...(row.payload || {}), recordKey: row.record_key }))
    .filter(worker => worker.active !== false && worker.name);

  const baseWorkers = remoteUsers
    .filter(user => user && user.name && String(user.status || "APPROVED") === "APPROVED")
    .filter(user => {
      const dept = qmesProcessClean(user.department || user.dept);
      return dept.includes("생산") || dept.includes("제조") || dept.includes("공정");
    })
    .map(user => ({
      id: qmesProcessClean(user.uid || user.id || user.name),
      uid: qmesProcessClean(user.uid),
      name: qmesProcessClean(user.name),
      dept: qmesProcessClean(user.department || user.dept),
      role: qmesProcessClean(user.title) || "작업자",
      source: "users",
    }));

  const workerMap = new Map();
  [...baseWorkers, ...addedWorkers].forEach(worker => {
    const id = qmesProcessClean(worker.id || worker.uid || worker.recordKey || worker.name);
    if (!id) return;
    workerMap.set(id, { ...worker, id });
  });
  const workers = Array.from(workerMap.values()).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  const selectedWorkers = workers.filter(worker => workerIds.includes(worker.id));
  const currentOrder = orderMap.get(selectedLot)?.workOrder || {};
  const pqc = qmesProcessPqcState(selectedLot);

  const loadAll = async () => {
    setBusy(true);
    setError("");
    try {
      const [rows, usersResponse] = await Promise.all([
        qmesProcessFetchSyncRows(),
        fetch("/api/users/signable", { credentials: "same-origin" }).then(async response => {
          const payload = await response.json().catch(() => ({ success: false, data: [] }));
          return response.ok && payload.success && Array.isArray(payload.data) ? payload.data : [];
        }).catch(() => []),
      ]);
      setSyncRows(rows);
      setRemoteUsers(usersResponse);
      const local = qmesProcessWorkOrdersFromDb();
      const remote = rows
        .filter(row => !String(row.record_key || "").startsWith(QMES_PROCESS_KEY_PREFIX) && !String(row.record_key || "").startsWith(QMES_WORKER_KEY_PREFIX))
        .map(row => qmesProcessClean(row.payload?.lotNo || row.payload?.lot || row.payload?.productionLot || row.record_key))
        .filter(Boolean);
      const preferred = selectedLot || local[0]?.lot || remote[0] || "";
      if (preferred && !selectedLot) setSelectedLot(preferred);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (!selectedLot) { setProcess(null); return; }
    const saved = syncRows.find(row => row.record_key === `${QMES_PROCESS_KEY_PREFIX}${selectedLot}`)?.payload;
    const order = orderMap.get(selectedLot)?.workOrder || {};
    if (saved && Array.isArray(saved.steps)) {
      setProcess(saved);
      setWorkerIds(Array.isArray(saved.workerIds) ? saved.workerIds : []);
      const activeIndex = saved.steps.findIndex(step => step.status === "진행중");
      const nextIndex = saved.steps.findIndex(step => step.status !== "완료");
      setSelectedStep(activeIndex >= 0 ? activeIndex : (nextIndex >= 0 ? nextIndex : Math.max(0, saved.steps.length - 1)));
      return;
    }
    const current = qmesProcessCurrentUser();
    const next = {
      lot: selectedLot,
      item: qmesProcessClean(order.item || order.product || order.grade),
      equipment: qmesProcessClean(order.equipment || order.equipmentName || order.machine || order.tank || order.eq),
      productionDate: qmesProcessDate(order.date || order.productionDate || new Date()),
      planQty: qmesProcessPlanQty(order),
      status: "대기",
      workerIds: [],
      workers: [],
      steps: qmesProcessDefaultSteps(order),
      createdAt: qmesProcessNow(),
      createdBy: current.name,
      updatedAt: qmesProcessNow(),
    };
    setProcess(next);
    setWorkerIds([]);
    setSelectedStep(0);
  }, [selectedLot, syncRows, version]);

  const persistProcess = async next => {
    const user = qmesProcessCurrentUser();
    const payload = {
      ...next,
      workerIds,
      workers: selectedWorkers.map(worker => ({ id: worker.id, uid: worker.uid || "", name: worker.name, dept: worker.dept || "", role: worker.role || "" })),
      updatedAt: qmesProcessNow(),
      updatedBy: user.name,
    };
    setProcess(payload);
    await qmesProcessSaveSync(`${QMES_PROCESS_KEY_PREFIX}${selectedLot}`, payload);
    setSyncRows(rows => {
      const key = `${QMES_PROCESS_KEY_PREFIX}${selectedLot}`;
      const nextRow = { record_type: QMES_PROCESS_SYNC_TYPE, record_key: key, payload, updated_by: user.name, updated_at: payload.updatedAt };
      const exists = rows.some(row => row.record_key === key);
      return exists ? rows.map(row => row.record_key === key ? nextRow : row) : [nextRow, ...rows];
    });
    return payload;
  };

  const saveWorkersOnly = async ids => {
    if (!process) return;
    const nextWorkers = workers.filter(worker => ids.includes(worker.id));
    const next = { ...process, workerIds: ids, workers: nextWorkers.map(worker => ({ id: worker.id, uid: worker.uid || "", name: worker.name, dept: worker.dept || "", role: worker.role || "" })) };
    const previousIds = workerIds;
    setWorkerIds(ids);
    setWorkerModal(false);
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const user = qmesProcessCurrentUser();
      const payload = { ...next, updatedAt: qmesProcessNow(), updatedBy: user.name };
      setProcess(payload);
      await qmesProcessSaveSync(`${QMES_PROCESS_KEY_PREFIX}${selectedLot}`, payload);
      setMessage(`${nextWorkers.length}명의 작업자를 저장했습니다.`);
      await loadAll();
    } catch (saveError) {
      setWorkerIds(previousIds);
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  const registerWorker = async () => {
    const name = qmesProcessClean(workerDraft.name);
    if (!name) { setError("추가 작업자 이름을 입력하세요."); return; }
    const uid = qmesProcessClean(workerDraft.uid) || `PW-${Date.now().toString(36).toUpperCase()}`;
    const id = uid;
    const payload = {
      id,
      uid,
      name,
      dept: qmesProcessClean(workerDraft.dept) || "생산팀",
      role: qmesProcessClean(workerDraft.role) || "작업자",
      active: true,
      createdAt: qmesProcessNow(),
      createdBy: qmesProcessCurrentUser().name,
    };
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await qmesProcessSaveSync(`${QMES_WORKER_KEY_PREFIX}${id}`, payload);
      setWorkerDraft({ name: "", uid: "", dept: "생산팀", role: "작업자" });
      setRegisterModal(false);
      setMessage(`${name} 작업자를 등록했습니다.`);
      await loadAll();
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setBusy(false);
    }
  };

  const startOrComplete = async () => {
    if (!process || !selectedLot) return;
    if (!workerIds.length) { setError("작업자를 1명 이상 선택해야 작업을 시작할 수 있습니다."); setWorkerModal(true); return; }
    const step = process.steps?.[selectedStep];
    if (!step) return;
    if (step.status === "완료") { setMessage("이미 완료된 공정입니다."); return; }

    if (step.name.includes("PQC") && step.status === "진행중") {
      const state = qmesProcessPqcState(selectedLot);
      if (state.state === "불합격") { setError("PQC가 불합격입니다. 부적합 처리 후 공정을 진행하세요."); return; }
      if (state.state !== "합격") { setError("PQC 검사 합격 후 공정검사를 완료할 수 있습니다."); return; }
    }

    const now = qmesProcessNow();
    const steps = process.steps.map((row, index) => {
      if (index !== selectedStep) return row;
      if (row.status === "대기") return { ...row, status: "진행중", startAt: now, workers: selectedWorkers.map(worker => worker.name) };
      return { ...row, status: "완료", endAt: now, workers: selectedWorkers.map(worker => worker.name), resultQty: row.resultQty || String(process.planQty || "") };
    });
    const completed = steps.every(row => row.status === "완료");
    const started = steps.some(row => row.status === "진행중" || row.status === "완료");
    let next = { ...process, steps, status: completed ? "완료" : (started ? "진행중" : "대기") };
    if (completed) next = { ...next, completedAt: now };

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const saved = await persistProcess(next);
      if (step.status === "대기") {
        setMessage(`${step.name} 작업을 시작했습니다.`);
      } else {
        const nextIndex = steps.findIndex((row, index) => index > selectedStep && row.status !== "완료");
        if (nextIndex >= 0) setSelectedStep(nextIndex);
        setMessage(`${step.name} 작업을 완료했습니다.`);
      }
      if (completed) {
        qmesProcessUpdateLocalCompletion(selectedLot, currentOrder, selectedWorkers, saved);
        if (!saved.worklogId) {
          try {
            const worklog = await qmesProcessCreateWorklog(selectedLot, currentOrder, selectedWorkers, saved);
            const withWorklog = { ...saved, worklogId: worklog?.id || "saved" };
            await persistProcess(withWorklog);
            setMessage("전체 생산공정을 완료하고 생산실적/작업일지까지 연동했습니다.");
          } catch (worklogError) {
            setError(`공정 완료는 저장됐지만 작업일지 연동 실패: ${worklogError.message}`);
          }
        }
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  const addDefect = () => {
    if (!process) return;
    const step = process.steps?.[selectedStep];
    if (!step) return;
    setDefectDraft({ qty: String(step.defectQty || "0"), reason: "", note: "" });
    setError("");
    setActionModal("defect");
  };

  const saveDefect = async () => {
    if (!process) return;
    const qty = Number(String(defectDraft.qty).replace(/,/g, ""));
    if (!Number.isFinite(qty) || qty < 0) { setError("불량수량은 0 이상의 숫자로 입력하세요."); return; }
    if (!qmesProcessClean(defectDraft.reason)) { setError("불량 사유를 입력하세요."); return; }
    const now = qmesProcessNow();
    const history = Array.isArray(process.defects) ? process.defects : [];
    const steps = process.steps.map((row, index) => index === selectedStep ? { ...row, defectQty: String(qty) } : row);
    const defect = { stepNo: selectedStep + 1, qty: String(qty), reason: qmesProcessClean(defectDraft.reason), note: qmesProcessClean(defectDraft.note), at: now, workers: selectedWorkers.map(worker => worker.name) };
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await persistProcess({ ...process, steps, defects: [...history, defect] });
      setActionModal("");
      setMessage("불량 내역을 저장했습니다.");
    } catch (saveError) { setError(saveError.message); }
    finally { setBusy(false); }
  };

  const addDowntime = () => {
    if (!process || !process.steps?.[selectedStep]) return;
    setDowntimeDraft({ reason: "", minutes: "", note: "" });
    setError("");
    setActionModal("downtime");
  };

  const saveDowntime = async () => {
    if (!process) return;
    const reason = qmesProcessClean(downtimeDraft.reason);
    if (!reason) { setError("비가동 사유를 입력하세요."); return; }
    const minutesText = qmesProcessClean(downtimeDraft.minutes);
    const minutes = minutesText === "" ? 0 : Number(minutesText);
    if (!Number.isFinite(minutes) || minutes < 0) { setError("비가동 시간은 0 이상의 숫자로 입력하세요."); return; }
    const now = qmesProcessNow();
    const history = Array.isArray(process.downtime) ? process.downtime : [];
    const downtime = { stepNo: selectedStep + 1, reason, minutes, note: qmesProcessClean(downtimeDraft.note), at: now, workers: selectedWorkers.map(worker => worker.name) };
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await persistProcess({ ...process, downtime: [...history, downtime] });
      setActionModal("");
      setMessage("비가동 이력을 저장했습니다.");
    } catch (saveError) { setError(saveError.message); }
    finally { setBusy(false); }
  };

  const openProcessDocuments = () => { setError(""); setActionModal("documents"); };
  const openProcessPrint = () => { setError(""); setActionModal("print"); };
  const printProcessSheet = () => {
    document.body.classList.add("qpp-printing");
    window.print();
    window.setTimeout(() => document.body.classList.remove("qpp-printing"), 0);
  };
  const currentStep = process?.steps?.[selectedStep];
  const item = qmesProcessClean(currentOrder.item || currentOrder.product || currentOrder.grade || process?.item) || "-";
  const equipment = qmesProcessClean(currentOrder.equipment || currentOrder.equipmentName || currentOrder.machine || currentOrder.tank || process?.equipment) || "-";
  const planQty = qmesProcessPlanQty(currentOrder) || process?.planQty || 0;
  const workStandard = qmesProcessClean(currentOrder.workStandard || currentOrder.standardDocument || currentOrder.sop || currentOrder.workInstruction);
  const drawingDocument = qmesProcessClean(currentOrder.drawing || currentOrder.drawingNo || currentOrder.blueprint);

  return (
    <div className="qmes-prod-process">
      <style>{`
        .qmes-prod-process{color:#e2e8f0}.qmes-prod-process *{box-sizing:border-box}
        .qpp-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-bottom:14px}.qpp-head h2{margin:0;color:#f8fafc;font-size:21px}.qpp-head p{margin:5px 0 0;color:#94a3b8;font-size:12px}
        .qpp-toolbar{display:flex;gap:8px;align-items:center}.qpp-btn{min-height:38px;padding:8px 12px;border:1px solid #334e68;border-radius:8px;background:#13283f;color:#dbeafe;font-weight:800;cursor:pointer}.qpp-btn:hover{background:#1b3855}.qpp-btn.primary{background:#0f7ead;border-color:#1695c9;color:#fff}.qpp-btn.red{background:#3b2028;border-color:#7f3543;color:#fecdd3}.qpp-btn.amber{background:#3b301d;border-color:#725926;color:#fde68a}.qpp-btn:disabled{opacity:.5;cursor:wait}
        .qpp-select{min-width:260px;min-height:38px;padding:7px 10px;border:1px solid #334e68;border-radius:8px;background:#10253b;color:#e2e8f0}
        .qpp-card{border:1px solid #243d58;border-radius:13px;background:#0d1f33;overflow:hidden}.qpp-card-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #213b56}.qpp-card-head b{font-size:17px}.qpp-card-head span{color:#7dd3fc;font-size:12px}
        .qpp-info{display:grid;grid-template-columns:repeat(6,minmax(120px,1fr));gap:1px;background:#28435e}.qpp-info>div{padding:11px 12px;background:#112942}.qpp-info small{display:block;color:#7895af;font-size:10px;margin-bottom:5px}.qpp-info strong{display:block;color:#f1f5f9;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .qpp-worker{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 15px;border-top:1px solid #1f3a55}.qpp-chips{display:flex;gap:6px;flex-wrap:wrap}.qpp-chip{padding:6px 9px;border:1px solid #23658c;border-radius:999px;background:#0e3856;color:#bae6fd;font-size:11px;font-weight:800}
        .qpp-grid{display:grid;grid-template-columns:1fr;gap:14px;margin-top:14px}.qpp-table-wrap{width:100%;overflow:hidden}.qpp-table{width:100%;min-width:0;border-collapse:collapse;table-layout:fixed}.qpp-table th{width:14.285%!important;height:48px;padding:12px 8px;background:#10263e;color:#7895af;border-right:1px solid #2a445f;border-bottom:1px solid #2a445f;text-align:center!important;vertical-align:middle;font-size:13px;font-weight:800;white-space:nowrap}.qpp-table td{width:14.285%!important;min-height:52px;padding:14px 8px;border-right:1px solid #1e3852;border-bottom:1px solid #1e3852;color:#dbe7f2;text-align:center!important;vertical-align:middle;font-size:13px;line-height:1.35;word-break:keep-all}.qpp-table th:last-child,.qpp-table td:last-child{border-right:0}.qpp-table tbody tr{cursor:pointer}.qpp-table tbody tr:hover{background:#132c47}.qpp-table tbody tr.active{background:#1c3044;box-shadow:inset 4px 0 0 #f43f5e}.qpp-center,.qpp-right{text-align:center!important}.qpp-status{display:inline-flex;align-items:center;justify-content:center;min-width:54px;padding:6px 9px;border-radius:999px;font-size:12px;font-weight:900}.qpp-status.done{background:#123d32;color:#6ee7b7}.qpp-status.run{background:#0e3b57;color:#7dd3fc}.qpp-status.wait{background:#253349;color:#a8b8c8}
        .qpp-side{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:16px}.qpp-sidebox{min-width:0;padding:15px;border:1px solid #294761;border-radius:9px;background:#122a44;margin:0}.qpp-sidebox small{display:block;color:#7895af;font-size:12px;margin-bottom:7px}.qpp-sidebox strong{font-size:16px}.qpp-sidebox p{margin:7px 0 0;color:#9bb0c3;font-size:12px;line-height:1.6}.qpp-actionbar{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:8px;margin-top:12px}.qpp-actionbar button{min-height:50px}
        .qpp-message{margin-top:10px;padding:9px 11px;border-radius:7px;font-size:11px}.qpp-message.ok{background:#0b332c;border:1px solid #16664f;color:#86efac}.qpp-message.err{background:#3a2027;border:1px solid #793440;color:#fecaca}
        .qpp-modal{position:fixed;inset:0;z-index:15000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,8,18,.78)}.qpp-dialog{width:min(700px,96vw);max-height:88vh;overflow:auto;border:1px solid #365570;border-radius:12px;background:#0f2237;box-shadow:0 28px 90px rgba(0,0,0,.5)}.qpp-dialog-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #28445e}.qpp-dialog-body{padding:15px}.qpp-workers{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.qpp-worker-item{display:flex;gap:8px;align-items:center;padding:10px;border:1px solid #2d4c67;border-radius:8px;background:#142c47}.qpp-worker-item input{width:17px;height:17px}.qpp-worker-item b{font-size:11px}.qpp-worker-item small{display:block;color:#7d95aa;font-size:9px;margin-top:2px}.qpp-dialog-foot{display:flex;justify-content:flex-end;gap:7px;padding:13px 16px;border-top:1px solid #28445e}.qpp-form{display:grid;grid-template-columns:1fr 1fr;gap:10px}.qpp-form label{display:block;color:#91a7bb;font-size:10px}.qpp-form input{display:block;width:100%;height:38px;margin-top:5px;padding:0 10px;border:1px solid #35516b;border-radius:7px;background:#142d49;color:#f1f5f9}
        .qpp-action-dialog{width:min(820px,96vw)}.qpp-action-dialog.wide{width:min(980px,96vw)}.qpp-dialog-head b{font-size:16px}.qpp-dialog-sub{margin-top:4px;color:#8da4b9;font-size:11px}
        .qpp-modal-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;margin-bottom:14px;border:1px solid #294761;border-radius:9px;overflow:hidden;background:#294761}.qpp-modal-summary>div{min-width:0;padding:11px 12px;background:#122a44}.qpp-modal-summary small{display:block;margin-bottom:5px;color:#7895af;font-size:10px}.qpp-modal-summary strong{display:block;overflow:hidden;color:#f1f5f9;font-size:13px;text-overflow:ellipsis;white-space:nowrap}
        .qpp-action-form{display:grid;grid-template-columns:1fr 1fr;gap:12px}.qpp-action-form label{display:flex;min-width:0;flex-direction:column;gap:7px;color:#a9bfd2;font-size:12px;font-weight:700}.qpp-action-form label.full{grid-column:1/-1}.qpp-action-form input,.qpp-action-form textarea{width:100%;border:1px solid #35516b;border-radius:8px;background:#142d49;color:#f1f5f9;font-size:13px;outline:none}.qpp-action-form input{height:42px;padding:0 11px}.qpp-action-form textarea{min-height:88px;padding:10px 11px;resize:vertical}.qpp-action-form input:focus,.qpp-action-form textarea:focus{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.12)}
        .qpp-doc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.qpp-doc-card{min-height:145px;padding:16px;border:1px solid #31516d;border-radius:10px;background:#122a44}.qpp-doc-card small{display:block;color:#7dd3fc;font-size:11px;font-weight:800}.qpp-doc-card h3{margin:10px 0 7px;color:#f1f5f9;font-size:17px}.qpp-doc-card p{margin:0;color:#9bb0c3;font-size:12px;line-height:1.6}.qpp-doc-empty{display:inline-flex;margin-top:13px;padding:6px 9px;border-radius:999px;background:#29384c;color:#cbd5e1;font-size:11px;font-weight:800}
        .qpp-print-sheet{padding:24px;border-radius:8px;background:#fff;color:#111827}.qpp-print-title{text-align:center}.qpp-print-title h2{margin:0;color:#111827;font-size:23px}.qpp-print-title p{margin:6px 0 18px;color:#475569;font-size:12px}.qpp-print-meta{display:grid;grid-template-columns:repeat(3,1fr);margin-bottom:16px;border-top:1px solid #475569;border-left:1px solid #475569}.qpp-print-meta>div{padding:9px 10px;border-right:1px solid #475569;border-bottom:1px solid #475569}.qpp-print-meta small{display:block;margin-bottom:4px;color:#64748b;font-size:10px}.qpp-print-meta strong{color:#111827;font-size:12px}.qpp-print-table{width:100%;border-collapse:collapse;table-layout:fixed}.qpp-print-table th,.qpp-print-table td{padding:8px 5px;border:1px solid #475569;color:#111827;text-align:center;font-size:11px}.qpp-print-table th{background:#e2e8f0;font-weight:800}
        @media print{body.qpp-printing *{visibility:hidden!important}body.qpp-printing .qpp-print-sheet,body.qpp-printing .qpp-print-sheet *{visibility:visible!important}body.qpp-printing .qpp-print-sheet{position:absolute!important;left:0!important;top:0!important;width:100%!important;padding:10mm!important;border:0!important;border-radius:0!important}body.qpp-printing .qpp-modal{position:static!important;padding:0!important;background:#fff!important}body.qpp-printing .qpp-dialog{width:100%!important;max-height:none!important;overflow:visible!important;border:0!important;box-shadow:none!important}body.qpp-printing .qpp-dialog-head,body.qpp-printing .qpp-dialog-foot{display:none!important}}
        @media(max-width:1100px){.qpp-info{grid-template-columns:repeat(3,1fr)}.qpp-actionbar{grid-template-columns:repeat(3,1fr)}}@media(max-width:700px){.qpp-head{align-items:flex-start;flex-direction:column}.qpp-toolbar{width:100%;flex-wrap:wrap}.qpp-select{width:100%;min-width:0}.qpp-info{grid-template-columns:repeat(2,1fr)}.qpp-worker{align-items:flex-start;flex-direction:column}.qpp-actionbar{grid-template-columns:repeat(2,1fr)}.qpp-workers{grid-template-columns:repeat(2,1fr)}.qpp-form,.qpp-action-form,.qpp-doc-grid{grid-template-columns:1fr}.qpp-side{grid-template-columns:1fr}.qpp-modal-summary{grid-template-columns:repeat(2,1fr)}.qpp-table th{font-size:11px;padding:9px 3px}.qpp-table td{font-size:11px;padding:11px 3px}.qpp-status{min-width:0;padding:5px 4px;font-size:10px}.qpp-print-meta{grid-template-columns:repeat(2,1fr)}}
      `}</style>

      <div className="qpp-head">
        <div><h2>생산공정 관리</h2><p>작업지시서 → 작업자 → 공정진행 → PQC → 생산완료/작업일지 연동</p></div>
        <div className="qpp-toolbar">
          <select className="qpp-select" value={selectedLot} onChange={event => { setSelectedLot(event.target.value); setMessage(""); setError(""); }}>
            <option value="">작업지시 LOT 선택</option>
            {orders.map(order => <option key={order.lot} value={order.lot}>{order.lot} · {qmesProcessClean(order.workOrder?.item || order.workOrder?.product) || "품목 미지정"}</option>)}
          </select>
          <button type="button" className="qpp-btn" disabled={busy} onClick={loadAll}>새로고침</button>
        </div>
      </div>

      {!orders.length && <div className="qpp-message err">작업지시서가 없습니다. [생산관리 → 작업지시서]에서 작업지시를 먼저 발행하세요.</div>}

      {selectedLot && process && <>
        <section className="qpp-card">
          <div className="qpp-card-head"><b>작업지시 연동 정보</b><span>{process.status || "대기"} · LOT {selectedLot}</span></div>
          <div className="qpp-info">
            <div><small>작업구분</small><strong>{qmesProcessClean(currentOrder.workType || currentOrder.type) || "완제품"}</strong></div>
            <div><small>공정 / 품목</small><strong>{item}</strong></div>
            <div><small>설비명</small><strong>{equipment}</strong></div>
            <div><small>생산일자</small><strong>{qmesProcessDate(currentOrder.date || process.productionDate)}</strong></div>
            <div><small>LOT No.</small><strong>{selectedLot}</strong></div>
            <div><small>계획수량</small><strong>{Number(planQty || 0).toLocaleString()} kg</strong></div>
          </div>
          <div className="qpp-worker">
            <div><small style={{display:"block",color:"#7895af",fontSize:10,marginBottom:6}}>작업자 · 1명 이상 복수선택</small><div className="qpp-chips">{selectedWorkers.length ? selectedWorkers.map(worker => <span className="qpp-chip" key={worker.id}>{worker.name} · {worker.dept || "-"}</span>) : <span style={{fontSize:11,color:"#fda4af"}}>작업자를 선택하세요.</span>}</div></div>
            <div style={{display:"flex",gap:7}}><button type="button" className="qpp-btn" onClick={() => setRegisterModal(true)}>추가 작업자 등록</button><button type="button" className="qpp-btn primary" onClick={() => setWorkerModal(true)}>작업자 선택</button></div>
          </div>
        </section>

        <div className="qpp-grid">
          <section className="qpp-card">
            <div className="qpp-card-head"><b>공정 진행 현황</b><span>공정 행을 선택하세요.</span></div>
            <div className="qpp-table-wrap"><table className="qpp-table"><thead><tr><th>순번</th><th>공정</th><th>설비</th><th>시작</th><th>종료</th><th>불량</th><th>상태</th></tr></thead><tbody>
              {process.steps.map((step, index) => <tr key={step.no} className={selectedStep === index ? "active" : ""} onClick={() => setSelectedStep(index)}><td className="qpp-center">{step.no}</td><td>{step.name}</td><td>{step.equipment}</td><td>{qmesProcessTime(step.startAt)}</td><td>{qmesProcessTime(step.endAt)}</td><td className="qpp-right">{step.defectQty || "0"}</td><td><span className={`qpp-status ${step.status === "완료" ? "done" : step.status === "진행중" ? "run" : "wait"}`}>{step.status}</span></td></tr>)}
            </tbody></table></div>
          </section>

          <aside className="qpp-card"><div className="qpp-card-head"><b>현재 작업공정</b><span>#{currentStep?.no || "-"}</span></div><div className="qpp-side">
            <div className="qpp-sidebox"><small>공정명</small><strong>{currentStep?.name || "-"}</strong><p>{currentStep?.equipment || "-"}<br/>시작 {qmesProcessTime(currentStep?.startAt)} · 종료 {qmesProcessTime(currentStep?.endAt)}</p></div>
            <div className="qpp-sidebox"><small>PQC 연동 상태</small><strong style={{color:pqc.tone === "green" ? "#6ee7b7" : pqc.tone === "red" ? "#fda4af" : pqc.tone === "amber" ? "#fde68a" : "#cbd5e1"}}>{pqc.state}</strong><p>작업지시 발행 시 생성된 공정검사(PQC) LOT와 자동 확인합니다.</p></div>
            <div className="qpp-sidebox"><small>비가동 이력</small><strong>{Array.isArray(process.downtime) ? process.downtime.length : 0}건</strong><p>{Array.isArray(process.downtime) && process.downtime.length ? process.downtime.slice(-2).map(item => `${qmesProcessTime(item.at)} ${item.reason}`).join(" / ") : "등록된 비가동 없음"}</p></div>
          </div></aside>
        </div>

        <div className="qpp-actionbar">
          <button type="button" className="qpp-btn primary" disabled={busy || !currentStep || currentStep.status === "완료"} onClick={startOrComplete}>{currentStep?.status === "진행중" ? "현재 공정 완료" : "현재 공정 시작"}</button>
          <button type="button" className="qpp-btn red" disabled={busy || !currentStep} onClick={addDefect}>불량 등록</button>
          <button type="button" className="qpp-btn amber" disabled={busy || !currentStep} onClick={addDowntime}>비가동 등록</button>
          <button type="button" className="qpp-btn" disabled={!currentStep} onClick={openProcessDocuments}>작업표준 / 도면</button>
          <button type="button" className="qpp-btn" disabled={!process} onClick={openProcessPrint}>LOT / 공정 출력</button>
        </div>
      </>}

      {message && <div className="qpp-message ok">{message}</div>}
      {error && <div className="qpp-message err">{error}</div>}

      {actionModal==="defect"&&<div className="qpp-modal" onClick={event=>{if(event.target===event.currentTarget&&!busy)setActionModal("");}}><div className="qpp-dialog qpp-action-dialog">
        <div className="qpp-dialog-head"><div><b>불량 등록</b><div className="qpp-dialog-sub">현재 선택한 공정의 불량 내역을 입력합니다.</div></div><button type="button" className="qpp-btn" disabled={busy} onClick={()=>setActionModal("")}>닫기</button></div>
        <div className="qpp-dialog-body">
          <div className="qpp-modal-summary"><div><small>LOT No.</small><strong>{selectedLot}</strong></div><div><small>현재 공정</small><strong>{currentStep?.name||"-"}</strong></div><div><small>설비</small><strong>{currentStep?.equipment||equipment}</strong></div><div><small>작업자</small><strong>{selectedWorkers.map(worker=>worker.name).join(", ")||"-"}</strong></div></div>
          <div className="qpp-action-form"><label>불량수량 *<input type="number" min="0" step="1" value={defectDraft.qty} onChange={event=>setDefectDraft(value=>({...value,qty:event.target.value}))}/></label><label>불량 사유 *<input value={defectDraft.reason} onChange={event=>setDefectDraft(value=>({...value,reason:event.target.value}))} placeholder="예: 이물, 점도 이상, 포장 불량"/></label><label className="full">비고<textarea value={defectDraft.note} onChange={event=>setDefectDraft(value=>({...value,note:event.target.value}))} placeholder="조치 내용이나 참고사항을 입력하세요."/></label></div>
        </div>
        <div className="qpp-dialog-foot"><button type="button" className="qpp-btn" disabled={busy} onClick={()=>setActionModal("")}>취소</button><button type="button" className="qpp-btn red" disabled={busy} onClick={saveDefect}>불량 저장</button></div>
      </div></div>}

      {actionModal==="downtime"&&<div className="qpp-modal" onClick={event=>{if(event.target===event.currentTarget&&!busy)setActionModal("");}}><div className="qpp-dialog qpp-action-dialog">
        <div className="qpp-dialog-head"><div><b>비가동 등록</b><div className="qpp-dialog-sub">현재 선택한 공정의 비가동 사유와 시간을 기록합니다.</div></div><button type="button" className="qpp-btn" disabled={busy} onClick={()=>setActionModal("")}>닫기</button></div>
        <div className="qpp-dialog-body">
          <div className="qpp-modal-summary"><div><small>LOT No.</small><strong>{selectedLot}</strong></div><div><small>현재 공정</small><strong>{currentStep?.name||"-"}</strong></div><div><small>설비</small><strong>{currentStep?.equipment||equipment}</strong></div><div><small>등록시각</small><strong>{new Date().toLocaleString("ko-KR")}</strong></div></div>
          <div className="qpp-action-form"><label>비가동 사유 *<input value={downtimeDraft.reason} onChange={event=>setDowntimeDraft(value=>({...value,reason:event.target.value}))} placeholder="예: 설비점검, 원료대기"/></label><label>비가동 시간(분)<input type="number" min="0" step="1" value={downtimeDraft.minutes} onChange={event=>setDowntimeDraft(value=>({...value,minutes:event.target.value}))} placeholder="예: 30"/></label><label className="full">비고<textarea value={downtimeDraft.note} onChange={event=>setDowntimeDraft(value=>({...value,note:event.target.value}))} placeholder="조치 내용이나 참고사항을 입력하세요."/></label></div>
        </div>
        <div className="qpp-dialog-foot"><button type="button" className="qpp-btn" disabled={busy} onClick={()=>setActionModal("")}>취소</button><button type="button" className="qpp-btn amber" disabled={busy} onClick={saveDowntime}>비가동 저장</button></div>
      </div></div>}

      {actionModal==="documents"&&<div className="qpp-modal" onClick={event=>{if(event.target===event.currentTarget)setActionModal("");}}><div className="qpp-dialog qpp-action-dialog wide">
        <div className="qpp-dialog-head"><div><b>작업표준 / 도면</b><div className="qpp-dialog-sub">현재 LOT와 공정에 연결된 작업 문서를 확인합니다.</div></div><button type="button" className="qpp-btn" onClick={()=>setActionModal("")}>닫기</button></div>
        <div className="qpp-dialog-body">
          <div className="qpp-modal-summary"><div><small>LOT No.</small><strong>{selectedLot}</strong></div><div><small>품목</small><strong>{item}</strong></div><div><small>현재 공정</small><strong>{currentStep?.name||"-"}</strong></div><div><small>설비</small><strong>{currentStep?.equipment||equipment}</strong></div></div>
          <div className="qpp-doc-grid"><div className="qpp-doc-card"><small>작업표준서</small><h3>{workStandard||"연결된 작업표준서 없음"}</h3><p>현재 작업지시서에 등록된 작업방법·주의사항·공정조건 문서입니다.</p>{!workStandard&&<span className="qpp-doc-empty">미등록</span>}</div><div className="qpp-doc-card"><small>도면 / 사양서</small><h3>{drawingDocument||"연결된 도면 없음"}</h3><p>현재 품목과 공정에 연결된 도면 또는 제품 사양 문서입니다.</p>{!drawingDocument&&<span className="qpp-doc-empty">미등록</span>}</div></div>
        </div>
        <div className="qpp-dialog-foot"><button type="button" className="qpp-btn primary" onClick={()=>setActionModal("")}>확인</button></div>
      </div></div>}

      {actionModal==="print"&&<div className="qpp-modal" onClick={event=>{if(event.target===event.currentTarget)setActionModal("");}}><div className="qpp-dialog qpp-action-dialog wide">
        <div className="qpp-dialog-head"><div><b>LOT / 공정 출력 미리보기</b><div className="qpp-dialog-sub">내용을 확인한 후 인쇄하세요.</div></div><button type="button" className="qpp-btn" onClick={()=>setActionModal("")}>닫기</button></div>
        <div className="qpp-dialog-body"><div className="qpp-print-sheet">
          <div className="qpp-print-title"><h2>생산공정 진행 현황</h2><p>나모케미칼(주) · LOT별 공정 기록</p></div>
          <div className="qpp-print-meta"><div><small>LOT No.</small><strong>{selectedLot}</strong></div><div><small>품목</small><strong>{item}</strong></div><div><small>생산일자</small><strong>{qmesProcessDate(currentOrder.date||process?.productionDate)}</strong></div><div><small>설비명</small><strong>{equipment}</strong></div><div><small>계획수량</small><strong>{Number(planQty||0).toLocaleString()} kg</strong></div><div><small>작업자</small><strong>{selectedWorkers.map(worker=>worker.name).join(", ")||"-"}</strong></div></div>
          <table className="qpp-print-table"><thead><tr><th>순번</th><th>공정</th><th>설비</th><th>시작</th><th>종료</th><th>불량</th><th>상태</th></tr></thead><tbody>{process?.steps?.map(step=><tr key={step.no}><td>{step.no}</td><td>{step.name}</td><td>{step.equipment}</td><td>{qmesProcessTime(step.startAt)}</td><td>{qmesProcessTime(step.endAt)}</td><td>{step.defectQty||"0"}</td><td>{step.status}</td></tr>)}</tbody></table>
        </div></div>
        <div className="qpp-dialog-foot"><button type="button" className="qpp-btn" onClick={()=>setActionModal("")}>닫기</button><button type="button" className="qpp-btn primary" onClick={printProcessSheet}>인쇄</button></div>
      </div></div>}
      {workerModal && <div className="qpp-modal" onClick={event => { if (event.target === event.currentTarget) setWorkerModal(false); }}><div className="qpp-dialog"><div className="qpp-dialog-head"><div><b>작업자 선택</b><div style={{fontSize:10,color:"#8da4b9",marginTop:3}}>1명 이상 복수선택 가능</div></div><button type="button" className="qpp-btn" onClick={() => setWorkerModal(false)}>닫기</button></div><div className="qpp-dialog-body"><div className="qpp-workers">
        {workers.map(worker => <label className="qpp-worker-item" key={worker.id}><input type="checkbox" checked={workerIds.includes(worker.id)} onChange={event => { const checked = event.target.checked; setWorkerIds(ids => checked ? Array.from(new Set([...ids, worker.id])) : ids.filter(id => id !== worker.id)); }}/><span><b>{worker.name}</b><small>{worker.uid || worker.id} · {worker.dept || "-"}</small></span></label>)}
        {!workers.length && <div style={{color:"#fda4af",fontSize:11}}>등록된 생산 작업자가 없습니다. [추가 작업자 등록]을 사용하세요.</div>}
      </div></div><div className="qpp-dialog-foot"><button type="button" className="qpp-btn" onClick={() => setWorkerIds([])}>전체해제</button><button type="button" className="qpp-btn primary" disabled={!workerIds.length || busy} onClick={() => saveWorkersOnly(workerIds)}>선택 적용</button></div></div></div>}

      {registerModal && <div className="qpp-modal" onClick={event => { if (event.target === event.currentTarget) setRegisterModal(false); }}><div className="qpp-dialog"><div className="qpp-dialog-head"><div><b>추가 작업자 등록</b><div style={{fontSize:10,color:"#8da4b9",marginTop:3}}>생산공정 작업자 마스터에 추가</div></div><button type="button" className="qpp-btn" onClick={() => setRegisterModal(false)}>닫기</button></div><div className="qpp-dialog-body"><div className="qpp-form">
        <label>작업자명 *<input value={workerDraft.name} onChange={event => setWorkerDraft(value => ({...value,name:event.target.value}))} placeholder="작업자명"/></label>
        <label>사번 / 작업자번호<input value={workerDraft.uid} onChange={event => setWorkerDraft(value => ({...value,uid:event.target.value}))} placeholder="미입력 시 자동 생성"/></label>
        <label>부서<input value={workerDraft.dept} onChange={event => setWorkerDraft(value => ({...value,dept:event.target.value}))} placeholder="생산팀"/></label>
        <label>직책 / 구분<input value={workerDraft.role} onChange={event => setWorkerDraft(value => ({...value,role:event.target.value}))} placeholder="작업자"/></label>
      </div></div><div className="qpp-dialog-foot"><button type="button" className="qpp-btn primary" disabled={busy} onClick={registerWorker}>작업자 등록</button></div></div></div>}
    </div>
  );
}

window.ProductionProcessTab=ProductionProcessTab;

(function installProductionProcessMenu(){
  try {
    if (typeof TABS === "undefined" || typeof TOP_MENUS === "undefined") return;
    const existingProcessTab = TABS.find(item => item.id === "prodProcess");
    if (existingProcessTab) {
      existingProcessTab.label = "생산공정 관리";
      existingProcessTab.icon = FlaskConical;
      existingProcessTab.comp = ProductionProcessTab;
    } else {
      const workOrderIndex = TABS.findIndex(item => item.id === "woIssue");
      const item = { id:"prodProcess", label:"생산공정 관리", icon:FlaskConical, comp:ProductionProcessTab };
      if (workOrderIndex >= 0) TABS.splice(workOrderIndex + 1, 0, item);
      else TABS.push(item);
    }
    const productionMenu = TOP_MENUS.find(item => item.id === "productionMenu");
    if (productionMenu) {
      productionMenu.children = Array.isArray(productionMenu.children) ? productionMenu.children : [];
      if (!productionMenu.children.includes("prodProcess")) {
        const workOrderChildIndex = productionMenu.children.indexOf("woIssue");
        if (workOrderChildIndex >= 0) productionMenu.children.splice(workOrderChildIndex + 1, 0, "prodProcess");
        else productionMenu.children.push("prodProcess");
      }
    }
  } catch (error) {
    console.error("[QMES 생산공정] 메뉴 등록 실패", error);
  }
})();
