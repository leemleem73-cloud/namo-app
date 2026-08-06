/* QMES work-order LOT bridge.
   Provides a small, safe integration surface for production.jsx without replacing it. */
(function installWorkOrderLotBridge(global){
  const ensureService = (callback) => {
    if (typeof global.qmesRecommendWorkOrderLots === "function" && typeof global.qmesValidateWorkOrderLots === "function") {
      callback?.();
      return;
    }
    const existing = document.querySelector('script[data-qmes-inventory-lot-service]');
    if (existing) {
      existing.addEventListener("load", () => callback?.(), { once:true });
      return;
    }
    const script = document.createElement("script");
    script.src = "./js/inventory-lot-service.js?v=20260806-lot3";
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
    const lines = recommendation.materials.map((row) => {
      const lots = row.recommendation.lots;
      if (!lots.length) return `${row.materialName}: 추천 가능 LOT 없음 (부족 ${row.recommendation.shortageKg.toLocaleString()}kg)`;
      return `${row.materialName}: ${lots.map((lot) => `${lot.lot} ${lot.allocateKg.toLocaleString()}kg`).join(" + ")}`;
    });
    return lines.join("\n");
  }

  ensureService();
  global.qmesGetWorkOrderLotRecommendation = getRecommendation;
  global.qmesApplyRecommendedLots = applyRecommendedLots;
  global.qmesValidateBeforeWorkOrderCompletion = validateBeforeCompletion;
  global.qmesCompleteWorkOrderSafely = completeWorkOrderSafely;
  global.qmesBuildLotRecommendationMessage = buildRecommendationMessage;
})(window);
