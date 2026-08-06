/* QMES material LOT ledger service.
   Builds remaining quantity by IQC LOT and current work-order actual usage. */
(function installMaterialLotService(global){
  const normalize = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  const quantityToKg = (value, fallbackUnit) => {
    const text = String(value ?? "").replace(/,/g, "").trim();
    const match = text.match(/^(-?\d+(?:\.\d+)?)\s*(kg|g|t)?$/i);
    if (!match) return 0;
    const amount = Number(match[1]);
    const unit = String(match[2] || fallbackUnit || "kg").toLowerCase();
    if (!Number.isFinite(amount)) return 0;
    if (unit === "g") return amount / 1000;
    if (unit === "t") return amount * 1000;
    return amount;
  };
  const lotKey = (materialName, lot) => `${normalize(materialName)}|${String(lot || "").trim().toUpperCase()}`;

  function ensureAuditService(callback){
    if (typeof global.qmesRecordLotValidation === "function") { callback?.(); return; }
    const existing = document.querySelector('script[data-qmes-audit-trail-service]');
    if (existing) { existing.addEventListener("load", () => callback?.(), { once:true }); return; }
    const script = document.createElement("script");
    script.src = "./js/audit-trail-service.js?v=20260806-audit1";
    script.dataset.qmesAuditTrailService = "true";
    script.onload = () => callback?.();
    script.onerror = () => console.warn("[QMES] Audit Trail 서비스 로드 실패");
    document.head.appendChild(script);
  }

  function buildUsageByLot(){
    const usage = new Map();
    const workOrders = global.DB?.woDocs && typeof global.DB.woDocs === "object" ? Object.entries(global.DB.woDocs) : [];
    workOrders.forEach(([workOrderNo, workOrder]) => {
      (Array.isArray(workOrder?.inputs) ? workOrder.inputs : []).forEach((input) => {
        const lot = String(input.materialLot || input.lot || "").trim();
        if (!lot || input.act == null || input.act === "") return;
        const key = lotKey(input.name, lot);
        const current = usage.get(key) || { usedKg:0, workOrders:[] };
        const usedKg = quantityToKg(input.act, input.unit || "kg");
        current.usedKg += usedKg;
        current.workOrders.push({ workOrderNo, item:workOrder.item || "-", usedKg, updatedAt:workOrder.updatedAt || "" });
        usage.set(key, current);
      });
    });
    return usage;
  }

  function buildMaterialLotLedger(materialName){
    const target = normalize(materialName);
    const usage = buildUsageByLot();
    const iqcRows = Array.isArray(global.DB?.iqc) ? global.DB.iqc : [];
    return iqcRows
      .filter((row) => normalize(row.name) === target && String(row.judge || "") === "합격")
      .map((row) => {
        const lot = String(row.lot || "").trim().toUpperCase();
        const key = lotKey(row.name, lot);
        const consumed = usage.get(key) || { usedKg:0, workOrders:[] };
        const receivedKg = quantityToKg(row.qty, "kg");
        const remainingKg = Math.max(0, Number((receivedKg - consumed.usedKg).toFixed(3)));
        const expiry = String(row.expiryDate || row.expireDate || row.validUntil || "").slice(0,10);
        const hold = typeof global.qmesActiveHold === "function" ? Boolean(global.qmesActiveHold(lot)) : false;
        return { materialName:row.name, materialCode:row.code || "-", lot, inNo:row.inNo || "-", supplier:row.supplier || "-", receivedAt:String(row.recv || row.inspectedAt || "").slice(0,10) || "-", expiryDate:expiry || "-", receivedKg, usedKg:Number(consumed.usedKg.toFixed(3)), remainingKg, workOrders:consumed.workOrders, hold, status:hold ? "홀드" : remainingKg <= 0 ? "소진" : "사용가능" };
      })
      .sort((a,b) => {
        const expiryA = a.expiryDate === "-" ? "9999-12-31" : a.expiryDate;
        const expiryB = b.expiryDate === "-" ? "9999-12-31" : b.expiryDate;
        return expiryA.localeCompare(expiryB) || a.receivedAt.localeCompare(b.receivedAt) || a.lot.localeCompare(b.lot);
      });
  }

  function recommendMaterialLots(materialName, requiredKg){
    let remainingNeed = Math.max(0, Number(requiredKg || 0));
    const selected = [];
    buildMaterialLotLedger(materialName).filter((row) => row.status === "사용가능" && row.remainingKg > 0).forEach((row) => {
      if (remainingNeed <= 0) return;
      const allocateKg = Math.min(row.remainingKg, remainingNeed);
      selected.push({ ...row, allocateKg:Number(allocateKg.toFixed(3)) });
      remainingNeed = Number((remainingNeed - allocateKg).toFixed(3));
    });
    const required = Number(requiredKg || 0);
    return { materialName, requiredKg:required, allocatedKg:Number((required - remainingNeed).toFixed(3)), shortageKg:remainingNeed, lots:selected, complete:remainingNeed <= 0 };
  }

  function recommendWorkOrderLots(workOrderNo){
    const workOrder = global.DB?.woDocs?.[workOrderNo];
    if (!workOrder) return { workOrderNo, found:false, complete:false, materials:[], shortageCount:0 };
    const materials = (Array.isArray(workOrder.inputs) ? workOrder.inputs : []).map((input, index) => {
      const requiredKg = quantityToKg(input.act ?? input.std ?? 0, input.unit || "kg");
      return { index, code:input.code || "-", materialName:input.name, requiredKg, currentLot:String(input.materialLot || input.lot || "").trim().toUpperCase(), recommendation:recommendMaterialLots(input.name, requiredKg) };
    });
    return { workOrderNo, found:true, complete:materials.every((row) => row.recommendation.complete), shortageCount:materials.filter((row) => !row.recommendation.complete).length, materials };
  }

  function validateWorkOrderLots(workOrderNo){
    const workOrder = global.DB?.woDocs?.[workOrderNo];
    const result = !workOrder ? { workOrderNo, found:false, ok:false, errors:["작업지시를 찾을 수 없습니다."], materials:[] } : (() => {
      const materials = (Array.isArray(workOrder.inputs) ? workOrder.inputs : []).map((input, index) => {
        const lot = String(input.materialLot || input.lot || "").trim().toUpperCase();
        const requiredKg = quantityToKg(input.act ?? input.std ?? 0, input.unit || "kg");
        const row = buildMaterialLotLedger(input.name).find((item) => item.lot === lot);
        let error = "";
        if (!lot) error = "LOT 미입력";
        else if (!row) error = "IQC 합격 LOT 아님";
        else if (row.status === "홀드") error = "홀드 LOT";
        else if (row.status === "소진") error = "소진 LOT";
        else if (row.remainingKg < requiredKg) error = `잔량 부족 (${row.remainingKg.toLocaleString()}kg)`;
        return { index, materialName:input.name, lot, requiredKg, ledger:row || null, ok:!error, error };
      });
      return { workOrderNo, found:true, ok:materials.every((row) => row.ok), errors:materials.filter((row) => !row.ok).map((row) => `${row.materialName}: ${row.error}`), materials };
    })();
    ensureAuditService(() => { if (typeof global.qmesRecordLotValidation === "function") global.qmesRecordLotValidation(workOrderNo, result); });
    global.dispatchEvent(new CustomEvent("qmes:lot-validation", { detail:result }));
    return result;
  }

  ensureAuditService();
  global.qmesBuildMaterialLotLedger = buildMaterialLotLedger;
  global.qmesRecommendMaterialLots = recommendMaterialLots;
  global.qmesRecommendWorkOrderLots = recommendWorkOrderLots;
  global.qmesValidateWorkOrderLots = validateWorkOrderLots;
})(window);
