/* QMES work-order LOT auto sync
 * - 생산일자 이하의 IQC 합격 LOT만 후보로 사용
 * - 최신 합격 LOT 자동 선택
 * - 거래처 현황 LOT를 보조 후보로 사용
 * - 거래처 기본 목록도 fallback으로 사용
 * - React 재렌더링 충돌 방지를 위해 행별 순차 반영
 * - LOT 입력은 계속 수기 수정 가능
 * - BYK 원료 표시명: BYK180 (분산제)
 */
(function () {
  "use strict";

  const PASS_VALUES = new Set(["OK", "PASS", "합격", "적합"]);
  const BYK_DISPLAY_NAME = "BYK180 (분산제)";
  const DEFAULT_SUPPLIERS = [
    { company:"코오롱", material:"PAI", lot:"PAI#27-2(2)", status:"거래중" },
    { company:"푸양광명화학", material:"NMP", lot:"20251031063", status:"거래중" },
    { company:"모리로쿠케미칼즈", material:"NMP", lot:"2026011101", status:"거래중" },
    { company:"강신산업", material:"Boehmite", lot:"006-8-25", status:"거래중" },
    { company:"LG화학", material:"SBR", lot:"C3026B26A(1)", status:"거래중" },
    { company:"SOLVAY", material:"PVDF", lot:"CSE23202TA", status:"거래중" },
    { company:"금호석유화학", material:"SBS", lot:"W251016", status:"거래중" },
    { company:"유니소재", material:BYK_DISPLAY_NAME, lot:"2708935", status:"거래중" },
  ];

  let applying = false;
  let applyRequested = false;

  function getDb() {
    try {
      if (typeof DB !== "undefined" && DB) return DB;
    } catch (error) {}
    return window.DB || {};
  }

  function normalizeMaterial(value) {
    const text = String(value || "").toUpperCase().replace(/\s+/g, "");
    if (text.includes("BYK180") || text.includes("BYK-180") || text.includes("분산제")) return "BYK180";
    if (text.includes("AOH30") || text.includes("BOEHMITE")) return "BOEHMITE";
    if (text.includes("PVDF")) return "PVDF";
    if (text.includes("PAI") || text.includes("바인더(PAI)")) return "PAI";
    if (text.includes("NMP")) return "NMP";
    if (text.includes("SBR")) return "SBR";
    if (text.includes("SBS")) return "SBS";
    return text;
  }

  function standardizeBykData() {
    const db = getDb();
    let changed = false;

    if (Array.isArray(db.iqc)) {
      db.iqc = db.iqc.map((row) => {
        if (normalizeMaterial(row && row.name) !== "BYK180" || row.name === BYK_DISPLAY_NAME) return row;
        changed = true;
        return { ...row, name: BYK_DISPLAY_NAME };
      });
    }

    if (Array.isArray(db.partnerSuppliers)) {
      db.partnerSuppliers = db.partnerSuppliers.map((row) => {
        if (normalizeMaterial(row && row.material) !== "BYK180" || row.material === BYK_DISPLAY_NAME) return row;
        changed = true;
        return { ...row, material: BYK_DISPLAY_NAME };
      });
    }

    if (changed && typeof window.dbSave === "function") {
      try { window.dbSave(); } catch (error) { console.warn("BYK180 명칭 저장 실패", error); }
    }
  }

  function standardizeBykOptions(root) {
    (root || document).querySelectorAll("select option").forEach((option) => {
      if (normalizeMaterial(option.textContent) === "BYK180") option.textContent = BYK_DISPLAY_NAME;
    });
  }

  function firstValue(record, keys) {
    for (const key of keys) {
      const value = record && record[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return "";
  }

  function toDateText(value) {
    const raw = String(value || "").trim();
    const match = raw.match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);
    if (!match) return "";
    return `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(match[3]).padStart(2, "0")}`;
  }

  function isPass(record) {
    const value = firstValue(record, ["judge", "judgment", "result", "inspectionResult", "status"]);
    return PASS_VALUES.has(String(value || "").trim().toUpperCase());
  }

  function iqcRecords() {
    const db = getDb();
    const candidates = [db.iqc, db.insp && db.insp.IQC, db.iqcRecords, db.inspections && db.inspections.IQC];
    const rows = candidates.find(Array.isArray);
    return Array.isArray(rows) ? rows : [];
  }

  function supplierRecords() {
    const db = getDb();
    const saved = Array.isArray(db.partnerSuppliers) ? db.partnerSuppliers : [];
    const rawLots = Object.values(db.rawMaterialLots || {}).map((row) => ({
      company: row.supplier || row.company || "",
      material: row.material || row.name || "",
      lot: row.lot || row.lotNo || "",
      status: row.status || "거래중",
    }));
    const merged = [...saved, ...rawLots, ...DEFAULT_SUPPLIERS];
    const seen = new Set();
    return merged.filter((row) => {
      const key = `${normalizeMaterial(row.material)}|${String(row.lot || "").trim().toUpperCase()}`;
      if (!String(row.lot || "").trim() || seen.has(key)) return false;
      seen.add(key);
      return String(row.status || "거래중") !== "거래중지";
    });
  }

  function lotCandidates(materialName, productionDate) {
    const key = normalizeMaterial(materialName);
    const cutoff = toDateText(productionDate);
    const candidates = [];

    iqcRecords().forEach((record) => {
      const material = firstValue(record, ["name", "material", "materialName", "rawMaterial", "item", "product"]);
      const lot = String(firstValue(record, ["lot", "lotNo", "lotNumber", "materialLot"])).trim();
      const received = toDateText(firstValue(record, ["recv", "receiveDate", "receivedDate", "inDate", "date", "inspectionDate"]));
      if (!lot || normalizeMaterial(material) !== key || !isPass(record)) return;
      if (cutoff && received && received > cutoff) return;
      candidates.push({ lot, date: received || "0000-00-00", supplier: firstValue(record, ["supplier", "company", "vendor"]), source:"IQC" });
    });

    supplierRecords().forEach((record) => {
      if (normalizeMaterial(record.material) !== key) return;
      const lot = String(record.lot || "").trim();
      if (lot && !candidates.some((item) => item.lot === lot)) {
        candidates.push({ lot, date: "0000-00-00", supplier: record.company || "", source:"거래처 현황" });
      }
    });

    candidates.sort((a, b) => {
      if (a.source !== b.source) return a.source === "IQC" ? -1 : 1;
      return b.date.localeCompare(a.date);
    });
    return candidates.filter((item, index, all) => all.findIndex((x) => x.lot === item.lot) === index);
  }

  function setReactInputValue(input, value) {
    if (!input || input.value === value) return false;
    const lastValue = input.value;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, value);
    const tracker = input._valueTracker;
    if (tracker) tracker.setValue(lastValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function productionDate(root) {
    const dates = Array.from((root || document).querySelectorAll('.qmes-wo-form-field input[type="date"]'));
    return dates.find((input) => input.value)?.value || "";
  }

  function materialRows(root) {
    return Array.from((root || document).querySelectorAll("table.qmes-material-table tbody tr"));
  }

  function prepareRow(row, prodDate) {
    if (!row) return null;
    const materialSelect = row.querySelector("td:nth-child(2) select");
    const lotInput = row.querySelector('td:nth-child(3) input[placeholder="원재료 LOT"]');
    if (!materialSelect || !lotInput) return null;

    const materialName = materialSelect.value || materialSelect.options[materialSelect.selectedIndex]?.textContent || "";
    const options = lotCandidates(materialName, prodDate);
    const listId = `qmes-lot-${normalizeMaterial(materialName)}-${row.rowIndex || 0}`;
    let datalist = row.querySelector(`datalist[data-qmes-lot-list="${normalizeMaterial(materialName)}"]`);
    if (!datalist) {
      datalist = document.createElement("datalist");
      datalist.dataset.qmesLotList = normalizeMaterial(materialName);
      lotInput.insertAdjacentElement("afterend", datalist);
    }
    datalist.id = listId;
    datalist.innerHTML = options.map((item) => `<option value="${String(item.lot).replace(/"/g, "&quot;")}">${item.source}${item.date !== "0000-00-00" ? ` · ${item.date}` : ""}${item.supplier ? ` · ${item.supplier}` : ""}</option>`).join("");
    lotInput.setAttribute("list", listId);
    lotInput.title = options.length ? `사용 가능 LOT ${options.length}건 · IQC 우선 · 직접 입력 가능` : "사용 가능 LOT 없음 · 직접 입력 가능";
    return { lotInput, options };
  }

  async function applyAll(overwriteBlankOnly) {
    if (applying) {
      applyRequested = true;
      return;
    }
    const shell = document.querySelector(".qmes-wo-issue-shell");
    if (!shell) return;
    const date = productionDate(shell);
    if (!date) return;

    applying = true;
    try {
      const rowCount = materialRows(shell).length;
      for (let index = 0; index < rowCount; index += 1) {
        const currentShell = document.querySelector(".qmes-wo-issue-shell");
        if (!currentShell) break;
        const currentRows = materialRows(currentShell);
        const prepared = prepareRow(currentRows[index], productionDate(currentShell));
        if (!prepared || !prepared.options.length) continue;
        if (overwriteBlankOnly && String(prepared.lotInput.value || "").trim()) continue;
        const changed = setReactInputValue(prepared.lotInput, prepared.options[0].lot);
        if (changed) await new Promise((resolve) => window.setTimeout(resolve, 90));
      }
    } finally {
      applying = false;
      if (applyRequested) {
        applyRequested = false;
        window.setTimeout(() => applyAll(true), 120);
      }
    }
  }

  document.addEventListener("change", function (event) {
    const shell = event.target.closest && event.target.closest(".qmes-wo-issue-shell");
    if (!shell) return;
    if (event.target.matches('input[type="date"]')) {
      window.setTimeout(() => applyAll(false), 60);
      return;
    }
    if (event.target.matches("table.qmes-material-table tbody td:nth-child(2) select")) {
      window.setTimeout(() => applyAll(false), 60);
    }
  });

  standardizeBykData();
  standardizeBykOptions(document);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) standardizeBykOptions(node);
    }));
    window.setTimeout(() => applyAll(true), 120);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setInterval(() => applyAll(true), 1500);
})();
