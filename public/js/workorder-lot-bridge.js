/* QMES work-order LOT bridge.
   Provides a small, safe integration surface for production.jsx without replacing it. */
(function installWorkOrderLotBridge(global){
  const ensureService = (callback) => {
    if (typeof global.qmesRecommendWorkOrderLots === "function" && typeof global.qmesValidateWorkOrderLots === "function") { callback?.(); return; }
    const existing = document.querySelector('script[data-qmes-inventory-lot-service],script[data-qmes-module="inventory-lot"]');
    if (existing) { existing.addEventListener("load", () => callback?.(), { once:true }); return; }
    const script = document.createElement("script");
    script.src = "./js/inventory-lot-service.js?v=20260806-lot5";
    script.dataset.qmesInventoryLotService = "true";
    script.onload = () => callback?.();
    script.onerror = () => console.warn("[QMES] LOT 서비스 로드 실패");
    document.head.appendChild(script);
  };

  const clone = (value) => { try { return JSON.parse(JSON.stringify(value)); } catch (error) { return value; } };
  const saveDb = (moduleName) => {
    if (typeof global.dbSave === "function") global.dbSave();
    global.dispatchEvent(new CustomEvent("qmes:data-updated", { detail:{ module:moduleName || "PRODUCTION" } }));
  };

  function getRecommendation(workOrderNo){
    if (typeof global.qmesRecommendWorkOrderLots !== "function") return { workOrderNo, found:false, complete:false, shortageCount:0, materials:[], pendingService:true };
    return global.qmesRecommendWorkOrderLots(workOrderNo);
  }

  function applyRecommendedLots(workOrderNo, options){
    const workOrder = global.DB?.woDocs?.[workOrderNo];
    if (!workOrder) return { ok:false, error:"작업지시를 찾을 수 없습니다." };
    const recommendation = getRecommendation(workOrderNo);
    if (!recommendation.found) return { ok:false, error:"LOT 추천 결과를 만들 수 없습니다." };
    if (!recommendation.complete && !options?.allowPartial) return { ok:false, error:"가용 LOT가 부족한 원료가 있습니다.", recommendation };
    const before = clone(workOrder);
    const nextInputs = (Array.isArray(workOrder.inputs) ? workOrder.inputs : []).map((input, index) => {
      const row = recommendation.materials.find((item) => item.index === index);
      const firstLot = row?.recommendation?.lots?.[0];
      if (!firstLot) return input;
      return { ...input, lot:firstLot.lot, materialLot:firstLot.lot, availableQty:firstLot.remainingKg, recommendedLot:true, recommendedAt:new Date().toISOString() };
    });
    global.DB.woDocs[workOrderNo] = { ...workOrder, inputs:nextInputs, updatedAt:new Date().toISOString() };
    if (typeof global.qmesRecordChange === "function") global.qmesRecordChange({ module:"PRODUCTION", action:"AUTO_ASSIGN_LOT", entityType:"WORK_ORDER", entityId:workOrderNo, reason:"FEFO/FIFO 추천 LOT 자동 반영", before, after:global.DB.woDocs[workOrderNo] });
    saveDb("PRODUCTION");
    return { ok:true, recommendation, workOrder:global.DB.woDocs[workOrderNo] };
  }

  function validateBeforeCompletion(workOrderNo){
    if (typeof global.qmesValidateWorkOrderLots !== "function") return { workOrderNo, found:false, ok:false, errors:["LOT 검증 서비스를 불러오는 중입니다."], materials:[] };
    return global.qmesValidateWorkOrderLots(workOrderNo);
  }

  function completeWorkOrderSafely(workOrderNo, completeCallback){
    const validation = validateBeforeCompletion(workOrderNo);
    if (!validation.ok) { global.dispatchEvent(new CustomEvent("qmes:workorder-completion-blocked", { detail:validation })); return { ok:false, blocked:true, validation }; }
    const result = typeof completeCallback === "function" ? completeCallback(validation) : true;
    global.dispatchEvent(new CustomEvent("qmes:workorder-completed", { detail:{ workOrderNo, validation } }));
    return { ok:true, blocked:false, validation, result };
  }

  function buildRecommendationMessage(workOrderNo){
    const recommendation = getRecommendation(workOrderNo);
    if (!recommendation.found) return "작업지시를 찾을 수 없습니다.";
    return recommendation.materials.map((row) => row.recommendation.lots.length
      ? `${row.materialName}: ${row.recommendation.lots.map((lot) => `${lot.lot} ${lot.allocateKg.toLocaleString()}kg`).join(" + ")}`
      : `${row.materialName}: 추천 가능 LOT 없음 (부족 ${row.recommendation.shortageKg.toLocaleString()}kg)`).join("\n");
  }

  function selectedWorkOrderNo(){
    const candidate = Array.from(document.querySelectorAll("button,td,span,div")).find((node) => /^([A-Z]{2,5}-)?\d{6,}[-A-Z0-9]*$/i.test(String(node.textContent || "").trim()) && global.DB?.woDocs?.[String(node.textContent || "").trim()]);
    if (candidate) return String(candidate.textContent || "").trim();
    return Object.keys(global.DB?.woDocs || {}).find((id) => document.body.innerText.includes(id)) || Object.keys(global.DB?.woDocs || {})[0] || "";
  }

  function showNotice(message, tone){
    let box = document.getElementById("qmes-workorder-lot-notice");
    if (!box) { box = document.createElement("div"); box.id = "qmes-workorder-lot-notice"; box.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:20000;max-width:520px;white-space:pre-line;padding:14px 16px;border-radius:12px;font:700 12px/1.55 Pretendard,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.45);"; document.body.appendChild(box); }
    box.style.background = tone === "error" ? "#3f1720" : tone === "success" ? "#12382d" : "#132b45";
    box.style.border = tone === "error" ? "1px solid #fb7185" : tone === "success" ? "1px solid #34d399" : "1px solid #38bdf8";
    box.style.color = "#f8fafc"; box.textContent = message; box.hidden = false; clearTimeout(box.__timer); box.__timer = setTimeout(() => { box.hidden = true; }, 7000);
  }

  function dashboardMetrics(){
    const rows = typeof global.qmesBuildInventoryRows === "function" ? global.qmesBuildInventoryRows() : [];
    const workOrders = Object.values(global.DB?.woDocs || {});
    const iqc = Array.isArray(global.DB?.iqc) ? global.DB.iqc : [];
    const holds = Array.isArray(global.DB?.holds) ? global.DB.holds : [];
    const today = new Date().toISOString().slice(0,10);
    const todayAudit = typeof global.qmesListAudit === "function" ? global.qmesListAudit({ dateFrom:today, dateTo:today }).length : 0;
    const allLots = rows.flatMap((row) => typeof global.qmesBuildMaterialLotLedger === "function" ? global.qmesBuildMaterialLotLedger(row.name) : []);
    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    return [
      ["진행 중 작업", workOrders.filter((w) => !["완료","생산완료","출하완료"].some((s) => String(w.status || "").includes(s))).length, "건", "생산"],
      ["재고 부족", rows.filter((r) => r.status === "부족").length, "품목", "재고"],
      ["IQC 대기", iqc.filter((r) => !r.judge || r.judge === "검사중").length, "건", "품질"],
      ["Hold LOT", allLots.filter((r) => r.status === "홀드").length || holds.filter((h) => String(h.status || "").includes("차단")).length, "LOT", "LOT"],
      ["유효기간 임박", allLots.filter((r) => r.expiryDate !== "-" && new Date(r.expiryDate) >= new Date(today) && new Date(r.expiryDate) <= soon).length, "LOT", "FEFO"],
      ["금일 Audit", todayAudit, "건", "Audit"]
    ];
  }

  function attachDashboardKpis(){
    const processGrid = document.querySelector(".qmes-dashboard-process-grid");
    if (!processGrid) return;
    let host = document.getElementById("qmes-live-integration-kpis");
    if (!host) { host = document.createElement("div"); host.id = "qmes-live-integration-kpis"; host.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:12px;"; processGrid.insertAdjacentElement("afterend", host); }
    host.innerHTML = dashboardMetrics().map(([label,value,unit,group]) => `<div style="border:1px solid #334155;border-radius:12px;background:rgba(15,23,42,.72);padding:13px 14px"><div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:.08em">${group}</div><div style="font-size:12px;font-weight:800;color:#cbd5e1;margin-top:4px">${label}</div><div style="font-size:24px;font-weight:950;color:#f8fafc;margin-top:6px">${Number(value||0).toLocaleString()} <span style="font-size:10px;color:#64748b">${unit}</span></div></div>`).join("");
  }

  const inspectionState = {
    IQC:{ initialized:false, snapshot:new Map() },
    PQC:{ initialized:false, snapshot:new Map() },
    OQC:{ initialized:false, snapshot:new Map() }
  };

  function rowKey(moduleName, row, index){
    if (moduleName === "IQC") return String(row.inNo || row.lot || index);
    return String(row.id || `${row.lot || "-"}|${row.date || row.shipDate || "-"}|${row.check || row.item || index}`);
  }

  function inspectionRows(moduleName){
    if (moduleName === "IQC") return Array.isArray(global.DB?.iqc) ? global.DB.iqc : [];
    return Array.isArray(global.DB?.insp?.[moduleName]) ? global.DB.insp[moduleName] : [];
  }

  function inspectionAction(moduleName, row){
    const judge = String(row?.judge || "검사중");
    if (moduleName === "OQC" && judge === "합격") return "SHIP_RELEASE";
    if (judge === "합격") return "PASS";
    if (judge === "불합격") return "HOLD";
    return "UPDATE";
  }

  function inspectionEntity(moduleName){
    return moduleName === "IQC" ? "MATERIAL_LOT" : moduleName === "PQC" ? "PROCESS_LOT" : "FINISHED_LOT";
  }

  function syncInspectionAudit(moduleName){
    const state = inspectionState[moduleName];
    const rows = inspectionRows(moduleName);
    const current = new Map(rows.map((row, index) => [rowKey(moduleName, row, index), clone(row)]));
    if (!state.initialized) { state.snapshot = current; state.initialized = true; return; }
    let changed = false;

    current.forEach((after, key) => {
      const before = state.snapshot.get(key);
      const entityId = after.lot || after.inNo || key;
      if (!before) {
        changed = true;
        if (typeof global.qmesRecordAudit === "function") global.qmesRecordAudit({
          module:moduleName, action:inspectionAction(moduleName, after), entityType:inspectionEntity(moduleName), entityId,
          reason:`${moduleName} 신규 등록 · ${after.judge || "검사중"}`, after,
          metadata:{ recordId:after.id || after.inNo, check:after.check || after.item, customer:after.customer, shipQty:after.shipQty }
        });
      } else if (JSON.stringify(before) !== JSON.stringify(after)) {
        changed = true;
        if (typeof global.qmesRecordChange === "function") global.qmesRecordChange({
          module:moduleName, action:inspectionAction(moduleName, after), entityType:inspectionEntity(moduleName), entityId,
          reason:`${moduleName} 결과 변경 · ${before.judge || "검사중"} → ${after.judge || "검사중"}`, before, after,
          metadata:{ recordId:after.id || after.inNo, check:after.check || after.item, customer:after.customer, shipQty:after.shipQty }
        });
      }
    });

    state.snapshot.forEach((before, key) => {
      if (!current.has(key)) {
        changed = true;
        if (typeof global.qmesRecordAudit === "function") global.qmesRecordAudit({
          module:moduleName, action:"DELETE", entityType:inspectionEntity(moduleName), entityId:before.lot || before.inNo || key,
          reason:`${moduleName} 검사 기록 삭제`, before, metadata:{ recordId:before.id || before.inNo }
        });
      }
    });

    if (changed) {
      global.dispatchEvent(new CustomEvent("qmes:data-updated", { detail:{ module:moduleName } }));
      attachDashboardKpis();
    }
    state.snapshot = current;
  }

  function attachUi(){
    const saveButtons = Array.from(document.querySelectorAll("button")).filter((button) => /실적.*저장|저장.*실적|작업.*완료|완료.*저장/.test(String(button.textContent || "").replace(/\s+/g, "")));
    saveButtons.forEach((button) => {
      if (button.dataset.qmesLotGuard === "true") return;
      button.dataset.qmesLotGuard = "true";
      button.addEventListener("click", (event) => {
        const workOrderNo = selectedWorkOrderNo();
        if (!workOrderNo) return;
        const validation = validateBeforeCompletion(workOrderNo);
        if (validation.ok) return;
        event.preventDefault(); event.stopImmediatePropagation(); showNotice(`LOT 검증 실패\n${validation.errors.join("\n")}`, "error");
      }, true);
    });

    const editButtons = Array.from(document.querySelectorAll("button")).filter((button) => /실적.*입력|수정|편집/.test(String(button.textContent || "").replace(/\s+/g, "")));
    editButtons.forEach((anchor) => {
      if (anchor.parentElement?.querySelector("[data-qmes-lot-recommend-button]")) return;
      const button = document.createElement("button");
      button.type = "button"; button.dataset.qmesLotRecommendButton = "true"; button.textContent = "추천 LOT 적용"; button.className = anchor.className; button.style.marginLeft = "8px";
      button.addEventListener("click", () => {
        const workOrderNo = selectedWorkOrderNo();
        if (!workOrderNo) return showNotice("선택된 작업지시를 찾을 수 없습니다.", "error");
        const result = applyRecommendedLots(workOrderNo);
        if (!result.ok) return showNotice(result.error || "추천 LOT 적용 실패", "error");
        showNotice(`추천 LOT 적용 완료\n${buildRecommendationMessage(workOrderNo)}`, "success");
        global.dispatchEvent(new CustomEvent("qmes:workorder-lot-applied", { detail:result }));
      });
      anchor.insertAdjacentElement("afterend", button);
    });
    attachDashboardKpis();
  }

  ensureService(() => attachUi());
  const observer = new MutationObserver(() => attachUi());
  observer.observe(document.documentElement, { childList:true, subtree:true });
  global.addEventListener("qmes:modules-ready", attachUi);
  global.addEventListener("qmes:data-updated", attachUi);
  global.addEventListener("qmes:audit-recorded", attachDashboardKpis);
  setInterval(() => {
    attachDashboardKpis();
    syncInspectionAudit("IQC");
    syncInspectionAudit("PQC");
    syncInspectionAudit("OQC");
  }, 2000);

  global.qmesGetWorkOrderLotRecommendation = getRecommendation;
  global.qmesApplyRecommendedLots = applyRecommendedLots;
  global.qmesValidateBeforeWorkOrderCompletion = validateBeforeCompletion;
  global.qmesCompleteWorkOrderSafely = completeWorkOrderSafely;
  global.qmesBuildLotRecommendationMessage = buildRecommendationMessage;
  global.qmesSyncIqcAudit = () => syncInspectionAudit("IQC");
  global.qmesSyncPqcAudit = () => syncInspectionAudit("PQC");
  global.qmesSyncOqcAudit = () => syncInspectionAudit("OQC");
})(window);
