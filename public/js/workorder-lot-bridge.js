/* QMES work-order LOT bridge.
   Provides a small, safe integration surface for production.jsx without replacing it. */
(function installWorkOrderLotBridge(global){
  const ensureService = (callback) => {
    if (typeof global.qmesRecommendWorkOrderLots === "function" && typeof global.qmesValidateWorkOrderLots === "function") {
      callback?.();
      return;
    }
    const existing = document.querySelector('script[data-qmes-inventory-lot-service],script[data-qmes-module="inventory-lot"]');
    if (existing) {
      existing.addEventListener("load", () => callback?.(), { once:true });
      return;
    }
    const script = document.createElement("script");
    script.src = "./js/inventory-lot-service.js?v=20260806-lot5";
    script.dataset.qmesInventoryLotService = "true";
    script.onload = () => callback?.();
    script.onerror = () => console.warn("[QMES] LOT 서비스 로드 실패");
    document.head.appendChild(script);
  };

  const saveDb = () => {
    if (typeof global.dbSave === "function") global.dbSave();
    global.dispatchEvent(new CustomEvent("qmes:data-updated", { detail:{ module:"PRODUCTION" } }));
  };

  function getRecommendation(workOrderNo){
    if (typeof global.qmesRecommendWorkOrderLots !== "function") {
      return { workOrderNo, found:false, complete:false, shortageCount:0, materials:[], pendingService:true };
    }
    return global.qmesRecommendWorkOrderLots(workOrderNo);
  }

  function applyRecommendedLots(workOrderNo, options){
    const workOrder = global.DB?.woDocs?.[workOrderNo];
    if (!workOrder) return { ok:false, error:"작업지시를 찾을 수 없습니다." };
    const recommendation = getRecommendation(workOrderNo);
    if (!recommendation.found) return { ok:false, error:"LOT 추천 결과를 만들 수 없습니다." };
    if (!recommendation.complete && !options?.allowPartial) {
      return { ok:false, error:"가용 LOT가 부족한 원료가 있습니다.", recommendation };
    }

    const before = JSON.parse(JSON.stringify(workOrder));
    const nextInputs = (Array.isArray(workOrder.inputs) ? workOrder.inputs : []).map((input, index) => {
      const row = recommendation.materials.find((item) => item.index === index);
      const firstLot = row?.recommendation?.lots?.[0];
      if (!firstLot) return input;
      return {
        ...input,
        lot:firstLot.lot,
        materialLot:firstLot.lot,
        availableQty:firstLot.remainingKg,
        recommendedLot:true,
        recommendedAt:new Date().toISOString()
      };
    });

    global.DB.woDocs[workOrderNo] = { ...workOrder, inputs:nextInputs, updatedAt:new Date().toISOString() };
    if (typeof global.qmesRecordChange === "function") {
      global.qmesRecordChange({
        module:"PRODUCTION",
        action:"AUTO_ASSIGN_LOT",
        entityType:"WORK_ORDER",
        entityId:workOrderNo,
        reason:"FEFO/FIFO 추천 LOT 자동 반영",
        before,
        after:global.DB.woDocs[workOrderNo]
      });
    }
    saveDb();
    return { ok:true, recommendation, workOrder:global.DB.woDocs[workOrderNo] };
  }

  function validateBeforeCompletion(workOrderNo){
    if (typeof global.qmesValidateWorkOrderLots !== "function") {
      return { workOrderNo, found:false, ok:false, errors:["LOT 검증 서비스를 불러오는 중입니다."], materials:[] };
    }
    return global.qmesValidateWorkOrderLots(workOrderNo);
  }

  function completeWorkOrderSafely(workOrderNo, completeCallback){
    const validation = validateBeforeCompletion(workOrderNo);
    if (!validation.ok) {
      global.dispatchEvent(new CustomEvent("qmes:workorder-completion-blocked", { detail:validation }));
      return { ok:false, blocked:true, validation };
    }
    const result = typeof completeCallback === "function" ? completeCallback(validation) : true;
    global.dispatchEvent(new CustomEvent("qmes:workorder-completed", { detail:{ workOrderNo, validation } }));
    return { ok:true, blocked:false, validation, result };
  }

  function buildRecommendationMessage(workOrderNo){
    const recommendation = getRecommendation(workOrderNo);
    if (!recommendation.found) return "작업지시를 찾을 수 없습니다.";
    return recommendation.materials.map((row) => {
      const lots = row.recommendation.lots;
      if (!lots.length) return `${row.materialName}: 추천 가능 LOT 없음 (부족 ${row.recommendation.shortageKg.toLocaleString()}kg)`;
      return `${row.materialName}: ${lots.map((lot) => `${lot.lot} ${lot.allocateKg.toLocaleString()}kg`).join(" + ")}`;
    }).join("\n");
  }

  function selectedWorkOrderNo(){
    const candidate = Array.from(document.querySelectorAll("button,td,span,div"))
      .find((node) => /^([A-Z]{2,5}-)?\d{6,}[-A-Z0-9]*$/i.test(String(node.textContent || "").trim()) && global.DB?.woDocs?.[String(node.textContent || "").trim()]);
    if (candidate) return String(candidate.textContent || "").trim();
    const visible = Object.keys(global.DB?.woDocs || {}).find((id) => document.body.innerText.includes(id));
    return visible || Object.keys(global.DB?.woDocs || {})[0] || "";
  }

  function showNotice(message, tone){
    let box = document.getElementById("qmes-workorder-lot-notice");
    if (!box) {
      box = document.createElement("div");
      box.id = "qmes-workorder-lot-notice";
      box.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:20000;max-width:520px;white-space:pre-line;padding:14px 16px;border-radius:12px;font:700 12px/1.55 Pretendard,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.45);";
      document.body.appendChild(box);
    }
    box.style.background = tone === "error" ? "#3f1720" : tone === "success" ? "#12382d" : "#132b45";
    box.style.border = tone === "error" ? "1px solid #fb7185" : tone === "success" ? "1px solid #34d399" : "1px solid #38bdf8";
    box.style.color = "#f8fafc";
    box.textContent = message;
    box.hidden = false;
    clearTimeout(box.__timer);
    box.__timer = setTimeout(() => { box.hidden = true; }, 7000);
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
        event.preventDefault();
        event.stopImmediatePropagation();
        showNotice(`LOT 검증 실패\n${validation.errors.join("\n")}`, "error");
      }, true);
    });

    const editButtons = Array.from(document.querySelectorAll("button")).filter((button) => /실적.*입력|수정|편집/.test(String(button.textContent || "").replace(/\s+/g, "")));
    editButtons.forEach((anchor) => {
      if (anchor.parentElement?.querySelector("[data-qmes-lot-recommend-button]")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.qmesLotRecommendButton = "true";
      button.textContent = "추천 LOT 적용";
      button.className = anchor.className;
      button.style.marginLeft = "8px";
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
  }

  ensureService(() => attachUi());
  const observer = new MutationObserver(() => attachUi());
  observer.observe(document.documentElement, { childList:true, subtree:true });
  global.addEventListener("qmes:modules-ready", attachUi);
  global.addEventListener("qmes:data-updated", attachUi);

  global.qmesGetWorkOrderLotRecommendation = getRecommendation;
  global.qmesApplyRecommendedLots = applyRecommendedLots;
  global.qmesValidateBeforeWorkOrderCompletion = validateBeforeCompletion;
  global.qmesCompleteWorkOrderSafely = completeWorkOrderSafely;
  global.qmesBuildLotRecommendationMessage = buildRecommendationMessage;
})(window);
