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

  function buildUsageByLot(){
    const usage = new Map();
    const workOrders = global.DB?.woDocs && typeof global.DB.woDocs === "object"
      ? Object.entries(global.DB.woDocs)
      : [];
    workOrders.forEach(([workOrderNo, workOrder]) => {
      (Array.isArray(workOrder?.inputs) ? workOrder.inputs : []).forEach((input) => {
        const lot = String(input.materialLot || input.lot || "").trim();
        if (!lot || input.act == null || input.act === "") return;
        const key = lotKey(input.name, lot);
        const current = usage.get(key) || { usedKg:0, workOrders:[] };
        current.usedKg += quantityToKg(input.act, input.unit || "kg");
        current.workOrders.push({
          workOrderNo,
          item:workOrder.item || "-",
          usedKg:quantityToKg(input.act, input.unit || "kg"),
          updatedAt:workOrder.updatedAt || ""
        });
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
        return {
          materialName:row.name,
          materialCode:row.code || "-",
          lot,
          inNo:row.inNo || "-",
          supplier:row.supplier || "-",
          receivedAt:String(row.recv || row.inspectedAt || "").slice(0,10) || "-",
          expiryDate:expiry || "-",
          receivedKg,
          usedKg:Number(consumed.usedKg.toFixed(3)),
          remainingKg,
          workOrders:consumed.workOrders,
          hold,
          status:hold ? "홀드" : remainingKg <= 0 ? "소진" : "사용가능"
        };
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
    buildMaterialLotLedger(materialName)
      .filter((row) => row.status === "사용가능" && row.remainingKg > 0)
      .forEach((row) => {
        if (remainingNeed <= 0) return;
        const allocateKg = Math.min(row.remainingKg, remainingNeed);
        selected.push({ ...row, allocateKg:Number(allocateKg.toFixed(3)) });
        remainingNeed = Number((remainingNeed - allocateKg).toFixed(3));
      });
    return {
      materialName,
      requiredKg:Number(requiredKg || 0),
      allocatedKg:Number((Number(requiredKg || 0) - remainingNeed).toFixed(3)),
      shortageKg:remainingNeed,
      lots:selected,
      complete:remainingNeed <= 0
    };
  }

  global.qmesBuildMaterialLotLedger = buildMaterialLotLedger;
  global.qmesRecommendMaterialLots = recommendMaterialLots;
})(window);
